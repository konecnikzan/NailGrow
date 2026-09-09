const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Drizzle migrations are generated as .sql files that get imported by
// src/db/migrations/migrations.js. Metro needs to treat .sql as a source module.
config.resolver.sourceExts.push('sql');

// `input` is the CSS entry NativeWind compiles Tailwind from. It must also be
// imported once from the root layout (src/app/_layout.tsx).
module.exports = withNativeWind(config, { input: './src/global.css' });
