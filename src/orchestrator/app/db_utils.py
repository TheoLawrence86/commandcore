import psycopg2
import psycopg2.extras
from typing import List, Dict, Any, Optional
import openai
import numpy as np
from .config import settings
from .schemas import KnowledgeChunk


def get_db_connection():
    """Create a connection to the PostgreSQL database."""
    conn = psycopg2.connect(
        host=settings.POSTGRES_HOST,
        port=settings.POSTGRES_PORT,
        user=settings.POSTGRES_USER,
        password=settings.POSTGRES_PASSWORD,
        dbname=settings.POSTGRES_DB
    )
    return conn


async def generate_embedding(query: str) -> List[float]:
    """Generate embedding for the query using OpenAI API."""
    try:
        client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        response = await client.embeddings.create(
            model="text-embedding-ada-002",
            input=query
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Error generating embedding: {str(e)}")
        # Return a zero vector as fallback
        return [0.0] * 1536


async def retrieve_similar_chunks(
    conn, 
    query: str, 
    domain_filter: Optional[str] = None,
    similarity_threshold: float = 0.7,
    max_results: int = 5
) -> List[KnowledgeChunk]:
    """Retrieve chunks similar to the query from the database."""
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    chunks = []
    
    try:
        # Generate embedding for the query
        query_embedding = await generate_embedding(query)
        
        # Use the find_similar_chunks function defined in the database
        cursor.execute(
            """
            SELECT * FROM find_similar_chunks(%s, %s::vector(1536), %s, %s, %s)
            """,
            (
                query,
                query_embedding,
                domain_filter,
                similarity_threshold,
                max_results
            )
        )
        
        rows = cursor.fetchall()
        
        for row in rows:
            chunks.append(
                KnowledgeChunk(
                    id=row['id'],
                    text=row['chunk_text'],
                    source_info=row['source_info'],
                    similarity=row['similarity']
                )
            )
    
    except Exception as e:
        # Log the error (in production, use proper logging)
        print(f"Error retrieving similar chunks: {str(e)}")
        raise e
    
    finally:
        cursor.close()
    
    return chunks
