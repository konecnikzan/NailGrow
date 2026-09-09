// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');

module.exports = defineConfig([
  expoConfig,
  {
    // Generated: src/db/migrations/*.sql -> bundle.ts via scripts/build-migrations.mjs
    ignores: ['dist/*', 'src/db/migrations/bundle.ts'],
  },
  {
    // Type-aware linting for our own source. Catches un-awaited promises like the
    // fire-and-forget File.move() that raced photo-write verification.
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ignores: ['src/**/*.d.ts'],
    plugins: { '@typescript-eslint': tseslint },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
]);
