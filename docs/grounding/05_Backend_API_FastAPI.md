# Backend API with FastAPI

## Definition

**FastAPI** is a modern, high-performance web framework for building APIs with Python. It is based on standard Python type hints and leverages these for automatic data validation, serialisation, and documentation generation.

## Role in CommandCore

FastAPI powers the Ingestion Web Service in CommandCore, providing:

- **API Endpoints**: Particularly the `/upload/` endpoint that receives documents from the frontend
- **File Processing**: Handling uploaded documents for ingestion into the knowledge base
- **Domain Selection**: Routing documents to the appropriate PostgresML node based on domain
- **Background Processing**: Managing potentially lengthy document processing without blocking the user interface
- **Error Handling**: Providing clear feedback on processing success or failure

## Key Features Used (2025 Update)

### Enhanced File Upload Handling

```python
@app.post("/upload/")
async def upload_document(
    request: Request,
    background_tasks: BackgroundTasks,
    domain: str = Form(...),
    source_info: str = Form(...)
):
    # Validate inputs
    if domain not in ["ai", "cloud", "virt-os"]:
        raise HTTPException(status_code=400, detail="Invalid domain")
    
    # Parse source info from JSON string
    try:
        source_data = json.loads(source_info)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid source info format")
    
    # Process large files using chunked streaming
    temp_path = Path(f"/tmp/{uuid.uuid4()}")
    async with aiofiles.open(temp_path, "wb") as f:
        async for chunk in request.stream():
            await f.write(chunk)
    
    # Process file in background with priority and retries
    background_tasks.add_task(
        process_document,
        file_path=temp_path,
        domain=domain,
        source_info=source_data,
        priority="high",
        max_retries=3
    )
    
    return {"status": "processing", "message": "Document upload accepted and processing started"}
```

### Advanced Background Tasks

FastAPI's enhanced `BackgroundTasks` feature now supports priority queues and automatic retries:

```python
async def process_document(
    file_path: Path,
    domain: str,
    source_info: dict,
    priority: str = "normal",
    max_retries: int = 3
):
    try:
        # Read file content with proper cleanup
        text = await read_file_content(file_path)
        finally:
            file_path.unlink()  # Clean up temp file
        
        # Chunk the text
        chunks = chunk_text(text)
        
        # Connect to the appropriate PostgresML node based on domain
        async with get_db_connection(domain) as conn:
            # For each chunk, generate embedding and store in database
            for chunk in chunks:
                # Generate embedding using pgml.embed
                embedding = await generate_embedding(conn, chunk)
                
                # Store chunk and embedding with retry logic
                await store_chunk_with_retry(
                    conn,
                    domain,
                    chunk,
                    embedding,
                    source_info,
                    max_retries=max_retries
                )
    except Exception as e:
        logger.error(f"Document processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Processing failed")
```

### Enhanced Data Validation

FastAPI uses Pydantic v2 models for robust request and response validation:

```python
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict

class SourceInfo(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    author: str = Field(..., min_length=1, max_length=100)
    publication_date: Optional[datetime] = None
    url: Optional[str] = Field(None, pattern="^https?://.*")
    additional_metadata: Optional[Dict] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "title": "Understanding AI Systems",
                "author": "Jane Smith",
                "publication_date": "2025-03-29T12:00:00Z",
                "url": "https://example.com/article",
                "additional_metadata": {"category": "AI"}
            }
        }

@app.post("/upload-with-validation/")
async def upload_with_validation(
    file: UploadFile = File(..., description="Document to process"),
    domain: str = Form(..., pattern="^(ai|cloud|virt-os)$"),
    source_info: SourceInfo
):
    # Pydantic handles validation automatically
    # ...
```

## Security Best Practices

- **File Validation**: Strict MIME type checking and virus scanning
- **Resource Limits**: Configurable upload size limits and concurrent task limits
- **Error Handling**: Secure error messages that don't leak sensitive information
- **Authentication**: JWT-based authentication with role-based access control
- **Rate Limiting**: Configurable rate limits per endpoint and user

## Official Documentation

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Starlette Documentation](https://www.starlette.io/) (FastAPI is built on Starlette)
- [Pydantic v2 Documentation](https://docs.pydantic.dev/)
