# Hono Posts Manager with PostgreSQL, Redis, and Datastar

这是一个完整的 Posts 管理系统，使用以下技术栈构建：

- **Hono**: 轻量级 Web 框架
- **PostgreSQL**: 持久化数据存储
- **Redis**: 缓存层（提升性能）
- **Datastar**: 交互式前端框架
- **Migrations**: 数据库版本控制

## 功能特性

✅ 创建新 Post（标题 + 正文）
✅ 读取所有 Posts（带 Redis 缓存）
✅ 更新 Post（实时编辑）
✅ 删除 Post
✅ 数据库迁移管理
✅ 自动缓存失效

## 项目结构

```
js-apps/hono-demo/
├── src/
│   ├── db/
│   │   ├── postgres.ts          # PostgreSQL 连接和迁移管理
│   │   ├── redis.ts              # Redis 客户端和缓存辅助函数
│   │   ├── posts.ts              # Posts CRUD 操作
│   │   └── migrations/           # 数据库迁移文件
│   │       ├── 001_create_posts_table.sql
│   │       └── 002_seed_posts.sql
│   ├── pages/
│   │   ├── posts-manager.tsx     # 主要的 Datastar 交互页面
│   │   ├── top.tsx               # 简单列表视图
│   │   └── page.tsx              # 单个 Post 详情页
│   └── index.tsx                 # 主应用入口
├── .env                          # 环境变量配置
├── dev-with-env.js               # 开发服务器启动脚本
└── test-db.ts                    # 数据库连接测试工具
```

## 环境变量

在 `.env` 文件中配置：

```bash
DATABASE_URL=postgresql://postgres:root123456@localhost:5432/postgres
REDIS_URL=redis://default:dev_password_change_in_production@localhost:6379
NODE_ENV=development
```

## 开发指南

### 启动数据库服务

确保 PostgreSQL 和 Redis 已经通过 `mise run up` 启动：

```bash
# 从项目根目录
cd /Users/green/project/studio-new
mise run up
```

### 启动开发服务器

```bash
cd js-apps/hono-demo
node dev-with-env.js
```

或者使用 pnpm：

```bash
cd /Users/green/project/studio-new
mise run dev:hono
```

访问 `http://localhost:5174/`

### 测试数据库连接

```bash
cd js-apps/hono-demo
npx tsx test-db.ts
```

## API 端点

### 页面路由
- `GET /` - Posts Manager（Datastar 交互式页面）
- `GET /posts` - 简单列表视图
- `GET /post/:id` - 单个 Post 详情页

### API 路由
- `GET /api/posts` - 获取所有 posts（JSON）
- `GET /api/posts/:id` - 获取单个 post（JSON）
- `POST /api/posts` - 创建新 post
- `PUT /api/posts/:id` - 更新 post
- `DELETE /api/posts/:id` - 删除 post

## 数据库迁移

### 迁移系统

项目使用基于 SQL 文件的迁移系统：

- 迁移文件位于 `src/db/migrations/`
- 按数字前缀顺序执行（001, 002, ...）
- 迁移状态记录在 `migrations` 表中
- 每次启动自动运行未执行的迁移

### 添加新迁移

1. 在 `src/db/migrations/` 中创建新的 SQL 文件，例如 `003_add_user_field.sql`
2. 在 `src/db/postgres.ts` 的 `runMigrations()` 函数中添加文件名
3. 重启服务器，迁移将自动执行

## Redis 缓存策略

- **Cache Key 格式**:
  - `posts:all` - 所有 posts 列表
  - `posts:{id}` - 单个 post

- **TTL**: 300 秒（5 分钟）

- **缓存失效**:
  - 创建 post → 清除 `posts:all`
  - 更新 post → 清除 `posts:{id}` 和 `posts:all`
  - 删除 post → 清除 `posts:{id}` 和 `posts:all`

## Datastar 交互

主页面使用 Datastar 实现完全交互式的 UI：

- **状态管理**: 使用 `data-store` 管理本地状态
- **表单提交**: `data-on-submit.prevent` 阻止默认行为并发送 AJAX 请求
- **动态显示**: `data-show` 条件显示元素（编辑表单切换）
- **双向绑定**: `data-model` 实现表单字段的双向数据绑定

## 最佳实践

✅ **单一环境变量 URL**: 使用 `DATABASE_URL` 和 `REDIS_URL` 而不是分散的配置
✅ **Migrations 管理**: 所有数据库变更通过 migrations 目录管理
✅ **连接池**: 使用 pg Pool 而不是单个连接
✅ **优雅关闭**: SIGINT/SIGTERM 信号处理器确保连接正确关闭
✅ **缓存失效**: 写操作自动清除相关缓存
✅ **事务支持**: Migrations 使用事务确保原子性

## 故障排除

### Vite 环境变量问题

如果遇到环境变量未加载的问题，使用 `dev-with-env.js` 启动：

```bash
node dev-with-env.js
```

### 数据库连接失败

检查密码和连接串：

```bash
npx tsx test-db.ts
```

### 清除 Redis 缓存

```bash
docker exec redis-redis-1 redis-cli -a dev_password_change_in_production FLUSHDB
```

### 重置数据库

```bash
docker exec postgres-postgres-1 psql -U postgres -c "DROP TABLE IF EXISTS posts, migrations CASCADE;"
```

然后重启服务器，migrations 将重新运行。

## 技术栈详情

- **Hono** v4.x - 快速、轻量的 Web 框架
- **PostgreSQL** 18 - 强大的关系型数据库
- **Redis** 8.2 - 高性能缓存
- **Datastar** - 现代化的 HTML 增强框架
- **TypeScript** - 类型安全
- **Vite** - 快速的开发服务器

## 性能优化

- ✅ Redis 缓存减少数据库查询
- ✅ 连接池复用数据库连接
- ✅ 索引优化（created_at 字段）
- ✅ 自动更新的 updated_at 触发器

## 下一步

可以考虑添加的功能：

- [ ] 分页支持
- [ ] 全文搜索
- [ ] 用户认证
- [ ] 图片上传
- [ ] Markdown 支持
- [ ] 标签系统
- [ ] 评论功能

---

**项目创建时间**: 2025-11-03
**作者**: Claude Code
**许可**: MIT
