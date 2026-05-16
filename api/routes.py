from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from .database_logic.db import (
    CAUSE_TYPES,
    SEVERITY_LEVELS,
    query_alerts,
    query_national_stats,
    query_province_stats,
    query_trends,
)

router = APIRouter(prefix="", tags=["matabumi"])

@router.get("/health")
def health_check() -> dict:
    return {"status": "ok", "service": "matabumi-api"}

@router.get("/alerts")
def get_alerts(
    province: Optional[str] = None,
    severity: Optional[str] = Query(default=None),
    cause: Optional[str] = Query(default=None),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = Query(default=100, ge=1, le=500),
) -> list[dict]:
    return query_alerts({
        "province": province,
        "severity": severity,
        "cause": cause,
        "start_date": start_date,
        "end_date": end_date,
        "limit": limit,
    })

@router.get("/provinces")
def get_provinces() -> list[dict]:
    return query_province_stats()

@router.get("/stats")
def get_stats() -> dict:
    return query_national_stats()

@router.get("/trends")
def get_trends(province: Optional[str] = None) -> list[dict]:
    return query_trends(province)
