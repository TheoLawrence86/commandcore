from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import os
from datetime import datetime, timezone
import psycopg2
import psycopg2.extras
from openai import OpenAI, AsyncOpenAI

from .config import settings
from .db_utils import get_db_connection, retrieve_similar_chunks
from .schemas import QueryRequest, QueryResponse, KnowledgeChunk
from .agent import create_agent, get_agent_response

app = FastAPI(title="CommandCore Orchestrator Service")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For MVP, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client
client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))


@app.get("/")
async def root():
    return {"message": "CommandCore Orchestrator Service"}


@app.get("/health")
async def health_check():
    # Simple health check endpoint
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.post("/v1/query", response_model=QueryResponse)
async def process_query(query_request: QueryRequest):
    """Process a user query and return a response using RAG."""
    print(f"Received query request: {query_request}")
    try:
        # Get database connection
        print("Getting database connection...")
        conn = get_db_connection()
        
        # Retrieve similar chunks from the database
        print(f"Retrieving similar chunks for query: '{query_request.query}', domain: {query_request.domain}")
        chunks = await retrieve_similar_chunks(
            conn, 
            query_request.query, 
            domain_filter=query_request.domain if query_request.domain else None,
            max_results=5
        )
        
        print(f"Retrieved {len(chunks)} chunks")
        
        if not chunks:
            print("No relevant chunks found, returning default response")
            return QueryResponse(
                query=query_request.query,
                response="I couldn't find any relevant information to answer your query.",
                sources=[]
            )
        
        # Prepare context from chunks
        context = "\n\n".join([chunk.text for chunk in chunks])
        print(f"Prepared context with {len(context)} characters")
        
        # Get response from agent
        print("Getting response from agent...")
        response = await get_agent_response(
            query=query_request.query,
            context=context,
            chunks=chunks
        )
        print(f"Received response from agent: {response[:100]}...")
        
        # Extract unique sources from chunks
        sources = []
        source_titles = set()
        for chunk in chunks:
            title = chunk.source_info.get("title", "Unknown Source")
            if title not in source_titles:
                source_titles.add(title)
                sources.append({
                    "title": title,
                    "author": chunk.source_info.get("author", "Unknown Author"),
                    "publication_date": chunk.source_info.get("publication_date", "Unknown Date")
                })
        
        print(f"Extracted {len(sources)} unique sources")
        
        # Return response
        print("Returning response")
        return QueryResponse(
            query=query_request.query,
            response=response,
            sources=sources
        )
        
    except Exception as e:
        # Log the error (in production, use proper logging)
        print(f"Error processing query: {str(e)}")
        import traceback
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail={
                "error": {
                    "code": "QUERY_PROCESSING_ERROR",
                    "message": f"Error processing query: {str(e)}"
                }
            }
        )
