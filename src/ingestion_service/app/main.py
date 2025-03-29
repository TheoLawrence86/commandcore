from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ValidationError
import uuid
import json
import os
import asyncio
from datetime import datetime, timezone
import psycopg2
from psycopg2.extras import Json
from typing import Dict, List, Optional, Any
import shutil

from .document_processor import process_document, extract_text_from_file, extract_metadata_from_file
from .db_utils import get_db_connection, store_chunks_in_db
from .schemas import SourceInfo, ProcessingStatus, JobStatus, SupportedFileType, Domain
from .config import settings

app = FastAPI(title="CommandCore Ingestion Service")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For MVP, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dictionary to store job statuses in-memory (for MVP)
# In production, this would be stored in a proper database
job_statuses = {}


@app.get("/")
async def root():
    return {"message": "CommandCore Ingestion Service"}


@app.get("/health")
async def health_check():
    # Simple health check endpoint
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.post("/v1/documents/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    domain: str = Form(...),
    source_info: str = Form(...)
):
    # Validate domain
    if domain not in ["ai", "cloud", "virt-os"]:
        raise HTTPException(
            status_code=400,
            detail={
                "error": {
                    "code": "INVALID_DOMAIN",
                    "message": "Invalid domain. Must be one of: ai, cloud, virt-os"
                }
            }
        )
    
    # Validate source_info JSON format
    try:
        source_info_dict = json.loads(source_info)
        source_info_obj = SourceInfo(**source_info_dict)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=400,
            detail={
                "error": {
                    "code": "INVALID_SOURCE_INFO",
                    "message": "Invalid source_info format. Must be a valid JSON string"
                }
            }
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=400,
            detail={
                "error": {
                    "code": "INVALID_SOURCE_INFO",
                    "message": f"Invalid source info structure: {str(e)}"
                }
            }
        )
    
    # Validate file type
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in ['.txt', '.pdf', '.docx']:
        raise HTTPException(
            status_code=400,
            detail={
                "error": {
                    "code": "UNSUPPORTED_FILE_TYPE",
                    "message": "Unsupported file type. Supported types: txt, pdf, docx"
                }
            }
        )
    
    # Generate a job ID
    job_id = str(uuid.uuid4())
    
    # Create upload directory if it doesn't exist
    upload_dir = os.path.join(settings.UPLOAD_DIR, job_id)
    os.makedirs(upload_dir, exist_ok=True)
    
    # Save the uploaded file
    file_path = os.path.join(upload_dir, file.filename)
    
    # Write the file to disk
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Set initial job status
    job_statuses[job_id] = {
        "status": "processing",
        "message": "Document upload received, processing started",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "file_name": file.filename,
        "domain": domain,
        "source_info": source_info_dict,
        "progress": {
            "percentage": 0,
            "current_stage": "file_saving"
        }
    }
    
    # Add background task to process the document
    background_tasks.add_task(
        process_document_task,
        job_id=job_id,
        file_path=file_path,
        domain=domain,
        source_info=source_info_dict
    )
    
    # Return accepted response with job ID
    return {
        "status": "processing",
        "message": "Document upload accepted and processing started",
        "job_id": job_id,
        "estimated_completion_time": datetime.now(timezone.utc).isoformat()
    }


@app.get("/v1/documents/status/{job_id}")
async def check_status(job_id: str):
    if job_id not in job_statuses:
        raise HTTPException(
            status_code=404,
            detail={
                "error": {
                    "code": "JOB_NOT_FOUND",
                    "message": "Job ID not found"
                }
            }
        )
    
    return job_statuses[job_id]


@app.get("/v1/system/supported-file-types")
async def get_supported_file_types():
    supported_types = [
        SupportedFileType(
            extension="txt",
            mime_type="text/plain",
            description="Plain text files",
            max_size_mb=10
        ),
        SupportedFileType(
            extension="pdf",
            mime_type="application/pdf",
            description="PDF documents",
            max_size_mb=10
        ),
        SupportedFileType(
            extension="docx",
            mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            description="Microsoft Word documents",
            max_size_mb=10
        )
    ]
    
    return {
        "supported_file_types": [t.dict() for t in supported_types],
        "version": "1.0",
        "last_updated": datetime.now(timezone.utc).isoformat()
    }


@app.get("/v1/system/domains")
async def get_domains():
    domains = [
        Domain(
            id="ai",
            name="Artificial Intelligence",
            description="AI and machine learning related documents"
        ),
        Domain(
            id="cloud",
            name="Cloud Computing",
            description="Cloud infrastructure and services documentation"
        ),
        Domain(
            id="virt-os",
            name="Virtual Operating Systems",
            description="Virtualisation and OS-level documentation"
        )
    ]
    
    return {
        "domains": [d.dict() for d in domains],
        "version": "1.0",
        "last_updated": datetime.now(timezone.utc).isoformat()
    }


async def process_document_task(job_id: str, file_path: str, domain: str, source_info: Dict):
    try:
        # Update job status to text extraction
        job_statuses[job_id]["status"] = "processing"
        job_statuses[job_id]["progress"] = {
            "percentage": 10,
            "current_stage": "text_extraction"
        }
        
        # Extract metadata from file
        extracted_metadata = extract_metadata_from_file(file_path)
        
        # Update source_info with extracted metadata if available
        if extracted_metadata:
            # Only use extracted metadata if the user provided default/placeholder values
            if source_info.get("title") in ["Untitled Document", "Unknown", None] and extracted_metadata.get("title"):
                source_info["title"] = extracted_metadata["title"]
                
            if source_info.get("author") in ["Unknown Author", "Unknown", None] and extracted_metadata.get("author"):
                source_info["author"] = extracted_metadata["author"]
                
            if source_info.get("publication_date") in ["2023-01-01", None] and extracted_metadata.get("publication_date"):
                source_info["publication_date"] = extracted_metadata["publication_date"]
            
            # Update job status with extracted metadata
            job_statuses[job_id]["extracted_metadata"] = extracted_metadata
            job_statuses[job_id]["source_info"] = source_info
        
        # Extract text from file
        text = extract_text_from_file(file_path)
        
        # Update job status to chunking
        job_statuses[job_id]["progress"] = {
            "percentage": 30,
            "current_stage": "chunking"
        }
        
        # Process document into chunks
        chunks = process_document(text)
        
        # Update job status to embedding generation
        job_statuses[job_id]["progress"] = {
            "percentage": 50,
            "current_stage": "embedding_generation"
        }
        
        # Store chunks in database
        conn = get_db_connection()
        stored_count = await store_chunks_in_db(conn, chunks, domain, source_info)
        conn.close()
        
        # Update job status to completed
        job_statuses[job_id] = {
            "status": "completed",
            "message": "Document processed successfully",
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "details": {
                "chunks_created": stored_count,
                "domain": domain,
                "document_title": source_info.get("title", "Unknown"),
                "document_author": source_info.get("author", "Unknown"),
                "document_date": source_info.get("publication_date", "Unknown"),
                "metadata_extracted": bool(extracted_metadata),
                "processing_time": "N/A"  # Could calculate actual time in production
            }
        }
        
    except Exception as e:
        # Update job status to failed
        job_statuses[job_id] = {
            "status": "failed",
            "message": "Document processing failed",
            "error": {
                "code": "PROCESSING_ERROR",
                "message": str(e)
            }
        }
        # In a production environment, we would log this error
        print(f"Error processing document: {str(e)}")
