#!/usr/bin/env python3
"""
Quick monitoring script for test pipeline progress.
Shows real-time status of province processing.
"""

import json
import os
import time
from pathlib import Path
from datetime import datetime

def check_test_progress():
    """Check and display test pipeline progress."""
    print("=" * 60)
    print("MataBumi Test Pipeline Monitor")
    print("=" * 60)
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # Check for output files
    data_dir = Path("data")
    
    # Check 2023 detections
    file_2023 = data_dir / "detections_2023.json"
    if file_2023.exists():
        with open(file_2023) as f:
            data_2023 = json.load(f)
        print(f"✅ 2023 Data: {len(data_2023)} detections")
        
        # Count by province
        provinces_2023 = {}
        for det in data_2023:
            prov = det.get("province", "Unknown")
            provinces_2023[prov] = provinces_2023.get(prov, 0) + 1
        
        for prov, count in provinces_2023.items():
            print(f"   - {prov}: {count} detections")
    else:
        print("⏳ 2023 Data: Not yet available")
    
    print()
    
    # Check 2024 detections
    file_2024 = data_dir / "detections_2024.json"
    if file_2024.exists():
        with open(file_2024) as f:
            data_2024 = json.load(f)
        print(f"✅ 2024 Data: {len(data_2024)} detections")
        
        # Count by province
        provinces_2024 = {}
        for det in data_2024:
            prov = det.get("province", "Unknown")
            provinces_2024[prov] = provinces_2024.get(prov, 0) + 1
        
        for prov, count in provinces_2024.items():
            print(f"   - {prov}: {count} detections")
    else:
        print("⏳ 2024 Data: Not yet available")
    
    print()
    
    # Check thumbnails
    thumb_dir = data_dir / "thumbnails"
    if thumb_dir.exists():
        thumbnails = list(thumb_dir.glob("*.png"))
        print(f"📸 Thumbnails: {len(thumbnails)} images")
        
        # Count by type
        before = len(list(thumb_dir.glob("*_before.png")))
        after = len(list(thumb_dir.glob("*_after.png")))
        change = len(list(thumb_dir.glob("*_change.png")))
        
        print(f"   - Before: {before}")
        print(f"   - After: {after}")
        print(f"   - Change: {change}")
    else:
        print("📸 Thumbnails: Not yet available")
    
    print()
    
    # Overall status
    if file_2023.exists() and file_2024.exists():
        total_detections = len(data_2023) + len(data_2024)
        print(f"🎉 TEST COMPLETE!")
        print(f"   Total detections: {total_detections}")
        print(f"   Ready for full production run!")
    else:
        print("🔄 Test still in progress...")
        print("   Run this script again in a few minutes")
    
    print("=" * 60)

if __name__ == "__main__":
    check_test_progress()
