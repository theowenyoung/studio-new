#!/bin/bash

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Building PostgreSQL deployment package...${NC}"

# Change to postgres directory
cd "$(dirname "$0")"

# Clean and create dist directory
echo -e "${YELLOW}Creating dist directory...${NC}"
rm -rf dist
mkdir -p dist

# Copy docker-compose.prod.yml as docker-compose.yml
echo -e "${YELLOW}Copying docker-compose.prod.yml...${NC}"
cp docker-compose.prod.yml dist/docker-compose.yml

# Copy postgresql.conf
echo -e "${YELLOW}Copying postgresql.conf...${NC}"
cp postgresql.conf dist/

# Copy initdb.d directory
echo -e "${YELLOW}Copying initdb.d directory...${NC}"
cp -r initdb.d dist/

# Copy .env.example
echo -e "${YELLOW}Copying .env.example...${NC}"
cp .env.example dist/

# Create backups directory
echo -e "${YELLOW}Creating backups directory...${NC}"
mkdir -p dist/backups

# Download environment variables from AWS using psenv
echo -e "${YELLOW}Downloading environment variables from AWS...${NC}"
if command -v psenv &> /dev/null; then
    psenv -t .env.example -p "/studio-prod/" -o dist/.env
    echo -e "${GREEN}Environment variables downloaded successfully${NC}"
else
    echo -e "${YELLOW}Warning: psenv command not found. Skipping .env download.${NC}"
    echo -e "${YELLOW}You can manually run: psenv -t .env.example -p \"/studio-prod/\" -o dist/.env${NC}"
fi

# Create a README in dist
cat > dist/README.md << 'EOF'
# PostgreSQL Deployment Package

## Files Included

- `docker-compose.yml` - Production Docker Compose configuration
- `postgresql.conf` - PostgreSQL server configuration
- `initdb.d/` - Database initialization scripts
- `.env` - Environment variables (downloaded from AWS)
- `.env.example` - Environment variables template
- `backups/` - Directory for database backups

## Pre-Deployment Setup

**IMPORTANT: You must create and configure the data directory BEFORE starting the services.**

### 1. Create the PostgreSQL data directory

```bash
sudo mkdir -p /data/postgres
```

### 2. Set correct permissions

PostgreSQL runs as user `postgres` with UID 70 in the Alpine-based container. You must set the correct ownership:

```bash
sudo chown -R 70:70 /data/postgres
sudo chmod 700 /data/postgres
```

**Why UID 70?** The `postgres:18-alpine` Docker image uses UID/GID 70 for the postgres user.

### 3. Verify permissions

```bash
ls -la /data/ | grep postgres
# Should show: drwx------ 2 70 70 ... postgres
```

## Deployment

1. Ensure Docker and Docker Compose are installed
2. Ensure the `shared` network exists: `docker network create shared`
3. **Complete the Pre-Deployment Setup above** (create `/data/postgres` with correct permissions)
4. Review and update `.env` file if needed
5. Start services: `docker compose up -d`
6. Check status: `docker compose ps`
7. View logs: `docker compose logs -f`

## Backup

Backups are automatically created daily and stored in the `backups/` directory.

- Daily backups: kept for 7 days
- Weekly backups: kept for 4 weeks
- Monthly backups: kept for 12 months

## Troubleshooting

### Permission Denied Errors

If you see errors like `permission denied` or `could not create directory`, check:

```bash
# Check directory ownership
ls -la /data/ | grep postgres

# Fix if needed
sudo chown -R 70:70 /data/postgres
sudo chmod 700 /data/postgres
```

### Container Keeps Restarting

Check logs for permission issues:

```bash
docker compose logs postgres
```

## Notes

- PostgreSQL data is stored in host directory `/data/postgres` (not a Docker volume)
- Database is only accessible within the `shared` Docker network (no host port mapping)
- All services use the `shared` external network for inter-service communication
- The data directory must be owned by UID 70 (postgres user in Alpine)
EOF

echo -e "${GREEN}Build completed successfully!${NC}"
echo -e "${GREEN}Deployment package created in: dist/${NC}"
echo ""
echo -e "${YELLOW}Contents:${NC}"
ls -lh dist/
echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}⚠️  IMPORTANT DEPLOYMENT REMINDER ⚠️${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo -e "${YELLOW}Before deploying to the server, you MUST:${NC}"
echo ""
echo -e "  1. Create the data directory:"
echo -e "     ${GREEN}sudo mkdir -p /data/postgres${NC}"
echo ""
echo -e "  2. Set correct permissions (UID 70 for postgres:18-alpine):"
echo -e "     ${GREEN}sudo chown -R 70:70 /data/postgres${NC}"
echo -e "     ${GREEN}sudo chmod 700 /data/postgres${NC}"
echo ""
echo -e "${YELLOW}See dist/README.md for complete deployment instructions.${NC}"
echo ""
