#!/usr/bin/env node
import { config } from 'dotenv'
import { spawn } from 'child_process'

// 加载环境变量
config()

// 打印加载的环境变量（用于调试）
console.log('Loaded environment variables:')
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ Not set')
console.log('- REDIS_URL:', process.env.REDIS_URL ? '✓ Set' : '✗ Not set')
console.log()

// 运行 vite
const vite = spawn('npx', ['vite'], {
  stdio: 'inherit',
  env: { ...process.env },
  shell: true
})

vite.on('error', (err) => {
  console.error('Failed to start Vite:', err)
  process.exit(1)
})

vite.on('close', (code) => {
  process.exit(code || 0)
})
