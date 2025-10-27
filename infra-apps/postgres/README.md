# PostgreSQL Development Environment

Production-grade PostgreSQL setup for local development using Docker Compose.

## Features

- PostgreSQL 18 Alpine (latest stable)
- Production-grade performance configuration via `postgresql.conf`
- Minimal environment variables for easy management
- Automatic health checks
- Resource limits
- Data persistence with local volumes
- Initialization scripts for extensions, roles, and schema
- PgAdmin web interface for database management
- Backup volume mount

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- At least 2GB of available RAM

### Setup

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update the password in `.env` file:
   - `POSTGRES_PASSWORD`

3. Ensure the external network exists:
```bash
docker network create shared
```

4. Start the services:
```bash
docker compose up -d
```

5. Verify the services are running:
```bash
docker compose ps
```

6. Check logs:
```bash
docker compose logs -f postgres
```

## Access

### PostgreSQL Database

- **Host**: localhost
- **Port**: 5432 (default, configurable via `POSTGRES_PORT`)
- **Database**: app (default, configurable via `POSTGRES_DB`)
- **Username**: postgres (default, configurable via `POSTGRES_USER`)
- **Password**: Set in `.env` file

Connection string:
```
postgresql://postgres:your_password@localhost:5432/app
```

### Network Configuration

The PostgreSQL container is connected to an external Docker network named `shared`. This allows other containers in the same network to communicate with PostgreSQL.

To access PostgreSQL from other containers, use:
- Host: `postgres` (container name)
- Port: `5432`

## Configuration

### Environment Variables (.env)

The `.env` file contains minimal configuration:
- Database credentials (user, password, database name)
- Port mapping for host access

### PostgreSQL Configuration (postgresql.conf)

All PostgreSQL performance and behavior settings are managed in `postgresql.conf`. This production-grade configuration is optimized for a typical development machine with 4GB+ RAM:

**Connection Settings:**
- `max_connections`: 200 concurrent connections
- `superuser_reserved_connections`: 3

**Memory Settings:**
- `shared_buffers`: 256MB (25% of available RAM)
- `effective_cache_size`: 1GB (estimated OS cache)
- `work_mem`: 4MB per query operation
- `maintenance_work_mem`: 128MB for maintenance operations

**Performance Features:**
- Parallel query execution enabled
- Optimized checkpoint configuration
- Query statistics tracking (pg_stat_statements)
- Slow query logging (>1000ms)

**To adjust settings:**
1. Edit `postgresql.conf` directly
2. Restart the container: `docker compose restart postgres`
3. Verify settings: `docker compose exec postgres psql -U postgres -d app -c "SHOW max_connections;"`

## Initialization Scripts

Scripts in `init-scripts/` run automatically on first startup:

1. **01-extensions.sql**: Installs commonly used PostgreSQL extensions
   - uuid-ossp (UUID generation)
   - pg_trgm (fuzzy text search)
   - citext (case-insensitive text)
   - pgcrypto (encryption functions)
   - pg_stat_statements (query statistics)

2. **02-roles.sql**: Creates application-level roles
   - `app_readwrite`: Read-write access to tables
   - `app_readonly`: Read-only access
   - `app_user`: Application user with readwrite privileges

3. **03-schema.sql**: Sets up base schema
   - Timezone configuration (UTC)
   - `trigger_set_timestamp()` function for auto-updating timestamps
   - Example table template (commented out)

## Common Operations

### Start services
```bash
docker compose up -d
```

### Stop services
```bash
docker compose stop
```

### Restart services
```bash
docker compose restart
```

### View logs
```bash
docker compose logs -f postgres
```

### Access PostgreSQL CLI
```bash
docker compose exec postgres psql -U postgres -d app
```

### Backup database
```bash
docker compose exec postgres pg_dump -U postgres app > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore database
```bash
docker compose exec -T postgres psql -U postgres -d app < backup.sql
```

### Connect with psql client (if installed locally)
```bash
psql postgresql://postgres:your_password@localhost:5432/app
```

## Data Persistence

Data is persisted in local directories:

- `.local/data`: Database files (PostgreSQL data directory)
- `.local/backups`: Backup directory (mounted at `/backups` in container)

These directories are created automatically and excluded from git via `.gitignore`.

To completely reset (WARNING: destroys all data):
```bash
docker compose down
rm -rf .local
docker compose up -d
```

## Troubleshooting

### Container won't start
Check logs: `docker compose logs postgres`

### Connection refused
- Verify PostgreSQL is healthy: `docker compose ps`
- Check port conflicts: `lsof -i :5432`
- Ensure firewall allows connections

### Performance issues
- Adjust memory settings in `postgresql.conf` (e.g., `shared_buffers`, `effective_cache_size`)
- Monitor resource usage: `docker stats postgres-dev`
- Check slow queries: `docker compose exec postgres psql -U postgres -d app -c "SELECT * FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;"`
- After editing `postgresql.conf`, restart: `docker compose restart postgres`

### Reset initialization scripts
Initialization scripts only run on first startup. To re-run:
```bash
docker compose down -v
docker compose up -d
```

## Security Notes

⚠️ **Important**: This setup is for LOCAL DEVELOPMENT only.

For production:
- Use strong, randomly generated passwords
- Enable SSL/TLS connections
- Configure proper firewall rules
- Regular backups with off-site storage
- Enable audit logging
- Use connection pooling (PgBouncer)
- Restrict network access
- Keep PostgreSQL updated

## Production Considerations

This configuration follows production best practices:

- **Logging**: Configured to log slow queries (>1000ms)
- **Connections**: Supports 200 concurrent connections
- **Checkpoints**: Optimized checkpoint configuration
- **Parallel Processing**: Enabled for query performance
- **WAL Management**: Configured for durability and performance

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PgAdmin Documentation](https://www.pgadmin.org/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
