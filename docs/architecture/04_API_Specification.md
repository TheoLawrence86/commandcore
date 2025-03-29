# API Specification

This document defines the API endpoints for the CommandCore system, focusing on the Ingestion Service API that handles document uploads and processing.

## Ingestion Service API

The Ingestion Service provides endpoints for uploading documents and managing the knowledge base.

### Base URL

```
http://localhost:8000
```

### Authentication and Security

The API implements OAuth 2.1 authentication with JWT tokens. All endpoints require valid authentication tokens except where noted.

**Security Features:**
- TLS 1.3 encryption required for all connections
- Rate limiting: 100 requests per minute per client
- JWT tokens with 1-hour expiry
- Request signing required for sensitive operations

### Common Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-Request-ID: <unique_request_id>
```

### Endpoints

#### 1. Upload Document

Uploads a document to be processed and added to the knowledge base.

- **URL**: `/v1/documents/upload`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Rate Limit**: 10 uploads per minute

**Request Parameters:**

| Parameter   | Type   | Required | Description                                           |
|-------------|--------|----------|-------------------------------------------------------|
| file        | File   | Yes      | The document file to upload                           |
| domain      | String | Yes      | Knowledge domain (ai, cloud, or virt-os)              |
| source_info | String | Yes      | JSON string containing metadata about the document    |

**source_info JSON Structure:**

```json
{
  "title": "Document title",
  "author": "Document author(s)",
  "publication_date": "2025-03-29",
  "url": "https://source-url.com/document",
  "additional_notes": "Any additional information about the document",
  "classification": "public|internal|confidential"
}
```

**Successful Response:**

- **Status Code**: `202 Accepted`
- **Content-Type**: `application/json`

```json
{
  "status": "processing",
  "message": "Document upload accepted and processing started",
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "estimated_completion_time": "2025-03-29T11:38:33Z"
}
```

**Error Responses:**

- **Status Code**: `400 Bad Request`
- **Content-Type**: `application/json`

```json
{
  "error": {
    "code": "INVALID_DOMAIN",
    "message": "Invalid domain. Must be one of: ai, cloud, virt-os",
    "request_id": "req_abc123"
  }
}
```

OR

```json
{
  "error": {
    "code": "INVALID_SOURCE_INFO",
    "message": "Invalid source_info format. Must be a valid JSON string",
    "request_id": "req_def456"
  }
}
```

OR

```json
{
  "error": {
    "code": "UNSUPPORTED_FILE_TYPE",
    "message": "Unsupported file type. Supported types: txt, pdf",
    "request_id": "req_ghi789"
  }
}
```

- **Status Code**: `413 Payload Too Large`
- **Content-Type**: `application/json`

```json
{
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File too large. Maximum size is 10MB",
    "request_id": "req_jkl012"
  }
}
```

- **Status Code**: `429 Too Many Requests`
- **Content-Type**: `application/json`

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 30 seconds",
    "request_id": "req_mno345",
    "retry_after": 30
  }
}
```

- **Status Code**: `500 Internal Server Error`
- **Content-Type**: `application/json`

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An error occurred while processing the document",
    "request_id": "req_pqr678"
  }
}
```

#### 2. Check Processing Status

Checks the status of a document processing job.

- **URL**: `/v1/documents/status/{job_id}`
- **Method**: `GET`

**URL Parameters:**

| Parameter | Type   | Required | Description                    |
|-----------|--------|----------|--------------------------------|
| job_id    | String | Yes      | ID of the processing job       |

**Successful Response:**

- **Status Code**: `200 OK`
- **Content-Type**: `application/json`

```json
{
  "status": "completed",
  "message": "Document processed successfully",
  "details": {
    "chunks_created": 15,
    "domain": "ai",
    "document_title": "Introduction to Machine Learning",
    "processing_time": "45.2s"
  }
}
```

OR

```json
{
  "status": "processing",
  "message": "Document is still being processed",
  "progress": {
    "percentage": 45,
    "current_stage": "text_extraction",
    "estimated_completion_time": "2025-03-29T10:45:33Z"
  }
}
```

OR

```json
{
  "status": "failed",
  "message": "Document processing failed",
  "error": {
    "code": "PROCESSING_ERROR",
    "message": "Error details",
    "request_id": "req_stu901"
  }
}
```

**Error Responses:**

- **Status Code**: `404 Not Found`
- **Content-Type**: `application/json`

```json
{
  "error": {
    "code": "JOB_NOT_FOUND",
    "message": "Job ID not found",
    "request_id": "req_vwx234"
  }
}
```

#### 3. Get Supported File Types

Returns the list of currently supported file types for document upload.

- **URL**: `/v1/system/supported-file-types`
- **Method**: `GET`
- **Authentication**: Not required

**Successful Response:**

- **Status Code**: `200 OK`
- **Content-Type**: `application/json`

```json
{
  "supported_file_types": [
    {
      "extension": "txt",
      "mime_type": "text/plain",
      "description": "Plain text files",
      "max_size_mb": 10
    },
    {
      "extension": "pdf",
      "mime_type": "application/pdf",
      "description": "PDF documents",
      "max_size_mb": 10
    }
  ],
  "version": "1.0",
  "last_updated": "2025-03-29T10:38:33Z"
}
```

#### 4. Get Knowledge Domains

Returns the list of available knowledge domains.

- **URL**: `/v1/system/domains`
- **Method**: `GET`
- **Authentication**: Not required

**Successful Response:**

- **Status Code**: `200 OK`
- **Content-Type**: `application/json`

```json
{
  "domains": [
    {
      "id": "ai",
      "name": "Artificial Intelligence",
      "description": "AI and machine learning related documents"
    },
    {
      "id": "cloud",
      "name": "Cloud Computing",
      "description": "Cloud infrastructure and services documentation"
    },
    {
      "id": "virt-os",
      "name": "Virtual Operating Systems",
      "description": "Virtualisation and OS-level documentation"
    }
  ],
  "version": "1.0",
  "last_updated": "2025-03-29T10:38:33Z"
}
```

### Rate Limiting

All endpoints are subject to rate limiting:
- Standard endpoints: 100 requests per minute
- Upload endpoints: 10 requests per minute
- Status endpoints: 300 requests per minute

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1616161616
```

### Versioning

The API uses URI versioning (e.g., `/v1/documents/upload`). The current version is v1.

### Error Handling

All error responses follow the standard format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "request_id": "req_abc123",
    "details": {} // Optional additional error details
  }
}
```

### Monitoring and Health

- **Health Check**: `GET /health`
- **Metrics**: `GET /metrics` (Protected, requires admin authentication)
- **OpenAPI Spec**: `GET /openapi.json`
