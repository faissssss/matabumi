# MataBumi System Architecture

## 🏗️ System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│                    http://localhost:5173                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP Requests
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (React + Vite)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   App.tsx    │  │  KPICards    │  │   Sidebar    │          │
│  │ (Main Shell) │  │ (Animated)   │  │ (Filters)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │     Map      │  │  EventCard   │  │ Analytics    │          │
│  │  (Leaflet)   │  │  (Details)   │  │  (Recharts)  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  Technologies:                                                   │
│  • React 18 + TypeScript                                        │
│  • Framer Motion (animations)                                   │
│  • Recharts (charts)                                            │
│  • Tailwind CSS (styling)                                       │
│  • Leaflet (maps)                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ API Calls (axios)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND API (FastAPI)                         │
│                   http://localhost:8000                          │
│                                                                  │
│  Endpoints:                                                      │
│  • GET /api/stats        → National statistics                  │
│  • GET /api/alerts       → Deforestation alerts                 │
│  • GET /api/provinces    → Province statistics                  │
│  • GET /api/trends       → Temporal trends                      │
│  • GET /docs             → API documentation                    │
│                                                                  │
│  Technologies:                                                   │
│  • FastAPI (web framework)                                      │
│  • Uvicorn (ASGI server)                                        │
│  • SQLAlchemy (ORM)                                             │
│  • Pydantic (validation)                                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ SQL Queries
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (SQLite)                             │
│              backend/database/matabumi.db                        │
│                                                                  │
│  Table: deforestation_alerts                                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ id | province | area_ha | severity | cause | lat | lng │    │
│  │ detected_at | confidence | ndvi_before | ndvi_after    │    │
│  │ thumbnail_url | created_at | updated_at                 │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Current Data:                                                   │
│  • 16 detections                                                │
│  • 111,376.08 hectares                                          │
│  • 11 provinces                                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Writes new detections
                             ▲
┌─────────────────────────────────────────────────────────────────┐
│                  PIPELINE (Python Scripts)                       │
│            pipeline/run_annual_pipeline.py                       │
│                                                                  │
│  Process Flow:                                                   │
│  1. Fetch Sentinel-2 imagery (before/after)                     │
│  2. Calculate NDVI (vegetation index)                           │
│  3. Detect changes (threshold-based)                            │
│  4. Classify cause (rule-based, 6 metrics)                      │
│  5. Calculate confidence (0.60-0.85)                            │
│  6. Generate thumbnail                                           │
│  7. Save to database                                             │
│                                                                  │
│  Technologies:                                                   │
│  • Rasterio (satellite imagery)                                 │
│  • NumPy (array processing)                                     │
│  • scikit-image (image analysis)                                │
│  • Planetary Computer (data source)                             │
│                                                                  │
│  Status: RUNNING (processing 2026 data)                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Fetches imagery
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              MICROSOFT PLANETARY COMPUTER                        │
│                  Sentinel-2 L2A Data                             │
│                                                                  │
│  • 10m resolution satellite imagery                             │
│  • Global coverage                                              │
│  • Updated regularly                                            │
│  • Free access via STAC API                                     │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow

### 1. Pipeline → Database
```
Sentinel-2 Imagery
    ↓
NDVI Calculation
    ↓
Change Detection
    ↓
Cause Classification (6 metrics)
    ↓
Confidence Scoring (15-point system)
    ↓
Database (deforestation_alerts table)
```

### 2. Database → Backend → Frontend
```
Database Query
    ↓
FastAPI Endpoint
    ↓
JSON Response
    ↓
React Component
    ↓
User Interface
```

## 🎨 Frontend Architecture

```
App.tsx (Root)
├── Header
│   ├── Logo
│   ├── Language Toggle
│   └── Theme Toggle
├── KPICards (Floating, Animated)
│   ├── Total Events
│   ├── Total Area
│   ├── Protected Zones
│   └── Recent Alerts
├── Sidebar (Collapsible, Animated)
│   ├── Province Filter (with search)
│   ├── Severity Filter (collapsible)
│   ├── Cause Filter (collapsible)
│   └── Date Range Filter
├── Main View (Switchable)
│   ├── Map View (Leaflet)
│   │   └── Alert Markers
│   └── Data Table View
│       └── Sortable Table
├── Detail Drawer (Right, Slides In)
│   ├── EventCard
│   │   ├── Thumbnail
│   │   ├── Province Info
│   │   ├── Severity Badge
│   │   └── Metrics
│   └── ImpactCalculator
│       └── Scenario Analysis
└── Analytics Drawer (Bottom, Slides Up)
    └── TrendChart (Recharts)
        ├── Line Chart (temporal)
        └── Bar Chart (causes)
```

