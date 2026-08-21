import fs from 'fs';
import path from 'path';
import { 
  Facility, 
  FacilityJobRole,
  User, 
  EmissionFactorEntry, 
  Scope1VehicleRecord, 
  Scope1GeneratorRecord, 
  Scope1StationaryFuelRecord, 
  Scope1RefrigerantRecord, 
  Scope1SF6Record, 
  Scope2ElectricityRecord, 
  Scope2SolarRecord, 
  Scope3PurchasedGoodsRecord, 
  Scope3CapitalGoodsRecord, 
  Scope3ConstructionRecord, 
  Scope3UpstreamFreightRecord, 
  Scope3WasteRecord, 
  Scope3BusinessTravelRecord, 
  Scope3DistributionLossRecord,
  ScopeTotals,
  MonthlyEmissionTrend,
  FacilityEmissionStat,
  ReportingMonth
} from '../src/types.js';

const DATA_FILE = path.join(process.cwd(), 'server-data.json');

// Default initial emission factors
export const DEFAULT_EMISSION_FACTORS: EmissionFactorEntry[] = [
  { id: 'ef-1', category: 'Scope 1 Fuel', fuelOrMaterial: 'Auto Diesel', unit: 'Liters', factorKgCO2e: 2.6800, sourceStandard: 'IPCC 2006 / DEFRA 2024', notes: 'LECO fleet & backup generators' },
  { id: 'ef-2', category: 'Scope 1 Fuel', fuelOrMaterial: 'Super Diesel', unit: 'Liters', factorKgCO2e: 2.6900, sourceStandard: 'DEFRA 2024', notes: 'Low sulfur fleet' },
  { id: 'ef-3', category: 'Scope 1 Fuel', fuelOrMaterial: 'Petrol (Gasoline)', unit: 'Liters', factorKgCO2e: 2.3100, sourceStandard: 'IPCC 2006 / DEFRA 2024', notes: 'Fleet motorcycles and cars' },
  { id: 'ef-4', category: 'Scope 1 Fuel', fuelOrMaterial: 'LPG (Commercial 37.5kg)', unit: 'kg', factorKgCO2e: 2.9800, sourceStandard: 'GHG Protocol Stationary Fuel', notes: 'Canteen and workshop heating' },
  { id: 'ef-5', category: 'Scope 1 Fuel', fuelOrMaterial: 'LPG (12.5kg)', unit: 'kg', factorKgCO2e: 2.9800, sourceStandard: 'GHG Protocol Stationary Fuel', notes: 'Branch offices' },
  { id: 'ef-6', category: 'Scope 1 Fuel', fuelOrMaterial: 'Kerosene', unit: 'Liters', factorKgCO2e: 2.5400, sourceStandard: 'IPCC 2006', notes: 'Testing & cleaning' },
  { id: 'ef-7', category: 'Scope 1 Refrigerant', fuelOrMaterial: 'R-22', unit: 'kg', factorKgCO2e: 1810.0000, sourceStandard: 'IPCC AR4 / Montreal Protocol', notes: 'Older HVAC systems' },
  { id: 'ef-8', category: 'Scope 1 Refrigerant', fuelOrMaterial: 'R-410A', unit: 'kg', factorKgCO2e: 2088.0000, sourceStandard: 'IPCC AR4', notes: 'Standard VRF & Split Inverter ACs' },
  { id: 'ef-9', category: 'Scope 1 Refrigerant', fuelOrMaterial: 'R-134a', unit: 'kg', factorKgCO2e: 1430.0000, sourceStandard: 'IPCC AR4', notes: 'Vehicle AC and water chillers' },
  { id: 'ef-10', category: 'Scope 1 Refrigerant', fuelOrMaterial: 'R-32', unit: 'kg', factorKgCO2e: 675.0000, sourceStandard: 'IPCC AR5', notes: 'Low-GWP Split AC units' },
  { id: 'ef-11', category: 'Scope 1 Refrigerant', fuelOrMaterial: 'R-407C', unit: 'kg', factorKgCO2e: 1774.0000, sourceStandard: 'IPCC AR4', notes: 'Commercial HVAC packages' },
  { id: 'ef-12', category: 'Scope 1 SF6', fuelOrMaterial: 'SF6 (Sulfur Hexafluoride)', unit: 'kg', factorKgCO2e: 23500.0000, sourceStandard: 'IPCC AR5 / GHG Protocol', notes: 'High voltage switchgear insulation gas' },
  { id: 'ef-13', category: 'Scope 2 Grid', fuelOrMaterial: 'Sri Lanka CEB/LECO Grid Electricity', unit: 'kWh', factorKgCO2e: 0.6550, sourceStandard: 'SLSEA / CEB Grid Emission Factor', notes: 'Grid emission factor for Sri Lanka' },
  { id: 'ef-14', category: 'Scope 3 Spend', fuelOrMaterial: 'Transformers & Electrical Plant', unit: 'LKR 1,000', factorKgCO2e: 0.5200, sourceStandard: 'DEFRA CEDA EEIO Spend Model', notes: 'Capital distribution equipment' },
  { id: 'ef-15', category: 'Scope 3 Spend', fuelOrMaterial: 'Cables, Wires & Hardware', unit: 'LKR 1,000', factorKgCO2e: 0.4800, sourceStandard: 'DEFRA CEDA EEIO Spend Model', notes: 'Conductors & cables' },
  { id: 'ef-16', category: 'Scope 3 Spend', fuelOrMaterial: 'Civil Works & Construction', unit: 'LKR 1,000', factorKgCO2e: 0.3800, sourceStandard: 'DEFRA CEDA EEIO Spend Model', notes: 'Infrastructure civil works' },
  { id: 'ef-17', category: 'Scope 3 Transport', fuelOrMaterial: 'Heavy Diesel Truck Freight (14t+)', unit: 'tonne-km', factorKgCO2e: 0.1620, sourceStandard: 'GLEC Framework / DEFRA', notes: 'Bulk logistics from port/stores' },
  { id: 'ef-18', category: 'Scope 3 Transport', fuelOrMaterial: 'Medium Truck Freight (7.5t)', unit: 'tonne-km', factorKgCO2e: 0.2450, sourceStandard: 'GLEC Framework / DEFRA', notes: 'Inter-store transfers' },
  { id: 'ef-19', category: 'Scope 3 Waste', fuelOrMaterial: 'Mixed Waste to Landfill', unit: 'kg', factorKgCO2e: 0.5800, sourceStandard: 'IPCC Waste Model', notes: 'General unsegregated waste' },
  { id: 'ef-20', category: 'Scope 3 Waste', fuelOrMaterial: 'Scrap Metal Recycled', unit: 'kg', factorKgCO2e: -0.2200, sourceStandard: 'Circular Economy Avoided Factor', notes: 'Scrap copper & aluminium recycling credit' },
  { id: 'ef-21', category: 'Scope 3 Travel', fuelOrMaterial: 'Domestic Air Flight', unit: 'passenger-km', factorKgCO2e: 0.1550, sourceStandard: 'ICAO Carbon Calculator', notes: 'Business travel' },
  { id: 'ef-22', category: 'Scope 3 Travel', fuelOrMaterial: 'International Air Flight', unit: 'passenger-km', factorKgCO2e: 0.1020, sourceStandard: 'ICAO Carbon Calculator', notes: 'Training & technical conferences' },
  { id: 'ef-23', category: 'Scope 3 Travel', fuelOrMaterial: 'Company Car / Hired Vehicle', unit: 'km', factorKgCO2e: 0.1710, sourceStandard: 'DEFRA 2024', notes: 'Executive and site visits' },
  { id: 'ef-24', category: 'Scope 3 Travel', fuelOrMaterial: 'Public Bus', unit: 'passenger-km', factorKgCO2e: 0.0420, sourceStandard: 'DEFRA 2024', notes: 'Staff commuting survey' },
  { id: 'ef-25', category: 'Scope 3 Travel', fuelOrMaterial: 'Train', unit: 'passenger-km', factorKgCO2e: 0.0350, sourceStandard: 'DEFRA 2024', notes: 'Staff commuting survey' },
  { id: 'ef-26', category: 'Scope 3 Travel', fuelOrMaterial: 'Motorcycle', unit: 'km', factorKgCO2e: 0.1030, sourceStandard: 'DEFRA 2024', notes: 'Field officers daily commuting' }
];

