# Database: PostgreSQL, PostgresML, and pgvector

## Definition

**PostgreSQL** is a powerful, open-source object-relational database system with over 30 years of active development. It is known for reliability, feature robustness, and performance.

**PostgresML** is an extension for PostgreSQL that brings machine learning capabilities directly into the database. It provides GPU-accelerated training, inference, and embedding generation without exporting data to external services.

**pgvector** is a PostgreSQL extension that adds support for vector similarity search, enabling efficient semantic search operations on vector embeddings.

## Role in CommandCore

### PostgreSQL

Serves as the robust, secure foundation for storing:
- Text chunks from ingested documents
- Vector embeddings representing semantic meaning
- Metadata about documents (domain, source information, timestamps)
- Relationships between chunks and their sources

### PostgresML

Provides GPU-accelerated in-database machine learning capabilities:
- `pgml.embed`: Generates vector embeddings from text chunks and queries directly within the database
- `pgml.transform`: Enables in-database LLM inference for answer synthesis, keeping sensitive data secure
- Model management: Loads, manages, and utilises ML models within the SQL environment
- GPU acceleration: Supports multiple deployment tiers for scalable GPU resources
- Performance: Achieves 8-40x faster inference compared to CPU-only setups

### pgvector

Enables efficient semantic search over text chunk embeddings with 2025 updates:
- Vector data type: Stores high-dimensional embeddings efficiently
- Enhanced filtering: Improved PostgreSQL query planner decisions for ANN index usage
- Similarity search: Finds semantically similar content using cosine similarity, dot product, or L2 distance
- Advanced indexing: Supports HNSW (Hierarchical Navigable Small World) or IVFFlat indexes with iterative index scans to prevent overfiltering

## Key Features Used

### SQL Tables and Schema

```sql
CREATE TABLE knowledge_chunks (
    id SERIAL PRIMARY KEY,
    domain TEXT NOT NULL,
    source_info JSONB NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding vector(1536), -- Dimension depends on model
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);
```

### Vector Operations

- Vector similarity search using operators like `<=>` (cosine distance)
- Enhanced vector indexing for optimised performance

```sql
-- Example vector index creation with improved 2025 settings
CREATE INDEX ON knowledge_chunks 
USING hnsw (embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);
```

### PostgresML Functions

```sql
-- Loading an embedding model with GPU acceleration
SELECT pgml.load_model(
    'text-embedding-ada-002',
    'openai',
    '{
        "api_key": "your-api-key",
        "device": "cuda",
        "batch_size": 32
    }'
);

-- Generating embeddings with GPU acceleration
UPDATE knowledge_chunks
SET embedding = pgml.embed(
    'text-embedding-ada-002',
    chunk_text,
    '{"device": "cuda"}'
);

-- In-database inference with GPU acceleration
SELECT pgml.transform(
    'llm-model-name',
    'Generate an answer based on this context: ' || context_text || ' Question: ' || query_text,
    '{"device": "cuda"}'
);
```

## Official Documentation

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostgresML Documentation](https://postgresml.org/docs/)
- [pgvector Documentation](https://github.com/pgvector/pgvector)

## Deployment Options (2025)

### PostgresML GPU Acceleration Tiers
- **Seriz (Free)**: Basic GPU access for small-scale projects
- **Dedicated**: Isolated GPU resources for enterprise-grade security
- **Enterprise**: Full GPU clusters for mission-critical applications

### Docker Deployment with GPU Support
```bash
docker run --gpus all ghcr.io/postgresml/postgresml:2.9.3
