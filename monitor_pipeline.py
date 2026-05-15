#!/usr/bin/env python3
"""
Real-time monitoring dashboard for MataBumi pipeline.
Shows progress, statistics, and estimated completion time.
"""

import sqlite3
import os
from pathlib import Path
from datetime import datetime, timedelta
from collections import Counter

def get_db_stats():
    """Get statistics from the database."""
    db_path = Path("data/matabumi.db")
    
    if not db_path.exists():
        return None
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    stats = {}
    
    # Total alerts
    cursor.execute("SELECT COUNT(*) FROM alerts")
    stats['total_alerts'] = cursor.fetchone()[0]
    
    # By year
    cursor.execute("""
        SELECT strftime('%Y', detected_at) as year, COUNT(*) 
        FROM alerts 
        GROUP BY year 
        ORDER BY year
    """)
    stats['by_year'] = dict(cursor.fetchall())
    
    # By month
    cursor.execute("""
        SELECT strftime('%Y-%m', detected_at) as month, COUNT(*) 
        FROM alerts 
        GROUP BY month 
        ORDER BY month DESC
        LIMIT 12
    """)
    stats['by_month'] = dict(cursor.fetchall())
    
    # By province (top 10)
    cursor.execute("""
        SELECT province, COUNT(*) 
        FROM alerts 
        GROUP BY province 
        ORDER BY COUNT(*) DESC 
        LIMIT 10
    """)
    stats['by_province'] = dict(cursor.fetchall())
    
    # By cause
    cursor.execute("""
        SELECT cause, COUNT(*) 
        FROM alerts 
        GROUP BY cause 
        ORDER BY COUNT(*) DESC
    """)
    stats['by_cause'] = dict(cursor.fetchall())
    
    # Average metrics
    cursor.execute("""
        SELECT 
            AVG(area_ha) as avg_area,
            AVG(confidence) as avg_confidence,
            MIN(detected_at) as first_detection,
            MAX(detected_at) as last_detection
        FROM alerts
    """)
    row = cursor.fetchone()
    stats['avg_area'] = row[0] if row[0] else 0
    stats['avg_confidence'] = row[1] if row[1] else 0
    stats['first_detection'] = row[2]
    stats['last_detection'] = row[3]
    
    # Severity distribution
    cursor.execute("""
        SELECT severity, COUNT(*) 
        FROM alerts 
        GROUP BY severity 
        ORDER BY 
            CASE severity 
                WHEN 'critical' THEN 1 
                WHEN 'high' THEN 2 
                WHEN 'medium' THEN 3 
                WHEN 'low' THEN 4 
            END
    """)
    stats['by_severity'] = dict(cursor.fetchall())
    
    conn.close()
    return stats


def get_file_stats():
    """Get file system statistics."""
    stats = {}
    
    # Thumbnails
    thumb_dir = Path("data/thumbnails")
    if thumb_dir.exists():
        thumbnails = list(thumb_dir.glob("*.png"))
        stats['thumbnail_count'] = len(thumbnails)
        stats['thumbnail_size_mb'] = sum(f.stat().st_size for f in thumbnails) / (1024 * 1024)
    else:
        stats['thumbnail_count'] = 0
        stats['thumbnail_size_mb'] = 0
    
    # Hero images
    hero_dir = Path("data/hero_images")
    if hero_dir.exists():
        heroes = list(hero_dir.glob("*.png"))
        stats['hero_count'] = len(heroes)
        stats['hero_size_mb'] = sum(f.stat().st_size for f in heroes) / (1024 * 1024)
    else:
        stats['hero_count'] = 0
        stats['hero_size_mb'] = 0
    
    # Database size
    db_path = Path("data/matabumi.db")
    if db_path.exists():
        stats['db_size_mb'] = db_path.stat().st_size / (1024 * 1024)
    else:
        stats['db_size_mb'] = 0
    
    return stats


