import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, GetCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { OAuth2Client } from 'google-auth-library';

const dbClient = new DynamoDBClient({ region: "us-east-1" });
const ddb = DynamoDBDocumentClient.from(dbClient);
const lambdaClient = new LambdaClient({ region: "us-east-1" });
const oauthClient = new OAuth2Client();

export const handler = async (event) => {
  try {
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const TABLE_NAME = process.env.TABLE_NAME;

    if (!event.body) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing body" }) };
    }
    
    const body = JSON.parse(event.body);
    const code = body.code;

    if (event.headers['x-requested-with'] !== 'XMLHttpRequest') {
      return { statusCode: 400, body: JSON.stringify('Invalid request') };
    }

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: "postmessage", 
        grant_type: "authorization_code", 
      }).toString(),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { statusCode: 500, body: JSON.stringify({ error: "Failed to fetch tokens", details: errorText }) };
    }

    const tokens = await res.json();
    const encoded = tokens.id_token;

    // verify token and get userId
    const ticket = await oauthClient.verifyIdToken({
        idToken: encoded, 
        audience: clientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub) throw new Error("Invalid token");
    const userId = payload.sub; 

    const getResult = await ddb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { user_id: userId, sk: "meta" },
      })
    );
    
    const metaItem = getResult.Item;
    let refreshToken = tokens.refresh_token;

    if (!metaItem && !refreshToken) {
      return { statusCode: 400, body: JSON.stringify({ error: "No refresh token received for new user" }) };
    }
    if (metaItem && !refreshToken) {
      refreshToken = metaItem.refresh_token;
    }

    // need to sync if missing lastSyncedAt or older than 24 hours
    let needsSync = true;
    if (metaItem?.lastSyncedAt) {
        const lastSyncTime = new Date(metaItem.lastSyncedAt).getTime();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        if (Date.now() - lastSyncTime < twentyFourHours) {
            needsSync = false;
        }
    }

    const currentStatus = needsSync ? "IN_PROGRESS" : (metaItem?.syncStatus || "COMPLETE");

    // Save user meta record with the updated status and refresh token
    await ddb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          user_id: userId,
          sk: "meta",
          refresh_token: refreshToken,
          syncStatus: currentStatus,
          lastSyncedAt: metaItem?.lastSyncedAt // keep existing, sync lambda will update this when it finishes
        },
      })
    );

    // asynchronously trigger the background sync lambda if needed
    if (needsSync) {
        const syncPayload = {
            userId: userId,
            refreshToken: refreshToken
        };

        await lambdaClient.send(new InvokeCommand({
            FunctionName: "getSongsByArtist",
            InvocationType: "Event", // makes it asynchronous
            Payload: new TextEncoder().encode(JSON.stringify(syncPayload))
        }));
        
        console.log(`Triggered async sync for user ${userId}`);
    }
      
    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,X-Requested-With"
      },
      body: JSON.stringify({ encoded }),
    };

  } catch (error) {
    console.error("Full error:", error);
    return {
      statusCode: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,X-Requested-With"
      },
      body: JSON.stringify({ error: error.message || "Internal server error" }),
    };
  }
};