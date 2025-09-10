import "@dotenvx/dotenvx"
import { defineConfig } from 'drizzle-kit'
import dotenvx from "@dotenvx/dotenvx"

dotenvx.config({ path: "./.env.local" })

export default defineConfig({
    out: './drizzle',
    schema: './src/server/database/Schema.ts',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.POSTGRES_URL!,
        ssl: false
    },
})
