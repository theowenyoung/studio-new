# Database Migrations - node-pg-migrate

本项目使用 [node-pg-migrate](https://salsita.github.io/node-pg-migrate/) 管理数据库 schema，这是一个成熟、轻量的 PostgreSQL migration 工具。

## 快速开始

### 常用命令

```bash
# 运行所有 pending migrations
pnpm migrate:up

# 回滚最后一个 migration
pnpm migrate:down

# 创建新的 migration
pnpm migrate:create my-migration-name

# 查看帮助
pnpm migrate --help
```

## 创建 Migration

### 1. 生成 Migration 文件

```bash
pnpm migrate:create add-users-table
```

这会在 `migrations/` 目录下创建一个文件，如：
```
migrations/1699000000000_add-users-table.sql
```

### 2. 编辑 Migration 文件

node-pg-migrate 支持纯 SQL 文件，编辑生成的文件：

```sql
-- migrations/1699000000000_add-users-table.sql

-- Up Migration
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

### 3. 运行 Migration

```bash
pnpm migrate:up
```

## Migration 文件格式

node-pg-migrate 支持两种格式：

### SQL 文件 (推荐)

```sql
-- Up Migration
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL
);

-- Down Migration (可选)
-- DROP TABLE posts;
```

### JavaScript/TypeScript 文件

```javascript
// migrations/1699000000000_add-users-table.js
export async function up(pgm) {
  pgm.createTable('users', {
    id: 'id',
    email: { type: 'varchar(255)', notNull: true, unique: true },
    name: { type: 'varchar(255)', notNull: true },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
  })

  pgm.createIndex('users', 'email')
}

export async function down(pgm) {
  pgm.dropTable('users')
}
```

## 常见操作

### 查看 Migration 状态

```bash
# 使用 node-pg-migrate CLI
pnpm migrate list

# 或直接查询数据库
psql $DATABASE_URL -c "SELECT * FROM pgmigrations ORDER BY run_on;"
```

### 回滚 Migration

```bash
# 回滚最后一个
pnpm migrate:down

# 回滚指定数量
pnpm migrate down 2
```

### 运行到特定版本

```bash
# 运行到指定时间戳
pnpm migrate up 1699000000000
```

### Dry Run（预览但不执行）

```bash
pnpm migrate up --dry-run
```

## 配置

配置文件：`.node-pg-migrate.config.js`

```javascript
export default {
  databaseUrl: process.env.DATABASE_URL,
  dir: 'migrations',
  migrationsTable: 'pgmigrations',
  direction: 'up',
  verbose: true,
  checkOrder: true
}
```

## 应用启动时自动运行

应用在启动时会自动运行 migrations（`src/index.tsx`）：

```typescript
async function initialize() {
  await initDatabase()  // 自动运行 migrations
  await connectRedis()
}
```

这意味着：
- 开发环境：`pnpm dev` 自动执行
- 生产环境：`pnpm start` 自动执行

## 最佳实践

1. **使用描述性名称**
   - ✅ `add-users-table`
   - ✅ `add-email-index-to-users`
   - ❌ `update` 或 `fix`

2. **每个 migration 做一件事**
   - 一个表的创建
   - 一个索引的添加
   - 一个列的修改

3. **提供 down migrations**
   ```sql
   -- Up
   ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500);

   -- Down (注释中)
   -- ALTER TABLE users DROP COLUMN avatar_url;
   ```

4. **测试 migrations**
   ```bash
   # 先 dry-run
   pnpm migrate up --dry-run

   # 然后真正执行
   pnpm migrate:up

   # 测试回滚
   pnpm migrate:down
   pnpm migrate:up
   ```

5. **不要修改已运行的 migrations**
   - 已运行的 migration 应该视为不可变
   - 如需修改，创建新的 migration

## 团队协作

### 拉取代码后

```bash
git pull
pnpm migrate:up  # 运行新的 migrations
```

### 提交 Migration

```bash
git add migrations/1699000000000_add-users-table.sql
git commit -m "feat: add users table"
git push
```

### 处理冲突

如果两个人同时创建了 migration：

1. 保留时间戳较早的文件名
2. 重命名较晚的文件
3. 确保顺序正确

## 生产环境部署

### 方案 1：自动运行（推荐）

应用启动时自动运行（已实现）：

```bash
NODE_ENV=production node dist/server/index.js
```

### 方案 2：手动运行

在部署脚本中先运行 migrations：

```bash
pnpm migrate:up
pnpm start
```

### 方案 3：Dry Run 后运行

```bash
# 预览
pnpm migrate up --dry-run

# 确认后执行
pnpm migrate:up
```

## 故障排查

### Migration 失败

migrations 在事务中运行，失败会自动回滚：

1. 检查错误信息
2. 修复 SQL
3. 重新运行 `pnpm migrate:up`

### 查看已运行的 Migrations

```bash
psql $DATABASE_URL -c "SELECT * FROM pgmigrations;"
```

### 手动标记 Migration 为已运行

```sql
INSERT INTO pgmigrations (name, run_on)
VALUES ('1699000000000_my-migration.sql', NOW());
```

### 手动删除 Migration 记录

```sql
DELETE FROM pgmigrations
WHERE name = '1699000000000_my-migration.sql';
```

## 目录结构

```
hono-demo/
├── .node-pg-migrate.config.js   # node-pg-migrate 配置
├── migrations/                   # Migration 文件目录
│   ├── 1730000001_create-posts-table.sql
│   └── 1730000002_seed-posts.sql
└── src/
    └── db/
        └── postgres.ts          # 数据库连接池
```

## 参考资源

- [node-pg-migrate 官方文档](https://salsita.github.io/node-pg-migrate/)
- [node-pg-migrate GitHub](https://github.com/salsita/node-pg-migrate)
- [PostgreSQL 官方文档](https://www.postgresql.org/docs/)

## 为什么选择 node-pg-migrate？

- ✅ 成熟稳定，GitHub 2.8k+ stars
- ✅ 轻量级，零额外依赖
- ✅ 支持纯 SQL 文件
- ✅ 支持 up/down migrations
- ✅ 内置事务支持
- ✅ 命令行工具完善
- ✅ TypeScript 支持
- ✅ 活跃维护

相比自己实现，使用成熟工具：
- 久经考验，bug 少
- 功能完善（dry-run、rollback 等）
- 社区支持
- 持续维护
