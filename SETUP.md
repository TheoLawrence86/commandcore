# CommandCore Setup Guide

This guide will help you set up and run the CommandCore system on any operating system (Linux, macOS, or Windows).

## Prerequisites

- Docker and Docker Compose installed
- OpenAI API key
- At least 4GB of RAM available for Docker
- Port 80 available on your machine

## Setup Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd commandcore
```

### 2. Configure Environment Variables

Copy the example environment file and edit it to add your OpenAI API key:

```bash
cp .env.example .env
```

Edit the `.env` file and replace `your_openai_api_key` with your actual OpenAI API key.

### 3. Start the Application

You can start the application using any of the following methods, depending on your operating system:

#### Using Make (Linux, macOS, Windows with WSL)

```bash
make start
```

#### Using Python (Cross-platform)

```bash
python run.py
```

#### Using Shell Script (Linux, macOS, Git Bash, WSL)

```bash
chmod +x ./start.sh  # Only needed on Linux/macOS
./start.sh
```

#### Using Docker Compose directly

```bash
docker-compose up -d
# Wait for PostgresML to be ready (about 15 seconds)
sh ./load_models.sh  # Linux/macOS
# OR
powershell -Command ./load_models.sh  # Windows
```

This will:
1. Start all the Docker containers
2. Wait for the PostgresML container to be ready
3. Load the embedding model into PostgresML

### 4. Verify the Setup

Run the test script to verify that all components are working correctly:

```bash
make test
# OR
python ./tests/test_api.py
```

This will test:
1. Health endpoints for both services
2. Document upload functionality
3. Document processing status
4. Query functionality

### 5. Access the Application

Once the application is running, you can access it at:

- Main interface: http://localhost/
- Query UI: http://localhost/query_ui/
- Document ingestion UI: http://localhost/ingestion_ui/

## System Components

The CommandCore system consists of several components:

1. **PostgresML Database**: Stores document chunks and embeddings, provides vector similarity search
2. **Ingestion Service**: Processes documents and stores them in the database
3. **Orchestrator Service**: Handles queries and generates responses
4. **Web Interface**: Provides user interfaces for querying and document upload

## Common Tasks

The Makefile provides commands for common tasks that work across platforms:

- `make start`: Start the application
- `make stop`: Stop the application
- `make restart`: Restart the application
- `make status`: Show the status of containers
- `make logs`: Show logs from all containers
- `make logs container=<n>`: Show logs from a specific container
- `make clean`: Clean up volumes and generated files
- `make test`: Run the API tests
- `make shell-db`: Open a shell in the PostgresML container
- `make shell-ingestion`: Open a shell in the ingestion service container
- `make shell-orchestrator`: Open a shell in the orchestrator container
- `make psql`: Open a PostgreSQL shell
- `make load-model`: Manually load the embedding model
- `make help`: Show help message

## Platform-Specific Considerations

### Windows

- For Windows without WSL, use Docker Desktop with the Linux containers option
- Some commands might need to be run in PowerShell or Git Bash
- If using PowerShell, you may need to adjust script permissions

### macOS

- Works natively with make and shell scripts
- Ensure Docker Desktop has sufficient resources allocated

### Linux

- Works natively with make and shell scripts
- Ensure your user has permissions to run Docker commands

## Troubleshooting

### Services not starting

If one or more services fail to start, check the logs:

```bash
make logs
```

### PostgresML model loading fails

If the embedding model fails to load, try manually loading it:

```bash
make load-model
```

### Connection errors

If you see connection errors in the logs, make sure all the services are running:

```bash
make status
```

## Next Steps

1. Upload some domain-specific documents using the ingestion UI
2. Try querying the system using the query UI
3. Check out the API documentation for programmatic access
4. Look at the code structure to understand the system architecture
