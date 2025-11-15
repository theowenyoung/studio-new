#!/bin/sh
set -e

# Source the functions library
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
. "$SCRIPT_DIR/../scripts/common.sh"

# ==========================================
# Demo Database Configuration
# ==========================================
DB_NAME="demo"
DB_DESCRIPTION="Demo application database"

# Passwords from environment
RW_PASSWORD="${POSTGRES_DEMO_USER_PASSWORD:?Error: POSTGRES_DEMO_USER_PASSWORD not set}"
RO_PASSWORD="${POSTGRES_DEMO_READONLY_PASSWORD:?Error: POSTGRES_DEMO_READONLY_PASSWORD not set}"

# ==========================================
# Create Database
# ==========================================
create_database_with_users \
  "$DB_NAME" \
  "$RW_PASSWORD" \
  "$RO_PASSWORD" \
  "$DB_DESCRIPTION"
