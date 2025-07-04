import { jsonb, pgTable, text } from "drizzle-orm/pg-core"


export const KeyValuePair = pgTable("key_value_pairs", {
    key: text().primaryKey(),
    value: jsonb(),
})