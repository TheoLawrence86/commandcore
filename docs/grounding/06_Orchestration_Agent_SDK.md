# Orchestration Agent SDK

## Definition

The Orchestration Agent SDK refers to the software development kit that enables the creation and management of AI agents capable of using tools. In the context of CommandCore, this likely refers to the OpenAI Agents SDK via the OpenAI Python library, though the specific implementation may vary based on project requirements.

An AI agent in this context is an LLM-powered system that can interpret user queries, make decisions about which tools to use, invoke those tools with appropriate parameters, and synthesise responses based on tool outputs.

## Role in CommandCore

The Orchestration Agent serves as the central "brain" of the CommandCore system:

- **Query Interpretation**: Analyses user questions to understand intent and domain
- **Tool Selection**: Determines which domain-specific knowledge tool(s) to invoke based on the query
- **Tool Invocation**: Calls the appropriate tool(s) with the necessary parameters
- **Conversation Management**: Potentially maintains conversation state for context-aware responses
- **Response Formatting**: Synthesises and formats the final response, including answer and source citations

## Key Features Used

### Tool Definition

Tools are defined with specific parameters and functionality:

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "ai_knowledge_tool",
            "description": "Searches the AI knowledge base for information relevant to the query",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The user's question about AI topics"
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "cloud_knowledge_tool",
            "description": "Searches the cloud computing knowledge base for information relevant to the query",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The user's question about cloud computing topics"
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "virt_os_knowledge_tool",
            "description": "Searches the virtualisation and operating systems knowledge base for information relevant to the query",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The user's question about virtualisation or operating systems topics"
                    }
                },
                "required": ["query"]
            }
        }
    }
]
```

### Tool Invocation Logic

The agent must implement logic to determine which tool(s) to use:

```python
def ai_knowledge_tool(query: str):
    # Connect to the AI domain PostgresML node
    conn = get_db_connection("ai")
    
    # Generate embedding for the query
    query_embedding = generate_embedding(conn, query)
    
    # Perform vector similarity search
    chunks = retrieve_relevant_chunks(conn, query_embedding)
    
    # Option 1: In-DB synthesis
    if USE_IN_DB_SYNTHESIS:
        answer = synthesise_answer_in_db(conn, chunks, query)
        return {"answer": answer, "sources": extract_sources(chunks)}
    
    # Option 2: Return context for external synthesis
    else:
        return {
            "context": [chunk["text"] for chunk in chunks],
            "sources": extract_sources(chunks),
            "query": query
        }
```

### Prompt Engineering

The agent's behaviour is guided by system instructions:

```python
system_prompt = """
You are CommandCore, an AI assistant with access to specialised knowledge bases.
Your goal is to provide accurate, helpful responses based on the information in these knowledge bases.

When a user asks a question:
1. Determine which domain(s) the question relates to: AI, Cloud Computing, or Virtualisation/OS
2. Use the appropriate knowledge tool(s) to retrieve relevant information
3. Synthesise a comprehensive answer based on the retrieved information
4. Always cite your sources

If you don't have relevant information in your knowledge bases, acknowledge this limitation.
Do not make up information. Stick to what you can verify from your knowledge tools.
"""
```

### LLM Interaction

The agent interacts with an LLM for various purposes:

```python
# Creating the assistant
assistant = client.beta.assistants.create(
    name="CommandCore",
    instructions=system_prompt,
    tools=tools,
    model="gpt-4-turbo"
)

# Creating a thread for conversation
thread = client.beta.threads.create()

# Adding a user message
message = client.beta.threads.messages.create(
    thread_id=thread.id,
    role="user",
    content="What are the key components of a RAG system?"
)

# Running the assistant
run = client.beta.threads.runs.create(
    thread_id=thread.id,
    assistant_id=assistant.id
)

# Handling tool calls
if run.required_action:
    tool_calls = run.required_action.submit_tool_outputs.tool_calls
    tool_outputs = []
    
    for tool_call in tool_calls:
        function_name = tool_call.function.name
        function_args = json.loads(tool_call.function.arguments)
        
        # Call the appropriate function
        if function_name == "ai_knowledge_tool":
            output = ai_knowledge_tool(function_args["query"])
        elif function_name == "cloud_knowledge_tool":
            output = cloud_knowledge_tool(function_args["query"])
        elif function_name == "virt_os_knowledge_tool":
            output = virt_os_knowledge_tool(function_args["query"])
        
        tool_outputs.append({
            "tool_call_id": tool_call.id,
            "output": json.dumps(output)
        })
    
    # Submit tool outputs back to the assistant
    run = client.beta.threads.runs.submit_tool_outputs(
        thread_id=thread.id,
        run_id=run.id,
        tool_outputs=tool_outputs
    )
