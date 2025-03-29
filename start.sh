#!/bin/sh

# Function to detect OS
detect_os() {
  case "$(uname -s)" in
    Darwin*)
      echo "macOS"
      ;;
    Linux*)
      echo "Linux"
      ;;
    CYGWIN*|MINGW*|MSYS*)
      echo "Windows"
      ;;
    *)
      echo "Unknown"
      ;;
  esac
}

# Get OS type
OS=$(detect_os)
echo "$OS detected"

# Main startup function
start_commandcore() {
  echo "Starting CommandCore application..."
  
  # Check if .env file exists, if not create from example
  if [ ! -f .env ]; then
      echo "Creating .env file from example..."
      cp .env.example .env
      echo "Please edit the .env file to set your OpenAI API key"
  fi
  
  # Start Docker containers
  echo "Starting Docker containers..."
  docker compose up -d
  
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
  
  # Print success message
  echo "CommandCore is now running!"
  echo "Access the web interface at: http://localhost"
  echo "Access the query UI at: http://localhost/query_ui/"
  echo "Access the ingestion UI at: http://localhost/ingestion_ui/"
}

# Start the application
start_commandcore
