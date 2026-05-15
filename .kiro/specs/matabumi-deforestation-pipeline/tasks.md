# Implementation Plan: MataBumi Deforestation Monitoring System

## Overview

This implementation plan breaks down the MataBumi deforestation monitoring system into discrete coding tasks. The system processes satellite imagery from Microsoft Planetary Computer to detect deforestation across Indonesia's 38 provinces, classifies causes using rule-based analysis, scores severity, stores results in SQLite, and serves data via FastAPI REST API to a React web dashboard.

The implementation follows a bottom-up approach: core detection algorithms first, then data storage, pipeline orchestration, backend API, and finally frontend dashboard. Each task builds incrementally with validation checkpoints to ensure correctness before proceeding.

## Tasks

- [x] 0. Validate Planetary Computer API access and data availability
  - [x] 0.1 Create validation test script `tests/validate_planetary_computer.py`
    - Test unauthenticated access to Microsoft Planetary Computer STAC API
    - Use `planetary_computer.sign_inplace` modifier without API key
    - Search for Sentinel-2 imagery over Aceh province test area (bbox: [95.0, 2.0, 98.5, 6.0])
    - Test date ranges: 60-90 days ago (before period) and 0-30 days ago (after period)
    - Verify API connection works without authentication
    - Verify search returns Sentinel-2 items for test area
    - Verify items contain Band 8 (NIR) and Band 4 (Red)
    - Download small sample arrays (e.g., 10x10 pixels) to verify data is valid and accessible
    - Print summary: number of items found, date ranges, cloud cover percentages
    - Verify sufficient imagery exists for both time periods (at least 1 usable item per period with cloud cover < 25%)
    - Log success/failure with clear error messages
    - _Requirements: 1.1, 1.5, 1.10, 12.1, 12.10_
  
  - [x]* 0.2 Write unit tests for validation script
    - Test with mock STAC responses
    - Test error handling for API failures
    - Test cloud cover filtering logic

- [x] 1. Set up project structure and dependencies
  - Create directory structure: `detection/`, `database/`, `pipeline/`, `backend/`, `frontend/`, `outputs/`, `outputs/thumbnails/`, `tests/`
  - Create `requirements.txt` with pinned versions: `numpy`, `matplotlib`, `scipy`, `planetary-computer`, `pystac-client`, `stackstac`, `python-dotenv`, `fastapi`, `uvicorn`, `pytest`, `hypothesis`
  - Create `.env.example` template with all required environment variables
  - Create `.gitignore` for Python, Node.js, and environment files
  - Initialize SQLite database file at `backend/database/matabumi.db`
  - _Requirements: 12.1, 12.9, 12.10, 15.1, 15.6, 15.10_

- [x] 2. Implement NDVI calculation module
  - [x] 2.1 Create `detection/ndvi.py` with NDVI calculation function
    - Implement `calculate_ndvi(nir, red)` using formula `(NIR - Red) / (NIR + Red + 1e-10)`
    - Use float64 precision for calculations
    - Handle NaN values gracefully by propagating them
    - Return numpy array with same shape as input bands
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_
  
  - [x]* 2.2 Write property test for NDVI bounded values
    - **Property 1: NDVI Values Are Always Bounded**
    - **Validates: Requirements 2.2, 2.3**
    - Use hypothesis to generate random positive NIR and Red arrays
    - Verify all NDVI values are between -1.0 and 1.0
    - Verify no exceptions are raised for positive inputs
  
  - [x]* 2.3 Write property test for NDVI array shape preservation
    - **Property 2: NDVI Preserves Array Shape**
    - **Validates: Requirements 2.8**
    - Generate random array shapes and verify output matches input shape
  
  - [x]* 2.4 Write property test for NDVI zero input handling
    - **Property 9: NDVI Calculation Handles Zero Inputs**
    - **Validates: Requirements 2.4**
    - Test arrays with zero values at various pixels
    - Verify no division by zero errors and finite output values

