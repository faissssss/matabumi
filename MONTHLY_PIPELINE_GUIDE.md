# Monthly Multi-Year Pipeline Guide
**3 Years (2023-2025) × 12 Months × 34 Provinces = Comprehensive Historical Analysis**

## 🎯 Overview

The new monthly pipeline provides **month-by-month deforestation tracking** across 3 years, comparing each month with the previous month to detect changes.

### Key Features:
- ✅ **3 years of data:** 2023, 2024, 2025
- ✅ **Monthly comparisons:** Each month compared with previous month
- ✅ **All 12 months:** January through December
- ✅ **34 provinces:** Complete Indonesia coverage
- ✅ **Historical data:** Uses actual satellite imagery from each month

## 📊 Data Coverage

### Full Production Run:
```
34 provinces × 3 years × 12 months = 1,224 combinations
```

### Test Run:
```
3 provinces × 1 year × 3 months = 9 combinations
```

## 🚀 Usage

### Test Run (Recommended First):
```bash
# Test with 3 provinces, 2023, 3 months (March, June, September)
python pipeline/run_monthly_pipeline.py --test
```

**Expected duration:** ~30-45 minutes
**Output:** 9 combinations processed

### Single Year (All Provinces, All Months):
```bash
# Process all of 2024
python pipeline/run_monthly_pipeline.py --year 2024
```

**Expected duration:** ~12-16 hours
**Output:** 34 provinces × 12 months = 408 combinations

### Full Production Run (All Years, All Months):
```bash
# Process everything: 2023-2025, all months, all provinces
python pipeline/run_monthly_pipeline.py
```

**Expected duration:** ~36-48 hours
**Output:** 1,224 combinations processed

### Custom Configurations:

**Specific provinces:**
```bash
python pipeline/run_monthly_pipeline.py --provinces "Riau" "Kalimantan Timur" "Papua"
```

**Specific years:**
```bash
python pipeline/run_monthly_pipeline.py --years 2023 2024
```

**Specific months:**
```bash
# Only dry season months (June-September)
python pipeline/run_monthly_pipeline.py --months 6 7 8 9
```

**Combined:**
```bash
# High-priority provinces, 2024-2025, dry season only
python pipeline/run_monthly_pipeline.py \
  --provinces "Riau" "Kalimantan Tengah" "Kalimantan Timur" "Papua" \
  --years 2024 2025 \
  --months 6 7 8 9
```

## 📅 How Monthly Comparison Works

### Comparison Logic:
Each month is compared with the **previous month** to detect changes:

```
January 2023   ← compared with → December 2022
February 2023  ← compared with → January 2023
March 2023     ← compared with → February 2023
...
December 2023  ← compared with → November 2023
January 2024   ← compared with → December 2023
...
```

### Date Ranges:
- **Before:** Previous month (full month, day 1 to last day)
- **After:** Current month (full month, day 1 to last day)
- **Detection date:** Mid-month (15th) of the current month

### Example:
Processing **March 2024**:
- Before: February 1-29, 2024
- After: March 1-31, 2024
- Detection date: March 15, 2024

## 📈 Expected Output

### Database Records:
Each detected deforestation event creates a record with:
- **detected_at:** Mid-month date (e.g., "2024-03-15")
- **province:** Province name
- **lat/lng:** Centroid coordinates
- **bbox:** Bounding box coordinates
- **area_ha:** Deforested area in hectares
- **cause:** Classification (logging, plantation, mining, fire, unknown)
- **confidence:** Confidence score (0.60-0.85)
- **severity:** Severity level (low, medium, high, critical)
- **is_protected_zone:** Boolean flag
- **ndvi_before/after/change:** NDVI metrics
- **thumbnail_path:** Path to visualization image

### Thumbnail Images:
```
data/thumbnails/
├── Aceh_2023-01-15_0.png
├── Aceh_2023-02-15_0.png
├── Aceh_2023-03-15_0.png
...
├── Riau_2024-06-15_0.png
...
```

### Hero Images (for large events >100 ha):
```
data/hero_images/
├── Aceh_2023_03.png
├── Riau_2024_06.png
...
```

### Summary Report:
```
data/pipeline_summary_YYYYMMDD_HHMMSS.txt
```

## 🔍 Monitoring Progress

### Check Database:
```bash
# Count total alerts
sqlite3 data/matabumi.db "SELECT COUNT(*) FROM alerts;"

# Count by year
sqlite3 data/matabumi.db "SELECT strftime('%Y', detected_at) as year, COUNT(*) FROM alerts GROUP BY year;"

# Count by province
sqlite3 data/matabumi.db "SELECT province, COUNT(*) FROM alerts GROUP BY province ORDER BY COUNT(*) DESC;"

# Count by cause
sqlite3 data/matabumi.db "SELECT cause, COUNT(*) FROM alerts GROUP BY cause;"
```

### View Recent Alerts:
```bash
sqlite3 data/matabumi.db "SELECT detected_at, province, area_ha, cause, confidence FROM alerts ORDER BY detected_at DESC LIMIT 10;"
```

## 📊 Expected Results

