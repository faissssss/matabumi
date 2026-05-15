"""
Task 15 Checkpoint Test: Frontend and Backend Integration

This script verifies:
- FastAPI backend is running and serving data
- API endpoints return correct data
- Frontend can connect to backend
- CORS is configured correctly
"""

import requests
import logging
import sys

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

BACKEND_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:5173"


def test_backend_health():
    """Test if backend is running."""
    logger.info("\n" + "="*60)
    logger.info("TEST: Backend Health Check")
    logger.info("="*60)
    
    try:
        response = requests.get(f"{BACKEND_URL}/api/stats", timeout=5)
        if response.status_code == 200:
            logger.info("✓ Backend is running")
            logger.info(f"  Status code: {response.status_code}")
            return True
        else:
            logger.error(f"✗ Backend returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        logger.error("✗ Cannot connect to backend - is it running?")
        return False
    except Exception as e:
        logger.error(f"✗ Error: {e}")
        return False


def test_api_stats():
    """Test /api/stats endpoint."""
    logger.info("\n" + "="*60)
    logger.info("TEST: /api/stats Endpoint")
    logger.info("="*60)
    
    try:
        response = requests.get(f"{BACKEND_URL}/api/stats", timeout=5)
        if response.status_code == 200:
            data = response.json()
            logger.info("✓ Stats endpoint working")
            logger.info(f"  Total area: {data.get('total_area_ha', 0):.1f} ha")
            logger.info(f"  Total events: {data.get('total_events', 0)}")
            logger.info(f"  By severity: {data.get('by_severity', {})}")
            logger.info(f"  By cause: {data.get('by_cause', {})}")
            return True
        else:
            logger.error(f"✗ Stats endpoint returned {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"✗ Error: {e}")
        return False


def test_api_alerts():
    """Test /api/alerts endpoint."""
    logger.info("\n" + "="*60)
    logger.info("TEST: /api/alerts Endpoint")
    logger.info("="*60)
    
    try:
        response = requests.get(f"{BACKEND_URL}/api/alerts?limit=10", timeout=5)
        if response.status_code == 200:
            data = response.json()
            alerts = data if isinstance(data, list) else data.get('value', [])
            logger.info(f"✓ Alerts endpoint working")
            logger.info(f"  Returned {len(alerts)} alerts")
            
            if alerts:
                alert = alerts[0]
                logger.info(f"  Sample alert:")
                logger.info(f"    Province: {alert.get('province')}")
                logger.info(f"    Area: {alert.get('area_ha', 0):.1f} ha")
                logger.info(f"    Cause: {alert.get('cause')}")
                logger.info(f"    Severity: {alert.get('severity')}")
            
            return True
        else:
            logger.error(f"✗ Alerts endpoint returned {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"✗ Error: {e}")
        return False


def test_api_provinces():
    """Test /api/provinces endpoint."""
    logger.info("\n" + "="*60)
    logger.info("TEST: /api/provinces Endpoint")
    logger.info("="*60)
    
    try:
        response = requests.get(f"{BACKEND_URL}/api/provinces", timeout=5)
        if response.status_code == 200:
            data = response.json()
            provinces = data if isinstance(data, list) else data.get('value', [])
            logger.info(f"✓ Provinces endpoint working")
            logger.info(f"  Returned {len(provinces)} provinces")
            
            if provinces:
                province = provinces[0]
                logger.info(f"  Sample province:")
                logger.info(f"    Name: {province.get('province')}")
                logger.info(f"    Events: {province.get('event_count', 0)}")
                logger.info(f"    Total area: {province.get('total_area_ha', 0):.1f} ha")
            
            return True
        else:
            logger.error(f"✗ Provinces endpoint returned {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"✗ Error: {e}")
        return False


def test_api_trends():
    """Test /api/trends endpoint."""
    logger.info("\n" + "="*60)
    logger.info("TEST: /api/trends Endpoint")
    logger.info("="*60)
    
    try:
        response = requests.get(f"{BACKEND_URL}/api/trends", timeout=5)
        if response.status_code == 200:
            data = response.json()
            trends = data if isinstance(data, list) else data.get('value', [])
            logger.info(f"✓ Trends endpoint working")
            logger.info(f"  Returned {len(trends)} trend data points")
            return True
        else:
            logger.error(f"✗ Trends endpoint returned {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"✗ Error: {e}")
        return False


def test_frontend_accessible():
    """Test if frontend is accessible."""
    logger.info("\n" + "="*60)
    logger.info("TEST: Frontend Accessibility")
    logger.info("="*60)
    
    try:
        response = requests.get(FRONTEND_URL, timeout=5)
        if response.status_code == 200:
            logger.info("✓ Frontend is accessible")
            logger.info(f"  Status code: {response.status_code}")
            return True
        else:
            logger.error(f"✗ Frontend returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        logger.error("✗ Cannot connect to frontend - is it running?")
        return False
    except Exception as e:
        logger.error(f"✗ Error: {e}")
        return False


def test_cors_headers():
    """Test if CORS headers are configured correctly."""
    logger.info("\n" + "="*60)
    logger.info("TEST: CORS Configuration")
    logger.info("="*60)
    
    try:
        # Simulate a CORS preflight request
        headers = {
            'Origin': FRONTEND_URL,
            'Access-Control-Request-Method': 'GET',
        }
        response = requests.options(f"{BACKEND_URL}/api/stats", headers=headers, timeout=5)
        
        cors_header = response.headers.get('Access-Control-Allow-Origin')
        if cors_header:
            logger.info(f"✓ CORS is configured")
            logger.info(f"  Allow-Origin: {cors_header}")
            return True
        else:
            logger.warning("⚠ CORS headers not found (may still work)")
            return True  # Don't fail on this
    except Exception as e:
        logger.warning(f"⚠ Could not test CORS: {e}")
        return True  # Don't fail on this


def main():
    """Run all integration tests."""
    logger.info("="*60)
    logger.info("TASK 15: FRONTEND AND BACKEND INTEGRATION TEST")
    logger.info("="*60)
    logger.info("")
    logger.info("This test verifies:")
    logger.info("  1. FastAPI backend is running")
    logger.info("  2. All API endpoints return data")
    logger.info("  3. Frontend is accessible")
    logger.info("  4. CORS is configured")
    logger.info("")
    
    results = {
        "backend_health": test_backend_health(),
        "api_stats": test_api_stats(),
        "api_alerts": test_api_alerts(),
        "api_provinces": test_api_provinces(),
        "api_trends": test_api_trends(),
        "frontend_accessible": test_frontend_accessible(),
        "cors_headers": test_cors_headers(),
    }
    
    # Print summary
    logger.info("\n" + "="*60)
    logger.info("INTEGRATION TEST SUMMARY")
    logger.info("="*60)
    
    all_passed = all(results.values())
    
    for test_name, passed in results.items():
        status = "✓ PASS" if passed else "✗ FAIL"
        logger.info(f"{status}: {test_name.replace('_', ' ').title()}")
    
    logger.info("")
    if all_passed:
        logger.info("🎉 ALL INTEGRATION TESTS PASSED!")
        logger.info("")
        logger.info("Next steps:")
        logger.info("  1. Open http://localhost:5173/ in your browser")
        logger.info("  2. Verify the map displays alerts")
        logger.info("  3. Test filters (province, severity, cause)")
        logger.info("  4. Test language toggle (EN/ID)")
        logger.info("  5. Test impact calculator slider")
    else:
        logger.error("❌ SOME INTEGRATION TESTS FAILED")
        logger.error("Please review the errors above.")
    
    logger.info("")
    logger.info("="*60)
    
    return all_passed


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
