import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import * as dotenvx from "@dotenvx/dotenvx"
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { KeyValuePair } from './database/Schema.ts'
import type { Assume } from 'drizzle-orm'

dotenvx.config({ path: "./secrets.env" })

const pool = new Pool({
    connectionString: `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@localhost:4000/${process.env.POSTGRES_DB}`
})

const db = drizzle(pool);

const result= await db.execute('select 2 + 2')
console.log(result.rows)


