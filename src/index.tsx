import { Elysia } from "elysia";
import { html, Html } from "@elysiajs/html";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import readline from "readline";

import { CounterPage } from "./components/Counting.tsx";



dotenv.config({ path: "./secrets.env" });

const db_pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST || "localhost",
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: Number.parseInt(process.env.DB_PORT || "4000"),
});

db_pool.on("error", (err, _) => {
  console.error("Unexpected error on idle client", err);
  process.emit("SIGINT");
});

class KV_DB_Wrapper {
  ready = false;
  
  constructor(private db_pool: Pool) {
    
    this.db_pool.query(`
      CREATE TABLE IF NOT EXISTS kv_store (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `).then(() => {
      this.ready = true;
    }).catch(err => {
      console.error("Error creating table:", err);
      process.emit("SIGINT");
    })

  }

  async get(key: string): Promise<string | null> {
    while (!this.ready) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    const res = await this.db_pool.query("SELECT value FROM kv_store WHERE key = $1", [key]);
    return res.rows.length ? res.rows[0].value : null;
  }

  async set(key: string, value: string): Promise<void> {
    while (!this.ready) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    await this.db_pool.query("INSERT INTO kv_store (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2", [key, value]);
  }
}

const kv_db = new KV_DB_Wrapper(db_pool);
let visits = 0;
const init_visit_count = Number.parseInt(await kv_db.get("visit_count") || "0");
let time_on_site = 0;
const init_time_on_site: number = Number.parseInt(await kv_db.get("time_on_site") || "0");


const app = new Elysia().use(html())
  .get("/", () => {
    visits++;
    const visit_count = init_visit_count + visits;
  
    return <CounterPage visits={visit_count} />;
  })
  .ws("/ws", {
    async message(ws, message) {
      if (message && typeof message === 'object' && 'Activity_Time' in message) {
        if (message.Activity_Time !== -1) {
          await Bun.sleep(100)
          time_on_site += 0.1

        } else {
          // Get ip address of the user
          const clientIP = ws.remoteAddress
          console.log("User connected from IP: ", clientIP)
        }
        const total_time = init_time_on_site + time_on_site;
        const msg = {Activity_Time: total_time};

        ws.send(JSON.stringify(msg));
      }
    }
  })
  .listen(3000)






console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);


// graceful shutdown
// Windows gave me dementia, so I had to use readline to handle the SIGINT event for Windws
const rl_windows = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})
rl_windows.on("SIGINT", () => {
  process.emit("SIGINT");
});

process.on("SIGINT", async () => {

  await kv_db.set("visit_count", (init_visit_count + visits).toString());
  await kv_db.set("time_on_site", (init_time_on_site + time_on_site).toString());

  db_pool.end().then(() => {
    console.log("Server down.");
    process.exit(0);
  }).catch((err) => {
    console.error("Error closing database connection pool:", err);
    process.exit(1);
  });
})