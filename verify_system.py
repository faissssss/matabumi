#!/usr/bin/env python3
"""
MataBumi System Verification Script
Checks all components are working correctly
"""

import sys
import sqlite3
import requests
from pathlib import Path

def check_database():
    """Verify database exists and has data"""
    print("🔍 Checking database...")
    db_path = Path("data/matabumi.db")
    
    if not db_path.exists():
        print("  ❌ Database not found at data/matabumi.db")
        return False
    
    try:
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Check detections table
        cursor.execute("SELECT COUNT(*) FROM detections")
        count = cursor.fetchone()[0]
        print(f"  ✅ Database found with {count} detections")
        
        # Check provinces
        cursor.execute("SELECT COUNT(DISTINCT province) FROM detections")
        provinces = cursor.fetchone()[0]
        print(f"  ✅ Data from {provinces} provinces")
        
        # Check total area
        cursor.execute("SELECT SUM(area_ha) FROM detections")
        total_area = cursor.fetchone()[0]
        print(f"  ✅ Total area: {total_area:,.2f} hectares")
        
        conn.close()
        return True
    except Exception as e:
        print(f"  ❌ Database error: {e}")
        return False

def check_backend_api():
    """Verify backend API is running and responding"""
    print("\n🔍 Checking backend API...")
    
    try:
        # Test /api/stats endpoint
        response = requests.get("http://127.0.0.1:8000/api/stats", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"  ✅ API responding (Status: {response.status_code})")
            print(f"  ✅ Total events: {data.get('total_events', 0)}")
            print(f"  ✅ Total area: {data.get('total_area_ha', 0):,.2f} ha")
            return True
        else:
            print(f"  ❌ API returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("  ❌ Cannot connect to API at http://127.0.0.1:8000")
        print("  💡 Start with: python -m uvicorn backend.api.main:app --reload --port 8000")
        return False
    except Exception as e:
        print(f"  ❌ API error: {e}")
        return False

def check_frontend():
    """Verify frontend dev server is running"""
    print("\n🔍 Checking frontend...")
    
    try:
        response = requests.get("http://localhost:5173", timeout=5)
        if response.status_code == 200:
            print(f"  ✅ Frontend responding (Status: {response.status_code})")
            print(f"  ✅ Access at: http://localhost:5173")
            return True
        else:
            print(f"  ❌ Frontend returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("  ❌ Cannot connect to frontend at http://localhost:5173")
        print("  💡 Start with: cd frontend && npm run dev")
        return False
    except Exception as e:
        print(f"  ❌ Frontend error: {e}")
        return False

def check_pipeline():
    """Check if pipeline is running"""
    print("\n🔍 Checking pipeline...")
    
    import subprocess
    try:
        # Check for running Python processes
        result = subprocess.run(
            ["powershell", "-Command", "Get-Process python -ErrorAction SilentlyContinue | Measure-Object"],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if "Count" in result.stdout and "0" not in result.stdout:
            print("  ✅ Python processes detected (pipeline may be running)")
            print("  💡 Check with: python monitor_pipeline.py")
            return True
        else:
            print("  ⚠️  No Python processes detected")
            print("  💡 Start with: python pipeline/run_annual_pipeline.py")
            return False
    except Exception as e:
        print(f"  ⚠️  Could not check pipeline status: {e}")
        return False

def check_files():
    """Verify key files exist"""
    print("\n🔍 Checking key files...")
    
    files = [
        "pipeline/run_annual_pipeline.py",
        "detection/classify.py",
        "backend/api/main.py",
        "frontend/src/App.tsx",
        "frontend/src/components/KPICards.tsx",
        "frontend/src/components/AnalyticsDrawer.tsx",
        "frontend/src/components/Sidebar.tsx",
        "frontend/package.json",
    ]
    
    all_exist = True
    for file in files:
        path = Path(file)
        if path.exists():
            print(f"  ✅ {file}")
        else:
            print(f"  ❌ {file} not found")
            all_exist = False
    
    return all_exist

def main():
    """Run all verification checks"""
    print("=" * 60)
    print("MataBumi System Verification")
    print("=" * 60)
    
    results = {
        "Database": check_database(),
        "Backend API": check_backend_api(),
        "Frontend": check_frontend(),
        "Pipeline": check_pipeline(),
        "Files": check_files(),
    }
    
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    
    for component, status in results.items():
        icon = "✅" if status else "❌"
        print(f"{icon} {component}")
    
    all_passed = all(results.values())
    
    if all_passed:
        print("\n🎉 All systems operational!")
        print("\n📱 Access the app at: http://localhost:5173")
        return 0
    else:
        print("\n⚠️  Some components need attention")
        return 1

if __name__ == "__main__":
    sys.exit(main())
