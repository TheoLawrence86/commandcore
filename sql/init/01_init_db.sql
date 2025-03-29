-- PostgreSQL with pgvector initialization script for CommandCore

-- Create necessary extensions
CREATE EXTENSION IF NOT EXISTS vector;

-- Create knowledge_chunks table for storing document chunks and embeddings
CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id SERIAL PRIMARY KEY,
    chunk_text TEXT NOT NULL,
    embedding vector(1536) NOT NULL,  -- Using 1536 dimensions for OpenAI embeddings
    source_info JSONB NOT NULL,
    domain TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for optimized search
-- HNSW index for vector similarity search
CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx 
ON knowledge_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (
    ef_construction = 64,
    m = 16
);

-- Text search index for keyword-based filtering
CREATE INDEX IF NOT EXISTS knowledge_chunks_text_idx 
ON knowledge_chunks 
USING GIN (to_tsvector('english', chunk_text));

-- Domain index for filtering by domain
CREATE INDEX IF NOT EXISTS knowledge_chunks_domain_idx 
ON knowledge_chunks (domain);

-- Create helpful view
CREATE OR REPLACE VIEW knowledge_chunks_view AS
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
    (source_info->>'publication_date')::date as publication_date
FROM
    knowledge_chunks;

-- Function to find similar chunks to a query
CREATE OR REPLACE FUNCTION find_similar_chunks(
    query_text TEXT,
    query_embedding vector(1536),
    domain_filter TEXT DEFAULT NULL,
    similarity_threshold FLOAT DEFAULT 0.7,
    max_results INT DEFAULT 5
)
RETURNS TABLE (
    id INT,
    chunk_text TEXT,
    source_info JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Return similar chunks
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
    -- This function is a placeholder since we'll generate embeddings via API
    -- The actual embedding update will happen in the application code
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for timestamp updates
CREATE TRIGGER update_timestamp
    BEFORE UPDATE ON knowledge_chunks
    FOR EACH ROW
    EXECUTE FUNCTION update_embedding_on_text_change();
