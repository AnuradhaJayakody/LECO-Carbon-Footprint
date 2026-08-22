-- ==============================================================================
-- LECO CARBON FOOTPRINT ACCOUNTING PLATFORM - SUPABASE SCHEMA (IDEMPOTENT)
-- Compatible with PostgreSQL 14+ & Supabase Auth & Storage
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Safe ENUM Types Creation (Handles 42710 duplicate_object error safely)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
    CREATE TYPE user_role_enum AS ENUM ('super_admin', 'branch_admin', 'facility_user');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'facility_type_enum') THEN
    CREATE TYPE facility_type_enum AS ENUM (
      'Head Office', 
      'Branch', 
      'CSC', 
      'Store', 
      'Training Centre', 
      'Special Centre', 
      'Meter Factory', 
      'Substation', 
      'Other'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scope1_category_enum') THEN
    CREATE TYPE scope1_category_enum AS ENUM (
      'Stationary Combustion', 
      'Mobile Combustion', 
      'Fugitive Emissions'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scope3_category_enum') THEN
    CREATE TYPE scope3_category_enum AS ENUM (
      'Purchased Goods & Services',
      'Capital Goods',
      'Fuel-and-Energy-Related Activities',
      'Waste Generated in Operations',
      'Business Travel',
      'Employee Commuting'
    );
  END IF;
END $$;

-- 3. Facilities Table (Hierarchical: Parent Branches & Child CSCs)
CREATE TABLE IF NOT EXISTS public.facilities (
  id TEXT PRIMARY KEY DEFAULT ('fac-' || substr(md5(random()::text), 1, 8)),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  type facility_type_enum NOT NULL DEFAULT 'Branch',
  parent_id TEXT REFERENCES public.facilities(id) ON DELETE SET NULL,
  parent_name VARCHAR(255),
  is_parent BOOLEAN DEFAULT FALSE,
  location TEXT NOT NULL,
  address TEXT,
  region VARCHAR(100) DEFAULT 'Western & Southern',
  responsible_officer VARCHAR(255) NOT NULL,
  head_designation VARCHAR(255),
  officer_email VARCHAR(255) NOT NULL,
  contact_number VARCHAR(50),
  electricity_account_no VARCHAR(100),
  meter_numbers TEXT[] DEFAULT '{}',
  has_solar_pv BOOLEAN DEFAULT FALSE,
  solar_capacity_kw NUMERIC(10, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Facility Job Roles Table
CREATE TABLE IF NOT EXISTS public.facility_job_roles (
  id TEXT PRIMARY KEY DEFAULT ('jr-' || substr(md5(random()::text), 1, 8)),
  facility_id TEXT NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  role_name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. User Profiles (RBAC & Multi-Facility Access)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id TEXT PRIMARY KEY DEFAULT ('usr-' || substr(md5(random()::text), 1, 8)),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role user_role_enum NOT NULL DEFAULT 'facility_user',
  facility_id TEXT REFERENCES public.facilities(id) ON DELETE SET NULL,
  facility_name VARCHAR(255),
  assigned_facility_ids TEXT[] DEFAULT '{}',
  job_role VARCHAR(255),
  can_delete BOOLEAN DEFAULT FALSE,
  allowed_modules TEXT[] DEFAULT '{dashboard,scope1,scope2,scope3,reports,calculator}',
  department VARCHAR(255),
  contact_number VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Emission Factors Table
CREATE TABLE IF NOT EXISTS public.emission_factors (
  id TEXT PRIMARY KEY DEFAULT ('ef-' || substr(md5(random()::text), 1, 8)),
  category VARCHAR(50) NOT NULL, -- 'Scope 1', 'Scope 2', 'Scope 3'
  sub_category VARCHAR(100) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  factor NUMERIC(12, 6) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  reference_source VARCHAR(255) NOT NULL,
  year INT DEFAULT 2024,
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Scope 1 Records Table
CREATE TABLE IF NOT EXISTS public.scope1_records (
  id TEXT PRIMARY KEY DEFAULT ('s1-' || substr(md5(random()::text), 1, 8)),
  facility_id TEXT NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  facility_name VARCHAR(255) NOT NULL,
  category scope1_category_enum NOT NULL,
  source_description TEXT NOT NULL,
  fuel_type_or_gas VARCHAR(100) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  quantity NUMERIC(14, 4) NOT NULL,
  emission_factor NUMERIC(14, 6) NOT NULL,
  emission_factor_unit VARCHAR(50) NOT NULL,
  total_emissions_kg_co2e NUMERIC(16, 4) NOT NULL,
  total_emissions_tons_co2e NUMERIC(14, 6) NOT NULL,
  reporting_month VARCHAR(2) NOT NULL,
  reporting_year INT NOT NULL,
  notes TEXT,
  evidence_url TEXT,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Scope 2 Records Table
CREATE TABLE IF NOT EXISTS public.scope2_records (
  id TEXT PRIMARY KEY DEFAULT ('s2-' || substr(md5(random()::text), 1, 8)),
  facility_id TEXT NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  facility_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(100),
  meter_number VARCHAR(100),
  grid_consumption_kwh NUMERIC(14, 2) NOT NULL,
  solar_generation_kwh NUMERIC(14, 2) DEFAULT 0,
  solar_export_kwh NUMERIC(14, 2) DEFAULT 0,
  net_purchased_kwh NUMERIC(14, 2) NOT NULL,
  grid_emission_factor NUMERIC(14, 6) NOT NULL DEFAULT 0.655,
  total_emissions_kg_co2e NUMERIC(16, 4) NOT NULL,
  total_emissions_tons_co2e NUMERIC(14, 6) NOT NULL,
  solar_offset_kg_co2e NUMERIC(16, 4) DEFAULT 0,
  reporting_month VARCHAR(2) NOT NULL,
  reporting_year INT NOT NULL,
  cost_lkr NUMERIC(14, 2),
  bill_copy_url TEXT,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Scope 3 Records Table
CREATE TABLE IF NOT EXISTS public.scope3_records (
  id TEXT PRIMARY KEY DEFAULT ('s3-' || substr(md5(random()::text), 1, 8)),
  facility_id TEXT NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  facility_name VARCHAR(255) NOT NULL,
  category scope3_category_enum NOT NULL,
  activity_name VARCHAR(255) NOT NULL,
  activity_data NUMERIC(14, 4) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  emission_factor NUMERIC(14, 6) NOT NULL,
  emission_factor_unit VARCHAR(50) NOT NULL,
  total_emissions_kg_co2e NUMERIC(16, 4) NOT NULL,
  total_emissions_tons_co2e NUMERIC(14, 6) NOT NULL,
  reporting_month VARCHAR(2) NOT NULL,
  reporting_year INT NOT NULL,
  methodology TEXT,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Enable Row Level Security (RLS)
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_job_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emission_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scope1_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scope2_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scope3_records ENABLE ROW LEVEL SECURITY;

-- 11. Drop existing policies to prevent conflicts on rerun
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public and Auth Read Facilities" ON public.facilities;
  DROP POLICY IF EXISTS "Public and Auth Write Facilities" ON public.facilities;
  DROP POLICY IF EXISTS "Public and Auth Read User Profiles" ON public.user_profiles;
  DROP POLICY IF EXISTS "Public and Auth Write User Profiles" ON public.user_profiles;
  DROP POLICY IF EXISTS "Public Read Emission Factors" ON public.emission_factors;
  DROP POLICY IF EXISTS "Public Write Emission Factors" ON public.emission_factors;
  DROP POLICY IF EXISTS "Public Read Scope1" ON public.scope1_records;
  DROP POLICY IF EXISTS "Public Write Scope1" ON public.scope1_records;
  DROP POLICY IF EXISTS "Public Read Scope2" ON public.scope2_records;
  DROP POLICY IF EXISTS "Public Write Scope2" ON public.scope2_records;
  DROP POLICY IF EXISTS "Public Read Scope3" ON public.scope3_records;
  DROP POLICY IF EXISTS "Public Write Scope3" ON public.scope3_records;
END $$;

-- 12. Create permissive RLS policies for authenticated / application operations
CREATE POLICY "Public and Auth Read Facilities" ON public.facilities FOR SELECT USING (true);
CREATE POLICY "Public and Auth Write Facilities" ON public.facilities FOR ALL USING (true);

CREATE POLICY "Public and Auth Read User Profiles" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Public and Auth Write User Profiles" ON public.user_profiles FOR ALL USING (true);

CREATE POLICY "Public Read Emission Factors" ON public.emission_factors FOR SELECT USING (true);
CREATE POLICY "Public Write Emission Factors" ON public.emission_factors FOR ALL USING (true);

CREATE POLICY "Public Read Scope1" ON public.scope1_records FOR SELECT USING (true);
CREATE POLICY "Public Write Scope1" ON public.scope1_records FOR ALL USING (true);

CREATE POLICY "Public Read Scope2" ON public.scope2_records FOR SELECT USING (true);
CREATE POLICY "Public Write Scope2" ON public.scope2_records FOR ALL USING (true);

CREATE POLICY "Public Read Scope3" ON public.scope3_records FOR SELECT USING (true);
CREATE POLICY "Public Write Scope3" ON public.scope3_records FOR ALL USING (true);

-- 13. Seed Root Super Administrator
INSERT INTO public.user_profiles (
  id, email, name, role, job_role, can_delete, allowed_modules, department, is_active
) VALUES (
  'usr-root-superadmin',
  'superadmincf@leco.com',
  'LECO Corporate Super Administrator',
  'super_admin',
  'Chief Sustainability & GHG Director',
  true,
  ARRAY['dashboard', 'scope1', 'scope2', 'scope3', 'reports', 'facilities', 'users', 'factors', 'calculator', 'sync'],
  'Executive Directorate & Sustainability Management',
  true
) ON CONFLICT (email) DO UPDATE SET
  role = 'super_admin',
  can_delete = true,
  is_active = true;

-- 14. Seed Hierarchical Facilities (LECO Branches, Child CSCs & Special Centres)
-- Parents first:
INSERT INTO public.facilities (id, code, name, type, is_parent, parent_id, location, responsible_officer, officer_email, has_solar_pv, solar_capacity_kw)
VALUES 
  ('fac-br-kotte', 'LECO-BR-KT', 'Kotte Branch', 'Branch', true, null, '325 Kotte Road, Ethul Kotte', 'Mrs. Dilani Senanayake', 'dilani.s@leco.com', true, 35.0),
  ('fac-br-kelaniya', 'LECO-BR-KLN', 'Kelaniya Branch', 'Branch', true, null, 'Kandy Road, Peliyagoda', 'Eng. Rohan Samarasinghe', 'rohan.s@leco.com', true, 45.0),
  ('fac-br-moratuwa', 'LECO-BR-MRT', 'Moratuwa Branch', 'Branch', true, null, 'Galle Road, Rawathawatta', 'Mr. Kusal Fernando', 'kusal.f@leco.com', true, 40.0),
  ('fac-br-galle', 'LECO-BR-GAL', 'Galle Branch', 'Branch', true, null, 'Matara Road, Magalle, Galle', 'Eng. Chaminda Wickramasinghe', 'chaminda.w@leco.com', true, 50.0),
  ('fac-br-kalutara', 'LECO-BR-KLT', 'Kalutara Branch', 'Branch', true, null, 'Main Street, Kalutara North', 'Mr. Asanka Weerakkody', 'asanka.w@leco.com', true, 30.0),
  ('fac-br-negombo', 'LECO-BR-NGM', 'Negombo Branch', 'Branch', true, null, 'Greens Road, Negombo', 'Eng. Priyantha Dissanayake', 'priyantha.d@leco.com', true, 50.0),
  ('fac-br-nugegoda', 'LECO-BR-NGD', 'Nugegoda Branch', 'Branch', true, null, 'Stanley Thilakarathne Mawatha, Nugegoda', 'Eng. Mahen Wickramatunga', 'mahen.w@leco.com', true, 40.0),
  ('fac-ho-colombo', 'LECO-HO-01', 'LECO Head Office', 'Head Office', false, null, '411 Galle Road, Colombo 03', 'Mr. Samantha Perera', 'samantha.p@leco.com', true, 75.0),
  ('fac-tc-jaela', 'LECO-TC-JE', 'Training Center - Ja Ela', 'Training Centre', false, null, 'Ekala Road, Ja-Ela', 'Dr. Janaka Gunaratne', 'janaka.g@leco.com', true, 30.0),
  ('fac-sdmc-colombo', 'LECO-SDMC-01', 'SDMC (System Development & Maintenance Centre)', 'Special Centre', false, null, '415 Galle Road, Colombo 03', 'Eng. Tharaka Bandara', 'tharaka.b@leco.com', true, 25.0),
  ('fac-st-waskaduwa', 'LECO-ST-WSK', 'Stores - Waskaduwa', 'Store', false, null, 'Main Logistics Depot, Waskaduwa', 'Mr. Nimal Wickramasinghe', 'nimal.w@leco.com', true, 35.0),
  ('fac-st-jaela', 'LECO-ST-JE', 'Stores - Ja Ela', 'Store', false, null, 'Ekala Industrial Estate, Ja-Ela', 'Mr. Mahinda Jayasooriya', 'mahinda.j@leco.com', false, 0),
  ('fac-mf-bandaragama', 'LECO-MF-01', 'LECO Meter Testing & Assembly Factory', 'Meter Factory', false, null, 'Industrial Zone, Bandaragama', 'Eng. Ruwan Jayasuriya', 'ruwan.j@leco.com', true, 120.0)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  is_parent = EXCLUDED.is_parent,
  location = EXCLUDED.location;

-- Children CSCs:
INSERT INTO public.facilities (id, code, name, type, is_parent, parent_id, parent_name, location, responsible_officer, officer_email, has_solar_pv)
VALUES
  -- Kotte CSCs
  ('fac-csc-pitakotte', 'LECO-CSC-PKT', 'Pitakotte CSC', 'CSC', false, 'fac-br-kotte', 'Kotte Branch', 'Pitakotte Junction', 'Mr. Sarath Wijesinghe', 'sarath.w@leco.com', false),
  ('fac-csc-kolonnawa', 'LECO-CSC-KLN', 'Kolonnawa CSC', 'CSC', false, 'fac-br-kotte', 'Kotte Branch', 'Kolonnawa Road, Wellampitiya', 'Mr. Chandana Perera', 'chandana.p@leco.com', false),
  ('fac-csc-kotikawatta', 'LECO-CSC-KKW', 'Kotikawatta CSC', 'CSC', false, 'fac-br-kotte', 'Kotte Branch', 'Gothatuwa Junction', 'Mrs. Manel Fernando', 'manel.f@leco.com', false),
  -- Kelaniya CSCs
  ('fac-csc-dalugama', 'LECO-CSC-DLG', 'Dalugama CSC', 'CSC', false, 'fac-br-kelaniya', 'Kelaniya Branch', 'University Junction, Kelaniya', 'Mr. Bandula Jayakody', 'bandula.j@leco.com', false),
  ('fac-csc-mahara', 'LECO-CSC-MHR', 'Mahara CSC', 'CSC', false, 'fac-br-kelaniya', 'Kelaniya Branch', 'Kadawatha Road, Mahara', 'Mr. Lasantha Abeykoon', 'lasantha.a@leco.com', false),
  ('fac-csc-wattala', 'LECO-CSC-WTL', 'Wattala CSC', 'CSC', false, 'fac-br-kelaniya', 'Kelaniya Branch', 'Negombo Road, Wattala', 'Mrs. Kumari Mendis', 'kumari.m@leco.com', true),
  ('fac-csc-kandana', 'LECO-CSC-KND', 'Kandana CSC', 'CSC', false, 'fac-br-kelaniya', 'Kelaniya Branch', 'Station Road, Kandana', 'Mr. Sunil Pathirana', 'sunil.p@leco.com', false),
  -- Moratuwa CSCs
  ('fac-csc-moratuwa-n', 'LECO-CSC-MTN', 'Moratuwa North CSC', 'CSC', false, 'fac-br-moratuwa', 'Moratuwa Branch', 'Angulana Station Road', 'Mr. Jagath Alwis', 'jagath.a@leco.com', false),
  ('fac-csc-moratuwa-s', 'LECO-CSC-MTS', 'Moratuwa South CSC', 'CSC', false, 'fac-br-moratuwa', 'Moratuwa Branch', 'Koralawella Junction', 'Mr. Anura Senaratne', 'anura.s@leco.com', false),
  ('fac-csc-keselwatta', 'LECO-CSC-KSW', 'Keselwatta CSC', 'CSC', false, 'fac-br-moratuwa', 'Moratuwa Branch', 'Old Galle Road, Keselwatta', 'Mrs. Nilmini De Silva', 'nilmini.d@leco.com', false),
  ('fac-csc-panadura', 'LECO-CSC-PND', 'Panadura CSC', 'CSC', false, 'fac-br-moratuwa', 'Moratuwa Branch', 'Arthur V Dias Mawatha', 'Mr. Wasantha Kumara', 'wasantha.k@leco.com', true),
  -- Galle CSCs
  ('fac-csc-galle', 'LECO-CSC-GLC', 'Galle CSC', 'CSC', false, 'fac-br-galle', 'Galle Branch', 'Wakwella Road, Galle', 'Mr. Nalin Jayasundara', 'nalin.j@leco.com', false),
  ('fac-csc-hikkaduwa', 'LECO-CSC-HKD', 'Hikkaduwa CSC', 'CSC', false, 'fac-br-galle', 'Galle Branch', 'Galle Road, Hikkaduwa', 'Mr. Gamini Rathnayake', 'gamini.r@leco.com', true),
  ('fac-csc-ambalangoda', 'LECO-CSC-ABG', 'Ambalangoda CSC', 'CSC', false, 'fac-br-galle', 'Galle Branch', 'Main Street, Ambalangoda', 'Mrs. Deepthi Gunawardena', 'deepthi.g@leco.com', false),
  -- Kalutara CSCs
  ('fac-csc-kalutara', 'LECO-CSC-KLC', 'Kalutara CSC', 'CSC', false, 'fac-br-kalutara', 'Kalutara Branch', 'Temple Road, Kalutara South', 'Mr. Lalith Samaraweera', 'lalith.s@leco.com', false),
  ('fac-csc-payagala', 'LECO-CSC-PYG', 'Payagala CSC', 'CSC', false, 'fac-br-kalutara', 'Kalutara Branch', 'Galle Road, Payagala', 'Mr. Sanath Jayawardena', 'sanath.j@leco.com', false),
  ('fac-csc-aluthgama', 'LECO-CSC-ALT', 'Aluthgama CSC', 'CSC', false, 'fac-br-kalutara', 'Kalutara Branch', 'Mathugama Road, Aluthgama', 'Mrs. Kanthi Hettiarachchi', 'kanthi.h@leco.com', true),
  -- Negombo CSCs
  ('fac-csc-negombo', 'LECO-CSC-NGC', 'Negombo CSC', 'CSC', false, 'fac-br-negombo', 'Negombo Branch', 'St. Joseph Street, Negombo', 'Mr. Jude Rodrigo', 'jude.r@leco.com', false),
  ('fac-csc-seeduwa', 'LECO-CSC-SDW', 'Seeduwa CSC', 'CSC', false, 'fac-br-negombo', 'Negombo Branch', 'Katunayake Road, Seeduwa', 'Mr. Kapila Senanayake', 'kapila.s@leco.com', true),
  ('fac-csc-jaela', 'LECO-CSC-JEC', 'Ja Ela CSC', 'CSC', false, 'fac-br-negombo', 'Negombo Branch', 'Negombo Road, Ja-Ela', 'Mrs. Sharmila Warnakula', 'sharmila.w@leco.com', false),
  -- Nugegoda CSCs
  ('fac-csc-nugegoda', 'LECO-CSC-NGD-C', 'Nugegoda CSC', 'CSC', false, 'fac-br-nugegoda', 'Nugegoda Branch', 'High Level Road, Nugegoda', 'Mr. Dhammika Ranasinghe', 'dhammika.r@leco.com', false),
  ('fac-csc-boralesgamuwa', 'LECO-CSC-BRG', 'Boralesgamuwa CSC', 'CSC', false, 'fac-br-nugegoda', 'Nugegoda Branch', 'Dehiwala Road, Boralesgamuwa', 'Mr. Gamini Liyanage', 'gamini.l@leco.com', false),
  ('fac-csc-maharagama', 'LECO-CSC-MHG', 'Maharagama CSC', 'CSC', false, 'fac-br-nugegoda', 'Nugegoda Branch', 'Old Road, Maharagama', 'Mrs. Chandani Kariyawasam', 'chandani.k@leco.com', true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  parent_name = EXCLUDED.parent_name;

-- 15. Seed Emission Factors (IPCC, SLSEA, DEFRA)
INSERT INTO public.emission_factors (category, sub_category, item_name, factor, unit, reference_source, year)
VALUES
  ('Scope 1', 'Stationary Fuel', 'Diesel (Industrial Generator)', 2.6878, 'kg CO2e / Liter', 'IPCC 2006 Guidelines for National GHG Inventories', 2024),
  ('Scope 1', 'Stationary Fuel', 'Heavy Fuel Oil (Furnace Oil)', 3.1780, 'kg CO2e / Liter', 'IPCC 2006 Guidelines', 2024),
  ('Scope 1', 'Stationary Fuel', 'LPG (Liquid Petroleum Gas)', 1.5120, 'kg CO2e / Liter', 'IPCC 2006 Guidelines', 2024),
  ('Scope 1', 'Mobile Fuel', 'Diesel (Commercial Vans & Trucks)', 2.6878, 'kg CO2e / Liter', 'DEFRA / IPCC 2006 Mobile Combustion', 2024),
  ('Scope 1', 'Mobile Fuel', 'Petrol / Gasoline (Motorbikes & Cars)', 2.3149, 'kg CO2e / Liter', 'DEFRA / IPCC 2006 Mobile Combustion', 2024),
  ('Scope 1', 'Fugitive Gas', 'SF6 (Sulfur Hexafluoride - Switchgear)', 22800.0, 'kg CO2e / kg', 'IPCC AR4 / AR5 GWP Factor', 2024),
  ('Scope 1', 'Fugitive Gas', 'R410A Refrigerant', 2088.0, 'kg CO2e / kg', 'IPCC AR4 GWP Factor', 2024),
  ('Scope 1', 'Fugitive Gas', 'R134a Refrigerant', 1430.0, 'kg CO2e / kg', 'IPCC AR4 GWP Factor', 2024),
  ('Scope 2', 'Electricity Grid', 'Sri Lanka National Grid Average (CEB/LECO)', 0.6550, 'kg CO2e / kWh', 'Sri Lanka Sustainable Energy Authority (SLSEA) 2023/24 Grid Factor', 2024),
  ('Scope 3', 'Purchased Goods', 'Paper Consumption (A4 Office Ream)', 0.9500, 'kg CO2e / kg', 'DEFRA 2024 Material Use', 2024),
  ('Scope 3', 'Purchased Goods', 'Distribution Transformers (New)', 4.2000, 'kg CO2e / kg', 'LECO LCA Environmental Assessment 2023', 2024),
  ('Scope 3', 'Purchased Goods', 'Smart Electricity Meters (LHM)', 8.5000, 'kg CO2e / unit', 'LECO Meter Factory LCA Study', 2024),
  ('Scope 3', 'Waste Operations', 'Municipal Solid Waste Landfill', 0.5200, 'kg CO2e / kg', 'DEFRA 2024 Waste Disposal', 2024),
  ('Scope 3', 'Business Travel', 'Domestic Air & Road Travel (Chartered)', 0.1700, 'kg CO2e / passenger-km', 'DEFRA 2024 Business Travel', 2024),
  ('Scope 3', 'Employee Commute', 'Average Commute (Motorbike/Bus/Car blend)', 0.0890, 'kg CO2e / passenger-km', 'DEFRA 2024 Commuting Factor', 2024)
ON CONFLICT DO NOTHING;
