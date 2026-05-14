# CLAUDE.md — MataBumi Agent Context

> Place this file in the root of your project.
> Claude Code reads this automatically on every session.

---

## Project Identity

**Name:** MataBumi
**Purpose:** AI-powered national forest transparency dashboard for Indonesia
**Tagline:** See it. Prove it. Show the world.
**Competition:** AI Talent Challenge 2026 — Sub-theme 3: AI for Social Impact
**Submission format:** PDF only (no live demo required)

---

## What This Project Does

1. Fetches free Sentinel-2 satellite imagery via Microsoft Planetary Computer
2. Calculates NDVI change detection to find deforestation events
3. Classifies the cause (logging / plantation / mining / fire) via rule-based pattern analysis
4. Scores severity per event
5. Stores alerts in SQLite database
6. Serves data via FastAPI REST API
7. Visualizes everything on an interactive web dashboard with switchable map layers

---

## Tech Stack (Never Suggest Alternatives)

| Layer | Tool | Why locked |
|---|---|---|
| Satellite data | Microsoft Planetary Computer | Microsoft ecosystem requirement |
| Detection pipeline | Python (NumPy, scikit-learn, scipy) | Open-source, no Azure ML needed |
| Image classification | ForestNet (pre-trained PyTorch model) | 85-90% accuracy, no training required |
| Database | SQLite | Local, portable, no subscription needed |
| Backend API | Python FastAPI | RESTful API for web frontend |
| Frontend | React + Vite + Leaflet.js + Chart.js | Modern web stack |
| Map layers | Leaflet.js with layer control | Switchable base maps + overlays |
| Hosting | Vercel (frontend + backend) | Free tier, auto-deploy from GitHub |
| IDE | VS Code | Microsoft product |

**Do not suggest:** AWS, GCP, Heroku, Railway, Supabase, Firebase, or any non-Microsoft cloud service.
**Do not suggest:** Azure AI Vision, Azure ML Studio, Azure AI Foundry, Azure SQL, Azure Blob Storage - we use local alternatives.
**Allowed non-Microsoft:** Python, React, Leaflet, FastAPI, PyTorch (open-source tools that complement Microsoft ecosystem).

---

## Project File Structure

```
matabumi/
├── backend/
│   ├── api/
│   │   ├── __init__.py
│   │   ├── main.py                ← FastAPI app entry point
│   │   ├── routes.py              ← API endpoints
│   │   └── models.py              ← Pydantic models
│   ├── database/
│   │   ├── __init__.py
│   │   ├── schema.sql             ← SQLite schema
│   │   ├── db.py                  ← Database connection
│   │   └── matabumi.db            ← SQLite database file
│   ├── requirements.txt           ← Python dependencies
│   └── vercel.json                ← Vercel deployment config
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Map.jsx            ← Leaflet map with layer control
│   │   │   ├── Sidebar.jsx        ← Filters and stats
│   │   │   ├── EventCard.jsx      ← Deforestation event display
│   │   │   ├── TrendChart.jsx     ← Chart.js visualizations
│   │   │   ├── ImpactCalculator.jsx ← Impact widget
│   │   │   └── LanguageToggle.jsx ← EN/ID switcher
│   │   ├── App.jsx                ← Main app component
│   │   ├── main.jsx               ← Entry point
│   │   └── api.js                 ← API client
│   ├── public/
│   │   └── indonesia.geojson      ← Province boundaries
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json                ← Vercel deployment config
│
├── detection/
│   ├── __init__.py
│   ├── fetch_imagery.py           ← Planetary Computer fetch
│   ├── ndvi.py                    ← NDVI calculation + visualization
│   ├── classify.py                ← Rule-based classification
│   └── severity.py                ← Severity scoring
│
├── pipeline/
│   ├── __init__.py
│   └── run.py                     ← Main orchestrator
│
├── outputs/                       ← Generated NDVI images
└── .env                           ← Never commit this
```

---

## Indonesia Province Bounding Boxes (Do Not Change)

