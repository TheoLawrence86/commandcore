# Data Schema

This document defines the database schema for the CommandCore system, focusing on the structure of the knowledge storage and retrieval system.

## PostgresML Node Schema

Each PostgresML node (postgres-ai, postgres-cloud, postgres-virt-os) will have the same schema structure but will contain domain-specific data.

### Extensions

The following PostgreSQL extensions are required:

```sql
-- Vector similarity search extension
CREATE EXTENSION IF NOT EXISTS vector;

-- PostgresML extension for in-database ML
CREATE EXTENSION IF NOT EXISTS pgml;
```

### Tables

#### knowledge_chunks

The primary table for storing document chunks and their embeddings:

```sql
CREATE TABLE knowledge_chunks (
    id SERIAL PRIMARY KEY,
    chunk_text TEXT NOT NULL,
    embedding vector(1536) NOT NULL,  -- Dimension depends on the embedding model used
    source_info JSONB NOT NULL,
    domain TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) PARTITION BY LIST (domain);  -- Partitioning for improved scalability
```

#### Field Descriptions:

- **id**: Unique identifier for each chunk
- **chunk_text**: The actual text content of the chunk
- **embedding**: Vector representation of the chunk's semantic meaning
  - Dimension (1536) is based on the chosen embedding model
  - Can be adjusted based on the specific model selected
- **source_info**: JSON object containing metadata about the source document
  - Structure defined below
- **domain**: The knowledge domain this chunk belongs to
  - Values: 'ai', 'cloud', 'virt-os'
- **created_at**: Timestamp when the chunk was added
- **updated_at**: Timestamp when the chunk was last modified

#### source_info JSON Structure:

```json
{
  "title": "Document title",
  "author": "Document author(s)",
  "publication_date": "2023-03-15",  // ISO format date
  "url": "https://source-url.com/document",  // Optional
  "file_type": "pdf",  // Original file type
  "additional_metadata": {
    // Any additional domain-specific metadata
    "version": "1.0",
    "publisher": "Publisher name",
    "category": "Specific category within domain",
    "model_version": "1.0",  // Embedding model version
    "last_embedding_update": "2025-03-29T10:36:07Z"  // Timestamp of last embedding update
  }
}
```

### Indexes

To optimise vector similarity search performance:

```sql
-- HNSW (Hierarchical Navigable Small World) index for fast approximate nearest neighbour search
CREATE INDEX ON knowledge_chunks USING hnsw (embedding vector_cosine_ops)
WITH (
    ef_construction = 64,   -- Optimised for build time vs accuracy trade-off
    m = 16,                 -- Number of connections per layer
    ef_search = 100        -- Search quality parameter
);

-- Text search index for potential keyword-based filtering
CREATE INDEX ON knowledge_chunks USING GIN (to_tsvector('english', chunk_text));

-- Domain index for quick filtering by domain
CREATE INDEX ON knowledge_chunks (domain);

-- Created_at index for time-based queries
CREATE INDEX ON knowledge_chunks (created_at);

-- Composite index for domain-based queries with time filtering
CREATE INDEX ON knowledge_chunks (domain, created_at);
```

### Views

For simplified access to common query patterns:

```sql
-- View that includes similarity calculation helpers
CREATE VIEW knowledge_chunks_view AS
SELECT
    id,
    chunk_text,
    embedding,
    source_info,
    domain,
    created_at,
    updated_at,
    source_info->>'title' as title,
    source_info->>'author' as author,
    (source_info->>'publication_date')::date as publication_date,
    source_info->'additional_metadata'->>'model_version' as model_version
FROM
    knowledge_chunks;
```

## Functions

Helper functions for common operations:

```sql
-- Function to find similar chunks to a query with streaming support
CREATE OR REPLACE FUNCTION find_similar_chunks(
    query_text TEXT,
    domain_filter TEXT DEFAULT NULL,
    similarity_threshold FLOAT DEFAULT 0.7,
    max_results INT DEFAULT 5,
    batch_size INT DEFAULT 1000
)
RETURNS TABLE (
    id INT,
    chunk_text TEXT,
    source_info JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
DECLARE
    query_embedding vector;
    batch_counter INT := 0;
BEGIN
    -- Generate embedding for the query using latest model
    SELECT pgml.embed('intfloat/e5-base-v2', query_text) INTO query_embedding;
    
    -- Return similar chunks with batched processing
    RETURN QUERY
    SELECT
        kc.id,
        kc.chunk_text,
        kc.source_info,
        1 - (kc.embedding <=> query_embedding) AS similarity
    FROM
        knowledge_chunks kc
    WHERE
        (domain_filter IS NULL OR kc.domain = domain_filter)
        AND 1 - (kc.embedding <=> query_embedding) > similarity_threshold
    ORDER BY
        kc.embedding <=> query_embedding
    LIMIT max_results;
END;
$$;

-- Function to update embeddings when source text changes
CREATE OR REPLACE FUNCTION update_embedding_on_text_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.chunk_text <> OLD.chunk_text THEN
        NEW.embedding := pgml.embed('intfloat/e5-base-v2', NEW.chunk_text);
        NEW.updated_at := NOW();
        NEW.source_info := jsonb_set(
            NEW.source_info,
            '{additional_metadata,last_embedding_update}',
            to_jsonb(NOW()::text)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_embedding
    BEFORE UPDATE ON knowledge_chunks
    FOR EACH ROW
    EXECUTE FUNCTION update_embedding_on_text_change();
```

## Model Management

SQL commands for managing the embedding and LLM models:

```sql
-- Load the embedding model (updated to latest version)
SELECT pgml.load_model(
    'intfloat/e5-base-v2',    -- Updated model name
    'huggingface',            -- Model source
    '{
        "quantize": true,     -- Enable model quantisation for better performance
        "device": "cuda"      -- Use GPU if available
    }'
);

-- Load an LLM for in-database synthesis (if used)
SELECT pgml.load_model(
    'meta-llama/Llama-2-7b-hf',  -- Updated model name
    'huggingface',               -- Model source
    '{
        "quantize": true,
        "device": "cuda"
    }'
);
```

## Database Initialisation

The initialisation script will:

1. Create the required extensions
2. Create the partitioned knowledge_chunks table
3. Create the necessary indexes
4. Create helper views and functions
5. Load the required ML models
6. Set up monitoring and performance tracking

This script will be run when each PostgresML container is first initialised, ensuring consistent schema across all domain nodes.

## Performance Monitoring

For optimal performance:

- Allocate 25-40% of available RAM to `shared_buffers`
- Use SSDs for I/O-intensive workloads
- Monitor index usage with `pg_stat_user_indexes`
- Use `EXPLAIN ANALYZE` for query optimisation
- Implement batch processing for large vector operations
- Consider read replicas for heavy query loads

## Security Considerations

- Implement row-level security for domain-specific access
- Use connection pooling to manage database connections
- Regular backup of vector data alongside traditional data
- Monitor and audit vector operation performance
