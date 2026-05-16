"""
Database initialization script for MataBumi deforestation monitoring system.
Creates the SQLite database schema with tables and indexes.
"""

import sqlite3
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_PATH = os.path.join(os.path.dirname(__file__), "matabumi.db")

def init_database():
    """
    Initialize the SQLite database with schema and indexes.
    Creates deforestation_alerts table if it doesn't exist.
    """
    logger.info(f"Initializing database at {DATABASE_PATH}")
    
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Create deforestation_alerts table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS deforestation_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            detected_at DATE NOT NULL,
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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create indexes for fast querying
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
    
    logger.info("Database initialization complete")

if __name__ == "__main__":
    init_database()
