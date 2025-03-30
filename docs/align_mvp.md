# CommandCore MVP Alignment Tasks

This document provides a structured task list to align the MVP tasks with the documentation intent. Each task includes a checkbox for tracking progress.

## Phase 1: Infrastructure Overhaul (Switching to PostgresML)

### Update docker-compose.yml
- [x] Replace Postgres service definition:
  - [x] Remove `image: pgvector/pgvector:pg16`
  - [x] Add `image: ghcr.io/postgresml/postgresml:2.9.3` (or newer stable version)
  - [x] Update container name (e.g., `commandcore-postgresml`)
  - [x] Keep environment variables (POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB)
  - [x] Keep volume mapping for data (`postgres_data:/var/lib/postgresql/data`)
  - [x] Keep init script mapping (`./sql/init:/docker-entrypoint-initdb.d`)
  - [x] Update healthcheck if needed (pg_isready should still work)
  - [x] (Optional) For GPU acceleration, add deploy resources configuration

- [x] Update service dependencies:
  - [x] Update ingestion_service and orchestrator `depends_on` to reference new PostgresML service
  - [x] Update POSTGRES_HOST in environments to point to new service name

### Update SQL Init Scripts
- [x] Modify `sql/init/01_init_db.sql`:
  - [x] Add `CREATE EXTENSION IF NOT EXISTS vector;` for vector support
  - [x] Change embedding dimension from vector(1024) to vector(1536) for OpenAI embeddings
  - [x] Create and properly deploy the `find_similar_chunks` function:
    - [x] Move function to separate SQL file for better maintenance
    - [x] Ensure proper parameter naming (`query_domain` instead of `domain`)
    - [x] Add proper NULL handling for "All Domains" selection
    - [x] Implement overloaded function variants to handle type conversion
    - [x] Automate function deployment on system startup
  - [x] Ensure consistent function signatures to avoid type mismatches

- [x] Update PostgresML setup process:
  - [x] Create proper extension loading sequence in Makefile
  - [x] Add SQL function deployment step to PostgresML setup process
  - [x] Implement error handling for extension loading
  - [x] Ensure vector extension is loaded before table creation

### Update Management Scripts
- [x] Update Makefile:
  - [x] Add `pgml-functions` target to deploy SQL functions automatically
  - [x] Update PostgresML setup process to include function deployment
  - [x] Add `vector` extension creation to table setup
  - [x] Remove calls to deprecated `load_models.sh`

- [x] Update run.py:
  - [x] Update database service references
  - [x] Adjust wait times/logic for PostgresML initialization

## Phase 2: Refactor Orchestrator (Implement Agents SDK)

### Update Requirements
- [ ] Modify `src/orchestrator/requirements.txt`:
  - [ ] Ensure OpenAI library version supports Agents SDK
  - [ ] Remove unnecessary dependencies (e.g., numpy if not needed)

### Refactor Agent Logic
- [ ] Update `src/orchestrator/app/agent.py`:
  - [ ] Add imports from OpenAI Agents SDK
  - [ ] Define domain query tools:
    - [ ] Create `ai_knowledge_tool(query: str) -> dict`
    - [ ] Create `cloud_knowledge_tool(query: str) -> dict`
    - [ ] Create `virt_os_knowledge_tool(query: str) -> dict`
    - [ ] Add appropriate docstrings for each tool
  - [ ] Implement tool functions to:
    - [ ] Connect to database
    - [ ] Execute find_similar_chunks SQL function with query text
    - [ ] Process and format returned chunks
    - [ ] Return properly formatted context and sources
  - [ ] Create agent instance and runner:
    ```python
    commandcore_agent = Agent(
        name="CommandCoreAgent",
        instructions=SYSTEM_PROMPT,
        model=settings.OPENAI_MODEL,
        tools=domain_tools
    )
    agent_runner = Runner(commandcore_agent)
    ```
  - [ ] Remove old agent logic

- [ ] Update `src/orchestrator/app/db_utils.py`:
  - [ ] Remove `generate_embedding` function
  - [ ] Simplify or remove `retrieve_similar_chunks` function
  - [ ] Create helper function for executing SQL with params if needed

- [ ] Update `src/orchestrator/app/main.py`:
  - [ ] Instantiate the agent_runner from agent.py
  - [ ] Refactor query endpoint (/v1/query):
    - [ ] Remove direct calls to retrieve_similar_chunks
    - [ ] Implement agent runner call: `result = await agent_runner.run({"task": query_request.query, "domain": query_request.domain})`
    - [ ] Extract final answer and sources from result object
    - [ ] Populate and return QueryResponse
  - [ ] Remove unused imports and functions

## Phase 3: Refactor Ingestion Service (Use OpenAI Embeddings Temporarily)

### Update Requirements
- [x] Modify `src/ingestion_service/requirements.txt`:
  - [x] Add OpenAI dependency for generating embeddings
  - [x] Add asyncpg for potential async database operations
  - [x] Keep psycopg2 for database connectivity

### Refactor Document Processing
- [x] Update `src/ingestion_service/app/document_processor.py`:
  - [x] Keep text cleaning and chunking functionality
  - [x] Adjust chunking for compatibility with OpenAI embeddings

- [x] Update `src/ingestion_service/app/db_utils.py`:
  - [x] Implement `generate_embedding` function using OpenAI API:
    ```python
    async def generate_embedding(text: str) -> List[float]:
        """Generate embeddings for text using OpenAI API."""
        try:
            client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
            response = await client.embeddings.create(
                input=text,
                model="text-embedding-ada-002"
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            # Return zero vector if embedding generation fails
            return [0.0] * 1536
    ```
  - [x] Update `store_chunks_in_db` to use OpenAI embeddings
  - [x] Standardise database operations using psycopg2

## Phase 4: Testing and Validation

### Run Tests
- [x] Execute test suite:
  - [x] Verify Docker containers start correctly
  - [x] Debug extension loading issues
  - [x] Fix SQL function parameter naming and type handling

### Manual End-to-End Testing
- [x] Start the system:
  - [x] Run `make start` to launch all containers
  - [x] Check Docker logs for PostgresML startup
  - [x] Verify extension creation and SQL function deployment

- [x] Test querying:
  - [x] Use Query UI to ask relevant questions
  - [x] Confirm SQL function works with domain filtering
  - [x] Fix vector similarity search for both specific domains and "All Domains"

## Phase 5: Documentation Cleanup

### Update Documentation
- [ ] Update README.md with new architecture details
- [ ] Update architecture documentation in docs/architecture/
- [ ] Update grounding documentation in docs/grounding/
- [ ] Update SETUP.md with new PostgresML setup instructions
- [ ] Ensure consistency regarding:
  - [ ] Database configuration
  - [ ] Embedding model specification
  - [ ] Orchestration method
  - [ ] Vector dimensions
