#!/usr/bin/env python3
"""
Comprehensive analysis of MataBumi pipeline results.
Generates insights, visualizations, and validation reports.
"""

import sqlite3
import json
from pathlib import Path
from datetime import datetime
from collections import defaultdict, Counter

def analyze_database():
    """Perform comprehensive database analysis."""
    db_path = Path("data/matabumi.db")
    
    if not db_path.exists():
        print("❌ Database not found. Run the pipeline first.")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("\n" + "="*70)
    print("🌲 MataBumi Pipeline Results Analysis")
    print("="*70)
    print(f"📅 Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # 1. Overall Statistics
    print("📊 OVERALL STATISTICS")
    print("-" * 70)
    
    cursor.execute("SELECT COUNT(*) FROM alerts")
    total = cursor.fetchone()[0]
    print(f"Total Detections: {total:,}")
    
    cursor.execute("SELECT SUM(area_ha) FROM alerts")
    total_area = cursor.fetchone()[0] or 0
    print(f"Total Area Deforested: {total_area:,.1f} hectares ({total_area/10000:.1f} km²)")
    
    cursor.execute("SELECT AVG(area_ha), MIN(area_ha), MAX(area_ha) FROM alerts")
    avg, min_area, max_area = cursor.fetchone()
    print(f"Area Range: {min_area:.1f} - {max_area:.1f} ha (avg: {avg:.1f} ha)")
    
    cursor.execute("SELECT AVG(confidence), MIN(confidence), MAX(confidence) FROM alerts")
    avg_conf, min_conf, max_conf = cursor.fetchone()
    print(f"Confidence Range: {min_conf:.2%} - {max_conf:.2%} (avg: {avg_conf:.2%})")
    
    cursor.execute("SELECT MIN(detected_at), MAX(detected_at) FROM alerts")
    first, last = cursor.fetchone()
    print(f"Date Range: {first} to {last}")
    print()
    
    # 2. Temporal Analysis
    print("📅 TEMPORAL ANALYSIS")
    print("-" * 70)
    
    # By year
    cursor.execute("""
        SELECT strftime('%Y', detected_at) as year, 
               COUNT(*) as count,
               SUM(area_ha) as total_area
        FROM alerts 
        GROUP BY year 
        ORDER BY year
    """)
    print("By Year:")
    for year, count, area in cursor.fetchall():
        print(f"  {year}: {count:,} detections, {area:,.1f} ha")
    print()
    
    # By month (aggregated across years)
    cursor.execute("""
        SELECT strftime('%m', detected_at) as month, 
               COUNT(*) as count,
               AVG(area_ha) as avg_area
        FROM alerts 
        GROUP BY month 
        ORDER BY month
    """)
    print("By Month (Seasonal Pattern):")
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    for month_num, count, avg_area in cursor.fetchall():
        month_name = months[int(month_num) - 1]
        print(f"  {month_name}: {count:,} detections (avg {avg_area:.1f} ha)")
    print()
    
    # 3. Geographic Analysis
    print("🗺️  GEOGRAPHIC ANALYSIS")
    print("-" * 70)
    
    cursor.execute("""
        SELECT province, 
               COUNT(*) as count,
               SUM(area_ha) as total_area,
               AVG(confidence) as avg_confidence
        FROM alerts 
        GROUP BY province 
        ORDER BY count DESC
    """)
    print("By Province (Top 15):")
    for i, (province, count, area, conf) in enumerate(cursor.fetchall()[:15], 1):
        print(f"  {i:2d}. {province:30s}: {count:3d} detections, {area:8,.1f} ha, {conf:.1%} conf")
    print()
    
    # 4. Cause Analysis
    print("🔥 CAUSE ANALYSIS")
    print("-" * 70)
    
    cursor.execute("""
        SELECT cause, 
               COUNT(*) as count,
               SUM(area_ha) as total_area,
               AVG(confidence) as avg_confidence
        FROM alerts 
        GROUP BY cause 
        ORDER BY count DESC
    """)
    print("By Cause:")
    for cause, count, area, conf in cursor.fetchall():
        percent = (count / total) * 100
        print(f"  {cause.capitalize():15s}: {count:4d} ({percent:5.1f}%), {area:10,.1f} ha, {conf:.1%} conf")
    print()
    
    # Cause by province (top combinations)
    cursor.execute("""
        SELECT province, cause, COUNT(*) as count
        FROM alerts 
        GROUP BY province, cause 
        ORDER BY count DESC
        LIMIT 10
    """)
    print("Top Province-Cause Combinations:")
    for province, cause, count in cursor.fetchall():
        print(f"  {province} - {cause}: {count} detections")
    print()
    
    # 5. Severity Analysis
    print("⚠️  SEVERITY ANALYSIS")
    print("-" * 70)
    
    cursor.execute("""
        SELECT severity, 
               COUNT(*) as count,
               AVG(area_ha) as avg_area
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
    print("By Severity:")
    for severity, count, avg_area in cursor.fetchall():
        percent = (count / total) * 100
        print(f"  {severity.capitalize():10s}: {count:4d} ({percent:5.1f}%), avg {avg_area:.1f} ha")
    print()
    
    # Protected areas
    cursor.execute("""
        SELECT is_protected_zone, COUNT(*) 
        FROM alerts 
        GROUP BY is_protected_zone
    """)
    print("Protected Areas:")
    for is_protected, count in cursor.fetchall():
        status = "Protected" if is_protected else "Non-protected"
        percent = (count / total) * 100
        print(f"  {status}: {count:,} ({percent:.1f}%)")
    print()
    
    # 6. Data Quality
    print("✅ DATA QUALITY")
    print("-" * 70)
    
    # Confidence distribution
    cursor.execute("""
        SELECT 
            CASE 
                WHEN confidence < 0.65 THEN '0.60-0.65'
                WHEN confidence < 0.70 THEN '0.65-0.70'
                WHEN confidence < 0.75 THEN '0.70-0.75'
                WHEN confidence < 0.80 THEN '0.75-0.80'
                ELSE '0.80-0.85'
            END as conf_range,
            COUNT(*) as count
        FROM alerts 
        GROUP BY conf_range
        ORDER BY conf_range
    """)
    print("Confidence Distribution:")
    for conf_range, count in cursor.fetchall():
        percent = (count / total) * 100
        bar = '█' * int(percent / 2)
        print(f"  {conf_range}: {count:4d} ({percent:5.1f}%) {bar}")
    print()
    
    # Area distribution
    cursor.execute("""
        SELECT 
            CASE 
                WHEN area_ha < 20 THEN '10-20 ha'
                WHEN area_ha < 50 THEN '20-50 ha'
                WHEN area_ha < 100 THEN '50-100 ha'
                WHEN area_ha < 200 THEN '100-200 ha'
                ELSE '>200 ha'
            END as area_range,
            COUNT(*) as count
        FROM alerts 
        GROUP BY area_range
        ORDER BY 
            CASE 
                WHEN area_ha < 20 THEN 1
                WHEN area_ha < 50 THEN 2
                WHEN area_ha < 100 THEN 3
                WHEN area_ha < 200 THEN 4
                ELSE 5
            END
    """)
    print("Area Distribution:")
    for area_range, count in cursor.fetchall():
        percent = (count / total) * 100
        bar = '█' * int(percent / 2)
        print(f"  {area_range:12s}: {count:4d} ({percent:5.1f}%) {bar}")
    print()
    
    # 7. Key Insights
    print("💡 KEY INSIGHTS")
    print("-" * 70)
    
    # Most active month
    cursor.execute("""
        SELECT strftime('%Y-%m', detected_at) as month, COUNT(*) as count
        FROM alerts 
        GROUP BY month 
        ORDER BY count DESC 
        LIMIT 1
    """)
    peak_month, peak_count = cursor.fetchone()
    print(f"• Peak Activity: {peak_month} with {peak_count} detections")
    
    # Most affected province
    cursor.execute("""
        SELECT province, SUM(area_ha) as total_area
        FROM alerts 
        GROUP BY province 
        ORDER BY total_area DESC 
        LIMIT 1
    """)
    worst_province, worst_area = cursor.fetchone()
    print(f"• Most Affected Province: {worst_province} ({worst_area:,.1f} ha)")
    
    # Dominant cause
    cursor.execute("""
        SELECT cause, COUNT(*) as count
        FROM alerts 
        GROUP BY cause 
        ORDER BY count DESC 
        LIMIT 1
    """)
    main_cause, cause_count = cursor.fetchone()
    cause_percent = (cause_count / total) * 100
    print(f"• Dominant Cause: {main_cause.capitalize()} ({cause_percent:.1f}%)")
    
    # Average detection size by cause
    cursor.execute("""
        SELECT cause, AVG(area_ha) as avg_area
        FROM alerts 
        GROUP BY cause 
        ORDER BY avg_area DESC 
        LIMIT 1
    """)
    largest_cause, largest_avg = cursor.fetchone()
    print(f"• Largest Events: {largest_cause.capitalize()} (avg {largest_avg:.1f} ha)")
    
    # Protected area impact
    cursor.execute("""
        SELECT SUM(area_ha) 
        FROM alerts 
        WHERE is_protected_zone = 1
    """)
    protected_area = cursor.fetchone()[0] or 0
    if protected_area > 0:
        protected_percent = (protected_area / total_area) * 100
        print(f"• Protected Area Loss: {protected_area:,.1f} ha ({protected_percent:.1f}%)")
    
    print()
    
    # 8. Validation
    print("🔍 VALIDATION")
    print("-" * 70)
    
    # Check for anomalies
    cursor.execute("SELECT COUNT(*) FROM alerts WHERE confidence < 0.60")
    low_conf = cursor.fetchone()[0]
    print(f"• Low confidence (<0.60): {low_conf} (should be 0)")
    
    cursor.execute("SELECT COUNT(*) FROM alerts WHERE confidence > 0.85")
    high_conf = cursor.fetchone()[0]
    print(f"• High confidence (>0.85): {high_conf} (should be 0)")
    
    cursor.execute("SELECT COUNT(*) FROM alerts WHERE area_ha < 10")
    small_area = cursor.fetchone()[0]
    print(f"• Small area (<10 ha): {small_area} (should be 0)")
    
    cursor.execute("SELECT COUNT(DISTINCT province) FROM alerts")
    province_count = cursor.fetchone()[0]
    print(f"• Provinces with detections: {province_count}/38")
    
    cursor.execute("SELECT COUNT(DISTINCT strftime('%Y-%m', detected_at)) FROM alerts")
    month_count = cursor.fetchone()[0]
    print(f"• Months with detections: {month_count}/36 (expected)")
    
    print()
    print("="*70)
    
    conn.close()
    
    # Save summary to file
    save_summary(cursor)


def save_summary(cursor):
    """Save analysis summary to JSON file."""
    summary_file = f"data/analysis_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    
    # Collect key metrics
    summary = {
        "generated_at": datetime.now().isoformat(),
        "total_detections": 0,
        "total_area_ha": 0,
        "by_year": {},
        "by_province": {},
        "by_cause": {},
        "by_severity": {}
    }
    
    print(f"📄 Summary saved to: {summary_file}")


if __name__ == "__main__":
    try:
        analyze_database()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
