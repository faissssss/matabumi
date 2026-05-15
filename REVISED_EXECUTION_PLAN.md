# Revised Execution Plan: Monthly Multi-Year Pipeline
**Updated:** May 15, 2026
**Status:** ✅ Test Running

## 🎯 What Changed

### OLD Approach:
- 2 years (2023-2024)
- 2 time periods per year (March → September)
- 34 provinces × 2 years = **68 combinations**

### NEW Approach (REVISED):
- **3 years (2023-2025)**
- **12 months per year** (monthly comparisons)
- **34 provinces × 3 years × 12 months = 1,224 combinations**

## 📊 Why Monthly Comparisons?

### Benefits:
1. **Granular tracking:** Detect changes month-by-month
2. **Seasonal patterns:** See how deforestation varies by season
3. **Comprehensive data:** 12x more data points per province
4. **Historical accuracy:** Uses actual satellite data from each month
5. **Trend analysis:** Track deforestation trends over time

### How It Works:
Each month is compared with the **previous month**:
```
Feb 2023 → Mar 2023 (detect changes in March)
Mar 2023 → Apr 2023 (detect changes in April)
Apr 2023 → May 2023 (detect changes in May)
...
Nov 2025 → Dec 2025 (detect changes in December)
```

## 🚀 Current Status

### Test Run: ✅ RUNNING
```bash
# Currently executing:
python pipeline/run_monthly_pipeline.py --test

# Configuration:
- Provinces: 3 (Aceh, Riau, Kalimantan Timur)
- Year: 2023
- Months: 3 (March, June, September)
- Total: 9 combinations
- Duration: ~30-45 minutes
```

### Progress:
- ✅ Pipeline started successfully
- ✅ Connected to Microsoft Planetary Computer
- 🔄 Processing March 2023
- ⏳ Fetching imagery for 3 provinces
- ⏳ June 2023 (pending)
- ⏳ September 2023 (pending)

## 📈 Data Coverage Comparison

### OLD Plan:
```
34 provinces × 2 years × 1 comparison = 68 data points
```

### NEW Plan:
```
34 provinces × 3 years × 12 months = 1,224 data points
```

**18x more comprehensive!**

## 🎬 Execution Phases

### Phase 1: Test Run (CURRENT) ⏳
**Duration:** 30-45 minutes
**Command:** `python pipeline/run_monthly_pipeline.py --test`
**Output:** 9 combinations (3 provinces × 1 year × 3 months)

**Success Criteria:**
- ✅ All 9 combinations processed
- ✅ 3-5 detections found
- ✅ No errors or crashes
- ✅ Thumbnails generated
- ✅ Database records created

### Phase 2: Single Year (NEXT)
**Duration:** 12-16 hours
**Command:** `python pipeline/run_monthly_pipeline.py --year 2024`
**Output:** 408 combinations (34 provinces × 12 months)

**Why 2024?**
- Most recent complete year
- Best data quality
- Immediate value for users

### Phase 3: Full Historical (FINAL)
**Duration:** 36-48 hours
**Command:** `python pipeline/run_monthly_pipeline.py`
**Output:** 1,224 combinations (34 provinces × 3 years × 12 months)

**Complete dataset:**
- 2023: All 12 months
- 2024: All 12 months
- 2025: All 12 months (up to current month)

## 📊 Expected Results

### Test Run (9 combinations):
- **Detections:** 3-5 events
- **Provinces:** Aceh, Riau, Kalimantan Timur
- **Months:** March, June, September 2023
- **Database records:** 3-5 alerts
- **Thumbnails:** 3-5 images

### Single Year (408 combinations):
- **Detections:** 50-150 events
- **Coverage:** All 34 provinces
- **Months:** All 12 months of 2024
- **Database records:** 50-150 alerts
- **Thumbnails:** 50-150 images

### Full Run (1,224 combinations):
- **Detections:** 150-500 events
- **Coverage:** All 34 provinces
- **Years:** 2023, 2024, 2025
- **Months:** All 12 months per year
- **Database records:** 150-500 alerts
- **Thumbnails:** 150-500 images

## 🔍 Seasonal Insights

### Dry Season (June-September):
- **Higher deforestation rates**
- More fire-related events
- Better satellite imagery (less clouds)
- Peak activity months

### Wet Season (November-March):
- **Lower deforestation rates**
- More logging activity
- More cloud cover (some gaps expected)
- Reduced activity

### Transition (April-May, October):
- Mixed patterns
- Variable cloud cover
- Moderate activity

## 📁 Output Structure

### Database:
```
data/matabumi.db
└── alerts table
    ├── detected_at (e.g., "2023-03-15")
    ├── province
    ├── area_ha
    ├── cause
    ├── confidence
    ├── severity
    └── ... (full schema)
```

### Thumbnails:
```
data/thumbnails/
├── Aceh_2023-03-15_0.png
├── Aceh_2023-06-15_0.png
├── Aceh_2023-09-15_0.png
├── Riau_2023-03-15_0.png
...
├── Papua_2025-12-15_0.png
```

### Hero Images (large events >100 ha):
```
data/hero_images/
├── Aceh_2023_03.png
├── Riau_2024_06.png
├── Kalimantan_Timur_2024_08.png
...
```

### Summary Reports:
```
data/pipeline_summary_20260515_123456.txt
```

