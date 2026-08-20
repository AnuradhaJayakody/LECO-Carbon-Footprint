-- ==============================================================================
-- LECO CARBON FOOTPRINT ACCOUNTING SYSTEM - SUPABASE POSTGRESQL SCHEMA
-- Lanka Electricity Company (Pvt) Ltd
-- Standard: GHG Protocol Corporate Standard & ISO 14064-1
-- ==============================================================================

-- 1. Create Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Enumerated Types
CREATE TYPE user_role_enum AS ENUM ('super_admin', 'facility_officer', 'sustainability_lead', 'auditor');
CREATE TYPE facility_type_enum AS ENUM ('Head Office', 'Branch', 'CSC', 'Store', 'Training Centre', 'Meter Factory', 'Substation', 'Other');
CREATE TYPE submission_status_enum AS ENUM ('Draft', 'Submitted', 'Verified', 'Approved', 'Requires Clarification');

-- 3. Facilities Table
CREATE TABLE IF NOT EXISTS public.facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    type facility_type_enum NOT NULL DEFAULT 'Branch',
    location VARCHAR(200) NOT NULL,
    responsible_officer VARCHAR(100) NOT NULL,
    officer_email VARCHAR(120),
    contact_number VARCHAR(50),
    electricity_account_no VARCHAR(50),
    meter_numbers TEXT[],
    has_solar_pv BOOLEAN DEFAULT false,
    solar_capacity_kw NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. User Profiles Table (Synced with Supabase auth.users or internal users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE,
    email VARCHAR(150) UNIQUE NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'facility_officer',
    facility_id UUID REFERENCES public.facilities(id) ON DELETE SET NULL,
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Centralized Emission Factors Library
CREATE TABLE IF NOT EXISTS public.emission_factors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(60) NOT NULL,
    fuel_or_material VARCHAR(120) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    factor_kg_co2e NUMERIC(12, 6) NOT NULL,
    source_standard VARCHAR(150) NOT NULL,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- SCOPE 1: DIRECT GHG EMISSIONS
-- ==============================================================================

-- Scope 1: Vehicle Fuel Consumption
CREATE TABLE IF NOT EXISTS public.scope1_vehicle_emissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
    reporting_year INT NOT NULL,
    month VARCHAR(20) NOT NULL,
    responsible_officer VARCHAR(100) NOT NULL,
    vehicle_no VARCHAR(50) NOT NULL,
    vehicle_type VARCHAR(60) NOT NULL,
    fuel_type VARCHAR(50) NOT NULL,
    quantity_liters NUMERIC(12, 2) NOT NULL,
    distance_km NUMERIC(10, 2) DEFAULT 0,
    fuel_card_no VARCHAR(50),
    emission_factor_kg_per_l NUMERIC(8, 4) NOT NULL DEFAULT 2.68,
    calculated_kg_co2e NUMERIC(14, 2) NOT NULL,
    calculated_t_co2e NUMERIC(12, 4) NOT NULL,
    status submission_status_enum DEFAULT 'Submitted',
    remarks TEXT,
    supporting_doc_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scope 1: Generator Fuel Consumption
CREATE TABLE IF NOT EXISTS public.scope1_generator_emissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
    reporting_year INT NOT NULL,
    month VARCHAR(20) NOT NULL,
    responsible_officer VARCHAR(100) NOT NULL,
    generator_id VARCHAR(60) NOT NULL,
    capacity_kva NUMERIC(10, 2) NOT NULL,
    fuel_type VARCHAR(40) NOT NULL DEFAULT 'Diesel',
    quantity_liters NUMERIC(12, 2) NOT NULL,
    operating_hours NUMERIC(10, 2) NOT NULL DEFAULT 0,
    maintenance_type VARCHAR(100),
    emission_factor_kg_per_l NUMERIC(8, 4) NOT NULL DEFAULT 2.68,
    calculated_kg_co2e NUMERIC(14, 2) NOT NULL,
    calculated_t_co2e NUMERIC(12, 4) NOT NULL,
    status submission_status_enum DEFAULT 'Submitted',
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scope 1: LPG & Stationary Fuel
CREATE TABLE IF NOT EXISTS public.scope1_stationary_fuel_emissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
    reporting_year INT NOT NULL,
    month VARCHAR(20) NOT NULL,
    responsible_officer VARCHAR(100) NOT NULL,
    item_equipment VARCHAR(100) NOT NULL,
    fuel_type VARCHAR(60) NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'kg',
    emission_factor_kg_per_unit NUMERIC(8, 4) NOT NULL DEFAULT 2.98,
    calculated_kg_co2e NUMERIC(14, 2) NOT NULL,
    calculated_t_co2e NUMERIC(12, 4) NOT NULL,
    status submission_status_enum DEFAULT 'Submitted',
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scope 1: Refrigerant Fugitive Emissions
CREATE TABLE IF NOT EXISTS public.scope1_refrigerant_emissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
    reporting_year INT NOT NULL,
    month VARCHAR(20) NOT NULL,
    responsible_officer VARCHAR(100) NOT NULL,
    equipment_type VARCHAR(80) NOT NULL,
    equipment_location VARCHAR(120),
    equipment_count INT DEFAULT 1,
    refrigerant_type VARCHAR(40) NOT NULL,
    quantity_refilled_kg NUMERIC(10, 2) NOT NULL,
    reason_for_refill VARCHAR(100) DEFAULT 'Routine Maintenance',
    gwp_factor NUMERIC(10, 2) NOT NULL,
    calculated_kg_co2e NUMERIC(14, 2) NOT NULL,
    calculated_t_co2e NUMERIC(12, 4) NOT NULL,
    status submission_status_enum DEFAULT 'Submitted',
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scope 1: SF6 Emissions from Electrical Equipment
CREATE TABLE IF NOT EXISTS public.scope1_sf6_emissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
    reporting_year INT NOT NULL,
    month VARCHAR(20) NOT NULL,
    responsible_officer VARCHAR(100) NOT NULL,
    equipment_id VARCHAR(80) NOT NULL,
    equipment_type VARCHAR(80) NOT NULL,
    voltage_level_kv VARCHAR(40) NOT NULL,
    nameplate_capacity_kg NUMERIC(10, 2) NOT NULL,
    beginning_inventory_kg NUMERIC(10, 2) DEFAULT 0,
    inventory_purchased_refilled_kg NUMERIC(10, 2) DEFAULT 0,
    inventory_recovered_kg NUMERIC(10, 2) DEFAULT 0,
    ending_inventory_kg NUMERIC(10, 2) DEFAULT 0,
    net_loss_kg NUMERIC(10, 2) NOT NULL,
    gwp_factor NUMERIC(10, 2) NOT NULL DEFAULT 23500,
    calculated_kg_co2e NUMERIC(16, 2) NOT NULL,
    calculated_t_co2e NUMERIC(14, 4) NOT NULL,
    status submission_status_enum DEFAULT 'Submitted',
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- SCOPE 2: INDIRECT EMISSIONS (PURCHASED ELECTRICITY & SOLAR)
-- ==============================================================================

-- Scope 2: Grid Electricity
CREATE TABLE IF NOT EXISTS public.scope2_electricity_emissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
    reporting_year INT NOT NULL,
    month VARCHAR(20) NOT NULL,
    responsible_officer VARCHAR(100) NOT NULL,
    account_number VARCHAR(60) NOT NULL,
    meter_number VARCHAR(60) NOT NULL,
    tariff_category VARCHAR(60),
    consumed_kwh NUMERIC(14, 2) NOT NULL,
    billed_amount_lkr NUMERIC(14, 2),
    grid_emission_factor_kg_per_kwh NUMERIC(8, 4) NOT NULL DEFAULT 0.655,
    calculated_kg_co2e NUMERIC(16, 2) NOT NULL,
    calculated_t_co2e NUMERIC(14, 4) NOT NULL,
    status submission_status_enum DEFAULT 'Submitted',
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scope 2: On-site Solar PV Generation
CREATE TABLE IF NOT EXISTS public.scope2_solar_generation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
    reporting_year INT NOT NULL,
    month VARCHAR(20) NOT NULL,
    responsible_officer VARCHAR(100) NOT NULL,
    system_capacity_kw NUMERIC(10, 2) NOT NULL,
    solar_generated_kwh NUMERIC(14, 2) NOT NULL,
    self_consumed_kwh NUMERIC(14, 2) NOT NULL,
    exported_to_grid_kwh NUMERIC(14, 2) DEFAULT 0,
    imported_from_grid_kwh NUMERIC(14, 2) DEFAULT 0,
    avoided_emissions_t_co2e NUMERIC(12, 4) NOT NULL,
    net_purchased_kwh NUMERIC(14, 2) NOT NULL,
    net_scope2_emissions_t_co2e NUMERIC(12, 4) NOT NULL,
    status submission_status_enum DEFAULT 'Submitted',
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- SCOPE 3: VALUE CHAIN GHG EMISSIONS
-- ==============================================================================

-- Scope 3: Purchased Goods and Services
CREATE TABLE IF NOT EXISTS public.scope3_purchased_goods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
    reporting_year INT NOT NULL,
    month VARCHAR(20) NOT NULL,
    responsible_officer VARCHAR(100) NOT NULL,
    category VARCHAR(80) NOT NULL,
    item_description VARCHAR(200) NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL DEFAULT 1,
    unit VARCHAR(30) DEFAULT 'Nos',
    supplier_name VARCHAR(150),
    value_lkr NUMERIC(16, 2) NOT NULL,
    spend_emission_factor_kg_per_1000lkr NUMERIC(10, 4) NOT NULL DEFAULT 0.45,
    calculated_kg_co2e NUMERIC(16, 2) NOT NULL,
    calculated_t_co2e NUMERIC(14, 4) NOT NULL,
    status submission_status_enum DEFAULT 'Submitted',
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scope 3: Capital Goods
CREATE TABLE IF NOT EXISTS public.scope3_capital_goods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
    reporting_year INT NOT NULL,
    month VARCHAR(20) NOT NULL,
    responsible_officer VARCHAR(100) NOT NULL,
    asset_name VARCHAR(180) NOT NULL,
    asset_type VARCHAR(100) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    supplier VARCHAR(150),
    value_lkr NUMERIC(16, 2) NOT NULL,
    depreciation_years INT DEFAULT 15,
    spend_emission_factor_kg_per_1000lkr NUMERIC(10, 4) NOT NULL DEFAULT 0.52,
    calculated_kg_co2e NUMERIC(16, 2) NOT NULL,
    calculated_t_co2e NUMERIC(14, 4) NOT NULL,
    status submission_status_enum DEFAULT 'Submitted',
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scope 3: Construction & Infrastructure
CREATE TABLE IF NOT EXISTS public.scope3_construction_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
    reporting_year INT NOT NULL,
    month VARCHAR(20) NOT NULL,
    responsible_officer VARCHAR(100) NOT NULL,
    project_name VARCHAR(200) NOT NULL,
    project_type VARCHAR(100) NOT NULL,
    contractor_name VARCHAR(150),
    construction_period_months INT DEFAULT 6,
    project_value_lkr NUMERIC(16, 2) NOT NULL,
    major_materials_summary TEXT,
    calculated_kg_co2e NUMERIC(16, 2) NOT NULL,
    calculated_t_co2e NUMERIC(14, 4) NOT NULL,
    status submission_status_enum DEFAULT 'Submitted',
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scope 3: Upstream Transportation
CREATE TABLE IF NOT EXISTS public.scope3_upstream_freight (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
    reporting_year INT NOT NULL,
    month VARCHAR(20) NOT NULL,
    responsible_officer VARCHAR(100) NOT NULL,
    material_description VARCHAR(200) NOT NULL,
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    weight_tonnes NUMERIC(10, 2) NOT NULL,
    distance_km NUMERIC(10, 2) NOT NULL,
    transport_mode VARCHAR(60) NOT NULL,
    emission_factor_kg_per_tonne_km NUMERIC(8, 4) NOT NULL DEFAULT 0.162,
    calculated_kg_co2e NUMERIC(16, 2) NOT NULL,
    calculated_t_co2e NUMERIC(14, 4) NOT NULL,
    status submission_status_enum DEFAULT 'Submitted',
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scope 3: Waste Generated in Operations
CREATE TABLE IF NOT EXISTS public.scope3_waste_operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
    reporting_year INT NOT NULL,
    month VARCHAR(20) NOT NULL,
    responsible_officer VARCHAR(100) NOT NULL,
    waste_type VARCHAR(80) NOT NULL,
    quantity_kg NUMERIC(12, 2) NOT NULL,
    disposal_method VARCHAR(80) NOT NULL,
    contractor_name VARCHAR(120),
    emission_factor_kg_per_kg NUMERIC(8, 4) NOT NULL DEFAULT 0.58,
    calculated_kg_co2e NUMERIC(16, 2) NOT NULL,
    calculated_t_co2e NUMERIC(14, 4) NOT NULL,
    status submission_status_enum DEFAULT 'Submitted',
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scope 3: Business Travel & Employee Commuting
CREATE TABLE IF NOT EXISTS public.scope3_business_travel_commute (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
    reporting_year INT NOT NULL,
    month VARCHAR(20) NOT NULL,
    responsible_officer VARCHAR(100) NOT NULL,
    travel_category VARCHAR(50) NOT NULL DEFAULT 'Business Travel',
    purpose_or_employee_group VARCHAR(150) NOT NULL,
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    transport_mode VARCHAR(60) NOT NULL,
    number_of_trips INT NOT NULL DEFAULT 1,
    distance_km_per_trip NUMERIC(10, 2) NOT NULL,
    total_passenger_km NUMERIC(12, 2) NOT NULL,
    emission_factor_kg_per_passenger_km NUMERIC(8, 4) NOT NULL,
    calculated_kg_co2e NUMERIC(16, 2) NOT NULL,
    calculated_t_co2e NUMERIC(14, 4) NOT NULL,
    status submission_status_enum DEFAULT 'Submitted',
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scope 3: Electricity Distribution Technical & Commercial Losses
CREATE TABLE IF NOT EXISTS public.scope3_distribution_losses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
    reporting_year INT NOT NULL,
    month VARCHAR(20) NOT NULL,
    responsible_officer VARCHAR(100) NOT NULL,
    electricity_received_mwh NUMERIC(16, 2) NOT NULL,
    leco_own_consumption_mwh NUMERIC(14, 2) NOT NULL,
    electricity_billed_mwh NUMERIC(16, 2) NOT NULL,
    distribution_loss_mwh NUMERIC(14, 2) NOT NULL,
    loss_percentage NUMERIC(6, 2) NOT NULL,
    grid_emission_factor_t_per_mwh NUMERIC(8, 4) NOT NULL DEFAULT 0.655,
    calculated_kg_co2e NUMERIC(18, 2) NOT NULL,
    calculated_t_co2e NUMERIC(16, 4) NOT NULL,
    status submission_status_enum DEFAULT 'Submitted',
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- INITIAL SEED DATA FOR LECO FACILITIES & SUPER ADMIN
-- ==============================================================================

-- Seed Facilities
INSERT INTO public.facilities (id, code, name, type, location, responsible_officer, officer_email, contact_number, electricity_account_no, meter_numbers, has_solar_pv, solar_capacity_kw)
VALUES 
('11111111-1111-1111-1111-111111111111', 'LECO-HO-01', 'LECO Head Office', 'Head Office', 'Kollupitiya, Colombo 03', 'Mr. Samantha Perera', 'samantha.p@leco.com', '+94 11 237 1665', 'ACC-010-9882', ARRAY['MTR-COL-001', 'MTR-COL-002'], true, 75.0),
('22222222-2222-2222-2222-222222222222', 'LECO-MF-01', 'LECO Meter Testing & Assembly Factory', 'Meter Factory', 'Bandaragama, Kalutara', 'Eng. Ruwan Jayasuriya', 'ruwan.j@leco.com', '+94 38 229 4410', 'ACC-038-7711', ARRAY['MTR-MF-101'], true, 120.0),
('33333333-3333-3333-3333-333333333333', 'LECO-BR-KT', 'Kotte Branch & Operations Centre', 'Branch', 'Ethul Kotte, Kotte', 'Mrs. Dilani Senanayake', 'dilani.s@leco.com', '+94 11 286 5520', 'ACC-011-3341', ARRAY['MTR-KT-09'], false, 0.0),
('44444444-4444-4444-4444-444444444444', 'LECO-BR-MR', 'Moratuwa Branch Office', 'Branch', 'Rawathawatta, Moratuwa', 'Mr. Kusal Fernando', 'kusal.f@leco.com', '+94 11 264 5890', 'ACC-011-4567', ARRAY['MTR-MR-22'], true, 40.0),
('55555555-5555-5555-5555-555555555555', 'LECO-BR-KL', 'Kalutara Branch & Customer Centre', 'Branch', 'Main Street, Kalutara North', 'Mr. Asanka Weerakkody', 'asanka.w@leco.com', '+94 34 222 3450', 'ACC-034-8890', ARRAY['MTR-KL-05'], true, 30.0),
('66666666-6666-6666-6666-666666666666', 'LECO-BR-NG', 'Negombo Branch & CSC', 'Branch', 'Greens Road, Negombo', 'Eng. Priyantha Dissanayake', 'priyantha.d@leco.com', '+94 31 223 8812', 'ACC-031-1029', ARRAY['MTR-NG-44'], true, 50.0),
('77777777-7777-7777-7777-777777777777', 'LECO-ST-01', 'Central Logistics & Materials Store', 'Store', 'Kotikawatta, Colombo', 'Mr. Nimal Wickramasinghe', 'nimal.w@leco.com', '+94 11 257 9901', 'ACC-011-8812', ARRAY['MTR-ST-01'], false, 0.0),
('88888888-8888-8888-8888-888888888888', 'LECO-TC-01', 'LECO Technical Training Centre', 'Training Centre', 'Panadura', 'Dr. Janaka Gunaratne', 'janaka.g@leco.com', '+94 38 223 1190', 'ACC-038-4422', ARRAY['MTR-TC-01'], true, 25.0)
ON CONFLICT (code) DO NOTHING;

-- Seed Default Emission Factors
INSERT INTO public.emission_factors (category, fuel_or_material, unit, factor_kg_co2e, source_standard, notes)
VALUES
('Scope 1 Fuel', 'Auto Diesel', 'Liters', 2.6800, 'IPCC 2006 / DEFRA 2024', 'Standard transport & generator diesel'),
('Scope 1 Fuel', 'Super Diesel', 'Liters', 2.6900, 'DEFRA 2024', 'Low sulfur auto diesel'),
('Scope 1 Fuel', 'Petrol (Gasoline)', 'Liters', 2.3100, 'IPCC 2006 / DEFRA 2024', 'Regular 92 / 95 octane'),
('Scope 1 Fuel', 'LPG (Commercial 37.5kg)', 'kg', 2.9800, 'GHG Protocol Stationary Fuel', 'Stationary canteen and workshop heating'),
('Scope 1 Fuel', 'LPG (12.5kg)', 'kg', 2.9800, 'GHG Protocol Stationary Fuel', 'Domestic cylinders in facilities'),
('Scope 1 Fuel', 'Kerosene', 'Liters', 2.5400, 'IPCC 2006', 'Stationary heating / testing'),
('Scope 1 Refrigerant', 'R-22', 'kg', 1810.0000, 'IPCC AR4 / Montreal Protocol', 'HCFC Ozone-depleting refrigerant'),
('Scope 1 Refrigerant', 'R-410A', 'kg', 2088.0000, 'IPCC AR4', 'Modern VRF and Inverter AC units'),
('Scope 1 Refrigerant', 'R-134a', 'kg', 1430.0000, 'IPCC AR4', 'Automotive AC & Water Chillers'),
('Scope 1 Refrigerant', 'R-32', 'kg', 675.0000, 'IPCC AR5', 'Low-GWP split AC units'),
('Scope 1 Refrigerant', 'R-407C', 'kg', 1774.0000, 'IPCC AR4', 'Commercial HVAC packages'),
('Scope 1 SF6', 'SF6 (Sulfur Hexafluoride)', 'kg', 23500.0000, 'IPCC AR5 / GHG Protocol', 'High voltage switchgear insulation gas'),
('Scope 2 Grid', 'Sri Lanka CEB/LECO Grid Electricity', 'kWh', 0.6550, 'SLSEA / CEB Grid Emission Factor', 'Combined Margin Factor for Sri Lanka Grid'),
('Scope 3 Spend', 'Transformers & Electrical Plant', 'LKR 1,000', 0.5200, 'DEFRA CEDA EEIO Spend Model', 'Capital distribution equipment'),
('Scope 3 Spend', 'Cables, Wires & Hardware', 'LKR 1,000', 0.4800, 'DEFRA CEDA EEIO Spend Model', 'Copper, aluminum, polymeric conduits'),
('Scope 3 Spend', 'Civil Works & Construction', 'LKR 1,000', 0.3800, 'DEFRA CEDA EEIO Spend Model', 'Concrete, steel, civil contracting'),
('Scope 3 Transport', 'Heavy Diesel Truck Freight (14t+)', 'tonne-km', 0.1620, 'GLEC Framework / DEFRA', 'Bulk material transport to stores/sites'),
('Scope 3 Transport', 'Medium Truck Freight (7.5t)', 'tonne-km', 0.2450, 'GLEC Framework / DEFRA', 'Inter-branch store transfers'),
('Scope 3 Waste', 'Mixed Waste to Landfill', 'kg', 0.5800, 'IPCC Waste Model', 'Unsegregated municipal waste'),
('Scope 3 Waste', 'Scrap Metal Recycled', 'kg', -0.2200, 'Circular Economy Avoided Factor', 'Copper, aluminum credited avoidance'),
('Scope 3 Travel', 'Domestic Air Flight', 'passenger-km', 0.1550, 'ICAO Carbon Calculator', 'Business travel domestic'),
('Scope 3 Travel', 'International Air Flight', 'passenger-km', 0.1020, 'ICAO Carbon Calculator', 'Short/Long haul overseas tech training'),
('Scope 3 Travel', 'Company Car / Hired Vehicle', 'km', 0.1710, 'DEFRA 2024', 'Staff business travel'),
('Scope 3 Travel', 'Public Bus', 'passenger-km', 0.0420, 'DEFRA 2024', 'Staff commuting survey factor'),
('Scope 3 Travel', 'Train', 'passenger-km', 0.0350, 'DEFRA 2024', 'Staff commuting survey factor'),
('Scope 3 Travel', 'Motorcycle', 'km', 0.1030, 'DEFRA 2024', 'Field officers daily commuting')
ON CONFLICT DO NOTHING;

-- Seed Super Admin user profile
INSERT INTO public.user_profiles (email, full_name, role, department)
VALUES ('superadmincf@leco.com', 'LECO Carbon Footprint Lead (Super Admin)', 'super_admin', 'Corporate Sustainability & Engineering')
ON CONFLICT (email) DO NOTHING;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emission_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scope1_vehicle_emissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scope1_generator_emissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scope1_stationary_fuel_emissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scope1_refrigerant_emissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scope1_sf6_emissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scope2_electricity_emissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scope2_solar_generation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scope3_purchased_goods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scope3_capital_goods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scope3_construction_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scope3_upstream_freight ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scope3_waste_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scope3_business_travel_commute ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scope3_distribution_losses ENABLE ROW LEVEL SECURITY;

-- Allow authenticated employees full access according to their role
CREATE POLICY "Public read for facilities" ON public.facilities FOR SELECT USING (true);
CREATE POLICY "Super admin full facility access" ON public.facilities FOR ALL USING (true);
CREATE POLICY "Public read for emission factors" ON public.emission_factors FOR SELECT USING (true);
CREATE POLICY "Super admin emission factors edit" ON public.emission_factors FOR ALL USING (true);
CREATE POLICY "Scope1 vehicles all access" ON public.scope1_vehicle_emissions FOR ALL USING (true);
CREATE POLICY "Scope1 generators all access" ON public.scope1_generator_emissions FOR ALL USING (true);
CREATE POLICY "Scope1 stationary all access" ON public.scope1_stationary_fuel_emissions FOR ALL USING (true);
CREATE POLICY "Scope1 refrigerant all access" ON public.scope1_refrigerant_emissions FOR ALL USING (true);
CREATE POLICY "Scope1 sf6 all access" ON public.scope1_sf6_emissions FOR ALL USING (true);
CREATE POLICY "Scope2 electricity all access" ON public.scope2_electricity_emissions FOR ALL USING (true);
CREATE POLICY "Scope2 solar all access" ON public.scope2_solar_generation FOR ALL USING (true);
CREATE POLICY "Scope3 goods all access" ON public.scope3_purchased_goods FOR ALL USING (true);
CREATE POLICY "Scope3 capital all access" ON public.scope3_capital_goods FOR ALL USING (true);
CREATE POLICY "Scope3 construction all access" ON public.scope3_construction_projects FOR ALL USING (true);
CREATE POLICY "Scope3 freight all access" ON public.scope3_upstream_freight FOR ALL USING (true);
CREATE POLICY "Scope3 waste all access" ON public.scope3_waste_operations FOR ALL USING (true);
CREATE POLICY "Scope3 travel all access" ON public.scope3_business_travel_commute FOR ALL USING (true);
CREATE POLICY "Scope3 distribution loss all access" ON public.scope3_distribution_losses FOR ALL USING (true);
