// node-pg-migrate configuration
// https://salsita.github.io/node-pg-migrate/#/

export default {
  // Database connection string (from environment variable)
  databaseUrl: process.env.DATABASE_URL,

  // Directory where migration files are stored
  dir: 'migrations',

  // Migration table name
  migrationsTable: 'pgmigrations',

  // Create migration files with .sql extension
  ignorePattern: '.*\\.map',

  // Direction (default: up)
  direction: 'up',

  // Count (number of migrations to run)
  count: Infinity,

  // Timestamp format for migration files
  timestampFormat: 'unix',

  // Log SQL queries
  verbose: true,

  // Check ordering of migrations
  checkOrder: true,

  // Allow camelCase in SQL
  decamelize: false
}
