import fs from 'fs';
import path from 'path';
import { 
  User, 
  Facility, 
  EmissionFactor, 
  Scope1Record, 
  Scope2Record, 
  Scope3Record,
  DashboardSummary,
  MonthlyEmissionTrend,
  FacilityEmissionStat
} from '../src/types';

const DATA_FILE = path.join(process.cwd(), 'server-data.json');

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
    contactNumber: '+94 11 264 5510',
    electricityAccountNo: 'ACC-011-4567',
    meterNumbers: ['MTR-MR-01', 'MTR-MR-02'],
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
    contactNumber: '+94 34 222 2250',
    electricityAccountNo: 'ACC-034-8890',
    meterNumbers: ['MTR-KL-01'],
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
    contactNumber: '+94 31 222 3450',
    electricityAccountNo: 'ACC-031-1029',
    meterNumbers: ['MTR-NG-01'],
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

  // 8. Independent Facilities (Standalones)
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
    id: 'usr-root-superadmin',
    email: 'superadmincf@leco.com',
    name: 'LECO Corporate Super Administrator',
    role: 'super_admin',
    jobRole: 'Chief Sustainability & GHG Director',
    canDelete: true,
    allowedModules: ['dashboard', 'scope1', 'scope2', 'scope3', 'reports', 'facilities', 'users', 'factors', 'calculator', 'sync'],
    department: 'Executive Directorate & Sustainability Management',
    isActive: true,
    contactNumber: '+94 11 237 1665',
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
    id: 'usr-5',
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
    id: 'usr-6',
    email: 'officer.kalutara@leco.com',
    name: 'Mr. Asanka Weerakkody',
    role: 'facility_user',
    facilityId: 'fac-br-kalutara',
    facilityName: 'Kalutara Branch',
    jobRole: 'Maintenance Superintendent',
    canDelete: false,
    allowedModules: ['dashboard', 'scope1', 'scope2', 'scope3', 'reports', 'calculator'],
    department: 'Branch Operations',
    isActive: true,
    contactNumber: '+94 34 222 2250',
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-7',
    email: 'factory.qa@leco.com',
    name: 'Eng. Ruwan Jayasuriya',
    role: 'facility_user',
    facilityId: 'fac-mf-bandaragama',
    facilityName: 'LECO Meter Testing & Assembly Factory',
    jobRole: 'Calibration & QA Engineer',
    canDelete: true,
    allowedModules: ['dashboard', 'scope1', 'scope2', 'scope3', 'calculator'],
    department: 'Quality Assurance & Production',
    isActive: true,
    contactNumber: '+94 38 229 4410',
    createdAt: new Date().toISOString()
  }
];

