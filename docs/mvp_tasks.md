# CommandCore MVP Tasks

This document outlines the minimum viable product (MVP) tasks for CommandCore v0.1. These tasks focus on implementing the core concept with essential functionality before adding advanced features like comprehensive security in v0.2.

## MVP 1: Core Infrastructure

### Basic Environment Setup
- [x] Set up project directory structure and Git repository
- [x] Create simplified Docker Compose with essential services:
  - [x] Single PostgresML container (rather than domain-specific instances)
  - [x] Basic FastAPI ingestion service
  - [x] Simple orchestrator service
- [x] Configure basic networking between containers
- [x] Set up local development environment with hot reloading

### PostgresML Foundation
- [x] Set up single PostgresML instance with pgvector
- [x] Implement basic knowledge chunks schema
- [x] Configure simple vector index
- [x] Load BAAI/bge-m3 embedding model

## MVP 2: Essential Backend Components

### Basic Ingestion Service
- [x] Set up minimal FastAPI application
- [x] Implement simple document upload endpoint
- [x] Create basic text extraction functionality
- [x] Implement simple chunking algorithm
- [x] Build embedding generation pipeline
- [x] Set up database storage for chunks and embeddings

### Orchestrator Prototype
- [x] Set up minimal OpenAI Agents SDK environment
- [x] Create basic agent definition with simple instructions
- [x] Implement single knowledge retrieval tool
- [x] Build simple query-response flow
- [x] Implement basic response formatting with source citations

## MVP 3: Simple Frontend

### Minimal User Interface
- [x] Create basic HTML/CSS/JS query interface
- [x] Implement simple response display
- [x] Add basic source citation display

### Enhanced User Interface (v0.2)
- [x] Implement persistent navigation bar across all pages
- [x] Create central landing page with clear navigation options
- [x] Enhance query interface with:
  - [x] Streaming response simulation
  - [x] Improved markdown rendering
  - [x] Code block syntax highlighting with copy buttons
  - [x] Chat history functionality
  - [x] Edit and regenerate capabilities
  - [x] User feedback controls
- [x] Enhance document ingestion interface with:
  - [x] Tabbed interface for file upload and text input modes
  - [x] Drag-and-drop file upload functionality
  - [x] Support for single and bulk file uploads
  - [x] Metadata extraction simulation with fallback options
  - [x] Comprehensive processing status indicators
  - [x] Detailed bulk upload reporting

### Basic Ingestion UI
- [x] Create simple document upload form
- [x] Implement minimal metadata entry
- [x] Add basic upload status indicator

## MVP 4: Integration and Demo

### Component Integration
- [x] Connect frontend components to backend services
- [x] Implement end-to-end data flow for document ingestion
- [x] Create end-to-end query-response flow
- [x] Verify basic communication between all components

### Demo Preparation
- [x] Prepare sample documents for ingestion
- [x] Create demonstration script with example queries
- [x] Test end-to-end functionality with sample data
- [x] Document MVP capabilities and limitations

## MVP Priorities

### Focus Areas
- [x] Demonstrate RAG capability with vector embeddings
- [x] Show OpenAI Agents SDK integration
- [x] Prove PostgresML and pgvector functionality
- [x] Establish basic document ingestion workflow
- [x] Create simple but functional user interfaces
- [x] Provide enhanced UI experience in v0.2

### Explicitly Deferred to v0.2
- Advanced security features (JWT, TLS, etc.)
- Multi-domain knowledge separation
- Performance optimizations
- High availability features
- Advanced monitoring and logging
- ~~Complex UI features~~ (Completed in v0.2)

## Success Criteria for v0.1 MVP

- Successfully ingest at least 3 different documents
- Generate embeddings and store in vector database
- Retrieve relevant information based on user queries
- Use OpenAI Agents SDK to process queries and format responses
- Include basic source citations in responses
- Demonstrate end-to-end functionality with simple UI

## Success Criteria for v0.2 UI Enhancement

- Provide consistent navigation across all application pages
- Support both file upload and direct text input for knowledge ingestion
- Enable simulated streaming responses for a more interactive experience
- Implement proper markdown rendering with code syntax highlighting
- Add session history and feedback mechanisms to improve user experience
- Support bulk file uploads with comprehensive status reporting

This MVP approach focuses on quickly implementing the core RAG + Agent Orchestration concept while enhancing the UI experience in v0.2.