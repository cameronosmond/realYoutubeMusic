import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { jwtDecode } from 'jwt-decode';

const client = new DynamoDBClient({ region: "us-east-1" });
const ddb = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
    try {
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const clientId = process.env.GOOGLE_CLIENT_ID;

        if (!event.body) {
            return {
              statusCode: 400,
              body: JSON.stringify({ error: "Missing body" }),
            };
        }
          
        const body = JSON.parse(event.body);
        const { artistName, encoded } = body;

        const decoded = jwtDecode(encoded); // decoding id_token to get sub key
        const userId = decoded.sub; // unique id per user to store for accessing their refresh token in db

        if (event.headers['x-requested-with'] !== 'XMLHttpRequest') {
            return {
              statusCode: 400,
              body: JSON.stringify('Invalid request'),
            }
        }

        // get refresh token associated with userId from db
        const getResult = await ddb.send(
            new GetCommand({
                TableName: "ytMusicAppUsers",
                Key: { user_id: userId },
            })
        );

        const refreshToken = getResult.Item?.refresh_token;
        if (!refreshToken) throw new Error("No refresh token found");

        // exchange refresh token for access token
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
        const { access_token } = await tokenRes.json();

        // fetch users playlists
        const playlistRes = await fetch("https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&maxResults=25", {
            headers: { Authorization: `Bearer ${access_token}` },
        });
        const playlists = (await playlistRes.json()).items;

        // map through playlists array, replacing each array with array of valid songs from that playlist
        const allResults = await Promise.all(
            playlists.map(async (playlist) => {
                let mapResult = [];
                const playlistId = playlist.id;

            
                // pagination to get all songs in a playlist via pageToken and nextPageToken since maxResults can only be 0-50
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
                    const dataItems = data.items;
                    // only adding song to acc if song title or channel name contains the artist name, pushing onto result array 
                    mapResult.push(...dataItems.reduce((acc, item) => {
                        const titleLower = item.snippet.title?.toLowerCase() || "";
                        const channelNameLower = item.snippet.videoOwnerChannelTitle?.toLowerCase() || "";

                        if (titleLower.includes(artistName) || channelNameLower.includes(artistName)) {
                            acc.push({
                                title: item.snippet.title || "No Title", 
                                playlistTitle: playlist.snippet.title,
                            });
                        } 
                        return acc;
                    }, []));
                
                    nextPageToken = data.nextPageToken;
                } while (nextPageToken);

                return mapResult;
        }));

        const result = allResults.flat(); // flatten the array of arrays
        return {
            statusCode: 200,
            body: JSON.stringify({ result })
        };
    } catch (error) {
        console.error("Error: ", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || "Internal server error" }),
        };
    }
};