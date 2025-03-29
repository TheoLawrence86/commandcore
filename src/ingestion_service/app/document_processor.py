import os
import pdfplumber
import docx2txt
from typing import List, Dict, Any
import tiktoken
import re
from datetime import datetime
from .config import settings
from .schemas import DocumentChunk


def extract_text_from_file(file_path: str) -> str:
    """Extract text from various file formats."""
    file_extension = os.path.splitext(file_path)[1].lower()
    
    if file_extension == '.txt':
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    
    elif file_extension == '.pdf':
        text = ""
        try:
            with pdfplumber.open(file_path) as pdf:
                # Try to extract title and metadata
                metadata = {}
                if pdf.metadata:
                    metadata = pdf.metadata
                
                # Extract text from each page
                for page in pdf.pages:
                    extracted_text = page.extract_text() or ""
                    text += extracted_text + "\n\n"  # Add spacing between pages
        except Exception as e:
            print(f"Error extracting text from PDF: {str(e)}")
            text = "Error extracting text from PDF file."
        
        return text
    
    elif file_extension == '.docx':
        try:
            return docx2txt.process(file_path)
        except Exception as e:
            print(f"Error extracting text from DOCX: {str(e)}")
            return "Error extracting text from DOCX file."
    
    else:
        raise ValueError(f"Unsupported file format: {file_extension}")


def extract_metadata_from_file(file_path: str) -> Dict[str, Any]:
    """
    Extract metadata from document files (PDF, DOCX)
    Returns a dictionary with title, author, date if found
    """
    metadata = {
        "title": None,
        "author": None,
        "publication_date": None
    }
    
    file_extension = os.path.splitext(file_path)[1].lower()
    file_name = os.path.basename(file_path)
    
    # Use filename without extension as fallback title
    metadata["title"] = os.path.splitext(file_name)[0]
    
    try:
        if file_extension == '.pdf':
            with pdfplumber.open(file_path) as pdf:
                if pdf.metadata:
                    if pdf.metadata.get('Title'):
                        metadata["title"] = pdf.metadata.get('Title')
                    if pdf.metadata.get('Author'):
                        metadata["author"] = pdf.metadata.get('Author')
                    if pdf.metadata.get('CreationDate'):
                        date_str = pdf.metadata.get('CreationDate')
                        # Try to parse PDF date format (D:20230817120000Z)
                        if date_str.startswith('D:'):
                            try:
                                # Extract YYYYMMDD from PDF date format
                                year = date_str[2:6]
                                month = date_str[6:8]
                                day = date_str[8:10]
                                metadata["publication_date"] = f"{year}-{month}-{day}"
                            except:
                                pass
        
        elif file_extension == '.docx':
            # For DOCX, we can try to use docx2txt or other libraries
            # This is simplified; in production, you'd use python-docx or similar
            # to extract proper document properties
            text = docx2txt.process(file_path)
            
            # Try to find title-like text in the first few lines
            lines = text.split('\n')
            if lines and lines[0] and len(lines[0]) < 100:  # Usually titles are short
                metadata["title"] = lines[0].strip()
                
    except Exception as e:
        print(f"Error extracting metadata: {str(e)}")
    
    # Set current date as fallback for publication date
    if not metadata["publication_date"]:
        metadata["publication_date"] = datetime.now().strftime("%Y-%m-%d")
    
    return metadata


def process_document(text: str) -> List[DocumentChunk]:
    """
    Process document text into chunks suitable for storage and retrieval.
    Uses simple sliding window chunking with token-based sizing.
    """
    # Initialize the encoder
    encoder = tiktoken.encoding_for_model("gpt-3.5-turbo")
    
    # Define chunking parameters
    max_tokens_per_chunk = settings.MAX_TOKENS_PER_CHUNK
    overlap_tokens = settings.OVERLAP_TOKENS
    
    # Preprocess text - clean up newlines, extra spaces, etc.
    cleaned_text = re.sub(r'\s+', ' ', text).strip()
    
    # Tokenize the text
    tokens = encoder.encode(cleaned_text)
    
    # Initialize chunk list
    chunks = []
    
    # Use sliding window approach to create chunks
    for i in range(0, len(tokens), max_tokens_per_chunk - overlap_tokens):
        # Get token slice
        chunk_tokens = tokens[i:i + max_tokens_per_chunk]
        
        # Skip if too small
        if len(chunk_tokens) < 10:  # Arbitrary minimum size
            continue
        
        # Decode tokens back to text
        chunk_text = encoder.decode(chunk_tokens)
        
        # Create chunk object with unique ID and position information
        chunk = DocumentChunk(
            text=chunk_text,
            token_count=len(chunk_tokens),
            position=i,
            metadata={
                "start_token": i,
                "end_token": i + len(chunk_tokens)
            }
        )
        
        chunks.append(chunk)
    
    return chunks