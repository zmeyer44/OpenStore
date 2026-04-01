import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema/index';

let pool: Pool | null = null;

export function getDb() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 10000,
    });
  }
  return drizzle(pool, { schema });
}

export type Database = ReturnType<typeof getDb>;