```python
# All 38 provinces of Indonesia (including 4 new Papua provinces)
PROVINCE_BBOXES = {
    # ── Sumatra (10 provinces) ──────────────────────────────────────
    "Aceh":                     [ 95.0,  2.0, 98.5,  6.0],
    "Sumatera Utara":           [ 97.5,  1.0,100.5,  4.5],
    "Sumatera Barat":           [ 99.0, -3.5,101.5,  1.0],
    "Riau":                     [100.0, -1.5,103.0,  2.5],
    "Kepulauan Riau":           [103.5,  0.5,108.5,  4.5],
    "Jambi":                    [101.5, -3.0,104.5,  0.5],
    "Sumatera Selatan":         [103.0, -5.0,107.0, -1.5],
    "Kepulauan Bangka Belitung":[105.5, -3.5,108.5, -1.0],
    "Bengkulu":                 [101.5, -5.5,104.0, -2.0],
    "Lampung":                  [103.5, -6.0,106.0, -3.5],

    # ── Java & Bali (7 provinces) ───────────────────────────────────
    "Banten":                   [105.0, -7.0,106.5, -5.5],
    "DKI Jakarta":              [106.5, -6.4,107.0, -6.0],
    "Jawa Barat":               [106.5, -7.8,108.8, -5.8],
    "Jawa Tengah":              [108.5, -8.0,111.5, -6.5],
    "DI Yogyakarta":            [110.0, -8.2,110.8, -7.5],
    "Jawa Timur":               [111.0, -8.8,114.5, -6.8],
    "Bali":                     [114.5, -8.9,115.7, -8.0],

    # ── Nusa Tenggara (2 provinces) ─────────────────────────────────
    "Nusa Tenggara Barat":      [115.5, -9.1,119.0, -8.0],
    "Nusa Tenggara Timur":      [119.5,-11.0,125.5, -8.0],

    # ── Kalimantan (5 provinces) ────────────────────────────────────
    "Kalimantan Barat":         [108.0, -3.0,115.0,  2.5],
    "Kalimantan Tengah":        [111.0, -4.5,116.5,  2.0],
    "Kalimantan Selatan":       [114.0, -4.5,117.5, -1.0],
    "Kalimantan Timur":         [113.5, -3.5,119.0,  2.5],
    "Kalimantan Utara":         [114.5,  1.0,118.5,  4.5],

    # ── Sulawesi (6 provinces) ──────────────────────────────────────
    "Sulawesi Utara":           [123.0,  0.0,125.5,  2.0],
    "Gorontalo":                [121.5,  0.0,123.5,  1.0],
    "Sulawesi Tengah":          [119.5, -3.5,124.5,  1.5],
    "Sulawesi Barat":           [118.5, -3.5,120.0, -1.0],
    "Sulawesi Selatan":         [119.0, -6.0,122.5, -2.0],
    "Sulawesi Tenggara":        [121.0, -5.5,124.5, -2.5],

    # ── Maluku (2 provinces) ────────────────────────────────────────
    "Maluku":                   [125.5, -8.5,132.0, -2.5],
    "Maluku Utara":             [126.5, -1.5,129.5,  2.5],

    # ── Papua (6 provinces — includes 4 new 2022 provinces) ─────────
    "Papua Barat":              [130.0, -4.5,133.5,  0.5],
    "Papua Barat Daya":         [130.0, -4.0,132.5, -0.5],
    "Papua":                    [131.0, -9.0,141.0, -1.0],
    "Papua Selatan":            [136.0, -9.0,141.0, -5.0],
    "Papua Tengah":             [134.0, -5.5,138.0, -1.5],
    "Papua Pegunungan":         [137.0, -5.0,141.0, -2.0],
}

# Total: 38 provinces
assert len(PROVINCE_BBOXES) == 38, "Province count mismatch"
```

---

## Core Business Rules (Never Break These)

