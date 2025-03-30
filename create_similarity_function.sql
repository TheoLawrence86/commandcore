-- Function to find similar chunks by vector similarity
-- This function performs vector similarity search on document chunks
-- Parameters can be used with explicit type casting to avoid signature mismatch errors
CREATE OR REPLACE FUNCTION find_similar_chunks(
    query_text TEXT,
    query_embedding vector(1536),
    query_domain TEXT,
    similarity_threshold FLOAT DEFAULT 0.6,
    max_results INTEGER DEFAULT 5
) 
RETURNS TABLE (
    id INTEGER,
    chunk_text TEXT,
    similarity FLOAT,
    source_info JSONB,
    domain TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        kc.id,
        kc.chunk_text,
        1 - (kc.embedding <=> query_embedding) as similarity,
        kc.source_info,
        kc.domain
    FROM 
        knowledge_chunks kc
    WHERE 
        (query_domain IS NULL OR query_domain = 'all' OR kc.domain = query_domain)
        AND (1 - (kc.embedding <=> query_embedding)) > similarity_threshold
    ORDER BY 
        kc.embedding <=> query_embedding
    LIMIT max_results;
END;
$$;

-- Create an overloaded version of the function with explicit parameter types to match what the application might send
CREATE OR REPLACE FUNCTION find_similar_chunks(
    query_text TEXT, 
    query_embedding vector(1536),
    query_domain TEXT,
    similarity_threshold NUMERIC, 
    max_results INTEGER
) 
RETURNS TABLE (
    id INTEGER,
    chunk_text TEXT,
    similarity FLOAT,
    source_info JSONB,
    domain TEXT
) 
AS $$
    -- Call the original function with proper type casting
    SELECT * FROM find_similar_chunks(
        query_text,
        query_embedding,
        query_domain,
        similarity_threshold::FLOAT,
        max_results
    );
$$ LANGUAGE SQL;
