# MataBumi API Documentation

Base URL: `http://localhost:8000` (development) or `https://your-domain.vercel.app` (production)

## Endpoints

### GET /api/alerts

Get deforestation alerts with optional filtering.

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `province` | string | Filter by province name | `Aceh` |
| `severity` | string | Filter by severity level | `high` |
| `cause` | string | Filter by deforestation cause | `logging` |
| `start_date` | string | Start date (YYYY-MM-DD) | `2026-01-01` |
| `end_date` | string | End date (YYYY-MM-DD) | `2026-12-31` |
| `limit` | integer | Maximum results (default: 100) | `50` |

**Response:**

```json
[
  {
    "id": 1,
    "detected_at": "2026-05-15",
    "province": "Aceh",
    "lat": 4.5,
    "lng": 96.0,
    "area_ha": 61553.16,
    "cause": "logging",
    "confidence": 0.62,
    "severity": "high",
    "is_protected_zone": false,
    "ndvi_before": 0.5195636418896614,
    "ndvi_after": 0.16320123250184226,
    "ndvi_change": 0.35636240938781916,
    "thumbnail_path": "outputs/thumbnails/Aceh_2026-05-15_0.jpg",
    "thumbnail_url": "/api/thumbnails/Aceh_2026-05-15_0.jpg",
    "created_at": "2026-05-15 03:14:07",
    "bbox": [95.5, 4.0, 96.5, 5.0]
  }
]
```

**Example Requests:**

```bash
# Get all alerts
curl http://localhost:8000/api/alerts

# Get alerts for Aceh province
curl http://localhost:8000/api/alerts?province=Aceh

# Get high severity alerts
curl http://localhost:8000/api/alerts?severity=high

# Get logging alerts in date range
curl "http://localhost:8000/api/alerts?cause=logging&start_date=2026-01-01&end_date=2026-12-31"

# Get latest 10 alerts
curl http://localhost:8000/api/alerts?limit=10
```

---

### GET /api/provinces

Get aggregated statistics by province.

**Query Parameters:** None

**Response:**

```json
[
  {
    "province": "Aceh",
    "event_count": 3,
    "total_area_ha": 62338.0,
    "avg_severity_score": 65.5,
    "most_common_cause": "logging",
    "protected_zone_breaches": 0
  }
]
```

**Example Request:**

```bash
curl http://localhost:8000/api/provinces
```

---

### GET /api/stats

Get national-level statistics.

**Query Parameters:** None

**Response:**

```json
{
  "total_area_ha": 62338.0,
  "total_events": 3,
  "protected_zone_breaches": 0,
  "by_severity": {
    "low": 0,
    "moderate": 2,
    "high": 1,
    "critical": 0
  },
  "by_cause": {
    "logging": 1,
    "plantation": 0,
    "mining": 0,
    "fire": 0,
    "unknown": 2
  }
}
```

**Example Request:**

```bash
curl http://localhost:8000/api/stats
```

---

### GET /api/trends

Get monthly trend data.

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `province` | string | Optional province filter | `Aceh` |

**Response:**

```json
[
  {
    "month": "2026-05",
    "event_count": 3,
    "total_area_ha": 62338.0,
    "avg_confidence": 0.61
  }
]
```

**Example Requests:**

```bash
# Get national trends
curl http://localhost:8000/api/trends

# Get trends for specific province
curl http://localhost:8000/api/trends?province=Aceh
```

---

### GET /api/forecast

Get forecast data (placeholder for future ML implementation).

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `province` | string | Optional province filter | `Aceh` |

**Response:**

```json
{
  "message": "Forecast endpoint - to be implemented with ML model",
  "province": "Aceh"
}
```

**Example Request:**

```bash
curl http://localhost:8000/api/forecast?province=Aceh
```

---

### GET /api/thumbnails/{filename}

Get satellite thumbnail image.

**Path Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `filename` | string | Thumbnail filename | `Aceh_2026-05-15_0.jpg` |

**Response:** JPEG image file

**Example Request:**

