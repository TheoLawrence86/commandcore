#!/usr/bin/env python3
"""
CommandCore Entry Point

This script checks prerequisites and then runs the application via Docker Compose.
It's designed to be cross-platform compatible.
"""

import os
import subprocess
import sys
import time
import shutil
import platform

def check_prerequisites():
    """Check if all prerequisites are installed."""
    print("Checking prerequisites...")
    
    # Check for Docker
    if shutil.which("docker") is None:
        print("❌ Docker is not installed. Please install Docker and try again.")
        return False
    
    # Check if Docker Compose is available (either as plugin or standalone)
    try:
        # Try the plugin version first (docker compose)
        result = subprocess.run(
            ["docker", "compose", "version"],
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            # Try the standalone version (docker-compose)
            if shutil.which("docker-compose") is None:
                print("❌ Docker Compose is not installed. Please install Docker Compose and try again.")
                return False
            else:
                print("⚠️ Using standalone docker-compose. Consider upgrading to Docker Compose V2.")
    except Exception as e:
        print(f"❌ Error checking Docker Compose: {str(e)}")
        return False
    
    # Check for OpenAI API key
    if not os.path.exists(".env"):
        print("⚠️  .env file not found. Creating from template...")
        if os.path.exists(".env.example"):
            shutil.copyfile(".env.example", ".env")
            print("⚠️  Please edit the .env file to set your OpenAI API key.")
        else:
            print("❌ .env.example file not found. Please create a .env file with your OpenAI API key.")
            return False
    
    # Check if PostgresML image is available
    try:
        result = subprocess.run(
            ["docker", "images", "postgresml/postgresml", "-q"],
            capture_output=True,
            text=True
        )
        if not result.stdout.strip():
            print("ℹ️  PostgresML image not found. It will be pulled automatically when starting.")
    except Exception as e:
        print(f"❌ Error checking Docker images: {str(e)}")
        return False
    
    print("✅ All prerequisites are met.")
    return True

def start_application():
    """Start the CommandCore application with Docker Compose."""
    print("\nStarting CommandCore application...")
    
    # Detect operating system
    system = platform.system()
    print(f"Detected operating system: {system}")
    
    try:
        # Build and start the containers
        subprocess.run(["docker", "compose", "up", "-d", "--build"], check=True)
        
        print("✅ Services started successfully!")
        
        # Wait for PostgresML to be ready - use a cross-platform sleep
        print("\nWaiting for PostgresML to be ready...")
        time.sleep(15)  # Python's time.sleep works on all platforms
        
        # Load the embedding model - use cross-platform command
        print("\nLoading embedding model...")
        if system == "Windows":
            subprocess.run(["powershell", "-Command", "./load_models.sh"], check=True)
        else:
            subprocess.run(["sh", "./load_models.sh"], check=True)
        
        # Show status
        print("\nCurrent status:")
        subprocess.run(["docker", "compose", "ps"], check=True)
        
        # Show access URLs
        print("\n=== CommandCore is now running! ===")
        print("Access the following URLs:")
        print("- Main interface:       http://localhost/")
        print("- Query UI:             http://localhost/query_ui/")
        print("- Document ingestion UI: http://localhost/ingestion_ui/")
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Error starting application: {str(e)}")
        return False
    
    return True

def main():
    """Main function to run the application."""
    print("=" * 50)
    print("CommandCore - AI Agent Orchestration System")
    print("=" * 50)
    
    # Check prerequisites
    if not check_prerequisites():
        sys.exit(1)
    
    # Start the application
    if not start_application():
        sys.exit(1)
    
    print("\nTo stop the application, run: docker compose down")
    print("To view logs, run: docker compose logs -f")

if __name__ == "__main__":
    main()
