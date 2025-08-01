import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import * as dotenvx from "@dotenvx/dotenvx"
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { KeyValuePair } from './database/Schema.ts'
import { eq, sql } from 'drizzle-orm'
import { createNodeWebSocket } from '@hono/node-ws'
import { randomUUID, type UUID } from 'crypto'
import type { WSContext } from 'hono/ws'
dotenvx.config({ path: "./secrets.env" })

const pool = new Pool({
    connectionString: `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@localhost:4000/${process.env.POSTGRES_DB}`
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

ServerApp.use("/visit", cors()
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

}).get(
    '/ws',
    upgradeWebSocket((c) => {
        
        
        return {
            onOpen: (evt, ws) => {
                const clientID = randomUUID()
                connected_ws_clients.set(ws, clientID)
                
                console.log("WebSocket connection opened.")
            },
            onClose: (evt, ws) => {
                connected_ws_clients.delete(ws)
                console.log(`WebSocket connection closed. Total clients: ${connected_ws_clients.size}`)


            },
            onMessage: (evt, ws) => {
                const data = JSON.parse(evt.data)
                console.log("Received message:", data)
                connected_ws_clients.forEach((clientID, ws) => {
                    ws.send(JSON.stringify({username:data.username, message:data.message}))
            })
                
            }
        }
    })
)



const server = serve({
    fetch: ServerApp.fetch,
    port: 3000,
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
        // Check in on each guy
        //ws.send("PING")
    })

}, 1000)



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