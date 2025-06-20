import { type Options, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import * as dotenv from "dotenv";
dotenv.config({ path: "./secrets.env" });

const config: Options = {
    driver: PostgreSqlDriver,
    dbName: "train-io-db",
    password: process.env.POSTGRES_PASSWORD,
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST || "localhost",
    
    metadataProvider: TsMorphMetadataProvider,
    entities: ['dist/**/*.entity.js'],
    entitiesTs: ['src/**/*.entity.ts'],
}

export default config;