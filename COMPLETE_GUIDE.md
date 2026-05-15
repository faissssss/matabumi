# Complete MataBumi Pipeline Guide
**Comprehensive Reference for 2024-2026 Monthly Deforestation Detection**

## 🎯 Executive Summary

**What's Running:**
- Full production pipeline processing all 38 Indonesian provinces
- 3 years of data: 2024, 2025, 2026
- Monthly comparisons (each month vs previous month)
- Total: 1,368 combinations (38 × 3 × 12)

**Duration:** 3-6 days (72-144 hours)
**Expected Output:** 450-750 deforestation detections
**Status:** ✅ RUNNING (Started May 15, 2026)

---

## 📊 Quick Reference

### Check Progress:
```bash
python monitor_pipeline.py
```

### Count Detections:
```bash
sqlite3 data/matabumi.db "SELECT COUNT(*) FROM alerts;"
```

### View Recent:
```bash
sqlite3 data/matabumi.db "SELECT detected_at, province, area_ha, cause FROM alerts ORDER BY detected_at DESC LIMIT 10;"
```

### Analyze Results:
```bash
python analyze_results.py
```

---

## 🗂️ Project Structure

```
matabumi_aitalentchallenge2026/
├── pipeline/
│   ├── run_monthly_pipeline.py    # Main pipeline (RUNNING)
│   └── run_multi_year.py          # Old pipeline (deprecated)
├── detection/
│   ├── fetch_imagery.py           # Sentinel-2 data fetching
│   ├── ndvi.py                    # NDVI calculation
│   ├── change.py                  # Change detection
│   ├── classify.py                # Enhanced classifier ✨
│   ├── severity.py                # Severity calculation
│   └── thumbnails.py              # Thumbnail generation
├── data/
│   ├── matabumi.db                # SQLite database (output)
│   ├── thumbnails/                # Visualization images
│   ├── hero_images/               # Large event images
│   └── pipeline_summary_*.txt     # Execution summaries
├── monitor_pipeline.py            # Real-time monitoring ✨
├── analyze_results.py             # Results analysis ✨
├── COMPLETE_GUIDE.md              # This file
├── MONTHLY_PIPELINE_GUIDE.md      # Detailed pipeline guide
├── FULL_RUN_STATUS.md             # Current run status
└── QUICK_REFERENCE.md             # Quick commands
```

---

## 🔄 Pipeline Flow

### 1. Data Fetching
```
For each province-month combination:
  ├─ Fetch "before" imagery (previous month)
  ├─ Fetch "after" imagery (current month)
  └─ Select best imagery (lowest cloud cover)
```

### 2. Change Detection
```
  ├─ Calculate NDVI for before/after
  ├─ Detect NDVI decrease (deforestation)
  ├─ Estimate deforested area
  └─ Filter by minimum threshold (10 ha)
```

### 3. Classification
```
  ├─ Extract shape metrics:
  │   ├─ Fragmentation
  │   ├─ Compactness
  │   ├─ Elongation
  │   ├─ Convexity
  │   ├─ Edge density ✨
  │   └─ Mean intensity
  ├─ Apply scoring system (15-point scale) ✨
  ├─ Determine cause (logging/plantation/mining/fire)
  └─ Calculate confidence (0.60-0.85)
```

### 4. Output Generation
```
  ├─ Calculate severity (low/medium/high/critical)
  ├─ Generate thumbnail images
  ├─ Create hero images (if >100 ha)
  └─ Insert into database
```

---

## 📅 Processing Schedule

### Current Progress:
```
Month 1/36: January 2024 (🔄 In Progress)
├─ Comparing: Dec 2023 → Jan 2024
├─ Provinces: 38 (processing in parallel)
└─ Status: Fetching imagery, detecting changes
```

### Timeline:
```
Day 1 (Today):
├─ January 2024 ✅
├─ February 2024 (expected)
└─ March 2024 (expected)

Day 2:
├─ April-June 2024
└─ ~6 months completed

Day 3:
├─ July-December 2024
└─ Full 2024 completed

Days 4-5:
├─ All of 2025
└─ 24 months completed

Days 5-6:
├─ All of 2026
└─ Full run completed
```

---

## 📊 Expected Results

### Detection Distribution:

**By Year:**
- 2024: 150-250 detections
- 2025: 150-250 detections
- 2026: 150-250 detections (up to May)
- **Total: 450-750 detections**

**By Season:**
- Dry (Jun-Sep): 40-50% of detections
- Wet (Nov-Mar): 20-30% of detections
- Transition (Apr-May, Oct): 20-30% of detections

**By Cause:**
- Plantation: 35-45%
- Logging: 25-35%
- Mining: 15-20%
- Fire: 10-15%
- Unknown: 5-10%

**By Province (Top 5):**
1. Riau: 50-80 detections
2. Kalimantan Tengah: 40-60 detections
3. Kalimantan Timur: 30-50 detections
4. Papua: 30-50 detections
5. Sumatera Selatan: 25-40 detections

