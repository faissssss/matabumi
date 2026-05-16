#!/usr/bin/env python3
"""
Fix Supabase RLS for deforestation_alerts table
Enables RLS and adds public read policy
"""
import os
import psycopg2

SUPABASE_URL = os.getenv("SUPABASE_DB_URL")

if not SUPABASE_URL:
    raise ValueError(
        "SUPABASE_DB_URL environment variable not set!\n"
        "Set it with: export SUPABASE_DB_URL='postgresql://...'"
    )


def fix_rls():
    print("🔒 Fixing Supabase RLS for deforestation_alerts...\n")
    
    conn = psycopg2.connect(SUPABASE_URL)
    cursor = conn.cursor()
    
    try:
        # Step 1: Enable RLS
        print("1️⃣ Enabling Row Level Security...")
        cursor.execute("""
            ALTER TABLE public.deforestation_alerts 
            ENABLE ROW LEVEL SECURITY;
        """)
        print("   ✅ RLS enabled\n")
        
        # Step 2: Drop existing policies if any (to avoid conflicts)
        print("2️⃣ Cleaning up old policies...")
        cursor.execute("""
            DROP POLICY IF EXISTS deforestation_alerts_public_read 
            ON public.deforestation_alerts;
        """)
        cursor.execute("""
            DROP POLICY IF EXISTS deforestation_alerts_service_insert 
            ON public.deforestation_alerts;
        """)
        print("   ✅ Old policies removed\n")
        
        # Step 3: Create public read policy
        print("3️⃣ Creating public read policy...")
        cursor.execute("""
            CREATE POLICY deforestation_alerts_public_read 
            ON public.deforestation_alerts 
            FOR SELECT 
            TO anon, authenticated 
            USING (true);
        """)
        print("   ✅ Public read policy created\n")
        
        # Step 4: Create service insert policy
        print("4️⃣ Creating service insert policy...")
        cursor.execute("""
            CREATE POLICY deforestation_alerts_service_insert 
            ON public.deforestation_alerts 
            FOR INSERT 
            TO authenticated 
            WITH CHECK (true);
        """)
        print("   ✅ Service insert policy created\n")
        
        conn.commit()
        
        # Verify
        print("5️⃣ Verifying policies...")
        cursor.execute("""
            SELECT schemaname, tablename, policyname, permissive, roles, cmd
            FROM pg_policies 
            WHERE tablename = 'deforestation_alerts';
        """)
        policies = cursor.fetchall()
        
        print(f"   ✅ Found {len(policies)} policies:")
        for policy in policies:
            print(f"      - {policy[2]}: {policy[5]} for {policy[4]}")
        
        print("\n✅ RLS configuration complete! 🎉")
        print("\nYour table is now:")
        print("  ✅ Protected by RLS")
        print("  ✅ Publicly readable (anon + authenticated)")
        print("  ✅ Writable by service role")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    fix_rls()
