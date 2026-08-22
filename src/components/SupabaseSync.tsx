import React, { useState } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  RefreshCw, 
  ShieldCheck, 
  ExternalLink,
  Code2,
  Terminal,
  FileCode2
} from 'lucide-react';
import { isSupabaseConfigured, testSupabaseConnection, configuredSupabaseUrl } from '../services/supabase';

export const SupabaseSync: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; error?: any } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: `Error testing connection: ${err.message || err}` });
    } finally {
      setTesting(false);
    }
  };

  const correctedSqlScript = `-- =========================================================================
-- LECO CARBON FOOTPRINT DATABASE SCHEMA (IDEMPOTENT / SUPABASE SAFE)
-- FIXES: ERROR: 42710: type "user_role_enum" already exists
-- =========================================================================

-- 1. Create Enums Safely using DO blocks
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
        CREATE TYPE user_role_enum AS ENUM ('super_admin', 'branch_admin', 'facility_user');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'facility_type_enum') THEN
        CREATE TYPE facility_type_enum AS ENUM (
            'Branch', 'CSC', 'Head Office', 'Store', 'Training Centre', 'Special Centre', 'Meter Factory', 'Other'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scope1_category_enum') THEN
        CREATE TYPE scope1_category_enum AS ENUM (
            'stationary_generator', 'mobile_fleet', 'fugitive_sf6', 'fugitive_refrigerant'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scope3_category_enum') THEN
        CREATE TYPE scope3_category_enum AS ENUM (
            'purchased_goods', 'capital_goods', 'business_travel', 'employee_commuting', 'waste_generated', 'upstream_logistics'
        );
    END IF;
END $$;

-- 2. Facilities Table (Hierarchical Branch & CSC Structure)
CREATE TABLE IF NOT EXISTS public.facilities (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    parent_id TEXT REFERENCES public.facilities(id) ON DELETE SET NULL,
    is_parent BOOLEAN DEFAULT FALSE,
    location TEXT NOT NULL,
    responsible_officer TEXT NOT NULL,
    head_designation TEXT,
    officer_email TEXT NOT NULL,
    contact_number TEXT,
    electricity_account_no TEXT,
    has_solar_pv BOOLEAN DEFAULT FALSE,
    solar_capacity_kw NUMERIC(10,2) DEFAULT 0,
    job_roles JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. User Profiles & RBAC
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id TEXT PRIMARY KEY,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'facility_user',
    facility_id TEXT REFERENCES public.facilities(id) ON DELETE SET NULL,
    assigned_facility_ids TEXT[] DEFAULT '{}',
    job_role TEXT,
    department TEXT,
    contact_number TEXT,
    can_delete BOOLEAN DEFAULT FALSE,
    allowed_modules TEXT[] DEFAULT ARRAY['dashboard', 'scope1', 'scope2', 'scope3', 'reports', 'calculator'],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Scope 1 Records (Direct GHG: Diesel, Fleet, SF6)
CREATE TABLE IF NOT EXISTS public.scope1_records (
    id TEXT PRIMARY KEY,
    facility_id TEXT NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    facility_name TEXT NOT NULL,
    reporting_year INTEGER NOT NULL,
    reporting_month INTEGER NOT NULL,
    category TEXT NOT NULL,
    source_name TEXT NOT NULL,
    fuel_type TEXT,
    quantity NUMERIC(12,3) NOT NULL,
    unit TEXT NOT NULL,
    vehicle_number TEXT,
    vehicle_type TEXT,
    gas_type TEXT,
    initial_charge_kg NUMERIC(10,3),
    leaked_kg NUMERIC(10,3),
    gwp NUMERIC(10,2),
    emission_factor_used NUMERIC(10,4),
    emissions_tons_co2e NUMERIC(12,3) NOT NULL,
    notes TEXT,
    created_by_id TEXT,
    created_by_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Scope 2 Records (CEB Grid & Rooftop Solar PV)
CREATE TABLE IF NOT EXISTS public.scope2_records (
    id TEXT PRIMARY KEY,
    facility_id TEXT NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    facility_name TEXT NOT NULL,
    reporting_year INTEGER NOT NULL,
    reporting_month INTEGER NOT NULL,
    account_number TEXT,
    meter_number TEXT,
    grid_electricity_kwh NUMERIC(12,2) NOT NULL,
    solar_generation_kwh NUMERIC(12,2) DEFAULT 0,
    grid_emission_factor NUMERIC(10,4) DEFAULT 0.582,
    emissions_tons_co2e NUMERIC(12,3) NOT NULL,
    solar_offset_tons_co2e NUMERIC(12,3) DEFAULT 0,
    net_emissions_tons_co2e NUMERIC(12,3) NOT NULL,
    cost_lkr NUMERIC(14,2),
    notes TEXT,
    created_by_id TEXT,
    created_by_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Scope 3 Records (Value Chain)
CREATE TABLE IF NOT EXISTS public.scope3_records (
    id TEXT PRIMARY KEY,
    facility_id TEXT NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    facility_name TEXT NOT NULL,
    reporting_year INTEGER NOT NULL,
    reporting_month INTEGER NOT NULL,
    category TEXT NOT NULL,
    item_name TEXT NOT NULL,
    supplier_name TEXT,
    quantity NUMERIC(12,3) NOT NULL,
    unit TEXT NOT NULL,
    emission_factor_used NUMERIC(12,6) NOT NULL,
    emissions_tons_co2e NUMERIC(12,3) NOT NULL,
    notes TEXT,
    created_by_id TEXT,
    created_by_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scope1_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scope2_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scope3_records ENABLE ROW LEVEL SECURITY;

-- Permissive Development Policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public Full Access Facilities" ON public.facilities;
    CREATE POLICY "Public Full Access Facilities" ON public.facilities FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access User Profiles" ON public.user_profiles;
    CREATE POLICY "Public Full Access User Profiles" ON public.user_profiles FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access Scope1" ON public.scope1_records;
    CREATE POLICY "Public Full Access Scope1" ON public.scope1_records FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access Scope2" ON public.scope2_records;
    CREATE POLICY "Public Full Access Scope2" ON public.scope2_records FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access Scope3" ON public.scope3_records;
    CREATE POLICY "Public Full Access Scope3" ON public.scope3_records FOR ALL USING (true) WITH CHECK (true);
END $$;`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(correctedSqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
            <Database className="w-4 h-4" />
            <span>Supabase Cloud PostgreSQL Database & Schema</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Supabase Project Integration & SQL Schema
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronize LECO user accounts, hierarchical facility trees, and Scope 1-3 emission logs with Supabase Cloud PostgreSQL.
          </p>
        </div>

        <button
          onClick={handleTestConnection}
          disabled={testing}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
          <span>{testing ? 'Verifying...' : 'Test Connection'}</span>
        </button>
      </div>

      {/* Connection Status Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Cloud Infrastructure Status
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Supabase Client Status</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2.5 h-2.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-blue-500'}`} />
              <strong className="text-sm text-slate-800">
                {isSupabaseConfigured ? 'Cloud Connection Active' : 'Local Enterprise Store Active'}
              </strong>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 truncate">
              {configuredSupabaseUrl || 'Running with built-in high-performance local database store'}
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Idempotent Schema Guard</span>
            <div className="flex items-center gap-2 mt-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <strong className="text-sm text-slate-800">Enum Duplicate Safe</strong>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Guards against <code className="bg-slate-200 px-1 rounded text-rose-700 font-mono">ERROR: 42710</code> using <code className="bg-slate-200 px-1 rounded font-mono">DO $$</code> checks.
            </div>
          </div>
        </div>

        {testResult && (
          <div className={`p-4 rounded-xl text-xs flex items-start gap-3 border ${
            testResult.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-900 border-amber-200'
          }`}>
            {testResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-bold block text-sm">{testResult.success ? 'Success' : 'Connection Report'}:</span>
              <p className="mt-0.5">{testResult.message}</p>
            </div>
          </div>
        )}
      </div>

      {/* SQL Script Viewer */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Corrected supabase_schema.sql Script</span>
          </div>

          <button
            onClick={copyToClipboard}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
          </button>
        </div>

        <div className="p-4 bg-slate-950 text-slate-300 font-mono text-[11px] max-h-96 overflow-y-auto leading-relaxed">
          <pre>{correctedSqlScript}</pre>
        </div>
      </div>

    </div>
  );
};
