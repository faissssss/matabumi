"""
Vercel Serverless Function for serving thumbnail images.
Handles: /api/thumbnails/{filename}
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

def handler(request, context):
    """
    Serve thumbnail images from outputs/thumbnails directory.
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
    
    # Get thumbnail path
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
