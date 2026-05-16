#!/usr/bin/env python3
"""
Migrate MataBumi data from SQLite to Supabase PostgreSQL
"""
import sqlite3
import psycopg2
import psycopg2.extras
from datetime import datetime

# Connection strings
SQLITE_DB = "backend/database/matabumi.db"
SUPABASE_URL = "postgresql://postgres.ewusmeywikyfnapvxkcr:matabumi2026@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"

def create_schema():
    """Create the deforestation_alerts table in Supabase"""
    print("📋 Creating table schema in Supabase...")
    
    conn = psycopg2.connect(SUPABASE_URL)
    cursor = conn.cursor()
    
    # Drop table if exists (for clean migration)
    cursor.execute("DROP TABLE IF EXISTS deforestation_alerts CASCADE;")
    
    # Create table
    cursor.execute("""
        CREATE TABLE deforestation_alerts (
            id SERIAL PRIMARY KEY,
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    # Create indexes
    cursor.execute("CREATE INDEX idx_province ON deforestation_alerts(province);")
    cursor.execute("CREATE INDEX idx_detected_at ON deforestation_alerts(detected_at);")
    cursor.execute("CREATE INDEX idx_severity ON deforestation_alerts(severity);")
    cursor.execute("CREATE INDEX idx_cause ON deforestation_alerts(cause);")
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print("✅ Table schema created successfully!")

def export_and_import_data():
    """Export data from SQLite and import to Supabase"""
    print("\n📤 Exporting data from SQLite...")
    
    # Connect to SQLite
    sqlite_conn = sqlite3.connect(SQLITE_DB)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cursor = sqlite_conn.cursor()
    
    # Get all alerts
    sqlite_cursor.execute("SELECT * FROM deforestation_alerts")
    alerts = sqlite_cursor.fetchall()
    
    print(f"Found {len(alerts)} alerts to migrate")
    
    if len(alerts) == 0:
        print("⚠️  No data to migrate!")
        sqlite_conn.close()
        return
    
    # Connect to Supabase
    print("\n📥 Importing data to Supabase...")
    pg_conn = psycopg2.connect(SUPABASE_URL)
    pg_cursor = pg_conn.cursor()
    
    # Prepare insert statement
    insert_query = """
        INSERT INTO deforestation_alerts (
            detected_at, province, lat, lng,
            bbox_minx, bbox_miny, bbox_maxx, bbox_maxy,
            area_ha, cause, confidence, severity,
            is_protected_zone, ndvi_before, ndvi_after, ndvi_change,
            thumbnail_path, created_at
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        )
    """
    
    # Insert each alert
    imported = 0
    for alert in alerts:
        try:
            pg_cursor.execute(insert_query, (
                alert['detected_at'],
                alert['province'],
                alert['lat'],
                alert['lng'],
                alert['bbox_minx'],
                alert['bbox_miny'],
                alert['bbox_maxx'],
                alert['bbox_maxy'],
                alert['area_ha'],
                alert['cause'],
                alert['confidence'],
                alert['severity'],
                alert['is_protected_zone'],
                alert['ndvi_before'],
                alert['ndvi_after'],
                alert['ndvi_change'],
                alert['thumbnail_path'],
                alert['created_at'] if 'created_at' in alert.keys() else datetime.utcnow()
            ))
            imported += 1
        except Exception as e:
            print(f"❌ Error importing alert {alert['id']}: {e}")
    
    pg_conn.commit()
    
    # Verify import
    pg_cursor.execute("SELECT COUNT(*) FROM deforestation_alerts")
    count = pg_cursor.fetchone()[0]
    
    print(f"✅ Successfully imported {imported} alerts!")
    print(f"✅ Verified: {count} alerts in Supabase")
    
    # Close connections
    pg_cursor.close()
    pg_conn.close()
    sqlite_cursor.close()
    sqlite_conn.close()

def verify_migration():
    """Verify the migration was successful"""
    print("\n🔍 Verifying migration...")
    
    conn = psycopg2.connect(SUPABASE_URL)
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    # Get sample data
    cursor.execute("SELECT * FROM deforestation_alerts ORDER BY detected_at DESC LIMIT 3")
    alerts = cursor.fetchall()
    
    print(f"\n📊 Sample alerts from Supabase:")
    for alert in alerts:
        print(f"  - {alert['province']}: {alert['area_ha']} ha, severity: {alert['severity']}, date: {alert['detected_at']}")
    
    # Get stats
    cursor.execute("""
        SELECT 
            COUNT(*) as total,
            SUM(area_ha) as total_area,
            COUNT(DISTINCT province) as provinces
        FROM deforestation_alerts
    """)
    stats = cursor.fetchone()
    
    print(f"\n📈 Database stats:")
    print(f"  - Total alerts: {stats['total']}")
    print(f"  - Total area: {stats['total_area']:.2f} ha")
    print(f"  - Provinces: {stats['provinces']}")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    print("🚀 Starting Supabase migration...\n")
    
    try:
        # Step 1: Create schema
        create_schema()
        
        # Step 2: Export and import data
        export_and_import_data()
        
        # Step 3: Verify
        verify_migration()
        
        print("\n✅ Migration completed successfully! 🎉")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
