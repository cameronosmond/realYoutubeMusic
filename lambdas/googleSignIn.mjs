import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, GetCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
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
    const code = body.code;

    if (event.headers['x-requested-with'] !== 'XMLHttpRequest') {
      return {
        statusCode: 400,
        body: JSON.stringify('Invalid request'),
      }
    }

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: "postmessage", // popup mode automatically requires this 
        grant_type: "authorization_code", 
      }).toString(), // need for sending body as string rather than object
    });

    if (!res.ok) {
      const errorText = await res.text();
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to fetch tokens", details: errorText }),
      };
    }

    const tokens = await res.json();

    const decoded = jwtDecode(tokens.id_token); // decoding id_token to get sub key
    const userId = decoded.sub; // unique id per user to store for accessing their refresh token in db

    try {
      // query DynamoDB to check if the user already exists
      const getResult = await ddb.send(
        new GetCommand({
          TableName: "ytMusicAppUsers",
          Key: { user_id: userId },
        })
      );

      // if user does not exist (first time logging in) and no refresh token provided
      if (!getResult.Item && !tokens.refresh_token) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "No refresh token received for new user" }),
        };
      }

      // if user exists and no refresh token provided, use the existing refresh token
      if (getResult.Item && !tokens.refresh_token) {
        tokens.refresh_token = getResult.Item.refresh_token;
      }

      // insert user into db/update refresh token for existing user
      await ddb.send(
        new PutCommand({
          TableName: "ytMusicAppUsers",
          Item: {
            user_id: userId,
            refresh_token: tokens.refresh_token,
          },
        })
      );
      
      return {
        statusCode: 200,
        body: JSON.stringify({ userId }),
      };
    } catch (err) {
      console.error("DynamoDB error:", err);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to save user" }),
      };
    }
  } catch (error) {
    console.error("Full error JSON:", JSON.stringify(error, null, 2));
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "Internal server error" }),
    };
  }
  
};