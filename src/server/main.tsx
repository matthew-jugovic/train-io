/* eslint-disable react-hooks/rules-of-hooks */
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import * as dotenvx from "@dotenvx/dotenvx"
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { ChatLog, KeyValuePair } from './database/Schema.ts'
import { eq, sql } from 'drizzle-orm'
import { createNodeWebSocket } from '@hono/node-ws'
import { randomUUID, type UUID } from 'crypto'
import type { WSContext } from 'hono/ws'
import type { DataObject } from '../client_server_share/Interfaces.tsx'
import { randomBytes } from 'crypto';

// Generate a random token
function generateRandomToken(): string {
  return randomBytes(32).toString('hex');
}
const LOCAL_WEBSERVER_PORT = 5172

dotenvx.config({ path: "./.env.local" })

interface DiscordToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar?: string | null;
  global_name?: string | null;
  mfa_enabled: boolean;
  email?: string | null;
  // Add other fields as needed
}

interface PlayerData {
  session_token: string;
  last_update: Date;
  discord_obj?: DiscordUser;
}

const db_client = postgres(
  process.env.POSTGRES_URL!,
  {
    prepare: false
  }
)

const db = drizzle(db_client)

const visit_count_result = await db
  .select()
  .from(KeyValuePair)
  .where(eq(KeyValuePair.key, "visit_count"));
if (visit_count_result.length === 0) {
  await db.insert(KeyValuePair).values({
    key: "visit_count",
    value: "0",
  });
}

const ServerApp = new Hono()
const connected_ws_clients = new Map<WSContext<WebSocket>, string>()
const stored_sessions = new Map<string, PlayerData>()


const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({
  app: ServerApp,
});

