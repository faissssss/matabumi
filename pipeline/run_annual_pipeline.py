#!/usr/bin/env python3
"""
Annual Deforestation Detection Pipeline for MataBumi.
Compares start of year to end of year for comprehensive annual analysis.

2025: January → December
2026: January → May (current)

Usage:
    python pipeline/run_annual_pipeline.py              # Full run (all provinces, 2025-2026)
    python pipeline/run_annual_pipeline.py --test       # Test run (3 provinces)
"""

import os
import sys
import logging
import argparse
from datetime import datetime
from typing import List, Tuple
from calendar import monthrange
from concurrent.futures import ThreadPoolExecutor, as_completed

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from detection.fetch_imagery import get_catalog, fetch_imagery, PROVINCE_BBOXES
from detection.ndvi import calculate_ndvi, detect_change, estimate_area, save_hero_image
from detection.classify import classify_cause
from detection.severity import calculate_severity
from detection.thumbnails import extract_thumbnail
from database.db import insert_alert

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
MINIMUM_ALERT_AREA = float(os.getenv("MINIMUM_ALERT_AREA", "10"))
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.5"))

# All 38 Indonesian provinces
ALL_PROVINCES = list(PROVINCE_BBOXES.keys())

# Test subset
TEST_PROVINCES = ["Aceh", "Riau", "Kalimantan Timur"]

# Annual comparisons
ANNUAL_COMPARISONS = [
    {
        "year": 2025,
        "before_start": "2025-01-01",
        "before_end": "2025-01-31",
        "after_start": "2025-12-01",
        "after_end": "2025-12-31",
        "label": "2025 (Jan → Dec)"
    },
    {
        "year": 2026,
        "before_start": "2026-01-01",
        "before_end": "2026-01-31",
        "after_start": "2026-05-01",
        "after_end": "2026-05-31",
        "label": "2026 (Jan → May)"
    }
]


def pinpoint_deforestation_month(
    catalog,
    bbox: List[float],
    year: int,
    start_date: str,
    end_date: str,
    reference_change_map,
    reference_mask
) -> int:
    """
    Pinpoint which month the deforestation occurred using binary search.
    
    Args:
        catalog: STAC catalog
        bbox: Bounding box
        year: Year being analyzed
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
        reference_change_map: The detected change map
        reference_mask: The detected deforestation mask
    
    Returns:
        Month number (1-12) when deforestation was detected
    """
    import numpy as np
    from datetime import datetime
    from calendar import monthrange
    
    # Parse dates
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")
    
    # Get month range
    start_month = start.month
    end_month = end.month
    
    # If same month, return it
    if start_month == end_month:
        return start_month
    
    # Binary search through months to find when change occurred
    logger.info(f"    Searching months {start_month} to {end_month}...")
    
    # Get baseline (start month)
    baseline_month = start_month
    baseline_range = f"{year}-{baseline_month:02d}-01/{year}-{baseline_month:02d}-{monthrange(year, baseline_month)[1]}"
    
    try:
        nir_baseline, red_baseline = fetch_imagery(catalog, bbox, baseline_range)
        if nir_baseline is None:
            # Fallback to mid-year if can't fetch
            return (start_month + end_month) // 2
        
        ndvi_baseline = calculate_ndvi(nir_baseline, red_baseline)
    except:
        # Fallback to mid-year
        return (start_month + end_month) // 2
    
    # Binary search
    left = start_month
    right = end_month
    detected_month = end_month  # Default to end month
    
    while left <= right:
        mid = (left + right) // 2
        mid_range = f"{year}-{mid:02d}-01/{year}-{mid:02d}-{monthrange(year, mid)[1]}"
        
        try:
            nir_mid, red_mid = fetch_imagery(catalog, bbox, mid_range)
            if nir_mid is None:
                # Skip this month, try next
                left = mid + 1
                continue
            
            ndvi_mid = calculate_ndvi(nir_mid, red_mid)
            
            # Check if change is visible at this month
            change_mid, mask_mid = detect_change(ndvi_baseline, ndvi_mid)
            area_mid = estimate_area(mask_mid, resolution_m=60)
            
            # If significant change detected, deforestation happened by this month
            if area_mid >= MINIMUM_ALERT_AREA * 0.5:  # 50% threshold
                detected_month = mid
                right = mid - 1  # Search earlier months
            else:
                left = mid + 1  # Search later months
                
        except Exception as e:
            logger.warning(f"    Could not check month {mid}: {e}")
            left = mid + 1
            continue
    
    logger.info(f"    ✓ Detected in month: {detected_month}")
    return detected_month


