"""
Database operations module for MataBumi.
Handles SQLite connections, alert insertion, and query functions.
"""

import os
import sqlite3
import time
import logging
from datetime import datetime
from typing import Optional, Dict, List

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_PATH = os.getenv(
    "DATABASE_PATH",
    os.path.join(os.path.dirname(__file__), "../database/matabumi.db")
)

SEVERITY_LEVELS = ("low", "moderate", "high", "critical")
CAUSE_TYPES = ("logging", "plantation", "mining", "fire", "unknown")


def get_connection() -> sqlite3.Connection:
    """
    Returns SQLite connection with row factory for dict-like access.
    
    Returns:
        sqlite3.Connection with row_factory configured
    
    Requirements: 7.11
    """
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _thumbnail_url(thumbnail_path: Optional[str]) -> Optional[str]:
    if not thumbnail_path:
        return None

    filename = os.path.basename(thumbnail_path.replace("\\", "/"))
    return f"/api/thumbnails/{filename}"


def _format_alert(row: sqlite3.Row) -> Dict:
    alert = dict(row)
    alert["bbox"] = [
        alert.pop("bbox_minx"),
        alert.pop("bbox_miny"),
        alert.pop("bbox_maxx"),
        alert.pop("bbox_maxy"),
    ]
    alert["is_protected_zone"] = bool(alert.get("is_protected_zone"))
    alert["thumbnail_url"] = _thumbnail_url(alert.get("thumbnail_path"))
    return alert


def insert_alert(alert: Dict) -> Optional[int]:
    """
    Insert deforestation alert record into database with retry logic.
    
    Handles database locked errors with exponential backoff (3 attempts, 1s delay).
    Validates required fields before insertion.
    
    Args:
        alert: Dictionary containing alert data with keys:
            - detected_at (required)
            - province (required)
            - lat (required)
            - lng (required)
            - bbox_minx, bbox_miny, bbox_maxx, bbox_maxy
            - area_ha (required)
            - cause
            - confidence
            - severity
            - is_protected_zone
            - ndvi_before, ndvi_after, ndvi_change
            - thumbnail_path
    
    Returns:
        Generated alert ID or None on error
    
    Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.12, 7.13
    """
    # Validate required fields
    required_fields = ["detected_at", "province", "lat", "lng", "area_ha"]
    for field in required_fields:
        if field not in alert:
            logger.error(f"Missing required field: {field}")
            return None
    
    # Retry logic for database locked errors
    max_attempts = 3
    delay = 1.0
    
    for attempt in range(max_attempts):
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO deforestation_alerts (
                    detected_at, province, lat, lng,
                    bbox_minx, bbox_miny, bbox_maxx, bbox_maxy,
                    area_ha, cause, confidence, severity,
                    is_protected_zone, ndvi_before, ndvi_after, ndvi_change,
                    thumbnail_path
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                alert["detected_at"],
                alert["province"],
                alert["lat"],
                alert["lng"],
                alert.get("bbox_minx"),
                alert.get("bbox_miny"),
                alert.get("bbox_maxx"),
                alert.get("bbox_maxy"),
                alert["area_ha"],
                alert.get("cause"),
                alert.get("confidence"),
                alert.get("severity"),
                alert.get("is_protected_zone", 0),
                alert.get("ndvi_before"),
                alert.get("ndvi_after"),
                alert.get("ndvi_change"),
                alert.get("thumbnail_path")
            ))
            
            alert_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            logger.info(f"✓ Inserted alert ID {alert_id} for {alert['province']}: "
                       f"{alert['area_ha']:.1f} ha, severity={alert.get('severity', 'N/A')}")
            
            return alert_id
            
        except sqlite3.OperationalError as e:
            if "database is locked" in str(e) and attempt < max_attempts - 1:
                logger.warning(f"Database locked, retrying in {delay}s (attempt {attempt + 1}/{max_attempts})")
                time.sleep(delay)
                delay *= 2  # Exponential backoff
            else:
                logger.error(f"Database error: {e}")
                return None
        
        except Exception as e:
            logger.error(f"Error inserting alert: {e}")
            return None
    
    return None