ServerApp.use("*", cors())
  .get("/visit", async (c) => {
    const result = await db
      .select()
      .from(KeyValuePair)
      .where(eq(KeyValuePair.key, "visit_count"));
    const visit_count = result.length > 0 ? parseInt(result[0].value) : 0;
    return c.json({ visit_count });
  })
  .post("/visit", async (c) => {
    const result = await db
      .update(KeyValuePair)
      .set({
        value: sql`CAST(COALESCE(${KeyValuePair.value}, '0') AS INTEGER) + 1`,
      })
      .where(eq(KeyValuePair.key, "visit_count"))
      .returning({ value: KeyValuePair.value });

    const visit_count = parseInt(result[0].value);
    return c.json({ visit_count });
  })
  .get("/public_chat_log", async (c) => {
    // Get up to the last 5 messages from the chat log
    console.log("Fetching public chat log");
    const chatLog = await db
      .select()
      .from(ChatLog)
      .where(eq(ChatLog.is_deleted, false))
      .orderBy(sql`${ChatLog.timestamp} DESC`)
      .limit(5);
    return c.json(chatLog.reverse()); // Reverse to show the oldest messages first
  })
  .post("/auth/discord/login", async (c) => {
    // Get code from JSON body
    const data = await c.req.json();
    const gotCode = data.auth as string;
    console.log(`Got code ${gotCode}.`);

    const params = new URLSearchParams({
      client_id: process.env.DISCORD_APPLICATION_ID || "",
      client_secret: process.env.DISCORD_SECRET || "",
      grant_type: "authorization_code",
      code: gotCode,
      redirect_uri: process.env.DISCORD_REDIRECT_URI!,
    });

    const discordResponse = await fetch(
      "https://discord.com/api/oauth2/token",
      {
        method: "POST",
        body: params.toString(),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (!discordResponse.ok) {
      console.log(await discordResponse.json());
      return c.notFound();
    }

    const tokenData = await discordResponse.json() as DiscordToken
    const discordAccessToken = tokenData.access_token as string

    console.log(tokenData)


    const discordUser = await (
      await fetch("https://discord.com/api/v10/users/@me",
        { headers: { "Authorization": `Bearer ${discordAccessToken}` } })
    ).json() as DiscordUser

    console.log(discordUser)

    // Create a new session token
    const newSessionToken = generateRandomToken()
    const newPlayerData: PlayerData = {
      session_token: newSessionToken,
      last_update: new Date(),
      discord_obj: discordUser,
    }
    stored_sessions.set(newSessionToken, newPlayerData)
    console.log(`Created new session for user ${discordUser.username} with token ${newSessionToken}`)
    // Return the discord username and session token to the client



    return c.json({ username: discordUser.username, session_token: newSessionToken } as { username: string; session_token: string } );
  })



  .get(
    "/ws",
    upgradeWebSocket(() => {


      return {
        onOpen: (evt, ws) => {
          console.log("WebSocket connection opened.")

        },
        onClose: (evt, ws) => {
          connected_ws_clients.delete(ws)
          console.log(`WebSocket connection closed. Total clients: ${connected_ws_clients.size}`)
          broadcast({
            type: "update_player_count",
            data: { newCount: connected_ws_clients.size }
          })

        },
        onMessage: (evt, ws) => {
          const data = JSON.parse(evt.data.toString())

          // Check if the player is authenticated via discord
          const sessionToken = connected_ws_clients.get(ws)
          let playerData: PlayerData | undefined = undefined
          if (sessionToken) {
            playerData = stored_sessions.get(sessionToken)
          }

          if (data.type === "public_message") {
            const publicMessageObject: DataObject = {
              type: "public_message",
              data: {
                username: data.data.username,
                message: data.data.message,
                discord: playerData?.discord_obj ? true : false 
              }

            }

            publicMessageObject.data.username = publicMessageObject.data.username.trim().slice(0, 20)
            publicMessageObject.data.message = publicMessageObject.data.message.trim().slice(0, 140)

            if (publicMessageObject.data.username.trim() === "") {
              publicMessageObject.data.username = "Anonymous";
            }

            db.insert(ChatLog)
              .values({
                username: publicMessageObject.data.username,
                message: publicMessageObject.data.message,
                is_deleted: false,
                discord_id: playerData?.discord_obj ? parseInt(playerData.discord_obj.id) : null,
              })
              .catch((err) => {
                console.error("Error inserting chat log:", err);
              });

            broadcast(publicMessageObject)
          } else if (data.type === "ping") {
            // Echo back to allow client to measure RTT
            const pongObject: DataObject = {
              type: "pong",
              data: { t0: data.data.t0 }
            }
            ws.send(JSON.stringify(pongObject))
          } else if (data.type === "discord_auth") {
            console.log(`Received discord reset token: ${data.data.token}`)
            const playerData = connected_ws_clients.get(ws)
            



          } else if (data.type === "heartbeat") {
            const sessionToken = connected_ws_clients.get(ws)
            if (sessionToken) {
              const playerData = stored_sessions.get(sessionToken)
              if (playerData) {
                playerData.last_update = new Date()
                stored_sessions.set(sessionToken, playerData)
              }
              
            }
          } else if (data.type === "session_auth") {
            const session_token = data.data.session_token as string
            console.log(`Received session token: ${session_token}`)
            const newToken = generateRandomToken()

            if (stored_sessions.has(session_token)) {
              const playerData = stored_sessions.get(session_token)!
              playerData.session_token = newToken
              playerData.last_update = new Date()
              stored_sessions.delete(session_token)
              stored_sessions.set(newToken, playerData)
              connected_ws_clients.set(ws, newToken)
              console.log(`Session token valid. Associated with user ${playerData.discord_obj?.username || "Unknown"}.`)

            } else {
              
              const newPlayerData: PlayerData = {
                session_token: newToken,
                last_update: new Date(),
              }
              connected_ws_clients.set(ws, newToken)
              stored_sessions.set(newToken, newPlayerData)
              console.log(`Session token invalid. Generated new token ${newToken}.`)

              const sessionObject = {
                type: "session_auth",
                data: { session_token: newToken }
              } as DataObject
              ws.send(JSON.stringify(sessionObject))
            }

            broadcast({
              type: "update_player_count",
              data: { newCount: connected_ws_clients.size }
            })
            console.log(`Total connected clients: ${connected_ws_clients.size}`)

          }
        }
      }
    })
  );

const server = serve({
  fetch: ServerApp.fetch,
  port: LOCAL_WEBSERVER_PORT,
});
injectWebSocket(server);

server.on("listening", () => {
  const address = server.address();
  const port = typeof address === "string" ? address : address?.port;
  console.log(
    `Server is running at ${typeof address === "string" ? address : address?.address
    }:${port}`
  );
});

// server loop
setInterval(() => {
  const now = new Date()
  connected_ws_clients.forEach((sessionToken, ws) => {
    const playerData = stored_sessions.get(sessionToken);
    if (ws.readyState === WebSocket.OPEN) {
      const data_object: DataObject = { type: "heartbeat" }
      ws.send(JSON.stringify(data_object))

      // Did the client respond in the last 10 seconds?
      if (playerData && now.getTime() - playerData.last_update.getTime() > 10000) {
        ws.close()
        console.log(`Client ${sessionToken} timed out.`)
      }
    }
  })
}, 3000)

// Broadcast object to all connected clients
function broadcast(data: DataObject) {
  connected_ws_clients.forEach((sessionToken, ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
    void sessionToken

  });
}

// graceful shutdown
process.on('SIGINT', async () => {
  console.log("Server shut down.")
  server.close()
  await db_client.end().then(() => {
    console.log("Database connection closed.")
  }).catch(err => {
    console.error("Error closing database connection:", err)
  })
  process.exit(0)
})