export const DEFAULT_EMISSION_FACTORS: EmissionFactor[] = [
  { id: 'ef-1', category: 'Scope 1', subCategory: 'Stationary Fuel', itemName: 'Diesel (Industrial Generator)', factor: 2.6878, unit: 'kg CO2e / Liter', referenceSource: 'IPCC 2006 Guidelines for National GHG Inventories', year: 2024, isCustom: false },
  { id: 'ef-2', category: 'Scope 1', subCategory: 'Stationary Fuel', itemName: 'Heavy Fuel Oil (Furnace Oil)', factor: 3.1780, unit: 'kg CO2e / Liter', referenceSource: 'IPCC 2006 Guidelines', year: 2024, isCustom: false },
  { id: 'ef-3', category: 'Scope 1', subCategory: 'Stationary Fuel', itemName: 'LPG (Liquid Petroleum Gas)', factor: 1.5120, unit: 'kg CO2e / Liter', referenceSource: 'IPCC 2006 Guidelines', year: 2024, isCustom: false },
  { id: 'ef-4', category: 'Scope 1', subCategory: 'Mobile Fuel', itemName: 'Diesel (Commercial Vans & Trucks)', factor: 2.6878, unit: 'kg CO2e / Liter', referenceSource: 'DEFRA / IPCC 2006 Mobile Combustion', year: 2024, isCustom: false },
  { id: 'ef-5', category: 'Scope 1', subCategory: 'Mobile Fuel', itemName: 'Petrol / Gasoline (Motorbikes & Cars)', factor: 2.3149, unit: 'kg CO2e / Liter', referenceSource: 'DEFRA / IPCC 2006 Mobile Combustion', year: 2024, isCustom: false },
  { id: 'ef-6', category: 'Scope 1', subCategory: 'Fugitive Gas', itemName: 'SF6 (Sulfur Hexafluoride - Switchgear)', factor: 22800.0, unit: 'kg CO2e / kg', referenceSource: 'IPCC AR4 / AR5 GWP Factor', year: 2024, isCustom: false },
  { id: 'ef-7', category: 'Scope 1', subCategory: 'Fugitive Gas', itemName: 'R410A Refrigerant', factor: 2088.0, unit: 'kg CO2e / kg', referenceSource: 'IPCC AR4 GWP Factor', year: 2024, isCustom: false },
  { id: 'ef-8', category: 'Scope 1', subCategory: 'Fugitive Gas', itemName: 'R134a Refrigerant', factor: 1430.0, unit: 'kg CO2e / kg', referenceSource: 'IPCC AR4 GWP Factor', year: 2024, isCustom: false },
  { id: 'ef-9', category: 'Scope 2', subCategory: 'Electricity Grid', itemName: 'Sri Lanka National Grid Average (CEB/LECO)', factor: 0.6550, unit: 'kg CO2e / kWh', referenceSource: 'Sri Lanka Sustainable Energy Authority (SLSEA) 2023/24 Grid Factor', year: 2024, isCustom: false },
  { id: 'ef-10', category: 'Scope 3', subCategory: 'Purchased Goods', itemName: 'Paper Consumption (A4 Office Ream)', factor: 0.9500, unit: 'kg CO2e / kg', referenceSource: 'DEFRA 2024 Material Use', year: 2024, isCustom: false },
  { id: 'ef-11', category: 'Scope 3', subCategory: 'Purchased Goods', itemName: 'Distribution Transformers (New)', factor: 4.2000, unit: 'kg CO2e / kg', referenceSource: 'LECO LCA Environmental Assessment 2023', year: 2024, isCustom: false },
  { id: 'ef-12', category: 'Scope 3', subCategory: 'Purchased Goods', itemName: 'Smart Electricity Meters (LHM)', factor: 8.5000, unit: 'kg CO2e / unit', referenceSource: 'LECO Meter Factory LCA Study', year: 2024, isCustom: false },
  { id: 'ef-13', category: 'Scope 3', subCategory: 'Waste Operations', itemName: 'Municipal Solid Waste Landfill', factor: 0.5200, unit: 'kg CO2e / kg', referenceSource: 'DEFRA 2024 Waste Disposal', year: 2024, isCustom: false },
  { id: 'ef-14', category: 'Scope 3', subCategory: 'Business Travel', itemName: 'Domestic Air & Road Travel (Chartered)', factor: 0.1700, unit: 'kg CO2e / passenger-km', referenceSource: 'DEFRA 2024 Business Travel', year: 2024, isCustom: false },
  { id: 'ef-15', category: 'Scope 3', subCategory: 'Employee Commute', itemName: 'Average Commute (Motorbike/Bus/Car blend)', factor: 0.0890, unit: 'kg CO2e / passenger-km', referenceSource: 'DEFRA 2024 Commuting Factor', year: 2024, isCustom: false }
];

