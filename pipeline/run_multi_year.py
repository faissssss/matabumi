"""
Multi-Year Pipeline: 5-Year Historical Deforestation Analysis

This script runs the detection pipeline across 5 years (2020-2024) to build
a comprehensive historical database of deforestation events.
"""

import os
import sys
import logging
from datetime import datetime
from typing import List, Tuple

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from detection.fetch_imagery import get_catalog, fetch_imagery, PROVINCE_BBOXES
from detection.ndvi import calculate_ndvi, detect_change, estimate_area, save_hero_image
from detection.classify import classify_cause
from detection.severity import calculate_severity
from detection.thumbnails import extract_thumbnail
from database.db import insert_alert
from concurrent.futures import ThreadPoolExecutor, as_completed

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
MINIMUM_ALERT_AREA = float(os.getenv("MINIMUM_ALERT_AREA", "10"))
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.5"))


def get_multi_year_date_ranges() -> List[Tuple[str, str, int]]:
    """
    Generate date ranges for 5-year historical analysis (2020-2024).
    
    Returns:
        List of (before_range, after_range, year) tuples
    """
    from datetime import datetime as dt
    
    date_ranges = []
    
    # Generate annual comparisons for past 5 years
    for year in range(2020, 2025):  # 2020, 2021, 2022, 2023, 2024
        # Before: March (wet season - more vegetation)
        before_start = dt(year, 3, 1)
        before_end = dt(year, 3, 31)
        
        # After: September (dry season - deforestation visible)
        after_start = dt(year, 9, 1)
        after_end = dt(year, 9, 30)
        
        before_range = f"{before_start.strftime('%Y-%m-%d')}/{before_end.strftime('%Y-%m-%d')}"
        after_range = f"{after_start.strftime('%Y-%m-%d')}/{after_end.strftime('%Y-%m-%d')}"
        
        date_ranges.append((before_range, after_range, year))
    
    return date_ranges


