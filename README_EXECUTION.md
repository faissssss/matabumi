# MataBumi Pipeline Execution Guide
**Current Status:** Test Run In Progress + Classifier Enhanced ✅

## 🎯 What's Happening Right Now

### 1. Test Pipeline Running (Background Process)
```bash
# Currently executing:
python pipeline/run_multi_year.py --test

# Processing:
- 3 provinces: Aceh, Riau, Kalimantan Timur
- 2 years: 2023, 2024
- 6 total combinations
- Time: ~15-20 minutes
```

### 2. Classifier Enhanced (Complete)
The rule-based classifier has been improved with:
- ✅ New edge density metric
- ✅ Enhanced scoring system (15-point scale)
- ✅ Better confidence calculation
- ✅ More sophisticated decision rules

## 📊 Monitor Test Progress

### Quick Check:
```bash
python monitor_test.py
```

### Detailed Check:
```bash
# View live logs (if available)
tail -f logs/pipeline.log

# Or check process output
# (Process ID: 7)
```

### Expected Output Files:
```
data/
├── detections_2023.json  ← Test results for 2023
├── detections_2024.json  ← Test results for 2024
└── thumbnails/           ← Before/after/change images
    ├── Aceh_2023_*_before.png
    ├── Aceh_2023_*_after.png
    ├── Aceh_2023_*_change.png
    └── ... (similar for Riau, Kalimantan Timur)
```

## 🔍 What to Do When Test Completes

### Step 1: Check Results (5 minutes)
```bash
# Run monitoring script
python monitor_test.py

# View detection counts
python -c "import json; data = json.load(open('data/detections_2023.json')); print(f'2023: {len(data)} detections')"
python -c "import json; data = json.load(open('data/detections_2024.json')); print(f'2024: {len(data)} detections')"

# Check thumbnails
ls -lh data/thumbnails/
```

### Step 2: Validate Quality (10 minutes)

**Check Detection Counts:**
- Should have detections in at least 2/3 provinces
- Counts should be reasonable (not 0, not thousands)

**Review Classifications:**
```python
import json

# Load 2023 data
with open('data/detections_2023.json') as f:
    data = json.load(f)

# Count by cause
causes = {}
for det in data:
    cause = det['cause']
    causes[cause] = causes.get(cause, 0) + 1

print("Cause distribution:")
for cause, count in causes.items():
    print(f"  {cause}: {count}")
```

**Expected Cause Distribution:**
- Riau: Mostly "plantation" (palm oil region)
- Kalimantan Timur: Mix of "mining" and "logging"
- Aceh: Mix of "logging" and "plantation"

**Check Confidence Scores:**
- All should be between 0.60 and 0.85
- Average should be around 0.70-0.75

**Inspect Thumbnails:**
- Open a few thumbnail images
- Verify before/after shows clear change
- Change map should highlight deforested areas

### Step 3: Decision Point

**✅ If Test Successful:**
- Detections found in 2+ provinces
- Causes match province profiles
- Confidence scores in range
- Thumbnails show clear changes
- No errors or crashes

→ **Proceed to Full Production Run**

**❌ If Issues Found:**
- Debug specific problems
- Adjust parameters if needed
- Re-run test
- Don't proceed to full run until test passes

## 🚀 Full Production Run

### When Ready:
```bash
# Full 34-province run (6-8 hours)
python pipeline/run_multi_year.py

# Or staged approach:
# Stage 1: High-priority provinces
python pipeline/run_multi_year.py --provinces "Riau,Kalimantan Tengah,Kalimantan Timur,Papua,Aceh,Sumatera Selatan,Jambi,Kalimantan Barat,Kalimantan Selatan,Papua Barat"

# Stage 2: Remaining provinces
python pipeline/run_multi_year.py --provinces "..." # (remaining 24)
```

### Monitor Full Run:
```bash
# Check progress every hour
python monitor_test.py

# Or watch logs
tail -f logs/pipeline.log
```

