from openai import AsyncOpenAI
from typing import List, Dict, Any
import os
from .config import settings
from .schemas import KnowledgeChunk

# Initialize the OpenAI client
client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# System prompt for the agent
SYSTEM_PROMPT = """
You are CommandCore, an AI assistant that specializes in providing accurate information about AI, cloud computing, and virtualization/OS technology.
Your responses should be based on the provided context information, and you should cite your sources.

Instructions:
1. Only answer questions based on the provided context.
2. If the context doesn't contain enough information to answer the question, say "I don't have enough information to answer this question."
3. Be concise and clear in your responses.
4. Do not make up information that is not in the context.
5. Format any code or technical terms appropriately using markdown.
"""


def create_agent():
    """Create an agent instance using OpenAI's API."""
    # For the MVP, we'll use a simple completion-based approach
    return client


async def get_agent_response(query: str, context: str, chunks: List[KnowledgeChunk]) -> str:
    """Get a response from the agent for the given query and context."""
    # Format the sources for citation
    sources = []
    for i, chunk in enumerate(chunks):
        title = chunk.source_info.get("title", "Unknown")
        author = chunk.source_info.get("author", "Unknown")
        date = chunk.source_info.get("publication_date", "Unknown")
        sources.append(f"[{i+1}] {title} by {author}, {date}")
    
    sources_text = "\n".join(sources)
    
    # Create the prompt with context and query
    user_prompt = f"""
Question: {query}

Context:
{context}

Available Sources:
{sources_text}

Please provide a comprehensive answer to the question based on the context provided. 
Cite sources using the format [1], [2], etc. corresponding to the source numbers above.
"""
    
    # Call the OpenAI API
    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.1,  # Lower temperature for more deterministic responses
        max_tokens=1000
    )
    
    # Return the generated response
    return response.choices[0].message.content
