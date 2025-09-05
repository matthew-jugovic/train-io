/* eslint-disable react-hooks/rules-of-hooks */
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import * as dotenvx from "@dotenvx/dotenvx"
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { ChatLog, KeyValuePair } from './database/Schema.ts'
import { eq, sql } from 'drizzle-orm'
import { createNodeWebSocket } from '@hono/node-ws'
import { randomUUID, type UUID } from 'crypto'
import type { WSContext } from 'hono/ws'
import type { DataObject } from '../client_server_share/Interfaces.tsx'

const LOCAL_WEBSERVER_PORT = 3000
const POSTGRES_SERVER = "localhost:4000" 


dotenvx.config({ path: "./secrets.env" })

const pool = new Pool({
    connectionString: `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${POSTGRES_SERVER}/${process.env.POSTGRES_DB}`
})

const db = drizzle(pool);

const visit_count_result = await db.select().from(KeyValuePair).where(eq(KeyValuePair.key, "visit_count"))
if (visit_count_result.length === 0) {
    await db.insert(KeyValuePair).values({
        key: "visit_count",
        value: "0"
    })
}

const ServerApp = new Hono()
const connected_ws_clients = new Map<WSContext<WebSocket>, UUID>()

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app: ServerApp })

ServerApp.use("*", cors()
).get("/visit", async (c) => {
    const result = await db.select().from(KeyValuePair).where(eq(KeyValuePair.key, "visit_count"))
    const visit_count = result.length > 0 ? parseInt(result[0].value) : 0
    return c.json({ visit_count })

}).post("/visit", async (c) => {
    const result = await db.update(KeyValuePair)
        .set({
            value: sql`CAST(COALESCE(${KeyValuePair.value}, '0') AS INTEGER) + 1`
        })
        .where(eq(KeyValuePair.key, "visit_count"))
        .returning({ value: KeyValuePair.value })

    const visit_count = parseInt(result[0].value)
    return c.json({ visit_count })

}).get("/public_chat_log", async (c) => {
    // Get up to the last 5 messages from the chat log
    console.log("Fetching public chat log")
    const chatLog = await db.select().from(ChatLog).where(eq(ChatLog.is_deleted, false)).orderBy(sql`${ChatLog.timestamp} DESC`).limit(5)
    return c.json(chatLog.reverse()) // Reverse to show the oldest messages first
})



.get(
    '/ws',
    upgradeWebSocket(() => {


        return {
            onOpen: (evt, ws) => {
                const clientID = randomUUID()
                connected_ws_clients.set(ws, clientID)

                console.log("WebSocket connection opened.")
                broadcast({
                    type: "update_player_count",
                    data: { newCount: connected_ws_clients.size }
                })
                

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
                
                if (data.type === "public_message") {
                    const publicMessageObject: DataObject = {
                        type: "public_message",
                        data: {
                            username: data.data.username,
                            message: data.data.message,
                        }
                        
                    }

                    publicMessageObject.data.username = publicMessageObject.data.username.trim().slice(0, 20)
                    publicMessageObject.data.message = publicMessageObject.data.message.trim().slice(0, 140)

                    if (publicMessageObject.data.username.trim() === "") {
                        publicMessageObject.data.username = "Anonymous"
                    }

                    db.insert(ChatLog).values({
                        username: publicMessageObject.data.username,
                        message: publicMessageObject.data.message,
                        is_deleted: false
                    }).catch(err => {
                        console.error("Error inserting chat log:", err)
                    })

                    connected_ws_clients.forEach((clientID, clientWs) => {
                        if (clientWs.readyState === WebSocket.OPEN) {
                            clientWs.send(JSON.stringify({
                                type: "public_message",
                                data: {
                                    username: publicMessageObject.data.username,
                                    message: publicMessageObject.data.message,
                                }
                            }))
                        }
                    })
                } else if (data.type === "ping") {
                    // Echo back to allow client to measure RTT
                    const pongObject: DataObject = {
                        type: "pong",
                        data: { t0: data.data.t0 }
                    }
                    ws.send(JSON.stringify(pongObject))
                }
            }
        }
    })
)



const server = serve({
    fetch: ServerApp.fetch,
    port: LOCAL_WEBSERVER_PORT,
})
injectWebSocket(server)

server.on('listening',
    () => {
        const address = server.address()
        const port = typeof address === 'string' ? address : address?.port
        console.log(`Server is running at ${typeof address === 'string' ? address : address?.address}:${port}`)
    }
)

// server loop
setInterval(() => {
    connected_ws_clients.forEach((clientID, ws) => {
        if (ws.readyState === WebSocket.OPEN) {

            ws.send(JSON.stringify({ type: "heartbeat", data: null }))
        }
        void clientID;
    })
}, 3000)

// Broadcast object to all connected clients
function broadcast(data: DataObject) {
    connected_ws_clients.forEach((clientID, ws) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data))
        }
        void clientID;
    });
}



// graceful shutdown
process.on('SIGINT', async () => {
    console.log("Server shut down.")
    server.close()
    await pool.end().then(() => {
        console.log("Database connection closed.")
    }).catch(err => {
        console.error("Error closing database connection:", err)
    })
    process.exit(0)
})