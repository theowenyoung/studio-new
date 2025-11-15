import { Pool } from 'pg'
import runner from 'node-pg-migrate'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// 使用 DATABASE_URL 创建连接池
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// 获取当前文件的目录
const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '../..')

// 运行 migrations
export async function runMigrations() {
  try {
    console.log('Running migrations...')

    await runner({
      databaseUrl: process.env.DATABASE_URL,
      dir: join(projectRoot, 'migrations'),
      direction: 'up',
      migrationsTable: 'pgmigrations',
      verbose: true,
      checkOrder: true,
    })

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