export const INITIAL_SCOPE1_RECORDS: Scope1Record[] = [
  {
    id: 's1-101',
    facilityId: 'fac-ho-colombo',
    facilityName: 'LECO Head Office',
    category: 'stationary_generator',
    sourceName: 'Backup Generator Caterpillar 500kVA',
    fuelType: 'Diesel',
    unit: 'Liters',
    quantity: 1250,
    emissionFactorUsed: 2.6878,
    emissionsTonsCO2e: 3.36,
    reportingMonth: 1,
    reportingYear: 2024,
    notes: 'Power backup during scheduled grid maintenance',
    createdBy: 'Samantha Perera',
    createdAt: '2024-01-28T10:00:00Z'
  },
  {
    id: 's1-102',
    facilityId: 'fac-ho-colombo',
    facilityName: 'LECO Head Office',
    category: 'mobile_fleet',
    sourceName: 'Executive and Emergency Fleet (12 vehicles)',
    fuelType: 'Petrol / Gasoline',
    vehicleType: 'Executive Car / Van',
    vehicleNumber: 'WP-CAD-8812',
    unit: 'Liters',
    quantity: 2400,
    emissionFactorUsed: 2.3149,
    emissionsTonsCO2e: 5.56,
    reportingMonth: 1,
    reportingYear: 2024,
    notes: 'Fleet fuel slips verified by Admin Dept',
    createdBy: 'Samantha Perera',
    createdAt: '2024-01-29T11:00:00Z'
  },
  {
    id: 's1-103',
    facilityId: 'fac-br-kotte',
    facilityName: 'Kotte Branch',
    category: 'mobile_fleet',
    sourceName: 'Field Breakdown & Line Inspection Vans',
    fuelType: 'Diesel',
    vehicleType: 'Commercial Van',
    vehicleNumber: 'WP-NA-9021',
    unit: 'Liters',
    quantity: 1850,
    emissionFactorUsed: 2.6878,
    emissionsTonsCO2e: 4.97,
    reportingMonth: 1,
    reportingYear: 2024,
    notes: 'Routine service coverage for Kotte, Kolonnawa & Pitakotte CSC zones',
    createdBy: 'Dilani Senanayake',
    createdAt: '2024-01-30T09:30:00Z'
  },
  {
    id: 's1-104',
    facilityId: 'fac-csc-pitakotte',
    facilityName: 'Pitakotte CSC',
    category: 'mobile_fleet',
    sourceName: 'Lineman Inspection Motorbikes',
    fuelType: 'Petrol / Gasoline',
    vehicleType: 'Motorcycle',
    vehicleNumber: 'WP-XZ-1102',
    unit: 'Liters',
    quantity: 280,
    emissionFactorUsed: 2.3149,
    emissionsTonsCO2e: 0.65,
    reportingMonth: 1,
    reportingYear: 2024,
    notes: 'Daily meter reading and low voltage breakdown patrol',
    createdBy: 'Sarath Wijesinghe',
    createdAt: '2024-01-31T08:00:00Z'
  },
  {
    id: 's1-105',
    facilityId: 'fac-br-kelaniya',
    facilityName: 'Kelaniya Branch',
    category: 'fugitive_sf6',
    sourceName: 'Substation SF6 Gas Insulated Switchgear Top-up (Unit GIS-KLN-04)',
    gasType: 'SF6 Gas',
    unit: 'kg',
    quantity: 1.2,
    leakedKg: 1.2,
    gwp: 22800,
    emissionFactorUsed: 22800.0,
    emissionsTonsCO2e: 27.36,
    reportingMonth: 2,
    reportingYear: 2024,
    notes: 'Annual substation pressure recalibration and seal replacement',
    createdBy: 'Rohan Samarasinghe',
    createdAt: '2024-02-15T14:30:00Z'
  }
];

