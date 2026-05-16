import os
import sqlite3
import time
import logging
from datetime import datetime
from typing import Optional, Dict, List

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Use absolute path for Vercel environment
DATABASE_PATH = os.path.join(os.path.dirname(__file__), "../database/matabumi.db")

SEVERITY_LEVELS = ("low", "moderate", "high", "critical")
CAUSE_TYPES = ("logging", "plantation", "mining", "fire", "unknown")

def get_connection() -> sqlite3.Connection:
    if not os.path.exists(DATABASE_PATH):
        logger.error(f"Database not found at {DATABASE_PATH}")
        # Try to find it in the current directory or parent
        alt_path = os.path.join(os.getcwd(), "api/database/matabumi.db")
        if os.path.exists(alt_path):
            logger.info(f"Found database at alternative path: {alt_path}")
            conn = sqlite3.connect(alt_path)
        else:
            raise FileNotFoundError(f"SQLite database not found at {DATABASE_PATH} or {alt_path}")
    else:
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
        alert.pop("bbox_maxy")
    ]
    alert["thumbnail_url"] = _thumbnail_url(alert.get("thumbnail_path"))
    return alert

def query_alerts(filters: Dict) -> List[Dict]:
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
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(\"\"\"
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
    \"\"\")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def query_national_stats() -> Dict:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(\"\"\"
        SELECT 
            SUM(area_ha) as total_area_ha,
            COUNT(*) as total_events,
            SUM(is_protected_zone) as protected_breaches
        FROM deforestation_alerts
    \"\"\")
    row = cursor.fetchone()
    stats = dict(row)
    stats["total_area_ha"] = stats.get("total_area_ha") or 0.0
    stats["total_events"] = stats.get("total_events") or 0
    stats["protected_zone_breaches"] = stats.pop("protected_breaches") or 0
    cursor.execute(\"\"\"
        SELECT severity, COUNT(*) as count
        FROM deforestation_alerts
        GROUP BY severity
    \"\"\")
    severity_breakdown = {level: 0 for level in SEVERITY_LEVELS}
    severity_breakdown.update({
        row["severity"]: row["count"]
        for row in cursor.fetchall()
        if row["severity"] in SEVERITY_LEVELS
    })
    stats["by_severity"] = severity_breakdown
    cursor.execute(\"\"\"
        SELECT cause, COUNT(*) as count
        FROM deforestation_alerts
        GROUP BY cause
    \"\"\")
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
    cursor = conn.cursor()
    query = \"\"\"
        SELECT 
            strftime('%Y-%m', detected_at) as month,
            SUM(area_ha) as area_ha,
            COUNT(*) as event_count
        FROM deforestation_alerts
    \"\"\"
    params = []
    if province:
        query += " WHERE province = ?"
        params.append(province)
    query += " GROUP BY month ORDER BY month"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]
