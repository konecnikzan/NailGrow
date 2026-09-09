import type { Config } from 'drizzle-kit';

// Emits plain .sql files + meta/. `scripts/build-migrations.mjs` then inlines
// them into src/db/migrations/bundle.ts, which is what the app imports at runtime
// (no .sql imports on device — see that script for why). Both steps run together
// via `npm run db:generate`.
export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'sqlite',
} satisfies Config;
