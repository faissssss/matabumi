from typing import List, Dict, Optional
from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import RedirectResponse, Response
import os
from pathlib import Path

try:
    from api.database_logic import db
except ImportError:
    from database_logic import db

router = APIRouter()

# Supabase Storage configuration for thumbnails
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
BUCKET_NAME = "thumbnails"

@router.get("/alerts", response_model=List[Dict])
def get_alerts(
    province: Optional[str] = None,
    severity: Optional[str] = None,
    cause: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500)
):
    filters = {
        "province": province,
        "severity": severity,
        "cause": cause,
        "start_date": start_date,
        "end_date": end_date,
        "limit": limit
    }
    try:
        return db.query_alerts(filters)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/provinces", response_model=List[Dict])
def get_province_stats():
    try:
        return db.query_province_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats", response_model=Dict)
def get_national_stats():
    try:
        return db.query_national_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/trends", response_model=List[Dict])
def get_trends(province: Optional[str] = None):
    try:
        return db.query_trends(province)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Keep old endpoints for backward compatibility
@router.get("/stats/provinces", response_model=List[Dict])
def get_province_stats_old():
    return get_province_stats()

@router.get("/stats/national", response_model=Dict)
def get_national_stats_old():
    return get_national_stats()

@router.get("/thumbnails/{filename}")
def get_thumbnail(filename: str):
    """
    Serve thumbnail images from Supabase Storage (production) or filesystem (development).
    
    Production (Vercel):
    - Redirects to Supabase Storage public URL (302)
    - Leverages Supabase CDN for fast delivery
    
    Development (Local):
    - Serves images from local outputs/thumbnails/ directory
    """
    # Security: prevent directory traversal
    if '..' in filename or '/' in filename or '\\' in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    
    # Production: Redirect to Supabase Storage (if configured)
    if SUPABASE_URL and SUPABASE_KEY:
        # Generate Supabase Storage public URL
        storage_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{filename}"
        
        # Return redirect response (302)
        return RedirectResponse(
            url=storage_url,
            status_code=302,
            headers={"Cache-Control": "public, max-age=31536000, immutable"}
        )
    
    # Development: Fallback to local filesystem
    project_root = Path(__file__).resolve().parents[1]
    thumbnail_path = project_root / "outputs" / "thumbnails" / filename
    
    # Check if file exists
    if not thumbnail_path.exists():
        raise HTTPException(status_code=404, detail="Thumbnail not found")
    
    # Read and return image
    try:
        with open(thumbnail_path, 'rb') as f:
            image_data = f.read()
        
        return Response(
            content=image_data,
            media_type="image/jpeg",
            headers={"Cache-Control": "public, max-age=31536000, immutable"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading thumbnail: {str(e)}")