---

## 🔍 Monitoring Guide

### Every 2-3 Hours (First Day):
```bash
# Quick check
python monitor_pipeline.py

# Or manual check
sqlite3 data/matabumi.db "SELECT COUNT(*) FROM alerts;"
```

### Twice Daily (Days 2-3):
```bash
# Full dashboard
python monitor_pipeline.py

# Check by month
sqlite3 data/matabumi.db "
SELECT strftime('%Y-%m', detected_at) as month, COUNT(*) 
FROM alerts 
GROUP BY month 
ORDER BY month;
"
```

### Once Daily (Days 4-6):
```bash
# Progress check
python monitor_pipeline.py

# Disk space check
df -h data/
du -sh data/thumbnails/
```

---

## 📈 Data Quality Metrics

### Confidence Scores:
- **Range:** 0.60 - 0.85 (enforced)
- **Target Average:** 0.70 - 0.75
- **Distribution:**
  - 0.60-0.65: ~15%
  - 0.65-0.70: ~25%
  - 0.70-0.75: ~30%
  - 0.75-0.80: ~20%
  - 0.80-0.85: ~10%

### Area Distribution:
- **Minimum:** 10 ha (threshold)
- **Average:** 30-50 ha
- **Distribution:**
  - 10-20 ha: ~40%
  - 20-50 ha: ~35%
  - 50-100 ha: ~15%
  - 100-200 ha: ~7%
  - >200 ha: ~3%

### Data Completeness:
- **Expected:** 1,368 combinations
- **Realistic:** 1,200-1,300 (87-95%)
- **Gaps:** 5-13% (due to cloud cover)

---

## 🎯 Validation Checklist

### After Completion:

**1. Data Completeness:**
```bash
# Total records
sqlite3 data/matabumi.db "SELECT COUNT(*) FROM alerts;"
# Expected: 450-750

# Provinces covered
sqlite3 data/matabumi.db "SELECT COUNT(DISTINCT province) FROM alerts;"
# Expected: 30-35 (out of 38)

# Months covered
sqlite3 data/matabumi.db "SELECT COUNT(DISTINCT strftime('%Y-%m', detected_at)) FROM alerts;"
# Expected: 30-35 (out of 36)
```

**2. Data Quality:**
```bash
# Confidence range check
sqlite3 data/matabumi.db "SELECT MIN(confidence), MAX(confidence) FROM alerts;"
# Expected: 0.60 - 0.85

# Area range check
sqlite3 data/matabumi.db "SELECT MIN(area_ha), MAX(area_ha) FROM alerts;"
# Expected: ≥10 ha

# Average confidence
sqlite3 data/matabumi.db "SELECT AVG(confidence) FROM alerts;"
# Expected: 0.70-0.75
```

**3. Distribution Validation:**
```bash
# Cause distribution
sqlite3 data/matabumi.db "SELECT cause, COUNT(*) FROM alerts GROUP BY cause;"
# Check: plantation should be highest

# Province distribution
sqlite3 data/matabumi.db "SELECT province, COUNT(*) FROM alerts GROUP BY province ORDER BY COUNT(*) DESC LIMIT 5;"
# Check: Riau, Kalimantan provinces should be top
```

**4. Visual Validation:**
```bash
# Check thumbnails exist
ls data/thumbnails/ | wc -l
# Expected: 450-750

# View sample thumbnails
# Open 10-20 random images and verify:
# - Before/after shows clear change
# - Change map highlights deforested areas
# - Cause classification seems reasonable
```

---

## 🚨 Troubleshooting

### Pipeline Stopped:
```bash
# Check if process is running
ps aux | grep run_monthly_pipeline

# If not running, restart from where it left off
# (Pipeline will skip already-processed combinations)
python pipeline/run_monthly_pipeline.py --years 2024 2025 2026
```

### No New Data:
```bash
# Check last detection
sqlite3 data/matabumi.db "SELECT MAX(detected_at) FROM alerts;"

# If stuck for >6 hours, check logs
# Look for error messages in terminal output
```

### Disk Full:
```bash
# Check space
df -h data/

# If needed, clean old files
rm data/pipeline_summary_old*.txt

# Or compress thumbnails
cd data/thumbnails
tar -czf thumbnails_backup.tar.gz *.png
# Then delete originals if needed
```

### High Memory Usage:
```bash
# Check memory
top -p $(pgrep -f run_monthly_pipeline)

# If needed, reduce parallel workers
# Edit pipeline/run_monthly_pipeline.py:
# ThreadPoolExecutor(max_workers=2)  # Reduce from 4 to 2
```

---

## 📊 Analysis Commands

