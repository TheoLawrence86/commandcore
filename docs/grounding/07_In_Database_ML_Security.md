# In-Database ML Security

## Definition

In-Database Machine Learning (ML) Security refers to the practice of performing machine learning tasks—such as embedding generation and inference—directly within the database system rather than sending data to external services. This approach significantly enhances data privacy and security by keeping sensitive information within the controlled database environment.

## Role in CommandCore

In-Database ML Security is a key design principle of CommandCore:

- **Data Privacy Protection**: Sensitive document content and user queries remain within the database boundary
- **Reduced Attack Surface**: Minimises the exposure of data to external networks and third-party APIs
- **Simplified Compliance**: Helps meet data protection regulations by keeping data in a single, controlled environment
- **Consistent Security Policies**: Enables uniform application of security controls across all data processing stages

## Key Features Used

### PostgresML Embedding Generation

Using `pgml.embed` keeps text data within the database during the critical embedding generation process:

```sql
-- Loading an embedding model into the database
SELECT pgml.load_model(
    'BAAI/bge-large-en-v1.5',  -- Model name
    'huggingface',             -- Model source
    '{}'                       -- Configuration options
);

-- Generating embeddings in-database
SELECT pgml.embed(
    'BAAI/bge-large-en-v1.5',  -- Model name
    'This is sensitive document text that never leaves the database'
);
```

### In-Database Inference

Using `pgml.transform` enables LLM inference directly within the database:

```sql
-- Loading an LLM into the database
SELECT pgml.load_model(
    'llama2-7b',               -- Model name
    'huggingface',             -- Model source
    '{}'                       -- Configuration options
);

-- Performing inference in-database
SELECT pgml.transform(
    'llama2-7b',               -- Model name
    'Synthesise an answer based on this context: ' || sensitive_context || ' Question: ' || user_query
);
```

### Comparison with External API Approach

#### Traditional External API Approach:

```python
# Sensitive data leaves your system
response = requests.post(
    "https://api.external-ml-provider.com/v1/embeddings",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={"input": sensitive_document_text, "model": "text-embedding-model"}
)
embedding = response.json()["data"][0]["embedding"]
```

#### CommandCore's In-Database Approach:

```python
# Data stays within your database
cursor.execute(
    "SELECT pgml.embed('BAAI/bge-large-en-v1.5', %s)",
    (sensitive_document_text,)
)
embedding = cursor.fetchone()[0]
```

## Security Benefits

1. **Data Locality**: Sensitive information remains within your controlled environment
2. **Reduced Transmission Risk**: Eliminates the risk of data interception during network transmission
3. **API Key Management**: Reduces the need to manage and secure external API keys
4. **Audit Trail**: Database-level logging provides a comprehensive audit trail of all ML operations
5. **Access Control**: Leverages existing database access controls and permissions
6. **Simplified Architecture**: Reduces the number of systems handling sensitive data

## Implementation Considerations

- **Resource Requirements**: In-database ML requires sufficient computational resources on the database server
- **Model Selection**: Not all models may be available or perform optimally in-database
- **Scaling Strategy**: Consider read replicas or connection pooling for high-demand scenarios
- **Backup and Recovery**: Ensure ML models are included in database backup strategies

## Resources

- [PostgresML Security Documentation](https://postgresml.org/docs/security)
- [Data Privacy in Machine Learning](https://www.oreilly.com/library/view/practical-data-privacy/9781098129453/)
- [GDPR and Machine Learning](https://gdpr.eu/data-processing/)
