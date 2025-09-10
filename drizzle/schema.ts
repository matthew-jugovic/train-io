import { pgTable, text, timestamp, boolean, pgSequence } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"


export const chatLogIdSeq = pgSequence("chat_log_id_seq", {  startWith: "0", increment: "1", minValue: "0", maxValue: "9223372036854775807", cache: "1", cycle: false })

export const chatLog = pgTable("chat_log", {
	id: text().default(nextval(\'chat_log_id_seq\'::regclass)).primaryKey().notNull(),
	timestamp: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	username: text().notNull(),
	message: text().notNull(),
	isDeleted: boolean("is_deleted").default(false).notNull(),
});

export const keyValuePairs = pgTable("key_value_pairs", {
	key: text().primaryKey().notNull(),
	value: text().notNull(),
});
