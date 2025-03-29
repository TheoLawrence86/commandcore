# CommandCore Makefile - Cross-platform compatible

.PHONY: start stop restart status logs clean test shell-db shell-ingestion shell-orchestrator help rebuild

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
POSTGRES_CONTAINER := commandcore-postgres
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

# Rebuild and restart the application
rebuild: ## Rebuild and restart the CommandCore application
	@echo "Rebuilding CommandCore on $(DETECTED_OS)..."
	$(COMPOSE) down
	$(COMPOSE) up -d --build
	@echo "Waiting for PostgreSQL to be ready..."
	@$(SHELL_CMD) -c "sleep 15"
	@echo "CommandCore has been rebuilt and restarted!"
	@echo "Access the web interface at: http://localhost"
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
	docker exec -it $(POSTGRES_CONTAINER) psql -U postgres -d commandcore

# Show help
help: ## Show this help message
	@echo "CommandCore Makefile ($(DETECTED_OS) detected)"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