```python
# Detection threshold — vegetation loss that triggers an alert
NDVI_CHANGE_THRESHOLD = 0.2

# Maximum cloud cover for usable satellite image
CLOUD_COVER_MAX = 15  # percent

# Minimum area before an alert is recorded
MIN_AREA_HA = 50

# Satellite resolution for MVP (faster processing)
SENTINEL_RESOLUTION = 60  # meters per pixel

# Severity thresholds
SEVERITY_CRITICAL_SCORE = 80
SEVERITY_HIGH_SCORE = 60
SEVERITY_MODERATE_SCORE = 35

# Cause risk weights for severity scoring
CAUSE_WEIGHTS = {
    "logging":    1.0,
    "mining":     0.9,
    "plantation": 0.7,
    "fire":       0.5,
    "unknown":    0.6,
}

# Auto-escalate to critical if in protected province
PROTECTED_PROVINCES = ["Papua", "Papua Barat", "Kalimantan Timur"]

# Azure Functions trigger: every 5 days (matches Sentinel-2 pass frequency)
FUNCTION_SCHEDULE = "0 0 */5 * * *"
```

---

## Coding Standards

- Language: **Python 3.11**
- Style: PEP8, max line length 100
- All functions must have a docstring
- All file I/O must use `pathlib.Path`, not `os.path`
- All secrets via `os.getenv()` — never hardcoded
- Error handling: every external API call wrapped in try/except with logging
- Logging: use Python `logging` module, not `print()` in production code
- Use `print()` only in `pipeline/run.py` for human-readable progress output

---

## Environment Variables Reference

```
# Planetary Computer
PLANETARY_COMPUTER_API_KEY

# Detection config
NDVI_CHANGE_THRESHOLD=0.2
CLOUD_COVER_MAX=15
CONFIDENCE_THRESHOLD=0.6

# Database (SQLite - no credentials needed)
DATABASE_PATH=./backend/database/matabumi.db

# API config
API_PORT=8000
CORS_ORIGINS=http://localhost:5173,https://matabumi.vercel.app
```

---

## Known Constraints & How to Handle Them

### Cloud cover
Tropical Indonesia has high cloud cover. If no image found with <15% cloud cover:
1. Retry with <25% threshold
2. If still none: log "No clear imagery for {province} in {date_range}" and skip
3. Never crash — always continue to next province

### Memory limits
Sentinel-2 at 10m resolution for large provinces (Papua) is very large.
- Default resolution: 60m (MVP)
- If MemoryError: catch and retry at 120m resolution
- Log the fallback resolution used

### Missing bands
If Band 8 or Band 4 is missing from a Sentinel-2 item:
- Log warning and skip that item
- Try the next available item in the search results

### Azure SQL connection timeout
- Use connection pooling pattern
- Retry up to 3 times with 5 second backoff before raising

---

## Output Files (Save to `outputs/` directory)

| File | When generated | Used for |
|---|---|---|
| `matabumi_{province}.png` | Every detection run | PDF hero image |
| `pipeline_log_{date}.txt` | Every run | Debugging |

---

## What the PDF Submission Needs

The PDF is the final deliverable. These are the assets Claude Code must help generate:

1. `outputs/matabumi_aceh.png` — NDVI before/after/change for Aceh
2. `outputs/matabumi_sumut.png` — NDVI before/after/change for North Sumatra
3. Azure Custom Vision screenshot (manual — from customvision.ai portal)
4. Power BI dashboard screenshot (manual — from Power BI Desktop)

**Priority order for debugging:**
1. Get NDVI images generating correctly first (detection pipeline)
2. Then SQLite database inserts
3. Then rule-based cause classification
4. Then FastAPI backend with endpoints
5. Then React frontend with map layer switching
6. Web deployment last (Vercel)

---

## Useful Commands

```bash
# Backend (FastAPI)
cd backend
pip install -r requirements.txt
uvicorn api.main:app --reload  # Run API locally

# Frontend (React)
cd frontend
npm install
npm run dev  # Run frontend locally

# Detection Pipeline
python pipeline/run.py  # Run detection on 2 provinces

# Deploy to Vercel
vercel  # Deploy both frontend and backend

# Database
sqlite3 backend/database/matabumi.db < backend/database/schema.sql  # Initialize DB
```

---

## Prohibited Actions

- Never delete the `outputs/` directory or its contents
- Never commit `.env` to GitHub
- Never hardcode API keys or passwords
- Never change province bounding boxes without confirmation
- Never switch to a non-Microsoft cloud service
- Never add dependencies not in `requirements.txt` without updating it