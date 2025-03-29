from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime


class SourceInfo(BaseModel):
    title: str
    author: str
    publication_date: str
    url: Optional[str] = None
    additional_notes: Optional[str] = None
    classification: Optional[str] = "public"


class ProcessingProgress(BaseModel):
    percentage: int
    current_stage: str
    estimated_completion_time: Optional[str] = None


class ProcessingStatus(BaseModel):
    status: str
    message: str
    progress: Optional[ProcessingProgress] = None
    details: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, Any]] = None


class JobStatus(BaseModel):
    job_id: str
    status: str
    file_name: str
    domain: str
    source_info: Dict[str, Any]
    created_at: str
    completed_at: Optional[str] = None
    progress: Optional[ProcessingProgress] = None
    details: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, Any]] = None


class DocumentChunk(BaseModel):
    text: str
    token_count: Optional[int] = None
    position: Optional[int] = None
    metadata: Dict[str, Any] = {}


class SupportedFileType(BaseModel):
    extension: str
    mime_type: str
    description: str
    max_size_mb: int


class Domain(BaseModel):
    id: str
    name: str
    description: str
