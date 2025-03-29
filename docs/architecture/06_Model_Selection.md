# Model Selection

This document outlines the selection of machine learning models for the CommandCore system, focusing on embedding models for vector representation and potentially LLMs for in-database synthesis.

## Embedding Model Selection

### Selected Model: BAAI/bge-m3

After evaluating several embedding models, we have selected **BAAI/bge-m3** as the primary embedding model for CommandCore, upgrading from our previous BGE-large model.

#### Model Specifications:
- **Dimension**: 1024
- **Context Length**: 8192 tokens
- **Model Size**: ~1.5 GB
- **Language**: Multilingual
- **Framework**: Sentence Transformers

#### Performance Metrics:
- **MTEB Benchmark**: 65.7 (English tasks)
- **BEIR Benchmark**: 49.8 (Average)
- **Cross-lingual Performance**: 72.3 (Averaged across 100+ languages)

#### Rationale for Selection:

1. **Quality of Embeddings**:
   - State-of-the-art performance on retrieval tasks
   - Enhanced multilingual capabilities
   - Superior performance on technical content
   - Improved context window (8K vs 512 tokens)

2. **Resource Requirements**:
   - Optimised memory footprint for PostgresML deployment
   - Excellent balance between quality and computational needs
   - Native compatibility with pgvector's latest indexing features

3. **Technical Considerations**:
   - Comprehensive documentation and implementation guides
   - Direct HuggingFace integration with PostgresML
   - Active maintenance and enterprise support available

4. **Specific Strengths**:
   - Enhanced technical relationship mapping
   - Improved performance on both short and long-form content
   - Advanced instruction tuning with technical focus

### Alternative Models Considered

#### OpenAI text-embedding-3-large
- **Pros**: Leading MTEB score (64.6%), excellent general performance
- **Cons**: External API dependency, data privacy considerations, ongoing costs
- **Why Not Selected**: Conflicts with our in-database ML security requirements

#### NVIDIA NV-Embed
- **Pros**: Highest MTEB score (69.32%), excellent technical performance
- **Cons**: Requires NVIDIA hardware, complex licensing
- **Why Not Selected**: Hardware requirements exceed our infrastructure plan

#### E5-large-v2
- **Pros**: Strong performance, established track record
- **Cons**: Lower performance than newer models
- **Why Not Selected**: Superseded by more recent models with better performance

## LLM Selection for In-Database Synthesis

### Option 1: PostgresML-Compatible LLM

For in-database synthesis, we've selected models optimising quality and resource usage.

#### Primary: Gemma 3 27B
- **Size**: ~108 GB (quantized to 4-bit: ~19.9 GB)
- **Context Length**: 32K tokens
- **Strengths**: 
  - Superior performance on technical tasks (MATH: 69.0%)
  - Excellent multilingual capabilities
  - Strong reasoning and code generation
  - Open-source with enterprise support
- **Resource Requirements**: 
  - RAM: Minimum 24 GB (with 4-bit quantisation)
  - GPU: Required for optimal performance
  - Storage: ~20 GB (quantised)
- **Quantisation Options**:
  - INT4: Best balance of performance/memory
  - SFP8: Higher accuracy, more memory
  - Q4_0: Smallest footprint

#### Backup: Llama 3.2
- **Size**: ~35 GB (quantized to 4-bit: ~8.75 GB)
- **Context Length**: 32K tokens
- **Strengths**:
  - 68.2% MMLU score
  - Efficient resource usage
  - Proven PostgresML compatibility
- **Resource Requirements**:
  - RAM: 12 GB minimum (with 4-bit quantisation)
  - GPU: Optional but recommended
  - Storage: ~9 GB

### Option 2: External LLM via API

For external synthesis via the Orchestrator:

#### Candidate: GPT-4.5 "Orion"
- **Context Window**: 128K tokens
- **Strengths**: 
  - State-of-the-art performance
  - Advanced reasoning capabilities
  - Robust API infrastructure
- **Considerations**: 
  - External API dependency
  - Premium pricing
  - Enhanced security requirements

## Vector Index Configuration

The choice of embedding model influences our vector index configuration:

```sql
-- HNSW index optimised for our chosen embedding model
CREATE INDEX ON knowledge_chunks USING hnsw (embedding vector_cosine_ops)
WITH (
    ef_construction = 256,  -- Increased for better accuracy
    m = 32                  -- Optimised for BGE-m3
);
```

## Model Loading in PostgresML

### Embedding Model Loading

```sql
-- Load the BGE-m3 embedding model
SELECT pgml.load_model(
    'BAAI/bge-m3',
    'huggingface',
    '{
        "device": "cpu",
        "revision": "main",
        "quantize": "8bit"
    }'
);
```

### LLM Loading (If Using In-Database Synthesis)

```sql
-- Load Gemma 3 model
SELECT pgml.load_model(
    'gemma-ai/gemma-3-27b',
    'huggingface',
    '{
        "device": "cuda",
        "quantize": "4bit",
        "revision": "main"
    }'
);
```

## Performance Considerations

### Resource Requirements

Each PostgresML node should be provisioned with:

- **CPU**: Minimum 8 cores (16+ recommended)
- **RAM**: Minimum 32 GB (64+ GB recommended)
- **Storage**: Minimum 50 GB for model storage and database
- **GPU**: Required for optimal LLM inference (NVIDIA A10 or better)

### Scaling Strategy

- Horizontal scaling with read replicas for high-query loads
- Vertical scaling for nodes performing intensive operations
- Dedicated GPU nodes for LLM inference
- Load balancing across multiple embedding nodes

## Monitoring and Evaluation

We implement comprehensive monitoring:

- Embedding generation latency
- Query response times
- Retrieval quality metrics
- LLM synthesis performance
- Resource utilisation tracking
- Cost per operation metrics

## Future Considerations

- Quarterly evaluation of new embedding models
- Investigation of domain-specific fine-tuning
- Exploration of emerging quantisation techniques
- Regular performance benchmarking against industry standards
