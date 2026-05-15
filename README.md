# MataBumi: Deforestation Monitoring System for Indonesia

MataBumi is an automated deforestation detection and monitoring system for Indonesia's 38 provinces. It uses satellite imagery from Microsoft Planetary Computer to detect vegetation loss, classify causes, score severity, and present results through an interactive web dashboard.

## 🌟 Features

- **Automated Detection**: Processes Sentinel-2 satellite imagery to detect deforestation using NDVI analysis
- **Cause Classification**: Rule-based classifier identifies logging, plantation, mining, fire, or unknown causes
- **Severity Scoring**: Calculates severity based on area, cause, and protected zone status
- **Interactive Dashboard**: React-based web interface with:
  - Interactive map with multiple base layers
  - Province and severity filters
  - Bilingual support (English/Indonesian)
  - Impact calculator for CO₂ and economic estimates
  - Trend charts and statistics
- **REST API**: FastAPI backend serving deforestation alerts and statistics

## 📋 Requirements

### Backend
- Python 3.10+
- Dependencies listed in `requirements.txt`

### Frontend
- Node.js 18+
- npm or yarn

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd matabumi_aitalentchallenge2026
```

### 2. Set Up Environment Variables

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` with your configuration (see Environment Variables section below).

### 3. Install Backend Dependencies

```bash
pip install -r requirements.txt
```

### 4. Initialize Database

```bash
python database/init_db.py
```

### 5. Run Detection Pipeline (Optional)

Process provinces to populate the database:

```bash
python pipeline/run.py
```

This will:
- Fetch satellite imagery for all 38 provinces
- Detect deforestation using NDVI change analysis
- Store alerts in SQLite database
- Generate hero images and thumbnails

### 6. Start Backend Server

```bash
python -m uvicorn backend.api.main:app --reload --port 8000
```

Backend will be available at `http://localhost:8000`

### 7. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 8. Start Frontend Development Server

```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`

### 9. Open Dashboard

Navigate to `http://localhost:5173` in your browser.

## 📁 Project Structure

```
matabumi_aitalentchallenge2026/
├── backend/
│   ├── api/
│   │   ├── main.py          # FastAPI application
│   │   └── routes.py        # API endpoints
│   └── database/
│       └── matabumi.db      # SQLite database
├── database/
│   ├── db.py                # Database operations
│   └── init_db.py           # Database initialization
├── detection/
│   ├── classify.py          # Cause classification
│   ├── fetch_imagery.py     # Satellite imagery fetcher
│   ├── ndvi.py              # NDVI calculation and visualization
│   ├── severity.py          # Severity scoring
│   └── thumbnails.py        # Thumbnail extraction
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── App.tsx          # Main application
│   │   └── main.tsx         # Entry point
│   └── public/              # Static assets
├── outputs/
│   ├── thumbnails/          # Satellite thumbnails
│   └── matabumi_*.png       # Hero images
├── pipeline/
│   └── run.py               # Main pipeline orchestration
├── tests/                   # Test files
├── .env.example             # Environment variables template
├── requirements.txt         # Python dependencies
├── vercel.json              # Vercel deployment config
└── README.md                # This file
```

## 🔧 Environment Variables

See `.env.example` for all available configuration options:

- `NDVI_CHANGE_THRESHOLD`: Threshold for detecting vegetation loss (default: 0.2)
- `MINIMUM_ALERT_AREA`: Minimum area in hectares to create alert (default: 50)
- `CLOUD_COVER_MAX`: Maximum cloud cover percentage (default: 15)
- `CONFIDENCE_THRESHOLD`: Minimum confidence for classification (default: 0.6)

## 🧪 Testing

### Run All Tests

```bash
pytest tests/ -v
```

### Run Pipeline Checkpoint Test

```bash
python test_pipeline_checkpoint.py
```

### Run Integration Test

```bash
python test_integration.py
```

## 📊 API Endpoints

### GET /api/alerts
Get deforestation alerts with optional filters.

**Query Parameters:**
- `province`: Filter by province name
- `severity`: Filter by severity (low/moderate/high/critical)
- `cause`: Filter by cause (logging/plantation/mining/fire/unknown)
- `start_date`: Filter by start date (YYYY-MM-DD)
- `end_date`: Filter by end date (YYYY-MM-DD)
- `limit`: Maximum number of results (default: 100)

### GET /api/provinces
Get aggregated statistics by province.

### GET /api/stats
Get national-level statistics.

### GET /api/trends
Get monthly trend data with optional province filter.

### GET /api/forecast
Get forecast data (placeholder for future implementation).

See `API.md` for detailed API documentation.

## 🚀 Deployment

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Set environment variables in Vercel dashboard

4. Commit database and thumbnails to repository before deploying

See `DEPLOYMENT.md` for detailed deployment instructions.

## 🌍 Data Sources

- **Satellite Imagery**: Sentinel-2 L2A from Microsoft Planetary Computer
- **Coverage**: All 38 Indonesian provinces
- **Resolution**: 60m (with automatic fallback to 120m for memory constraints)
- **Bands Used**: Band 8 (NIR) and Band 4 (Red) for NDVI calculation

## 📈 How It Works

1. **Imagery Fetching**: Downloads Sentinel-2 imagery for before (60-90 days ago) and after (0-30 days ago) periods
2. **NDVI Calculation**: Computes Normalized Difference Vegetation Index: `(NIR - Red) / (NIR + Red)`
3. **Change Detection**: Identifies areas where NDVI decreased by more than threshold (0.2)
4. **Area Estimation**: Calculates deforestation area in hectares
5. **Cause Classification**: Uses rule-based analysis of fragmentation, compactness, and geographic heuristics
6. **Severity Scoring**: Combines area, cause, and protected zone status
7. **Database Storage**: Stores alerts in SQLite with full metadata
8. **Visualization**: Generates hero images and thumbnails for each detection

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📝 License

This project is developed for the AI Talent Challenge 2026.

## 🙏 Acknowledgments

- Microsoft Planetary Computer for providing free access to Sentinel-2 imagery
- ESA Copernicus Programme for Sentinel-2 satellite data
- OpenStreetMap contributors for base map layers

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**MataBumi** - Monitoring Indonesia's forests from space 🌲🛰️