def query_alerts(filters: Dict) -> List[Dict]:
    """
    Query deforestation alerts with optional filters.
    
    Args:
        filters: Dictionary with optional keys:
            - province: Filter by province name
            - severity: Filter by severity level
            - cause: Filter by cause category
            - start_date: Filter by detected_at >= start_date
            - end_date: Filter by detected_at <= end_date
            - limit: Maximum number of results (default: 100)
    
    Returns:
        List of alert dictionaries
    
    Requirements: Design Section 4.3
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM deforestation_alerts WHERE 1=1"
    params = []
    
    if filters.get("province"):
        query += " AND province = ?"
        params.append(filters["province"])
    
    if filters.get("severity"):
        query += " AND severity = ?"
        params.append(filters["severity"])
    
    if filters.get("cause"):
        query += " AND cause = ?"
        params.append(filters["cause"])
    
    if filters.get("start_date"):
        query += " AND detected_at >= ?"
        params.append(filters["start_date"])
    
    if filters.get("end_date"):
        query += " AND detected_at <= ?"
        params.append(filters["end_date"])
    
    query += " ORDER BY detected_at DESC"

    try:
        limit = int(filters.get("limit", 100))
    except (TypeError, ValueError):
        limit = 100
    limit = max(1, min(limit, 500))
    query += " LIMIT ?"
    params.append(limit)

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return [_format_alert(row) for row in rows]


def query_province_stats() -> List[Dict]:
    """
    Query aggregated statistics per province.
    
    Returns:
        List of province statistics with:
        - province name
        - total area lost (hectares)
        - event count
        - dominant cause
        - critical event count
    
    Requirements: Design Section 4.3
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        WITH cause_counts AS (
            SELECT
                province,
                cause,
                COUNT(*) AS cause_count,
                ROW_NUMBER() OVER (
                    PARTITION BY province
                    ORDER BY COUNT(*) DESC, cause ASC
                ) AS cause_rank
            FROM deforestation_alerts
            GROUP BY province, cause
        )
        SELECT
            alerts.province,
            SUM(alerts.area_ha) AS total_area_ha,
            COUNT(*) AS event_count,
            COALESCE(cause_counts.cause, 'unknown') AS dominant_cause,
            SUM(CASE WHEN alerts.severity = 'critical' THEN 1 ELSE 0 END) AS critical_count,
            MAX(alerts.detected_at) AS latest_detection
        FROM deforestation_alerts alerts
        LEFT JOIN cause_counts
            ON alerts.province = cause_counts.province
            AND cause_counts.cause_rank = 1
        GROUP BY alerts.province, cause_counts.cause
        ORDER BY total_area_ha DESC
    """)
    
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]


def query_national_stats() -> Dict:
    """
    Query national-level statistics.
    
    Returns:
        Dictionary with:
        - total hectares lost
        - total events
        - breakdown by severity
        - breakdown by cause
        - protected zone breaches
    
    Requirements: Design Section 4.3
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    # Total stats
    cursor.execute("""
        SELECT 
            SUM(area_ha) as total_area_ha,
            COUNT(*) as total_events,
            SUM(is_protected_zone) as protected_breaches
        FROM deforestation_alerts
    """)
    
    row = cursor.fetchone()
    stats = dict(row)
    stats["total_area_ha"] = stats.get("total_area_ha") or 0.0
    stats["total_events"] = stats.get("total_events") or 0
    stats["protected_zone_breaches"] = stats.pop("protected_breaches") or 0
    
    # Breakdown by severity
    cursor.execute("""
        SELECT severity, COUNT(*) as count
        FROM deforestation_alerts
        GROUP BY severity
    """)
    
    severity_breakdown = {level: 0 for level in SEVERITY_LEVELS}
    severity_breakdown.update({
        row["severity"]: row["count"]
        for row in cursor.fetchall()
        if row["severity"] in SEVERITY_LEVELS
    })
    stats["by_severity"] = severity_breakdown
    
    # Breakdown by cause
    cursor.execute("""
        SELECT cause, COUNT(*) as count
        FROM deforestation_alerts
        GROUP BY cause
    """)
    
    cause_breakdown = {cause: 0 for cause in CAUSE_TYPES}
    cause_breakdown.update({
        row["cause"]: row["count"]
        for row in cursor.fetchall()
        if row["cause"] in CAUSE_TYPES
    })
    stats["by_cause"] = cause_breakdown
    stats["latest_update"] = datetime.utcnow().isoformat(timespec="seconds") + "Z"
    
    conn.close()
    
    return stats


def query_trends(province: Optional[str] = None) -> List[Dict]:
    """
    Query time-series data for trend charts.
    
    Groups alerts by month and returns monthly totals.
    
    Args:
        province: Optional province filter
    
    Returns:
        List of trend points with month, area_ha, event_count
    
    Requirements: Design Section 4.3
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    query = """
        SELECT 
            strftime('%Y-%m', detected_at) as month,
            SUM(area_ha) as area_ha,
            COUNT(*) as event_count
        FROM deforestation_alerts
    """
    
    params = []
    if province:
        query += " WHERE province = ?"
        params.append(province)
    
    query += " GROUP BY month ORDER BY month"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]
