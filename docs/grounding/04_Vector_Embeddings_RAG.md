# Vector Embeddings and Retrieval-Augmented Generation (RAG)

## Definition

**Vector Embeddings** are numerical representations of text (or other data) that capture semantic meaning in a high-dimensional space. Similar concepts are positioned closer together in this vector space, enabling semantic similarity comparisons.

**Retrieval-Augmented Generation (RAG)** is a technique that enhances Large Language Model (LLM) outputs by first retrieving relevant information from a knowledge base, then using this information to generate more accurate, factual responses.

## Role in CommandCore

### Vector Embeddings

In CommandCore, embeddings serve as the bridge between natural language and machine understanding:

- **Text Representation**: Convert document chunks and user queries into vector form using state-of-the-art models
- **Semantic Comparison**: Enable comparison of query meaning against stored knowledge using hybrid retrieval
- **Cross-Domain Understanding**: Allow the system to identify relevant information across multiple modalities
- **Multilingual Support**: Process queries and documents in 100+ languages efficiently

### Retrieval-Augmented Generation (RAG)

RAG forms the core workflow of CommandCore with advanced 2025 optimisations:

1. **Query Understanding**: User question is converted to a vector embedding using BGE-M3
2. **Hybrid Retrieval**: System performs three-way search combining dense, sparse, and multi-vector approaches
3. **Context Assembly**: Retrieved chunks undergo real-time relevance scoring and dynamic reranking
4. **Grounded Answer Synthesis**: Either in-database (via PostgresML) or via the Orchestrator's LLM
5. **Source Citation**: Final response includes citations with confidence scores

## Key Features and Implementation

### Embedding Generation

```sql
-- In PostgresML, using BGE-M3 for embedding generation
SELECT pgml.embed(
    'BAAI/bge-m3',           -- Latest embedding model
    'What is CommandCore?',  -- Text to embed
    {
        'max_length': 8192,  -- Supports longer contexts
        'pooling': 'cls'     -- Advanced pooling strategy
    }
);
```

### Vector Similarity Search

```sql
-- Hybrid search combining dense and sparse vectors
WITH query_embedding AS (
    SELECT pgml.embed('BAAI/bge-m3', $1) as vec
)
SELECT 
    chunk_text, 
    source_info,
    (
        0.7 * (1 - (dense_embedding <=> query_embedding.vec)) +
        0.3 * ts_rank(sparse_vector, to_tsquery('english', $1))
    ) AS hybrid_score
FROM 
    knowledge_chunks, query_embedding
WHERE 
    domain = 'ai'
ORDER BY 
    hybrid_score DESC
LIMIT 5;
```

### Context Assembly

The retrieved chunks undergo dynamic reranking and assembly:

```python
context = {
    "chunks": [
        {
            "text": "chunk1 text",
            "source": "source1 info",
            "dense_score": 0.92,
            "sparse_score": 0.85,
            "hybrid_score": 0.90,
            "confidence": 0.88
        },
        # Additional chunks...
    ],
    "query": {
        "text": "original user query",
        "embedding": "vector representation",
        "language": "detected language"
    }
}
```

### Answer Synthesis

Using advanced in-database LLM capabilities with streaming support:

```sql
-- In-database synthesis with streaming
SELECT pgml.transform_stream(
    'llm-model-name',
    format(
        'Based on the following information with confidence scores:
         %s
         
         Question: %s
         
         Provide a comprehensive answer with citations.',
        context_json,
        query_text
    ),
    {
        'temperature': 0.7,
        'max_tokens': 1024,
        'streaming': true
    }
);
```

## 2025 Performance Benchmarks

### Model Comparison

| Model     | MTEB Score | Key Strengths                     | Best Use Cases          |
|-----------|------------|-----------------------------------|------------------------|
| BGE-M3    | 68.95     | Multilingual, Hybrid retrieval    | General purpose, Long docs |
| NV-Embed  | 69.32     | Highest accuracy, GPU-optimised   | Enterprise, High-throughput |
| BM25      | 61.20     | Fast keyword search               | Simple text retrieval |

### BGE-M3 Capabilities
- Processes documents up to 8,192 tokens
- Supports 100+ languages
- Combines dense, sparse, and multi-vector retrieval
- 2× faster processing than previous versions

## Resources and Documentation

- [BAAI/bge-m3 Model Card](https://huggingface.co/BAAI/bge-m3)
- [PostgresML Vector Search 2025 Guide](https://postgresml.org/docs/guides/vector-search)
- [Massive Text Embedding Benchmark (MTEB)](https://huggingface.co/spaces/mteb/leaderboard)
- [RAG Best Practices 2025](https://www.pinecone.io/learn/rag-best-practices)