### Seasonal Patterns:
Different months show different deforestation patterns:

**Dry Season (June-September):**
- Higher deforestation rates
- More fire-related events
- Better satellite imagery (less cloud cover)

**Wet Season (November-March):**
- Lower deforestation rates
- More logging activity
- More cloud cover (some months may have no data)

**Transition Months (April-May, October):**
- Mixed patterns
- Variable cloud cover

### Province Patterns:

**Riau (Plantation Province):**
- Consistent monthly activity
- Mostly "plantation" classification
- Medium-high confidence scores

**Kalimantan Timur (Mining Province):**
- Sporadic large events
- Mix of "mining" and "logging"
- High confidence for mining events

**Papua (Logging Province):**
- Fragmented patterns
- Mostly "logging" classification
- Variable confidence scores

## ⚙️ Configuration

### Environment Variables:
```bash
# Minimum area threshold (hectares)
MINIMUM_ALERT_AREA=10

# Confidence threshold (0.0-1.0)
CONFIDENCE_THRESHOLD=0.5
```

### Adjust in Code:
Edit `pipeline/run_monthly_pipeline.py`:

```python
# Change test configuration
TEST_PROVINCES = ["Aceh", "Riau", "Kalimantan Timur"]
TEST_YEARS = [2023]
TEST_MONTHS = [3, 6, 9]

# Change parallel processing
ThreadPoolExecutor(max_workers=4)  # Adjust based on system
```

## 🎬 Recommended Workflow

### Phase 1: Test Run (30-45 minutes)
```bash
python pipeline/run_monthly_pipeline.py --test
```
- Validates pipeline works
- Tests 9 combinations
- Quick feedback

### Phase 2: Single Year (12-16 hours)
```bash
python pipeline/run_monthly_pipeline.py --year 2024
```
- Processes most recent year
- 408 combinations
- Builds initial dataset

### Phase 3: Full Historical (36-48 hours)
```bash
python pipeline/run_monthly_pipeline.py
```
- Complete 3-year dataset
- 1,224 combinations
- Comprehensive analysis

### Phase 4: Validation
```bash
# Check results
sqlite3 data/matabumi.db "SELECT COUNT(*) FROM alerts;"

# View sample
sqlite3 data/matabumi.db "SELECT * FROM alerts LIMIT 5;"

# Check thumbnails
ls -lh data/thumbnails/ | head -20
```

## 📝 Performance Estimates

### Processing Time per Combination:
- **Fast:** 2-3 minutes (low cloud cover, small area)
- **Average:** 4-6 minutes (moderate conditions)
- **Slow:** 8-10 minutes (high cloud cover, large area)

### Total Duration Estimates:

| Configuration | Combinations | Est. Time |
|--------------|--------------|-----------|
| Test (3 prov, 1 yr, 3 mo) | 9 | 30-45 min |
| Single year (all prov, 12 mo) | 408 | 12-16 hours |
| Two years (all prov, 24 mo) | 816 | 24-32 hours |
| Full (all prov, 3 yr, 12 mo) | 1,224 | 36-48 hours |

### Disk Space Requirements:
- **Thumbnails:** ~500 KB per detection
- **Hero images:** ~2 MB per large event
- **Database:** ~1-2 KB per record
- **Total estimate:** 5-10 GB for full run

## 🔧 Troubleshooting

### No Data for Certain Months:
- **Cause:** High cloud cover or no satellite passes
- **Solution:** Normal, especially in wet season months
- **Action:** Pipeline will log warning and continue

### Slow Processing:
- **Cause:** Large provinces, high cloud cover
- **Solution:** Reduce `max_workers` or process in batches
- **Action:** Monitor system resources

### Memory Issues:
- **Cause:** Processing very large provinces
- **Solution:** Reduce parallel workers
- **Action:** Edit `ThreadPoolExecutor(max_workers=2)`

### Database Errors:
- **Cause:** Disk full or permissions
- **Solution:** Check disk space and permissions
- **Action:** Ensure `data/` directory is writable

## 🎉 Success Criteria

### Test Run Success:
- ✅ 9 combinations processed
- ✅ At least 3-5 detections found
- ✅ No crashes or errors
- ✅ Thumbnails generated
- ✅ Database records created

### Production Run Success:
- ✅ All combinations processed
- ✅ 100-500 total detections (estimated)
- ✅ Reasonable distribution across provinces
- ✅ Seasonal patterns visible
- ✅ Cause classifications match province profiles

## 📞 Next Steps

1. **Start with test run:**
   ```bash
   python pipeline/run_monthly_pipeline.py --test
   ```

2. **Validate test results:**
   - Check database records
   - View thumbnail images
   - Verify cause classifications

3. **Choose production strategy:**
   - Single year first (recommended)
   - Or full 3-year run (if confident)

4. **Monitor progress:**
   - Check logs periodically
   - Validate intermediate results
   - Ensure disk space available

5. **Deploy to API:**
   - Load data into production database
   - Update API endpoints
   - Test frontend integration

---

**Ready to start?** Run the test first:
```bash
python pipeline/run_monthly_pipeline.py --test
```