export const INITIAL_SCOPE2_RECORDS: Scope2Record[] = [
  {
    id: 's2-101',
    facilityId: 'fac-ho-colombo',
    facilityName: 'LECO Head Office',
    accountNumber: 'ACC-010-9882',
    meterNumber: 'MTR-COL-001',
    gridElectricityKWh: 42000,
    solarGenerationKWh: 9500,
    gridEmissionFactor: 0.582,
    emissionsTonsCO2e: 24.444,
    solarOffsetTonsCO2e: 5.529,
    netEmissionsTonsCO2e: 18.915,
    reportingMonth: 1,
    reportingYear: 2024,
    costLKR: 1850000,
    notes: 'Main Head Office monthly CEB bill',
    createdBy: 'Samantha Perera',
    createdAt: '2024-01-31T17:00:00Z'
  },
  {
    id: 's2-102',
    facilityId: 'fac-br-kotte',
    facilityName: 'Kotte Branch',
    accountNumber: 'ACC-011-3341',
    meterNumber: 'MTR-KT-09',
    gridElectricityKWh: 14500,
    solarGenerationKWh: 4200,
    gridEmissionFactor: 0.582,
    emissionsTonsCO2e: 8.439,
    solarOffsetTonsCO2e: 2.444,
    netEmissionsTonsCO2e: 5.995,
    reportingMonth: 1,
    reportingYear: 2024,
    costLKR: 620000,
    notes: 'Kotte Branch regional center consumption',
    createdBy: 'Dilani Senanayake',
    createdAt: '2024-01-31T17:30:00Z'
  },
  {
    id: 's2-103',
    facilityId: 'fac-csc-pitakotte',
    facilityName: 'Pitakotte CSC',
    accountNumber: 'ACC-011-3342',
    meterNumber: 'MTR-PKT-01',
    gridElectricityKWh: 3200,
    solarGenerationKWh: 0,
    gridEmissionFactor: 0.582,
    emissionsTonsCO2e: 1.862,
    solarOffsetTonsCO2e: 0,
    netEmissionsTonsCO2e: 1.862,
    reportingMonth: 1,
    reportingYear: 2024,
    costLKR: 176000,
    notes: 'Customer Service Center electricity log',
    createdBy: 'Sarath Wijesinghe',
    createdAt: '2024-01-31T18:00:00Z'
  },
  {
    id: 's2-104',
    facilityId: 'fac-br-kelaniya',
    facilityName: 'Kelaniya Branch',
    accountNumber: 'ACC-011-5511',
    meterNumber: 'MTR-KLN-BR01',
    gridElectricityKWh: 18200,
    solarGenerationKWh: 5600,
    gridEmissionFactor: 0.582,
    emissionsTonsCO2e: 10.592,
    solarOffsetTonsCO2e: 3.259,
    netEmissionsTonsCO2e: 7.333,
    reportingMonth: 1,
    reportingYear: 2024,
    costLKR: 790000,
    notes: 'Kelaniya branch office & technical wing',
    createdBy: 'Rohan Samarasinghe',
    createdAt: '2024-01-31T18:30:00Z'
  }
];

export const INITIAL_SCOPE3_RECORDS: Scope3Record[] = [
  {
    id: 's3-101',
    facilityId: 'fac-mf-bandaragama',
    facilityName: 'LECO Meter Testing & Assembly Factory',
    category: 'purchased_goods',
    itemName: 'Smart Meter Electronic Microcontroller Components',
    supplierName: 'Lanka Micro Electronics Ltd',
    quantity: 2500,
    unit: 'units',
    emissionFactorUsed: 8.5,
    emissionsTonsCO2e: 21.25,
    reportingMonth: 1,
    reportingYear: 2024,
    notes: 'Supplier LCA verification & carbon certificate',
    createdBy: 'Ruwan Jayasuriya',
    createdAt: '2024-01-25T14:00:00Z'
  },
  {
    id: 's3-102',
    facilityId: 'fac-st-waskaduwa',
    facilityName: 'Stores - Waskaduwa',
    category: 'capital_goods',
    itemName: 'Step-down 33kV/11kV Distribution Transformers',
    supplierName: 'Lanka Transformers Ltd (LTL)',
    quantity: 12000,
    unit: 'kg',
    emissionFactorUsed: 4.2,
    emissionsTonsCO2e: 50.40,
    reportingMonth: 2,
    reportingYear: 2024,
    notes: 'LECO Transformer Environmental LCA Specification',
    createdBy: 'Nimal Wickramasinghe',
    createdAt: '2024-02-18T10:00:00Z'
  },
  {
    id: 's3-103',
    facilityId: 'fac-ho-colombo',
    facilityName: 'LECO Head Office',
    category: 'employee_commuting',
    itemName: 'Head Office Staff Daily Commuting (180 employees)',
    supplierName: 'Internal Staff Commute Survey',
    quantity: 72000,
    unit: 'passenger-km',
    emissionFactorUsed: 0.089,
    emissionsTonsCO2e: 6.41,
    reportingMonth: 1,
    reportingYear: 2024,
    notes: 'Annual employee transport survey & average distance methodology',
    createdBy: 'Samantha Perera',
    createdAt: '2024-01-30T16:00:00Z'
  }
];

