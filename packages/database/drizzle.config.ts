import dotenv from 'dotenv';
import { resolve } from 'path';
import { defineConfig } from 'drizzle-kit';

dotenv.config({ path: resolve(__dirname, '../../.env') });

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