- [x] 3. Implement change detection module
  - [x] 3.1 Create `detection/ndvi.py` change detection functions
    - Implement `detect_change(ndvi_before, ndvi_after)` returning change map and deforestation mask
    - Use NDVI_CHANGE_THRESHOLD (0.2) from environment variables with default
    - Create binary mask where change exceeds threshold
    - Implement `estimate_area(mask, resolution_m)` calculating hectares
    - Use formula: `pixel_count * (resolution_m^2) / 10000`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.9_
  
  - [x]* 3.2 Write property test for change detection formula
    - **Property 3: Change Detection Formula Correctness**
    - **Validates: Requirements 3.1**
    - Verify change array equals (NDVI_before - NDVI_after) at all pixels
  
  - [x]* 3.3 Write property test for area non-negativity
    - **Property 4: Deforestation Area Is Non-Negative**
    - **Validates: Requirements 3.6**
    - Test with various mask sizes and verify area >= 0.0
  
  - [x]* 3.4 Write property test for area scaling with resolution
    - **Property 10: Area Calculation Scales With Resolution**
    - **Validates: Requirements 3.5**
    - Verify that doubling resolution multiplies area by 4

- [x] 4. Implement hero image visualization
  - [x] 4.1 Create `detection/ndvi.py` hero image generation function
    - Implement `save_hero_image(ndvi_before, ndvi_after, change, province, output_dir)`
    - Use RdYlGn colormap for before/after panels (vmin=-0.2, vmax=0.9)
    - Use Reds colormap for change panel (vmin=0, vmax=0.5)
    - Set dark background (#0D1117), 200 DPI, 18x6 inch figure size
    - Save to `outputs/matabumi_{province_lowercase}.png`
    - Create output directory if it doesn't exist
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10_
  
  - [x]* 4.2 Write unit tests for hero image generation
    - Test with synthetic NDVI arrays
    - Verify file is created with correct filename
    - Verify image dimensions and format

- [x] 5. Implement rule-based cause classifier
  - [x] 5.1 Create `detection/classify.py` with classification logic
    - Implement `classify_cause(ndvi_change_patch, province, bbox)` returning (cause, confidence)
    - Calculate fragmentation index: `num_patches / total_area`
    - Calculate compactness: `perimeter^2 / (4π × area)`
    - Calculate mean NDVI change intensity in deforested pixels
    - Implement decision rules: plantation (compactness < 1.5, fragmentation < 0.1), mining (intensity > 0.4, compactness < 2.0), logging (fragmentation > 0.15, compactness > 2.5), fire (patches < 3, area > 1000)
    - Apply geographic heuristics for mining provinces (Kalimantan Timur, Papua, Maluku) and plantation provinces (Riau, Sumatera Selatan, Kalimantan Tengah)
    - Return confidence between 0.60 and 0.85
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10_
  
  - [x]* 5.2 Write property test for classifier output validity
    - **Property 5: Classifier Returns Valid Outputs**
    - **Validates: Requirements 5.8, 5.9**
    - Generate random patches, provinces, and bboxes
    - Verify cause is in {logging, plantation, mining, fire, unknown}
    - Verify confidence is between 0.60 and 0.85
  
  - [x]* 5.3 Write unit tests for classification decision rules
    - Test each decision rule with crafted patches
    - Verify geographic heuristics apply correctly
    - Test edge cases (empty patches, single pixel)

- [x] 6. Implement severity scoring module
  - [x] 6.1 Create `detection/severity.py` with severity calculation
    - Define PROTECTED_PROVINCES list: ["Papua", "Papua Barat", "Kalimantan Timur"]
    - Define CAUSE_WEIGHTS dict: logging=1.0, mining=0.9, plantation=0.7, fire=0.5, unknown=0.6
    - Implement `calculate_severity(area_ha, cause, province)` returning (severity_label, is_protected)
    - Calculate area score: <100ha=20, 100-499ha=40, 500-1999ha=70, >=2000ha=90
    - Calculate score: `(area_score × 0.4) + (cause_weight × 100 × 0.4) + (protected_bonus)`
    - Add 20 points if province is protected
    - Assign labels: <35="low", 35-59="moderate", 60-79="high", >=80="critical"
    - Override to "critical" if province is protected
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 6.11, 6.12, 6.13, 6.14_
  
  - [x]* 6.2 Write property test for severity score bounds
    - **Property 6: Severity Score Is Bounded**
    - **Validates: Requirements 6.1**
    - Generate random area, cause, and province values
    - Verify score is between 0 and 100
  
  - [x]* 6.3 Write property test for severity label thresholds
    - **Property 7: Severity Labels Match Score Thresholds**
    - **Validates: Requirements 6.2, 6.3, 6.4, 6.5**
    - Verify label matches score threshold ranges
  
  - [x]* 6.4 Write property test for protected province override
    - **Property 8: Protected Provinces Always Critical**
    - **Validates: Requirements 6.6**
    - Test all protected provinces return "critical" and is_protected=True

- [x] 7. Checkpoint - Ensure core detection algorithms pass tests
  - Run all unit tests and property tests for NDVI, change detection, classification, and severity scoring
  - Verify all properties pass with at least 100 iterations
  - Ensure all tests pass, ask the user if questions arise

- [x] 8. Implement satellite imagery fetcher
  - [x] 8.1 Create `detection/fetch_imagery.py` with Planetary Computer integration
    - Implement `get_catalog()` returning authenticated pystac_client.Client
    - Use PLANETARY_COMPUTER_API_KEY from environment variables
    - Implement `fetch_imagery(catalog, bbox, date_range, resolution)` returning (NIR, Red) arrays
    - Search STAC catalog for Sentinel-2 items matching bbox and date range
    - Filter by CLOUD_COVER_MAX (default 15%) from environment
    - Select item with lowest cloud cover
    - Retry with 25% cloud cover if no items found
    - Extract Band 8 (NIR) and Band 4 (Red)
    - Return (None, None) if no usable imagery found
    - Handle MemoryError by retrying at 120m resolution
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.9, 1.10_
  
  - [x] 8.2 Define province bounding boxes
    - Create PROVINCE_BBOXES dict with all 38 Indonesian provinces
    - Use WGS84 coordinates [minx, miny, maxx, maxy]
    - Include all regions: 10 Sumatra, 7 Java/Bali, 2 Nusa Tenggara, 5 Kalimantan, 6 Sulawesi, 2 Maluku, 6 Papua
    - Add assertion to verify count equals 38
    - _Requirements: 1.8, 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.7, 21.8, 21.9, 21.10_
  
  - [x]* 8.3 Write unit tests for imagery fetcher
    - Mock Planetary Computer API responses
    - Test cloud cover filtering and retry logic
    - Test resolution fallback on MemoryError
    - Test missing band handling

- [x] 9. Implement thumbnail extraction
  - [x] 9.1 Create `detection/thumbnails.py` with thumbnail extraction
    - Implement `extract_thumbnail(nir, red, green, change_mask, province, date, event_id, output_dir)`
    - Find centroid of change mask
    - Extract 256x256 pixel window centered on centroid
    - Normalize bands to 0-255 range
    - Stack as RGB false-color composite (NIR→R, Red→G, Green→B)
    - Save as JPEG with quality=85 to `outputs/thumbnails/{province}_{date}_{event_id}.jpg`
    - Create output directory if it doesn't exist
    - Return relative file path or None on error
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.9, 8.10_
  
  - [x]* 9.2 Write unit tests for thumbnail extraction
    - Test with synthetic band arrays and change mask
    - Verify 256x256 output size
    - Verify JPEG file creation
    - Test error handling for invalid inputs

- [x] 10. Implement database layer
  - [x] 10.1 Create `database/db.py` with SQLite operations
    - Define database schema for `deforestation_alerts` table with columns: id, detected_at, province, lat, lng, bbox_minx, bbox_miny, bbox_maxx, bbox_maxy, area_ha, cause, confidence, severity, is_protected_zone, ndvi_before, ndvi_after, ndvi_change, thumbnail_path, created_at
    - Add indexes on province, detected_at, and severity
    - Implement `get_connection()` returning sqlite3.Connection with row factory
    - Implement `insert_alert(alert)` with retry logic (3 attempts, 1s delay)
    - Handle database locked errors with exponential backoff
    - Validate required fields before insertion
    - Return generated alert ID or None on error
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 7.11, 7.12, 7.13, 7.14_
  
  - [x] 10.2 Create database initialization script
    - Create `database/init_db.py` to create tables and indexes
    - Execute schema creation on first run
    - Add logging for database initialization
  
  - [x]* 10.3 Write integration tests for database operations
    - Use in-memory SQLite (`:memory:`) for tests
    - Test alert insertion with valid data
    - Test retry logic for locked database
    - Test concurrent access with multiple threads

- [x] 11. Implement pipeline orchestration
  - [x] 11.1 Create `pipeline/run.py` with main pipeline logic
    - Implement `get_date_ranges()` returning (before_range, after_range)
    - Calculate before period: 60-90 days prior to current date
    - Calculate after period: 0-30 days prior to current date
    - Implement `process_province(province)` function executing all detection steps
    - Fetch before and after imagery
    - Calculate NDVI for both periods
    - Detect change and estimate area
    - Skip if area < 50 hectares (MINIMUM_ALERT_AREA)
    - Extract center crop patch for classification
    - Classify cause and calculate confidence
    - Calculate severity score and label
    - Extract thumbnail and save to filesystem
    - Insert alert record to SQLite
    - Generate hero image
    - Log progress and results
    - Handle errors gracefully and continue to next province
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10, 10.11_
  
  - [x] 11.2 Implement parallel province processing
    - Use ThreadPoolExecutor with max_workers=4
    - Process provinces in parallel
    - Collect results from all tasks
    - Continue processing if one province fails
    - Log summary statistics (success count, failure count, duration)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_
  
  - [x] 11.3 Add comprehensive logging
    - Log pipeline start with province count and date ranges
    - Log each province processing start
    - Log warnings for missing imagery
    - Log below-threshold detections with checkmark
    - Log alert creation with red circle indicator
    - Log hero image save paths
    - Log database insertion confirmations
    - Log pipeline completion with total time
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9_
  
  - [x] 11.4 Add error handling and resilience
    - Wrap all external API calls in try-except blocks
    - Retry database operations with exponential backoff
    - Handle memory errors with resolution fallback
    - Handle NaN values in NDVI calculations
    - Continue pipeline on single province failure
    - Log all errors with province name and operation
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9, 13.10_
  
  - [x]* 11.5 Write integration tests for pipeline orchestration
    - Mock external API calls
    - Test province processing with synthetic data
    - Test error handling and recovery
    - Test parallel execution

- [x] 12. Checkpoint - Ensure pipeline runs end-to-end
  - Run pipeline on a subset of provinces (e.g., 2-3 provinces)
  - Verify imagery fetching works
  - Verify NDVI calculation and change detection
  - Verify classification and severity scoring
  - Verify database records are created
  - Verify thumbnails and hero images are saved
  - Ensure all tests pass, ask the user if questions arise

- [x] 13. Implement FastAPI backend
  - [x] 13.1 Create `backend/api/main.py` with FastAPI application
    - Initialize FastAPI app with title, version, description
    - Configure CORS middleware for localhost:5173 and production domain
    - Mount static files for thumbnails at `/api/thumbnails`
    - _Requirements: Design Section 4.1_
  
  - [x] 13.2 Create `backend/api/routes.py` with API endpoints
    - Implement GET `/api/alerts` with filters: province, severity, cause, start_date, end_date, limit
    - Implement GET `/api/provinces` returning aggregated province statistics
    - Implement GET `/api/stats` returning national-level statistics
    - Implement GET `/api/trends` with optional province filter
    - Implement GET `/api/forecast` with optional province filter (placeholder for future)
    - Use database query functions from `database/db.py`
    - Return JSON responses matching API response models
    - _Requirements: Design Section 4.2_
  
  - [x] 13.3 Create database query functions
    - Implement `query_alerts(filters)` in `database/db.py`
    - Implement `query_province_stats()` aggregating by province
    - Implement `query_national_stats()` calculating totals and breakdowns
    - Implement `query_trends(province)` grouping by month
    - _Requirements: Design Section 4.3_
  
  - [x]* 13.4 Write integration tests for API endpoints
    - Use FastAPI TestClient
    - Test each endpoint with valid parameters
    - Test filtering and pagination
    - Test error responses (404, 500)

- [x] 14. Implement React frontend
  - [x] 14.1 Set up React project with Vite
    - Initialize React + TypeScript project with Vite
    - Install dependencies: `react`, `react-dom`, `leaflet`, `react-leaflet`, `chart.js`, `react-chartjs-2`, `tailwindcss`, `axios`
    - Configure Tailwind CSS
    - Create basic app structure with routing
    - _Requirements: Design Section 5_
  
  - [x] 14.2 Create Map component with Leaflet
    - Implement `frontend/src/components/Map.jsx` with Leaflet map
    - Add base layer controls: Satellite (Esri), Street (OSM), Terrain (OpenTopoMap), Dark (CartoDB)
    - Add overlay toggles: Province Boundaries, Heatmap, Protected Areas, Event Markers
    - Color-code markers by severity: green (low), yellow (moderate), orange (high), red (critical)
    - Handle marker click to show event details
    - Support province selection to zoom map
    - _Requirements: Design Section 5.1_
  
  - [x] 14.3 Create Sidebar component with filters
    - Implement `frontend/src/components/Sidebar.jsx` with summary stats
    - Add province dropdown (38 options)
    - Add severity checkboxes (low/moderate/high/critical)
    - Add cause checkboxes (logging/plantation/mining/fire/unknown)
    - Add date range picker
    - Add scrollable province list with event counts
    - Emit filter change events to parent
    - _Requirements: Design Section 5.2_
  
  - [x] 14.4 Create EventCard component
    - Implement `frontend/src/components/EventCard.jsx` displaying event details
    - Show satellite thumbnail image from `/api/thumbnails/{filename}`
    - Display province, date, area, cause with confidence, severity badge
    - Display coordinates and NDVI values
    - Add close button
    - _Requirements: Design Section 5.3_
  
  - [x] 14.5 Create TrendChart component
    - Implement `frontend/src/components/TrendChart.jsx` using Chart.js
    - Support line chart for monthly area lost
    - Support bar chart for events by cause
    - Support stacked area for cumulative loss by province
    - _Requirements: Design Section 5.4_
  
  - [x] 14.6 Create ImpactCalculator component
    - Implement `frontend/src/components/ImpactCalculator.jsx` with slider (0-100%)
    - Calculate hectares saved: `totalArea * (reductionPercent / 100)`
    - Calculate CO₂ avoided: `hectaresSaved * 150 * 3.67` tonnes
    - Calculate economic value: `co2Avoided * 15` USD
    - Calculate football fields: `hectaresSaved / 0.714`
    - Display real-time calculations with visual indicators
    - _Requirements: Design Section 5.5_
  
  - [x] 14.7 Create LanguageToggle component
    - Implement `frontend/src/components/LanguageToggle.jsx` with EN/ID toggle
    - Define translations object with all UI strings in English and Indonesian
    - Translate severity levels: critical="kritis", high="tinggi", moderate="sedang", low="rendah"
    - Translate cause categories: logging="penebangan", plantation="perkebunan", mining="pertambangan", fire="kebakaran", unknown="tidak diketahui"
    - Default to Indonesian (ID)
    - _Requirements: Design Section 5.6_
  
  - [x] 14.8 Wire components together in main App
    - Fetch alerts from `/api/alerts` on mount
    - Fetch stats from `/api/stats` for sidebar
    - Fetch trends from `/api/trends` for charts
    - Pass data to Map, Sidebar, EventCard, TrendChart, ImpactCalculator
    - Handle filter changes and update API queries
    - Handle language toggle and pass translations to all components
  
  - [x]* 14.9 Write component tests
    - Test Map renders with alerts
    - Test Sidebar filters update map
    - Test EventCard shows correct details
    - Test LanguageToggle switches text
    - Test ImpactCalculator updates on slider change

- [x] 15. Checkpoint - Ensure frontend and backend integration works
  - Start FastAPI backend locally
  - Start React frontend dev server
  - Verify API endpoints return data
  - Verify map displays alerts
  - Verify filters work correctly
  - Verify language toggle switches UI
  - Verify impact calculator updates
  - Ensure all tests pass, ask the user if questions arise

- [ ] 16. Prepare for deployment
  - [x] 16.1 Create deployment configuration
    - Create `vercel.json` for Vercel deployment
    - Configure FastAPI as serverless function
    - Configure React build output directory
    - Set environment variables in Vercel dashboard
    - _Requirements: Design Section 3_
  
  - [x] 16.2 Add documentation
    - Create `README.md` with project overview, setup instructions, and usage
    - Document environment variables in `.env.example`
    - Document API endpoints in `API.md`
    - Document deployment process in `DEPLOYMENT.md`
    - _Requirements: 15.3_
  
  - [x] 16.3 Commit database and thumbnails to repository
    - Ensure `backend/database/matabumi.db` is committed
    - Ensure `outputs/thumbnails/` directory with images is committed
    - Verify `.gitignore` doesn't exclude these files
    - _Requirements: Design Section 3_

- [x] 17. Final checkpoint - Complete system validation
  - Run full pipeline on all 38 provinces (or subset for testing)
  - Verify database is populated with alerts
  - Verify thumbnails are generated
  - Deploy to Vercel and verify live site works
  - Test all dashboard features: map, filters, language toggle, impact calculator
  - Verify API endpoints return correct data
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional property-based and unit tests that can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and allow for user feedback
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The implementation uses Python for backend/pipeline and TypeScript/React for frontend
- All external dependencies are managed through `requirements.txt` (Python) and `package.json` (Node.js)
- The system is designed for local execution of the detection pipeline with results committed to Git for Vercel deployment
