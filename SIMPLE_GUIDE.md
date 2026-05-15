# Simple Guide: MataBumi Annual Pipeline

## ✅ What's Running

**Annual Deforestation Detection:**
- 2025: January → December
- 2026: January → May
- All 38 provinces
- **76 total comparisons**
- **4-8 hours duration**

## 📊 Quick Checks

### Count Detections:
```bash
sqlite3 data/matabumi.db "SELECT COUNT(*) FROM alerts;"
```

### View Recent:
```bash
sqlite3 data/matabumi.db "SELECT * FROM alerts ORDER BY detected_at DESC LIMIT 5;"
```

### By Year:
```bash
sqlite3 data/matabumi.db "SELECT strftime('%Y', detected_at) as year, COUNT(*) FROM alerts GROUP BY year;"
```

### Monitor Dashboard:
```bash
python monitor_pipeline.py
```

## ⏱️ Timeline

- **Now:** Processing 2025
- **+2-4 hours:** 2025 done
- **+4-6 hours:** Processing 2026
- **+6-8 hours:** Complete! ✅

**Expected Done:** Today, 8-9 PM

## 📈 Expected Output

- **Detections:** 30-60 events
- **2025:** 20-40 events
- **2026:** 10-20 events
- **Files:** Database + thumbnails

## 🎯 Success

When complete:
1. Check count: `sqlite3 data/matabumi.db "SELECT COUNT(*) FROM alerts;"`
2. Should have 30-60 detections
3. Both 2025 and 2026 represented
4. Thumbnails in `data/thumbnails/`

## 📞 Help

**Monitor:** `python monitor_pipeline.py`
**Analyze:** `python analyze_results.py`
**Docs:** See `FINAL_PLAN.md`

---

**Status:** ✅ Running smoothly!
**Check again in:** 1-2 hours