```bash
curl http://localhost:8000/api/thumbnails/Aceh_2026-05-15_0.jpg --output thumbnail.jpg
```

---

## Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

## CORS

The API supports CORS for the following origins:
- `http://localhost:5173` (development)
- `http://127.0.0.1:5173` (development)
- Production domain (configured in deployment)

## Rate Limiting

Currently no rate limiting is implemented. For production deployment, consider adding rate limiting middleware.

## Authentication

Currently no authentication is required. For production deployment with sensitive data, consider adding API key authentication.

## Data Models

### Alert Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique alert identifier |
| `detected_at` | string | Detection date (YYYY-MM-DD) |
| `province` | string | Province name |
| `lat` | float | Latitude (centroid) |
| `lng` | float | Longitude (centroid) |
| `area_ha` | float | Deforestation area in hectares |
| `cause` | string | Classified cause (logging/plantation/mining/fire/unknown) |
| `confidence` | float | Classification confidence (0.0-1.0) |
| `severity` | string | Severity level (low/moderate/high/critical) |
| `is_protected_zone` | boolean | Whether in protected province |
| `ndvi_before` | float | Mean NDVI before deforestation |
| `ndvi_after` | float | Mean NDVI after deforestation |
| `ndvi_change` | float | Mean NDVI change |
| `thumbnail_path` | string | Local thumbnail path |
| `thumbnail_url` | string | API thumbnail URL |
| `created_at` | string | Record creation timestamp |
| `bbox` | array | Bounding box [minx, miny, maxx, maxy] |

### Province Statistics Object

| Field | Type | Description |
|-------|------|-------------|
| `province` | string | Province name |
| `event_count` | integer | Number of deforestation events |
| `total_area_ha` | float | Total deforestation area in hectares |
| `avg_severity_score` | float | Average severity score |
| `most_common_cause` | string | Most frequent cause |
| `protected_zone_breaches` | integer | Number of events in protected zones |

### National Statistics Object

| Field | Type | Description |
|-------|------|-------------|
| `total_area_ha` | float | Total deforestation area nationwide |
| `total_events` | integer | Total number of events |
| `protected_zone_breaches` | integer | Events in protected zones |
| `by_severity` | object | Event counts by severity level |
| `by_cause` | object | Event counts by cause |

### Trend Data Object

| Field | Type | Description |
|-------|------|-------------|
| `month` | string | Month (YYYY-MM) |
| `event_count` | integer | Number of events in month |
| `total_area_ha` | float | Total area lost in month |
| `avg_confidence` | float | Average classification confidence |

## Error Responses

All error responses follow this format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

## Examples with Python

```python
import requests

# Get all alerts
response = requests.get('http://localhost:8000/api/alerts')
alerts = response.json()

# Get filtered alerts
params = {
    'province': 'Aceh',
    'severity': 'high',
    'limit': 10
}
response = requests.get('http://localhost:8000/api/alerts', params=params)
alerts = response.json()

# Get statistics
response = requests.get('http://localhost:8000/api/stats')
stats = response.json()
print(f"Total area lost: {stats['total_area_ha']} ha")
```

## Examples with JavaScript

```javascript
// Get all alerts
fetch('http://localhost:8000/api/alerts')
  .then(response => response.json())
  .then(alerts => console.log(alerts));

// Get filtered alerts
const params = new URLSearchParams({
  province: 'Aceh',
  severity: 'high',
  limit: 10
});
fetch(`http://localhost:8000/api/alerts?${params}`)
  .then(response => response.json())
  .then(alerts => console.log(alerts));

// Get statistics
fetch('http://localhost:8000/api/stats')
  .then(response => response.json())
  .then(stats => console.log(`Total area lost: ${stats.total_area_ha} ha`));
```

## Testing the API

Use the provided integration test script:

```bash
python test_integration.py
```

Or test individual endpoints with curl:

```bash
# Test health
curl http://localhost:8000/api/stats

# Test alerts
curl http://localhost:8000/api/alerts?limit=5

# Test provinces
curl http://localhost:8000/api/provinces

# Test trends
curl http://localhost:8000/api/trends
```
