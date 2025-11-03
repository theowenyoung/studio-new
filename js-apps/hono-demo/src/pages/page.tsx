import { Layout } from '../components/Layout'
import type { Post } from '../index'
import type { Context } from 'hono'

export const Page = (props: { post: Post; c: Context }) => {
  return (
    <Layout title={props.post.title} c={props.c}>
      <main>
        <h2>{props.post.title}</h2>
        <p>{props.post.body}</p>
      </main>
    </Layout>
  )
}
