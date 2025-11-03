import { defineConfig, loadEnv } from 'vite'
import devServer from '@hono/vite-dev-server'
import path from 'node:path'

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  // 客户端生产构建
  if (mode === 'client') {
    return {
      publicDir: 'public',
      build: {
        manifest: true,
        outDir: 'dist/client',
        rollupOptions: {
          // 手动列出所有客户端入口文件
          input: {
            "datastar.js": './src/client/datastar.js',
            example: './src/client/example.ts',
          },
        },
      },
      // 把已压缩的 .js 文件当作静态资源（避免 esbuild 解析报错）
      assetsInclude: ['**/*.js'],
    }
  }

  // 服务端生产构建
  if (mode === 'production') {
    return {
      publicDir: false,  // 服务端构建不需要复制 public
      build: {
        ssr: true,
        outDir: 'dist/server',
        target: 'esnext',  // 支持 top-level await
        rollupOptions: {
          input: './src/index.tsx',
        },
      },
    }
  }

  // 服务端开发模式
  return {
    // 把已压缩的 .js 文件当作静态资源
    assetsInclude: ['**/*.js'],
    plugins: [
      devServer({
        entry: 'src/index.tsx',
        // 排除不需要 Hono 处理的请求，让 Vite 直接处理
        exclude: [
          /^\/@.+$/,           // Vite 内部路径（如 /@vite/client, /@fs/, /@id/）
          /^\/src\/.+/,        // src 目录（包括 src/client）
          /^\/client\/.+/,     // 客户端代码
          /^\/static\/.+/,     // 静态资源
          /\.(css|less|sass|scss|styl|stylus|pcss|postcss)($|\?)/,  // 样式文件
        ],
      }),
    ],
    resolve: {
      alias: {
        // 映射 /client 路径到实际的 src/client 目录
        '/client': path.resolve(process.cwd(), 'src/client'),
      },
      extensions: ['.ts', '.tsx', '.js', '.jsx'],  // 允许省略扩展名
    },
    server: {
      fs: {
        // 允许访问整个项目
        allow: ['..'],
      },
    },
    build: {
      sourcemap: true,  // 生成 source map
      outDir: 'dist/server',
      ssr: true,
      rollupOptions: {
        input: './src/index.tsx',
      },
    },
  }
})
