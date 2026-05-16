"""
Database initialization for Vercel serverless environment.
Copies the database to /tmp on cold start if needed.
"""

import os
import shutil
import sqlite3
from pathlib import Path

def init_database():
    """
    Initialize database for Vercel serverless environment.
    
    Vercel's filesystem is read-only except for /tmp.
    This function:
    1. Checks if database exists in /tmp
    2. If not, copies from project or creates new one
    3. Returns path to working database
    """
    # Use /tmp for writable storage on Vercel
    tmp_db_path = "/tmp/matabumi.db"
    
    # Check if database already exists in /tmp (warm start)
    if os.path.exists(tmp_db_path):
        return tmp_db_path
    
    # Cold start - need to initialize database
    project_root = Path(__file__).resolve().parents[1]
    source_db_path = project_root / "backend" / "database" / "matabumi.db"
    
    # If source database exists, copy it
    if source_db_path.exists():
        shutil.copy2(source_db_path, tmp_db_path)
        print(f"✓ Copied database from {source_db_path} to {tmp_db_path}")
        return tmp_db_path
    
    # Otherwise, create new database with schema
    print(f"Creating new database at {tmp_db_path}")
    conn = sqlite3.connect(tmp_db_path)
    cursor = conn.cursor()
    
    # Create schema
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS deforestation_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            detected_at TEXT NOT NULL,
            province TEXT NOT NULL,
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            bbox_minx REAL,
            bbox_miny REAL,
            bbox_maxx REAL,
            bbox_maxy REAL,
            area_ha REAL NOT NULL,
            cause TEXT,
            confidence REAL,
            severity TEXT,
            is_protected_zone INTEGER DEFAULT 0,
            ndvi_before REAL,
            ndvi_after REAL,
            ndvi_change REAL,
            thumbnail_path TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create indexes
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_province 
        ON deforestation_alerts(province)
    """)
    
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_detected_at 
        ON deforestation_alerts(detected_at)
    """)
    
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_severity 
        ON deforestation_alerts(severity)
    """)
    
    conn.commit()
    conn.close()
    
    print(f"✓ Created new database at {tmp_db_path}")
    return tmp_db_path

# Set environment variable for database path
os.environ["DATABASE_PATH"] = init_database()
