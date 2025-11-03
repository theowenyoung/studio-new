import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { Page } from './pages/page'
import { Top } from './pages/top'
import { serveStatic } from '@hono/node-server/serve-static'
import { assetsMiddleware } from './middleware/assets'

const app = new Hono()

app.use('*', assetsMiddleware)

// Model
export type Post = {
  id: string
  title: string
  body: string
}

const posts: Post[] = [
  { id: '1', title: 'Good Morning', body: 'Let us eat breakfast' },
  { id: '2', title: 'Good Afternoon', body: 'Let us eat Lunch' },
  { id: '3', title: 'Good Evening', body: 'Let us eat Dinner' },
  { id: '4', title: 'Good Night', body: 'Let us drink Beer' },
  { id: '5', title: 'こんにちは', body: '昼からビールを飲みます' }
]

// Logic
const getPosts = () => posts

const getPost = (id: string) => {
  return posts.find((post) => post.id == id)
}

// Controller
app.get('/', (c) => {
  const posts = getPosts()
  return c.html(<Top posts={posts} c={c} />)
})

app.get('/post/:id{[0-9]+}', (c) => {
  const id = c.req.param('id')
  const post = getPost(id)
  if (!post) return c.notFound()
  return c.html(<Page post={post} c={c} />)
})

// 静态文件服务（放在路由之后，作为兜底）
// 优先级：业务路由 > 静态文件
const isDev = process.env.NODE_ENV !== 'production'

// 静态文件服务
// Vite 会自动把 public/ 复制到 dist/client/
app.use('/static/*', serveStatic({ root: isDev ? './public' : './dist/client' }))

// 在生产环境中，提供 Vite 生成的 assets
if (!isDev) {
  app.use('/assets/*', serveStatic({ root: './dist/client' }))
}

// 导出 app 供 Vite dev server 使用
export default app

// 仅在非 Vite 环境下启动服务器（生产环境）
if (process.env.NODE_ENV === 'production') {
  const { serve } = await import('@hono/node-server')
  serve({
    fetch: app.fetch,
    port: 3000
  }, (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  })
}

