# Security Plan

This document outlines the security measures implemented in the CommandCore system to protect data, ensure proper access controls, and maintain system integrity.

## Credential Management

### Development Environment

During development, credentials will be managed using secure environment variables and automated rotation:

```yaml
# Example docker-compose.yml credential handling with enhanced security
services:
  postgres-ai:
    environment:
      - POSTGRES_USER_FILE=/run/secrets/db_user
      - POSTGRES_PASSWORD_FILE=/run/secrets/db_password
    secrets:
      - db_user
      - db_password
```

### Production Environment

For production deployment, we implement industry-standard security measures:

1. **Automated Secret Management**:
   - Integration with HashiCorp Vault or AWS Secrets Manager
   - Mandatory 90-day credential rotation
   - Just-in-time access controls
   - Real-time credential usage monitoring
   - Immediate compromised credential revocation

2. **Multi-Factor Authentication (MFA)**:
   - Adaptive MFA combining biometrics and hardware tokens
   - Integration with SSO solutions
   - Contextual authentication factors (location/device)

## Network Security

### Container Network Isolation

```yaml
# Enhanced docker-compose.yml network configuration
networks:
  frontend:
    driver: overlay
    encryption: true  # Enable network encryption
  backend:
    driver: overlay
    encryption: true
    internal: true  # No external connectivity
  database:
    driver: overlay
    encryption: true
    internal: true

services:
  orchestrator:
    networks:
      - frontend
      - backend
    security_opt:
      - no-new-privileges:true  # Prevent privilege escalation
  
  ingestion-ui:
    networks:
      - frontend
    security_opt:
      - no-new-privileges:true
  
  ingestion-service:
    networks:
      - frontend
      - database
    security_opt:
      - no-new-privileges:true
  
  postgres-ai:
    networks:
      - database
    security_opt:
      - no-new-privileges:true
```

### Container Security

1. **Secure Image Management**:
   - Use signed, minimal base images from trusted repositories
   - Automated vulnerability scanning in CI/CD pipelines
   - Digital signature verification before deployment
   - SBOM (Software Bill of Materials) monitoring

2. **Runtime Protection**:
   - Enforce least privilege principles
   - Deploy runtime security tools (e.g., Falco, Docker Scout)
   - AI-driven anomaly detection
   - Automated patch deployment

### TLS/SSL

All external communications must use TLS 1.3:

- Mandatory HTTPS for all endpoints
- Regular certificate rotation
- Strong cipher suite configuration
- HSTS (HTTP Strict Transport Security) implementation

## API Security

### Authentication and Authorization

```python
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import datetime, timedelta

# JWT Configuration
SECRET_KEY = "your-secret-key"  # Store securely in environment
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return username

@app.post("/protected-endpoint")
async def protected_route(current_user: str = Depends(get_current_user)):
    return {"message": f"Hello {current_user}"}
```

### CORS Policy

Implement strict CORS with specific origin validation:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://trusted-domain.com",
        "https://api.trusted-domain.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)
```

### Input Validation

Enhanced validation with comprehensive checks:

```python
from pydantic import BaseModel, validator, constr
from datetime import datetime
import re

class SourceInfo(BaseModel):
    title: constr(min_length=1, max_length=200)
    author: constr(min_length=1, max_length=100)
    publication_date: str = None
    url: str = None
    additional_notes: str = None
    
    @validator('publication_date')
    def validate_date(cls, v):
        if v:
            try:
                datetime.strptime(v, '%Y-%m-%d')
            except ValueError:
                raise ValueError('Invalid date format. Use YYYY-MM-DD')
        return v
    
    @validator('url')
    def validate_url(cls, v):
        if v:
            if not v.startswith(('https://')):
                raise ValueError('URL must use HTTPS')
            # Additional URL validation
            url_pattern = re.compile(
                r'^https:\/\/(?:[\w-]+\.)+[\w-]+(?:\/[\w-.\/?%&=]*)?$'
            )
            if not url_pattern.match(v):
                raise ValueError('Invalid URL format')
        return v

    @validator('title', 'author', 'additional_notes')
    def no_html_injection(cls, v):
        if v and re.search(r'<[^>]*>', v):
            raise ValueError('HTML tags are not allowed')
        return v
```

### SQL Injection Prevention

Use parameterised queries and ORM:

```python
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Example using SQLAlchemy
engine = create_engine('postgresql://user:password@localhost/db')
Session = sessionmaker(bind=engine)

def safe_query(domain: str):
    session = Session()
    try:
        # Using parameterised query
        result = session.execute(
            text("SELECT * FROM knowledge_chunks WHERE domain = :domain"),
            {"domain": domain}
        )
        return result.fetchall()
    finally:
        session.close()

# Alternative using async SQLAlchemy
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

async def safe_async_query(domain: str):
    async with AsyncSession(engine) as session:
        result = await session.execute(
            text("SELECT * FROM knowledge_chunks WHERE domain = :domain"),
            {"domain": domain}
        )
        return result.fetchall()
```

## Rate Limiting and DoS Protection

Implement rate limiting and DoS protection:

```python
from fastapi import FastAPI, Request
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add trusted host middleware
app.add_middleware(
    TrustedHostMiddleware, allowed_hosts=["api.yourdomain.com"]
)

@app.get("/api/endpoint")
@limiter.limit("5/minute")
async def rate_limited_endpoint(request: Request):
    return {"message": "Rate-limited endpoint"}
```

## Security Monitoring and Auditing

1. **Logging**:
   - Structured logging with correlation IDs
   - Sensitive data masking
   - Centralised log aggregation

2. **Monitoring**:
   - Real-time threat detection
   - AI-powered anomaly detection
   - Automated incident response

3. **Regular Security Audits**:
   - Automated vulnerability scanning
   - Penetration testing
   - Compliance checks
   - Security posture assessment

## Incident Response

A basic incident response plan will be documented:

1. **Detection**: How security incidents are identified
2. **Containment**: Steps to isolate affected components
3. **Eradication**: Removing the threat
4. **Recovery**: Restoring normal operation
5. **Lessons Learned**: Post-incident analysis

## Regular Security Reviews

The security plan will be reviewed and updated:

- When new features are added
- When dependencies are updated
- On a regular schedule (at least quarterly)

## Dependency Management

- Regular updates of all dependencies
- Automated vulnerability scanning
- Use of dependency lockfiles to prevent unexpected changes
