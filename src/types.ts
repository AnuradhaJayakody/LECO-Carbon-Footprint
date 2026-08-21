/**
 * LECO Carbon Footprint Accounting Platform
 * Core TypeScript Type Definitions based on GHG Protocol Standard
 */

export type UserRole = 'super_admin' | 'branch_admin' | 'facility_user' | 'facility_officer' | 'sustainability_lead' | 'auditor';

export interface FacilityJobRole {
  id: string;
  facilityId: string;
  roleName: string;
  description?: string;
  createdAt?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  jobRole?: string; // Specific job title assigned from the facility's dynamic job roles
  facilityId?: string; // Assigned primary facility for facility_user
  facilityName?: string;
  assignedFacilityIds?: string[]; // Multiple facilities assigned to a branch_admin
  canDelete: boolean; // Granular toggle for deletion capability across the platform
  allowedModules?: string[]; // Granular modules for branch_admin (e.g., ['dashboard', 'scope1', 'scope2', 'scope3', 'reports', 'facilities', 'users', 'calculator'])
  isImmutableRootAdmin?: boolean; // Root superadmin protection flag
  isActive?: boolean;
  department?: string;
  contactNumber?: string;
  createdAt?: string;
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
  staffCount?: number;
  floorAreaSqFt?: number;
  responsibleOfficer: string; // Head of Facility / Person Responsible
  officerEmail?: string;
  contactNumber?: string;
  headDesignation?: string;
  jobRoles?: FacilityJobRole[]; // Dynamically defined job roles for this facility
  electricityAccountNo?: string;
  meterNumbers?: string[];
  hasSolarPV?: boolean;
  solarCapacityKW?: number;
  createdAt?: string;
}

export interface EmissionFactor {
  id: string;
  name: string;
  category: string;
  unit: string;
  factorKgCO2e: number;
  source: string;
  notes?: string;
}

export type ReportingMonth = 
  | 'January' | 'February' | 'March' | 'April' | 'May' | 'June'
  | 'July' | 'August' | 'September' | 'October' | 'November' | 'December';

export type SubmissionStatus = 'Draft' | 'Submitted' | 'Verified' | 'Approved' | 'Requires Clarification';

