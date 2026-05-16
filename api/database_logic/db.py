import os
import psycopg2
import psycopg2.extras
import logging
from datetime import datetime
from typing import Optional, Dict, List

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Supabase PostgreSQL connection (pooler for serverless)
DATABASE_URL = os.getenv("SUPABASE_DB_URL")

if not DATABASE_URL:
    logger.error("SUPABASE_DB_URL environment variable not set!")
    raise ValueError("SUPABASE_DB_URL environment variable is required")

SEVERITY_LEVELS = ("low", "moderate", "high", "critical")
CAUSE_TYPES = ("logging", "plantation", "mining", "fire", "unknown")

def get_connection():
    """Get PostgreSQL connection using Supabase pooler"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        logger.error(f"Failed to connect to Supabase: {e}")
        raise

def _thumbnail_url(thumbnail_path: Optional[str]) -> Optional[str]:
    if not thumbnail_path:
        return None
    filename = os.path.basename(thumbnail_path.replace("\\", "/"))
    return f"/api/thumbnails/{filename}"

def _format_alert(row: Dict) -> Dict:
    alert = dict(row)
    alert["bbox"] = [
        alert.pop("bbox_minx"),
        alert.pop("bbox_miny"),
        alert.pop("bbox_maxx"),
        alert.pop("bbox_maxy")
    ]
    alert["thumbnail_url"] = _thumbnail_url(alert.get("thumbnail_path"))
    return alert

def query_alerts(filters: Dict) -> List[Dict]:
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    query = "SELECT * FROM deforestation_alerts WHERE 1=1"
    params = []
    if filters.get("province"):
        query += " AND province = %s"
        params.append(filters["province"])
    if filters.get("severity"):
        query += " AND severity = %s"
        params.append(filters["severity"])
    if filters.get("cause"):
        query += " AND cause = %s"
        params.append(filters["cause"])
    if filters.get("start_date"):
        query += " AND detected_at >= %s"
        params.append(filters["start_date"])
    if filters.get("end_date"):
        query += " AND detected_at <= %s"
        params.append(filters["end_date"])
    query += " ORDER BY detected_at DESC"
    try:
        limit = int(filters.get("limit", 100))
    except (TypeError, ValueError):
        limit = 100
    limit = max(1, min(limit, 500))
    query += " LIMIT %s"
    params.append(limit)
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [_format_alert(row) for row in rows]

def query_province_stats() -> List[Dict]:
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
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
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
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
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    query = """
        SELECT 
            TO_CHAR(detected_at, 'YYYY-MM') as month,
            SUM(area_ha) as area_ha,
            COUNT(*) as event_count
        FROM deforestation_alerts
    """
    params = []
    if province:
        query += " WHERE province = %s"
        params.append(province)
    query += " GROUP BY month ORDER BY month"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]
