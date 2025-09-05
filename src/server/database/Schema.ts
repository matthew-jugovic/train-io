import { pgTable , pgSequence } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const chatLogIdSeq = pgSequence("chat_log_id_seq", {
    startWith: "0",
    increment: "1",
    minValue: "0",
    cache: "1",
    cycle: false,
})

export const KeyValuePair = pgTable("key_value_pairs", (t) => ({
    key: t.text().primaryKey(),
    value: t.text().notNull(),
}))

export const ChatLog = pgTable("chat_log", (t) => ({
    id: t.text("id").default(sql`nextval('chat_log_id_seq'::regclass)`).primaryKey().notNull(),
    timestamp: t.timestamp({withTimezone: true}).notNull().defaultNow(),
    username: t.text().notNull(),
    message: t.text().notNull(),
    is_deleted: t.boolean().notNull().default(false),
}))