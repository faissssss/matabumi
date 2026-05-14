# Requirements Document — MataBumi Deforestation Monitoring System

## Introduction

MataBumi is an AI-powered national forest transparency web application for Indonesia that detects deforestation across 38 provinces using satellite imagery, classifies causes, and visualizes results on an interactive web dashboard. The system processes Sentinel-2 satellite imagery to identify vegetation loss through NDVI (Normalized Difference Vegetation Index) change detection, classifies the likely cause of deforestation using rule-based pattern analysis, scores severity based on area and protected zone status, and stores alerts in SQLite database for web visualization.

The system is designed for the AI Talent Challenge 2026 competition (Sub-theme 3: AI for Social Impact) with a 5-day development timeline and includes both a PDF submission and a live web demo. The core technical pipeline fetches free satellite imagery from Microsoft Planetary Computer, performs NDVI calculations to detect vegetation loss, classifies deforestation causes using shape analysis, stores data in SQLite, serves data via FastAPI REST API, and presents an interactive React-based web dashboard with switchable map layers hosted on Vercel.

## Glossary

- **MataBumi_System**: The complete deforestation monitoring pipeline including satellite data ingestion, NDVI detection, cause classification, severity scoring, database storage, REST API, and web dashboard visualization
- **Planetary_Computer_API**: Microsoft's free satellite imagery service providing Sentinel-2 data with optional API key for reduced rate limiting (unauthenticated access supported)
- **NDVI_Calculator**: Component that computes Normalized Difference Vegetation Index from NIR (Band 8) and Red (Band 4) satellite bands using the formula (NIR - Red) / (NIR + Red)
- **Change_Detector**: Component that identifies vegetation loss by comparing NDVI values between before and after periods
- **Rule_Based_Classifier**: Component that classifies deforestation cause using shape metrics, fragmentation analysis, and geographic heuristics
- **Severity_Scorer**: Component that calculates alert severity (low/moderate/high/critical) based on area, cause, and protected zone status
- **Alert_Record**: Database entry containing deforestation event details including location, area, cause, confidence, severity, and NDVI values
- **Protected_Province**: Geographic region with automatic severity escalation (Papua, Papua Barat, Kalimantan Timur)
- **Deforestation_Event**: Detected vegetation loss exceeding 0.2 NDVI change threshold and 50 hectare minimum area
- **Cause_Category**: Classification of deforestation driver (logging, plantation, mining, fire, unknown)
- **Hero_Image**: Before/after/change NDVI visualization saved for PDF submission
- **Satellite_Thumbnail**: 256x256 pixel satellite image patch stored locally for web dashboard display
- **Confidence_Threshold**: Minimum classification confidence score (0.6) required to store alert
- **Deforestation_Rate**: Percentage change in forest loss compared to previous detection period
- **Time_Series_Forecast**: Predicted deforestation area for next period using statistical forecasting
- **Impact_Calculator**: Interactive web widget calculating environmental and economic impact of deforestation reduction scenarios
- **Language_Toggle**: Web dashboard feature allowing users to switch between English and Indonesian (Bahasa Indonesia)
- **SQLite_Database**: Local file-based database storing all deforestation alert records
- **FastAPI_Backend**: Python REST API serving deforestation data to web frontend
- **React_Frontend**: Interactive web application with map, filters, and visualizations
- **Leaflet_Map**: JavaScript mapping library providing interactive Indonesia map with layer switching
- **Map_Layer**: Switchable map visualization layer (satellite, street, terrain, dark mode)
- **Map_Overlay**: Toggleable data layer (province boundaries, heatmap, protected areas, markers)
- **Vercel_Deployment**: Cloud hosting platform for frontend and backend (free tier)
- **Sentinel_2_Imagery**: Satellite data from European Space Agency with 60m resolution (MVP), 10m bands available
- **Cloud_Cover_Threshold**: Maximum acceptable cloud coverage percentage for usable satellite imagery (15% primary, 25% fallback)
- **NDVI_Change_Threshold**: Minimum vegetation loss (0.2) required to trigger deforestation alert
- **Minimum_Alert_Area**: Smallest deforestation area (50 hectares) recorded as alert
- **Province_Bounding_Box**: Geographic coordinates defining each of Indonesia's 38 provinces
- **Detection_Period**: 30-day time window for comparing before and after NDVI values
- **Cause_Weight**: Risk multiplier for severity calculation (logging=1.0, mining=0.9, plantation=0.7, fire=0.5, unknown=0.6)
- **GeoJSON**: Geographic data format for province boundaries and map features
- **REST_API_Endpoint**: HTTP endpoint serving JSON data (e.g., /api/alerts, /api/provinces, /api/stats)

## Requirements

### Requirement 1: Satellite Imagery Acquisition

**User Story:** As a deforestation monitoring system, I want to fetch Sentinel-2 satellite imagery from Microsoft Planetary Computer, so that I can analyze vegetation changes across Indonesian provinces.

#### Acceptance Criteria

1. WHEN the MataBumi_System requests imagery for a Province_Bounding_Box and date range, THE Planetary_Computer_API SHALL return Sentinel-2 items matching the geographic and temporal constraints
2. WHEN multiple Sentinel-2 items are available for a province, THE MataBumi_System SHALL select the item with the lowest cloud cover percentage
3. WHEN no Sentinel-2 items exist with cloud cover below Cloud_Cover_Threshold, THE MataBumi_System SHALL retry with 25% cloud cover threshold
4. IF no usable imagery exists after retry, THEN THE MataBumi_System SHALL log the province name and date range and continue to the next province
5. THE Planetary_Computer_API SHALL return NIR (Band 8) and Red (Band 4) spectral bands for NDVI calculation
6. WHEN fetching imagery, THE MataBumi_System SHALL use 60 meter resolution for MVP processing speed
7. WHERE memory constraints are encountered, THE MataBumi_System SHALL retry imagery fetch at 120 meter resolution
8. THE MataBumi_System SHALL fetch imagery for all 38 Province_Bounding_Box definitions covering Indonesian territory
9. WHEN Band 8 or Band 4 is missing from a Sentinel-2 item, THE MataBumi_System SHALL skip that item and try the next available item
10. THE MataBumi_System SHALL access Planetary_Computer_API using planetary_computer.sign_inplace modifier for SAS token signing, with optional API key from environment variables for reduced rate limiting

### Requirement 2: NDVI Calculation

**User Story:** As a vegetation analyst, I want to calculate NDVI from satellite bands, so that I can quantify vegetation density and health.

#### Acceptance Criteria

1. WHEN the NDVI_Calculator receives NIR and Red band arrays, THE NDVI_Calculator SHALL compute NDVI using the formula (NIR - Red) / (NIR + Red + 1e-10)
2. THE NDVI_Calculator SHALL return NDVI values between -1.0 and 1.0 for all valid inputs
3. WHEN NIR and Red values are both positive, THE NDVI_Calculator SHALL never crash or raise exceptions
4. THE NDVI_Calculator SHALL add epsilon value (1e-10) to denominator to prevent division by zero
5. WHEN input arrays contain NaN values, THE NDVI_Calculator SHALL propagate NaN to output without crashing
6. THE NDVI_Calculator SHALL process arrays of any shape matching NIR and Red band dimensions
7. THE NDVI_Calculator SHALL use float64 precision for all calculations
8. WHEN NDVI calculation completes, THE NDVI_Calculator SHALL return a numpy array with the same spatial dimensions as input bands

