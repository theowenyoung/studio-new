import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { Page } from './pages/page'
import { Top } from './pages/top'
import { serveStatic } from '@hono/node-server/serve-static'

const app = new Hono()

app.use('/favicon.ico', serveStatic({ path: './public/favicon.ico' }))

app.use(
  '/static/*',
  serveStatic({
    root: './public/static',
    rewriteRequestPath: (path) => path.replace(/^\/static/, ''),
  })
)
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
  return c.html(<Top posts={posts} />)
})

app.get('/post/:id{[0-9]+}', (c) => {
  const id = c.req.param('id')
  const post = getPost(id)
  if (!post) return c.notFound()
  return c.html(<Page post={post} />)
})

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})

