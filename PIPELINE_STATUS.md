# MataBumi Pipeline Status Report
**Date:** May 15, 2026
**Status:** Test Run In Progress + Classifier Enhanced

## Current Activities

### 1. Test Pipeline Running ✅
- **Command:** `python pipeline/run_multi_year.py --test`
- **Configuration:**
  - Provinces: 3 (Aceh, Riau, Kalimantan Timur)
  - Years: 2 (2023, 2024)
  - Total combinations: 6
  - Time periods: March → September (historical data)
- **Status:** Processing in progress
- **Expected Duration:** 15-20 minutes
- **Purpose:** Validate pipeline before full 34-province run

### 2. Classifier Enhanced ✅
Enhanced the rule-based classifier with improved metrics and decision logic:

#### New Features Added:
1. **Edge Density Metric** - Measures boundary complexity
   - High edge density → Logging (complex boundaries)
   - Low edge density → Plantation/Mining (smooth boundaries)

2. **Enhanced Scoring System**
   - More granular scoring (0-15 point scale)
   - Additional metrics: patch size variance, max patch size
   - Score margin analysis for confidence boost

3. **Improved Confidence Calculation**
   - Base confidence: 0.60-0.78 (based on score strength)
   - +0.05 bonus for clear winner (score margin > 2.0)
   - Geographic heuristics: +0.08 to +0.10
   - Final range: 0.60-0.85

#### Enhanced Decision Rules:

**Mining Indicators (Compact, Regular, High Intensity):**
- Very high intensity (>0.4): +3.5 points
- Compact clearing (<2.0): +2.5 points
- Regular shape (>0.8 convexity): +2.0 points
- Very low fragmentation (<0.05): +1.5 points
- Few patches (≤2): +1.0 point

**Plantation Indicators (Very Compact, Regular, Elongated):**
- Very compact (<1.5): +3.5 points
- Low fragmentation (<0.08): +3.0 points
- Highly elongated (>2.5): +2.5 points
- Very regular (>0.85 convexity): +2.0 points
- Smooth edges (<0.3 edge density): +1.5 points
- Moderate-high intensity (0.3-0.5): +1.0 point

**Logging Indicators (Fragmented, Irregular, Moderate Intensity):**
- High fragmentation (>0.15): +3.5 points
- Irregular shape (>2.5 compactness): +3.0 points
- Many patches (>5): +2.5 points
- Moderate intensity (<0.35): +2.0 points
- Variable patch sizes (variance >100): +1.5 points
- Complex edges (>0.4 edge density): +1.5 points

**Fire Indicators (Large Area, Few Patches, High Intensity):**
- Large area (>1000 pixels): +3.5 points
- Few large patches (<3): +3.0 points
- High intensity (>0.35): +2.5 points
- Relatively compact (<2.0): +2.0 points
- Very large patch (>500 pixels): +1.5 points
- Relatively regular (>0.7 convexity): +1.0 point

## Next Steps

### After Test Completes:
1. **Review Test Results**
   - Check detection counts per province
   - Verify cause classifications
   - Validate confidence scores
   - Review thumbnails

2. **Decision Point:**
   - ✅ If test successful → Proceed to full 34-province run
   - ❌ If issues found → Debug and re-test

### Full Production Run:
- **Command:** `python pipeline/run_multi_year.py`
- **Scope:** 34 provinces × 2 years = 68 combinations
- **Duration:** ~6-8 hours
- **Output:** Complete 2023-2024 deforestation dataset

## Files Modified

### Enhanced Files:
1. `detection/classify.py` - Improved classifier with edge density metric
2. `pipeline/run_multi_year.py` - Multi-year pipeline with test mode

### Key Improvements:
- Better shape analysis (6 metrics vs 5)
- More sophisticated scoring (15-point scale)
- Confidence margin analysis
- Enhanced geographic heuristics

## Monitoring

To check test progress:
```bash
# View recent output
python -c "import subprocess; subprocess.run(['tail', '-f', 'logs/pipeline.log'])"
```

To check running processes:
```bash
ps aux | grep python
```

## Expected Test Output

After completion, expect:
- `data/detections_2023.json` - 2023 detections (3 provinces)
- `data/detections_2024.json` - 2024 detections (3 provinces)
- `data/thumbnails/` - Thumbnail images
- Console summary with detection counts

## Performance Metrics

Target accuracy (based on requirements):
- Overall detection: >85%
- Cause classification: >70%
- Confidence scores: 0.60-0.85 range
- False positive rate: <15%
