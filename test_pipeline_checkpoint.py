"""
Task 12 Checkpoint Test: End-to-End Pipeline Validation

This script runs the detection pipeline on a subset of provinces to verify:
- Imagery fetching works
- NDVI calculation and change detection
- Classification and severity scoring
- Database records are created
- Thumbnails and hero images are saved
"""

import os
import sys
import logging
from datetime import datetime

# Add project root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from pipeline.run import run_pipeline
from database.db import query_alerts, query_national_stats, get_connection

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def verify_database_records():
    """Verify that database records were created."""
    logger.info("\n" + "="*60)
    logger.info("VERIFICATION: Database Records")
    logger.info("="*60)
    
    # Query all alerts
    alerts = query_alerts({"limit": 100})
    logger.info(f"✓ Total alerts in database: {len(alerts)}")
    
    if alerts:
        for alert in alerts:
            logger.info(f"  - {alert['province']}: {alert['area_ha']:.1f} ha, "
                       f"{alert['cause']} ({alert['confidence']:.0%}), "
                       f"severity={alert['severity']}")
    
    # Query national stats
    stats = query_national_stats()
    logger.info(f"\n✓ National Statistics:")
    logger.info(f"  - Total area lost: {stats['total_area_ha']:.1f} ha")
    logger.info(f"  - Total events: {stats['total_events']}")
    logger.info(f"  - By severity: {stats['by_severity']}")
    logger.info(f"  - By cause: {stats['by_cause']}")
    logger.info(f"  - Protected zone breaches: {stats['protected_zone_breaches']}")
    
    return len(alerts) > 0


def verify_thumbnails():
    """Verify that thumbnail images were saved."""
    logger.info("\n" + "="*60)
    logger.info("VERIFICATION: Thumbnail Images")
    logger.info("="*60)
    
    thumbnail_dir = "outputs/thumbnails"
    if not os.path.exists(thumbnail_dir):
        logger.warning(f"✗ Thumbnail directory does not exist: {thumbnail_dir}")
        return False
    
    thumbnails = [f for f in os.listdir(thumbnail_dir) if f.endswith('.jpg')]
    logger.info(f"✓ Thumbnails found: {len(thumbnails)}")
    
    for thumb in thumbnails:
        size = os.path.getsize(os.path.join(thumbnail_dir, thumb))
        logger.info(f"  - {thumb} ({size} bytes)")
    
    return len(thumbnails) > 0


def verify_hero_images():
    """Verify that hero images were saved."""
    logger.info("\n" + "="*60)
    logger.info("VERIFICATION: Hero Images")
    logger.info("="*60)
    
    output_dir = "outputs"
    if not os.path.exists(output_dir):
        logger.warning(f"✗ Output directory does not exist: {output_dir}")
        return False
    
    hero_images = [f for f in os.listdir(output_dir) 
                   if f.startswith('matabumi_') and f.endswith('.png')]
    logger.info(f"✓ Hero images found: {len(hero_images)}")
    
    for hero in hero_images:
        size = os.path.getsize(os.path.join(output_dir, hero))
        logger.info(f"  - {hero} ({size} bytes)")
    
    return len(hero_images) > 0


def verify_all_tests_pass():
    """Run the test suite to ensure all tests pass."""
    logger.info("\n" + "="*60)
    logger.info("VERIFICATION: Test Suite")
    logger.info("="*60)
    
    import subprocess
    result = subprocess.run(
        ["python", "-m", "pytest", "tests/", "-v", "--tb=short"],
        capture_output=True,
        text=True
    )
    
    logger.info(result.stdout)
    if result.returncode != 0:
        logger.error(result.stderr)
        logger.error("✗ Some tests failed")
        return False
    
    logger.info("✓ All tests passed")
    return True


def main():
    """Run end-to-end pipeline checkpoint test."""
    logger.info("="*60)
    logger.info("TASK 12: CHECKPOINT - END-TO-END PIPELINE TEST")
    logger.info("="*60)
    logger.info(f"Start time: {datetime.now()}")
    
    # Test provinces - select a diverse set with moderate bounding boxes for testing
    # Using 1.0 degree squares for better imagery availability
    # - Aceh: Northern region
    # - Riau: Central region  
    # - Kalimantan Timur: Protected province
    
    # Override with moderate test bounding boxes (1.0 degree squares)
    from detection.fetch_imagery import PROVINCE_BBOXES
    test_bboxes = {
        "Aceh": [95.5, 4.0, 96.5, 5.0],  # 1.0 degree area in Aceh
        "Riau": [101.0, 0.0, 102.0, 1.0],  # 1.0 degree area in Riau
        "Kalimantan Timur": [116.0, 0.0, 117.0, 1.0],  # 1.0 degree area in Kalimantan Timur
    }
    
    # Temporarily override bounding boxes for testing
    original_bboxes = {}
    for province, bbox in test_bboxes.items():
        original_bboxes[province] = PROVINCE_BBOXES[province]
        PROVINCE_BBOXES[province] = bbox
    
    test_provinces = list(test_bboxes.keys())
    
    logger.info(f"\nTesting with provinces: {', '.join(test_provinces)}")
    logger.info("This will verify:")
    logger.info("  1. Imagery fetching from Microsoft Planetary Computer")
    logger.info("  2. NDVI calculation and change detection")
    logger.info("  3. Classification and severity scoring")
    logger.info("  4. Database record creation")
    logger.info("  5. Thumbnail and hero image generation")
    logger.info("")
    
    # Run the pipeline
    try:
        run_pipeline(provinces=test_provinces)
    except Exception as e:
        logger.error(f"Pipeline execution failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        # Restore original bounding boxes
        for province, bbox in original_bboxes.items():
            PROVINCE_BBOXES[province] = bbox
    
    # Verify results
    logger.info("\n" + "="*60)
    logger.info("RUNNING VERIFICATIONS")
    logger.info("="*60)
    
    results = {
        "database_records": verify_database_records(),
        "thumbnails": verify_thumbnails(),
        "hero_images": verify_hero_images(),
    }
    
    # Print summary
    logger.info("\n" + "="*60)
    logger.info("CHECKPOINT SUMMARY")
    logger.info("="*60)
    
    all_passed = all(results.values())
    
    for check, passed in results.items():
        status = "✓ PASS" if passed else "✗ FAIL"
        logger.info(f"{status}: {check.replace('_', ' ').title()}")
    
    logger.info("")
    if all_passed:
        logger.info("🎉 ALL VERIFICATIONS PASSED!")
        logger.info("The pipeline is working end-to-end.")
    else:
        logger.error("❌ SOME VERIFICATIONS FAILED")
        logger.error("Please review the errors above.")
    
    logger.info(f"\nEnd time: {datetime.now()}")
    logger.info("="*60)
    
    return all_passed


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
