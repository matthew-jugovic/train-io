import { pgTable } from "drizzle-orm/pg-core"

export const KeyValuePair = pgTable("key_value_pairs", (t) => ({
    key: t.text("key").primaryKey(),
    value: t.text("value").notNull(),
}))