## 🎯 Next Steps

### 1. Wait for Test Completion (~30-45 min)
Monitor progress:
```bash
# Check database
sqlite3 data/matabumi.db "SELECT COUNT(*) FROM alerts;"

# View recent alerts
sqlite3 data/matabumi.db "SELECT detected_at, province, area_ha, cause FROM alerts ORDER BY detected_at DESC LIMIT 10;"

# Check thumbnails
ls -lh data/thumbnails/
```

### 2. Validate Test Results
Check:
- ✅ 9 combinations processed
- ✅ 3-5 detections found
- ✅ Causes match province profiles
- ✅ Confidence scores 0.60-0.85
- ✅ Thumbnails show clear changes

### 3. Start Single Year Run (if test successful)
```bash
python pipeline/run_monthly_pipeline.py --year 2024
```
- Duration: 12-16 hours
- Best to run overnight
- Monitor every 2-3 hours

### 4. Start Full Run (if single year successful)
```bash
python pipeline/run_monthly_pipeline.py
```
- Duration: 36-48 hours
- Run over weekend
- Monitor daily

## 📊 Performance Estimates

### Processing Speed:
- **Per combination:** 3-6 minutes average
- **Per province-month:** 3-6 minutes
- **Per province-year:** 36-72 minutes (12 months)
- **Per year (all provinces):** 12-16 hours (408 combinations)

### Resource Usage:
- **CPU:** Moderate (4 parallel workers)
- **Memory:** 2-4 GB
- **Disk:** 5-10 GB for full run
- **Network:** Moderate (satellite imagery downloads)

## 🔧 Configuration Options

### Test Different Months:
```python
# Edit pipeline/run_monthly_pipeline.py
TEST_MONTHS = [1, 6, 12]  # January, June, December
```

### Adjust Parallel Processing:
```python
# Edit pipeline/run_monthly_pipeline.py
ThreadPoolExecutor(max_workers=2)  # Reduce if system struggles
```

### Change Thresholds:
```bash
# Set environment variables
export MINIMUM_ALERT_AREA=15  # Increase to 15 ha
export CONFIDENCE_THRESHOLD=0.6  # Increase to 60%
```

## 🎉 Success Metrics

### Test Success:
- ✅ 9/9 combinations processed
- ✅ 3-5 detections
- ✅ No crashes
- ✅ Valid classifications

### Production Success:
- ✅ 1,224/1,224 combinations processed
- ✅ 150-500 total detections
- ✅ Seasonal patterns visible
- ✅ Province profiles match expectations
- ✅ Ready for API deployment

## 📞 Monitoring Commands

### Check Test Progress:
```bash
# Count alerts
sqlite3 data/matabumi.db "SELECT COUNT(*) FROM alerts;"

# View by month
sqlite3 data/matabumi.db "SELECT strftime('%Y-%m', detected_at) as month, COUNT(*) FROM alerts GROUP BY month;"

# View by province
sqlite3 data/matabumi.db "SELECT province, COUNT(*) FROM alerts GROUP BY province;"

# View by cause
sqlite3 data/matabumi.db "SELECT cause, COUNT(*) FROM alerts GROUP BY cause;"
```

### Check Thumbnails:
```bash
ls -lh data/thumbnails/ | wc -l
```

### Check Disk Space:
```bash
df -h data/
```

## 🚨 Important Notes

### Cloud Cover:
- Some months may have no data (high clouds)
- Normal, especially in wet season
- Pipeline will log warning and continue

### Processing Time:
- Varies by province size and cloud cover
- Large provinces (Papua, Kalimantan) take longer
- High cloud cover requires more retries

### Data Gaps:
- Some province-month combinations may have no imagery
- This is expected and normal
- Pipeline handles gracefully

## 📝 Files Created

### New Files:
1. `pipeline/run_monthly_pipeline.py` - Monthly pipeline script
2. `MONTHLY_PIPELINE_GUIDE.md` - Comprehensive guide
3. `REVISED_EXECUTION_PLAN.md` - This document

### Enhanced Files:
1. `detection/classify.py` - Improved classifier (already done)

### Output Files (after run):
1. `data/matabumi.db` - SQLite database with alerts
2. `data/thumbnails/*.png` - Visualization images
3. `data/hero_images/*.png` - Large event images
4. `data/pipeline_summary_*.txt` - Execution summaries

## 🎬 Timeline

| Time | Activity | Status |
|------|----------|--------|
| Now | Test run started | 🔄 Running |
| +30-45 min | Test completes | ⏳ Pending |
| +1 hour | Validate test results | ⏳ Pending |
| +1.5 hours | Start single year (2024) | ⏳ Pending |
| +13-17 hours | Single year completes | ⏳ Pending |
| +18 hours | Validate single year | ⏳ Pending |
| +19 hours | Start full run (3 years) | ⏳ Pending |
| +55-67 hours | Full run completes | ⏳ Pending |

**Total estimated time:** ~3 days from now

---

## 🎯 Current Action

**WAIT for test to complete** (~30-45 minutes from now)

Then check results:
```bash
sqlite3 data/matabumi.db "SELECT * FROM alerts;"
ls -lh data/thumbnails/
```

If successful, proceed to single year run:
```bash
python pipeline/run_monthly_pipeline.py --year 2024
```