def process_province_year(province: str, catalog, before_range: str, after_range: str, year: int) -> dict:
    """
    Process a single province for a specific year.
    
    Args:
        province: Province name
        catalog: STAC catalog client
        before_range: Before period date range
        after_range: After period date range
        year: Year being processed
    
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
        logger.info(f"🌲 Processing {province} ({year})...")
        
        # Get bounding box
        bbox = PROVINCE_BBOXES[province]
        
        # Fetch before imagery
        logger.info(f"  Fetching before imagery ({before_range})...")
        nir_before, red_before = fetch_imagery(catalog, bbox, before_range)
        
        if nir_before is None or red_before is None:
            logger.warning(f"  ⚠️  No before imagery found for {province} ({year})")
            result["error"] = "No before imagery"
            return result
        
        # Fetch after imagery
        logger.info(f"  Fetching after imagery ({after_range})...")
        nir_after, red_after = fetch_imagery(catalog, bbox, after_range)
        
        if nir_after is None or red_after is None:
            logger.warning(f"  ⚠️  No after imagery found for {province} ({year})")
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
            logger.info(f"  ✓ {province} ({year}): {area_ha:.1f} ha (below {MINIMUM_ALERT_AREA} ha threshold)")
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
            logger.info(f"  ✓ {province} ({year}): {area_ha:.1f} ha, confidence {confidence:.2f} below threshold")
            result["success"] = True
            result["low_confidence"] = True
            return result
        
        # Calculate severity
        logger.info(f"  Calculating severity...")
        severity, is_protected = calculate_severity(area_ha, cause, province)
        result["severity"] = severity
        
        # Extract thumbnail
        logger.info(f"  Extracting thumbnail...")
        detected_date = f"{year}-09-15"  # Mid-September of the year
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
            logger.info(f"  🔴 {province} ({year}): {area_ha:.1f} ha, {cause} ({confidence:.0%}), severity={severity}")
            result["success"] = True
            result["alert_id"] = alert_id
        else:
            logger.error(f"  ❌ Failed to insert alert for {province} ({year})")
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
        logger.error(f"  ❌ Error processing {province} ({year}): {e}")
        result["error"] = str(e)
    
    return result


def run_multi_year_pipeline(provinces: List[str] = None, years: List[int] = None) -> None:
    """
    Execute detection pipeline across multiple years for all provinces.
    
    Args:
        provinces: Optional list of province names (default: all 38)
        years: Optional list of years (default: 2020-2024)
    """
    start_time = datetime.now()
    
    # Get province list
    if provinces is None:
        provinces = list(PROVINCE_BBOXES.keys())
    
    # Get date ranges
    all_date_ranges = get_multi_year_date_ranges()
    
    # Filter by years if specified
    if years:
        all_date_ranges = [(before, after, year) for before, after, year in all_date_ranges if year in years]
    
    total_combinations = len(provinces) * len(all_date_ranges)
    
    logger.info(f"🚀 Starting Multi-Year MataBumi Pipeline")
    logger.info(f"📊 Configuration:")
    logger.info(f"   - Provinces: {len(provinces)}")
    logger.info(f"   - Years: {[year for _, _, year in all_date_ranges]}")
    logger.info(f"   - Total combinations: {total_combinations}")
    logger.info("")
    
    # Get catalog
    logger.info(f"🛰️  Connecting to Microsoft Planetary Computer...")
    catalog = get_catalog()
    
    # Process all province-year combinations
    results = []
    success_count = 0
    failure_count = 0
    below_threshold_count = 0
    
    # Process each year sequentially, provinces in parallel
    for before_range, after_range, year in all_date_ranges:
        logger.info(f"\n{'='*60}")
        logger.info(f"📅 Processing Year {year}")
        logger.info(f"   Before: {before_range}")
        logger.info(f"   After: {after_range}")
        logger.info(f"{'='*60}\n")
        
        with ThreadPoolExecutor(max_workers=4) as executor:
            # Submit all provinces for this year
            future_to_province = {
                executor.submit(process_province_year, province, catalog, before_range, after_range, year): province
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
                        else:
                            success_count += 1
                    else:
                        failure_count += 1
                        
                except Exception as e:
                    logger.error(f"Exception processing {province} ({year}): {e}")
                    failure_count += 1
    
    # Calculate duration
    duration = datetime.now() - start_time
    
    # Log summary
    logger.info(f"\n{'='*60}")
    logger.info(f"✅ Multi-Year Pipeline Complete!")
    logger.info(f"📊 Summary:")
    logger.info(f"   - Total combinations processed: {total_combinations}")
    logger.info(f"   - Alerts created: {success_count}")
    logger.info(f"   - Below threshold: {below_threshold_count}")
    logger.info(f"   - Failures: {failure_count}")
    logger.info(f"   - Duration: {duration}")
    logger.info(f"   - Average per combination: {duration / total_combinations if total_combinations > 0 else 0}")
    logger.info(f"{'='*60}\n")
    
    # Upload thumbnails to Supabase Storage (if configured)
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    if supabase_url and supabase_key:
        logger.info(f"\n📤 Uploading thumbnails to Supabase Storage...")
        try:
            from pipeline.upload_thumbnails import upload_thumbnails
            upload_thumbnails()
        except Exception as e:
            logger.error(f"❌ Failed to upload thumbnails: {e}")
            logger.error(f"   Thumbnails are saved locally in outputs/thumbnails/")
    else:
        logger.info(f"\n⚠️  Supabase not configured, skipping thumbnail upload")
        logger.info(f"   Thumbnails are saved locally in outputs/thumbnails/")
        logger.info(f"   To enable cloud upload, set SUPABASE_URL and SUPABASE_SERVICE_KEY")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Run multi-year deforestation detection pipeline')
    parser.add_argument('--provinces', nargs='+', help='List of provinces to process (default: all)')
    parser.add_argument('--years', nargs='+', type=int, help='List of years to process (default: 2020-2024)')
    parser.add_argument('--test', action='store_true', help='Run on small subset for testing')
    
    args = parser.parse_args()
    
    if args.test:
        # Test with 3 provinces and 2 years
        test_provinces = ["Aceh", "Riau", "Kalimantan Timur"]
        test_years = [2023, 2024]
        logger.info("🧪 Running in TEST mode (3 provinces, 2 years)")
        run_multi_year_pipeline(provinces=test_provinces, years=test_years)
    else:
        run_multi_year_pipeline(provinces=args.provinces, years=args.years)
