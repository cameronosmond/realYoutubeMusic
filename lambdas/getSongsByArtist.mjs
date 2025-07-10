import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

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
        const { artistName, userId } = body;

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

        let result = [];
        // loop through playlists, for each playlist get all songs
        for (const playlist of playlists) {
            const playlistId = playlist.id;

            const itemsRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}`, {
                headers: { Authorization: `Bearer ${access_token}` },
            });
            const items = (await itemsRes.json()).items;

            // loop through songs in this playlist and only add them to result if title or channel name contains the artist name
            for (const song in items) {
                const title = song.snippet.title.toLowerCase();
                const channelName = song.snippet.videoOwnerChannelTitle.toLowerCase();

                if (title.includes(artistName) || channelName.includes(artistName)) {
                    result.push({
                        title: title, 
                        channelName: channelName,
                        playlistTitle: playlist.snippet.title,
                    });
                }
            }
        }

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