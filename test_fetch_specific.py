"""
Debug script to test imagery fetching for specific provinces
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from detection.fetch_imagery import get_catalog, fetch_imagery
from datetime import datetime, timedelta
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_province_imagery(province_name, bbox):
    """Test imagery availability for a specific province."""
    logger.info(f"\n{'='*60}")
    logger.info(f"Testing imagery for: {province_name}")
    logger.info(f"Bounding box: {bbox}")
    logger.info(f"{'='*60}")
    
    # Calculate date ranges
    today = datetime.now()
    before_start = (today - timedelta(days=90)).strftime('%Y-%m-%d')
    before_end = (today - timedelta(days=60)).strftime('%Y-%m-%d')
    after_start = (today - timedelta(days=30)).strftime('%Y-%m-%d')
    after_end = today.strftime('%Y-%m-%d')
    
    before_range = f"{before_start}/{before_end}"
    after_range = f"{after_start}/{after_end}"
    
    logger.info(f"Before range: {before_range}")
    logger.info(f"After range: {after_range}")
    
    # Get catalog
    catalog = get_catalog()
    
    # Test before period
    logger.info(f"\nFetching BEFORE imagery...")
    nir_before, red_before = fetch_imagery(catalog, bbox, before_range)
    
    if nir_before is not None:
        logger.info(f"✓ Before imagery: {nir_before.shape}")
    else:
        logger.warning(f"✗ No before imagery found")
    
    # Test after period
    logger.info(f"\nFetching AFTER imagery...")
    nir_after, red_after = fetch_imagery(catalog, bbox, after_range)
    
    if nir_after is not None:
        logger.info(f"✓ After imagery: {nir_after.shape}")
    else:
        logger.warning(f"✗ No after imagery found")
    
    return (nir_before is not None, nir_after is not None)

if __name__ == "__main__":
    # Test the failing provinces
    test_bboxes = {
        "Riau": [101.0, 0.0, 102.0, 1.0],
        "Kalimantan Timur": [116.0, 0.0, 117.0, 1.0],
    }
    
    results = {}
    for province, bbox in test_bboxes.items():
        before_ok, after_ok = test_province_imagery(province, bbox)
        results[province] = {"before": before_ok, "after": after_ok}
    
    # Summary
    logger.info(f"\n{'='*60}")
    logger.info("SUMMARY")
    logger.info(f"{'='*60}")
    for province, status in results.items():
        logger.info(f"{province}:")
        logger.info(f"  Before: {'✓' if status['before'] else '✗'}")
        logger.info(f"  After: {'✓' if status['after'] else '✗'}")
