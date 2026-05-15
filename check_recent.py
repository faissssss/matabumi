import sqlite3

conn = sqlite3.connect('backend/database/matabumi.db')
cursor = conn.cursor()

# Get recent detections
cursor.execute('''
    SELECT province, area_ha, severity, cause, detected_at 
    FROM deforestation_alerts 
    ORDER BY detected_at DESC 
    LIMIT 10
''')

rows = cursor.fetchall()
print("Recent detections:")
print("-" * 80)
for row in rows:
    print(f"{row[0]:20s} | {row[1]:10.2f} ha | {row[2]:10s} | {row[3]:12s} | {row[4]}")

# Get summary stats
cursor.execute('SELECT COUNT(*), SUM(area_ha) FROM deforestation_alerts')
count, total_area = cursor.fetchone()
print("-" * 80)
print(f"Total: {count} detections, {total_area:,.2f} hectares")

# Get by province
cursor.execute('''
    SELECT province, COUNT(*), SUM(area_ha) 
    FROM deforestation_alerts 
    GROUP BY province 
    ORDER BY SUM(area_ha) DESC
''')
print("\nBy Province:")
for row in cursor.fetchall():
    print(f"  {row[0]:20s}: {row[1]:2d} events, {row[2]:10,.2f} ha")

conn.close()
