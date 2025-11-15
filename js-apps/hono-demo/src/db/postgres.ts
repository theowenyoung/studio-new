import { Pool } from 'pg'

// 使用 DATABASE_URL 创建连接池
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})




// 优雅关闭连接池
export async function closeDatabase() {
  await pool.end()
}