export const DEFAULT_FACILITIES: Facility[] = [
  // 1. Parent: Kotte Branch -> Children: Pitakotte CSC, Kolonnawa CSC, Kotikawatta CSC
  {
    id: 'fac-br-kotte',
    code: 'LECO-BR-KT',
    name: 'Kotte Branch',
    type: 'Branch',
    isParent: true,
    parentId: null,
    location: '325 Kotte Road, Ethul Kotte',
    responsibleOfficer: 'Mrs. Dilani Senanayake',
    headDesignation: 'Branch Operations Manager',
    officerEmail: 'dilani.s@leco.com',
    contactNumber: '+94 11 286 5520',
    electricityAccountNo: 'ACC-011-3341',
    meterNumbers: ['MTR-KT-09'],
    hasSolarPV: true,
    solarCapacityKW: 35.0,
    jobRoles: [
      { id: 'jr-kt-1', facilityId: 'fac-br-kotte', roleName: 'Branch Operations Manager', description: 'Oversees Kotte Branch & Regional CSC Network' },
      { id: 'jr-kt-2', facilityId: 'fac-br-kotte', roleName: 'Area Electrical Engineer', description: 'High voltage distribution network and substations' },
      { id: 'jr-kt-3', facilityId: 'fac-br-kotte', roleName: 'Fleet & Logistics Supervisor', description: 'Branch vehicle fuel and maintenance tracking' }
    ]
  },
  {
    id: 'fac-csc-pitakotte',
    code: 'LECO-CSC-PKT',
    name: 'Pitakotte CSC',
    type: 'CSC',
    isParent: false,
    parentId: 'fac-br-kotte',
    parentName: 'Kotte Branch',
    location: 'Pitakotte Junction, Kotte',
    responsibleOfficer: 'Mr. Sarath Wijesinghe',
    headDesignation: 'Customer Service Centre Supervisor',
    officerEmail: 'sarath.w@leco.com',
    contactNumber: '+94 11 287 1102',
    electricityAccountNo: 'ACC-011-3342',
    meterNumbers: ['MTR-PKT-01'],
    hasSolarPV: false,
    solarCapacityKW: 0,
    jobRoles: [
      { id: 'jr-pkt-1', facilityId: 'fac-csc-pitakotte', roleName: 'Customer Service Officer', description: 'Consumer connections and billing inquiries' },
      { id: 'jr-pkt-2', facilityId: 'fac-csc-pitakotte', roleName: 'Breakdown Technician', description: 'Low voltage breakdown response team' }
    ]
  },
  {
    id: 'fac-csc-kolonnawa',
    code: 'LECO-CSC-KLN',
    name: 'Kolonnawa CSC',
    type: 'CSC',
    isParent: false,
    parentId: 'fac-br-kotte',
    parentName: 'Kotte Branch',
    location: 'Kolonnawa Road, Wellampitiya',
    responsibleOfficer: 'Mr. Chandana Perera',
    headDesignation: 'Customer Service Centre Supervisor',
    officerEmail: 'chandana.p@leco.com',
    contactNumber: '+94 11 257 2210',
    electricityAccountNo: 'ACC-011-3343',
    meterNumbers: ['MTR-KLN-01'],
    hasSolarPV: false,
    solarCapacityKW: 0,
    jobRoles: [
      { id: 'jr-kln-1', facilityId: 'fac-csc-kolonnawa', roleName: 'CSC Operations Lead', description: 'Customer service and local network supervision' },
      { id: 'jr-kln-2', facilityId: 'fac-csc-kolonnawa', roleName: 'Field Inspection Officer', description: 'Meter inspection and energy loss auditing' }
    ]
  },
  {
    id: 'fac-csc-kotikawatta',
    code: 'LECO-CSC-KKW',
    name: 'Kotikawatta CSC',
    type: 'CSC',
    isParent: false,
    parentId: 'fac-br-kotte',
    parentName: 'Kotte Branch',
    location: 'Gothatuwa Junction, Kotikawatta',
    responsibleOfficer: 'Mrs. Manel Fernando',
    headDesignation: 'CSC Lead Officer',
    officerEmail: 'manel.f@leco.com',
    contactNumber: '+94 11 254 9901',
    electricityAccountNo: 'ACC-011-3344',
    meterNumbers: ['MTR-KKW-01'],
    hasSolarPV: false,
    solarCapacityKW: 0,
    jobRoles: [
      { id: 'jr-kkw-1', facilityId: 'fac-csc-kotikawatta', roleName: 'Customer Relations Officer', description: 'Billing inquiries and customer support' }
    ]
  },

  // 2. Parent: Kelaniya Branch -> Children: Dalugama CSC, Mahara CSC, Wattala CSC, Kandana CSC
  {
    id: 'fac-br-kelaniya',
    code: 'LECO-BR-KLN',
    name: 'Kelaniya Branch',
    type: 'Branch',
    isParent: true,
    parentId: null,
    location: 'Kandy Road, Peliyagoda, Kelaniya',
    responsibleOfficer: 'Eng. Rohan Samarasinghe',
    headDesignation: 'Chief Area Engineer',
    officerEmail: 'rohan.s@leco.com',
    contactNumber: '+94 11 291 4450',
    electricityAccountNo: 'ACC-011-5511',
    meterNumbers: ['MTR-KLN-BR01'],
    hasSolarPV: true,
    solarCapacityKW: 45.0,
    jobRoles: [
      { id: 'jr-kely-1', facilityId: 'fac-br-kelaniya', roleName: 'Area Electrical Engineer', description: 'Substation and distribution management' },
      { id: 'jr-kely-2', facilityId: 'fac-br-kelaniya', roleName: 'Branch Administration Officer', description: 'Fleet, fuels and operational logging' }
    ]
  },
  {
    id: 'fac-csc-dalugama',
    code: 'LECO-CSC-DLG',
    name: 'Dalugama CSC',
    type: 'CSC',
    isParent: false,
    parentId: 'fac-br-kelaniya',
    parentName: 'Kelaniya Branch',
    location: 'University Junction, Dalugama, Kelaniya',
    responsibleOfficer: 'Mr. Bandula Jayakody',
    headDesignation: 'CSC In-Charge',
    officerEmail: 'bandula.j@leco.com',
    contactNumber: '+94 11 290 8820',
    electricityAccountNo: 'ACC-011-5512',
    meterNumbers: ['MTR-DLG-01'],
    hasSolarPV: false,
    solarCapacityKW: 0,
    jobRoles: [
      { id: 'jr-dlg-1', facilityId: 'fac-csc-dalugama', roleName: 'Technical Officer', description: 'Local transformer and service lines upkeep' }
    ]
  },
  {
    id: 'fac-csc-mahara',
    code: 'LECO-CSC-MHR',
    name: 'Mahara CSC',
    type: 'CSC',
    isParent: false,
    parentId: 'fac-br-kelaniya',
    parentName: 'Kelaniya Branch',
    location: 'Kadawatha Road, Mahara',
    responsibleOfficer: 'Mr. Lasantha Abeykoon',
    headDesignation: 'CSC Lead Supervisor',
    officerEmail: 'lasantha.a@leco.com',
    contactNumber: '+94 11 292 3340',
    electricityAccountNo: 'ACC-011-5513',
    meterNumbers: ['MTR-MHR-01'],
    hasSolarPV: false,
    solarCapacityKW: 0,
    jobRoles: [
      { id: 'jr-mhr-1', facilityId: 'fac-csc-mahara', roleName: 'Customer Service Lead', description: 'Consumer service inquiries' }
    ]
  },
  {
    id: 'fac-csc-wattala',
    code: 'LECO-CSC-WTL',
    name: 'Wattala CSC',
    type: 'CSC',
    isParent: false,
    parentId: 'fac-br-kelaniya',
    parentName: 'Kelaniya Branch',
    location: 'Negombo Road, Wattala',
    responsibleOfficer: 'Mrs. Kumari Mendis',
    headDesignation: 'CSC Lead Officer',
    officerEmail: 'kumari.m@leco.com',
    contactNumber: '+94 11 293 1180',
    electricityAccountNo: 'ACC-011-5514',
    meterNumbers: ['MTR-WTL-01'],
    hasSolarPV: true,
    solarCapacityKW: 15.0,
    jobRoles: [
      { id: 'jr-wtl-1', facilityId: 'fac-csc-wattala', roleName: 'Customer Relations Executive', description: 'Commercial customer connections' }
    ]
  },
  {
    id: 'fac-csc-kandana',
    code: 'LECO-CSC-KND',
    name: 'Kandana CSC',
    type: 'CSC',
    isParent: false,
    parentId: 'fac-br-kelaniya',
    parentName: 'Kelaniya Branch',
    location: 'Station Road, Kandana',
    responsibleOfficer: 'Mr. Sunil Pathirana',
    headDesignation: 'CSC Supervisor',
    officerEmail: 'sunil.p@leco.com',
    contactNumber: '+94 11 223 9940',
    electricityAccountNo: 'ACC-011-5515',
    meterNumbers: ['MTR-KND-01'],
    hasSolarPV: false,
    solarCapacityKW: 0,
    jobRoles: [
      { id: 'jr-knd-1', facilityId: 'fac-csc-kandana', roleName: 'Maintenance Supervisor', description: 'Emergency response line repairs' }
    ]
  },

  // 3. Parent: Moratuwa Branch -> Children: Moratuwa North CSC, Moratuwa South CSC, Keselwatta CSC, Panadura CSC
  {
    id: 'fac-br-moratuwa',
    code: 'LECO-BR-MRT',
    name: 'Moratuwa Branch',
    type: 'Branch',
    isParent: true,
    parentId: null,
    location: 'Galle Road, Rawathawatta, Moratuwa',
    responsibleOfficer: 'Mr. Kusal Fernando',
    headDesignation: 'Area Electrical Engineer',
    officerEmail: 'kusal.f@leco.com',
    contactNumber: '+94 11 264 5890',
    electricityAccountNo: 'ACC-011-4567',
    meterNumbers: ['MTR-MR-22'],
    hasSolarPV: true,
    solarCapacityKW: 40.0,
    jobRoles: [
      { id: 'jr-mrt-1', facilityId: 'fac-br-moratuwa', roleName: 'Branch Engineer', description: 'Network expansion and maintenance' },
      { id: 'jr-mrt-2', facilityId: 'fac-br-moratuwa', roleName: 'Line Maintenance Supervisor', description: 'Overhead cables & transformer upkeep' }
    ]
  },
  {
    id: 'fac-csc-moratuwa-n',
    code: 'LECO-CSC-MTN',
    name: 'Moratuwa North CSC',
    type: 'CSC',
    isParent: false,
    parentId: 'fac-br-moratuwa',
    parentName: 'Moratuwa Branch',
    location: 'Angulana Station Road, Moratuwa',
    responsibleOfficer: 'Mr. Jagath Alwis',
    headDesignation: 'CSC In-Charge',
    officerEmail: 'jagath.a@leco.com',
    contactNumber: '+94 11 262 1140',
    electricityAccountNo: 'ACC-011-4568',
    meterNumbers: ['MTR-MTN-01'],
    hasSolarPV: false,
    solarCapacityKW: 0,
    jobRoles: [
      { id: 'jr-mtn-1', facilityId: 'fac-csc-moratuwa-n', roleName: 'Customer Relations Officer', description: 'Customer service and new meter requests' }
    ]
  },
  {
    id: 'fac-csc-moratuwa-s',
    code: 'LECO-CSC-MTS',
    name: 'Moratuwa South CSC',
    type: 'CSC',
    isParent: false,
    parentId: 'fac-br-moratuwa',
    parentName: 'Moratuwa Branch',
    location: 'Koralawella Junction, Moratuwa',
    responsibleOfficer: 'Mr. Anura Senaratne',
    headDesignation: 'CSC Supervisor',
    officerEmail: 'anura.s@leco.com',
    contactNumber: '+94 11 265 8820',
    electricityAccountNo: 'ACC-011-4569',
    meterNumbers: ['MTR-MTS-01'],
    hasSolarPV: false,
    solarCapacityKW: 0,
    jobRoles: [
      { id: 'jr-mts-1', facilityId: 'fac-csc-moratuwa-s', roleName: 'Field Technical Officer', description: 'Service cable fault rectification' }
    ]
  },
  {
    id: 'fac-csc-keselwatta',
    code: 'LECO-CSC-KSW',
    name: 'Keselwatta CSC',
    type: 'CSC',
    isParent: false,
    parentId: 'fac-br-moratuwa',
    parentName: 'Moratuwa Branch',
    location: 'Old Galle Road, Keselwatta, Panadura',
    responsibleOfficer: 'Mrs. Nilmini De Silva',
    headDesignation: 'CSC Lead Officer',
    officerEmail: 'nilmini.d@leco.com',
    contactNumber: '+94 38 223 9901',
    electricityAccountNo: 'ACC-011-4570',
    meterNumbers: ['MTR-KSW-01'],
    hasSolarPV: false,
    solarCapacityKW: 0,
    jobRoles: [
      { id: 'jr-ksw-1', facilityId: 'fac-csc-keselwatta', roleName: 'Customer Officer', description: 'Consumer inquiries and meter reading verifications' }
    ]
  },
  {
    id: 'fac-csc-panadura',
    code: 'LECO-CSC-PND',
    name: 'Panadura CSC',
    type: 'CSC',
    isParent: false,
    parentId: 'fac-br-moratuwa',
    parentName: 'Moratuwa Branch',
    location: 'Arthur V Dias Mawatha, Panadura',
    responsibleOfficer: 'Mr. Wasantha Kumara',
    headDesignation: 'CSC Superintendent',
    officerEmail: 'wasantha.k@leco.com',
    contactNumber: '+94 38 224 4450',
    electricityAccountNo: 'ACC-011-4571',
    meterNumbers: ['MTR-PND-01'],
    hasSolarPV: true,
    solarCapacityKW: 20.0,
    jobRoles: [
      { id: 'jr-pnd-1', facilityId: 'fac-csc-panadura', roleName: 'Operations Lead', description: 'Panadura town area network and breakdowns' }
    ]
  },

  // 4. Parent: Galle Branch -> Children: Galle CSC, Hikkaduwa CSC, Ambalangoda CSC
  {
    id: 'fac-br-galle',
    code: 'LECO-BR-GAL',
    name: 'Galle Branch',
    type: 'Branch',
    isParent: true,
    parentId: null,
    location: 'Matara Road, Magalle, Galle',
    responsibleOfficer: 'Eng. Chaminda Wickramasinghe',
    headDesignation: 'Southern Regional Chief Engineer',
    officerEmail: 'chaminda.w@leco.com',
    contactNumber: '+94 91 224 5510',
    electricityAccountNo: 'ACC-091-1120',
    meterNumbers: ['MTR-GAL-BR01'],
    hasSolarPV: true,
    solarCapacityKW: 50.0,
    jobRoles: [
      { id: 'jr-gal-1', facilityId: 'fac-br-galle', roleName: 'Southern Area Engineer', description: 'Distribution network and coastal grid resilience' },
      { id: 'jr-gal-2', facilityId: 'fac-br-galle', roleName: 'Regional Billing Superintendent', description: 'Southern commercial customer billing oversight' }
    ]
  },
  {
    id: 'fac-csc-galle',
    code: 'LECO-CSC-GLC',
    name: 'Galle CSC',
    type: 'CSC',
    isParent: false,
    parentId: 'fac-br-galle',
    parentName: 'Galle Branch',
    location: 'Wakwella Road, Galle Fort',
    responsibleOfficer: 'Mr. Nalin Jayasundara',
    headDesignation: 'CSC In-Charge',
    officerEmail: 'nalin.j@leco.com',
    contactNumber: '+94 91 223 8810',
    electricityAccountNo: 'ACC-091-1121',
    meterNumbers: ['MTR-GLC-01'],
    hasSolarPV: false,
    solarCapacityKW: 0,
    jobRoles: [
      { id: 'jr-glc-1', facilityId: 'fac-csc-galle', roleName: 'Customer Service Lead', description: 'Galle city customer connections' }
    ]
  },
  {
    id: 'fac-csc-hikkaduwa',
    code: 'LECO-CSC-HKD',
    name: 'Hikkaduwa CSC',
    type: 'CSC',
    isParent: false,
    parentId: 'fac-br-galle',
    parentName: 'Galle Branch',
    location: 'Galle Road, Hikkaduwa',
    responsibleOfficer: 'Mr. Gamini Rathnayake',
    headDesignation: 'CSC Lead Officer',
    officerEmail: 'gamini.r@leco.com',
    contactNumber: '+94 91 227 7730',
    electricityAccountNo: 'ACC-091-1122',
    meterNumbers: ['MTR-HKD-01'],
    hasSolarPV: true,
    solarCapacityKW: 15.0,
    jobRoles: [
      { id: 'jr-hkd-1', facilityId: 'fac-csc-hikkaduwa', roleName: 'Tourism Zone Electrical Officer', description: 'Hotel and commercial supply stability' }
    ]
  },
  {
    id: 'fac-csc-ambalangoda',
    code: 'LECO-CSC-ABG',
    name: 'Ambalangoda CSC',
    type: 'CSC',
    isParent: false,
    parentId: 'fac-br-galle',
    parentName: 'Galle Branch',
    location: 'Main Street, Ambalangoda',
    responsibleOfficer: 'Mrs. Deepthi Gunawardena',
    headDesignation: 'CSC Supervisor',
    officerEmail: 'deepthi.g@leco.com',
    contactNumber: '+94 91 225 8890',
    electricityAccountNo: 'ACC-091-1123',
    meterNumbers: ['MTR-ABG-01'],
    hasSolarPV: false,
    solarCapacityKW: 0,
    jobRoles: [
      { id: 'jr-abg-1', facilityId: 'fac-csc-ambalangoda', roleName: 'Customer Support Lead', description: 'Inquiry and billing assistance' }
    ]
  },

  // 5. Parent: Kalutara Branch -> Children: Kalutara CSC, Payagala CSC, Aluthgama CSC
  {
    id: 'fac-br-kalutara',
    code: 'LECO-BR-KLT',
    name: 'Kalutara Branch',
    type: 'Branch',
    isParent: true,
    parentId: null,
    location: 'Main Street, Kalutara North',
    responsibleOfficer: 'Mr. Asanka Weerakkody',
    headDesignation: 'Branch Superintendent',
    officerEmail: 'asanka.w@leco.com',
    contactNumber: '+94 34 222 3450',
    electricityAccountNo: 'ACC-034-8890',
    meterNumbers: ['MTR-KL-05'],
    hasSolarPV: true,
    solarCapacityKW: 30.0,
    jobRoles: [
      { id: 'jr-klt-1', facilityId: 'fac-br-kalutara', roleName: 'Maintenance Superintendent', description: 'Vehicles, generators and facility maintenance' },
      { id: 'jr-klt-2', facilityId: 'fac-br-kalutara', roleName: 'Area Billing Officer', description: 'Customer consumption and meter logs' }
    ]
  },
  {
    id: 'fac-csc-kalutara',
    code: 'LECO-CSC-KLC',
    name: 'Kalutara CSC',
    type: 'CSC',
    isParent: false,
    parentId: 'fac-br-kalutara',
    parentName: 'Kalutara Branch',
    location: 'Temple Road, Kalutara South',
    responsibleOfficer: 'Mr. Lalith Samaraweera',
    headDesignation: 'CSC In-Charge',
    officerEmail: 'lalith.s@leco.com',
    contactNumber: '+94 34 222 1190',
    electricityAccountNo: 'ACC-034-8891',
    meterNumbers: ['MTR-KLC-01'],
    hasSolarPV: false,
    solarCapacityKW: 0,
    jobRoles: [
      { id: 'jr-klc-1', facilityId: 'fac-csc-kalutara', roleName: 'Customer Service Executive', description: 'Public billing and consumer inquiries' }
    ]
  },
  {
    id: 'fac-csc-payagala',
    code: 'LECO-CSC-PYG',
    name: 'Payagala CSC',
    type: 'CSC',
    isParent: false,
    parentId: 'fac-br-kalutara',
    parentName: 'Kalutara Branch',
    location: 'Galle Road, Payagala',
    responsibleOfficer: 'Mr. Sanath Jayawardena',
    headDesignation: 'CSC Supervisor',
    officerEmail: 'sanath.j@leco.com',
    contactNumber: '+94 34 225 6670',
    electricityAccountNo: 'ACC-034-8892',
    meterNumbers: ['MTR-PYG-01'],
    hasSolarPV: false,
    solarCapacityKW: 0,
    jobRoles: [
      { id: 'jr-pyg-1', facilityId: 'fac-csc-payagala', roleName: 'Emergency Breakdown Coordinator', description: 'Fast breakdown dispatch operations' }
    ]
  },
  {
    id: 'fac-csc-aluthgama',
    code: 'LECO-CSC-ALT',
    name: 'Aluthgama CSC',
    type: 'CSC',
    isParent: false,
    parentId: 'fac-br-kalutara',
    parentName: 'Kalutara Branch',
    location: 'Mathugama Road, Aluthgama',
    responsibleOfficer: 'Mrs. Kanthi Hettiarachchi',
    headDesignation: 'CSC Lead Officer',
    officerEmail: 'kanthi.h@leco.com',
    contactNumber: '+94 34 227 5540',
    electricityAccountNo: 'ACC-034-8893',
    meterNumbers: ['MTR-ALT-01'],
    hasSolarPV: true,
    solarCapacityKW: 12.0,
    jobRoles: [
      { id: 'jr-alt-1', facilityId: 'fac-csc-aluthgama', roleName: 'Customer Service Lead', description: 'Southern coast consumer support' }
    ]
  },

  // 6. Parent: Negombo Branch -> Children: Negombo CSC, Seeduwa CSC, Ja Ela CSC
  {
    id: 'fac-br-negombo',
    code: 'LECO-BR-NGM',
    name: 'Negombo Branch',
    type: 'Branch',
    isParent: true,
    parentId: null,
    location: 'Greens Road, Negombo',
    responsibleOfficer: 'Eng. Priyantha Dissanayake',
    headDesignation: 'Chief Area Engineer',
    officerEmail: 'priyantha.d@leco.com',
    contactNumber: '+94 31 223 8812',
    electricityAccountNo: 'ACC-031-1029',
    meterNumbers: ['MTR-NG-44'],
    hasSolarPV: true,
    solarCapacityKW: 50.0,
    jobRoles: [
      { id: 'jr-ngm-1', facilityId: 'fac-br-negombo', roleName: 'Operations Engineer', description: 'Negombo regional distribution grid' },
      { id: 'jr-ngm-2', facilityId: 'fac-br-negombo', roleName: 'Distribution Substation Officer', description: 'Substation SF6 and transformer logging' }
    ]
  },
  {
    id: 'fac-csc-negombo',
    code: 'LECO-CSC-NGC',
    name: 'Negombo CSC',
    type: 'CSC',
    isParent: false,
    parentId: 'fac-br-negombo',
    parentName: 'Negombo Branch',
    location: 'St. Joseph Street, Negombo',
    responsibleOfficer: 'Mr. Jude Rodrigo',
    headDesignation: 'CSC In-Charge',
    officerEmail: 'jude.r@leco.com',
    contactNumber: '+94 31 222 4410',
    electricityAccountNo: 'ACC-031-1030',
    meterNumbers: ['MTR-NGC-01'],
    hasSolarPV: false,
    solarCapacityKW: 0,
    jobRoles: [
      { id: 'jr-ngc-1', facilityId: 'fac-csc-negombo', roleName: 'Customer Relations Officer', description: 'Urban customer services' }
    ]
  },
  {
    id: 'fac-csc-seeduwa',
    code: 'LECO-CSC-SDW',
    name: 'Seeduwa CSC',
    type: 'CSC',
    isParent: false,
    parentId: 'fac-br-negombo',
    parentName: 'Negombo Branch',
    location: 'Colombo-Katunayake Main Road, Seeduwa',
    responsibleOfficer: 'Mr. Kapila Senanayake',
    headDesignation: 'CSC Supervisor',
    officerEmail: 'kapila.s@leco.com',
    contactNumber: '+94 11 225 1190',
    electricityAccountNo: 'ACC-031-1031',
    meterNumbers: ['MTR-SDW-01'],
    hasSolarPV: true,
    solarCapacityKW: 18.0,
    jobRoles: [
      { id: 'jr-sdw-1', facilityId: 'fac-csc-seeduwa', roleName: 'Industrial Zone Technical Officer', description: 'Free Trade Zone grid lines maintenance' }
    ]
  },
  {
    id: 'fac-csc-jaela',
    code: 'LECO-CSC-JEC',
    name: 'Ja Ela CSC',
    type: 'CSC',
    isParent: false,
    parentId: 'fac-br-negombo',
    parentName: 'Negombo Branch',
    location: 'Negombo Road, Ja-Ela',
    responsibleOfficer: 'Mrs. Sharmila Warnakula',
    headDesignation: 'CSC Lead Officer',
    officerEmail: 'sharmila.w@leco.com',
    contactNumber: '+94 11 223 6610',
    electricityAccountNo: 'ACC-031-1032',
    meterNumbers: ['MTR-JEC-01'],
    hasSolarPV: false,
    solarCapacityKW: 0,
    jobRoles: [
      { id: 'jr-jec-1', facilityId: 'fac-csc-jaela', roleName: 'Customer Service Lead', description: 'Commercial customer connections' }
    ]
  },

  // 7. Parent: Nugegoda Branch -> Children: Nugegoda CSC, Boralesgamuwa CSC, Maharagama CSC
  {
    id: 'fac-br-nugegoda',
    code: 'LECO-BR-NGD',
    name: 'Nugegoda Branch',
    type: 'Branch',
    isParent: true,
    parentId: null,
    location: 'Stanley Thilakarathne Mawatha, Nugegoda',
    responsibleOfficer: 'Eng. Mahen Wickramatunga',
    headDesignation: 'Chief Area Electrical Engineer',
    officerEmail: 'mahen.w@leco.com',
    contactNumber: '+94 11 282 3340',
    electricityAccountNo: 'ACC-011-8840',
    meterNumbers: ['MTR-NGD-BR01'],
    hasSolarPV: true,
    solarCapacityKW: 40.0,
    jobRoles: [
      { id: 'jr-ngd-1', facilityId: 'fac-br-nugegoda', roleName: 'Area Operations Engineer', description: 'Dense commercial network & smart metering' },
      { id: 'jr-ngd-2', facilityId: 'fac-br-nugegoda', roleName: 'Branch Safety & Standards Officer', description: 'Transformer stations safety compliance' }
    ]
  },
  {
    id: 'fac-csc-nugegoda',
    code: 'LECO-CSC-NGD-C',
    name: 'Nugegoda CSC',
    type: 'CSC',
    isParent: false,
    parentId: 'fac-br-nugegoda',
    parentName: 'Nugegoda Branch',
    location: 'High Level Road, Nugegoda',
    responsibleOfficer: 'Mr. Dhammika Ranasinghe',
    headDesignation: 'CSC In-Charge',
    officerEmail: 'dhammika.r@leco.com',
    contactNumber: '+94 11 281 9920',
    electricityAccountNo: 'ACC-011-8841',
    meterNumbers: ['MTR-NGC-02'],
    hasSolarPV: false,
    solarCapacityKW: 0,
    jobRoles: [
      { id: 'jr-ngd-c1', facilityId: 'fac-csc-nugegoda', roleName: 'Customer Support Lead', description: 'Customer service desk' }
    ]
  },
  {
    id: 'fac-csc-boralesgamuwa',
    code: 'LECO-CSC-BRG',
    name: 'Boralesgamuwa CSC',
    type: 'CSC',
    isParent: false,
    parentId: 'fac-br-nugegoda',
    parentName: 'Nugegoda Branch',
    location: 'Dehiwala Road, Boralesgamuwa',
    responsibleOfficer: 'Mr. Gamini Liyanage',
    headDesignation: 'CSC Supervisor',
    officerEmail: 'gamini.l@leco.com',
    contactNumber: '+94 11 250 9940',
    electricityAccountNo: 'ACC-011-8842',
    meterNumbers: ['MTR-BRG-01'],
    hasSolarPV: false,
    solarCapacityKW: 0,
    jobRoles: [
      { id: 'jr-brg-1', facilityId: 'fac-csc-boralesgamuwa', roleName: 'Technical Supervisor', description: 'Residential distribution lines maintenance' }
    ]
  },
  {
    id: 'fac-csc-maharagama',
    code: 'LECO-CSC-MHG',
    name: 'Maharagama CSC',
    type: 'CSC',
    isParent: false,
    parentId: 'fac-br-nugegoda',
    parentName: 'Nugegoda Branch',
    location: 'Old Road, Maharagama',
    responsibleOfficer: 'Mrs. Chandani Kariyawasam',
    headDesignation: 'CSC Lead Officer',
    officerEmail: 'chandani.k@leco.com',
    contactNumber: '+94 11 284 1120',
    electricityAccountNo: 'ACC-011-8843',
    meterNumbers: ['MTR-MHG-01'],
    hasSolarPV: true,
    solarCapacityKW: 10.0,
    jobRoles: [
      { id: 'jr-mhg-1', facilityId: 'fac-csc-maharagama', roleName: 'Customer Relations Officer', description: 'Billing and meter replacement service' }
    ]
  },

  // 8. Independent Facilities (No children / Standalone)
  {
    id: 'fac-ho-colombo',
    code: 'LECO-HO-01',
    name: 'LECO Head Office',
    type: 'Head Office',
    isParent: false,
    parentId: null,
    location: '411 Galle Road, Kollupitiya, Colombo 03',
    responsibleOfficer: 'Mr. Samantha Perera',
    headDesignation: 'General Manager (Operations & Administration)',
    officerEmail: 'samantha.p@leco.com',
    contactNumber: '+94 11 237 1665',
    electricityAccountNo: 'ACC-010-9882',
    meterNumbers: ['MTR-COL-001', 'MTR-COL-002'],
    hasSolarPV: true,
    solarCapacityKW: 75.0,
    jobRoles: [
      { id: 'jr-ho-1', facilityId: 'fac-ho-colombo', roleName: 'Corporate Sustainability Lead', description: 'Oversees GHG Protocol and corporate emission accounting' },
      { id: 'jr-ho-2', facilityId: 'fac-ho-colombo', roleName: 'Senior Electrical Engineer', description: 'Engineering design and grid efficiency' },
      { id: 'jr-ho-3', facilityId: 'fac-ho-colombo', roleName: 'Administrative Officer', description: 'Fleet, fuel and facility management' }
    ]
  },
  {
    id: 'fac-tc-jaela',
    code: 'LECO-TC-JE',
    name: 'Training Center - Ja Ela',
    type: 'Training Centre',
    isParent: false,
    parentId: null,
    location: 'Ekala Road, Ja-Ela',
    responsibleOfficer: 'Dr. Janaka Gunaratne',
    headDesignation: 'Director of Technical Training & Standards',
    officerEmail: 'janaka.g@leco.com',
    contactNumber: '+94 11 223 8890',
    electricityAccountNo: 'ACC-011-9988',
    meterNumbers: ['MTR-TC-JE01'],
    hasSolarPV: true,
    solarCapacityKW: 30.0,
    jobRoles: [
      { id: 'jr-tc-1', facilityId: 'fac-tc-jaela', roleName: 'Chief Training Instructor', description: 'High voltage grid simulation and lineman safety training' },
      { id: 'jr-tc-2', facilityId: 'fac-tc-jaela', roleName: 'Technical Standards Auditor', description: 'Safety compliance & emissions certification' }
    ]
  },
  {
    id: 'fac-sdmc-colombo',
    code: 'LECO-SDMC-01',
    name: 'SDMC (System Development & Maintenance Centre)',
    type: 'Special Centre',
    isParent: false,
    parentId: null,
    location: '415 Galle Road, Colombo 03',
    responsibleOfficer: 'Eng. Tharaka Bandara',
    headDesignation: 'Head of Smart Grid & SCADA Operations',
    officerEmail: 'tharaka.b@leco.com',
    contactNumber: '+94 11 237 2200',
    electricityAccountNo: 'ACC-010-9890',
    meterNumbers: ['MTR-SDMC-01'],
    hasSolarPV: true,
    solarCapacityKW: 25.0,
    jobRoles: [
      { id: 'jr-sdmc-1', facilityId: 'fac-sdmc-colombo', roleName: 'SCADA & Smart Grid Engineer', description: 'Automated distribution monitoring & loss optimization' },
      { id: 'jr-sdmc-2', facilityId: 'fac-sdmc-colombo', roleName: 'GIS Systems Analyst', description: 'Network mapping & distribution assets tracking' }
    ]
  },
  {
    id: 'fac-st-waskaduwa',
    code: 'LECO-ST-WSK',
    name: 'Stores - Waskaduwa',
    type: 'Store',
    isParent: false,
    parentId: null,
    location: 'Main Logistics Depot, Waskaduwa, Kalutara',
    responsibleOfficer: 'Mr. Nimal Wickramasinghe',
    headDesignation: 'Chief Materials & Stores Superintendent',
    officerEmail: 'nimal.w@leco.com',
    contactNumber: '+94 34 223 9901',
    electricityAccountNo: 'ACC-034-7720',
    meterNumbers: ['MTR-ST-WSK01'],
    hasSolarPV: true,
    solarCapacityKW: 35.0,
    jobRoles: [
      { id: 'jr-wsk-1', facilityId: 'fac-st-waskaduwa', roleName: 'Chief Logistics Officer', description: 'Bulk freight and supplier shipment handling' },
      { id: 'jr-wsk-2', facilityId: 'fac-st-waskaduwa', roleName: 'Heavy Equipment Storekeeper', description: 'Transformer and conductor inventory control' }
    ]
  },
  {
    id: 'fac-st-jaela',
    code: 'LECO-ST-JE',
    name: 'Stores - Ja Ela',
    type: 'Store',
    isParent: false,
    parentId: null,
    location: 'Industrial Estate, Ekala, Ja-Ela',
    responsibleOfficer: 'Mr. Mahinda Jayasooriya',
    headDesignation: 'Stores Manager (Northern Region)',
    officerEmail: 'mahinda.j@leco.com',
    contactNumber: '+94 11 223 1150',
    electricityAccountNo: 'ACC-011-8899',
    meterNumbers: ['MTR-ST-JE01'],
    hasSolarPV: false,
    solarCapacityKW: 0,
    jobRoles: [
      { id: 'jr-stje-1', facilityId: 'fac-st-jaela', roleName: 'Regional Inventory Controller', description: 'Northern province distribution hardware' }
    ]
  },
  {
    id: 'fac-mf-bandaragama',
    code: 'LECO-MF-01',
    name: 'LECO Meter Testing & Assembly Factory',
    type: 'Meter Factory',
    isParent: false,
    parentId: null,
    location: 'Industrial Zone, Bandaragama, Kalutara',
    responsibleOfficer: 'Eng. Ruwan Jayasuriya',
    headDesignation: 'Factory Chief Engineer & QA Director',
    officerEmail: 'ruwan.j@leco.com',
    contactNumber: '+94 38 229 4410',
    electricityAccountNo: 'ACC-038-7711',
    meterNumbers: ['MTR-MF-101'],
    hasSolarPV: true,
    solarCapacityKW: 120.0,
    jobRoles: [
      { id: 'jr-mf-1', facilityId: 'fac-mf-bandaragama', roleName: 'Calibration & QA Engineer', description: 'Smart meter accuracy and energy calibration' },
      { id: 'jr-mf-2', facilityId: 'fac-mf-bandaragama', roleName: 'Production Supervisor', description: 'Assembly shift scheduling and fuel monitoring' }
    ]
  }
];

