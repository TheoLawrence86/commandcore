from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime


class QueryRequest(BaseModel):
    query: str
    domain: Optional[str] = None
    conversation_id: Optional[str] = None


class SourceCitation(BaseModel):
    title: str
    author: str
    publication_date: str
    url: Optional[str] = None


class QueryResponse(BaseModel):
    query: str
    response: str
    sources: List[Dict[str, Any]] = []
    conversation_id: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


class KnowledgeChunk(BaseModel):
    id: int
    text: str
    source_info: Dict[str, Any]
    similarity: float