## 🔧 Technology Stack

### Frontend Layer
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | React 18 | UI components |
| Language | TypeScript | Type safety |
| Build Tool | Vite 5.2 | Fast dev server |
| Styling | Tailwind CSS | Utility-first CSS |
| Animations | Framer Motion | Smooth transitions |
| Charts | Recharts | Data visualization |
| Maps | Leaflet | Interactive maps |
| Icons | Lucide React | Icon library |
| HTTP Client | Axios | API requests |

### Backend Layer
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | FastAPI | REST API |
| Server | Uvicorn | ASGI server |
| Database | SQLite | Data storage |
| ORM | SQLAlchemy | Database queries |
| Validation | Pydantic | Data validation |

### Pipeline Layer
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Language | Python 3.x | Scripting |
| Imagery | Rasterio | Satellite data |
| Arrays | NumPy | Numerical computing |
| Image Processing | scikit-image | Shape analysis |
| Data Source | Planetary Computer | Sentinel-2 access |

## 📊 Classifier Architecture

```
Input: Satellite Imagery (Before/After)
    ↓
NDVI Calculation
    ↓
Change Detection (threshold: -0.15)
    ↓
Shape Analysis (6 Metrics)
    ├── Fragmentation (patch count / area)
    ├── Compactness (perimeter² / area)
    ├── Elongation (major axis / minor axis)
    ├── Convexity (area / convex hull area)
    ├── Edge Density (edge pixels / total pixels)
    └── Mean Intensity (average NDVI change)
    ↓
Scoring System (15 points)
    ├── Mining Indicators (0-15 points)
    ├── Plantation Indicators (0-15 points)
    ├── Logging Indicators (0-15 points)
    └── Fire Indicators (0-15 points)
    ↓
Winner Selection (highest score)
    ↓
Confidence Calculation
    ├── Base: 0.60-0.78 (score strength)
    ├── Margin Bonus: +0.05 (clear winner)
    └── Geographic Bonus: +0.08-0.10
    ↓
Output: Cause + Confidence (0.60-0.85)
```

## 🔐 Security & Performance

### Security
- ✅ No sensitive data in frontend
- ✅ API validation with Pydantic
- ✅ SQL injection prevention (SQLAlchemy)
- ✅ CORS configured for localhost
- ⚠️ Production: Add authentication
- ⚠️ Production: Add rate limiting
- ⚠️ Production: Use PostgreSQL

### Performance
- ✅ Frontend: Hot Module Reload
- ✅ Backend: Auto-reload in dev
- ✅ Database: Indexed queries
- ✅ Pipeline: Batch processing
- ✅ Frontend: Code splitting (Vite)
- ✅ Charts: Responsive containers
- ⚠️ Production: Add caching
- ⚠️ Production: Add CDN

## 🚀 Deployment Architecture (Future)

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRODUCTION                               │
│                                                                  │
│  Frontend (Vercel/Netlify)                                      │
│      ↓                                                           │
│  Backend (AWS/GCP/Azure)                                        │
│      ↓                                                           │
│  Database (PostgreSQL)                                          │
│      ↓                                                           │
│  Pipeline (Scheduled Jobs)                                      │
│      ↓                                                           │
│  Object Storage (S3/GCS)                                        │
│      ↓                                                           │
│  CDN (CloudFront/Cloudflare)                                    │
└─────────────────────────────────────────────────────────────────┘
```

## 📈 Scalability Considerations

### Current (Development)
- Single SQLite database
- Single-threaded pipeline
- Local file storage
- No caching

### Future (Production)
- PostgreSQL with replication
- Distributed pipeline (Celery)
- Cloud object storage (S3)
- Redis caching
- Load balancing
- Horizontal scaling

## 🔍 Monitoring & Observability

### Current
- Console logs
- Manual verification scripts
- Process monitoring

### Future
- Application logs (structured)
- Error tracking (Sentry)
- Performance monitoring (APM)
- Uptime monitoring
- Alert notifications
- Analytics dashboard

---

**Last Updated:** May 15, 2026, 4:30 PM