export const DEFAULT_USERS: User[] = [
  {
    id: 'usr-1',
    email: 'superadmincf@leco.com',
    name: 'Super Admin (LECO Sustainability Lead)',
    role: 'super_admin',
    department: 'Corporate Sustainability & Executive Engineering',
    canDelete: true,
    isImmutableRootAdmin: true,
    allowedModules: ['dashboard', 'scope1', 'scope2', 'scope3', 'reports', 'facilities', 'users', 'emission-factors', 'supabase-sql', 'calculator'],
    isActive: true,
    contactNumber: '+94 11 237 1600',
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-2',
    email: 'admin.kotte@leco.com',
    name: 'Eng. Dilani Senanayake',
    role: 'branch_admin',
    facilityId: 'fac-br-kotte',
    facilityName: 'Kotte Branch',
    assignedFacilityIds: ['fac-br-kotte', 'fac-csc-pitakotte', 'fac-csc-kolonnawa', 'fac-csc-kotikawatta'],
    jobRole: 'Branch Operations Manager',
    canDelete: true,
    allowedModules: ['dashboard', 'scope1', 'scope2', 'scope3', 'reports', 'facilities', 'users', 'calculator'],
    department: 'Kotte Branch Administration',
    isActive: true,
    contactNumber: '+94 11 286 5520',
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-3',
    email: 'admin.kelaniya@leco.com',
    name: 'Eng. Rohan Samarasinghe',
    role: 'branch_admin',
    facilityId: 'fac-br-kelaniya',
    facilityName: 'Kelaniya Branch',
    assignedFacilityIds: ['fac-br-kelaniya', 'fac-csc-dalugama', 'fac-csc-mahara', 'fac-csc-wattala', 'fac-csc-kandana'],
    jobRole: 'Chief Area Engineer',
    canDelete: true,
    allowedModules: ['dashboard', 'scope1', 'scope2', 'scope3', 'reports', 'facilities', 'users', 'calculator'],
    department: 'Kelaniya Branch Administration',
    isActive: true,
    contactNumber: '+94 11 291 4450',
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-4',
    email: 'admin.western@leco.com',
    name: 'Eng. Janaka Weerasinghe',
    role: 'branch_admin',
    assignedFacilityIds: ['fac-br-kotte', 'fac-br-moratuwa', 'fac-br-nugegoda', 'fac-ho-colombo'],
    canDelete: true,
    allowedModules: ['dashboard', 'scope1', 'scope2', 'scope3', 'reports', 'facilities', 'users', 'calculator'],
    department: 'Western Province Regional Administration',
    isActive: true,
    contactNumber: '+94 11 286 5500',
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-5',
    email: 'officer.pitakotte@leco.com',
    name: 'Mr. Sarath Wijesinghe',
    role: 'facility_user',
    facilityId: 'fac-csc-pitakotte',
    facilityName: 'Pitakotte CSC',
    jobRole: 'Customer Service Officer',
    canDelete: false, // Delete disabled
    allowedModules: ['dashboard', 'scope1', 'scope2', 'scope3', 'reports', 'calculator'],
    department: 'Customer Service Operations',
    isActive: true,
    contactNumber: '+94 11 287 1102',
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-6',
    email: 'officer.dalugama@leco.com',
    name: 'Mr. Bandula Jayakody',
    role: 'facility_user',
    facilityId: 'fac-csc-dalugama',
    facilityName: 'Dalugama CSC',
    jobRole: 'Technical Officer',
    canDelete: true, // Delete enabled
    allowedModules: ['dashboard', 'scope1', 'scope2', 'scope3', 'calculator'],
    department: 'Distribution Maintenance',
    isActive: true,
    contactNumber: '+94 11 290 8820',
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-7',
    email: 'officer.kalutara@leco.com',
    name: 'Mr. Asanka Weerakkody',
    role: 'facility_user',
    facilityId: 'fac-br-kalutara',
    facilityName: 'Kalutara Branch',
    jobRole: 'Maintenance Superintendent',
    canDelete: false, // Delete disabled
    allowedModules: ['dashboard', 'scope1', 'scope2', 'scope3', 'reports', 'calculator'],
    department: 'Branch Operations',
    isActive: true,
    contactNumber: '+94 34 222 3450',
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-8',
    email: 'factory.qa@leco.com',
    name: 'Eng. Ruwan Jayasuriya',
    role: 'facility_user',
    facilityId: 'fac-mf-bandaragama',
    facilityName: 'LECO Meter Testing & Assembly Factory',
    jobRole: 'Calibration & QA Engineer',
    canDelete: true,
    allowedModules: ['dashboard', 'scope1', 'scope2', 'scope3', 'reports', 'calculator'],
    department: 'Meter Manufacturing & QA',
    isActive: true,
    contactNumber: '+94 38 229 4410',
    createdAt: new Date().toISOString()
  }
];