class DatabaseStore {
  private data: {
    facilities: Facility[];
    users: User[];
    emissionFactors: EmissionFactor[];
    scope1: Scope1Record[];
    scope2: Scope2Record[];
    scope3: Scope3Record[];
  };

  constructor() {
    this.data = this.loadData();
  }

  private loadData() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);

        // Ensure Root Super Admin is always present
        if (parsed.users) {
          const rootIdx = parsed.users.findIndex((u: User) => u.email?.toLowerCase() === 'superadmincf@leco.com');
          if (rootIdx === -1) {
            parsed.users.unshift(DEFAULT_USERS[0]);
          } else {
            parsed.users[rootIdx] = {
              ...DEFAULT_USERS[0],
              ...parsed.users[rootIdx],
              role: 'super_admin',
              canDelete: true,
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

        // Ensure hierarchical facilities exist
        if (!parsed.facilities || parsed.facilities.length < DEFAULT_FACILITIES.length) {
          parsed.facilities = DEFAULT_FACILITIES;
        } else {
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

        if (!parsed.emissionFactors) parsed.emissionFactors = DEFAULT_EMISSION_FACTORS;
        if (!parsed.scope1) parsed.scope1 = INITIAL_SCOPE1_RECORDS;
        if (!parsed.scope2) parsed.scope2 = INITIAL_SCOPE2_RECORDS;
        if (!parsed.scope3) parsed.scope3 = INITIAL_SCOPE3_RECORDS;

        // Normalize Scope 1
        parsed.scope1 = parsed.scope1.map((r: any) => ({
          ...r,
          reportingMonth: Number(r.reportingMonth) || 1,
          reportingYear: Number(r.reportingYear) || 2024,
          quantity: Number(r.quantity) || 0,
          emissionsTonsCO2e: Number(r.emissionsTonsCO2e ?? r.totalEmissionsTonsCO2e) || 0,
          sourceName: r.sourceName || r.sourceDescription || 'Combustion Source',
          fuelType: r.fuelType || r.fuelTypeOrGas || 'Fuel'
        }));

        // Normalize Scope 2
        parsed.scope2 = parsed.scope2.map((r: any) => ({
          ...r,
          reportingMonth: Number(r.reportingMonth) || 1,
          reportingYear: Number(r.reportingYear) || 2024,
          gridElectricityKWh: Number(r.gridElectricityKWh ?? r.gridConsumptionKWh) || 0,
          solarGenerationKWh: Number(r.solarGenerationKWh) || 0,
          gridEmissionFactor: Number(r.gridEmissionFactor ?? r.gridEmissionFactorKgCO2ePerKWh) || 0.582,
          emissionsTonsCO2e: Number(r.emissionsTonsCO2e ?? r.totalEmissionsTonsCO2e) || 0,
          solarOffsetTonsCO2e: Number(r.solarOffsetTonsCO2e ?? (r.solarOffsetKgCO2e ? r.solarOffsetKgCO2e / 1000 : 0)) || 0,
          netEmissionsTonsCO2e: Number(r.netEmissionsTonsCO2e ?? Math.max(0, (r.emissionsTonsCO2e ?? r.totalEmissionsTonsCO2e ?? 0) - (r.solarOffsetTonsCO2e ?? 0))) || 0
        }));

        // Normalize Scope 3
        parsed.scope3 = parsed.scope3.map((r: any) => ({
          ...r,
          reportingMonth: Number(r.reportingMonth) || 1,
          reportingYear: Number(r.reportingYear) || 2024,
          itemName: r.itemName || r.activityName || 'Scope 3 Activity',
          quantity: Number(r.quantity ?? r.activityData) || 0,
          emissionFactorUsed: Number(r.emissionFactorUsed ?? r.emissionFactor) || 0,
          emissionsTonsCO2e: Number(r.emissionsTonsCO2e ?? r.totalEmissionsTonsCO2e) || 0
        }));

        return parsed;
      }
    } catch (e) {
      console.warn('Could not read persistent file, fallback to defaults:', e);
    }

    return {
      facilities: DEFAULT_FACILITIES,
      users: DEFAULT_USERS,
      emissionFactors: DEFAULT_EMISSION_FACTORS,
      scope1: INITIAL_SCOPE1_RECORDS,
      scope2: INITIAL_SCOPE2_RECORDS,
      scope3: INITIAL_SCOPE3_RECORDS
    };
  }

  public save() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving data to file:', e);
    }
  }

  // Facilities CRUD
  public getFacilities(): Facility[] {
    return this.data.facilities;
  }

  public addFacility(facility: Facility): Facility {
    // If it has a parentId, populate parentName
    if (facility.parentId) {
      const parent = this.data.facilities.find(f => f.id === facility.parentId);
      if (parent) {
        facility.parentName = parent.name;
      }
    }
    this.data.facilities.push(facility);
    this.save();
    return facility;
  }

  public updateFacility(id: string, updates: Partial<Facility>): Facility | null {
    const idx = this.data.facilities.findIndex(f => f.id === id);
    if (idx === -1) return null;
    
    if (updates.parentId) {
      const parent = this.data.facilities.find(f => f.id === updates.parentId);
      if (parent) updates.parentName = parent.name;
    }

    this.data.facilities[idx] = { ...this.data.facilities[idx], ...updates };
    this.save();
    return this.data.facilities[idx];
  }

  public deleteFacility(id: string): boolean {
    const initialLen = this.data.facilities.length;
    this.data.facilities = this.data.facilities.filter(f => f.id !== id);
    // Unlink any child facilities
    this.data.facilities.forEach(f => {
      if (f.parentId === id) {
        f.parentId = null;
        f.parentName = undefined;
      }
    });
    this.save();
    return this.data.facilities.length < initialLen;
  }

  // Users CRUD
  public getUsers(): User[] {
    return this.data.users;
  }

  public addUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    
    // Prevent removing super_admin status from root
    if (this.data.users[idx].email.toLowerCase() === 'superadmincf@leco.com') {
      updates.role = 'super_admin';
      updates.isActive = true;
      updates.canDelete = true;
    }

    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.save();
    return this.data.users[idx];
  }

  public deleteUser(id: string): boolean {
    const target = this.data.users.find(u => u.id === id);
    if (target && target.email.toLowerCase() === 'superadmincf@leco.com') {
      return false; // Immutable root admin
    }
    const initialLen = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.id !== id);
    this.save();
    return this.data.users.length < initialLen;
  }

  // Emission Factors CRUD
  public getEmissionFactors(): EmissionFactor[] {
    return this.data.emissionFactors;
  }

  public addEmissionFactor(factor: EmissionFactor): EmissionFactor {
    this.data.emissionFactors.push(factor);
    this.save();
    return factor;
  }

  public updateEmissionFactor(id: string, updates: Partial<EmissionFactor>): EmissionFactor | null {
    const idx = this.data.emissionFactors.findIndex(f => f.id === id);
    if (idx === -1) return null;
    this.data.emissionFactors[idx] = { ...this.data.emissionFactors[idx], ...updates };
    this.save();
    return this.data.emissionFactors[idx];
  }

  public deleteEmissionFactor(id: string): boolean {
    const initialLen = this.data.emissionFactors.length;
    this.data.emissionFactors = this.data.emissionFactors.filter(f => f.id !== id);
    this.save();
    return this.data.emissionFactors.length < initialLen;
  }

  // Scope 1 CRUD
  public getScope1(): Scope1Record[] {
    return this.data.scope1;
  }

  public addScope1(rec: Scope1Record): Scope1Record {
    this.data.scope1.push(rec);
    this.save();
    return rec;
  }

  public updateScope1(id: string, updates: Partial<Scope1Record>): Scope1Record | null {
    const idx = this.data.scope1.findIndex(r => r.id === id);
    if (idx === -1) return null;
    this.data.scope1[idx] = { ...this.data.scope1[idx], ...updates };
    this.save();
    return this.data.scope1[idx];
  }

  public deleteScope1(id: string): boolean {
    const initialLen = this.data.scope1.length;
    this.data.scope1 = this.data.scope1.filter(r => r.id !== id);
    this.save();
    return this.data.scope1.length < initialLen;
  }

  // Scope 2 CRUD
  public getScope2(): Scope2Record[] {
    return this.data.scope2;
  }

  public addScope2(rec: Scope2Record): Scope2Record {
    this.data.scope2.push(rec);
    this.save();
    return rec;
  }

  public updateScope2(id: string, updates: Partial<Scope2Record>): Scope2Record | null {
    const idx = this.data.scope2.findIndex(r => r.id === id);
    if (idx === -1) return null;
    this.data.scope2[idx] = { ...this.data.scope2[idx], ...updates };
    this.save();
    return this.data.scope2[idx];
  }

  public deleteScope2(id: string): boolean {
    const initialLen = this.data.scope2.length;
    this.data.scope2 = this.data.scope2.filter(r => r.id !== id);
    this.save();
    return this.data.scope2.length < initialLen;
  }

  // Scope 3 CRUD
  public getScope3(): Scope3Record[] {
    return this.data.scope3;
  }

  public addScope3(rec: Scope3Record): Scope3Record {
    this.data.scope3.push(rec);
    this.save();
    return rec;
  }

  public updateScope3(id: string, updates: Partial<Scope3Record>): Scope3Record | null {
    const idx = this.data.scope3.findIndex(r => r.id === id);
    if (idx === -1) return null;
    this.data.scope3[idx] = { ...this.data.scope3[idx], ...updates };
    this.save();
    return this.data.scope3[idx];
  }

  public deleteScope3(id: string): boolean {
    const initialLen = this.data.scope3.length;
    this.data.scope3 = this.data.scope3.filter(r => r.id !== id);
    this.save();
    return this.data.scope3.length < initialLen;
  }

  // Dashboard Aggregator
  public getDashboardSummary(year?: number, facilityId?: string): DashboardSummary {
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

    const s1 = this.data.scope1.filter(filterFn);
    const s2 = this.data.scope2.filter(filterFn);
    const s3 = this.data.scope3.filter(filterFn);

    const scope1Total = s1.reduce((sum, r) => sum + Number(r.emissionsTonsCO2e ?? (r as any).totalEmissionsTonsCO2e ?? 0), 0);
    const scope2Total = s2.reduce((sum, r) => sum + Number(r.emissionsTonsCO2e ?? (r as any).totalEmissionsTonsCO2e ?? 0), 0);
    const scope3Total = s3.reduce((sum, r) => sum + Number(r.emissionsTonsCO2e ?? (r as any).totalEmissionsTonsCO2e ?? 0), 0);
    const solarOffsetTotal = s2.reduce((sum, r) => sum + Number(r.solarOffsetTonsCO2e ?? ((r as any).solarOffsetKgCO2e ? (r as any).solarOffsetKgCO2e / 1000 : 0)), 0);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrends: MonthlyEmissionTrend[] = monthNames.map((name, i) => {
      const mNum = i + 1;
      const mStr = String(mNum).padStart(2, '0');
      const matchMonth = (r: { reportingMonth: number | string }) => Number(r.reportingMonth) === mNum;

      const mS1 = s1.filter(matchMonth).reduce((sum, r) => sum + Number(r.emissionsTonsCO2e ?? (r as any).totalEmissionsTonsCO2e ?? 0), 0);
      const mS2 = s2.filter(matchMonth).reduce((sum, r) => sum + Number(r.emissionsTonsCO2e ?? (r as any).totalEmissionsTonsCO2e ?? 0), 0);
      const mS3 = s3.filter(matchMonth).reduce((sum, r) => sum + Number(r.emissionsTonsCO2e ?? (r as any).totalEmissionsTonsCO2e ?? 0), 0);
      const mSolar = s2.filter(matchMonth).reduce((sum, r) => sum + Number(r.solarOffsetTonsCO2e ?? ((r as any).solarOffsetKgCO2e ? (r as any).solarOffsetKgCO2e / 1000 : 0)), 0);

      return {
        month: mStr,
        monthName: name,
        scope1: Number(mS1.toFixed(2)),
        scope2: Number(mS2.toFixed(2)),
        scope3: Number(mS3.toFixed(2)),
        total: Number((mS1 + mS2 + mS3).toFixed(2)),
        solarOffset: Number(mSolar.toFixed(2))
      };
    });

    const activeFacilities = facilityId && facilityId !== 'ALL'
      ? this.data.facilities.filter(f => matchingFacilityIds.includes(f.id))
      : this.data.facilities;

    const facilityStats: FacilityEmissionStat[] = activeFacilities.map(fac => {
      const facS1 = s1.filter(r => r.facilityId === fac.id).reduce((sum, r) => sum + Number(r.emissionsTonsCO2e ?? (r as any).totalEmissionsTonsCO2e ?? 0), 0);
      const facS2 = s2.filter(r => r.facilityId === fac.id).reduce((sum, r) => sum + Number(r.emissionsTonsCO2e ?? (r as any).totalEmissionsTonsCO2e ?? 0), 0);
      const facS3 = s3.filter(r => r.facilityId === fac.id).reduce((sum, r) => sum + Number(r.emissionsTonsCO2e ?? (r as any).totalEmissionsTonsCO2e ?? 0), 0);

      return {
        facilityId: fac.id,
        facilityName: fac.name,
        facilityType: fac.type,
        parentName: fac.parentName,
        scope1: Number(facS1.toFixed(2)),
        scope2: Number(facS2.toFixed(2)),
        scope3: Number(facS3.toFixed(2)),
        total: Number((facS1 + facS2 + facS3).toFixed(2))
      };
    });

    return {
      reportingYear: Number(year) || 2024,
      totalEmissionsTonsCO2e: Number((scope1Total + scope2Total + scope3Total).toFixed(2)),
      scope1TotalTons: Number(scope1Total.toFixed(2)),
      scope2TotalTons: Number(scope2Total.toFixed(2)),
      scope3TotalTons: Number(scope3Total.toFixed(2)),
      solarOffsetTotalTons: Number(solarOffsetTotal.toFixed(2)),
      facilityCount: activeFacilities.length,
      recordsCount: s1.length + s2.length + s3.length,
      monthlyTrends,
      facilityStats
    };
  }
}

export const db = new DatabaseStore();
