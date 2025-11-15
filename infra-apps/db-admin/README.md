# Database Admin

一次性执行数据库管理员操作的 Docker 服务，用于创建数据库、用户和设置权限。

## 功能

- 执行管理员级别的 SQL 操作
- 创建数据库和用户
- 配置数据库权限和角色
- 支持可重复执行（幂等性）

## 目录结构

```
db-admin/
├── docker-compose.yml       # Docker Compose 配置
├── .env                     # 环境变量（不提交到版本控制）
├── .env.example             # 环境变量模板
├── scripts/
│   ├── common.sh            # 通用数据库设置函数（POSIX sh 兼容）
│   └── run-migrations.sh    # 迁移执行脚本（POSIX sh 兼容）
└── migrations/
    └── 001-create-demo-db.sh # 迁移脚本示例
```

## 使用方法

### 1. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，设置实际的密码
vim .env
```

### 2. 确保 PostgreSQL 服务正在运行

```bash
# 启动 PostgreSQL（如果还没运行）
cd ../postgres
docker compose up -d
```

### 3. 运行迁移

```bash
# 方式 1: 使用 docker compose run (推荐，自动清理)
docker compose run --rm db-admin

# 方式 2: 使用 mise task (最推荐)
cd ../..  # 回到项目根目录
mise run db:admin:migrations

# 方式 3: 使用 docker compose up (需手动清理)
docker compose up
docker compose down  # 需要手动清理
```

## 创建新的数据库

### 在 migrations/ 目录创建新脚本

例如 `002-create-myapp-db.sh`:

```sh
#!/bin/sh
set -e

# Source the functions library
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
. "$SCRIPT_DIR/../scripts/common.sh"

# 数据库配置
DB_NAME="myapp"
DB_DESCRIPTION="My Application Database"

# 从环境变量读取密码
RW_PASSWORD="${POSTGRES_MYAPP_USER_PASSWORD:?Error: not set}"
RO_PASSWORD="${POSTGRES_MYAPP_READONLY_PASSWORD:?Error: not set}"

# 创建数据库
create_database_with_users \
  "$DB_NAME" \
  "$RW_PASSWORD" \
  "$RO_PASSWORD" \
  "$DB_DESCRIPTION"
```

### 添加权限并配置密码

```bash
# 添加执行权限
chmod +x migrations/002-create-myapp-db.sh

# 在 .env 中添加密码
echo "POSTGRES_MYAPP_USER_PASSWORD=your_rw_password" >> .env
echo "POSTGRES_MYAPP_READONLY_PASSWORD=your_ro_password" >> .env
```

### 运行迁移

```bash
mise run db:admin:migrations
```

## 注意事项

- **幂等性**: 所有脚本使用 `IF NOT EXISTS` 检查，可以安全地重复执行
- **密码安全**: 永远不要将 `.env` 文件提交到版本控制
- **执行顺序**: 脚本按字母顺序执行，使用数字前缀控制顺序（如 001-, 002-）
- **自动清理**: 使用 `docker compose run --rm` 会自动清理容器

