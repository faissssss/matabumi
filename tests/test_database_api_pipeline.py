import sqlite3

import numpy as np
from fastapi.testclient import TestClient

from backend.api.main import app
from database import db
from pipeline import run as pipeline_run


SCHEMA = """
CREATE TABLE deforestation_alerts (
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
);
CREATE INDEX idx_province ON deforestation_alerts(province);
CREATE INDEX idx_detected_at ON deforestation_alerts(detected_at);
CREATE INDEX idx_severity ON deforestation_alerts(severity);
"""


class SharedConnection:
    def __init__(self, connection):
        self.connection = connection

    def __getattr__(self, name):
        return getattr(self.connection, name)

    def close(self):
        pass


def init_temp_db():
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    conn.executescript(SCHEMA)
    return conn


def sample_alert():
    return {
        "detected_at": "2026-05-14",
        "province": "Aceh",
        "lat": 4.0,
        "lng": 96.5,
        "bbox_minx": 95.0,
        "bbox_miny": 2.0,
        "bbox_maxx": 98.5,
        "bbox_maxy": 6.0,
        "area_ha": 120.0,
        "cause": "logging",
        "confidence": 0.72,
        "severity": "high",
        "is_protected_zone": 0,
        "ndvi_before": 0.7,
        "ndvi_after": 0.3,
        "ndvi_change": 0.4,
        "thumbnail_path": "outputs/thumbnails/Aceh_2026-05-14_1.jpg",
    }


def test_insert_and_query_alert_with_temp_database(monkeypatch):
    connection = init_temp_db()
    monkeypatch.setattr(db, "get_connection", lambda: SharedConnection(connection))

    alert_id = db.insert_alert(sample_alert())
    rows = db.query_alerts({"limit": 10})

    assert alert_id == 1
    assert rows[0]["bbox"] == [95.0, 2.0, 98.5, 6.0]
    assert rows[0]["thumbnail_url"] == "/api/thumbnails/Aceh_2026-05-14_1.jpg"
    connection.close()


def test_database_query_aggregations(monkeypatch):
    connection = init_temp_db()
    monkeypatch.setattr(db, "get_connection", lambda: SharedConnection(connection))
    db.insert_alert(sample_alert())

    province_stats = db.query_province_stats()
    national_stats = db.query_national_stats()
    trends = db.query_trends("Aceh")

    assert province_stats[0]["dominant_cause"] == "logging"
    assert national_stats["total_events"] == 1
    assert national_stats["by_severity"]["high"] == 1
    assert trends[0]["month"] == "2026-05"
    connection.close()


def test_api_endpoints_return_expected_shapes():
    client = TestClient(app)
    assert client.get("/api/health").status_code == 200
    assert client.get("/api/alerts").status_code == 200
    assert client.get("/api/provinces").status_code == 200
    assert client.get("/api/stats").status_code == 200
    assert client.get("/api/trends").status_code == 200
    assert client.get("/api/forecast").status_code == 200
    assert client.get("/api/alerts", params={"severity": "extreme"}).status_code == 400


def test_process_province_with_synthetic_data(monkeypatch):
    before_nir = np.ones((20, 20)) * 0.8
    before_red = np.ones((20, 20)) * 0.2
    after_nir = np.ones((20, 20)) * 0.2
    after_red = np.ones((20, 20)) * 0.4
    calls = {"fetch": 0, "inserted": None}

    def fake_fetch(_catalog, _bbox, _date_range):
        calls["fetch"] += 1
        if calls["fetch"] == 1:
            return before_nir, before_red
        return after_nir, after_red

    monkeypatch.setattr(pipeline_run, "fetch_imagery", fake_fetch)
    monkeypatch.setattr(pipeline_run, "MINIMUM_ALERT_AREA", 1)
    monkeypatch.setattr(pipeline_run, "extract_thumbnail", lambda *args, **kwargs: "outputs/thumb.jpg")
    monkeypatch.setattr(pipeline_run, "save_hero_image", lambda *args, **kwargs: "outputs/hero.png")

    def fake_insert(alert):
        calls["inserted"] = alert
        return 42

    monkeypatch.setattr(pipeline_run, "insert_alert", fake_insert)
    result = pipeline_run.process_province("Aceh", object(), "before", "after")

    assert result["success"] is True
    assert result["alert_id"] == 42
    assert calls["inserted"]["province"] == "Aceh"


def test_process_province_recovers_from_missing_imagery(monkeypatch):
    monkeypatch.setattr(pipeline_run, "fetch_imagery", lambda *args, **kwargs: (None, None))
    result = pipeline_run.process_province("Aceh", object(), "before", "after")
    assert result["success"] is False
    assert result["error"] == "No before imagery"
