import { Pool } from 'pg'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// 使用 DATABASE_URL 创建连接池
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// 获取当前文件的目录（用于读取 migrations）
const __dirname = dirname(fileURLToPath(import.meta.url))

// 创建 migrations 表来追踪已执行的迁移
async function createMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

// 执行单个迁移文件
async function runMigration(name: string, sql: string) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 检查迁移是否已执行
    const result = await client.query(
      'SELECT 1 FROM migrations WHERE name = $1',
      [name]
    )

    if (result.rows.length === 0) {
      console.log(`Running migration: ${name}`)
      await client.query(sql)
      await client.query(
        'INSERT INTO migrations (name) VALUES ($1)',
        [name]
      )
      console.log(`✓ Migration ${name} completed`)
    } else {
      console.log(`⊘ Migration ${name} already executed`)
    }

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error(`✗ Migration ${name} failed:`, error)
    throw error
  } finally {
    client.release()
  }
}

// 运行所有迁移
export async function runMigrations() {
  try {
    await createMigrationsTable()

    // 按顺序读取并执行迁移文件
    const migrations = [
      '001_create_posts_table.sql',
      '002_seed_posts.sql',
    ]

    for (const migration of migrations) {
      const migrationPath = join(__dirname, 'migrations', migration)
      const sql = readFileSync(migrationPath, 'utf-8')
      await runMigration(migration, sql)
    }

    console.log('All migrations completed successfully')
  } catch (error) {
    console.error('Error running migrations:', error)
    throw error
  }
}

// 初始化数据库（运行迁移）
export async function initDatabase() {
  console.log('Initializing database...')
  await runMigrations()
}

// 优雅关闭连接池
export async function closeDatabase() {
  await pool.end()
}
