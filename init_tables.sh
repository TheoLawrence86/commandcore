#!/bin/bash
# Script to initialize the knowledge_chunks table

echo "Creating knowledge_chunks table in commandcore database..."

# Create the knowledge_chunks table
docker exec commandcore-postgresml sudo -u postgresml psql -d commandcore -c "
CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id SERIAL PRIMARY KEY,
    chunk_text TEXT NOT NULL,
    embedding vector(1536) NOT NULL,  -- Using 1536 dimensions for OpenAI embeddings
    source_info JSONB NOT NULL,
    domain TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);"

# Create HNSW index for vector similarity search
docker exec commandcore-postgresml sudo -u postgresml psql -d commandcore -c "
CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx 
ON knowledge_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (
    ef_construction = 64,
    m = 16
);"

# Create text search index
docker exec commandcore-postgresml sudo -u postgresml psql -d commandcore -c "
CREATE INDEX IF NOT EXISTS knowledge_chunks_text_idx 
ON knowledge_chunks 
USING GIN (to_tsvector('english', chunk_text));"

# Create domain index
docker exec commandcore-postgresml sudo -u postgresml psql -d commandcore -c "
CREATE INDEX IF NOT EXISTS knowledge_chunks_domain_idx 
ON knowledge_chunks (domain);"

# Create helpful view
docker exec commandcore-postgresml sudo -u postgresml psql -d commandcore -c "
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
    knowledge_chunks;"

# Create update timestamp function
docker exec commandcore-postgresml sudo -u postgresml psql -d commandcore -c "
CREATE OR REPLACE FUNCTION update_timestamp_function() 
RETURNS TRIGGER LANGUAGE plpgsql AS 'BEGIN NEW.updated_at := NOW(); RETURN NEW; END;';"

# Create trigger for timestamp updates
docker exec commandcore-postgresml sudo -u postgresml psql -d commandcore -c "
CREATE TRIGGER update_timestamp
    BEFORE UPDATE ON knowledge_chunks
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_function();"

if [ $? -eq 0 ]; then
  echo "✅ Tables and indexes created successfully!"
else
  echo "❌ Failed to create tables. Check the container logs for details."
  exit 1
fi

exit 0