### Requirement 3: Vegetation Change Detection

**User Story:** As a forest monitor, I want to detect vegetation loss by comparing NDVI values over time, so that I can identify deforestation events.

#### Acceptance Criteria

1. WHEN the Change_Detector receives NDVI_before and NDVI_after arrays, THE Change_Detector SHALL compute change as (NDVI_before - NDVI_after)
2. WHEN NDVI change exceeds NDVI_Change_Threshold (0.2), THE Change_Detector SHALL mark the pixel as deforestation
3. THE Change_Detector SHALL create a binary deforestation mask where True indicates vegetation loss
4. WHEN estimating area, THE Change_Detector SHALL multiply deforestation pixel count by pixel area in hectares
5. THE Change_Detector SHALL calculate pixel area as (resolution_meters ^ 2) / 10000 hectares
6. WHEN deforestation area is calculated, THE Change_Detector SHALL return a non-negative float value
7. THE Change_Detector SHALL use before period of 60-90 days prior to current date
8. THE Change_Detector SHALL use after period of 0-30 days prior to current date
9. WHEN no deforestation is detected, THE Change_Detector SHALL return area of 0.0 hectares
10. IF deforestation area is below Minimum_Alert_Area (50 hectares), THEN THE Change_Detector SHALL not create an Alert_Record

### Requirement 4: NDVI Visualization Generation

**User Story:** As a competition participant, I want to generate before/after/change NDVI visualizations, so that I can include compelling evidence in my PDF submission.

#### Acceptance Criteria

