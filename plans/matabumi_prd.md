# MataBumi — Product Requirements Document

**Version:** 3.0 (Updated from Spec)  
**Last Updated:** May 14, 2026  
**Spec Location:** `.kiro/specs/matabumi-deforestation-pipeline/`  
**Status:** Design and Requirements Approved, Implementation Ready

---

## Executive Summary

MataBumi is a national forest transparency web application for Indonesia that detects deforestation across 38 provinces using satellite imagery, classifies causes using rule-based pattern analysis, and visualizes results through an interactive React dashboard with switchable map layers.

The system processes Sentinel-2 satellite imagery from Microsoft Planetary Computer to identify vegetation loss through NDVI change detection, classifies the likely cause using shape metrics and geographic heuristics, scores severity based on area and protected zone status, and stores alerts in a local SQLite database for web visualization.

**Key Innovation:** Free-tier deployment with no cloud database dependencies, using local SQLite + filesystem storage deployed to Vercel.

---

## The Problem

| Dimension | Reality |
|---|---|
| **Scale** | Indonesia lost 470,000 hectares of forest in 9 months of 2025 |
| **Visibility** | No Indonesian-language public dashboard exists for real-time deforestation monitoring |
| **Accountability** | Without public visibility, illegal clearing goes uncontested |
| **Economic Risk** | EU Deforestation Regulation threatens Indonesia's USD 20B palm oil exports |
| **Existing Tools** | Global Forest Watch: English only, no provincial breakdown, no severity scoring |
| **Public Awareness** | Most Indonesians unaware of deforestation rates in their provinces |

**Core Insight:** You cannot hold anyone accountable for something the public cannot see. MataBumi makes deforestation visible to everyone.

---

## Solution Overview

```
Every 30 days (local execution):

Sentinel-2 Satellite Imagery
      ↓
Microsoft Planetary Computer (free API)
      ↓
Python NDVI Pipeline (change detection)
      ↓
Rule-Based Classifier (cause classification)
      ↓
SQLite Database (local storage)
      ↓
FastAPI Backend (REST API)
      ↓
React Dashboard (interactive map)
      ↓
Vercel Deployment (free tier)
```

**No cloud database. No blob storage. No subscription fees.**

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Satellite Imagery** | Microsoft Planetary Computer | Free Sentinel-2 data API |
| **Detection Pipeline** | Python 3.11+ (NumPy, SciPy) | NDVI calculation and change detection |
| **Classification** | Rule-based heuristics | Shape analysis + geographic context |
| **Data Storage** | SQLite | Local file-based database |
| **Thumbnail Storage** | Local filesystem | JPEG files in outputs/thumbnails/ |
| **Backend API** | FastAPI | REST endpoints for frontend |
| **Frontend** | React + Vite + TypeScript | Interactive web dashboard |
| **Mapping** | Leaflet.js | Interactive Indonesia map |
| **Visualization** | Chart.js | Trend charts and statistics |
| **Styling** | Tailwind CSS | Modern responsive design |
| **Deployment** | Vercel | Free-tier hosting |
| **Testing** | pytest + hypothesis | Unit and property-based tests |

---

## Core Features

### 1. Interactive Map Dashboard

**Base Layers** (radio selection):
- Satellite (Esri World Imagery)
- Street (OpenStreetMap)
- Terrain (OpenTopoMap)
- Dark Mode (CartoDB Dark Matter)

**Overlay Layers** (checkbox toggles):
- Province Boundaries (GeoJSON)
- Deforestation Heatmap (intensity-based)
- Protected Areas (highlighted provinces)
- Event Markers (color-coded by severity)

**Marker Color Coding:**
- 🟢 Green: Low severity (< 35 score)
- 🟡 Yellow: Moderate severity (35-59 score)
- 🟠 Orange: High severity (60-79 score)
- 🔴 Red: Critical severity (≥ 80 score or protected zone)

### 2. Sidebar Filters and Statistics

**Summary Stats:**
- Total hectares lost
- Total events detected
- Critical events count
- Protected zone breaches

**Filters:**
- Province dropdown (38 options)
- Severity checkboxes (low/moderate/high/critical)
- Cause checkboxes (logging/plantation/mining/fire/unknown)
- Date range picker

**Province List:**
- Scrollable list with event counts
- Click to zoom map to province

### 3. Event Details Card

**Displays:**
- Satellite thumbnail image (256x256 RGB patch)
- Province name
- Detection date
- Area (hectares)
- Cause with confidence percentage
- Severity badge (color-coded)
- Coordinates (lat, lng)
- NDVI values (before/after/change)

