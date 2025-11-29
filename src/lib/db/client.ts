import { createClient } from '@libsql/client';
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import 'dotenv/config';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

export const db = url
    ? drizzleLibsql(createClient({ url, authToken }), { schema })
    : drizzleSqlite(new Database('local.db'), { schema });
