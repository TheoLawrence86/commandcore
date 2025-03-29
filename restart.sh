#!/bin/sh

# This script restarts the CommandCore application after making changes

echo "Restarting CommandCore services..."

# Stop all containers
docker compose down

# Rebuild and start containers
docker compose up -d --build

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
attempts=0
max_attempts=30

while ! docker exec commandcore-postgres pg_isready -U postgres > /dev/null 2>&1; do
  attempts=$((attempts+1))
  if [ $attempts -ge $max_attempts ]; then
    echo "Error: PostgreSQL did not become ready in time. Please check your Docker installation."
    exit 1
  fi
  sleep 2
done

echo "CommandCore has been restarted!"
echo "Access the web interface at: http://localhost"
echo "Access the query UI at: http://localhost/query_ui/"
echo "Access the ingestion UI at: http://localhost/ingestion_ui/"