def estimate_progress():
    """Estimate pipeline progress and completion time."""
    # Total expected combinations
    total_combinations = 38 * 3 * 12  # 38 provinces × 3 years × 12 months = 1,368
    
    db_stats = get_db_stats()
    if not db_stats or db_stats['total_alerts'] == 0:
        return {
            'processed': 0,
            'total': total_combinations,
            'percent': 0,
            'estimated_completion': 'Unknown'
        }
    
    # Estimate processed combinations based on unique month-province pairs
    conn = sqlite3.connect("data/matabumi.db")
    cursor = conn.cursor()
    cursor.execute("""
        SELECT COUNT(DISTINCT province || '-' || strftime('%Y-%m', detected_at))
        FROM alerts
    """)
    processed = cursor.fetchone()[0]
    conn.close()
    
    # Calculate progress
    percent = (processed / total_combinations) * 100
    
    # Estimate completion time
    if db_stats['first_detection'] and db_stats['last_detection']:
        first = datetime.fromisoformat(db_stats['first_detection'])
        last = datetime.fromisoformat(db_stats['last_detection'])
        elapsed = (last - first).total_seconds() / 3600  # hours
        
        if processed > 0:
            rate = elapsed / processed  # hours per combination
            remaining = total_combinations - processed
            hours_left = remaining * rate
            completion = datetime.now() + timedelta(hours=hours_left)
            estimated_completion = completion.strftime('%Y-%m-%d %H:%M')
        else:
            estimated_completion = 'Calculating...'
    else:
        estimated_completion = 'Calculating...'
    
    return {
        'processed': processed,
        'total': total_combinations,
        'percent': percent,
        'estimated_completion': estimated_completion
    }


def print_dashboard():
    """Print the monitoring dashboard."""
    print("\n" + "="*70)
    print("🌲 MataBumi Pipeline Monitoring Dashboard")
    print("="*70)
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # Progress
    progress = estimate_progress()
    print("📊 PROGRESS")
    print("-" * 70)
    print(f"Processed: {progress['processed']:,} / {progress['total']:,} combinations")
    print(f"Complete: {progress['percent']:.1f}%")
    print(f"Estimated Completion: {progress['estimated_completion']}")
    print()
    
    # Database stats
    db_stats = get_db_stats()
    if db_stats:
        print("🔍 DETECTION STATISTICS")
        print("-" * 70)
        print(f"Total Detections: {db_stats['total_alerts']:,}")
        print(f"Average Area: {db_stats['avg_area']:.1f} ha")
        print(f"Average Confidence: {db_stats['avg_confidence']:.2%}")
        print()
        
        # By year
        if db_stats['by_year']:
            print("📅 By Year:")
            for year, count in sorted(db_stats['by_year'].items()):
                print(f"  {year}: {count:,} detections")
            print()
        
        # By month (recent)
        if db_stats['by_month']:
            print("📆 Recent Months:")
            for month, count in list(db_stats['by_month'].items())[:6]:
                print(f"  {month}: {count:,} detections")
            print()
        
        # By cause
        if db_stats['by_cause']:
            print("🔥 By Cause:")
            for cause, count in db_stats['by_cause'].items():
                percent = (count / db_stats['total_alerts']) * 100
                print(f"  {cause.capitalize()}: {count:,} ({percent:.1f}%)")
            print()
        
        # By severity
        if db_stats['by_severity']:
            print("⚠️  By Severity:")
            for severity, count in db_stats['by_severity'].items():
                percent = (count / db_stats['total_alerts']) * 100
                print(f"  {severity.capitalize()}: {count:,} ({percent:.1f}%)")
            print()
        
        # Top provinces
        if db_stats['by_province']:
            print("🗺️  Top Provinces:")
            for province, count in list(db_stats['by_province'].items())[:5]:
                print(f"  {province}: {count:,} detections")
            print()
    else:
        print("⏳ No data yet - pipeline starting up...")
        print()
    
    # File stats
    file_stats = get_file_stats()
    print("💾 STORAGE")
    print("-" * 70)
    print(f"Thumbnails: {file_stats['thumbnail_count']:,} images ({file_stats['thumbnail_size_mb']:.1f} MB)")
    print(f"Hero Images: {file_stats['hero_count']:,} images ({file_stats['hero_size_mb']:.1f} MB)")
    print(f"Database: {file_stats['db_size_mb']:.1f} MB")
    total_mb = file_stats['thumbnail_size_mb'] + file_stats['hero_size_mb'] + file_stats['db_size_mb']
    print(f"Total: {total_mb:.1f} MB ({total_mb/1024:.2f} GB)")
    print()
    
    print("="*70)
    print("💡 Tip: Run this script periodically to monitor progress")
    print("   Command: python monitor_pipeline.py")
    print("="*70 + "\n")


if __name__ == "__main__":
    try:
        print_dashboard()
    except Exception as e:
        print(f"Error: {e}")
        print("Make sure the pipeline is running and data directory exists.")
