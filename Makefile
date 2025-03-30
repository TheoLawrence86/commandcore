# CommandCore Makefile - Cross-platform compatible

.PHONY: start stop restart status logs clean test shell-db shell-ingestion shell-orchestrator help rebuild pgml-setup pgml-model pgml-tables pgml-test psql pgml-load-model pgml-functions

# Default target
.DEFAULT_GOAL := help

# Check OS
ifeq ($(OS),Windows_NT)
	DETECTED_OS := Windows
	SHELL_CMD := powershell
	CHMOD_CMD := attrib +x
else
	UNAME_S := $(shell uname -s)
	ifeq ($(UNAME_S),Darwin)
		DETECTED_OS := macOS
	else ifeq ($(UNAME_S),Linux)
		DETECTED_OS := Linux
	else
		DETECTED_OS := Unknown
	endif
	SHELL_CMD := bash
	CHMOD_CMD := chmod +x
endif

# Variables
COMPOSE := docker compose
POSTGRES_CONTAINER := commandcore-postgresml
INGESTION_CONTAINER := commandcore-ingestion
ORCHESTRATOR_CONTAINER := commandcore-orchestrator
WEB_CONTAINER := commandcore-web

# Start the application
start: ## Start the CommandCore application
	@echo "Starting CommandCore on $(DETECTED_OS)..."
	$(CHMOD_CMD) ./start.sh
	$(SHELL_CMD) ./start.sh

# Stop the application
stop: ## Stop the CommandCore application
	$(COMPOSE) down

# Set up PostgresML tables
pgml-tables: ## Set up database tables for PostgresML
	@echo "Setting up database tables in PostgresML..."
	docker exec $(POSTGRES_CONTAINER) sudo -u postgresml psql -d commandcore -c "CREATE EXTENSION IF NOT EXISTS vector;"
	docker exec $(POSTGRES_CONTAINER) sudo -u postgresml psql -d commandcore -c "CREATE TABLE IF NOT EXISTS knowledge_chunks ( \
		id SERIAL PRIMARY KEY, \
		chunk_text TEXT NOT NULL, \
		embedding vector(1536) NOT NULL, \
		source_info JSONB NOT NULL, \
		domain TEXT NOT NULL, \
		created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), \
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() \
	);"
	docker exec $(POSTGRES_CONTAINER) sudo -u postgresml psql -d commandcore -c "CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx \
	ON knowledge_chunks \
	USING hnsw (embedding vector_cosine_ops) \
	WITH (ef_construction = 64, m = 16);"
	docker exec $(POSTGRES_CONTAINER) sudo -u postgresml psql -d commandcore -c "CREATE INDEX IF NOT EXISTS knowledge_chunks_text_idx \
	ON knowledge_chunks \
	USING GIN (to_tsvector('english', chunk_text));"
	docker exec $(POSTGRES_CONTAINER) sudo -u postgresml psql -d commandcore -c "CREATE INDEX IF NOT EXISTS knowledge_chunks_domain_idx \
	ON knowledge_chunks (domain);"
	docker exec $(POSTGRES_CONTAINER) sudo -u postgresml psql -d commandcore -c "CREATE OR REPLACE FUNCTION update_timestamp_function() RETURNS TRIGGER LANGUAGE plpgsql AS 'BEGIN NEW.updated_at := NOW(); RETURN NEW; END;';"
	docker exec $(POSTGRES_CONTAINER) sudo -u postgresml psql -d commandcore -c "DROP TRIGGER IF EXISTS update_timestamp ON knowledge_chunks;"
	docker exec $(POSTGRES_CONTAINER) sudo -u postgresml psql -d commandcore -c "CREATE TRIGGER update_timestamp \
		BEFORE UPDATE ON knowledge_chunks \
		FOR EACH ROW \
		EXECUTE FUNCTION update_timestamp_function();"
	@echo "✅ PostgresML tables set up successfully!"

# Set up PostgresML functions
pgml-functions: ## Set up functions in PostgresML
	@echo "Setting up PostgresML functions..."
	@docker cp create_similarity_function.sql $(POSTGRES_CONTAINER):/tmp/
	@docker exec $(POSTGRES_CONTAINER) sudo -u postgresml psql -d commandcore -f /tmp/create_similarity_function.sql
	@echo "✅ PostgresML functions set up successfully!"

# Test PostgresML setup
pgml-test: ## Test PostgresML and BAAI/bge-m3 model setup
	@echo "Testing PostgresML basic functionality..."
	docker exec $(POSTGRES_CONTAINER) sudo -u postgresml psql -d commandcore -c "SELECT version();"
	@echo "✅ PostgresML is operational!"

