#!/usr/bin/env python3
"""
Monthly Multi-Year Deforestation Detection Pipeline for MataBumi.
Processes 3 years (2023-2026) with monthly comparisons for comprehensive tracking.

Usage:
    python pipeline/run_monthly_pipeline.py              # Full run (all provinces, 3 years, all months)
    python pipeline/run_monthly_pipeline.py --test       # Test run (3 provinces, 1 year, 3 months)
    python pipeline/run_monthly_pipeline.py --year 2024  # Single year, all months
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

# All 34 Indonesian provinces
ALL_PROVINCES = list(PROVINCE_BBOXES.keys())

# Test subset (3 provinces for quick validation)
TEST_PROVINCES = ["Aceh", "Riau", "Kalimantan Timur"]

# Years to process (3 years: 2024-2026)
ALL_YEARS = [2024, 2025, 2026]
TEST_YEARS = [2024]  # Only 2024 for test

# Months to process
ALL_MONTHS = list(range(1, 13))  # 1-12 (all months)
TEST_MONTHS = [3, 6, 9]  # March, June, September for test

# Month names for logging
MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]


def get_month_date_range(year: int, month: int) -> Tuple[str, str]:
    """
    Get the date range for a specific month.
    
    Args:
        year: Year (e.g., 2023)
        month: Month (1-12)
    
    Returns:
        Tuple of (start_date, end_date) in YYYY-MM-DD format
    """
    # Get last day of month
    last_day = monthrange(year, month)[1]
    
    start_date = f"{year}-{month:02d}-01"
    end_date = f"{year}-{month:02d}-{last_day}"
    
    return start_date, end_date


def get_comparison_dates(year: int, month: int) -> Tuple[str, str, str, str]:
    """
    Get before/after date ranges for monthly comparison.
    Compares current month with previous month.
    
    Args:
        year: Year (e.g., 2023)
        month: Month (1-12)
    
    Returns:
        Tuple of (before_start, before_end, after_start, after_end)
    """
    # Current month (after)
    after_start, after_end = get_month_date_range(year, month)
    
    # Previous month (before)
    if month == 1:
        # January: compare with December of previous year
        before_year = year - 1
        before_month = 12
    else:
        before_year = year
        before_month = month - 1
    
    before_start, before_end = get_month_date_range(before_year, before_month)
    
    return before_start, before_end, after_start, after_end


def process_province_month(
    province: str,
    catalog,
    year: int,
    month: int,
    before_start: str,
    before_end: str,
    after_start: str,
    after_end: str
) -> dict:
    """
    Process a single province for a specific month.
    
    Args:
        province: Province name
        catalog: STAC catalog client
        year: Year being processed
        month: Month being processed (1-12)
        before_start: Before period start date
        before_end: Before period end date
        after_start: After period start date
        after_end: After period end date
    
    Returns:
        Dictionary with processing results
    """
    result = {
        "province": province,
        "year": year,
        "month": month,
        "success": False,
        "area_ha": 0,
        "severity": None,
        "error": None
    }
    
    try:
        month_name = MONTH_NAMES[month - 1]
        logger.info(f"🌲 Processing {province} ({month_name} {year})...")
        
        # Get bounding box
        bbox = PROVINCE_BBOXES[province]
        
        # Fetch before imagery
        before_range = f"{before_start}/{before_end}"
        logger.info(f"  Fetching before imagery ({before_range})...")
        nir_before, red_before = fetch_imagery(catalog, bbox, before_range)
        
        if nir_before is None or red_before is None:
            logger.warning(f"  ⚠️  No before imagery found for {province} ({month_name} {year})")
            result["error"] = "No before imagery"
            return result
        
        # Fetch after imagery
        after_range = f"{after_start}/{after_end}"
        logger.info(f"  Fetching after imagery ({after_range})...")
        nir_after, red_after = fetch_imagery(catalog, bbox, after_range)
        
        if nir_after is None or red_after is None:
            logger.warning(f"  ⚠️  No after imagery found for {province} ({month_name} {year})")
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
            logger.info(f"  ✓ {province} ({month_name} {year}): {area_ha:.1f} ha (below {MINIMUM_ALERT_AREA} ha threshold)")
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
            logger.info(f"  ✓ {province} ({month_name} {year}): {area_ha:.1f} ha, confidence {confidence:.2f} below threshold")
            result["success"] = True
            result["low_confidence"] = True
            return result
        
        # Calculate severity
        logger.info(f"  Calculating severity...")
        severity, is_protected = calculate_severity(area_ha, cause, province)
        result["severity"] = severity
        
        # Extract thumbnail
        logger.info(f"  Extracting thumbnail...")
        detected_date = f"{year}-{month:02d}-15"  # Mid-month
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
            logger.info(f"  🔴 {province} ({month_name} {year}): {area_ha:.1f} ha, {cause} ({confidence:.0%}), severity={severity}")
            result["success"] = True
            result["alert_id"] = alert_id
        else:
            logger.error(f"  ❌ Failed to insert alert for {province} ({month_name} {year})")
            result["error"] = "Database insertion failed"
            return result
        
        # Generate hero image (only for significant events)
        if area_ha > 100:
            logger.info(f"  Generating hero image...")
            hero_path = save_hero_image(ndvi_before, ndvi_after, change_map, f"{province}_{year}_{month:02d}")
            logger.info(f"  💾 Saved hero image: {hero_path}")
            result["hero_path"] = hero_path
        
        result["success"] = True
        
    except Exception as e:
        logger.error(f"  ❌ Error processing {province} ({MONTH_NAMES[month-1]} {year}): {e}")
        result["error"] = str(e)
    
    return result


def run_monthly_pipeline(
    provinces: List[str] = None,
    years: List[int] = None,
    months: List[int] = None,
    test_mode: bool = False
) -> None:
    """
    Execute detection pipeline with monthly comparisons across multiple years.
    
    Args:
        provinces: List of province names (default: all)
        years: List of years to process (default: 2023-2025)
        months: List of months to process (default: all 12)
        test_mode: If True, use test configuration
    """
    start_time = datetime.now()
    
    # Configure based on mode
    if test_mode:
        provinces = TEST_PROVINCES
        years = TEST_YEARS
        months = TEST_MONTHS
        logger.info("🧪 Running in TEST mode")
    else:
        provinces = provinces or ALL_PROVINCES
        years = years or ALL_YEARS
        months = months or ALL_MONTHS
    
    total_combinations = len(provinces) * len(years) * len(months)
    
    logger.info(f"🚀 Starting Monthly MataBumi Pipeline")
    logger.info(f"📊 Configuration:")
    logger.info(f"   - Provinces: {len(provinces)}")
    logger.info(f"   - Years: {years}")
    logger.info(f"   - Months: {len(months)} ({', '.join([MONTH_NAMES[m-1] for m in months])})")
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
    
    # Process each year and month sequentially, provinces in parallel
    for year in years:
        for month in months:
            month_name = MONTH_NAMES[month - 1]
            
            # Get comparison dates
            before_start, before_end, after_start, after_end = get_comparison_dates(year, month)
            
            logger.info(f"\n{'='*60}")
            logger.info(f"📅 Processing {month_name} {year}")
            logger.info(f"   Before: {before_start} to {before_end}")
            logger.info(f"   After: {after_start} to {after_end}")
            logger.info(f"{'='*60}\n")
            
            with ThreadPoolExecutor(max_workers=4) as executor:
                # Submit all provinces for this month
                future_to_province = {
                    executor.submit(
                        process_province_month,
                        province, catalog, year, month,
                        before_start, before_end, after_start, after_end
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
                        logger.error(f"Exception processing {province} ({month_name} {year}): {e}")
                        failure_count += 1
    
    # Calculate duration
    duration = datetime.now() - start_time
    
    # Log summary
    logger.info(f"\n{'='*60}")
    logger.info(f"✅ Monthly Pipeline Complete!")
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
        f.write(f"Monthly Pipeline Summary\n")
        f.write(f"{'='*60}\n")
        f.write(f"Completed: {datetime.now()}\n")
        f.write(f"Duration: {duration}\n\n")
        f.write(f"Configuration:\n")
        f.write(f"  Provinces: {len(provinces)}\n")
        f.write(f"  Years: {years}\n")
        f.write(f"  Months: {len(months)}\n")
        f.write(f"  Total combinations: {total_combinations}\n\n")
        f.write(f"Results:\n")
        f.write(f"  Alerts created: {success_count}\n")
        f.write(f"  Below threshold: {below_threshold_count}\n")
        f.write(f"  Low confidence: {low_confidence_count}\n")
        f.write(f"  Failures: {failure_count}\n")
    
    logger.info(f"📄 Summary saved to: {summary_file}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description='Run monthly deforestation detection pipeline across multiple years'
    )
    parser.add_argument(
        '--provinces',
        nargs='+',
        help='List of provinces to process (default: all 34)'
    )
    parser.add_argument(
        '--years',
        nargs='+',
        type=int,
        help='List of years to process (default: 2023-2025)'
    )
    parser.add_argument(
        '--months',
        nargs='+',
        type=int,
        help='List of months to process (1-12, default: all)'
    )
    parser.add_argument(
        '--year',
        type=int,
        help='Single year to process (shortcut for --years)'
    )
    parser.add_argument(
        '--test',
        action='store_true',
        help='Run in test mode (3 provinces, 1 year, 3 months)'
    )
    
    args = parser.parse_args()
    
    # Handle single year argument
    years = args.years
    if args.year:
        years = [args.year]
    
    run_monthly_pipeline(
        provinces=args.provinces,
        years=years,
        months=args.months,
        test_mode=args.test
    )
