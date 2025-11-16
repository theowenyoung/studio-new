import { html } from 'hono/html'
import type { Context } from 'hono'

export const Layout = (
  props: { title: string; children?: any; c: Context }
) => {
  const datastarUrl = props.c.var.clientAsset('datastar.js')
  const isDev = process.env.NODE_ENV !== 'production'

  return html`<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${props.title}</title>
        <link
          rel="stylesheet"
          href="${props.c.var.clientAsset('mini-default.min.css')}"
        />
        ${isDev ? html`
        <!-- 开发环境：监听 Vite HMR -->
        <script type="module">
          import.meta.hot?.on('vite:beforeFullReload', () => {
            console.log('🔄 Reloading page...')
          })
        </script>
        ` : ''}
      </head>
      <body style="padding: 1em 2em">
        <header>
          <h1>
            <a href="/">Hono Example</a>
          </h1>
        </header>
        ${props.children}
        <footer>
          <p>Built with wow? <a href="https://github.com/honojs/hono">Hono</a></p>
        </footer>
        <script type="module" src="${datastarUrl}"></script>
      </body>
    </html>`
}
