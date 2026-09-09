import type { Config } from 'drizzle-kit';

// `driver: 'expo'` makes drizzle-kit emit `src/db/migrations/migrations.js` — a
// bundler-friendly module that inlines every .sql file plus the journal. That is
// what `useMigrations` / `migrate` consume at runtime; the raw .sql files are not
// read from disk on device.
export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'sqlite',
  driver: 'expo',
} satisfies Config;
