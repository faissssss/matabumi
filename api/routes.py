from typing import List, Dict, Optional
from fastapi import APIRouter, Query, HTTPException
try:
    from api.database_logic import db
except ImportError:
    from database_logic import db

router = APIRouter()

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

@router.get("/stats/provinces", response_model=List[Dict])
def get_province_stats():
    try:
        return db.query_province_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats/national", response_model=Dict)
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
