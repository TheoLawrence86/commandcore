# MCP OpenAI SDK Integration

## Overview

The Model Context Protocol (MCP) integration with OpenAI SDK enables seamless connectivity between CommandCore's agent orchestration and various external tools and services. This integration allows for extensible tool usage whilst maintaining the robust safety and monitoring features of the OpenAI Agents SDK.

## MCP Server Configuration

### Setting up MCP Servers

MCP servers are configured in the `mcp_config.json` file:

```json
{
  "mcpServers": {
    "openai": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-openai"
      ],
      "env": {
        "OPENAI_API_KEY": "your_api_key_here"
      }
    },
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_github_token"
      }
    }
  }
}
```

## Integration with OpenAI Agents SDK

### Tool Registration

MCP tools can be registered with the OpenAI Agents SDK using the function tool decorator:

```python
from openai.types import FunctionTool
from mcp.tools import MCPTool

@FunctionTool
class GitHubMCPTool(MCPTool):
    """GitHub operations via MCP."""
    
    async def create_issue(self, repo: str, title: str, body: str) -> dict:
        """Create a GitHub issue using MCP."""
        return await self.mcp_client.call(
            "github",
            "create_issue",
            {
                "repo": repo,
                "title": title,
                "body": body
            }
        )

# Register with agent
agent.add_tool(GitHubMCPTool())
```

### Error Handling

Implement robust error handling for MCP tool calls:

```python
from mcp.exceptions import MCPError

async def safe_mcp_call(tool: MCPTool, method: str, **kwargs):
    try:
        return await tool.mcp_client.call(method, **kwargs)
    except MCPError as e:
        logger.error(f"MCP call failed: {e}")
        raise ToolExecutionError(f"Tool execution failed: {e}")
```

### Streaming Support

Enable streaming responses from MCP tools:

```python
async def stream_mcp_response(tool: MCPTool, method: str, **kwargs):
    async for chunk in tool.mcp_client.stream(method, **kwargs):
        yield chunk
```

## Available MCP Tools

### Current Integrations

1. **GitHub MCP**
   - Repository management
   - Issue and PR handling
   - Code search and analysis

2. **Perplexity MCP**
   - Advanced search capabilities
   - Research and analysis tools

### Infrastructure Tools

1. **Kubernetes MCP**
   ```python
   @FunctionTool
   class KubernetesMCPTool(MCPTool):
       """Kubernetes cluster management via MCP."""
       
       async def deploy_application(self, namespace: str, manifest: dict) -> dict:
           """Deploy an application to Kubernetes."""
           return await self.mcp_client.call(
               "kubernetes",
               "apply_manifest",
               {
                   "namespace": namespace,
                   "manifest": manifest
               }
           )
       
       async def get_pod_logs(self, namespace: str, pod_name: str) -> str:
           """Retrieve pod logs."""
           return await self.mcp_client.call(
               "kubernetes",
               "get_logs",
               {
                   "namespace": namespace,
                   "pod": pod_name
               }
           )
   ```

2. **Docker MCP**
   ```python
   @FunctionTool
   class DockerMCPTool(MCPTool):
       """Docker container management via MCP."""
       
       async def run_container(self, image: str, env: dict = None) -> dict:
           """Run a Docker container."""
           return await self.mcp_client.call(
               "docker",
               "run_container",
               {
                   "image": image,
                   "environment": env
               }
           )
   ```

### Database Tools

1. **SQL Generation MCP**
   ```python
   @FunctionTool
   class SQLGenerationMCPTool(MCPTool):
       """Natural language to SQL conversion via MCP."""
       
       async def generate_query(self, description: str, schema: dict) -> str:
           """Generate SQL from natural language."""
           return await self.mcp_client.call(
               "sql_generation",
               "create_query",
               {
                   "description": description,
                   "schema": schema
               }
           )
   ```

2. **Database Management MCP**
   ```python
   @FunctionTool
   class DatabaseMCPTool(MCPTool):
       """Database operations via MCP."""
       
       async def execute_query(self, connection_id: str, query: str) -> dict:
           """Execute SQL query safely."""
           return await self.mcp_client.call(
               "database",
               "execute_query",
               {
                   "connection": connection_id,
                   "query": query
               }
           )
   ```