export interface DatabaseSchema {
  facilities: Facility[];
  users: User[];
  emissionFactors: EmissionFactorEntry[];
  scope1Vehicles: Scope1VehicleRecord[];
  scope1Generators: Scope1GeneratorRecord[];
  scope1Stationary: Scope1StationaryFuelRecord[];
  scope1Refrigerants: Scope1RefrigerantRecord[];
  scope1SF6: Scope1SF6Record[];
  scope2Electricity: Scope2ElectricityRecord[];
  scope2Solar: Scope2SolarRecord[];
  scope3PurchasedGoods: Scope3PurchasedGoodsRecord[];
  scope3CapitalGoods: Scope3CapitalGoodsRecord[];
  scope3Construction: Scope3ConstructionRecord[];
  scope3UpstreamFreight: Scope3UpstreamFreightRecord[];
  scope3Waste: Scope3WasteRecord[];
  scope3BusinessTravel: Scope3BusinessTravelRecord[];
  scope3DistributionLoss: Scope3DistributionLossRecord[];
}

// Initial realistic Seed records for LECO
function generateInitialRecords(): DatabaseSchema {
  const months: ReportingMonth[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Vehicles
  const scope1Vehicles: Scope1VehicleRecord[] = [
    {
      id: 'veh-1',
      facilityId: 'fac-1',
      facilityName: 'LECO Head Office',
      reportingYear: 2025,
      month: 'January',
      responsibleOfficer: 'Mr. Samantha Perera',
      vehicleNo: 'WP-CAD-4590',
      vehicleType: 'Double Cab / Pickup',
      fuelType: 'Auto Diesel',
      quantityLiters: 320,
      distanceKm: 2850,
      fuelCardNo: 'FC-882190',
      emissionFactorKgPerL: 2.68,
      calculatedKgCO2e: 320 * 2.68,
      calculatedTCO2e: Number(((320 * 2.68) / 1000).toFixed(4)),
      status: 'Approved',
      remarks: 'Engineering site inspections Colombo South',
      createdAt: '2025-02-01T08:00:00Z',
      updatedAt: '2025-02-01T08:00:00Z'
    },
    {
      id: 'veh-2',
      facilityId: 'fac-2',
      facilityName: 'LECO Meter Testing & Assembly Factory',
      reportingYear: 2025,
      month: 'January',
      responsibleOfficer: 'Eng. Ruwan Jayasuriya',
      vehicleNo: 'WP-LY-7812',
      vehicleType: 'Lorry / Heavy Truck',
      fuelType: 'Auto Diesel',
      quantityLiters: 480,
      distanceKm: 3400,
      fuelCardNo: 'FC-991204',
      emissionFactorKgPerL: 2.68,
      calculatedKgCO2e: 480 * 2.68,
      calculatedTCO2e: Number(((480 * 2.68) / 1000).toFixed(4)),
      status: 'Approved',
      remarks: 'Transporting calibrated energy meters to branch stores',
      createdAt: '2025-02-02T09:30:00Z',
      updatedAt: '2025-02-02T09:30:00Z'
    },
    {
      id: 'veh-3',
      facilityId: 'fac-3',
      facilityName: 'Kotte Branch & Customer Service Centre',
      reportingYear: 2025,
      month: 'January',
      responsibleOfficer: 'Mrs. Dilani Senanayake',
      vehicleNo: 'WP-NC-3312',
      vehicleType: 'Special Utility Vehicle',
      fuelType: 'Auto Diesel',
      quantityLiters: 240,
      distanceKm: 1950,
      fuelCardNo: 'FC-110294',
      emissionFactorKgPerL: 2.68,
      calculatedKgCO2e: 240 * 2.68,
      calculatedTCO2e: Number(((240 * 2.68) / 1000).toFixed(4)),
      status: 'Verified',
      remarks: 'Breakdown response and transformer maintenance team',
      createdAt: '2025-02-03T10:00:00Z',
      updatedAt: '2025-02-03T10:00:00Z'
    },
    {
      id: 'veh-4',
      facilityId: 'fac-4',
      facilityName: 'Moratuwa Branch Office',
      reportingYear: 2025,
      month: 'February',
      responsibleOfficer: 'Mr. Kusal Fernando',
      vehicleNo: 'WP-BD-9011',
      vehicleType: 'Motorcycle',
      fuelType: 'Petrol (Gasoline)',
      quantityLiters: 65,
      distanceKm: 2100,
      fuelCardNo: 'FC-339102',
      emissionFactorKgPerL: 2.31,
      calculatedKgCO2e: 65 * 2.31,
      calculatedTCO2e: Number(((65 * 2.31) / 1000).toFixed(4)),
      status: 'Approved',
      remarks: 'Meter reading and billing distribution rounds',
      createdAt: '2025-03-01T08:00:00Z',
      updatedAt: '2025-03-01T08:00:00Z'
    },
    {
      id: 'veh-5',
      facilityId: 'fac-6',
      facilityName: 'Negombo Branch & Operations',
      reportingYear: 2025,
      month: 'February',
      responsibleOfficer: 'Eng. Priyantha Dissanayake',
      vehicleNo: 'WP-PH-5120',
      vehicleType: 'Van',
      fuelType: 'Auto Diesel',
      quantityLiters: 195,
      distanceKm: 1680,
      fuelCardNo: 'FC-661902',
      emissionFactorKgPerL: 2.68,
      calculatedKgCO2e: 195 * 2.68,
      calculatedTCO2e: Number(((195 * 2.68) / 1000).toFixed(4)),
      status: 'Approved',
      remarks: 'Customer connection inspection vehicle',
      createdAt: '2025-03-02T11:00:00Z',
      updatedAt: '2025-03-02T11:00:00Z'
    }
  ];

  // Generators
  const scope1Generators: Scope1GeneratorRecord[] = [
    {
      id: 'gen-1',
      facilityId: 'fac-1',
      facilityName: 'LECO Head Office',
      reportingYear: 2025,
      month: 'January',
      responsibleOfficer: 'Mr. Samantha Perera',
      generatorId: 'GEN-HO-500KVA',
      capacityKVA: 500,
      fuelType: 'Diesel',
      quantityLiters: 210,
      operatingHours: 14.5,
      maintenanceType: 'Monthly testing & CEB grid maintenance cutover',
      emissionFactorKgPerL: 2.68,
      calculatedKgCO2e: 210 * 2.68,
      calculatedTCO2e: Number(((210 * 2.68) / 1000).toFixed(4)),
      status: 'Approved',
      remarks: 'Automatic emergency generator backup',
      createdAt: '2025-02-01T09:00:00Z',
      updatedAt: '2025-02-01T09:00:00Z'
    },
    {
      id: 'gen-2',
      facilityId: 'fac-2',
      facilityName: 'LECO Meter Testing & Assembly Factory',
      reportingYear: 2025,
      month: 'January',
      responsibleOfficer: 'Eng. Ruwan Jayasuriya',
      generatorId: 'GEN-MF-250KVA',
      capacityKVA: 250,
      fuelType: 'Diesel',
      quantityLiters: 165,
      operatingHours: 18.0,
      maintenanceType: 'Routine 250hr servicing and load test',
      emissionFactorKgPerL: 2.68,
      calculatedKgCO2e: 165 * 2.68,
      calculatedTCO2e: Number(((165 * 2.68) / 1000).toFixed(4)),
      status: 'Approved',
      remarks: 'Ensuring continuous high-precision calibration test bench power',
      createdAt: '2025-02-02T10:00:00Z',
      updatedAt: '2025-02-02T10:00:00Z'
    }
  ];

  // Stationary & LPG
  const scope1Stationary: Scope1StationaryFuelRecord[] = [
    {
      id: 'stat-1',
      facilityId: 'fac-1',
      facilityName: 'LECO Head Office',
      reportingYear: 2025,
      month: 'January',
      responsibleOfficer: 'Mr. Samantha Perera',
      itemEquipment: 'Staff Cafeteria & Kitchen',
      fuelType: 'LPG (Commercial 37.5kg)',
      quantity: 150, // 4 x 37.5kg = 150kg
      unit: 'kg',
      emissionFactorKgPerUnit: 2.98,
      calculatedKgCO2e: 150 * 2.98,
      calculatedTCO2e: Number(((150 * 2.98) / 1000).toFixed(4)),
      status: 'Approved',
      remarks: 'Commercial LPG cylinders for staff meal preparation',
      createdAt: '2025-02-01T10:00:00Z',
      updatedAt: '2025-02-01T10:00:00Z'
    },
    {
      id: 'stat-2',
      facilityId: 'fac-2',
      facilityName: 'LECO Meter Testing & Assembly Factory',
      reportingYear: 2025,
      month: 'January',
      responsibleOfficer: 'Eng. Ruwan Jayasuriya',
      itemEquipment: 'Meter Casing Ultrasonic Welding & Heat Shrink Chamber',
      fuelType: 'LPG (Commercial 37.5kg)',
      quantity: 75,
      unit: 'kg',
      emissionFactorKgPerUnit: 2.98,
      calculatedKgCO2e: 75 * 2.98,
      calculatedTCO2e: Number(((75 * 2.98) / 1000).toFixed(4)),
      status: 'Approved',
      remarks: 'Assembly production process heat',
      createdAt: '2025-02-02T10:30:00Z',
      updatedAt: '2025-02-02T10:30:00Z'
    }
  ];

  // Refrigerants
  const scope1Refrigerants: Scope1RefrigerantRecord[] = [
    {
      id: 'ref-1',
      facilityId: 'fac-1',
      facilityName: 'LECO Head Office',
      reportingYear: 2025,
      month: 'January',
      responsibleOfficer: 'Mr. Samantha Perera',
      equipmentType: 'VRF / Chiller System',
      equipmentLocation: '4th Floor Server & Data Room',
      equipmentCount: 2,
      refrigerantType: 'R-410A',
      quantityRefilledKg: 4.5,
      reasonForRefill: 'Routine Maintenance',
      gwpFactor: 2088,
      calculatedKgCO2e: 4.5 * 2088,
      calculatedTCO2e: Number(((4.5 * 2088) / 1000).toFixed(4)),
      status: 'Approved',
      remarks: 'Annual HVAC maintenance and pressure top-up',
      createdAt: '2025-02-01T11:00:00Z',
      updatedAt: '2025-02-01T11:00:00Z'
    },
    {
      id: 'ref-2',
      facilityId: 'fac-2',
      facilityName: 'LECO Meter Testing & Assembly Factory',
      reportingYear: 2025,
      month: 'February',
      responsibleOfficer: 'Eng. Ruwan Jayasuriya',
      equipmentType: 'Split Air Conditioner',
      equipmentLocation: 'Cleanroom Calibration Lab',
      equipmentCount: 4,
      refrigerantType: 'R-32',
      quantityRefilledKg: 2.2,
      reasonForRefill: 'Leakage Repair',
      gwpFactor: 675,
      calculatedKgCO2e: 2.2 * 675,
      calculatedTCO2e: Number(((2.2 * 675) / 1000).toFixed(4)),
      status: 'Approved',
      remarks: 'Flare nut leak fixed and refilled to manufacturer specification',
      createdAt: '2025-03-01T10:00:00Z',
      updatedAt: '2025-03-01T10:00:00Z'
    }
  ];

  // SF6 High Voltage Electrical Equipment
  const scope1SF6: Scope1SF6Record[] = [
    {
      id: 'sf6-1',
      facilityId: 'fac-1',
      facilityName: 'LECO Head Office',
      reportingYear: 2025,
      month: 'January',
      responsibleOfficer: 'Mr. Samantha Perera',
      equipmentId: 'GIS-CB-33KV-01',
      equipmentType: 'Gas Insulated Switchgear (GIS)',
      voltageLevelKV: '33 kV',
      nameplateCapacityKg: 25.0,
      beginningInventoryKg: 12.0,
      inventoryPurchasedRefilledKg: 1.5,
      inventoryRecoveredKg: 0.0,
      endingInventoryKg: 12.5,
      netLossKg: 1.0, // (12.0 + 1.5 - 0 - 12.5) = 1.0 kg leakage
      gwpFactor: 23500,
      calculatedKgCO2e: 1.0 * 23500,
      calculatedTCO2e: Number(((1.0 * 23500) / 1000).toFixed(4)),
      status: 'Approved',
      remarks: 'Primary distribution substation switchgear chamber top-up',
      createdAt: '2025-02-01T12:00:00Z',
      updatedAt: '2025-02-01T12:00:00Z'
    }
  ];

  // Scope 2: Electricity
  const scope2Electricity: Scope2ElectricityRecord[] = [
    {
      id: 'elec-1',
      facilityId: 'fac-1',
      facilityName: 'LECO Head Office',
      reportingYear: 2025,
      month: 'January',
      responsibleOfficer: 'Mr. Samantha Perera',
      accountNumber: 'ACC-010-9882',
      meterNumber: 'MTR-COL-001',
      tariffCategory: 'Commercial / Industrial General',
      consumedKWh: 38400,
      billedAmountLKR: 2457600,
      gridEmissionFactorKgPerKWh: 0.655,
      calculatedKgCO2e: 38400 * 0.655,
      calculatedTCO2e: Number(((38400 * 0.655) / 1000).toFixed(4)),
      status: 'Approved',
      remarks: 'Head Office 7-story building main meter',
      createdAt: '2025-02-05T09:00:00Z',
      updatedAt: '2025-02-05T09:00:00Z'
    },
    {
      id: 'elec-2',
      facilityId: 'fac-2',
      facilityName: 'LECO Meter Testing & Assembly Factory',
      reportingYear: 2025,
      month: 'January',
      responsibleOfficer: 'Eng. Ruwan Jayasuriya',
      accountNumber: 'ACC-038-7711',
      meterNumber: 'MTR-MF-101',
      tariffCategory: 'Industrial Medium Voltage',
      consumedKWh: 29500,
      billedAmountLKR: 1888000,
      gridEmissionFactorKgPerKWh: 0.655,
      calculatedKgCO2e: 29500 * 0.655,
      calculatedTCO2e: Number(((29500 * 0.655) / 1000).toFixed(4)),
      status: 'Approved',
      remarks: 'Meter factory automated assembly lines & test bays',
      createdAt: '2025-02-05T10:00:00Z',
      updatedAt: '2025-02-05T10:00:00Z'
    },
    {
      id: 'elec-3',
      facilityId: 'fac-3',
      facilityName: 'Kotte Branch & Customer Service Centre',
      reportingYear: 2025,
      month: 'January',
      responsibleOfficer: 'Mrs. Dilani Senanayake',
      accountNumber: 'ACC-011-3341',
      meterNumber: 'MTR-KT-09',
      tariffCategory: 'Commercial',
      consumedKWh: 7800,
      billedAmountLKR: 499200,
      gridEmissionFactorKgPerKWh: 0.655,
      calculatedKgCO2e: 7800 * 0.655,
      calculatedTCO2e: Number(((7800 * 0.655) / 1000).toFixed(4)),
      status: 'Approved',
      remarks: 'Branch CSC office and bill collection counters',
      createdAt: '2025-02-06T11:00:00Z',
      updatedAt: '2025-02-06T11:00:00Z'
    },
    {
      id: 'elec-4',
      facilityId: 'fac-4',
      facilityName: 'Moratuwa Branch Office',
      reportingYear: 2025,
      month: 'January',
      responsibleOfficer: 'Mr. Kusal Fernando',
      accountNumber: 'ACC-011-4567',
      meterNumber: 'MTR-MR-22',
      tariffCategory: 'Commercial',
      consumedKWh: 6400,
      billedAmountLKR: 409600,
      gridEmissionFactorKgPerKWh: 0.655,
      calculatedKgCO2e: 6400 * 0.655,
      calculatedTCO2e: Number(((6400 * 0.655) / 1000).toFixed(4)),
      status: 'Approved',
      remarks: 'Moratuwa customer service & engineering depot',
      createdAt: '2025-02-06T14:00:00Z',
      updatedAt: '2025-02-06T14:00:00Z'
    },
    {
      id: 'elec-5',
      facilityId: 'fac-5',
      facilityName: 'Kalutara Branch & CSC',
      reportingYear: 2025,
      month: 'January',
      responsibleOfficer: 'Mr. Asanka Weerakkody',
      accountNumber: 'ACC-034-8890',
      meterNumber: 'MTR-KL-05',
      tariffCategory: 'Commercial',
      consumedKWh: 5900,
      billedAmountLKR: 377600,
      gridEmissionFactorKgPerKWh: 0.655,
      calculatedKgCO2e: 5900 * 0.655,
      calculatedTCO2e: Number(((5900 * 0.655) / 1000).toFixed(4)),
      status: 'Approved',
      remarks: 'Kalutara branch building',
      createdAt: '2025-02-07T09:00:00Z',
      updatedAt: '2025-02-07T09:00:00Z'
    },
    {
      id: 'elec-6',
      facilityId: 'fac-6',
      facilityName: 'Negombo Branch & Operations',
      reportingYear: 2025,
      month: 'January',
      responsibleOfficer: 'Eng. Priyantha Dissanayake',
      accountNumber: 'ACC-031-1029',
      meterNumber: 'MTR-NG-44',
      tariffCategory: 'Commercial',
      consumedKWh: 8200,
      billedAmountLKR: 524800,
      gridEmissionFactorKgPerKWh: 0.655,
      calculatedKgCO2e: 8200 * 0.655,
      calculatedTCO2e: Number(((8200 * 0.655) / 1000).toFixed(4)),
      status: 'Approved',
      remarks: 'Negombo regional control centre',
      createdAt: '2025-02-07T11:00:00Z',
      updatedAt: '2025-02-07T11:00:00Z'
    }
  ];

  // Scope 2: Solar PV Generation
  const scope2Solar: Scope2SolarRecord[] = [
    {
      id: 'sol-1',
      facilityId: 'fac-1',
      facilityName: 'LECO Head Office',
      reportingYear: 2025,
      month: 'January',
      responsibleOfficer: 'Mr. Samantha Perera',
      systemCapacityKWp: 75.0,
      solarGeneratedKWh: 9450,
      selfConsumedKWh: 8200,
      exportedToGridKWh: 1250,
      importedFromGridKWh: 30200,
      avoidedEmissionsTCO2e: Number(((9450 * 0.655) / 1000).toFixed(4)),
      netPurchasedKWh: 30200 - 1250,
      netScope2EmissionsTCO2e: Number((((30200 - 1250) * 0.655) / 1000).toFixed(4)),
      status: 'Approved',
      remarks: 'Rooftop Solar PV net-accounting scheme',
      createdAt: '2025-02-05T09:30:00Z',
      updatedAt: '2025-02-05T09:30:00Z'
    },
    {
      id: 'sol-2',
      facilityId: 'fac-2',
      facilityName: 'LECO Meter Testing & Assembly Factory',
      reportingYear: 2025,
      month: 'January',
      responsibleOfficer: 'Eng. Ruwan Jayasuriya',
      systemCapacityKWp: 120.0,
      solarGeneratedKWh: 15120,
      selfConsumedKWh: 14200,
      exportedToGridKWh: 920,
      importedFromGridKWh: 15300,
      avoidedEmissionsTCO2e: Number(((15120 * 0.655) / 1000).toFixed(4)),
      netPurchasedKWh: 15300 - 920,
      netScope2EmissionsTCO2e: Number((((15300 - 920) * 0.655) / 1000).toFixed(4)),
      status: 'Approved',
      remarks: 'Bandaragama factory rooftop installation',
      createdAt: '2025-02-05T10:30:00Z',
      updatedAt: '2025-02-05T10:30:00Z'
    }
  ];

  // Scope 3: Purchased Goods
  const scope3PurchasedGoods: Scope3PurchasedGoodsRecord[] = [
    {
      id: 'pg-1',
      facilityId: 'fac-7',
      facilityName: 'Central Logistics & Materials Store',
      reportingYear: 2025,
      month: 'January',
      responsibleOfficer: 'Mr. Nimal Wickramasinghe',
      category: 'Cables & Conductors',
      itemDescription: 'All-Aluminium Alloy Conductor (AAAC) 100mm² & Aerial Bundled Cables',
      quantity: 45,
      unit: 'Kilometers',
      supplierName: 'Kelani Cables PLC',
      valueLKR: 18500000,
      spendEmissionFactorKgPer1000LKR: 0.48,
      calculatedKgCO2e: (18500000 / 1000) * 0.48,
      calculatedTCO2e: Number((((18500000 / 1000) * 0.48) / 1000).toFixed(4)),
      status: 'Approved',
      remarks: 'Medium voltage distribution line reinforcement stock',
      createdAt: '2025-02-10T09:00:00Z',
      updatedAt: '2025-02-10T09:00:00Z'
    },
    {
      id: 'pg-2',
      facilityId: 'fac-2',
      facilityName: 'LECO Meter Testing & Assembly Factory',
      reportingYear: 2025,
      month: 'January',
      responsibleOfficer: 'Eng. Ruwan Jayasuriya',
      category: 'Electricity Meters & Testing',
      itemDescription: 'Smart Meter Electronic Microcontroller Modules & Polycarbonate Enclosures',
      quantity: 5000,
      unit: 'Units',
      supplierName: 'LECO-Antek Meter JV (Pvt) Ltd',
      valueLKR: 12400000,
      spendEmissionFactorKgPer1000LKR: 0.45,
      calculatedKgCO2e: (12400000 / 1000) * 0.45,
      calculatedTCO2e: Number((((12400000 / 1000) * 0.45) / 1000).toFixed(4)),
      status: 'Approved',
      remarks: 'Single phase smart energy meter assembly components',
      createdAt: '2025-02-10T11:00:00Z',
      updatedAt: '2025-02-10T11:00:00Z'
    }
  ];

  // Scope 3: Capital Goods
  const scope3CapitalGoods: Scope3CapitalGoodsRecord[] = [
    {
      id: 'cg-1',
      facilityId: 'fac-7',
      facilityName: 'Central Logistics & Materials Store',
      reportingYear: 2025,
      month: 'January',
      responsibleOfficer: 'Mr. Nimal Wickramasinghe',
      assetName: '11kV / 400V 500kVA Distribution Transformers (Mineral Oil Immersed)',
      assetType: 'Distribution Transformers',
      quantity: 8,
      supplier: 'LTL Transformers (Pvt) Ltd',
      valueLKR: 28800000,
      depreciationYears: 20,
      spendEmissionFactorKgPer1000LKR: 0.52,
      calculatedKgCO2e: (28800000 / 1000) * 0.52,
      calculatedTCO2e: Number((((28800000 / 1000) * 0.52) / 1000).toFixed(4)),
      status: 'Approved',
      remarks: 'Capitalized substations for Colombo South network reliability',
      createdAt: '2025-02-12T09:00:00Z',
      updatedAt: '2025-02-12T09:00:00Z'
    }
  ];

  // Scope 3: Construction & Infrastructure
  const scope3Construction: Scope3ConstructionRecord[] = [
    {
      id: 'const-1',
      facilityId: 'fac-3',
      facilityName: 'Kotte Branch & Customer Service Centre',
      reportingYear: 2025,
      month: 'January',
      responsibleOfficer: 'Mrs. Dilani Senanayake',
      projectName: 'Rajagiriya-Kotte Underground 33kV Cable Ducting Project',
      projectType: 'Underground Cabling',
      contractorName: 'Sierra Construction (Pvt) Ltd',
      constructionPeriodMonths: 8,
      projectValueLKR: 42000000,
      majorMaterialsSummary: 'Trenching, concrete ducts, backfill gravel, asphalt resurfacing',
      calculatedKgCO2e: (42000000 / 1000) * 0.38,
      calculatedTCO2e: Number((((42000000 / 1000) * 0.38) / 1000).toFixed(4)),
      status: 'Approved',
      remarks: 'Urban power aesthetic & reliability underground conversion',
      createdAt: '2025-02-14T10:00:00Z',
      updatedAt: '2025-02-14T10:00:00Z'
    }
  ];

  // Scope 3: Upstream Freight
  const scope3UpstreamFreight: Scope3UpstreamFreightRecord[] = [
    {
      id: 'frt-1',
      facilityId: 'fac-7',
      facilityName: 'Central Logistics & Materials Store',
      reportingYear: 2025,
      month: 'January',
      responsibleOfficer: 'Mr. Nimal Wickramasinghe',
      materialDescription: 'Bulk Transformer Oil & Galvanized Steel Poles',
      origin: 'Colombo Port Container Terminal',
      destination: 'Central Store Kotikawatta',
      weightTonnes: 38.5,
      distanceKm: 28,
      transportMode: 'Heavy Diesel Truck (14t+)',
      emissionFactorKgPerTonneKm: 0.162,
      calculatedKgCO2e: 38.5 * 28 * 0.162,
      calculatedTCO2e: Number(((38.5 * 28 * 0.162) / 1000).toFixed(4)),
      status: 'Approved',
      remarks: 'Direct logistics delivery from port clearance',
      createdAt: '2025-02-15T09:00:00Z',
      updatedAt: '2025-02-15T09:00:00Z'
    }
  ];

  // Scope 3: Waste
  const scope3Waste: Scope3WasteRecord[] = [
    {
      id: 'wst-1',
      facilityId: 'fac-7',
      facilityName: 'Central Logistics & Materials Store',
      reportingYear: 2025,
      month: 'January',
      responsibleOfficer: 'Mr. Nimal Wickramasinghe',
      wasteType: 'Scrap Copper & Aluminum',
      quantityKg: 3200,
      disposalMethod: 'Authorized Certified Recycling',
      contractorName: 'Green Metals Recycling Sri Lanka Ltd',
      emissionFactorKgPerKg: -0.22,
      calculatedKgCO2e: 3200 * -0.22,
      calculatedTCO2e: Number(((3200 * -0.22) / 1000).toFixed(4)),
      status: 'Approved',
      remarks: 'Decommissioned distribution line conductor recycling (Avoided emissions credit)',
      createdAt: '2025-02-16T14:00:00Z',
      updatedAt: '2025-02-16T14:00:00Z'
    },
    {
      id: 'wst-2',
      facilityId: 'fac-1',
      facilityName: 'LECO Head Office',
      reportingYear: 2025,
      month: 'January',
      responsibleOfficer: 'Mr. Samantha Perera',
      wasteType: 'Mixed Municipal Solid Waste',
      quantityKg: 850,
      disposalMethod: 'Controlled Landfill',
      contractorName: 'Colombo Municipal Council (CMC)',
      emissionFactorKgPerKg: 0.58,
      calculatedKgCO2e: 850 * 0.58,
      calculatedTCO2e: Number(((850 * 0.58) / 1000).toFixed(4)),
      status: 'Approved',
      remarks: 'Head office non-recyclable general waste',
      createdAt: '2025-02-16T15:00:00Z',
      updatedAt: '2025-02-16T15:00:00Z'
    }
  ];

  // Scope 3: Business Travel & Commuting
  const scope3BusinessTravel: Scope3BusinessTravelRecord[] = [
    {
      id: 'trv-1',
      facilityId: 'fac-1',
      facilityName: 'LECO Head Office',
      reportingYear: 2025,
      month: 'January',
      responsibleOfficer: 'Mr. Samantha Perera',
      travelCategory: 'Business Travel',
      purposeOrEmployeeGroup: 'IEEE Smart Grid Power Systems Conference Delegation',
      origin: 'Colombo (CMB)',
      destination: 'Singapore (SIN)',
      transportMode: 'International Air Flight',
      numberOfTrips: 3,
      distanceKmPerTrip: 2750,
      totalPassengerKm: 3 * 2750,
      emissionFactorKgPerPassengerKm: 0.102,
      calculatedKgCO2e: 3 * 2750 * 0.102,
      calculatedTCO2e: Number(((3 * 2750 * 0.102) / 1000).toFixed(4)),
      status: 'Approved',
      remarks: 'Executive engineering team smart metering delegation',
      createdAt: '2025-02-18T09:00:00Z',
      updatedAt: '2025-02-18T09:00:00Z'
    },
    {
      id: 'trv-2',
      facilityId: 'fac-1',
      facilityName: 'LECO Head Office',
      reportingYear: 2025,
      month: 'January',
      responsibleOfficer: 'Mr. Samantha Perera',
      travelCategory: 'Employee Commuting',
      purposeOrEmployeeGroup: 'Head Office Staff Daily Commuting Survey',
      origin: 'Colombo Suburbs (Piliyandala, Maharagama, Kadawatha)',
      destination: 'Kollupitiya Head Office',
      transportMode: 'Public Bus',
      numberOfTrips: 550,
      distanceKmPerTrip: 18,
      totalPassengerKm: 550 * 18,
      emissionFactorKgPerPassengerKm: 0.042,
      calculatedKgCO2e: 550 * 18 * 0.042,
      calculatedTCO2e: Number(((550 * 18 * 0.042) / 1000).toFixed(4)),
      status: 'Approved',
      remarks: 'Aggregated monthly employee commuting survey results',
      createdAt: '2025-02-18T10:00:00Z',
      updatedAt: '2025-02-18T10:00:00Z'
    }
  ];

  // Scope 3: Distribution Technical & Commercial Losses
  const scope3DistributionLoss: Scope3DistributionLossRecord[] = [
    {
      id: 'loss-1',
      facilityId: 'fac-1',
      facilityName: 'LECO Head Office',
      reportingYear: 2025,
      month: 'January',
      responsibleOfficer: 'Mr. Samantha Perera',
      electricityReceivedFromCEBMWh: 145000,
      lecoOwnConsumptionMWh: 105,
      electricityBilledToConsumersMWh: 139200,
      distributionLossMWh: 145000 - 105 - 139200, // 5695 MWh
      lossPercentage: Number((((145000 - 105 - 139200) / 145000) * 100).toFixed(2)), // ~3.93% (LECO world class low loss rate)
      gridEmissionFactorTonnePerMWh: 0.655,
      calculatedKgCO2e: (145000 - 105 - 139200) * 0.655 * 1000,
      calculatedTCO2e: Number(((145000 - 105 - 139200) * 0.655).toFixed(4)),
      status: 'Approved',
      remarks: 'LECO Low-Loss Distribution Grid (3.93% Technical & Commercial Loss)',
      createdAt: '2025-02-20T09:00:00Z',
      updatedAt: '2025-02-20T09:00:00Z'
    }
  ];

  return {
    facilities: DEFAULT_FACILITIES,
    users: DEFAULT_USERS,
    emissionFactors: DEFAULT_EMISSION_FACTORS,
    scope1Vehicles,
    scope1Generators,
    scope1Stationary,
    scope1Refrigerants,
    scope1SF6,
    scope2Electricity,
    scope2Solar,
    scope3PurchasedGoods,
    scope3CapitalGoods,
    scope3Construction,
    scope3UpstreamFreight,
    scope3Waste,
    scope3BusinessTravel,
    scope3DistributionLoss
  };
}

class DatabaseManager {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        
        // Ensure root super admin is always present and immutable
        if (parsed.users) {
          const rootAdminIndex = parsed.users.findIndex((u: User) => u.email?.toLowerCase() === 'superadmincf@leco.com');
          if (rootAdminIndex === -1) {
            parsed.users.unshift(DEFAULT_USERS[0]);
          } else {
            parsed.users[rootAdminIndex] = {
              ...parsed.users[rootAdminIndex],
              role: 'super_admin',
              canDelete: true,
              isImmutableRootAdmin: true,
              email: 'superadmincf@leco.com',
              isActive: true
            };
          }

          // Ensure default hierarchical demo users exist
          DEFAULT_USERS.forEach(defUser => {
            if (!parsed.users.some((u: User) => u.id === defUser.id || u.email.toLowerCase() === defUser.email.toLowerCase())) {
              parsed.users.push(defUser);
            }
          });
        } else {
          parsed.users = DEFAULT_USERS;
        }

        // Ensure hierarchical facilities are present with jobRoles and parent IDs
        if (!parsed.facilities || parsed.facilities.length < DEFAULT_FACILITIES.length) {
          parsed.facilities = DEFAULT_FACILITIES;
        } else {
          // Merge missing default hierarchical facilities
          DEFAULT_FACILITIES.forEach(defFac => {
            const existingIdx = parsed.facilities.findIndex((f: Facility) => f.id === defFac.id || f.code === defFac.code);
            if (existingIdx === -1) {
              parsed.facilities.push(defFac);
            } else {
              parsed.facilities[existingIdx] = {
                ...defFac,
                ...parsed.facilities[existingIdx],
                parentId: defFac.parentId !== undefined ? defFac.parentId : parsed.facilities[existingIdx].parentId,
                parentName: defFac.parentName || parsed.facilities[existingIdx].parentName,
                isParent: defFac.isParent !== undefined ? defFac.isParent : parsed.facilities[existingIdx].isParent,
                jobRoles: parsed.facilities[existingIdx].jobRoles && parsed.facilities[existingIdx].jobRoles.length > 0
                  ? parsed.facilities[existingIdx].jobRoles
                  : defFac.jobRoles
              };
            }
          });
        }
        return parsed;
      }
    } catch (e) {
      console.error('Error loading data from disk, initializing fresh:', e);
    }
    const initial = generateInitialRecords();
    this.saveData(initial);
    return initial;
  }

  public saveData(customData?: DatabaseSchema): void {
    try {
      const toSave = customData || this.data;
      fs.writeFileSync(DATA_FILE, JSON.stringify(toSave, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing database to disk:', e);
    }
  }

  public getRawData(): DatabaseSchema {
    return this.data;
  }

  public resetToDefault(): DatabaseSchema {
    this.data = generateInitialRecords();
    this.saveData();
    return this.data;
  }

  // Facilities
  public getFacilities(): Facility[] {
    return this.data.facilities;
  }

  public addFacility(facility: Facility): Facility {
    if (!facility.jobRoles) {
      facility.jobRoles = [];
    }
    this.data.facilities.push(facility);
    this.saveData();
    return facility;
  }

  public updateFacility(id: string, updates: Partial<Facility>): Facility | null {
    const idx = this.data.facilities.findIndex(f => f.id === id);
    if (idx === -1) return null;
    this.data.facilities[idx] = { ...this.data.facilities[idx], ...updates };
    this.saveData();
    return this.data.facilities[idx];
  }

  public deleteFacility(id: string): boolean {
    const before = this.data.facilities.length;
    this.data.facilities = this.data.facilities.filter(f => f.id !== id);
    this.saveData();
    return this.data.facilities.length < before;
  }

  // Facility Job Roles
  public addFacilityJobRole(facilityId: string, roleName: string, description?: string): FacilityJobRole | null {
    const fac = this.data.facilities.find(f => f.id === facilityId);
    if (!fac) return null;
    if (!fac.jobRoles) fac.jobRoles = [];
    const newRole: FacilityJobRole = {
      id: `jr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      facilityId,
      roleName: roleName.trim(),
      description: description?.trim() || '',
      createdAt: new Date().toISOString()
    };
    fac.jobRoles.push(newRole);
    this.saveData();
    return newRole;
  }

  public deleteFacilityJobRole(facilityId: string, roleId: string): boolean {
    const fac = this.data.facilities.find(f => f.id === facilityId);
    if (!fac || !fac.jobRoles) return false;
    const before = fac.jobRoles.length;
    fac.jobRoles = fac.jobRoles.filter(r => r.id !== roleId);
    this.saveData();
    return fac.jobRoles.length < before;
  }

  // Users & RBAC Management
  public getUsers(): User[] {
    return this.data.users;
  }

  public addUser(user: User): User {
    // Check if email already exists
    const existing = this.data.users.find(u => u.email.toLowerCase() === user.email.toLowerCase());
    if (existing) {
      throw new Error(`User with email ${user.email} already exists`);
    }
    const cleanUser: User = {
      ...user,
      canDelete: user.canDelete ?? false,
      isImmutableRootAdmin: false,
      isActive: user.isActive ?? true,
      createdAt: user.createdAt || new Date().toISOString()
    };
    this.data.users.push(cleanUser);
    this.saveData();
    return cleanUser;
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    const existing = this.data.users[idx];

    // ROOT SUPER ADMIN IMMUTABILITY PROTECTION
    if (existing.isImmutableRootAdmin || existing.email.toLowerCase() === 'superadmincf@leco.com') {
      // Prevent changing role, email, active status, or delete permissions for root super admin
      this.data.users[idx] = {
        ...existing,
        name: updates.name || existing.name,
        contactNumber: updates.contactNumber || existing.contactNumber,
        department: updates.department || existing.department,
        role: 'super_admin',
        email: 'superadmincf@leco.com',
        canDelete: true,
        isActive: true,
        isImmutableRootAdmin: true
      };
      this.saveData();
      return this.data.users[idx];
    }

    this.data.users[idx] = {
      ...existing,
      ...updates,
      isImmutableRootAdmin: false // Only root user retains this
    };
    this.saveData();
    return this.data.users[idx];
  }

  public deleteUser(id: string): { success: boolean; message?: string } {
    const user = this.data.users.find(u => u.id === id);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // ROOT SUPER ADMIN IMMUTABILITY PROTECTION
    if (user.isImmutableRootAdmin || user.email.toLowerCase() === 'superadmincf@leco.com') {
      return { 
        success: false, 
        message: 'Security Violation: Root Super Admin profile (superadmincf@leco.com) is permanently immutable and cannot be deleted.' 
      };
    }

    this.data.users = this.data.users.filter(u => u.id !== id);
    this.saveData();
    return { success: true };
  }

  public toggleUserDeletePermission(id: string, canDelete: boolean): User | null {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return null;
    if (user.isImmutableRootAdmin || user.email.toLowerCase() === 'superadmincf@leco.com') {
      return user; // Super Admin delete permission is always true
    }
    user.canDelete = canDelete;
    this.saveData();
    return user;
  }

  // Emission factors
  public getEmissionFactors(): EmissionFactorEntry[] {
    return this.data.emissionFactors;
  }

  public updateEmissionFactor(id: string, factor: number): EmissionFactorEntry | null {
    const item = this.data.emissionFactors.find(e => e.id === id);
    if (!item) return null;
    item.factorKgCO2e = factor;
    this.saveData();
    return item;
  }

  // Generic generic scope collections handlers
  public getCollection<T>(collectionName: keyof DatabaseSchema): T[] {
    return this.data[collectionName] as unknown as T[];
  }

  public addToCollection<T extends { id: string }>(collectionName: keyof DatabaseSchema, item: T): T {
    (this.data[collectionName] as unknown as T[]).push(item);
    this.saveData();
    return item;
  }

  public updateInCollection<T extends { id: string }>(collectionName: keyof DatabaseSchema, id: string, updates: Partial<T>): T | null {
    const list = this.data[collectionName] as unknown as T[];
    const idx = list.findIndex(item => item.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates };
    this.saveData();
    return list[idx];
  }

  public deleteFromCollection<T extends { id: string }>(collectionName: keyof DatabaseSchema, id: string): boolean {
    const list = this.data[collectionName] as unknown as T[];
    const before = list.length;
    (this.data[collectionName] as unknown as T[]) = list.filter(item => item.id !== id);
    this.saveData();
    return (this.data[collectionName] as unknown as T[]).length < before;
  }

  // Calculate comprehensive analytics
  public getAnalyticsSummary(year?: number, facilityId?: string): {
    totals: ScopeTotals;
    monthlyTrends: MonthlyEmissionTrend[];
    facilityStats: FacilityEmissionStat[];
  } {
    // Determine matching facility IDs (including child CSCs if this is a parent branch)
    let matchingFacilityIds: string[] = [];
    if (facilityId && facilityId !== 'ALL') {
      matchingFacilityIds = [facilityId];
      const children = this.data.facilities.filter(f => f.parentId === facilityId);
      children.forEach(c => matchingFacilityIds.push(c.id));
    }

    const filterFn = (rec: { reportingYear: number; facilityId: string }) => {
      if (year && rec.reportingYear !== Number(year)) return false;
      if (facilityId && facilityId !== 'ALL' && !matchingFacilityIds.includes(rec.facilityId)) return false;
      return true;
    };

    // Scope 1
    const v = this.data.scope1Vehicles.filter(filterFn);
    const g = this.data.scope1Generators.filter(filterFn);
    const st = this.data.scope1Stationary.filter(filterFn);
    const rf = this.data.scope1Refrigerants.filter(filterFn);
    const sf = this.data.scope1SF6.filter(filterFn);

    const vehT = v.reduce((sum, item) => sum + (item.calculatedTCO2e || 0), 0);
    const genT = g.reduce((sum, item) => sum + (item.calculatedTCO2e || 0), 0);
    const statT = st.reduce((sum, item) => sum + (item.calculatedTCO2e || 0), 0);
    const refT = rf.reduce((sum, item) => sum + (item.calculatedTCO2e || 0), 0);
    const sf6T = sf.reduce((sum, item) => sum + (item.calculatedTCO2e || 0), 0);
    const totalScope1 = vehT + genT + statT + refT + sf6T;

    // Scope 2
    const el = this.data.scope2Electricity.filter(filterFn);
    const sol = this.data.scope2Solar.filter(filterFn);

    const elecT = el.reduce((sum, item) => sum + (item.calculatedTCO2e || 0), 0);
    const solAvoidedT = sol.reduce((sum, item) => sum + (item.avoidedEmissionsTCO2e || 0), 0);
    const solGenKWh = sol.reduce((sum, item) => sum + (item.solarGeneratedKWh || 0), 0);
    const netScope2T = Math.max(0, elecT - solAvoidedT);

    // Scope 3
    const pg = this.data.scope3PurchasedGoods.filter(filterFn);
    const cg = this.data.scope3CapitalGoods.filter(filterFn);
    const cn = this.data.scope3Construction.filter(filterFn);
    const fr = this.data.scope3UpstreamFreight.filter(filterFn);
    const ws = this.data.scope3Waste.filter(filterFn);
    const tr = this.data.scope3BusinessTravel.filter(filterFn);
    const dl = this.data.scope3DistributionLoss.filter(filterFn);

    const pgT = pg.reduce((sum, item) => sum + (item.calculatedTCO2e || 0), 0);
    const cgT = cg.reduce((sum, item) => sum + (item.calculatedTCO2e || 0), 0);
    const cnT = cn.reduce((sum, item) => sum + (item.calculatedTCO2e || 0), 0);
    const frT = fr.reduce((sum, item) => sum + (item.calculatedTCO2e || 0), 0);
    const wsT = ws.reduce((sum, item) => sum + (item.calculatedTCO2e || 0), 0);
    const trT = tr.reduce((sum, item) => sum + (item.calculatedTCO2e || 0), 0);
    const dlT = dl.reduce((sum, item) => sum + (item.calculatedTCO2e || 0), 0);
    const totalScope3 = pgT + cgT + cnT + frT + wsT + trT + dlT;

    const grandTotalTCO2e = Number((totalScope1 + elecT + totalScope3).toFixed(3));
    const netTotalTCO2e = Number((totalScope1 + netScope2T + totalScope3).toFixed(3));
    const totalRecordsCount = v.length + g.length + st.length + rf.length + sf.length + el.length + sol.length + pg.length + cg.length + cn.length + fr.length + ws.length + tr.length + dl.length;

    const totals: ScopeTotals = {
      scope1: {
        totalTCO2e: Number(totalScope1.toFixed(3)),
        vehiclesTCO2e: Number(vehT.toFixed(3)),
        generatorsTCO2e: Number(genT.toFixed(3)),
        stationaryLPGTCO2e: Number(statT.toFixed(3)),
        refrigerantsTCO2e: Number(refT.toFixed(3)),
        sf6TCO2e: Number(sf6T.toFixed(3))
      },
      scope2: {
        totalTCO2e: Number(elecT.toFixed(3)),
        gridElectricityTCO2e: Number(elecT.toFixed(3)),
        solarGeneratedKWh: Number(solGenKWh.toFixed(1)),
        solarAvoidedTCO2e: Number(solAvoidedT.toFixed(3)),
        netScope2TCO2e: Number(netScope2T.toFixed(3))
      },
      scope3: {
        totalTCO2e: Number(totalScope3.toFixed(3)),
        purchasedGoodsTCO2e: Number(pgT.toFixed(3)),
        capitalGoodsTCO2e: Number(cgT.toFixed(3)),
        constructionTCO2e: Number(cnT.toFixed(3)),
        upstreamFreightTCO2e: Number(frT.toFixed(3)),
        wasteTCO2e: Number(wsT.toFixed(3)),
        businessTravelCommutingTCO2e: Number(trT.toFixed(3)),
        distributionLossTCO2e: Number(dlT.toFixed(3))
      },
      grandTotalTCO2e,
      netTotalTCO2e,
      totalRecordsCount
    };

    // Monthly trends
    const monthNames: ReportingMonth[] = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthShorts = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const monthlyTrends: MonthlyEmissionTrend[] = monthNames.map((m, idx) => {
      const matchMonth = (rec: { month: ReportingMonth }) => rec.month === m;
      const s1m = v.filter(matchMonth).reduce((s, i) => s + i.calculatedTCO2e, 0)
        + g.filter(matchMonth).reduce((s, i) => s + i.calculatedTCO2e, 0)
        + st.filter(matchMonth).reduce((s, i) => s + i.calculatedTCO2e, 0)
        + rf.filter(matchMonth).reduce((s, i) => s + i.calculatedTCO2e, 0)
        + sf.filter(matchMonth).reduce((s, i) => s + i.calculatedTCO2e, 0);

      const s2m = el.filter(matchMonth).reduce((s, i) => s + i.calculatedTCO2e, 0);
      const solAvoidm = sol.filter(matchMonth).reduce((s, i) => s + i.avoidedEmissionsTCO2e, 0);

      const s3m = pg.filter(matchMonth).reduce((s, i) => s + i.calculatedTCO2e, 0)
        + cg.filter(matchMonth).reduce((s, i) => s + i.calculatedTCO2e, 0)
        + cn.filter(matchMonth).reduce((s, i) => s + i.calculatedTCO2e, 0)
        + fr.filter(matchMonth).reduce((s, i) => s + i.calculatedTCO2e, 0)
        + ws.filter(matchMonth).reduce((s, i) => s + i.calculatedTCO2e, 0)
        + tr.filter(matchMonth).reduce((s, i) => s + i.calculatedTCO2e, 0)
        + dl.filter(matchMonth).reduce((s, i) => s + i.calculatedTCO2e, 0);

      return {
        month: m,
        monthShort: monthShorts[idx],
        scope1: Number(s1m.toFixed(2)),
        scope2: Number(s2m.toFixed(2)),
        scope3: Number(s3m.toFixed(2)),
        total: Number((s1m + s2m + s3m).toFixed(2)),
        solarAvoided: Number(solAvoidm.toFixed(2))
      };
    });

    // Facility stats
    const facilityStats: FacilityEmissionStat[] = this.data.facilities.map(fac => {
      const matchFac = (rec: { facilityId: string; reportingYear: number }) => {
        if (rec.facilityId !== fac.id) return false;
        if (year && rec.reportingYear !== Number(year)) return false;
        return true;
      };

      const s1 = this.data.scope1Vehicles.filter(matchFac).reduce((s, i) => s + i.calculatedTCO2e, 0)
        + this.data.scope1Generators.filter(matchFac).reduce((s, i) => s + i.calculatedTCO2e, 0)
        + this.data.scope1Stationary.filter(matchFac).reduce((s, i) => s + i.calculatedTCO2e, 0)
        + this.data.scope1Refrigerants.filter(matchFac).reduce((s, i) => s + i.calculatedTCO2e, 0)
        + this.data.scope1SF6.filter(matchFac).reduce((s, i) => s + i.calculatedTCO2e, 0);

      const s2 = this.data.scope2Electricity.filter(matchFac).reduce((s, i) => s + i.calculatedTCO2e, 0);

      const s3 = this.data.scope3PurchasedGoods.filter(matchFac).reduce((s, i) => s + i.calculatedTCO2e, 0)
        + this.data.scope3CapitalGoods.filter(matchFac).reduce((s, i) => s + i.calculatedTCO2e, 0)
        + this.data.scope3Construction.filter(matchFac).reduce((s, i) => s + i.calculatedTCO2e, 0)
        + this.data.scope3UpstreamFreight.filter(matchFac).reduce((s, i) => s + i.calculatedTCO2e, 0)
        + this.data.scope3Waste.filter(matchFac).reduce((s, i) => s + i.calculatedTCO2e, 0)
        + this.data.scope3BusinessTravel.filter(matchFac).reduce((s, i) => s + i.calculatedTCO2e, 0)
        + this.data.scope3DistributionLoss.filter(matchFac).reduce((s, i) => s + i.calculatedTCO2e, 0);

      const total = Number((s1 + s2 + s3).toFixed(2));
      const percentage = grandTotalTCO2e > 0 ? Number(((total / grandTotalTCO2e) * 100).toFixed(1)) : 0;

      return {
        facilityId: fac.id,
        facilityName: fac.name,
        facilityType: fac.type,
        location: fac.location,
        scope1: Number(s1.toFixed(2)),
        scope2: Number(s2.toFixed(2)),
        scope3: Number(s3.toFixed(2)),
        total,
        percentage
      };
    });

    return { totals, monthlyTrends, facilityStats };
  }
}

export const db = new DatabaseManager();
