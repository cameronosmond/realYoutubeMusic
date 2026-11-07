import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchWriteCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });
const ddb = DynamoDBDocumentClient.from(client);

// helper function to split array into chunks of 25 for DDB BatchWriteItem
const chunkArray = (arr, size) => {
    return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
        arr.slice(i * size, i * size + size)
    );
};

export const handler = async (event) => {
    const TABLE_NAME = process.env.TABLE_NAME;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const { userId, refreshToken } = event;

    if (!userId || !refreshToken) {
        console.error("Missing userId or refreshToken in event payload.");
        return; 
    }

    try {
        // exchange refresh token for a fresh access token
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken,
                grant_type: "refresh_token",
            }),
        });
        const tokenJson = await tokenRes.json();
        
        if (!tokenRes.ok) {
            throw new Error(`Failed to fetch access token: ${tokenJson.error_description || tokenJson.error}`);
        }
        const access_token = tokenJson.access_token;

        // fetch user's playlists
        const playlistRes = await fetch("https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&maxResults=50", {
            headers: { Authorization: `Bearer ${access_token}` },
        });
        const playlistJson = await playlistRes.json();

        if (!playlistRes.ok) {
            throw new Error(`Failed to fetch playlists: ${playlistJson.error?.message}`);
        }
        const playlists = playlistJson.items || [];

        // map through all playlists and paginate through all songs
        const allResults = await Promise.all(
            playlists.map(async (playlist) => {
                let mapResult = [];
                const playlistId = playlist.id;
                let nextPageToken = undefined;

                do {
                    const itemsRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?` +
                        new URLSearchParams({
                            part: "snippet",
                            playlistId: playlistId,
                            maxResults: "50",
                            pageToken: nextPageToken || "",
                            access_token: access_token,
                        })
                    );
                
                    const data = await itemsRes.json();
                    if (!itemsRes.ok) {
                        console.error(`Error fetching playlist ${playlistId}:`, data.error?.message);
                        break; // skip rest of this playlist but keep others going
                    }

                    const dataItems = data.items || [];
                    
                    // extract all relevant track data
                    mapResult.push(...dataItems.reduce((acc, item) => {
                        // skip deleted videos or private videos that lack a title
                        if (item.snippet.title && item.snippet.title !== "Private video" && item.snippet.title !== "Deleted video") {
                            acc.push({
                                youtubeId: item.snippet.resourceId.videoId,
                                title: item.snippet.title,
                                artist: item.snippet.videoOwnerChannelTitle || "Unknown Artist", 
                                playlistTitle: playlist.snippet.title,
                                thumbnailUrl: item.snippet.thumbnails?.default?.url || ""
                            });
                        }
                        return acc;
                    }, []));
                
                    nextPageToken = data.nextPageToken;
                } while (nextPageToken);

                return mapResult;
            })
        );

        // flatten the array of arrays into one massive list of tracks
        const allTracks = allResults.flat();
        
        // TTL is 7 days from now in seconds
        const expiresAt = Math.floor((Date.now() / 1000) + (7 * 24 * 60 * 60));

        // batch write to DDB
        const chunks = chunkArray(allTracks, 25); // DDB max is 25 items per batch
        
        for (const chunk of chunks) {
            const putRequests = chunk.map(track => ({
                PutRequest: {
                    Item: {
                        user_id: userId,
                        sk: `track#${track.youtubeId}`,
                        youtubeId: track.youtubeId,
                        title: track.title,
                        artist: track.artist,
                        playlistTitle: track.playlistTitle,
                        thumbnailUrl: track.thumbnailUrl,
                        expiresAt: expiresAt
                    }
                }
            }));

            await ddb.send(new BatchWriteCommand({
                RequestItems: {
                    [TABLE_NAME]: putRequests
                }
            }));

            // pause for 75ms between batches to prevent WCU throttling
            await new Promise(resolve => setTimeout(resolve, 75));
        }

        // set sync as complete
        await ddb.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                user_id: userId,
                sk: "meta",
                syncStatus: "COMPLETE",
                lastSyncedAt: new Date().toISOString(),
                refresh_token: refreshToken
            }
        }));

        console.log(`Successfully synced ${allTracks.length} tracks for user ${userId}.`);
        return { statusCode: 200 };
    } catch (error) {
        console.error("Sync Lambda Error:", error);
        
        // revert syncStatus to complete so the user isn't permanently locked out of searching if a crash happens
        try {
            await ddb.send(new PutCommand({
                TableName: process.env.TABLE_NAME,
                Item: {
                    user_id: userId,
                    sk: "meta",
                    syncStatus: "COMPLETE",
                    refresh_token: refreshToken
                    // intentionally omitting lastSyncedAt so it triggers a retry on their next login
                }
            }));
        } catch (dbError) {
            console.error("Failed to unlock sync status:", dbError);
        }

        throw error;
    }
};