### System Administration Tools

1. **Filesystem MCP**
   ```python
   @FunctionTool
   class FileSystemMCPTool(MCPTool):
       """File system operations via MCP."""
       
       async def read_file(self, path: str) -> str:
           """Read file contents safely."""
           return await self.mcp_client.call(
               "filesystem",
               "read_file",
               {"path": path}
           )
       
       async def write_file(self, path: str, content: str) -> bool:
           """Write content to file safely."""
           return await self.mcp_client.call(
               "filesystem",
               "write_file",
               {
                   "path": path,
                   "content": content
               }
           )
   ```

2. **Shell Command MCP**
   ```python
   @FunctionTool
   class ShellMCPTool(MCPTool):
       """Shell command execution via MCP."""
       
       async def execute_command(self, command: str, cwd: str = None) -> dict:
           """Execute shell command safely."""
           return await self.mcp_client.call(
               "shell",
               "execute",
               {
                   "command": command,
                   "working_directory": cwd
               }
           )
   ```

### Security Tools

1. **Access Control MCP**
   ```python
   @FunctionTool
   class SecurityMCPTool(MCPTool):
       """Security operations via MCP."""
       
       async def validate_access(self, resource: str, action: str) -> bool:
           """Validate access permissions."""
           return await self.mcp_client.call(
               "security",
               "check_access",
               {
                   "resource": resource,
                   "action": action
               }
           )
   ```

2. **Audit MCP**
   ```python
   @FunctionTool
   class AuditMCPTool(MCPTool):
       """Security audit operations via MCP."""
       
       async def log_action(self, action: str, details: dict) -> bool:
           """Log security-relevant actions."""
           return await self.mcp_client.call(
               "audit",
               "log_event",
               {
                   "action": action,
                   "details": details
               }
           )
   ```

## Security Considerations

1. **API Key Management**
   - Store API keys securely using environment variables
   - Rotate keys regularly
   - Use different keys for development and production

2. **Access Control**
   - Implement tool-specific permissions
   - Validate all inputs before MCP calls
   - Monitor and audit tool usage

3. **Error Handling**
   - Implement graceful fallbacks
   - Log all failures for analysis
   - Rate limit tool calls as needed

## Monitoring and Debugging

### Tracing MCP Calls

Enable detailed tracing for MCP tool calls:

```python
from openai.types import TracingConfig

tracing = TracingConfig(
    enabled=True,
    log_level="DEBUG",
    store_messages=True,
    store_tool_calls=True,
    mcp_call_logging=True  # Enable MCP-specific logging
)

agent.configure(tracing=tracing)
```

### Metrics Collection

Monitor MCP tool performance:

```python
async def log_mcp_metrics(tool: MCPTool, method: str, start_time: float):
    duration = time.time() - start_time
    metrics.gauge(
        f"mcp.tool.duration",
        duration,
        tags={
            "tool": tool.name,
            "method": method
        }
    )
```

## Best Practices

1. **Tool Design**
   - Keep tools focused and single-purpose
   - Document all parameters clearly
   - Provide meaningful error messages
   - Include usage examples
   - Implement proper access controls
   - Validate all inputs thoroughly

2. **Performance**
   - Cache responses where appropriate
   - Implement retries with backoff
   - Monitor response times
   - Optimise payload sizes
   - Use connection pooling for databases
   - Implement rate limiting

3. **Maintenance**
   - Keep MCP servers updated
   - Monitor for deprecation notices
   - Test tools regularly
   - Document version compatibility
   - Maintain security patches
   - Monitor resource usage

4. **Security**
   - Implement least privilege access
   - Audit all operations
   - Sanitise all inputs
   - Encrypt sensitive data
   - Monitor for suspicious activity
   - Regular security assessments

## Official Resources

- [Model Context Protocol Documentation](https://github.com/modelcontextprotocol/spec)
- [OpenAI Agents SDK MCP Guide](https://github.com/openai/openai-agents-python/tree/main/docs/mcp)
- [MCP Server Templates](https://github.com/modelcontextprotocol/server-templates)
