# Quick Reference: MataBumi Pipeline

## 🚀 Current Run

**Status:** ✅ RUNNING
**Command:** `python pipeline/run_monthly_pipeline.py --years 2024 2025 2026`

**Scope:**
- 38 provinces (ALL)
- 3 years (2024, 2025, 2026)
- 12 months per year
- **1,368 total combinations**

**Duration:** 3-6 days (72-144 hours)

## 📊 Quick Checks

### Count Detections:
```bash
sqlite3 data/matabumi.db "SELECT COUNT(*) FROM alerts;"
```

### View Recent:
```bash
sqlite3 data/matabumi.db "SELECT detected_at, province, area_ha, cause FROM alerts ORDER BY detected_at DESC LIMIT 10;"
```

### By Month:
```bash
sqlite3 data/matabumi.db "SELECT strftime('%Y-%m', detected_at) as month, COUNT(*) FROM alerts GROUP BY month ORDER BY month;"
```

### By Province:
```bash
sqlite3 data/matabumi.db "SELECT province, COUNT(*) FROM alerts GROUP BY province ORDER BY COUNT(*) DESC;"
```

### By Cause:
```bash
sqlite3 data/matabumi.db "SELECT cause, COUNT(*) FROM alerts GROUP BY cause;"
```

### Check Thumbnails:
```bash
ls data/thumbnails/ | wc -l
```

## 📈 Expected Results

- **Total Detections:** 450-750 events
- **Per Year:** 150-250 events
- **Per Month:** 10-25 events
- **Thumbnails:** 450-750 images

## ⏱️ Timeline

| Milestone | Time | Status |
|-----------|------|--------|
| January 2024 | 2-4 hours | 🔄 In Progress |
| Full 2024 | 24-48 hours | ⏳ Pending |
| 2024 + 2025 | 48-96 hours | ⏳ Pending |
| Complete | 72-144 hours | ⏳ Pending |

## 🔍 Monitoring Schedule

- **First 24h:** Check every 2-3 hours
- **Days 2-3:** Check twice daily
- **Days 4-6:** Check once daily

## 📁 Output Files

```
data/
├── matabumi.db          # Main database
├── thumbnails/          # Visualization images
├── hero_images/         # Large events
└── pipeline_summary_*.txt
```

## 🎯 Success Criteria

- ✅ 1,368 combinations processed
- ✅ 450-750 detections
- ✅ Confidence 0.60-0.85
- ✅ No crashes
- ✅ Completes in 6 days

## 📞 Key Commands

### Stop Pipeline:
```bash
# Find process
ps aux | grep run_monthly_pipeline

# Kill process
kill <PID>
```

### Check Disk Space:
```bash
df -h data/
du -sh data/thumbnails/
```

### View Logs:
```bash
# If logging to file
tail -f logs/pipeline.log
```

## 🚨 Troubleshooting

### No New Data:
- Check if process is still running
- Look for error messages
- Verify internet connection

### Slow Processing:
- Normal for large provinces
- High cloud cover causes retries
- Check system resources

### Disk Full:
- Need 15+ GB free space
- Clean old thumbnails if needed
- Monitor with `df -h`

## 📊 Current Progress

**Started:** May 15, 2026, 12:50 PM
**Current:** January 2024
**Processed:** 0/1,368
**Expected Done:** May 18-21, 2026

---

**Next Check:** In 2-3 hours
**Command:** `sqlite3 data/matabumi.db "SELECT COUNT(*) FROM alerts;"`
