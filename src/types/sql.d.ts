// Drizzle migration files are imported as strings (see metro.config.js sourceExts).
declare module '*.sql' {
  const content: string;
  export default content;
}
