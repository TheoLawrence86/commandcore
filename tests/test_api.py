#!/usr/bin/env python3
"""
Simple test script for CommandCore API endpoints.
Run this after the system is deployed to verify the APIs are working.
"""

import requests
import json
import sys
import os
import time
from datetime import datetime

# Base URLs for API services
INGESTION_API_URL = "http://localhost/api/ingestion"
ORCHESTRATOR_API_URL = "http://localhost/api/orchestrator"

def test_health_endpoints():
    """Test the health endpoints for both services."""
    print("Testing health endpoints...")
    
    # Test ingestion service health
    try:
        response = requests.get(f"{INGESTION_API_URL}/health")
        if response.status_code == 200:
            print("✅ Ingestion service health check passed")
        else:
            print(f"❌ Ingestion service health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Ingestion service health check failed: {str(e)}")
        return False
    
    # Test orchestrator service health
    try:
        response = requests.get(f"{ORCHESTRATOR_API_URL}/health")
        if response.status_code == 200:
            print("✅ Orchestrator service health check passed")
        else:
            print(f"❌ Orchestrator service health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Orchestrator service health check failed: {str(e)}")
        return False
    
    return True

def test_file_upload():
    """Test document upload to the ingestion service."""
    print("\nTesting file upload...")
    
    # Create a simple test file
    test_file_path = "test_document.txt"
    with open(test_file_path, "w") as f:
        f.write("This is a test document for CommandCore. It contains information about AI technology.")
    
    # Prepare form data
    source_info = {
        "title": "Test Document",
        "author": "Test Author",
        "publication_date": datetime.now().strftime("%Y-%m-%d")
    }
    
    files = {
        'file': open(test_file_path, 'rb')
    }
    
    data = {
        'domain': 'ai',
        'source_info': json.dumps(source_info)
    }
    
    try:
        response = requests.post(f"{INGESTION_API_URL}/v1/documents/upload", files=files, data=data)
        if response.status_code in [200, 201, 202]:
            print("✅ File upload successful")
            result = response.json()
            job_id = result.get('job_id')
            print(f"   Job ID: {job_id}")
            return job_id
        else:
            print(f"❌ File upload failed: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"❌ File upload failed: {str(e)}")
        return None
    finally:
        # Close the file
        files['file'].close()
        # Remove the test file
        if os.path.exists(test_file_path):
            os.remove(test_file_path)

def test_job_status(job_id):
    """Test checking the status of a document processing job."""
    if not job_id:
        print("Skipping job status check (no job ID)")
        return False
    
    print("\nTesting job status check...")
    max_attempts = 10
    
    for attempt in range(max_attempts):
        try:
            response = requests.get(f"{INGESTION_API_URL}/v1/documents/status/{job_id}")
            if response.status_code == 200:
                result = response.json()
                status = result.get('status')
                print(f"   Status: {status}")
                
                if status == 'completed':
                    print("✅ Document processing completed successfully")
                    return True
                elif status == 'failed':
                    print("❌ Document processing failed")
                    print(result.get('error', {}))
                    return False
                else:
                    print(f"   Progress: {result.get('progress', {}).get('percentage', 'unknown')}%")
                    print(f"   Checking again in 2 seconds... (attempt {attempt+1}/{max_attempts})")
                    time.sleep(2)
            else:
                print(f"❌ Job status check failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Job status check failed: {str(e)}")
            return False
    
    print("❌ Document processing did not complete within the time limit")
    return False

def test_query():
    """Test querying the orchestrator service."""
    print("\nTesting query...")
    
    query_data = {
        "query": "What is artificial intelligence?",
        "domain": "ai"
    }
    
    try:
        response = requests.post(f"{ORCHESTRATOR_API_URL}/v1/query", json=query_data)
        if response.status_code == 200:
            result = response.json()
            print("✅ Query successful")
            print(f"   Response: {result.get('response')[:100]}...")
            return True
        else:
            print(f"❌ Query failed: {response.status_code}")
            print(response.text)
            return False
    except Exception as e:
        print(f"❌ Query failed: {str(e)}")
        return False

def main():
    """Main test function."""
    print("=== CommandCore API Test ===")
    
    # Test health endpoints
    if not test_health_endpoints():
        print("\n❌ Health check tests failed. Make sure all services are running.")
        sys.exit(1)
    
    # Test file upload
    job_id = test_file_upload()
    
    # Test job status
    test_job_status(job_id)
    
    # Test query (may not return meaningful results if no documents in database)
    test_query()
    
    print("\n=== Test Complete ===")

if __name__ == "__main__":
    main()
