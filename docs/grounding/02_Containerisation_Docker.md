# Containerisation with Docker

## Definition

**Docker** is a platform that enables developers to build, package, and distribute applications as containers. Containers are lightweight, standalone, executable packages that include everything needed to run an application: code, runtime, system tools, libraries, and settings.

**Docker Compose** is a tool for defining and running multi-container Docker applications. It uses a YAML file to configure application services, networks, and volumes, allowing the entire application stack to be launched with a single command.

## Role in CommandCore

Containerisation plays a crucial role in CommandCore by:

- **Managing dependencies**: Each service has its own container with all required dependencies, eliminating "it works on my machine" problems
- **Ensuring consistent environments**: Development, testing, and production environments remain consistent
- **Simplifying setup**: Complex multi-service architecture (databases, web services, agents) can be started with a single command
- **Isolating concerns**: Each component runs in its own container, improving security and maintainability
- **Enabling microservices**: Supports the distributed architecture of CommandCore with independent, scalable services

## Key Features Used

### Dockerfiles

Custom images are defined for each service with specific requirements:
- Base images (e.g., Python, PostgreSQL)
- Required dependencies and extensions
- Configuration settings
- Entry points

### docker-compose.yml

Orchestrates the entire CommandCore system:
- Service definitions for each component
- Network configuration for inter-service communication
- Volume mappings for persistent storage
- Environment variables for configuration
- Health checks and restart policies

### Named Volumes

Ensures data persistence across container restarts:
- PostgresML data volumes for each domain node
- Configuration volumes where needed

### Docker Networking

Enables secure communication between services:
- Internal networks for service-to-service communication
- Exposed ports only where necessary for external access
- Network isolation for security

## Official Documentation

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Hub](https://hub.docker.com/) - For base images and official containers