```

## OpenAI Agents SDK Integration

### Overview

CommandCore's orchestration layer is built on the OpenAI Agents Python SDK, a production-ready framework for creating and managing autonomous AI agents. This SDK provides a robust foundation for multi-agent systems with built-in safety controls and debugging capabilities.

### Core Components

#### Agent Definition

Agents are defined using the OpenAI Agents SDK's Python-first approach:

```python
from openai import Agent, Runner

# Define the agent with specific capabilities
agent = Agent(
    name="CommandCore",
    llm="gpt-4-turbo",
    instructions="""
    You are CommandCore, an AI assistant with access to specialised knowledge bases.
    Your goal is to provide accurate, helpful responses based on domain-specific information.
    
    When processing a query:
    1. Determine relevant domain(s): AI, Cloud Computing, or Virtualisation/OS
    2. Use appropriate knowledge tools to retrieve information
    3. Synthesise comprehensive answers with source citations
    4. Maintain conversation context for follow-up queries
    """,
    tools=domain_tools  # List of available tools
)

# Create a runner for agent execution
runner = Runner(agent)
```

#### Tool Integration

Tools are defined as Python functions with type-safe inputs and outputs:

```python
from typing import Dict, List
from openai.types import FunctionTool

@FunctionTool
def ai_knowledge_tool(query: str) -> Dict:
    """Searches the AI knowledge base using PostgresML vector search.
    
    Args:
        query: The user's question about AI topics
        
    Returns:
        Dict containing answer and sources
    """
    conn = get_db_connection("ai")
    query_embedding = generate_embedding(conn, query)
    chunks = retrieve_relevant_chunks(conn, query_embedding)
    
    return {
        "answer": synthesise_answer_in_db(conn, chunks, query),
        "sources": extract_sources(chunks)
    }

# Register tools with the agent
domain_tools = [
    ai_knowledge_tool,
    cloud_knowledge_tool,
    virt_os_knowledge_tool
]
```

#### Agent Loop and Task Handoff

The SDK manages the agent's decision-making loop:

```python
async def process_query(query: str):
    # Start the agent loop
    result = await runner.run({
        "task": query,
        "context": get_conversation_context()
    })
    
    # Handle potential task handoffs
    if result.needs_handoff:
        specialist_agent = get_specialist_agent(result.domain)
        result = await specialist_agent.run(result.handoff_context)
    
    return result.response
```

#### Safety Controls and Debugging

Built-in guardrails and tracing capabilities:

```python
from openai.types import Guardrails, TracingConfig

# Configure safety guardrails
guardrails = Guardrails(
    input_validation=True,
    output_validation=True,
    tool_call_validation=True,
    sensitive_data_detection=True
)

# Enable comprehensive tracing
tracing = TracingConfig(
    enabled=True,
    log_level="INFO",
    store_messages=True,
    store_tool_calls=True
)

# Apply to agent
agent.configure(
    guardrails=guardrails,
    tracing=tracing
)
```

### Integration with CommandCore

The OpenAI Agents SDK is integrated into CommandCore's architecture in several ways:

1. **Query Processing**:
   - Agents analyse user queries using the SDK's built-in NLP capabilities
   - Tool selection is handled by the agent loop's decision-making process
   - Type-safe function calls ensure reliable tool usage

2. **Knowledge Base Integration**:
   - Domain-specific tools connect to PostgresML vector stores
   - RAG pipeline is integrated through function tools
   - Real-time updates are supported via streaming responses

3. **Multi-Agent Coordination**:
   - Task handoff between specialised agents
   - Shared context management
   - Parallel tool execution when appropriate

4. **Monitoring and Safety**:
   - Comprehensive tracing for debugging
   - Input/output validation
   - Safety guardrails for all agent actions

## Official Resources

- [OpenAI Agents Python SDK Documentation](https://github.com/openai/openai-agents-python)
- [OpenAI Agents Examples](https://github.com/openai/openai-agents-python/tree/main/examples)
- [OpenAI Python Library](https://github.com/openai/openai-python)
- [OpenAI Assistants API Documentation](https://platform.openai.com/docs/assistants/overview)
- [Function Calling Documentation](https://platform.openai.com/docs/guides/function-calling)
