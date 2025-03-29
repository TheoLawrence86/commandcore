import psycopg2
from psycopg2.extras import Json
from typing import List, Dict, Any
import numpy as np
import openai
from .config import settings
from .schemas import DocumentChunk


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


async def generate_embedding(text: str) -> List[float]:
    """Generate embeddings for text using OpenAI API."""
    try:
        client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        response = await client.embeddings.create(
            model="text-embedding-ada-002",
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Error generating embedding: {str(e)}")
        # Return a zero vector as fallback
        return [0.0] * 1536


async def store_chunks_in_db(conn, chunks: List[DocumentChunk], domain: str, source_info: Dict[str, Any]) -> int:
    """Store document chunks in the database."""
    cursor = conn.cursor()
    stored_count = 0
    
    try:
        for chunk in chunks:
            # Generate embedding using OpenAI API
            embedding = await generate_embedding(chunk.text)
            
            # Insert the chunk with source info
            cursor.execute(
                """
                INSERT INTO knowledge_chunks 
                (chunk_text, embedding, source_info, domain)
                VALUES 
                (%s, %s, %s, %s)
                RETURNING id
                """,
                (
                    chunk.text,
                    embedding,  # OpenAI embedding
                    Json(source_info),
                    domain
                )
            )
            stored_count += 1
        
        # Commit the transaction
        conn.commit()
    
    except Exception as e:
        # Rollback in case of error
        conn.rollback()
        raise e
    
    finally:
        cursor.close()
    
    return stored_count