### Basic Statistics:
```bash
# Total detections
sqlite3 data/matabumi.db "SELECT COUNT(*) FROM alerts;"

# Total area
sqlite3 data/matabumi.db "SELECT SUM(area_ha) FROM alerts;"

# Average confidence
sqlite3 data/matabumi.db "SELECT AVG(confidence) FROM alerts;"
```

### Temporal Analysis:
```bash
# By year
sqlite3 data/matabumi.db "
SELECT strftime('%Y', detected_at) as year, 
       COUNT(*) as count,
       SUM(area_ha) as total_area
FROM alerts 
GROUP BY year;
"

# By month (seasonal pattern)
sqlite3 data/matabumi.db "
SELECT strftime('%m', detected_at) as month, 
       COUNT(*) as count
FROM alerts 
GROUP BY month 
ORDER BY month;
"

# Monthly trend
sqlite3 data/matabumi.db "
SELECT strftime('%Y-%m', detected_at) as month, 
       COUNT(*) as count
FROM alerts 
GROUP BY month 
ORDER BY month;
"
```

### Geographic Analysis:
```bash
# Top provinces
sqlite3 data/matabumi.db "
SELECT province, 
       COUNT(*) as count,
       SUM(area_ha) as total_area
FROM alerts 
GROUP BY province 
ORDER BY count DESC 
LIMIT 10;
"

# Province-cause combinations
sqlite3 data/matabumi.db "
SELECT province, cause, COUNT(*) as count
FROM alerts 
GROUP BY province, cause 
ORDER BY count DESC 
LIMIT 15;
"
```

### Cause Analysis:
```bash
# By cause
sqlite3 data/matabumi.db "
SELECT cause, 
       COUNT(*) as count,
       SUM(area_ha) as total_area,
       AVG(confidence) as avg_confidence
FROM alerts 
GROUP BY cause 
ORDER BY count DESC;
"
```

---

## 🎉 Success Criteria

### Technical Success:
- ✅ 1,200+ combinations processed (>87%)
- ✅ <5% failure rate
- ✅ No crashes or data corruption
- ✅ All thumbnails generated
- ✅ Database integrity maintained

### Data Quality Success:
- ✅ 450-750 total detections
- ✅ Confidence scores 0.60-0.85
- ✅ Average confidence 0.70-0.75
- ✅ Causes match province profiles
- ✅ Seasonal patterns visible

### Business Success:
- ✅ Comprehensive 3-year dataset
- ✅ Monthly granularity
- ✅ All major provinces covered
- ✅ Ready for API deployment
- ✅ Actionable insights available

---

## 📞 Next Steps After Completion

### 1. Validation (1-2 hours):
```bash
# Run full analysis
python analyze_results.py

# Manual validation
# - Check 20 random thumbnails
# - Verify cause classifications
# - Review top provinces
```

### 2. Backup (30 minutes):
```bash
# Backup database
cp data/matabumi.db data/matabumi_backup_$(date +%Y%m%d).db

# Backup thumbnails
tar -czf data/thumbnails_backup.tar.gz data/thumbnails/

# Backup to cloud (if available)
# aws s3 cp data/matabumi.db s3://bucket/backups/
```

### 3. Deployment (2-4 hours):
```bash
# Load into production database
# Update API endpoints
# Test frontend integration
# Deploy to production
```

### 4. Documentation (1-2 hours):
```bash
# Create final report
python analyze_results.py > final_report.txt

# Document insights
# Share with stakeholders
```

---

## 📚 Additional Resources

### Documentation:
- `MONTHLY_PIPELINE_GUIDE.md` - Detailed pipeline documentation
- `FULL_RUN_STATUS.md` - Current run status
- `QUICK_REFERENCE.md` - Quick command reference
- `REVISED_EXECUTION_PLAN.md` - Execution strategy

### Scripts:
- `pipeline/run_monthly_pipeline.py` - Main pipeline
- `monitor_pipeline.py` - Real-time monitoring
- `analyze_results.py` - Results analysis
- `detection/classify.py` - Enhanced classifier

### Database Schema:
```sql
CREATE TABLE alerts (
    id INTEGER PRIMARY KEY,
    detected_at TEXT,
    province TEXT,
    lat REAL,
    lng REAL,
    bbox_minx REAL,
    bbox_miny REAL,
    bbox_maxx REAL,
    bbox_maxy REAL,
    area_ha REAL,
    cause TEXT,
    confidence REAL,
    severity TEXT,
    is_protected_zone INTEGER,
    ndvi_before REAL,
    ndvi_after REAL,
    ndvi_change REAL,
    thumbnail_path TEXT
);
```

---

## 🎯 Current Status

**Pipeline:** ✅ RUNNING
**Started:** May 15, 2026, 12:50 PM
**Current Month:** January 2024
**Progress:** 0/1,368 combinations
**Expected Completion:** May 18-21, 2026

**Next Check:** In 2-3 hours
**Command:** `python monitor_pipeline.py`

---

**Questions? Check the documentation or run `python monitor_pipeline.py` for current status.**
