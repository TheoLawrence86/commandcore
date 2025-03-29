# Data Flow Diagrams

This document illustrates the key data flows within the CommandCore system, showing how information moves between components during both ingestion and query operations.

## 1. Ingestion Workflow

The ingestion workflow shows how documents and their metadata are processed and stored in the appropriate knowledge base.

```
┌─────────┐     ┌─────────────┐     ┌───────────────────────────────────────────────────────┐
│         │     │             │     │              Ingestion Service                         │
│         │     │             │     │                                                       │
│  User   │────►│  Ingestion  │────►│  ┌─────────┐     ┌─────────┐     ┌─────────────┐     │
│         │     │     UI      │     │  │  API    │────►│ Document│────►│ Chunking &  │     │
│         │     │             │     │  │ Handler │     │ Parser  │     │ Processing  │     │
└─────────┘     └─────────────┘     │  └─────────┘     └─────────┘     └─────┬───────┘     │
                                    │                                         │             │
                                    └─────────────────────────────────────────┼─────────────┘
                                                                              │
                                                                              │
                                                                              ▼
                                    ┌─────────────────────────────────────────┴─────────────┐
                                    │              PostgresML Node                           │
                                    │                                                       │
                                    │  ┌────────────────┐     ┌────────────────────────┐   │
                                    │  │                │     │                        │   │
                                    │  │ pgml.embed()   │────►│ knowledge_chunks table │   │
                                    │  │                │     │                        │   │
                                    │  └────────────────┘     └────────────────────────┘   │
                                    │                                                       │
                                    └───────────────────────────────────────────────────────┘
```

### Data Flow Steps:

1. **User → Ingestion UI**:
   - User uploads document file (TXT, PDF, etc.)
   - User provides metadata:
     - Domain selection (AI, Cloud, Virt-OS)
     - Source information (title, author, date, URL, etc.)

2. **Ingestion UI → API Handler**:
   - HTTP POST request to `/upload/` endpoint
   - Multipart form data containing:
     - File data
     - Domain selection
     - Source information (as JSON string)

3. **API Handler → Document Parser**:
   - File content is extracted
   - File format is detected and appropriate parser is selected
   - Text is extracted from the document

4. **Document Parser → Chunking & Processing**:
   - Text is split into semantic chunks
   - Each chunk is prepared for embedding

5. **Chunking & Processing → PostgresML Node**:
   - Connection established to appropriate domain database
   - For each chunk:
     - Embedding is generated using `pgml.embed()`
     - Chunk text, embedding, and metadata are inserted into the `knowledge_chunks` table

## 2. Query Workflow

The query workflow shows how user questions are processed, relevant information is retrieved, and responses are generated.

```
┌─────────┐     ┌───────────────────────────────────────────────────────────────────────┐
│         │     │                      Orchestrator Service                              │
│         │     │                                                                       │
│  User   │────►│  ┌─────────────┐     ┌──────────────┐     ┌───────────────────────┐  │
│         │     │  │ Agent Core  │────►│ Domain Tool  │────►│ Tool Selection Logic  │  │
│         │     │  │             │     │ Registration │     │                       │  │
└─────────┘     │  └─────────────┘     └──────────────┘     └───────────┬───────────┘  │
                │        ▲                                               │               │
                └────────┼───────────────────────────────────────────────┼───────────────┘
                         │                                               │
                         │                                               │
                         │                                               ▼
                         │                      ┌────────────────────────┴────────────────┐
                         │                      │         PostgresML Node                  │
                         │                      │                                         │
                         │                      │  ┌─────────────┐    ┌───────────────┐  │
                         │                      │  │ pgml.embed()│    │ Vector Search │  │
                         │                      │  │ (query)     │───►│               │  │
                         │                      │  └─────────────┘    └───────┬───────┘  │
                         │                      │                              │          │
                         │                      └──────────────────────────────┼──────────┘
                         │                                                     │
                         │                                                     │
                         │                                                     ▼
                         │                      ┌──────────────────────────────┴──────────┐
                         │                      │        Result Processing                │
                         │                      │                                         │
                         │                      │  ┌─────────────────┐  ┌─────────────┐  │
                         │                      │  │ Retrieved Chunks │  │ Source Info │  │
                         │                      │  │ & Metadata      │  │ Extraction  │  │
                         │                      │  └────────┬────────┘  └──────┬──────┘  │
                         │                      │           │                   │         │
                         │                      └───────────┼───────────────────┼─────────┘
                         │                                  │                   │
                         │                                  ▼                   ▼
                         │                      ┌───────────┴───────────────────┴─────────┐
                         │                      │        Answer Synthesis                 │
                         │                      │                                         │
                         │                      │  ┌─────────────────────────────────┐   │
                         │                      │  │ Option 1: In-DB Synthesis       │   │
                         │                      │  │ (pgml.transform)                │   │
                         │                      │  └─────────────────────────────────┘   │
                         │                      │                  OR                     │
                         └──────────────────────┤  ┌─────────────────────────────────┐   │
                                                │  │ Option 2: External LLM Synthesis │   │
                                                │  │ (via Agent Core)                 │   │
                                                │  └─────────────────────────────────┘   │
                                                │                                         │
                                                └─────────────────────────────────────────┘
```

### Data Flow Steps:

1. **User → Agent Core**:
   - User submits a natural language query
   - Query is received by the Orchestrator's Agent Core

2. **Agent Core → Domain Tool Registration**:
   - Agent Core has access to registered domain-specific tools:
     - `ai_knowledge_tool`
     - `cloud_knowledge_tool`
     - `virt_os_knowledge_tool`

3. **Domain Tool Registration → Tool Selection Logic**:
   - Agent analyzes the query to determine relevant domain(s)
   - Appropriate domain tool(s) are selected for invocation

4. **Tool Selection Logic → PostgresML Node**:
   - Connection established to the appropriate domain database
   - Query is embedded using `pgml.embed()`
   - Vector similarity search is performed to find relevant chunks

5. **PostgresML Node → Result Processing**:
   - Most relevant chunks are retrieved based on similarity scores
   - Source information is extracted from the chunks' metadata
   - Results are formatted for the answer synthesis stage

6. **Result Processing → Answer Synthesis**:
   - **Option 1: In-DB Synthesis**
     - Context and query are sent to `pgml.transform()`
     - LLM generates answer directly within the database
     - Answer and source citations are returned to Agent Core
   
   - **Option 2: External LLM Synthesis**
     - Context and source information are returned to Agent Core
     - Agent Core uses external LLM to generate the final answer
     - Answer is formatted with source citations

7. **Answer Synthesis → Agent Core → User**:
   - Final answer with source citations is presented to the user
   - Conversation context may be maintained for follow-up questions
