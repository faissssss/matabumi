"""
Vercel Serverless Function for serving thumbnail images.
Handles: /api/thumbnails/{filename}

This function serves thumbnail images from Supabase Storage in production
and falls back to local filesystem in development.

Production (Vercel):
- Redirects to Supabase Storage public URL (302)
- Leverages Supabase CDN for fast delivery
- Requires SUPABASE_URL environment variable

Development (Local):
- Serves images from local outputs/thumbnails/ directory
- No Supabase configuration required
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

# Supabase Storage configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
BUCKET_NAME = "thumbnails"


def handler(request, context):
    """
    Serve thumbnail images from Supabase Storage (production) or filesystem (development).
    
    Args:
        request: HTTP request object with query parameters
        context: Vercel context object
        
    Returns:
        HTTP response dict with statusCode, headers, and body
    """
    # Get filename from path
    filename = request.query.get('filename', [''])[0]
    
    if not filename:
        return {
            'statusCode': 400,
            'body': 'Filename required'
        }
    
    # Security: prevent directory traversal
    if '..' in filename or '/' in filename or '\\' in filename:
        return {
            'statusCode': 400,
            'body': 'Invalid filename'
        }
    
    # Production: Redirect to Supabase Storage (if configured)
    if SUPABASE_URL and SUPABASE_KEY:
        # Generate Supabase Storage public URL
        storage_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{filename}"
        
        # Return redirect response (302)
        # This leverages Supabase's CDN for fast delivery
        return {
            'statusCode': 302,
            'headers': {
                'Location': storage_url,
                'Cache-Control': 'public, max-age=31536000, immutable'
            }
        }
    
    # Development: Fallback to local filesystem
    # This allows local development without Supabase configuration
    project_root = Path(__file__).resolve().parents[2]
    thumbnail_path = project_root / "outputs" / "thumbnails" / filename
    
    # Check if file exists
    if not thumbnail_path.exists():
        return {
            'statusCode': 404,
            'body': 'Thumbnail not found'
        }
    
    # Read and return image
    try:
        with open(thumbnail_path, 'rb') as f:
            image_data = f.read()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'image/jpeg',
                'Cache-Control': 'public, max-age=31536000, immutable'
            },
            'body': image_data,
            'isBase64Encoded': True
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': f'Error reading thumbnail: {str(e)}'
        }
