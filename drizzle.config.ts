import "@dotenvx/dotenvx"
import { defineConfig } from 'drizzle-kit'
import dotenvx from "@dotenvx/dotenvx"

dotenvx.config({ path: "./secrets.env" })

export default defineConfig({
    out: './drizzle',
    schema: './src/server/database/Schema.ts',
    dialect: 'postgresql',
    dbCredentials: {
        host: process.env.POSTGRES_URL || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '4000', 10),
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB || 'defaultdb',
        ssl: false
    },
})