def process_province_annual(
    province: str,
    catalog,
    year: int,
    before_start: str,
    before_end: str,
    after_start: str,
    after_end: str,
    label: str
) -> dict:
    """
    Process a single province for annual comparison.
    
    Args:
        province: Province name
        catalog: STAC catalog client
        year: Year being processed
        before_start: Before period start date
        before_end: Before period end date
        after_start: After period start date
        after_end: After period end date
        label: Human-readable label
    
    Returns:
        Dictionary with processing results
    """
    result = {
        "province": province,
        "year": year,
        "success": False,
        "area_ha": 0,
        "severity": None,
        "error": None
    }
    
    try:
        logger.info(f"🌲 Processing {province} ({label})...")
        
        # Get bounding box
        bbox = PROVINCE_BBOXES[province]
        
        # Fetch before imagery
        before_range = f"{before_start}/{before_end}"
        logger.info(f"  Fetching before imagery ({before_range})...")
        nir_before, red_before = fetch_imagery(catalog, bbox, before_range)
        
        if nir_before is None or red_before is None:
            logger.warning(f"  ⚠️  No before imagery found for {province} ({label})")
            result["error"] = "No before imagery"
            return result
        
        # Fetch after imagery
        after_range = f"{after_start}/{after_end}"
        logger.info(f"  Fetching after imagery ({after_range})...")
        nir_after, red_after = fetch_imagery(catalog, bbox, after_range)
        
        if nir_after is None or red_after is None:
            logger.warning(f"  ⚠️  No after imagery found for {province} ({label})")
            result["error"] = "No after imagery"
            return result
        
        # Calculate NDVI for both periods
        logger.info(f"  Calculating NDVI...")
        ndvi_before = calculate_ndvi(nir_before, red_before)
        ndvi_after = calculate_ndvi(nir_after, red_after)
        
        # Detect change
        logger.info(f"  Detecting change...")
        change_map, deforestation_mask = detect_change(ndvi_before, ndvi_after)
        
        # Estimate area
        area_ha = estimate_area(deforestation_mask, resolution_m=60)
        result["area_ha"] = area_ha
        
        # Check minimum area threshold
        if area_ha < MINIMUM_ALERT_AREA:
            logger.info(f"  ✓ {province} ({label}): {area_ha:.1f} ha (below {MINIMUM_ALERT_AREA} ha threshold)")
            result["success"] = True
            result["below_threshold"] = True
            return result
        
        # Extract center crop patch for classification
        h, w = change_map.shape
        center_y, center_x = h // 2, w // 2
        crop_size = 250
        y_start = max(0, center_y - crop_size)
        y_end = min(h, center_y + crop_size)
        x_start = max(0, center_x - crop_size)
        x_end = min(w, center_x + crop_size)
        
        change_patch = change_map[y_start:y_end, x_start:x_end]
        
        # Classify cause
        logger.info(f"  Classifying cause...")
        cause, confidence = classify_cause(change_patch, province, bbox)
        
        # Check confidence threshold
        if confidence < CONFIDENCE_THRESHOLD:
            logger.info(f"  ✓ {province} ({label}): {area_ha:.1f} ha, confidence {confidence:.2f} below threshold")
            result["success"] = True
            result["low_confidence"] = True
            return result
        
        # Calculate severity
        logger.info(f"  Calculating severity...")
        severity, is_protected = calculate_severity(area_ha, cause, province)
        result["severity"] = severity
        
        # Pinpoint the month when deforestation occurred
        logger.info(f"  Pinpointing detection month...")
        detected_month = pinpoint_deforestation_month(
            catalog, bbox, year, 
            before_start, after_end,
            change_map, deforestation_mask
        )
        
        # Use detected month for date
        detected_date = f"{year}-{detected_month:02d}-15"
        logger.info(f"  📅 Deforestation detected in: {year}-{detected_month:02d}")
        
        # Extract thumbnail
        logger.info(f"  Extracting thumbnail...")
        
        thumbnail_path = extract_thumbnail(
            nir_after, red_after, red_after,
            deforestation_mask,
            province, detected_date, 0
        )
        
        # Calculate centroid coordinates
        lat = (bbox[1] + bbox[3]) / 2
        lng = (bbox[0] + bbox[2]) / 2
        
        # Calculate mean NDVI values
        ndvi_before_mean = float(ndvi_before[deforestation_mask].mean()) if deforestation_mask.any() else 0.0
        ndvi_after_mean = float(ndvi_after[deforestation_mask].mean()) if deforestation_mask.any() else 0.0
        ndvi_change_mean = float(change_map[deforestation_mask].mean()) if deforestation_mask.any() else 0.0
        
        # Create alert record
        alert = {
            "detected_at": detected_date,
            "province": province,
            "lat": lat,
            "lng": lng,
            "bbox_minx": bbox[0],
            "bbox_miny": bbox[1],
            "bbox_maxx": bbox[2],
            "bbox_maxy": bbox[3],
            "area_ha": area_ha,
            "cause": cause,
            "confidence": confidence,
            "severity": severity,
            "is_protected_zone": 1 if is_protected else 0,
            "ndvi_before": ndvi_before_mean,
            "ndvi_after": ndvi_after_mean,
            "ndvi_change": ndvi_change_mean,
            "thumbnail_path": thumbnail_path
        }
        
        # Insert to database
        logger.info(f"  Inserting alert to database...")
        alert_id = insert_alert(alert)
        
        if alert_id:
            logger.info(f"  🔴 {province} ({label}): {area_ha:.1f} ha, {cause} ({confidence:.0%}), severity={severity}")
            result["success"] = True
            result["alert_id"] = alert_id
        else:
            logger.error(f"  ❌ Failed to insert alert for {province} ({label})")
            result["error"] = "Database insertion failed"
            return result
        
        # Generate hero image (only for significant events)
        if area_ha > 100:
            logger.info(f"  Generating hero image...")
            hero_path = save_hero_image(ndvi_before, ndvi_after, change_map, f"{province}_{year}")
            logger.info(f"  💾 Saved hero image: {hero_path}")
            result["hero_path"] = hero_path
        
        result["success"] = True
        
    except Exception as e:
        logger.error(f"  ❌ Error processing {province} ({label}): {e}")
        result["error"] = str(e)
    
    return result


