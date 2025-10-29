#!/bin/sh

# Redis Backup Script - Simple and Reliable
set -e

# Configuration
REDIS_HOST=${REDIS_HOST:-redis}
REDIS_PORT=${REDIS_PORT:-6379}
REDIS_PASSWORD=${REDIS_PASSWORD}
BACKUP_DIR=${BACKUP_DIR:-/backups}
BACKUP_KEEP_DAYS=${BACKUP_KEEP_DAYS:-7}

# Logging
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') $1"
}

# Test Redis connection
test_redis() {
    log "Testing Redis connection..."
    redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" --no-auth-warning ping > /dev/null
    log "Redis connection OK"
}

# Create backup
create_backup() {
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local filename="redis_backup_${timestamp}.rdb"
    local backup_path="$BACKUP_DIR/$filename"

    log "Creating backup: $filename"

    # Create backup directory
    mkdir -p "$BACKUP_DIR"

    # Create backup using redis-cli --rdb
    redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" --no-auth-warning --rdb "$backup_path"

    # Compress backup
    gzip "$backup_path"

    local file_size=$(du -h "${backup_path}.gz" | cut -f1)
    log "Backup completed: ${filename}.gz ($file_size)"
}

# Clean old backups
cleanup_backups() {
    log "Cleaning backups older than $BACKUP_KEEP_DAYS days"
    find "$BACKUP_DIR" -name "*.gz" -type f -mtime +$BACKUP_KEEP_DAYS -delete
}

# Main backup function
run_backup() {
    log "Starting Redis backup"
    test_redis
    create_backup
    cleanup_backups
    touch /tmp/backup_healthy
    log "Backup completed successfully"
}

# Setup cron
setup_cron() {
    local schedule="$1"
    log "Setting up cron: $schedule"

    # Kill any existing crond processes
    pkill crond 2>/dev/null || true

    # Create cron job
    echo "$schedule /usr/local/bin/backup.sh run >> /var/log/backup.log 2>&1" > /var/spool/cron/crontabs/root

    # Start crond in foreground (only one instance)
    exec crond -f
}

# Main execution
case "${1:-run}" in
    "run")
        run_backup
        ;;
    "cron")
        mkdir -p "$BACKUP_DIR" /var/log
        touch /tmp/backup_healthy
        schedule=${SCHEDULE:-"0 2 * * *"}
        log "Backup service starting with schedule: $schedule"
        setup_cron "$schedule"
        ;;
    *)
        echo "Usage: $0 [run|cron]"
        exit 1
        ;;
esac