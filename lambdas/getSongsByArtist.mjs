import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });
const ddb = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
    try {
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

        

    } catch (error) {
        console.error("Error: ", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || "Internal server error" }),
        };
    }
  };