### Expected Timeline:
- **Start:** When you run the command
- **Duration:** 6-8 hours
- **Output:** 68 combinations (34 provinces × 2 years)
- **Data:** ~100-500 detections (estimated)

## 📈 Classifier Improvements Summary

### New Metrics:
1. **Edge Density** - Boundary complexity
   - Formula: `perimeter / area`
   - Logging: >0.4 (complex)
   - Plantation: <0.3 (smooth)

### Enhanced Scoring:

| Cause | Key Indicators | Max Score |
|-------|---------------|-----------|
| Mining | Compact + Regular + High Intensity | 10.5 |
| Plantation | Very Compact + Elongated + Smooth | 13.5 |
| Logging | Fragmented + Irregular + Complex | 14.0 |
| Fire | Large Area + Few Patches + High Intensity | 13.5 |

### Confidence Calculation:
```python
# Base confidence from score
base = 0.60 + (max_score / 15.0) * 0.15  # 0.60-0.78

# Bonus for clear winner
if score_margin > 2.0:
    base += 0.05

# Geographic boost
if cause matches province profile:
    base += 0.08 to 0.10

# Final: 0.60-0.85
```

## 🎬 Complete Workflow

### Phase 1: Test (Current) ✅
- [x] Start test pipeline
- [x] Enhance classifier
- [ ] Wait for test completion (~15-20 min)
- [ ] Validate results

### Phase 2: Production (Next)
- [ ] Start full 34-province run
- [ ] Monitor progress (check hourly)
- [ ] Validate final dataset
- [ ] Deploy to API

### Phase 3: Deployment (Future)
- [ ] Load data into database
- [ ] Update API endpoints
- [ ] Test frontend integration
- [ ] Launch to users

## 📝 Key Files

### Pipeline:
- `pipeline/run_multi_year.py` - Main pipeline script
- `detection/classify.py` - Enhanced classifier
- `detection/fetch_imagery.py` - Sentinel-2 data fetching
- `detection/ndvi.py` - NDVI calculation
- `detection/change.py` - Change detection

### Monitoring:
- `monitor_test.py` - Test progress checker
- `PIPELINE_STATUS.md` - Current status
- `EXECUTION_SUMMARY.md` - Detailed summary

### Output:
- `data/detections_2023.json` - 2023 results
- `data/detections_2024.json` - 2024 results
- `data/thumbnails/` - Visualization images

## 🔧 Troubleshooting

### Test Taking Too Long (>30 minutes):
```bash
# Check if process is still running
ps aux | grep python

# Check for errors in output
# (View process output in terminal)
```

### No Detections Found:
- Check cloud cover in imagery
- Verify NDVI threshold (currently 0.15)
- Review time periods (March → September)
- Check province boundaries

### Classification Seems Wrong:
- Review shape metrics in logs
- Check geographic heuristics
- Adjust scoring weights if needed
- Validate with thumbnail images

### Process Crashed:
```bash
# Check error logs
cat logs/pipeline.log

# Common issues:
# - Memory: Reduce batch size
# - Network: Check Planetary Computer connection
# - Disk: Ensure enough space for thumbnails
```

## 📞 Next Steps

1. **Wait for test to complete** (~10-15 more minutes)
2. **Run monitoring script:** `python monitor_test.py`
3. **Validate results** (see Step 2 above)
4. **Start full run** if test successful
5. **Monitor full run** (check every 1-2 hours)

## 🎉 Success Criteria

### Test Success:
- ✅ Detections in 2+ provinces
- ✅ Reasonable cause distribution
- ✅ Confidence scores 0.60-0.85
- ✅ Clear thumbnail images
- ✅ No errors

### Production Success:
- ✅ All 34 provinces processed
- ✅ 2023 + 2024 data complete
- ✅ 100-500 total detections
- ✅ Causes match province profiles
- ✅ Ready for API deployment

---

**Current Time:** May 15, 2026, 12:45 PM
**Test Started:** ~12:30 PM
**Expected Test Completion:** ~12:50 PM
**Next Check:** Run `python monitor_test.py` in 5-10 minutes