### 4. Trend Visualizations

**Chart Types:**
- Line chart: Monthly area lost over time
- Bar chart: Events by cause category
- Stacked area: Cumulative loss by province

### 5. Impact Calculator

**Interactive Widget:**
- Slider (0-100% reduction)
- Real-time calculations:
  - Hectares saved
  - CO₂ avoided (hectares × 150 tC/ha × 3.67)
  - Economic value (CO₂ × $15/tonne)
  - Football fields equivalent (hectares / 0.714)

### 6. Bilingual Support

**Languages:**
- English (EN)
- Indonesian (Bahasa Indonesia, ID)

**Translated Elements:**
- All UI labels and text
- Severity levels: critical="kritis", high="tinggi", moderate="sedang", low="rendah"
- Cause categories: logging="penebangan", plantation="perkebunan", mining="pertambangan", fire="kebakaran", unknown="tidak diketahui"
- Default: Indonesian (ID)

---

## How the Detection Works

### Step 1: NDVI Calculation

NDVI (Normalized Difference Vegetation Index) measures vegetation density:

```
NDVI = (NIR - Red) / (NIR + Red + ε)
```

- **NIR:** Near-Infrared band (Sentinel-2 Band 8)
- **Red:** Red band (Sentinel-2 Band 4)
- **ε:** Epsilon (1e-10) to prevent division by zero

**NDVI Values:**
- +1.0 = Dense healthy forest
- 0.0 = Bare soil, cleared land
- -1.0 = Water bodies

### Step 2: Change Detection

Compare NDVI values between two time periods:

```
Change = NDVI_before - NDVI_after
Deforestation = Change > 0.2
```

**Time Periods:**
- **Before:** 60-90 days prior to current date
- **After:** 0-30 days prior to current date

**Area Calculation:**
```
Area (hectares) = Pixel count × (Resolution² / 10000)
```

**Minimum Alert Area:** 50 hectares

### Step 3: Cause Classification (Rule-Based)

**Shape Metrics:**
- **Fragmentation:** Number of patches / Total area
- **Compactness:** Perimeter² / (4π × Area)
- **Intensity:** Mean NDVI change in deforested pixels

**Decision Rules:**

| Cause | Pattern Indicators |
|---|---|
| **Plantation** | Compactness < 1.5, Fragmentation < 0.1 (geometric clearing) |
| **Mining** | Intensity > 0.4, Compactness < 2.0 (high intensity, circular) |
| **Logging** | Fragmentation > 0.15, Compactness > 2.5 (irregular, fragmented) |
| **Fire** | Patches < 3, Area > 1000 pixels (large contiguous) |
| **Unknown** | Default when no clear pattern matches |

**Geographic Heuristics:**
- Mining provinces: Kalimantan Timur, Papua, Maluku (+0.10 confidence)
- Plantation provinces: Riau, Sumatera Selatan, Kalimantan Tengah (+0.10 confidence)

**Confidence Range:** 0.60 to 0.85

### Step 4: Severity Scoring

**Formula:**
```
Score = (Area Score × 0.4) + (Cause Weight × 100 × 0.4) + (Protected Bonus)
```

**Area Scores:**
- < 100 ha: 20
- 100-499 ha: 40
- 500-1999 ha: 70
- ≥ 2000 ha: 90

**Cause Weights:**
- Logging: 1.0
- Mining: 0.9
- Plantation: 0.7
- Fire: 0.5
- Unknown: 0.6

**Protected Bonus:** +20 points if in protected province

**Severity Labels:**
- Score < 35: "low"
- Score 35-59: "moderate"
- Score 60-79: "high"
- Score ≥ 80 OR protected: "critical"

**Protected Provinces:** Papua, Papua Barat, Kalimantan Timur

---

## Province Coverage

The system monitors all **38 provinces** of Indonesia:

### Sumatra (10 provinces)
Aceh, Sumatera Utara, Sumatera Barat, Riau, Kepulauan Riau, Jambi, Sumatera Selatan, Kepulauan Bangka Belitung, Bengkulu, Lampung

### Java & Bali (7 provinces)
Banten, DKI Jakarta, Jawa Barat, Jawa Tengah, DI Yogyakarta, Jawa Timur, Bali

### Nusa Tenggara (2 provinces)
Nusa Tenggara Barat, Nusa Tenggara Timur

### Kalimantan (5 provinces)
Kalimantan Barat, Kalimantan Tengah, Kalimantan Selatan, Kalimantan Timur, Kalimantan Utara