export interface BaseRecord {
  id: string;
  facilityId: string;
  facilityName: string;
  reportingYear: number;
  month: ReportingMonth;
  responsibleOfficer: string;
  status: SubmissionStatus;
  remarks?: string;
  supportingDocName?: string;
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------
// SCOPE 1: DIRECT EMISSIONS
// ----------------------------------------------------

export type VehicleFuelType = 'Petrol (Gasoline)' | 'Auto Diesel' | 'Super Diesel' | 'Hybrid (Petrol)' | 'EV';
export type VehicleCategory = 'Lorry / Heavy Truck' | 'Double Cab / Pickup' | 'Van' | 'Car / Jeep' | 'Motorcycle' | 'Special Utility Vehicle';

export interface Scope1VehicleRecord extends BaseRecord {
  vehicleNo: string;
  vehicleType: VehicleCategory;
  fuelType: VehicleFuelType;
  quantityLiters: number;
  distanceKm?: number;
  fuelCardNo?: string;
  emissionFactorKgPerL: number;
  calculatedKgCO2e: number;
  calculatedTCO2e: number;
}

export type GeneratorFuelType = 'Diesel' | 'Petrol';

export interface Scope1GeneratorRecord extends BaseRecord {
  generatorId: string;
  capacityKVA: number;
  fuelType: GeneratorFuelType;
  quantityLiters: number;
  operatingHours: number;
  maintenanceType?: string;
  emissionFactorKgPerL: number;
  calculatedKgCO2e: number;
  calculatedTCO2e: number;
}

export type StationaryFuelType = 'LPG (Commercial 37.5kg)' | 'LPG (12.5kg)' | 'Kerosene' | 'Furnace Oil' | 'Industrial LPG';

export interface Scope1StationaryFuelRecord extends BaseRecord {
  itemEquipment: string; // Canteen, Laboratory, Workshop furnace
  fuelType: StationaryFuelType;
  quantity: number;
  unit: 'kg' | 'Liters';
  emissionFactorKgPerUnit: number;
  calculatedKgCO2e: number;
  calculatedTCO2e: number;
}

export type RefrigerantType = 'R-22' | 'R-410A' | 'R-134a' | 'R-32' | 'R-407C' | 'R-404A' | 'Other';

export interface Scope1RefrigerantRecord extends BaseRecord {
  equipmentType: 'Split Air Conditioner' | 'VRF / Chiller System' | 'Package AC' | 'Refrigerator / Cold Storage' | 'Vehicle AC';
  equipmentLocation: string;
  equipmentCount: number;
  refrigerantType: RefrigerantType;
  quantityRefilledKg: number;
  reasonForRefill: 'Routine Maintenance' | 'Leakage Repair' | 'Retrofitting' | 'New Commissioning';
  gwpFactor: number;
  calculatedKgCO2e: number;
  calculatedTCO2e: number;
}

export interface Scope1SF6Record extends BaseRecord {
  equipmentId: string;
  equipmentType: 'Circuit Breaker' | 'Gas Insulated Switchgear (GIS)' | 'Ring Main Unit (RMU)' | 'Current Transformer';
  voltageLevelKV: '11 kV' | '33 kV' | '132 kV' | '220 kV';
  nameplateCapacityKg: number;
  beginningInventoryKg: number;
  inventoryPurchasedRefilledKg: number;
  inventoryRecoveredKg: number;
  endingInventoryKg: number;
  netLossKg: number;
  gwpFactor: number; // 23,500
  calculatedKgCO2e: number;
  calculatedTCO2e: number;
}

// ----------------------------------------------------
// SCOPE 2: INDIRECT EMISSIONS (PURCHASED ELECTRICITY & SOLAR)
// ----------------------------------------------------

export interface Scope2ElectricityRecord extends BaseRecord {
  accountNumber: string;
  meterNumber: string;
  tariffCategory?: string;
  consumedKWh: number;
  billedAmountLKR?: number;
  gridEmissionFactorKgPerKWh: number; // e.g. 0.655
  calculatedKgCO2e: number;
  calculatedTCO2e: number;
}

export interface Scope2SolarRecord extends BaseRecord {
  systemCapacityKWp: number;
  solarGeneratedKWh: number;
  selfConsumedKWh: number;
  exportedToGridKWh: number;
  importedFromGridKWh: number;
  avoidedEmissionsTCO2e: number;
  netPurchasedKWh: number;
  netScope2EmissionsTCO2e: number;
}

// ----------------------------------------------------
// SCOPE 3: VALUE CHAIN EMISSIONS
// ----------------------------------------------------

export interface Scope3PurchasedGoodsRecord extends BaseRecord {
  category: 'Transformers & Substations' | 'Cables & Conductors' | 'Electricity Meters & Testing' | 'Insulators & Hardware' | 'Office & Paper Supplies' | 'IT Equipment & Software' | 'Consulting & Outsourced Services';
  itemDescription: string;
  quantity: number;
  unit: string;
  supplierName: string;
  valueLKR: number;
  spendEmissionFactorKgPer1000LKR: number;
  calculatedKgCO2e: number;
  calculatedTCO2e: number;
}

export interface Scope3CapitalGoodsRecord extends BaseRecord {
  assetName: string;
  assetType: 'Distribution Transformers' | 'Substation Heavy Plant' | 'Utility Vehicles (Capitalized)' | 'Buildings & Structures' | 'Factory Production Machinery' | 'High-End Test Benches';
  quantity: number;
  supplier: string;
  valueLKR: number;
  depreciationYears?: number;
  spendEmissionFactorKgPer1000LKR: number;
  calculatedKgCO2e: number;
  calculatedTCO2e: number;
}

export interface Scope3ConstructionRecord extends BaseRecord {
  projectName: string;
  projectType: 'Rural Electrification Expansion' | 'Substation Civil Works' | 'Underground Cabling' | 'Facility Renovation' | 'Meter Factory Upgrade';
  contractorName: string;
  constructionPeriodMonths: number;
  projectValueLKR: number;
  majorMaterialsSummary?: string;
  calculatedKgCO2e: number;
  calculatedTCO2e: number;
}

export type TransportMode = 'Heavy Diesel Truck (14t+)' | 'Medium Truck (7.5t)' | 'Light Commercial Van' | 'Rail Freight' | 'Cargo Vessel (Sea)' | 'Air Cargo';

export interface Scope3UpstreamFreightRecord extends BaseRecord {
  materialDescription: string;
  origin: string;
  destination: string;
  weightTonnes: number;
  distanceKm: number;
  transportMode: TransportMode;
  emissionFactorKgPerTonneKm: number;
  calculatedKgCO2e: number;
  calculatedTCO2e: number;
}

export type WasteCategory = 'Scrap Copper & Aluminum' | 'Used Transformer Oil' | 'Damaged Electricity Meters (E-Waste)' | 'Paper & Cardboard' | 'Plastic & Packaging' | 'Mixed Municipal Solid Waste' | 'Hazardous Waste';
export type DisposalMethod = 'Authorized Certified Recycling' | 'Oil Re-refining' | 'Controlled Landfill' | 'Open Landfill' | 'Composting' | 'Incineration';

export interface Scope3WasteRecord extends BaseRecord {
  wasteType: WasteCategory;
  quantityKg: number;
  disposalMethod: DisposalMethod;
  contractorName?: string;
  emissionFactorKgPerKg: number;
  calculatedKgCO2e: number;
  calculatedTCO2e: number;
}

export type TravelMode = 'Domestic Air Flight' | 'International Air Flight' | 'Company Car / Hired Vehicle' | 'Public Bus' | 'Train' | 'Motorcycle' | 'Taxi / Ride Hailing';

export interface Scope3BusinessTravelRecord extends BaseRecord {
  travelCategory: 'Business Travel' | 'Employee Commuting';
  purposeOrEmployeeGroup: string;
  origin: string;
  destination: string;
  transportMode: TravelMode;
  numberOfTrips: number;
  distanceKmPerTrip: number;
  totalPassengerKm: number;
  emissionFactorKgPerPassengerKm: number;
  calculatedKgCO2e: number;
  calculatedTCO2e: number;
}

export interface Scope3DistributionLossRecord extends BaseRecord {
  electricityReceivedFromCEBMWh: number;
  lecoOwnConsumptionMWh: number;
  electricityBilledToConsumersMWh: number;
  distributionLossMWh: number;
  lossPercentage: number;
  gridEmissionFactorTonnePerMWh: number;
  calculatedKgCO2e: number;
  calculatedTCO2e: number;
}

// ----------------------------------------------------
// EMISSION FACTORS CONFIGURATION
// ----------------------------------------------------

export interface EmissionFactorEntry {
  id: string;
  category: 'Scope 1 Fuel' | 'Scope 1 Refrigerant' | 'Scope 1 SF6' | 'Scope 2 Grid' | 'Scope 3 Spend' | 'Scope 3 Transport' | 'Scope 3 Waste' | 'Scope 3 Travel';
  fuelOrMaterial: string;
  unit: string;
  factorKgCO2e: number;
  sourceStandard: string;
  notes?: string;
}

// ----------------------------------------------------
// DASHBOARD & ANALYTICS SUMMARY
// ----------------------------------------------------

export interface ScopeTotals {
  scope1: {
    totalTCO2e: number;
    vehiclesTCO2e: number;
    generatorsTCO2e: number;
    stationaryLPGTCO2e: number;
    refrigerantsTCO2e: number;
    sf6TCO2e: number;
  };
  scope2: {
    totalTCO2e: number;
    gridElectricityTCO2e: number;
    solarGeneratedKWh: number;
    solarAvoidedTCO2e: number;
    netScope2TCO2e: number;
  };
  scope3: {
    totalTCO2e: number;
    purchasedGoodsTCO2e: number;
    capitalGoodsTCO2e: number;
    constructionTCO2e: number;
    upstreamFreightTCO2e: number;
    wasteTCO2e: number;
    businessTravelCommutingTCO2e: number;
    distributionLossTCO2e: number;
  };
  grandTotalTCO2e: number;
  netTotalTCO2e: number; // after solar avoided
  totalRecordsCount: number;
}

export interface MonthlyEmissionTrend {
  month: ReportingMonth;
  monthShort: string;
  scope1: number;
  scope2: number;
  scope3: number;
  total: number;
  solarAvoided: number;
}

export interface FacilityEmissionStat {
  facilityId: string;
  facilityName: string;
  facilityType: FacilityType;
  location: string;
  scope1: number;
  scope2: number;
  scope3: number;
  total: number;
  percentage: number;
}
