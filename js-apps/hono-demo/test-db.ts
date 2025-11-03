import { config } from 'dotenv'
import { Pool } from 'pg'
import { createClient } from 'redis'

// 加载环境变量
config()

console.log('DATABASE_URL:', process.env.DATABASE_URL)
console.log('REDIS_URL:', process.env.REDIS_URL)

async function testConnections() {
  // Test PostgreSQL
  console.log('\nTesting PostgreSQL...')
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  })

  try {
    const result = await pool.query('SELECT version()')
    console.log('✓ PostgreSQL connected:', result.rows[0].version)
  } catch (error) {
    console.error('✗ PostgreSQL error:', error)
  } finally {
    await pool.end()
  }

  // Test Redis
  console.log('\nTesting Redis...')
  const redis = createClient({
    url: process.env.REDIS_URL
  })

  redis.on('error', (err) => console.error('Redis error:', err))

  try {
    await redis.connect()
    const pong = await redis.ping()
    console.log('✓ Redis connected:', pong)
  } catch (error) {
    console.error('✗ Redis error:', error)
  } finally {
    await redis.quit()
  }
}

testConnections().then(() => {
  console.log('\nAll tests completed')
  process.exit(0)
}).catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