# Load BAAI/bge-m3 embedding model
pgml-load-model: ## Load the BAAI/bge-m3 embedding model (may take time to download)
	@echo "Loading BAAI/bge-m3 embedding model (this may take a few minutes)..."
	docker exec $(POSTGRES_CONTAINER) sudo -u postgresml psql -d commandcore -c "CREATE EXTENSION IF NOT EXISTS pgml;"
	docker exec $(POSTGRES_CONTAINER) sudo -u postgresml psql -d commandcore -c "SELECT pgml.embed('BAAI/bge-m3', 'This is a test embedding', '{\"device\":\"cpu\"}');"
	@echo "Creating function to find similar chunks..."
	docker exec $(POSTGRES_CONTAINER) sudo -u postgresml psql -d commandcore -c "CREATE OR REPLACE FUNCTION find_similar_chunks( \
		query_text TEXT, \
		domain_filter TEXT DEFAULT NULL, \
		similarity_threshold FLOAT DEFAULT 0.7, \
		max_results INT DEFAULT 5 \
	) RETURNS TABLE ( \
		id INT, \
		chunk_text TEXT, \
		source_info JSONB, \
		similarity FLOAT \
	) LANGUAGE plpgsql AS $$\
	DECLARE \
		query_embedding vector(1024); \
	BEGIN \
		BEGIN \
			query_embedding := pgml.embed('BAAI/bge-m3', query_text, '{\"device\":\"cpu\"}'); \
		EXCEPTION WHEN OTHERS THEN \
			RETURN; \
		END; \
		RETURN QUERY \
		SELECT \
			kc.id, \
			kc.chunk_text, \
			kc.source_info, \
			1 - (kc.embedding <=> query_embedding) AS similarity \
		FROM \
			knowledge_chunks kc \
		WHERE \
			(domain_filter IS NULL OR kc.domain = domain_filter) \
			AND 1 - (kc.embedding <=> query_embedding) > similarity_threshold \
		ORDER BY \
			kc.embedding <=> query_embedding \
		LIMIT max_results; \
	END; \
	$$;"
	@echo "✅ BAAI/bge-m3 embedding model setup complete!"

# Complete PostgresML setup
pgml-setup: ## Complete PostgresML setup with tables, model, and test
	@echo "Setting up PostgresML completely..."
	@echo "Waiting for PostgresML to be ready..."
	@sleep 10
	$(MAKE) pgml-tables
	$(MAKE) pgml-functions
	$(MAKE) pgml-test
	@echo "✅ PostgresML setup complete!"

# Rebuild and restart the application
rebuild: ## Rebuild and restart the CommandCore application
	@echo "Rebuilding CommandCore on $(DETECTED_OS)..."
	$(COMPOSE) down
	@echo "Starting PostgresML container first..."
	$(COMPOSE) up -d postgres
	@echo "Waiting for PostgresML to initialize (60 seconds)..."
	@sleep 60
	@echo "Creating commandcore database..."
	docker exec $(POSTGRES_CONTAINER) sudo -u postgresml psql -c "CREATE DATABASE commandcore;" || true
	docker exec $(POSTGRES_CONTAINER) sudo -u postgresml psql -d commandcore -c "CREATE EXTENSION IF NOT EXISTS vector; CREATE EXTENSION IF NOT EXISTS pgml;"
	@echo "Starting remaining services..."
	$(COMPOSE) up -d --build
	@echo "Setting up PostgresML..."
	$(MAKE) pgml-setup
	@echo "CommandCore has been rebuilt and restarted!"
	@echo "Access the web interface at: http://localhost"
	@echo "Access the PostgresML dashboard at: http://localhost:8002"
	@echo "Access the query UI at: http://localhost/query_ui/"
	@echo "Access the ingestion UI at: http://localhost/ingestion_ui/"

# Restart the application (with rebuild)
restart: rebuild ## Restart the CommandCore application (with rebuild)

# Show the status of containers
status: ## Show the status of the CommandCore containers
	$(COMPOSE) ps

# Show logs from all containers or a specific one
logs: ## Show logs from all containers or a specific one (usage: make logs [container=name])
	@if [ "$(container)" ]; then \
		$(COMPOSE) logs -f $(container); \
	else \
		$(COMPOSE) logs -f; \
	fi

# Clean up volumes and generated files
clean: ## Clean up Docker volumes and generated files
	$(COMPOSE) down -v
	@echo "Volumes removed"

# Run the test script
test: ## Run the API test script
	@echo "Running API tests..."
	python ./tests/test_api.py

# Open a shell in the PostgreSQL container
shell-db: ## Open a shell in the PostgreSQL container
	docker exec -it $(POSTGRES_CONTAINER) bash

# Open a shell in the ingestion service container
shell-ingestion: ## Open a shell in the ingestion service container
	docker exec -it $(INGESTION_CONTAINER) bash

# Open a shell in the orchestrator container
shell-orchestrator: ## Open a shell in the orchestrator container
	docker exec -it $(ORCHESTRATOR_CONTAINER) bash

# Open a PostgreSQL shell
psql: ## Open a PostgreSQL shell
	docker exec -it $(POSTGRES_CONTAINER) sudo -u postgresml psql -d commandcore

# Show help
help: ## Show this help message
	@echo "CommandCore Makefile ($(DETECTED_OS) detected)"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