def run_annual_pipeline(provinces: List[str] = None, test_mode: bool = False) -> None:
    """
    Execute detection pipeline with annual comparisons.
    
    Args:
        provinces: List of province names (default: all)
        test_mode: If True, use test configuration
    """
    start_time = datetime.now()
    
    # Configure based on mode
    if test_mode:
        provinces = TEST_PROVINCES
        logger.info("🧪 Running in TEST mode (3 provinces)")
    else:
        provinces = provinces or ALL_PROVINCES
    
    total_combinations = len(provinces) * len(ANNUAL_COMPARISONS)
    
    logger.info(f"🚀 Starting Annual MataBumi Pipeline")
    logger.info(f"📊 Configuration:")
    logger.info(f"   - Provinces: {len(provinces)}")
    logger.info(f"   - Comparisons: {len(ANNUAL_COMPARISONS)}")
    logger.info(f"     • 2025: January → December")
    logger.info(f"     • 2026: January → May")
    logger.info(f"   - Total combinations: {total_combinations}")
    logger.info("")
    
    # Get catalog
    logger.info(f"🛰️  Connecting to Microsoft Planetary Computer...")
    catalog = get_catalog()
    
    # Process all combinations
    results = []
    success_count = 0
    failure_count = 0
    below_threshold_count = 0
    low_confidence_count = 0
    
    # Process each year sequentially, provinces in parallel
    for comparison in ANNUAL_COMPARISONS:
        year = comparison["year"]
        before_start = comparison["before_start"]
        before_end = comparison["before_end"]
        after_start = comparison["after_start"]
        after_end = comparison["after_end"]
        label = comparison["label"]
        
        logger.info(f"\n{'='*60}")
        logger.info(f"📅 Processing {label}")
        logger.info(f"   Before: {before_start} to {before_end}")
        logger.info(f"   After: {after_start} to {after_end}")
        logger.info(f"{'='*60}\n")
        
        with ThreadPoolExecutor(max_workers=4) as executor:
            # Submit all provinces for this year
            future_to_province = {
                executor.submit(
                    process_province_annual,
                    province, catalog, year,
                    before_start, before_end, after_start, after_end, label
                ): province
                for province in provinces
            }
            
            # Collect results as they complete
            for future in as_completed(future_to_province):
                province = future_to_province[future]
                try:
                    result = future.result()
                    results.append(result)
                    
                    if result["success"]:
                        if result.get("below_threshold"):
                            below_threshold_count += 1
                        elif result.get("low_confidence"):
                            low_confidence_count += 1
                        else:
                            success_count += 1
                    else:
                        failure_count += 1
                        
                except Exception as e:
                    logger.error(f"Exception processing {province} ({label}): {e}")
                    failure_count += 1
    
    # Calculate duration
    duration = datetime.now() - start_time
    
    # Log summary
    logger.info(f"\n{'='*60}")
    logger.info(f"✅ Annual Pipeline Complete!")
    logger.info(f"📊 Summary:")
    logger.info(f"   - Total combinations processed: {total_combinations}")
    logger.info(f"   - Alerts created: {success_count}")
    logger.info(f"   - Below threshold: {below_threshold_count}")
    logger.info(f"   - Low confidence: {low_confidence_count}")
    logger.info(f"   - Failures: {failure_count}")
    logger.info(f"   - Duration: {duration}")
    logger.info(f"   - Average per combination: {duration / total_combinations if total_combinations > 0 else 0}")
    logger.info(f"{'='*60}\n")
    
    # Save summary to file
    summary_file = f"data/pipeline_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    with open(summary_file, 'w') as f:
        f.write(f"Annual Pipeline Summary\n")
        f.write(f"{'='*60}\n")
        f.write(f"Completed: {datetime.now()}\n")
        f.write(f"Duration: {duration}\n\n")
        f.write(f"Configuration:\n")
        f.write(f"  Provinces: {len(provinces)}\n")
        f.write(f"  Comparisons: 2 (2025, 2026)\n")
        f.write(f"  Total combinations: {total_combinations}\n\n")
        f.write(f"Results:\n")
        f.write(f"  Alerts created: {success_count}\n")
        f.write(f"  Below threshold: {below_threshold_count}\n")
        f.write(f"  Low confidence: {low_confidence_count}\n")
        f.write(f"  Failures: {failure_count}\n")
    
    logger.info(f"📄 Summary saved to: {summary_file}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description='Run annual deforestation detection pipeline (2025-2026)'
    )
    parser.add_argument(
        '--provinces',
        nargs='+',
        help='List of provinces to process (default: all 38)'
    )
    parser.add_argument(
        '--test',
        action='store_true',
        help='Run in test mode (3 provinces only)'
    )
    
    args = parser.parse_args()
    
    run_annual_pipeline(
        provinces=args.provinces,
        test_mode=args.test
    )
