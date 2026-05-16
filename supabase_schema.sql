-- MataBumi Deforestation Alerts Table Schema for Supabase (PostgreSQL)

CREATE TABLE IF NOT EXISTS deforestation_alerts (
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_province ON deforestation_alerts(province);
CREATE INDEX IF NOT EXISTS idx_detected_at ON deforestation_alerts(detected_at);
CREATE INDEX IF NOT EXISTS idx_severity ON deforestation_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_cause ON deforestation_alerts(cause);

-- Add comments for documentation
COMMENT ON TABLE deforestation_alerts IS 'Stores deforestation alert data from satellite imagery analysis';
COMMENT ON COLUMN deforestation_alerts.detected_at IS 'Date when deforestation was detected';
COMMENT ON COLUMN deforestation_alerts.province IS 'Indonesian province name';
COMMENT ON COLUMN deforestation_alerts.area_ha IS 'Deforestation area in hectares';
COMMENT ON COLUMN deforestation_alerts.severity IS 'Alert severity: low, moderate, high, critical';
COMMENT ON COLUMN deforestation_alerts.cause IS 'Classified cause: logging, plantation, mining, fire, unknown';
