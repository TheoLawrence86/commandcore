# CommandCore

CommandCore is an advanced AI Agent Orchestration system that leverages Multi-Agent Retrieval-Augmented Generation (RAG) from domain-specific knowledge bases. The system provides accurate, contextually relevant responses to user queries across three key domains: AI, Cloud Computing, and Virtualisation/OS.

## Project Overview

CommandCore follows a containerised microservices architecture with the following core components:

1. **Orchestration Service** - Manages agent interactions and responses using OpenAI's API
2. **PostgresML Node** - Provides vector storage and similarity search capabilities
3. **Ingestion Service** - Processes and stores documents in the knowledge base
4. **User Interface** - Web interfaces for querying and document upload with enhanced features

## Getting Started

### Prerequisites

- Docker and Docker Compose
- OpenAI API key

### Installation

1. Clone the repository
2. Set up environment variables:
   ```bash
   export OPENAI_API_KEY=your_openai_api_key
   ```
3. Start the application with Docker Compose:
   ```bash
   docker-compose up -d
   ```

### Accessing the Application

Once started, the application will be available at:

- Main interface: http://localhost
- Query UI: http://localhost/query_ui
- Document ingestion UI: http://localhost/ingestion_ui
- Ingestion API: http://localhost/api/ingestion
- Query API: http://localhost/api/orchestrator

## MVP Features

This implementation includes all MVP tasks from v0.1 and the enhanced UI features from v0.2:

### Core Infrastructure
- Project structure with Git repository
- Docker Compose with PostgresML, ingestion service, and orchestrator
- Networking between containers
- Local development environment

### Backend Components
- FastAPI ingestion service with document processing capabilities
- Text extraction, chunking, and embedding generation
- Document upload endpoint with metadata handling
- Query orchestration using OpenAI Agents SDK
- Knowledge retrieval with source citations

### Frontend Components
- Central landing page with navigation options
- Enhanced query interface with:
  - Streaming response simulation
  - Markdown rendering with syntax highlighting
  - Chat history functionality
  - Response editing and regeneration
  - User feedback controls
- Enhanced document ingestion interface with:
  - Tabbed interface for file upload and text input
  - Drag-and-drop file upload functionality
  - Support for single and bulk file uploads
  - Metadata extraction with fallback options
  - Processing status indicators
  - Bulk upload reporting

## Architecture

The system follows a microservices architecture with these components:

- **PostgresML** - Single instance with pgvector for embedding storage and search
- **Ingestion Service** - FastAPI application for document processing
- **Orchestrator** - FastAPI application for query handling with OpenAI integration
- **Web UI** - HTML/CSS/JS interfaces served by Nginx

## Development

### Project Structure

```
commandcore/
├── config/              # Configuration files
│   └── nginx/           # Nginx configuration
├── docs/                # Project documentation
├── sql/                 # SQL initialization scripts
│   └── init/            # Database initialization
├── src/                 # Source code
│   ├── ingestion_service/ # Document ingestion service
│   ├── orchestrator/    # Query orchestration service
│   └── ui/              # User interfaces
└── docker-compose.yml   # Docker Compose configuration
```

## Future Enhancements

Planned for v0.3:

- Comprehensive security with JWT and TLS
- Multi-domain knowledge separation
- Performance optimizations
- High availability features
- Advanced monitoring and logging

## License

This project is proprietary software.

## Acknowledgments

- OpenAI for providing the foundation models
- PostgresML for the vector database capabilities
- BAAI for the embedding models