import os
from pydantic import BaseSettings


class Settings(BaseSettings):
    # Database settings
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgrespassword")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "commandcore")
    
    # OpenAI settings
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Application settings
    UPLOAD_DIR: str = "/app/data/uploads"
    MAX_CHUNK_SIZE: int = 1000  # Maximum characters per chunk
    CHUNK_OVERLAP: int = 200    # Character overlap between chunks
    
    # Token-based chunking settings
    MAX_TOKENS_PER_CHUNK: int = 512  # Maximum tokens per chunk
    OVERLAP_TOKENS: int = 50        # Token overlap between chunks
    
    # Rate limiting (for future implementation)
    RATE_LIMIT_UPLOADS: int = 10  # uploads per minute
    RATE_LIMIT_QUERIES: int = 100  # queries per minute

    class Config:
        env_file = ".env"


settings = Settings()
