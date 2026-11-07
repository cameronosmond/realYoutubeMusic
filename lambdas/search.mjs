import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { OAuth2Client } from "google-auth-library";

const dbClient = new DynamoDBClient({ region: "us-east-1" });
const docClient = DynamoDBDocumentClient.from(dbClient);
const oauthClient = new OAuth2Client();

export const handler = async (event) => {
    try {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const TABLE_NAME = process.env.TABLE_NAME;

        if (!event.body) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Missing body" }),
            };
        }

        if (event.headers['x-requested-with'] !== 'XMLHttpRequest') {
            return {
                statusCode: 400,
                body: JSON.stringify('Invalid request'),
            };
        }
          
        const body = JSON.parse(event.body);
        const { artistName, encoded } = body;

        if (!artistName || !encoded) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Missing artistName or encoded token" }),
            };
        }

        // verifying encoded token is from google and decoding
        const ticket = await oauthClient.verifyIdToken({
            idToken: encoded, 
            audience: clientId,
        });
        
        const payload = ticket.getPayload();
        if (!payload?.sub) throw new Error("Invalid token");
        const userId = payload.sub; // unique id per user

        const searchTerm = artistName.toLowerCase();

        // check the Sync Status in DynamoDB
        const metaResponse = await docClient.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: {
                user_id: userId,
                sk: "meta"
            }
        }));

        const meta = metaResponse.Item;

        // if no meta record exists or it's currently syncing, tell frontend to poll
        if (!meta || meta.syncStatus === "IN_PROGRESS") {
            return { 
                statusCode: 202, 
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: "Library is syncing, please poll again." }) 
            };
        }

        // paginate through the user's entire track library
        let allTracks = [];
        let lastEvaluatedKey = undefined;

        do {
            const queryResponse = await docClient.send(new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: "user_id = :uid AND begins_with(sk, :prefix)",
                ExpressionAttributeValues: {
                    ":uid": userId,
                    ":prefix": "track#"
                },
                ExclusiveStartKey: lastEvaluatedKey
            }));

            if (queryResponse.Items) {
                allTracks.push(...queryResponse.Items);
            }
            
            lastEvaluatedKey = queryResponse.LastEvaluatedKey;
        } while (lastEvaluatedKey); 

        // filter the library in memory based on the artistName
        const cleanResults = allTracks.reduce((acc, song) => {
            const titleLower = song.title?.toLowerCase() || "";
            const channelNameLower = song.artist?.toLowerCase() || ""; 

            if (titleLower.includes(searchTerm) || channelNameLower.includes(searchTerm)) {
                acc.push({
                    title: song.title || "No Title",
                    playlistTitle: song.playlistTitle || "Unknown Playlist", 
                    youtubeId: song.youtubeId,
                    thumbnailUrl: song.thumbnailUrl
                });
            } 
            return acc;
        }, []);

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cleanResults)
        };

    } catch (error) {
        console.error("Search error:", error);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: "Internal Server Error or Invalid Token" }) 
        };
    }
};