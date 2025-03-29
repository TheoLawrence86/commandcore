# CommandCore Architecture Overview

## Project Goal

CommandCore is an advanced AI Agent Orchestration system built on the OpenAI Agents SDK, designed to leverage Multi-Agent Retrieval-Augmented Generation (RAG) from domain-specific knowledge bases to provide accurate, contextually relevant responses to user queries.

## Core Pattern

The system implements a multi-agent orchestration pattern using the OpenAI Agents Python SDK's agent loop architecture, combined with advanced RAG techniques and hybrid search capabilities. This approach ensures responses are grounded in factual information whilst supporting real-time knowledge updates and multimodal data processing.

## Agent Orchestration Layer

The orchestration layer, powered by OpenAI Agents SDK, provides:
- Agent Definition: Specialised agents with defined instructions and capabilities
- Task Handoff: Seamless delegation between agents for complex workflows
- Safety Controls: Built-in guardrails for input/output validation
- Debugging Tools: Comprehensive tracing and monitoring capabilities

## Containerised Microservices Architecture

CommandCore employs an event-driven, containerised Microservices Architecture to ensure:

- Scalability: Each component can be scaled independently based on demand
- Isolation: Services operate independently, reducing system-wide failures
- Maintainability: Components can be updated or replaced without affecting the entire system
- Flexibility: New domains and services can be added with minimal disruption
- Real-time Processing: Event-driven design enables immediate response to system changes

## High-Level System Diagram

```
User Query Flow:
┌────────┐     ┌─────────────┐     ┌───────────────────┐     ┌────────────────┐
│  User  │────►│ OpenAI      │────►│ Domain-Specific   │────►│ PostgresML     │
│        │◄────│ Agents      │◄────│ Tools & Agents    │◄────│ Vector Store   │
└────────┘     └─────────────┘     └───────────────────┘     └────────────────┘

Ingestion Flow:
┌────────┐     ┌─────────────┐     ┌───────────────────┐     ┌────────────────┐
│  User  │────►│ Ingestion UI │────►│ Ingestion Service │────►│ PostgresML     │
│        │◄────│             │◄────│ & RAG Pipeline    │◄────│ Vector Store   │
└────────┘     └─────────────┘     └───────────────────┘     └────────────────┘
```

### Key Components

1. **User Interface**: Provides interaction points for both querying the system and ingesting new knowledge
2. **OpenAI Agents Layer**: The central orchestration layer that:
   - Defines and manages specialised agents
   - Handles task delegation and handoffs
   - Implements safety guardrails
   - Provides debugging and tracing capabilities
3. **Domain-Specific Tools & Agents**: Specialised components that interact with specific knowledge domains, supporting multimodal data processing
4. **PostgresML Vector Store**: High-performance database instances with integrated machine learning capabilities for:
   - Hybrid search (vector + structured data)
   - Real-time knowledge updates
   - GPU-accelerated inference
   - Direct integration with Hugging Face models
5. **Ingestion Service & RAG Pipeline**: Advanced processing pipeline that:
   - Handles multimodal data ingestion
   - Implements real-time indexing
   - Maintains knowledge graph relationships
   - Supports streaming updates

This architecture enables CommandCore to maintain separate knowledge bases for different domains (AI, Cloud, Virtualisation/OS) whilst providing a unified, real-time query interface through the OpenAI Agents SDK orchestration layer.