1. WHEN the MataBumi_System detects deforestation in a province, THE MataBumi_System SHALL generate a Hero_Image with three panels (before, after, change)
2. THE Hero_Image SHALL use RdYlGn colormap for before and after NDVI panels with vmin=-0.2 and vmax=0.9
3. THE Hero_Image SHALL use Reds colormap for change panel with vmin=0 and vmax=0.5
4. THE Hero_Image SHALL have dark background color (#0D1117) for professional appearance
5. THE Hero_Image SHALL include province name in the title
6. THE Hero_Image SHALL be saved to outputs/ directory with filename format "matabumi_{province_lowercase}.png"
7. THE Hero_Image SHALL be rendered at 200 DPI resolution for PDF quality
8. THE Hero_Image SHALL have figure size of 18x6 inches for three-panel layout
9. WHEN saving Hero_Image, THE MataBumi_System SHALL create outputs/ directory if it does not exist
10. THE Hero_Image SHALL remove axis ticks and labels for clean visualization

### Requirement 5: Deforestation Cause Classification

**User Story:** As a forest policy analyst, I want to classify the cause of deforestation using pattern analysis, so that I can understand the drivers of forest loss without requiring machine learning training data.

#### Acceptance Criteria

1. WHEN the Rule_Based_Classifier receives an NDVI change patch, province name, and bounding box, THE Rule_Based_Classifier SHALL classify it into one Cause_Category
2. THE Rule_Based_Classifier SHALL support classification into logging, plantation, mining, fire, or unknown categories
3. WHEN classifying, THE Rule_Based_Classifier SHALL extract a center crop patch from the full change array
4. THE Rule_Based_Classifier SHALL calculate fragmentation index as (number of patches / total deforested area)
5. THE Rule_Based_Classifier SHALL calculate compactness as (perimeter² / (4π × area)) to measure shape regularity
6. THE Rule_Based_Classifier SHALL calculate mean NDVI change intensity in deforested pixels
7. THE Rule_Based_Classifier SHALL apply geographic heuristics based on province (e.g., mining provinces, plantation provinces)
8. WHEN classification completes, THE Rule_Based_Classifier SHALL return the cause label and confidence score
9. THE Rule_Based_Classifier SHALL return confidence as a float between 0.60 and 0.85 based on pattern strength and geographic match
10. THE Rule_Based_Classifier SHALL use decision rules: plantation (compactness < 1.5, fragmentation < 0.1), mining (intensity > 0.4, compactness < 2.0), logging (fragmentation > 0.15, compactness > 2.5), fire (few patches < 3, large area > 1000 pixels)

### Requirement 6: Severity Scoring

**User Story:** As an environmental responder, I want deforestation events scored by severity, so that I can prioritize response efforts.

#### Acceptance Criteria

1. WHEN the Severity_Scorer receives area, cause, and province, THE Severity_Scorer SHALL calculate a severity score between 0 and 100
2. THE Severity_Scorer SHALL assign severity label as "low" when score is below 35
3. THE Severity_Scorer SHALL assign severity label as "moderate" when score is between 35 and 59
4. THE Severity_Scorer SHALL assign severity label as "high" when score is between 60 and 79
5. THE Severity_Scorer SHALL assign severity label as "critical" when score is 80 or above
6. WHEN province is a Protected_Province, THE Severity_Scorer SHALL automatically assign "critical" severity regardless of score
7. THE Severity_Scorer SHALL weight area contribution as 40% of total severity score
8. THE Severity_Scorer SHALL weight cause contribution as 40% of total severity score using Cause_Weight values
9. THE Severity_Scorer SHALL add 20 points to score when event occurs in Protected_Province
10. WHEN area is below 100 hectares, THE Severity_Scorer SHALL assign area score of 20
11. WHEN area is between 100 and 499 hectares, THE Severity_Scorer SHALL assign area score of 40
12. WHEN area is between 500 and 1999 hectares, THE Severity_Scorer SHALL assign area score of 70
13. WHEN area is 2000 hectares or above, THE Severity_Scorer SHALL assign area score of 90
14. THE Severity_Scorer SHALL return both severity label and protected zone boolean flag

### Requirement 7: Alert Database Storage

**User Story:** As a data analyst, I want deforestation alerts stored in a local database, so that I can query and visualize patterns over time without cloud dependencies.

#### Acceptance Criteria

1. WHEN an Alert_Record is created, THE SQLite_Database SHALL store detected_at, province, lat, lng, bbox coordinates, area_ha, cause, confidence, severity, is_protected_zone, ndvi_before, ndvi_after, ndvi_change, and thumbnail_path
2. THE SQLite_Database SHALL auto-generate a unique integer ID for each Alert_Record using AUTOINCREMENT
3. THE SQLite_Database SHALL set created_at timestamp to current date and time automatically using DEFAULT CURRENT_TIMESTAMP
4. THE SQLite_Database SHALL enforce NOT NULL constraint on detected_at, province, lat, lng, and area_ha fields
5. THE SQLite_Database SHALL store confidence as REAL between 0.0 and 1.0
6. THE SQLite_Database SHALL store is_protected_zone as INTEGER (0 or 1)
7. THE SQLite_Database SHALL store thumbnail_path as TEXT containing relative file path to local thumbnail image
8. THE SQLite_Database SHALL maintain index on province field for fast API filtering
9. THE SQLite_Database SHALL maintain index on detected_at field for temporal queries
10. THE SQLite_Database SHALL maintain index on severity field for priority filtering
11. THE MataBumi_System SHALL use Python sqlite3 module for database operations
12. WHEN Alert_Record insert succeeds, THE MataBumi_System SHALL log province name, area, and severity
13. WHEN confidence score is below Confidence_Threshold (0.6), THE MataBumi_System SHALL not create an Alert_Record
14. THE SQLite_Database SHALL be stored as a single file (matabumi.db) in the backend/database/ directory

### Requirement 8: Satellite Thumbnail Storage

**User Story:** As a dashboard viewer, I want to see actual satellite imagery for each deforestation event, so that I can visually verify the detection with real satellite photos.

#### Acceptance Criteria

1. WHEN the MataBumi_System detects deforestation, THE MataBumi_System SHALL extract a 256x256 pixel Satellite_Thumbnail from the NDVI change area
2. THE MataBumi_System SHALL convert the Satellite_Thumbnail to RGB format using false-color composite (NIR-Red-Green)
3. THE MataBumi_System SHALL save the Satellite_Thumbnail to local filesystem in outputs/thumbnails/ directory
4. THE MataBumi_System SHALL use filename format "{province}_{date}_{event_id}.jpg" for each thumbnail
5. THE MataBumi_System SHALL store the relative file path in the Alert_Record thumbnail_path field
6. THE Satellite_Thumbnail SHALL be saved as JPEG with quality setting of 85 for balance of size and clarity
7. WHEN thumbnail save fails, THE MataBumi_System SHALL log the error and continue with alert creation (thumbnail_path set to NULL)
8. THE FastAPI_Backend SHALL serve thumbnail images via static file endpoint /api/thumbnails/{filename}
9. THE MataBumi_System SHALL create outputs/thumbnails/ directory if it does not exist
10. THE Satellite_Thumbnail files SHALL be included in backend deployment to Vercel for web access

### Requirement 9: Parallel Province Processing

**User Story:** As a system operator, I want the pipeline to process multiple provinces simultaneously, so that the complete national scan completes faster.

#### Acceptance Criteria

1. THE MataBumi_System SHALL use Python concurrent.futures ThreadPoolExecutor for parallel province processing
2. THE MataBumi_System SHALL process up to 4 provinces concurrently to balance speed and resource usage
3. WHEN processing provinces in parallel, THE MataBumi_System SHALL ensure each province operation is independent and thread-safe
4. THE MataBumi_System SHALL collect results from all parallel province tasks before pipeline completion
5. IF one province processing fails, THEN THE MataBumi_System SHALL continue processing remaining provinces without interruption
6. THE MataBumi_System SHALL log start and completion of each province task with thread identifier
7. THE MataBumi_System SHALL maintain total pipeline execution time metric for performance monitoring
8. WHEN all province tasks complete, THE MataBumi_System SHALL log summary statistics including success count, failure count, and total duration

### Requirement 10: Pipeline Orchestration

**User Story:** As a system operator, I want a main pipeline that orchestrates all detection steps, so that the system runs end-to-end automatically.

#### Acceptance Criteria

1. WHEN the MataBumi_System pipeline starts, THE MataBumi_System SHALL process all 38 provinces in sequence
2. THE MataBumi_System SHALL calculate before period as 60-90 days prior to current date
3. THE MataBumi_System SHALL calculate after period as 0-30 days prior to current date
4. WHEN processing a province, THE MataBumi_System SHALL fetch before imagery, fetch after imagery, calculate NDVI for both periods, detect change, estimate area, classify cause, score severity, store alert, and generate Hero_Image
5. IF any step fails for a province, THEN THE MataBumi_System SHALL log the error and continue to the next province
6. THE MataBumi_System SHALL log progress messages for each province including area detected and severity
7. WHEN area is below Minimum_Alert_Area, THE MataBumi_System SHALL skip alert creation and log the below-threshold detection
8. THE MataBumi_System SHALL calculate centroid coordinates as the center of Province_Bounding_Box
9. WHEN pipeline completes, THE MataBumi_System SHALL log total completion message
10. THE MataBumi_System SHALL support optional province list parameter for testing on subset of provinces

### Requirement 10: Pipeline Orchestration

**User Story:** As a system operator, I want a main pipeline that orchestrates all detection steps, so that the system runs end-to-end automatically.

#### Acceptance Criteria

1. WHEN the MataBumi_System pipeline starts, THE MataBumi_System SHALL process all 38 provinces using parallel processing
2. THE MataBumi_System SHALL calculate before period as 60-90 days prior to current date
3. THE MataBumi_System SHALL calculate after period as 0-30 days prior to current date
4. WHEN processing a province, THE MataBumi_System SHALL fetch before imagery, fetch after imagery, calculate NDVI for both periods, detect change, estimate area, classify cause, score severity, extract thumbnail, save to filesystem, store alert in SQLite, and generate Hero_Image
5. IF any step fails for a province, THEN THE MataBumi_System SHALL log the error and continue to the next province
6. THE MataBumi_System SHALL log progress messages for each province including area detected and severity
7. WHEN area is below Minimum_Alert_Area, THE MataBumi_System SHALL skip alert creation and log the below-threshold detection
8. THE MataBumi_System SHALL calculate centroid coordinates as the center of Province_Bounding_Box
9. WHEN pipeline completes, THE MataBumi_System SHALL log total completion message with summary statistics
10. THE MataBumi_System SHALL support optional province list parameter for testing on subset of provinces
11. THE MataBumi_System SHALL be executable as a standalone Python script without cloud dependencies

### Requirement 11: Azure Functions Timer Trigger

**User Story:** As a system administrator, I want the pipeline to run automatically every 5 days, so that deforestation monitoring is continuous without manual intervention.

#### Acceptance Criteria

1. THE Timer_Trigger SHALL execute the MataBumi_System pipeline every 5 days at midnight UTC
2. THE Timer_Trigger SHALL use NCRONTAB expression "0 0 */5 * * *" for scheduling
3. THE Timer_Trigger SHALL not run on Azure Functions startup (run_on_startup=False)
4. WHEN Timer_Trigger fires, THE Timer_Trigger SHALL invoke the complete pipeline for all provinces
5. IF pipeline execution fails, THEN THE Timer_Trigger SHALL log the error to Azure Application Insights
6. THE Timer_Trigger SHALL allow manual execution via Azure Portal for testing
7. THE Timer_Trigger SHALL use Azure Functions Python v2 programming model
8. THE Timer_Trigger SHALL have function name "matabumi_pipeline"

### Requirement 11: Azure Functions Timer Trigger

**User Story:** As a system administrator, I want the pipeline to run automatically every 5 days, so that deforestation monitoring is continuous without manual intervention.

#### Acceptance Criteria

1. THE Timer_Trigger SHALL execute the MataBumi_System pipeline every 5 days at midnight UTC
2. THE Timer_Trigger SHALL use NCRONTAB expression "0 0 */5 * * *" for scheduling
3. THE Timer_Trigger SHALL not run on Azure Functions startup (run_on_startup=False)
4. WHEN Timer_Trigger fires, THE Timer_Trigger SHALL invoke the complete pipeline for all provinces
5. IF pipeline execution fails, THEN THE Timer_Trigger SHALL log the error to Azure Application Insights
6. THE Timer_Trigger SHALL allow manual execution via Azure Portal for testing
7. THE Timer_Trigger SHALL use Azure Functions Python v2 programming model
8. THE Timer_Trigger SHALL have function name "matabumi_pipeline"

### Requirement 12: Environment Configuration

**User Story:** As a developer, I want all secrets and configuration managed through environment variables, so that credentials are never committed to source control.

#### Acceptance Criteria

1. THE MataBumi_System MAY read PLANETARY_COMPUTER_API_KEY from environment variables if provided (optional for unauthenticated access)
2. THE MataBumi_System SHALL read CUSTOM_VISION_ENDPOINT, CUSTOM_VISION_KEY, CUSTOM_VISION_PROJECT_ID, and CUSTOM_VISION_ITERATION_NAME from environment variables
3. THE MataBumi_System SHALL read AZURE_SQL_SERVER, AZURE_SQL_DATABASE, AZURE_SQL_USERNAME, and AZURE_SQL_PASSWORD from environment variables
4. THE MataBumi_System SHALL read NDVI_CHANGE_THRESHOLD from environment variables with default value 0.2
5. THE MataBumi_System SHALL read CLOUD_COVER_MAX from environment variables with default value 15
6. THE MataBumi_System SHALL never hardcode API keys, passwords, or connection strings in source code
7. THE MataBumi_System SHALL provide .env.example template file with all variable names and indicate which are optional
8. THE MataBumi_System SHALL load environment variables using python-dotenv library
9. WHEN a required environment variable is missing, THE MataBumi_System SHALL raise a clear error message indicating which variable is missing
10. WHEN PLANETARY_COMPUTER_API_KEY is not provided, THE MataBumi_System SHALL use unauthenticated access to Microsoft Planetary Computer with planetary_computer.sign_inplace modifier

### Requirement 12: Environment Configuration

**User Story:** As a developer, I want all secrets and configuration managed through environment variables, so that credentials are never committed to source control.

#### Acceptance Criteria

1. THE MataBumi_System MAY read PLANETARY_COMPUTER_API_KEY from environment variables if provided (optional for unauthenticated access)
2. THE MataBumi_System SHALL read CUSTOM_VISION_ENDPOINT, CUSTOM_VISION_KEY, CUSTOM_VISION_PROJECT_ID, and CUSTOM_VISION_ITERATION_NAME from environment variables
3. THE MataBumi_System SHALL read AZURE_SQL_SERVER, AZURE_SQL_DATABASE, AZURE_SQL_USERNAME, and AZURE_SQL_PASSWORD from environment variables
4. THE MataBumi_System SHALL read AZURE_STORAGE_CONNECTION_STRING and AZURE_STORAGE_CONTAINER_NAME from environment variables
5. THE MataBumi_System SHALL read NDVI_CHANGE_THRESHOLD from environment variables with default value 0.2
6. THE MataBumi_System SHALL read CLOUD_COVER_MAX from environment variables with default value 15
7. THE MataBumi_System SHALL read CONFIDENCE_THRESHOLD from environment variables with default value 0.6
8. THE MataBumi_System SHALL never hardcode API keys, passwords, or connection strings in source code
9. THE MataBumi_System SHALL provide .env.example template file with all variable names and indicate which are optional
10. THE MataBumi_System SHALL load environment variables using python-dotenv library
11. WHEN a required environment variable is missing, THE MataBumi_System SHALL raise a clear error message indicating which variable is missing
12. WHEN PLANETARY_COMPUTER_API_KEY is not provided, THE MataBumi_System SHALL use unauthenticated access to Microsoft Planetary Computer with planetary_computer.sign_inplace modifier

### Requirement 13: Error Handling and Resilience

**User Story:** As a system operator, I want robust error handling, so that transient failures do not crash the entire pipeline.

#### Acceptance Criteria

1. WHEN Planetary_Computer_API request fails, THE MataBumi_System SHALL log the error and skip to next province
2. WHEN Azure_SQL_Database connection times out, THE MataBumi_System SHALL retry up to 3 times with exponential backoff
3. WHEN Custom_Vision_Classifier API call fails, THE MataBumi_System SHALL assign cause as "unknown" and continue processing
4. WHEN memory error occurs during imagery fetch, THE MataBumi_System SHALL retry at lower resolution (120m)
5. WHEN NDVI calculation encounters invalid data, THE MataBumi_System SHALL handle NaN values gracefully without crashing
6. THE MataBumi_System SHALL wrap all external API calls in try-except blocks
7. THE MataBumi_System SHALL use Python logging module for all error messages
8. WHEN an error is caught, THE MataBumi_System SHALL log the province name, operation, and error message
9. THE MataBumi_System SHALL never crash the entire pipeline due to a single province failure
10. WHEN Hero_Image generation fails, THE MataBumi_System SHALL log the error and continue to database storage

### Requirement 13: Error Handling and Resilience

**User Story:** As a system operator, I want robust error handling, so that transient failures do not crash the entire pipeline.

#### Acceptance Criteria

1. WHEN Planetary_Computer_API request fails, THE MataBumi_System SHALL log the error and skip to next province
2. WHEN Azure_SQL_Database connection times out, THE MataBumi_System SHALL retry up to 3 times with exponential backoff
3. WHEN Custom_Vision_Classifier API call fails, THE MataBumi_System SHALL assign cause as "unknown" and continue processing
4. WHEN memory error occurs during imagery fetch, THE MataBumi_System SHALL retry at lower resolution (120m)
5. WHEN NDVI calculation encounters invalid data, THE MataBumi_System SHALL handle NaN values gracefully without crashing
6. WHEN Azure_Blob_Storage upload fails, THE MataBumi_System SHALL log the error and continue with alert creation (thumbnail_url set to NULL)
7. THE MataBumi_System SHALL wrap all external API calls in try-except blocks
8. THE MataBumi_System SHALL use Python logging module for all error messages
9. WHEN an error is caught, THE MataBumi_System SHALL log the province name, operation, and error message
10. THE MataBumi_System SHALL never crash the entire pipeline due to a single province failure
11. WHEN Hero_Image generation fails, THE MataBumi_System SHALL log the error and continue to database storage

### Requirement 14: Logging and Observability

**User Story:** As a system operator, I want comprehensive logging, so that I can debug issues and monitor pipeline health.

#### Acceptance Criteria

1. THE MataBumi_System SHALL log pipeline start with total province count and date ranges
2. THE MataBumi_System SHALL log each province name when processing begins
3. WHEN imagery is not found, THE MataBumi_System SHALL log warning with province and date range
4. WHEN deforestation is below threshold, THE MataBumi_System SHALL log province and area with checkmark indicator
5. WHEN deforestation alert is created, THE MataBumi_System SHALL log province, area, cause, confidence, and severity with red circle indicator
6. WHEN Hero_Image is saved, THE MataBumi_System SHALL log the output file path
7. WHEN Alert_Record is inserted, THE MataBumi_System SHALL log confirmation with key details
8. WHEN pipeline completes, THE MataBumi_System SHALL log completion message
9. THE MataBumi_System SHALL use logging.info for normal operations and logging.error for failures
10. THE MataBumi_System SHALL configure logging to write to Azure Application Insights when running in Azure Functions

### Requirement 14: Logging and Observability

**User Story:** As a system operator, I want comprehensive logging, so that I can debug issues and monitor pipeline health.

#### Acceptance Criteria

1. THE MataBumi_System SHALL log pipeline start with total province count and date ranges
2. THE MataBumi_System SHALL log each province name when processing begins
3. WHEN imagery is not found, THE MataBumi_System SHALL log warning with province and date range
4. WHEN deforestation is below threshold, THE MataBumi_System SHALL log province and area with checkmark indicator
5. WHEN deforestation alert is created, THE MataBumi_System SHALL log province, area, cause, confidence, and severity with red circle indicator
6. WHEN Hero_Image is saved, THE MataBumi_System SHALL log the output file path
7. WHEN Satellite_Thumbnail is uploaded, THE MataBumi_System SHALL log the blob storage URL
8. WHEN Alert_Record is inserted, THE MataBumi_System SHALL log confirmation with key details
9. WHEN pipeline completes, THE MataBumi_System SHALL log completion message with total execution time
10. THE MataBumi_System SHALL use logging.info for normal operations and logging.error for failures
11. THE MataBumi_System SHALL configure logging to write to Azure Application Insights when running in Azure Functions

### Requirement 15: Code Quality and Standards

**User Story:** As a developer, I want code that follows Python best practices, so that the system is maintainable and professional.

#### Acceptance Criteria

1. THE MataBumi_System SHALL use Python 3.11 or higher
2. THE MataBumi_System SHALL follow PEP8 style guidelines with maximum line length of 100 characters
3. THE MataBumi_System SHALL include docstrings for all functions describing parameters and return values
4. THE MataBumi_System SHALL use pathlib.Path for all file operations instead of os.path
5. THE MataBumi_System SHALL use type hints for function parameters and return values where practical
6. THE MataBumi_System SHALL organize code into logical modules (detection, database, pipeline)
7. THE MataBumi_System SHALL define all constants at module level or in configuration
8. THE MataBumi_System SHALL use descriptive variable names matching domain terminology
9. THE MataBumi_System SHALL avoid print() statements in production code, using logging instead
10. THE MataBumi_System SHALL include requirements.txt with pinned dependency versions

### Requirement 15: Code Quality and Standards

**User Story:** As a developer, I want code that follows Python best practices, so that the system is maintainable and professional.

#### Acceptance Criteria

1. THE MataBumi_System SHALL use Python 3.11 or higher
2. THE MataBumi_System SHALL follow PEP8 style guidelines with maximum line length of 100 characters
3. THE MataBumi_System SHALL include docstrings for all functions describing parameters and return values
4. THE MataBumi_System SHALL use pathlib.Path for all file operations instead of os.path
5. THE MataBumi_System SHALL use type hints for function parameters and return values where practical
6. THE MataBumi_System SHALL organize code into logical modules (detection, database, pipeline, storage)
7. THE MataBumi_System SHALL define all constants at module level or in configuration
8. THE MataBumi_System SHALL use descriptive variable names matching domain terminology
9. THE MataBumi_System SHALL avoid print() statements in production code, using logging instead
10. THE MataBumi_System SHALL include requirements.txt with pinned dependency versions including azure-storage-blob

### Requirement 16: Continuous Deployment

**User Story:** As a developer, I want automatic deployment to Azure on every push to main branch, so that updates are deployed without manual steps.

#### Acceptance Criteria

1. WHEN code is pushed to main branch, THE GitHub Actions workflow SHALL trigger automatically
2. THE GitHub Actions workflow SHALL set up Python 3.11 environment
3. THE GitHub Actions workflow SHALL install dependencies from requirements.txt
4. THE GitHub Actions workflow SHALL deploy to Azure Functions using publish profile
5. THE GitHub Actions workflow SHALL use secret AZURE_FUNCTIONAPP_PUBLISH_PROFILE from GitHub repository settings
6. THE GitHub Actions workflow SHALL deploy the complete project directory as function package
7. THE GitHub Actions workflow SHALL run on ubuntu-latest runner
8. WHEN deployment succeeds, THE GitHub Actions workflow SHALL show success status in GitHub UI
9. IF deployment fails, THEN THE GitHub Actions workflow SHALL show error details in workflow logs

### Requirement 16: Continuous Deployment

**User Story:** As a developer, I want automatic deployment to Azure on every push to main branch, so that updates are deployed without manual steps.

#### Acceptance Criteria

1. WHEN code is pushed to main branch, THE GitHub Actions workflow SHALL trigger automatically
2. THE GitHub Actions workflow SHALL set up Python 3.11 environment
3. THE GitHub Actions workflow SHALL install dependencies from requirements.txt
4. THE GitHub Actions workflow SHALL deploy to Azure Functions using publish profile
5. THE GitHub Actions workflow SHALL use secret AZURE_FUNCTIONAPP_PUBLISH_PROFILE from GitHub repository settings
6. THE GitHub Actions workflow SHALL deploy the complete project directory as function package
7. THE GitHub Actions workflow SHALL run on ubuntu-latest runner
8. WHEN deployment succeeds, THE GitHub Actions workflow SHALL show success status in GitHub UI
9. IF deployment fails, THEN THE GitHub Actions workflow SHALL show error details in workflow logs

### Requirement 17: Deforestation Trend Prediction

**User Story:** As a policy maker, I want to see predicted deforestation for the next period, so that I can proactively allocate resources to high-risk provinces.

#### Acceptance Criteria

1. THE MataBumi_System SHALL calculate Time_Series_Forecast for each province using historical Alert_Record data
2. THE MataBumi_System SHALL use Azure Machine Learning AutoML for time-series forecasting
3. THE Time_Series_Forecast SHALL predict total deforestation area (hectares) for the next 30-day period
4. THE MataBumi_System SHALL store forecast predictions in Azure_SQL_Database with columns: province, forecast_date, predicted_area_ha, confidence_interval_lower, confidence_interval_upper
5. THE Power_BI_Dashboard SHALL display forecast predictions alongside historical data in trend charts
6. THE Power_BI_Dashboard SHALL visually distinguish forecast data from actual data using dashed lines or different colors
7. WHEN insufficient historical data exists for a province (< 3 data points), THE MataBumi_System SHALL skip forecast generation for that province
8. THE MataBumi_System SHALL update forecasts every time the pipeline runs with new detection data
9. THE Power_BI_Dashboard SHALL show "projected deforestation next month" metric in KPI cards
10. THE MataBumi_System SHALL log forecast generation success or failure for each province

### Requirement 18: Deforestation Rate Comparison

**User Story:** As an environmental analyst, I want to see the rate of change in deforestation, so that I can identify provinces with accelerating forest loss.

#### Acceptance Criteria

1. THE MataBumi_System SHALL calculate Deforestation_Rate as percentage change compared to previous detection period
2. THE Deforestation_Rate SHALL be calculated as ((current_period_area - previous_period_area) / previous_period_area) * 100
3. THE Azure_SQL_Database SHALL store Deforestation_Rate in Alert_Record or separate rate_comparison table
4. THE Power_BI_Dashboard SHALL display Deforestation_Rate for each province with up/down arrow indicators
5. THE Power_BI_Dashboard SHALL highlight provinces with Deforestation_Rate > 50% as "accelerating"
6. THE Power_BI_Dashboard SHALL show Deforestation_Rate in province tooltip when hovering over map
7. WHEN no previous period data exists for a province, THE MataBumi_System SHALL set Deforestation_Rate to NULL
8. THE Power_BI_Dashboard SHALL include a "Top 5 Accelerating Provinces" visual showing highest Deforestation_Rate values
9. THE MataBumi_System SHALL calculate Deforestation_Rate at province level aggregating all events in the period

### Requirement 19: Property-Based Testing (Low Priority)

**User Story:** As a quality engineer, I want property-based tests for core mathematical functions, so that edge cases are automatically discovered.

#### Acceptance Criteria

1. WHERE property-based testing is implemented, THE test suite SHALL verify NDVI values are always between -1.0 and 1.0 for positive NIR and Red inputs
2. WHERE property-based testing is implemented, THE test suite SHALL verify NDVI_Calculator never crashes on any positive NIR and Red values
3. WHERE property-based testing is implemented, THE test suite SHALL verify deforestation area is always non-negative
4. WHERE property-based testing is implemented, THE test suite SHALL verify severity score is always between 0 and 100
5. WHERE property-based testing is implemented, THE test suite SHALL use hypothesis library for property generation
6. WHERE property-based testing is implemented, THE test suite SHALL run at least 100 examples per property
7. WHERE property-based testing is implemented, THE test suite SHALL test NDVI calculation with NIR and Red values ranging from 0 to 10000
8. WHERE property-based testing is implemented, THE test suite SHALL test area calculation with various mask sizes and resolutions

### Requirement 19: Property-Based Testing (Low Priority)

**User Story:** As a quality engineer, I want property-based tests for core mathematical functions, so that edge cases are automatically discovered.

#### Acceptance Criteria

1. WHERE property-based testing is implemented, THE test suite SHALL verify NDVI values are always between -1.0 and 1.0 for positive NIR and Red inputs
2. WHERE property-based testing is implemented, THE test suite SHALL verify NDVI_Calculator never crashes on any positive NIR and Red values
3. WHERE property-based testing is implemented, THE test suite SHALL verify deforestation area is always non-negative
4. WHERE property-based testing is implemented, THE test suite SHALL verify severity score is always between 0 and 100
5. WHERE property-based testing is implemented, THE test suite SHALL use hypothesis library for property generation
6. WHERE property-based testing is implemented, THE test suite SHALL run at least 100 examples per property
7. WHERE property-based testing is implemented, THE test suite SHALL test NDVI calculation with NIR and Red values ranging from 0 to 10000
8. WHERE property-based testing is implemented, THE test suite SHALL test area calculation with various mask sizes and resolutions

### Requirement 20: Database Schema Definition

**User Story:** As a database administrator, I want a clear schema definition, so that I can set up the Azure SQL database correctly.

#### Acceptance Criteria

1. THE Azure_SQL_Database SHALL define table deforestation_alerts with columns: id, detected_at, province, lat, lng, bbox_minx, bbox_miny, bbox_maxx, bbox_maxy, area_ha, cause, confidence, severity, is_protected_zone, ndvi_before, ndvi_after, ndvi_change, thumbnail_url, created_at
2. THE Azure_SQL_Database SHALL define table deforestation_forecasts with columns: id, province, forecast_date, predicted_area_ha, confidence_interval_lower, confidence_interval_upper, created_at
3. THE Azure_SQL_Database SHALL use INT IDENTITY(1,1) PRIMARY KEY for id columns
4. THE Azure_SQL_Database SHALL use DATE type for detected_at and forecast_date columns
5. THE Azure_SQL_Database SHALL use NVARCHAR(100) for province column
6. THE Azure_SQL_Database SHALL use FLOAT for lat, lng, bbox coordinates, area_ha, confidence, NDVI values, and forecast values
7. THE Azure_SQL_Database SHALL use NVARCHAR(50) for cause column
8. THE Azure_SQL_Database SHALL use NVARCHAR(20) for severity column
9. THE Azure_SQL_Database SHALL use NVARCHAR(500) for thumbnail_url column
10. THE Azure_SQL_Database SHALL use BIT with DEFAULT 0 for is_protected_zone column
11. THE Azure_SQL_Database SHALL use DATETIME with DEFAULT GETDATE() for created_at columns
12. THE Azure_SQL_Database SHALL provide schema.sql file for manual execution in Azure SQL Query Editor

### Requirement 21: Province Coverage

**User Story:** As a national monitoring system, I want complete coverage of all Indonesian provinces, so that no region is excluded from monitoring.

#### Acceptance Criteria

1. THE MataBumi_System SHALL define Province_Bounding_Box for all 38 provinces of Indonesia
2. THE MataBumi_System SHALL include all 10 Sumatra provinces: Aceh, Sumatera Utara, Sumatera Barat, Riau, Kepulauan Riau, Jambi, Sumatera Selatan, Kepulauan Bangka Belitung, Bengkulu, Lampung
3. THE MataBumi_System SHALL include all 7 Java and Bali provinces: Banten, DKI Jakarta, Jawa Barat, Jawa Tengah, DI Yogyakarta, Jawa Timur, Bali
4. THE MataBumi_System SHALL include all 2 Nusa Tenggara provinces: Nusa Tenggara Barat, Nusa Tenggara Timur
5. THE MataBumi_System SHALL include all 5 Kalimantan provinces: Kalimantan Barat, Kalimantan Tengah, Kalimantan Selatan, Kalimantan Timur, Kalimantan Utara
6. THE MataBumi_System SHALL include all 6 Sulawesi provinces: Sulawesi Utara, Gorontalo, Sulawesi Tengah, Sulawesi Barat, Sulawesi Selatan, Sulawesi Tenggara
7. THE MataBumi_System SHALL include all 2 Maluku provinces: Maluku, Maluku Utara
8. THE MataBumi_System SHALL include all 6 Papua provinces: Papua Barat, Papua Barat Daya, Papua, Papua Selatan, Papua Tengah, Papua Pegunungan
9. THE MataBumi_System SHALL verify total province count equals 38 using assertion
10. THE MataBumi_System SHALL use WGS84 coordinate system (longitude, latitude) for all Province_Bounding_Box definitions

### Requirement 21: Province Coverage

**User Story:** As a national monitoring system, I want complete coverage of all Indonesian provinces, so that no region is excluded from monitoring.

#### Acceptance Criteria

1. THE MataBumi_System SHALL define Province_Bounding_Box for all 38 provinces of Indonesia
2. THE MataBumi_System SHALL include all 10 Sumatra provinces: Aceh, Sumatera Utara, Sumatera Barat, Riau, Kepulauan Riau, Jambi, Sumatera Selatan, Kepulauan Bangka Belitung, Bengkulu, Lampung
3. THE MataBumi_System SHALL include all 7 Java and Bali provinces: Banten, DKI Jakarta, Jawa Barat, Jawa Tengah, DI Yogyakarta, Jawa Timur, Bali
4. THE MataBumi_System SHALL include all 2 Nusa Tenggara provinces: Nusa Tenggara Barat, Nusa Tenggara Timur
5. THE MataBumi_System SHALL include all 5 Kalimantan provinces: Kalimantan Barat, Kalimantan Tengah, Kalimantan Selatan, Kalimantan Timur, Kalimantan Utara
6. THE MataBumi_System SHALL include all 6 Sulawesi provinces: Sulawesi Utara, Gorontalo, Sulawesi Tengah, Sulawesi Barat, Sulawesi Selatan, Sulawesi Tenggara
7. THE MataBumi_System SHALL include all 2 Maluku provinces: Maluku, Maluku Utara
8. THE MataBumi_System SHALL include all 6 Papua provinces: Papua Barat, Papua Barat Daya, Papua, Papua Selatan, Papua Tengah, Papua Pegunungan
9. THE MataBumi_System SHALL verify total province count equals 38 using assertion
10. THE MataBumi_System SHALL use WGS84 coordinate system (longitude, latitude) for all Province_Bounding_Box definitions

### Requirement 22: Power BI Dashboard Interactive Map

**User Story:** As a dashboard viewer, I want an interactive map of Indonesia showing deforestation hotspots, so that I can visually identify where forest loss is occurring and explore details by clicking on provinces or specific locations.

#### Acceptance Criteria

1. THE Power_BI_Dashboard SHALL display a full map of Indonesia showing all 38 provinces
2. THE Power_BI_Dashboard SHALL use heat map visualization or flag markers to indicate deforestation locations
3. WHEN a province has deforestation events, THE Power_BI_Dashboard SHALL visually highlight that province with color intensity based on total area lost
4. WHEN a user clicks on a province, THE Power_BI_Dashboard SHALL show detailed information for that province including total area lost, number of events, and dominant cause
5. WHEN a user clicks on a specific deforestation location marker, THE Power_BI_Dashboard SHALL display event details including date detected, area (hectares), cause, confidence, and severity
6. THE Power_BI_Dashboard SHALL use color coding for severity levels: green (low), yellow (moderate), orange (high), red (critical)
7. THE Power_BI_Dashboard SHALL support drill-down from province level to individual deforestation event locations
8. THE Power_BI_Dashboard SHALL display geographic coordinates (latitude, longitude) for each deforestation event
9. THE Power_BI_Dashboard SHALL use Shape Map or Filled Map visual for Indonesia province boundaries
10. THE Power_BI_Dashboard SHALL overlay deforestation event markers on the province map using scatter plot or custom visual

### Requirement 22: Power BI Dashboard Interactive Map

**User Story:** As a dashboard viewer, I want an interactive map of Indonesia showing deforestation hotspots, so that I can visually identify where forest loss is occurring and explore details by clicking on provinces or specific locations.

#### Acceptance Criteria

1. THE Power_BI_Dashboard SHALL display a full map of Indonesia showing all 38 provinces
2. THE Power_BI_Dashboard SHALL use heat map visualization or flag markers to indicate deforestation locations
3. WHEN a province has deforestation events, THE Power_BI_Dashboard SHALL visually highlight that province with color intensity based on total area lost
4. WHEN a user clicks on a province, THE Power_BI_Dashboard SHALL show detailed information for that province including total area lost, number of events, and dominant cause
5. WHEN a user clicks on a specific deforestation location marker, THE Power_BI_Dashboard SHALL display event details including date detected, area (hectares), cause, confidence, severity, and Satellite_Thumbnail image
6. THE Power_BI_Dashboard SHALL use color coding for severity levels: green (low), yellow (moderate), orange (high), red (critical)
7. THE Power_BI_Dashboard SHALL support drill-down from province level to individual deforestation event locations
8. THE Power_BI_Dashboard SHALL display geographic coordinates (latitude, longitude) for each deforestation event
9. THE Power_BI_Dashboard SHALL use Shape Map or Filled Map visual for Indonesia province boundaries
10. THE Power_BI_Dashboard SHALL overlay deforestation event markers on the province map using scatter plot or custom visual
11. THE Power_BI_Dashboard SHALL embed Satellite_Thumbnail images in event tooltips or detail panels using thumbnail_url from database

### Requirement 23: Power BI Dashboard Sidebar and Filters

**User Story:** As a dashboard viewer, I want a sidebar showing deforestation classifications and filtering options, so that I can analyze patterns by severity level, cause, location, and time period.

#### Acceptance Criteria

1. THE Power_BI_Dashboard SHALL include a sidebar panel displaying deforestation classification statistics
2. THE Power_BI_Dashboard sidebar SHALL show count of events by severity level (critical, high, moderate, low)
3. THE Power_BI_Dashboard sidebar SHALL show count of events by cause category (logging, plantation, mining, fire, unknown)
4. THE Power_BI_Dashboard sidebar SHALL show list of provinces with active deforestation events
5. THE Power_BI_Dashboard sidebar SHALL display total hectares lost across all events
6. THE Power_BI_Dashboard sidebar SHALL display total number of deforestation events detected
7. WHEN a user selects a severity level filter, THE Power_BI_Dashboard SHALL update the map to show only events matching that severity
8. WHEN a user selects a cause category filter, THE Power_BI_Dashboard SHALL update the map to show only events matching that cause
9. WHEN a user selects a province from the sidebar list, THE Power_BI_Dashboard SHALL zoom or highlight that province on the map
10. THE Power_BI_Dashboard sidebar SHALL include date range slicer for filtering events by detection period
11. THE Power_BI_Dashboard sidebar SHALL show protected zone indicator for events in Protected_Province areas
12. THE Power_BI_Dashboard sidebar SHALL use visual indicators (icons or color badges) for quick severity and cause identification

### Requirement 23: Power BI Dashboard Sidebar and Filters

**User Story:** As a dashboard viewer, I want a sidebar showing deforestation classifications and filtering options, so that I can analyze patterns by severity level, cause, location, and time period.

#### Acceptance Criteria

1. THE Power_BI_Dashboard SHALL include a sidebar panel displaying deforestation classification statistics
2. THE Power_BI_Dashboard sidebar SHALL show count of events by severity level (critical, high, moderate, low)
3. THE Power_BI_Dashboard sidebar SHALL show count of events by cause category (logging, plantation, mining, fire, unknown)
4. THE Power_BI_Dashboard sidebar SHALL show list of provinces with active deforestation events
5. THE Power_BI_Dashboard sidebar SHALL display total hectares lost across all events
6. THE Power_BI_Dashboard sidebar SHALL display total number of deforestation events detected
7. THE Power_BI_Dashboard sidebar SHALL display "projected deforestation next month" from Time_Series_Forecast
8. WHEN a user selects a severity level filter, THE Power_BI_Dashboard SHALL update the map to show only events matching that severity
9. WHEN a user selects a cause category filter, THE Power_BI_Dashboard SHALL update the map to show only events matching that cause
10. WHEN a user selects a province from the sidebar list, THE Power_BI_Dashboard SHALL zoom or highlight that province on the map
11. THE Power_BI_Dashboard sidebar SHALL include date range slicer for filtering events by detection period
12. THE Power_BI_Dashboard sidebar SHALL show protected zone indicator for events in Protected_Province areas
13. THE Power_BI_Dashboard sidebar SHALL use visual indicators (icons or color badges) for quick severity and cause identification

### Requirement 24: Power BI Dashboard Language Toggle

**User Story:** As an Indonesian user or international judge, I want to switch between English and Indonesian language, so that I can view the dashboard in my preferred language.

#### Acceptance Criteria

1. THE Power_BI_Dashboard SHALL include a Language_Toggle button or slicer for switching between English and Bahasa Indonesia
2. WHEN Language_Toggle is set to "Bahasa Indonesia", THE Power_BI_Dashboard SHALL display all labels, titles, and text in Indonesian
3. WHEN Language_Toggle is set to "English", THE Power_BI_Dashboard SHALL display all labels, titles, and text in English
4. THE Power_BI_Dashboard SHALL translate province names appropriately (e.g., "Aceh" remains "Aceh", but "North Sumatra" becomes "Sumatera Utara")
5. THE Power_BI_Dashboard SHALL translate severity levels: critical="kritis", high="tinggi", moderate="sedang", low="rendah"
6. THE Power_BI_Dashboard SHALL translate cause categories: logging="penebangan", plantation="perkebunan", mining="pertambangan", fire="kebakaran", unknown="tidak diketahui"
7. THE Power_BI_Dashboard SHALL translate KPI card labels: "Total Forest Lost"="Total Hutan Hilang", "Critical Events"="Kejadian Kritis", "Protected Zones Breached"="Zona Lindung Dilanggar"
8. THE Power_BI_Dashboard SHALL use Power BI field parameters or DAX measures for language switching
9. THE Language_Toggle SHALL default to Bahasa Indonesia for Indonesian target audience
10. THE Power_BI_Dashboard SHALL maintain consistent layout and visual formatting across both languages

### Requirement 25: Power BI Dashboard Impact Calculator

**User Story:** As a policy advocate, I want an interactive impact calculator showing environmental and economic benefits of reducing deforestation, so that I can communicate the value of forest protection.

#### Acceptance Criteria

1. THE Power_BI_Dashboard SHALL include an Impact_Calculator widget with an interactive slider
2. THE Impact_Calculator slider SHALL allow users to select deforestation reduction percentage from 0% to 100%
3. WHEN user adjusts the slider, THE Impact_Calculator SHALL calculate and display hectares saved based on current deforestation rate
4. THE Impact_Calculator SHALL calculate CO₂ emissions avoided using formula: hectares_saved × 150 tC/ha × 3.67
5. THE Impact_Calculator SHALL display CO₂ savings in tonnes with thousands separator formatting
6. THE Impact_Calculator SHALL calculate economic value using carbon credit price (e.g., $15 per tonne CO₂)
7. THE Impact_Calculator SHALL display biodiversity impact as "equivalent to X football fields preserved"
8. THE Impact_Calculator SHALL show comparison text: "If MataBumi reduces illegal logging by X%, that saves Y hectares"
9. THE Impact_Calculator SHALL update calculations in real-time as user moves the slider
10. THE Impact_Calculator SHALL use current year's total deforestation data as baseline for calculations
11. THE Impact_Calculator SHALL display results in both English and Indonesian based on Language_Toggle setting
12. THE Impact_Calculator SHALL include visual indicators (icons for trees, CO₂, money) to make metrics more engaging

### Requirement 26: Power BI Dashboard Data Requirements

**User Story:** As a dashboard viewer, I want the database to provide all data needed for comprehensive visualization, so that I can understand national deforestation patterns.

#### Acceptance Criteria

1. THE Azure_SQL_Database SHALL store sufficient Alert_Record data to populate province choropleth map
2. THE Azure_SQL_Database SHALL store sufficient Alert_Record data to generate monthly trend charts
3. THE Azure_SQL_Database SHALL store sufficient Alert_Record data to calculate cause breakdown statistics
4. THE Azure_SQL_Database SHALL store sufficient Alert_Record data to rank provinces by total area lost
5. THE Azure_SQL_Database SHALL store sufficient Alert_Record data to count critical severity events
6. THE Azure_SQL_Database SHALL store sufficient Alert_Record data to identify protected zone breaches
7. THE Azure_SQL_Database SHALL store sufficient Alert_Record data to calculate cumulative hectares lost
8. THE Azure_SQL_Database SHALL store sufficient Alert_Record data to estimate CO₂ emissions (hectares × 150 × 3.67)
9. WHEN Power BI connects to Azure_SQL_Database, THE Azure_SQL_Database SHALL allow read access to deforestation_alerts table
10. THE Azure_SQL_Database SHALL support filtering by date range, province, severity, and cause for dashboard interactivity

### Requirement 26: Power BI Dashboard Data Requirements

**User Story:** As a dashboard viewer, I want the database to provide all data needed for comprehensive visualization, so that I can understand national deforestation patterns.

#### Acceptance Criteria

1. THE Azure_SQL_Database SHALL store sufficient Alert_Record data to populate province choropleth map
2. THE Azure_SQL_Database SHALL store sufficient Alert_Record data to generate monthly trend charts
3. THE Azure_SQL_Database SHALL store sufficient Alert_Record data to calculate cause breakdown statistics
4. THE Azure_SQL_Database SHALL store sufficient Alert_Record data to rank provinces by total area lost
5. THE Azure_SQL_Database SHALL store sufficient Alert_Record data to count critical severity events
6. THE Azure_SQL_Database SHALL store sufficient Alert_Record data to identify protected zone breaches
7. THE Azure_SQL_Database SHALL store sufficient Alert_Record data to calculate cumulative hectares lost
8. THE Azure_SQL_Database SHALL store sufficient Alert_Record data to estimate CO₂ emissions (hectares × 150 × 3.67)
9. THE Azure_SQL_Database SHALL store Time_Series_Forecast data for displaying predicted deforestation trends
10. THE Azure_SQL_Database SHALL store Satellite_Thumbnail URLs for embedding images in dashboard tooltips
11. WHEN Power BI connects to Azure_SQL_Database, THE Azure_SQL_Database SHALL allow read access to deforestation_alerts and deforestation_forecasts tables
12. THE Azure_SQL_Database SHALL support filtering by date range, province, severity, and cause for dashboard interactivity

### Requirement 27: Demo Data Population

**User Story:** As a competition participant, I want to populate demo data for provinces without real detection, so that the Power BI dashboard shows complete national coverage.

#### Acceptance Criteria

1. WHERE real detection is not performed for a province, THE MataBumi_System SHALL allow manual insertion of demo Alert_Record data
2. THE MataBumi_System SHALL support batch insertion of multiple Alert_Record entries
3. THE MataBumi_System SHALL validate that demo data follows the same schema as real detections
4. THE MataBumi_System SHALL clearly distinguish between real detection provinces (Aceh, Sumatera Utara) and demo data provinces in documentation
5. THE MataBumi_System SHALL ensure demo data includes variety of severity levels for realistic dashboard appearance
6. THE MataBumi_System SHALL ensure demo data includes variety of cause categories for complete visualization
7. THE MataBumi_System SHALL ensure demo data covers multiple dates for trend chart population
8. THE MataBumi_System SHALL ensure demo data includes at least one Alert_Record per province for complete map coverage

### Requirement 27: Demo Data Population

**User Story:** As a competition participant, I want to populate demo data for provinces without real detection, so that the Power BI dashboard shows complete national coverage.

#### Acceptance Criteria

1. WHERE real detection is not performed for a province, THE MataBumi_System SHALL allow manual insertion of demo Alert_Record data
2. THE MataBumi_System SHALL support batch insertion of multiple Alert_Record entries
3. THE MataBumi_System SHALL validate that demo data follows the same schema as real detections
4. THE MataBumi_System SHALL clearly distinguish between real detection provinces (Aceh, Sumatera Utara) and demo data provinces in documentation
5. THE MataBumi_System SHALL ensure demo data includes variety of severity levels for realistic dashboard appearance
6. THE MataBumi_System SHALL ensure demo data includes variety of cause categories for complete visualization
7. THE MataBumi_System SHALL ensure demo data covers multiple dates for trend chart population
8. THE MataBumi_System SHALL ensure demo data includes at least one Alert_Record per province for complete map coverage
9. THE MataBumi_System SHALL generate placeholder Satellite_Thumbnail URLs for demo data or use sample satellite images

### Requirement 28: Output Directory Management

**User Story:** As a file system user, I want the system to manage output directories properly, so that generated files are organized and accessible.

#### Acceptance Criteria

1. WHEN the MataBumi_System generates a Hero_Image, THE MataBumi_System SHALL create outputs/ directory if it does not exist
2. THE MataBumi_System SHALL save all Hero_Image files to outputs/ directory
3. THE MataBumi_System SHALL use consistent filename format "matabumi_{province_lowercase_with_underscores}.png"
4. THE MataBumi_System SHALL never delete the outputs/ directory or its contents automatically
5. THE MataBumi_System SHALL overwrite existing Hero_Image files with the same name
6. THE MataBumi_System SHALL use relative path "outputs/" from project root directory
7. WHEN Hero_Image is saved successfully, THE MataBumi_System SHALL log the complete file path
8. THE MataBumi_System SHALL ensure outputs/ directory is excluded from version control via .gitignore
