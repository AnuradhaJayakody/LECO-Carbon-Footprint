/// <reference types="vite/client" />

export type UserRole = 'super_admin' | 'branch_admin' | 'facility_user';

export type AppModule = 
  | 'dashboard' 
  | 'scope1' 
  | 'scope2' 
  | 'scope3' 
  | 'reports' 
  | 'facilities' 
  | 'users' 
  | 'factors' 
  | 'calculator'
  | 'sync';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  facilityId?: string; // Main branch or specific CSC
  facilityName?: string;
  assignedFacilityIds?: string[]; // Multiple branches / CSCs for branch admins
  jobRole?: string;
  canDelete?: boolean; // Granular toggle for deletion rights
  allowedModules?: AppModule[];
  department?: string;
  isActive: boolean;
  contactNumber?: string;
  createdAt: string;
  authUserId?: string; // Links to Supabase Auth UID
}

export interface JobRole {
  id: string;
  facilityId: string;
  roleName: string;
  description?: string;
}

export type FacilityType = 
  | 'Head Office' 
  | 'Branch' 
  | 'CSC' 
  | 'Store' 
  | 'Training Centre' 
  | 'Special Centre' 
  | 'Meter Factory' 
  | 'Substation' 
  | 'Other';

export interface Facility {
  id: string;
  code: string;
  name: string;
  type: FacilityType;
  parentId?: string | null; // Parent Branch ID if this is a child CSC
  parentName?: string; // Display name of parent branch
  isParent?: boolean; // True if this is a main branch that has child CSCs
  location: string;
  address?: string;
  region?: string;
  responsibleOfficer: string;
  headDesignation?: string;
  officerEmail: string;
  contactNumber?: string;
  electricityAccountNo?: string;
  meterNumbers?: string[];
  hasSolarPV?: boolean;
  solarCapacityKW?: number;
  jobRoles?: JobRole[];
  createdAt?: string;
}

// Scope 1: Direct GHG Emissions
export type Scope1Category = 
  | 'stationary_generator' 
  | 'mobile_fleet' 
  | 'fugitive_sf6' 
  | 'fugitive_refrigerant';

export interface Scope1Record {
  id: string;
  facilityId: string;
  facilityName: string;
  reportingYear: number;
  reportingMonth: number;
  category: Scope1Category;
  sourceName: string;
  fuelType?: string;
  quantity: number;
  unit: string;
  vehicleNumber?: string;
  vehicleType?: string;
  gasType?: string;
  initialChargeKg?: number;
  leakedKg?: number;
  gwp?: number;
  emissionFactorUsed?: number;
  emissionsTonsCO2e: number;
  notes?: string;
  createdById?: string;
  createdByName?: string;
  createdBy?: string;
  createdAt: string;
}

// Scope 2: Indirect Emissions from Purchased Energy
export interface Scope2Record {
  id: string;
  facilityId: string;
  facilityName: string;
  reportingYear: number;
  reportingMonth: number;
  accountNumber?: string;
  meterNumber?: string;
  gridElectricityKWh: number;
  solarGenerationKWh?: number;
  gridEmissionFactor?: number;
  emissionsTonsCO2e: number;
  solarOffsetTonsCO2e?: number;
  netEmissionsTonsCO2e?: number;
  costLKR?: number;
  notes?: string;
  createdById?: string;
  createdByName?: string;
  createdBy?: string;
  createdAt: string;
}

// Scope 3: Value Chain & Other Indirect Emissions
export type Scope3Category = 
  | 'purchased_goods' 
  | 'capital_goods' 
  | 'business_travel' 
  | 'employee_commuting' 
  | 'waste_generated' 
  | 'upstream_logistics';

export interface Scope3Record {
  id: string;
  facilityId: string;
  facilityName: string;
  reportingYear: number;
  reportingMonth: number;
  category: Scope3Category;
  itemName: string;
  supplierName?: string;
  quantity: number;
  unit: string;
  emissionFactorUsed: number;
  emissionsTonsCO2e: number;
  notes?: string;
  createdById?: string;
  createdByName?: string;
  createdBy?: string;
  createdAt: string;
}

export interface EmissionFactor {
  id: string;
  category: string; // e.g. 'Scope 1 - Stationary Diesel Generator (Backup Power)', 'Scope 2 - Grid Electricity', etc.
  scope?: 'Scope 1' | 'Scope 2' | 'Scope 3' | string;
  name: string;
  factor: number;
  unit: string;
  source: string;
  source_standard?: string;
  description?: string;
  fuel_or_material?: string;
  factor_kg_co2e?: number;
  subCategory?: string;
  referenceSource?: string;
  year?: number;
  isCustom?: boolean;
}

export interface MonthlyEmissionTrend {
  month: number;
  monthName: string;
  scope1: number;
  scope2: number;
  scope3: number;
  total: number;
  solarOffset: number;
}

export interface FacilityEmissionStat {
  facilityId: string;
  facilityName: string;
  facilityType: FacilityType;
  parentName?: string;
  scope1: number;
  scope2: number;
  scope3: number;
  total: number;
}

export interface DashboardSummary {
  reportingYear: number;
  totalEmissionsTonsCO2e: number;
  scope1TotalTons: number;
  scope2TotalTons: number;
  scope3TotalTons: number;
  solarOffsetTotalTons: number;
  facilityCount: number;
  recordsCount: number;
  monthlyTrends: MonthlyEmissionTrend[];
  facilityStats: FacilityEmissionStat[];
}