### Sulawesi (6 provinces)
Sulawesi Utara, Gorontalo, Sulawesi Tengah, Sulawesi Barat, Sulawesi Selatan, Sulawesi Tenggara

### Maluku (2 provinces)
Maluku, Maluku Utara

### Papua (6 provinces)
Papua Barat, Papua Barat Daya, Papua, Papua Selatan, Papua Tengah, Papua Pegunungan

---

## API Endpoints

### GET /api/alerts
Returns filtered list of deforestation alerts.

**Query Parameters:**
- `province`: Filter by province name
- `severity`: Filter by severity level
- `cause`: Filter by cause category
- `start_date`: Filter by detection date (ISO format)
- `end_date`: Filter by detection date (ISO format)
- `limit`: Maximum number of results (default: 100)

### GET /api/provinces
Returns aggregated statistics per province.

**Response Fields:**
- province name
- total area lost (hectares)
- event count
- dominant cause
- critical event count
- latest detection date

### GET /api/stats
Returns national-level statistics.

**Response Fields:**
- total hectares lost
- total events
- breakdown by severity (low/moderate/high/critical)
- breakdown by cause (logging/plantation/mining/fire/unknown)
- protected zone breaches
- latest update timestamp

### GET /api/trends
Returns time-series data for trend charts.

**Query Parameters:**
- `province`: Optional filter by province name

**Response Fields:**
- month (YYYY-MM)
- area (hectares)
- event count

### GET /api/forecast
Returns predicted deforestation for next period (placeholder for future).

**Query Parameters:**
- `province`: Optional filter by province name

### GET /api/thumbnails/{filename}
Serves static JPEG thumbnail images.

---

## Data Models

### Alert Record

```typescript
interface AlertResponse {
  id: number;
  detected_at: string;  // ISO date
  province: string;
  lat: number;
  lng: number;
  bbox: [number, number, number, number];  // [minx, miny, maxx, maxy]
  area_ha: number;
  cause: "logging" | "plantation" | "mining" | "fire" | "unknown";
  confidence: number;  // 0.0 to 1.0
  severity: "low" | "moderate" | "high" | "critical";
  is_protected_zone: boolean;
  ndvi_before: number;
  ndvi_after: number;
  ndvi_change: number;
  thumbnail_url: string;  // /api/thumbnails/{filename}
  created_at: string;  // ISO datetime
}
```

### Province Statistics

```typescript
interface ProvinceStats {
  province: string;
  total_area_ha: number;
  event_count: number;
  dominant_cause: string;
  critical_count: number;
  latest_detection: string;  // ISO date
}
```

### National Statistics

```typescript
interface NationalStats {
  total_area_ha: number;
  total_events: number;
  by_severity: {
    low: number;
    moderate: number;
    high: number;
    critical: number;
  };
  by_cause: {
    logging: number;
    plantation: number;
    mining: number;
    fire: number;
    unknown: number;
  };
  protected_zone_breaches: number;
  latest_update: string;  // ISO datetime
}
```

---

## Deployment Strategy

### Local Execution
1. Developer runs detection pipeline locally
2. Pipeline fetches satellite imagery from Planetary Computer
3. Pipeline processes all 38 provinces (or subset for testing)
4. Pipeline writes alerts to SQLite database
5. Pipeline generates thumbnails and hero images
6. Database and thumbnails are committed to Git repository

### Vercel Deployment
1. Push to GitHub main branch
2. Vercel auto-deploys frontend and backend
3. Backend serves data from committed SQLite file
4. Frontend fetches data via API
5. Static thumbnails served via FastAPI endpoint
6. Live dashboard accessible at public URL

**Key Advantage:** No cloud database setup, no blob storage configuration, no subscription fees.

---

## Testing Strategy

### Property-Based Tests (10 properties)
1. NDVI values are always bounded (-1.0 to 1.0)
2. NDVI preserves array shape
3. Change detection formula correctness
4. Deforestation area is non-negative
5. Classifier returns valid outputs
6. Severity score is bounded (0 to 100)
7. Severity labels match score thresholds
8. Protected provinces always critical
9. NDVI calculation handles zero inputs
10. Area calculation scales with resolution

### Unit Tests
- Core mathematical functions with known inputs
- Edge cases and boundary conditions
- Database operations with in-memory SQLite
- API endpoints with FastAPI TestClient

### Integration Tests
- Pipeline orchestration with mocked external calls
- Database query functions
- API filtering and pagination

### Frontend Tests
- Component rendering with React Testing Library
- User interactions and filter updates
- Language toggle functionality
- Impact calculator updates

---

## Error Handling

