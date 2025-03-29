# Detailed Component Diagram

## CommandCore System Architecture

The CommandCore system is built using a containerised microservices architecture, with each component serving a specific purpose in the overall workflow. This diagram illustrates the key components and their relationships.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       CommandCore System                                         │
│                                                                                                 │
│  ┌─────────────┐          ┌───────────────────────────────────────┐                             │
│  │             │          │           Orchestrator Service         │                             │
│  │    User     │          │ ┌─────────────┐      ┌──────────────┐ │                             │
│  │  Interface  │◄────────►│ │ Agent Core  │◄────►│ Domain Tools │ │                             │
│  │             │          │ └─────────────┘      └──────────────┘ │                             │
│  └─────────────┘          └───────────────────┬───────────────────┘                             │
│        ▲                                      │                                                 │
│        │                                      │                                                 │
│        │                                      │                                                 │
│        │                                      │                                                 │
│        │                                      │                                                 │
│        │                                      │                                                 │
│  ┌─────▼───────┐          ┌──────────────────▼────────────────────┐                             │
│  │             │          │           PostgresML Nodes             │                             │
│  │  Ingestion  │          │ ┌────────────┐ ┌────────────┐ ┌──────┐│                             │
│  │     UI      │◄────────►│ │postgres-ai │ │postgres-   │ │pg-   ││                             │
│  │             │          │ │            │ │cloud       │ │virt-os││                             │
│  └─────────────┘          │ └────────────┘ └────────────┘ └──────┘│                             │
│        ▲                  └───────────────────────────────────────┘                             │
│        │                                      ▲                                                 │
│        │                                      │                                                 │
│        │                                      │                                                 │
│        │                                      │                                                 │
│  ┌─────▼───────────────────────────────────┐ │                                                 │
│  │           Ingestion Service             │ │                                                 │
│  │ ┌─────────┐ ┌────────┐ ┌─────────────┐  │ │                                                 │
│  │ │API      │ │Parser & │ │DB Writer    │──┘                                                 │
│  │ │Handler  │►│Embedder │►│             │                                                    │
│  │ └─────────┘ └────────┘ └─────────────┘                                                     │
│  └─────────────────────────────────────────┘                                                   │
│                                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Component Details

### User Interface
- **Purpose**: Provides interaction points for users to query the system and view responses
- **Technologies**: Web-based interface or CLI
- **Connections**: Communicates with the Orchestrator Service via HTTP/REST

### Orchestrator Service
- **Purpose**: Central "brain" that routes queries and manages responses
- **Subcomponents**:
  - **Agent Core**: Manages the AI agent using the OpenAI Assistants API
  - **Domain Tools**: Specialised tools for querying different knowledge domains
- **Technologies**: Python, OpenAI SDK
- **Connections**: Communicates with PostgresML nodes via psycopg2/SQL

### PostgresML Nodes
- **Purpose**: Domain-specific knowledge stores with ML capabilities
- **Subcomponents**:
  - **postgres-ai**: Stores AI-related knowledge
  - **postgres-cloud**: Stores cloud computing knowledge
  - **postgres-virt-os**: Stores virtualisation and OS knowledge
- **Technologies**: PostgreSQL, PostgresML, pgvector
- **Connections**: Accessed by both Orchestrator and Ingestion services

### Ingestion UI
- **Purpose**: User interface for document upload and metadata entry
- **Technologies**: HTML, CSS, JavaScript
- **Connections**: Communicates with Ingestion Service via HTTP/REST

### Ingestion Service
- **Purpose**: Processes and stores documents in the appropriate knowledge base
- **Subcomponents**:
  - **API Handler**: Manages HTTP endpoints and request processing
  - **Parser & Embedder**: Chunks documents and generates embeddings
  - **DB Writer**: Stores processed data in the appropriate PostgresML node
- **Technologies**: Python, FastAPI
- **Connections**: Communicates with PostgresML nodes via psycopg2/SQL

## Network Connections

- **User Interface ↔ Orchestrator**: HTTP/REST (JSON)
- **Orchestrator ↔ PostgresML Nodes**: SQL via psycopg2
- **Ingestion UI ↔ Ingestion Service**: HTTP/REST (Multipart form data)
- **Ingestion Service ↔ PostgresML Nodes**: SQL via psycopg2

## Container Structure

Each component runs in its own Docker container:
- `orchestrator`: Contains the Agent Core and Domain Tools
- `ingestion-service`: Contains the FastAPI application
- `ingestion-ui`: Contains a simple web server for the frontend
- `postgres-ai`: PostgresML instance for AI domain
- `postgres-cloud`: PostgresML instance for cloud computing domain
- `postgres-virt-os`: PostgresML instance for virtualisation/OS domain

These containers are orchestrated using Docker Compose, with appropriate network configurations and volume mappings for persistent storage.