### External API Failures
- Planetary Computer timeout → Log warning, skip province
- No imagery found → Log warning, skip province
- Cloud cover too high → Retry with 25% threshold, then skip

### Memory Errors
- MemoryError at 60m resolution → Retry at 120m
- MemoryError at 120m resolution → Log error, skip province

### Data Quality Issues
- Missing bands → Skip item, try next
- NaN values → Propagate without crashing
- Invalid coordinates → Validate before insertion

### Database Errors
- Database locked → Retry up to 3 times with 1s delay
- Disk full → Raise error immediately
- Schema mismatch → Raise error immediately

### Pipeline Orchestration
- Province failure → Log error, continue to next province
- Never crash entire pipeline due to single province failure
- Collect failure statistics and report at end

---

## Performance Considerations

### Pipeline Execution
- **Parallel processing:** 4 concurrent workers (ThreadPoolExecutor)
- **Resolution strategy:** 60m default, 120m fallback on MemoryError
- **Date ranges:** 30-day windows for before/after periods
- **Minimum area threshold:** 50 hectares to reduce noise
- **Cloud cover filtering:** 15% primary, 25% fallback

### Database Optimization
- **Indexes:** province, detected_at, severity
- **Connection pooling:** Row factory for dict results
- **Retry logic:** 3 attempts with exponential backoff

### Frontend Optimization
- **Lazy loading:** Components loaded on demand
- **Image optimization:** JPEG quality=85 for thumbnails
- **API pagination:** Limit parameter for large result sets
- **Caching:** Browser caching for static assets

---

## Security Considerations

### API Security
- **CORS:** Restricted to localhost:5173 and production domain
- **Read-only endpoints:** No write operations exposed
- **Input validation:** All query parameters validated
- **SQL injection prevention:** Parameterized queries only

### Credential Management
- **Environment variables:** All secrets in .env (never committed)
- **.env.example:** Template without actual credentials
- **.gitignore:** Excludes .env and sensitive files

### Data Privacy
- **No personal data:** Only geographic and environmental data
- **Public information:** All data suitable for public display
- **No authentication required:** Public transparency dashboard

---

## Limitations and Constraints

| Limitation | Mitigation |
|---|---|
| **Cloud cover blocks Sentinel-2** | Use dry season imagery, retry with higher threshold |
| **Not real-time** | Sentinel-2 passes every 5 days, detection runs after each pass |
| **Rule-based classification** | 60-85% confidence, explainable and defensible |
| **Local execution required** | Pipeline runs on developer machine, results committed to Git |
| **No enforcement mechanism** | By design - transparency tool, not enforcement tool |

---

## Impact Statement

**At national scale:**
- 470,000 ha/year currently undetected
- 10% reduction in undetected clearing = **47,000 hectares preserved**
- = **7 million tonnes of CO₂ avoided per year**
- = Indonesia's palm oil export access to EU **secured**

**Public transparency mechanism:**
- Every Indonesian can see exactly where forests are disappearing
- Journalists can report with satellite evidence
- NGOs can target interventions
- Investors can assess supply chain risks

---

## Future Enhancements

### Phase 2: Enhanced Detection
- SAR radar integration for cloud penetration
- Higher resolution imagery (10m bands)
- Real-time alerts via webhooks

### Phase 3: Advanced Analytics
- Time-series forecasting with statistical models
- Deforestation rate comparison
- Cumulative loss tracking

### Phase 4: Integration
- Carbon credit marketplace integration
- NGO alert routing
- Government reporting API

---

## Success Metrics

### Technical Metrics
- **Detection accuracy:** > 80% for NDVI change detection
- **Classification confidence:** 60-85% for rule-based classifier
- **Pipeline execution time:** < 10 minutes per province
- **API response time:** < 500ms for all endpoints
- **Test coverage:** > 80% for core functions

### User Metrics
- **Dashboard load time:** < 3 seconds
- **Map interaction responsiveness:** < 100ms
- **Filter update time:** < 500ms
- **Mobile compatibility:** Responsive design for all screen sizes

### Impact Metrics
- **Public visibility:** Number of dashboard views
- **Media coverage:** Articles citing MataBumi data
- **NGO adoption:** Organizations using the dashboard
- **Policy influence:** Government responses to public data

---

**For technical implementation details, see:**
- Architecture Document: `plans/matabumi_architecture.md`
- Design Specification: `.kiro/specs/matabumi-deforestation-pipeline/design.md`
- Requirements Specification: `.kiro/specs/matabumi-deforestation-pipeline/requirements.md`
- Implementation Tasks: `.kiro/specs/matabumi-deforestation-pipeline/tasks.md`
