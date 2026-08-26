import { createClient } from '@supabase/supabase-js';
import { Facility, User, Scope1Record, Scope2Record, Scope3Record, EmissionFactor } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const isSupabaseConfigured = !!supabase;
export const configuredSupabaseUrl = supabaseUrl;

// Supabase Auth Integration
export async function signInWithSupabaseAuth(email: string, password?: string) {
  if (!supabase) {
    throw new Error('Supabase client is not configured with environment variables.');
  }
  const pwd = password || 'Sadmin@cf369';
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: pwd
  });
  if (error) {
    throw error;
  }
  return data;
}

// Ephemeral client for administrative user creation without mutating the active administrator session
export function getSupabaseAuthClient() {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}

export async function signUpWithSupabaseAuth(email: string, password?: string, metadata?: any) {
  const authClient = getSupabaseAuthClient() || supabase;
  if (!authClient) {
    throw new Error('Supabase client is not configured with environment variables.');
  }
  const cleanEmail = email.trim().toLowerCase();
  const pwd = password?.trim() || 'Sadmin@cf369';
  
  try {
    const { data, error } = await authClient.auth.signUp({
      email: cleanEmail,
      password: pwd,
      options: {
        data: {
          ...metadata,
          full_name: metadata?.name || metadata?.full_name,
          name: metadata?.name || metadata?.full_name
        }
      }
    });

    if (error) {
      throw error;
    }

    // When email confirmation is enabled and the user already exists in auth.users,
    // Supabase returns a dummy user object with an empty identities array: identities: []
    if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      const err: any = new Error(`User with email "${cleanEmail}" is already registered in Supabase Authentication.`);
      err.code = 'user_already_exists';
      err.status = 422;
      err.user = data.user;
      throw err;
    }

    return data;
  } catch (err: any) {
    // Check if error is network/fetch related
    const msg = err?.message || String(err);
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('fetch failed')) {
      const networkErr: any = new Error(`Supabase Auth endpoint unreachable (Failed to fetch). Please check your internet connection or Supabase URL.`);
      networkErr.isNetworkError = true;
      networkErr.originalError = err;
      throw networkErr;
    }
    throw err;
  }
}

export async function signOutSupabaseAuth() {
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Supabase signout notice:', err);
  }
}

export async function testSupabaseConnection(): Promise<{ success: boolean; message: string; error?: any }> {
  if (!supabase) {
    return { success: false, message: 'Supabase client is not configured with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
  }
  try {
    const { error } = await supabase.from('facilities').select('count', { count: 'exact', head: true });
    if (error) {
      if (error.code === '42P01') {
        return { 
          success: false, 
          message: 'Connected to Supabase project, but tables are not created yet. Please execute the SQL Schema in your Supabase SQL Editor.', 
          error 
        };
      }
      return { success: false, message: `Database query error: ${error.message}`, error };
    }
    return { success: true, message: 'Successfully connected and verified tables in Supabase Postgres database!' };
  } catch (err: any) {
    return { success: false, message: `Connection failed: ${err.message || err}`, error: err };
  }
}

// ============================================================================
// DATA CONVERSION HELPERS (Bidirectional snake_case <-> camelCase mapping)
// ============================================================================

export function toFacilityRow(fac: Partial<Facility>): Record<string, any> {
  const row: Record<string, any> = {};
  
  // STRICT: Only include id if it is a genuine, valid UUID.
  // Never pass frontend temporary IDs (e.g. 'fac-xxx') so Supabase/PostgreSQL auto-generates a valid UUID.
  if (fac.id !== undefined && isValidUUID(fac.id)) {
    row.id = fac.id;
  }

  if (fac.code !== undefined) row.code = fac.code?.trim();
  if (fac.name !== undefined) row.name = fac.name?.trim();
  if (fac.type !== undefined) row.type = fac.type;
  
  // Hierarchy mapping: sync both parent_facility_id and parent_id
  if (fac.parentId !== undefined) {
    const pid = fac.parentId;
    if (!pid || pid === 'null' || pid === 'none' || pid === 'undefined' || (typeof pid === 'string' && pid.trim() === '')) {
      row.parent_facility_id = null;
      row.parent_id = null;
    } else {
      const cleanPid = typeof pid === 'string' ? pid.trim() : pid;
      row.parent_facility_id = cleanPid;
      row.parent_id = cleanPid;
    }
  }

  if (fac.isParent !== undefined) row.is_parent = Boolean(fac.isParent);
  if (fac.location !== undefined) row.location = fac.location?.trim();
  if (fac.responsibleOfficer !== undefined) row.responsible_officer = fac.responsibleOfficer?.trim();
  if (fac.headDesignation !== undefined) row.head_designation = fac.headDesignation?.trim() || null;
  if (fac.officerEmail !== undefined) row.officer_email = fac.officerEmail?.trim()?.toLowerCase();
  if (fac.contactNumber !== undefined) row.contact_number = fac.contactNumber?.trim() || null;
  if (fac.electricityAccountNo !== undefined) row.electricity_account_no = fac.electricityAccountNo?.trim() || null;
  if (fac.hasSolarPV !== undefined) row.has_solar_pv = Boolean(fac.hasSolarPV);
  if (fac.solarCapacityKW !== undefined) row.solar_capacity_kw = Number(fac.solarCapacityKW) || 0;
  if (fac.jobRoles !== undefined) row.job_roles = fac.jobRoles;
  return row;
}

export function fromFacilityRow(row: any): Facility {
  return {
    id: row.id,
    code: row.code || '',
    name: row.name || '',
    type: row.type || 'CSC',
    parentId: row.parent_facility_id || row.parent_id || row.parentId || null,
    parentName: row.parent_name || row.parentName,
    isParent: Boolean(row.is_parent ?? row.isParent),
    location: row.location || '',
    address: row.address,
    region: row.region,
    responsibleOfficer: row.responsible_officer || row.responsibleOfficer || '',
    headDesignation: row.head_designation || row.headDesignation || '',
    officerEmail: row.officer_email || row.officerEmail || '',
    contactNumber: row.contact_number || row.contactNumber || '',
    electricityAccountNo: row.electricity_account_no || row.electricityAccountNo || '',
    meterNumbers: row.meter_numbers || row.meterNumbers || [],
    hasSolarPV: Boolean(row.has_solar_pv ?? row.hasSolarPV),
    solarCapacityKW: Number(row.solar_capacity_kw ?? row.solarCapacityKW ?? 0),
    jobRoles: typeof row.job_roles === 'string' ? JSON.parse(row.job_roles) : (row.job_roles || row.jobRoles || []),
    createdAt: row.created_at || row.createdAt
  };
}

export function isValidUUID(str: any): boolean {
  if (typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // fallback
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function parseAssignedFacilityIds(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.map(String).map(s => s.trim()).filter(Boolean);
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed || trimmed === '{}' || trimmed === '[]') return [];
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map(String).map(s => s.trim()).filter(Boolean);
        }
      } catch {}
    }
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return trimmed
        .slice(1, -1)
        .split(',')
        .map(s => s.replace(/^["']|["']$/g, '').trim())
        .filter(Boolean);
    }
    if (trimmed.includes(',')) {
      return trimmed.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (trimmed.length > 0) return [trimmed];
  }
  return [];
}

export function toUserProfileRow(user: Partial<User>): Record<string, any> {
  const row: Record<string, any> = {};
  if (user.id !== undefined) {
    if (isValidUUID(user.id)) {
      row.id = user.id;
    } else if (user.authUserId && isValidUUID(user.authUserId)) {
      row.id = user.authUserId;
    } else {
      row.id = generateUUID();
    }
  }
  if (user.authUserId !== undefined && user.authUserId && isValidUUID(user.authUserId)) {
    row.auth_user_id = user.authUserId;
  }
  if (user.email !== undefined) row.email = user.email.toLowerCase().trim();
  if (user.name !== undefined) {
    row.full_name = user.name.trim();
  }
  if (user.role !== undefined) row.role = user.role;
  if (user.facilityId !== undefined) row.facility_id = user.facilityId || null;
  if (user.facilityName !== undefined) row.facility_name = user.facilityName || null;
  if (user.assignedFacilityIds !== undefined) {
    row.assigned_facility_ids = Array.isArray(user.assignedFacilityIds) 
      ? user.assignedFacilityIds 
      : parseAssignedFacilityIds(user.assignedFacilityIds);
  }
  if (user.jobRole !== undefined) row.job_role = user.jobRole;
  if (user.department !== undefined) row.department = user.department;
  if (user.contactNumber !== undefined) row.contact_number = user.contactNumber;
  if (user.canDelete !== undefined) row.can_delete = user.canDelete;
  if (user.allowedModules !== undefined) row.allowed_modules = user.allowedModules;
  if (user.isActive !== undefined) row.is_active = user.isActive;
  return row;
}

export function fromUserProfileRow(row: any): User {
  return {
    id: row.id,
    email: row.email,
    name: row.full_name || row.name || 'LECO Officer',
    role: row.role,
    facilityId: row.facility_id || row.facilityId,
    facilityName: row.facility_name || row.facilityName,
    assignedFacilityIds: parseAssignedFacilityIds(
      row.assigned_facility_ids ?? 
      row.assignedFacilityIds ?? 
      (row.role === 'branch_admin' && (row.facility_id || row.facilityId) ? [row.facility_id || row.facilityId] : [])
    ),
    jobRole: row.job_role || row.jobRole,
    department: row.department,
    contactNumber: row.contact_number || row.contactNumber,
    canDelete: Boolean(row.can_delete ?? row.canDelete),
    allowedModules: row.allowed_modules || row.allowedModules || ['dashboard', 'scope1', 'scope2', 'scope3', 'reports', 'calculator'],
    isActive: row.is_active !== undefined ? Boolean(row.is_active) : (row.isActive !== undefined ? Boolean(row.isActive) : true),
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    authUserId: row.auth_user_id || row.authUserId
  };
}

export function toScope1Row(rec: Partial<Scope1Record>): Record<string, any> {
  const row: Record<string, any> = {};
  if (rec.id !== undefined) {
    row.id = isValidUUID(rec.id) ? rec.id : (rec.id ? generateUUID() : undefined);
  }
  if (rec.facilityId !== undefined) row.facility_id = rec.facilityId;
  if (rec.facilityName !== undefined) row.facility_name = rec.facilityName;
  if (rec.reportingYear !== undefined) row.reporting_year = Number(rec.reportingYear);
  if (rec.reportingMonth !== undefined) row.reporting_month = Number(rec.reportingMonth);
  if (rec.category !== undefined) row.category = rec.category;
  if (rec.sourceName !== undefined) row.source_name = rec.sourceName;
  if (rec.fuelType !== undefined) row.fuel_type = rec.fuelType;
  if (rec.quantity !== undefined) row.quantity = Number(rec.quantity);
  if (rec.unit !== undefined) row.unit = rec.unit;
  if (rec.vehicleNumber !== undefined) row.vehicle_number = rec.vehicleNumber;
  if (rec.vehicleType !== undefined) row.vehicle_type = rec.vehicleType;
  if (rec.gasType !== undefined) row.gas_type = rec.gasType;
  if (rec.initialChargeKg !== undefined) row.initial_charge_kg = rec.initialChargeKg;
  if (rec.leakedKg !== undefined) row.leaked_kg = rec.leakedKg;
  if (rec.gwp !== undefined) row.gwp = rec.gwp;
  if (rec.emissionFactorUsed !== undefined) row.emission_factor_used = rec.emissionFactorUsed;
  if (rec.emissionsTonsCO2e !== undefined) row.emissions_tons_co2e = Number(rec.emissionsTonsCO2e);
  if (rec.notes !== undefined) row.notes = rec.notes;
  if (rec.createdById !== undefined) {
    row.created_by_id = isValidUUID(rec.createdById) ? rec.createdById : null;
  }
  if (rec.createdByName !== undefined) row.created_by_name = rec.createdByName;
  return row;
}

export function fromScope1Row(row: any): Scope1Record {
  return {
    id: row.id,
    facilityId: row.facility_id || row.facilityId,
    facilityName: row.facility_name || row.facilityName || 'Facility',
    reportingYear: Number(row.reporting_year ?? row.reportingYear ?? 2024),
    reportingMonth: Number(row.reporting_month ?? row.reportingMonth ?? 1),
    category: row.category,
    sourceName: row.source_name || row.sourceName || row.source_description || row.sourceDescription || 'Combustion Source',
    fuelType: row.fuel_type || row.fuelType || row.fuel_type_or_gas || row.fuelTypeOrGas,
    quantity: Number(row.quantity ?? 0),
    unit: row.unit || 'Liters',
    vehicleNumber: row.vehicle_number || row.vehicleNumber,
    vehicleType: row.vehicle_type || row.vehicleType,
    gasType: row.gas_type || row.gasType,
    initialChargeKg: row.initial_charge_kg !== undefined ? Number(row.initial_charge_kg) : (row.initialChargeKg !== undefined ? Number(row.initialChargeKg) : undefined),
    leakedKg: row.leaked_kg !== undefined ? Number(row.leaked_kg) : (row.leakedKg !== undefined ? Number(row.leakedKg) : undefined),
    gwp: row.gwp !== undefined ? Number(row.gwp) : undefined,
    emissionFactorUsed: Number(row.emission_factor_used ?? row.emissionFactorUsed ?? row.emission_factor ?? row.emissionFactor ?? 0),
    emissionsTonsCO2e: Number(row.emissions_tons_co2e ?? row.emissionsTonsCO2e ?? row.total_emissions_tons_co2e ?? row.totalEmissionsTonsCO2e ?? 0),
    notes: row.notes,
    createdById: row.created_by_id || row.createdById,
    createdByName: row.created_by_name || row.createdByName || row.created_by || row.createdBy,
    createdAt: row.created_at || row.createdAt || new Date().toISOString()
  };
}

export function toScope2Row(rec: Partial<Scope2Record>): Record<string, any> {
  const row: Record<string, any> = {};
  if (rec.id !== undefined) {
    row.id = isValidUUID(rec.id) ? rec.id : (rec.id ? generateUUID() : undefined);
  }
  if (rec.facilityId !== undefined) row.facility_id = rec.facilityId;
  if (rec.facilityName !== undefined) row.facility_name = rec.facilityName;
  if (rec.reportingYear !== undefined) row.reporting_year = Number(rec.reportingYear);
  if (rec.reportingMonth !== undefined) row.reporting_month = Number(rec.reportingMonth);
  if (rec.accountNumber !== undefined) row.account_number = rec.accountNumber;
  if (rec.meterNumber !== undefined) row.meter_number = rec.meterNumber;
  if (rec.gridElectricityKWh !== undefined) row.grid_electricity_kwh = Number(rec.gridElectricityKWh);
  if (rec.solarGenerationKWh !== undefined) row.solar_generation_kwh = Number(rec.solarGenerationKWh);
  if (rec.gridEmissionFactor !== undefined) row.grid_emission_factor = Number(rec.gridEmissionFactor);
  if (rec.emissionsTonsCO2e !== undefined) row.emissions_tons_co2e = Number(rec.emissionsTonsCO2e);
  if (rec.solarOffsetTonsCO2e !== undefined) row.solar_offset_tons_co2e = Number(rec.solarOffsetTonsCO2e);
  if (rec.netEmissionsTonsCO2e !== undefined) row.net_emissions_tons_co2e = Number(rec.netEmissionsTonsCO2e);
  if (rec.costLKR !== undefined) row.cost_lkr = Number(rec.costLKR);
  if (rec.notes !== undefined) row.notes = rec.notes;
  if (rec.createdById !== undefined) {
    row.created_by_id = isValidUUID(rec.createdById) ? rec.createdById : null;
  }
  if (rec.createdByName !== undefined) row.created_by_name = rec.createdByName;
  return row;
}

export function fromScope2Row(row: any): Scope2Record {
  return {
    id: row.id,
    facilityId: row.facility_id || row.facilityId,
    facilityName: row.facility_name || row.facilityName || 'Facility',
    reportingYear: Number(row.reporting_year ?? row.reportingYear ?? 2024),
    reportingMonth: Number(row.reporting_month ?? row.reportingMonth ?? 1),
    accountNumber: row.account_number || row.accountNumber,
    meterNumber: row.meter_number || row.meterNumber,
    gridElectricityKWh: Number(row.grid_electricity_kwh ?? row.gridElectricityKWh ?? row.grid_consumption_kwh ?? row.gridConsumptionKWh ?? 0),
    solarGenerationKWh: Number(row.solar_generation_kwh ?? row.solarGenerationKWh ?? 0),
    gridEmissionFactor: Number(row.grid_emission_factor ?? row.gridEmissionFactor ?? 0.582),
    emissionsTonsCO2e: Number(row.emissions_tons_co2e ?? row.emissionsTonsCO2e ?? row.total_emissions_tons_co2e ?? row.totalEmissionsTonsCO2e ?? 0),
    solarOffsetTonsCO2e: Number(row.solar_offset_tons_co2e ?? row.solarOffsetTonsCO2e ?? (row.solar_offset_kg_co2e ? row.solar_offset_kg_co2e / 1000 : 0)),
    netEmissionsTonsCO2e: Number(row.net_emissions_tons_co2e ?? row.netEmissionsTonsCO2e ?? 0),
    costLKR: row.cost_lkr !== undefined ? Number(row.cost_lkr) : (row.costLKR !== undefined ? Number(row.costLKR) : undefined),
    notes: row.notes,
    createdById: row.created_by_id || row.createdById,
    createdByName: row.created_by_name || row.createdByName || row.created_by || row.createdBy,
    createdAt: row.created_at || row.createdAt || new Date().toISOString()
  };
}

export function toScope3Row(rec: Partial<Scope3Record>): Record<string, any> {
  const row: Record<string, any> = {};
  if (rec.id !== undefined) {
    row.id = isValidUUID(rec.id) ? rec.id : (rec.id ? generateUUID() : undefined);
  }
  if (rec.facilityId !== undefined) row.facility_id = rec.facilityId;
  if (rec.facilityName !== undefined) row.facility_name = rec.facilityName;
  if (rec.reportingYear !== undefined) row.reporting_year = Number(rec.reportingYear);
  if (rec.reportingMonth !== undefined) row.reporting_month = Number(rec.reportingMonth);
  if (rec.category !== undefined) row.category = rec.category;
  if (rec.itemName !== undefined) row.item_name = rec.itemName;
  if (rec.supplierName !== undefined) row.supplier_name = rec.supplierName;
  if (rec.quantity !== undefined) row.quantity = Number(rec.quantity);
  if (rec.unit !== undefined) row.unit = rec.unit;
  if (rec.emissionFactorUsed !== undefined) row.emission_factor_used = Number(rec.emissionFactorUsed);
  if (rec.emissionsTonsCO2e !== undefined) row.emissions_tons_co2e = Number(rec.emissionsTonsCO2e);
  if (rec.notes !== undefined) row.notes = rec.notes;
  if (rec.createdById !== undefined) {
    row.created_by_id = isValidUUID(rec.createdById) ? rec.createdById : null;
  }
  if (rec.createdByName !== undefined) row.created_by_name = rec.createdByName;
  return row;
}

export function fromScope3Row(row: any): Scope3Record {
  return {
    id: row.id,
    facilityId: row.facility_id || row.facilityId,
    facilityName: row.facility_name || row.facilityName || 'Facility',
    reportingYear: Number(row.reporting_year ?? row.reportingYear ?? 2024),
    reportingMonth: Number(row.reporting_month ?? row.reportingMonth ?? 1),
    category: row.category,
    itemName: row.item_name || row.itemName || row.activity_name || row.activityName || 'Scope 3 Activity',
    supplierName: row.supplier_name || row.supplierName,
    quantity: Number(row.quantity ?? row.activity_data ?? row.activityData ?? 0),
    unit: row.unit || 'units',
    emissionFactorUsed: Number(row.emission_factor_used ?? row.emissionFactorUsed ?? row.emission_factor ?? row.emissionFactor ?? 0),
    emissionsTonsCO2e: Number(row.emissions_tons_co2e ?? row.emissionsTonsCO2e ?? row.total_emissions_tons_co2e ?? row.totalEmissionsTonsCO2e ?? 0),
    notes: row.notes || row.methodology,
    createdById: row.created_by_id || row.createdById,
    createdByName: row.created_by_name || row.createdByName || row.created_by || row.createdBy,
    createdAt: row.created_at || row.createdAt || new Date().toISOString()
  };
}

/**
 * Robust Supabase user upsert helper.
 * Automatically identifies and prunes columns that do not exist in the remote user_profiles table (PGRST204),
 * handles foreign key constraints (23503), and handles unique constraint duplicates (23505).
 */
export async function safeSupabaseUpsertUser(
  operation: 'insert' | 'update',
  userPayload: Record<string, any>,
  matchId?: string,
  matchEmail?: string
): Promise<{ success: boolean; data?: any; error?: any; isNetworkError?: boolean }> {
  if (!supabase) return { success: false, error: new Error('Supabase client not initialized') };

  let currentPayload = { ...userPayload };
  const maxRetries = 12;
  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;
    let queryResult: any;

    try {
      if (operation === 'insert') {
        queryResult = await supabase.from('user_profiles').insert([currentPayload]).select().maybeSingle();
      } else {
        let query = supabase.from('user_profiles').update(currentPayload);
        if (matchId) {
          queryResult = await query.eq('id', matchId).select().maybeSingle();
        } else if (matchEmail) {
          queryResult = await query.eq('email', matchEmail.toLowerCase().trim()).select().maybeSingle();
        } else if (currentPayload.email) {
          queryResult = await query.eq('email', currentPayload.email.toLowerCase().trim()).select().maybeSingle();
        } else {
          queryResult = await query.eq('id', currentPayload.id).select().maybeSingle();
        }
      }
    } catch (err: any) {
      queryResult = { error: err };
    }

    const { data, error } = queryResult;

    if (!error) {
      return { success: true, data };
    }

    // 0. Network or endpoint unreachable ("Failed to fetch")
    const errorMsg = error.message || String(error || '');
    const errorDetails = error.details || '';
    if (
      errorMsg.includes('Failed to fetch') ||
      errorMsg.includes('NetworkError') ||
      errorMsg.includes('fetch failed') ||
      errorDetails.includes('Failed to fetch')
    ) {
      console.warn('[Supabase Schema Safe] Supabase endpoint unreachable (Failed to fetch).');
      return { success: false, isNetworkError: true, error };
    }

    // 1. UUID syntax error: code 22P02 "invalid input syntax for type uuid"
    if (error.code === '22P02' || error.message?.includes('invalid input syntax for type uuid')) {
      console.warn('[Supabase Schema Safe] UUID syntax error (22P02):', error.message);
      
      // If currentPayload.id is not a valid UUID, generate one
      if (currentPayload.id && !isValidUUID(currentPayload.id)) {
        currentPayload.id = generateUUID();
        continue;
      }

      // If auth_user_id is not a valid UUID, remove it
      if (currentPayload.auth_user_id && !isValidUUID(currentPayload.auth_user_id)) {
        delete currentPayload.auth_user_id;
        continue;
      }

      // If facility_id is not a valid UUID and errored on uuid type
      if (currentPayload.facility_id && !isValidUUID(currentPayload.facility_id)) {
        currentPayload.facility_id = null;
        continue;
      }

      // On insert, try deleting id completely to let PostgreSQL gen_random_uuid() work
      if (operation === 'insert' && currentPayload.id) {
        delete currentPayload.id;
        continue;
      }
    }

    // 2. PostgREST missing column error: code PGRST204, 42703 or "column does not exist"
    if (
      error.code === 'PGRST204' || 
      error.code === '42703' || 
      error.message?.includes('Could not find the') || 
      error.message?.includes('column') && error.message?.includes('does not exist')
    ) {
      const match = 
        error.message?.match(/Could not find the '([^']+)' column/) ||
        error.message?.match(/column "([^"]+)" of relation/) ||
        error.message?.match(/column "([^"]+)" does not exist/) ||
        error.message?.match(/column '([^']+)' does not exist/) ||
        error.message?.match(/column ([a-zA-Z0-9_]+) does not exist/);
      const missingCol = match ? match[1] : null;

      if (missingCol && currentPayload[missingCol] !== undefined) {
        console.warn(`[Supabase Schema Safe] Pruning nonexistent column '${missingCol}' from user_profiles table payload`);
        delete currentPayload[missingCol];
        continue;
      }

      // If specific column was not cleanly identified, prune optional columns in safe order
      // (preserving core RBAC and assigned_facility_ids as much as possible)
      const optionalCols = [
        'contact_number',
        'department',
        'job_role',
        'facility_name',
        'can_delete',
        'is_active',
        'allowed_modules',
        'auth_user_id',
        'assigned_facility_ids'
      ];
      const nextCol = optionalCols.find(col => currentPayload[col] !== undefined);
      if (nextCol) {
        console.warn(`[Supabase Schema Safe] Pruning optional column '${nextCol}' and retrying`);
        delete currentPayload[nextCol];
        continue;
      }
    }

    // 2. Foreign key violation (23503)
    if (error.code === '23503' || error.message?.includes('foreign key') || error.message?.includes('violates foreign key')) {
      if (currentPayload.auth_user_id) {
        console.warn('[Supabase Schema Safe] Foreign key violation on auth_user_id. Removing auth_user_id and retrying');
        delete currentPayload.auth_user_id;
        continue;
      }
      if (currentPayload.facility_id) {
        console.warn('[Supabase Schema Safe] Facility ID foreign key constraint violation. Setting facility_id = null');
        currentPayload.facility_id = null;
        continue;
      }
      if (operation === 'insert' && currentPayload.id) {
        console.warn('[Supabase Schema Safe] Foreign key violation on id. Generating new UUID for id');
        currentPayload.id = generateUUID();
        continue;
      }
    }

    // 3. Duplicate email on insert -> switch seamlessly to update
    if (operation === 'insert' && (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('unique constraint'))) {
      console.warn('[Supabase Schema Safe] User with this email already exists. Updating record instead.');
      return safeSupabaseUpsertUser('update', currentPayload, undefined, currentPayload.email);
    }

    // 4. If ID update matched 0 rows, fallback to matching by email
    if (operation === 'update' && matchId && matchEmail && matchId !== matchEmail) {
      return safeSupabaseUpsertUser('update', currentPayload, undefined, matchEmail);
    }

    return { success: false, error };
  }

  return { success: false, error: new Error('Exceeded maximum schema fallback retries') };
}

/**
 * Schema-Safe Supabase Facility Mutation Helper.
 * Handles UUID vs TEXT ID types (22P02), foreign key constraints on parent_id (23503),
 * unique code collisions (23505), and missing table columns (PGRST204, 42703).
 */
export async function safeSupabaseFacilityMutation(
  operation: 'insert' | 'update' | 'delete',
  payload: Record<string, any>,
  facilityId?: string
): Promise<{ success: boolean; data?: any; error?: any; isNetworkError?: boolean }> {
  if (!supabase) {
    return { success: false, error: new Error('Supabase client is not configured') };
  }

  if (operation === 'delete') {
    if (!facilityId) return { success: false, error: new Error('Facility ID required for deletion') };
    try {
      const { error } = await supabase.from('facilities').delete().eq('id', facilityId);
      if (error) {
        return { success: false, error };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err };
    }
  }

  let currentPayload: Record<string, any> = { ...payload };

  // Sanitize parent_facility_id and parent_id: Convert empty strings or invalid values to null
  ['parent_facility_id', 'parent_id'].forEach(key => {
    if (key in currentPayload) {
      const val = currentPayload[key];
      if (
        val === '' || 
        val === 'null' || 
        val === 'none' || 
        val === 'undefined' ||
        val === undefined ||
        (typeof val === 'string' && val.trim() === '')
      ) {
        currentPayload[key] = null;
      } else if (typeof val === 'string') {
        currentPayload[key] = val.trim();
      }
    }
  });

  // On INSERT: Omit local ID if it's not a valid UUID (e.g. mock "fac-xxx") so Supabase/PostgreSQL auto-generates a valid UUID
  if (operation === 'insert') {
    if (!currentPayload.id || !isValidUUID(currentPayload.id)) {
      delete currentPayload.id;
    }
  }

  const maxRetries = 8;
  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;
    let queryResult: any;

    try {
      if (operation === 'insert') {
        queryResult = await supabase.from('facilities').insert([currentPayload]).select().maybeSingle();
      } else {
        const idToUpdate = facilityId || currentPayload.id;
        queryResult = await supabase.from('facilities').update(currentPayload).eq('id', idToUpdate).select().maybeSingle();
      }
    } catch (err: any) {
      queryResult = { error: err };
    }

    const { data, error } = queryResult;

    if (!error) {
      return { success: true, data: data ? fromFacilityRow(data) : undefined };
    }

    // 0. Network error
    const errorMsg = error.message || String(error || '');
    if (
      errorMsg.includes('Failed to fetch') ||
      errorMsg.includes('NetworkError') ||
      errorMsg.includes('fetch failed')
    ) {
      return { success: false, isNetworkError: true, error };
    }

    // 1. UUID syntax error (22P02): "invalid input syntax for type uuid"
    if (error.code === '22P02' || error.message?.includes('invalid input syntax for type uuid')) {
      console.warn('[Supabase Facilities Safe] UUID syntax error (22P02):', error.message);
      
      // On insert, delete currentPayload.id so PostgreSQL DEFAULT gen_random_uuid() takes over
      if (operation === 'insert' && currentPayload.id && !isValidUUID(currentPayload.id)) {
        delete currentPayload.id;
        continue;
      }

      // If parent_facility_id or parent_id is not a valid UUID, set to null
      if (currentPayload.parent_facility_id && !isValidUUID(currentPayload.parent_facility_id)) {
        console.warn('[Supabase Facilities Safe] Non-UUID parent_facility_id converted to null:', currentPayload.parent_facility_id);
        currentPayload.parent_facility_id = null;
        continue;
      }
      if (currentPayload.parent_id && !isValidUUID(currentPayload.parent_id)) {
        console.warn('[Supabase Facilities Safe] Non-UUID parent_id converted to null:', currentPayload.parent_id);
        currentPayload.parent_id = null;
        continue;
      }

      // If ID is still causing issues on insert, delete it
      if (operation === 'insert' && currentPayload.id) {
        delete currentPayload.id;
        continue;
      }
    }

    // 2. Not-null constraint violation on ID (23502) - happens if table lacks DEFAULT gen_random_uuid()
    if (error.code === '23502' && (error.message?.includes('"id"') || error.message?.includes('column "id"'))) {
      console.warn('[Supabase Facilities Safe] Table requires explicit ID. Generating valid UUID');
      currentPayload.id = generateUUID();
      continue;
    }

    // 3. Foreign key violation (23503) on parent_facility_id or parent_id
    if (error.code === '23503' || error.message?.includes('foreign key') || error.message?.includes('violates foreign key')) {
      if (currentPayload.parent_facility_id || currentPayload.parent_id) {
        console.warn('[Supabase Facilities Safe] Foreign key violation on parent link. Setting parent to null');
        currentPayload.parent_facility_id = null;
        currentPayload.parent_id = null;
        continue;
      }
    }

    // 4. Unique violation (23505) on code or id
    if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
      if (error.message?.includes('facilities_pkey') || error.message?.includes('id')) {
        currentPayload.id = generateUUID();
        continue;
      }
      if (error.message?.includes('code')) {
        currentPayload.code = `${currentPayload.code || 'FAC'}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        continue;
      }
    }

    // 5. Missing column error (PGRST204 / 42703)
    if (
      error.code === 'PGRST204' || 
      error.code === '42703' || 
      error.message?.includes('Could not find the') || 
      (error.message?.includes('column') && error.message?.includes('does not exist'))
    ) {
      const match = 
        error.message?.match(/Could not find the '([^']+)' column/) ||
        error.message?.match(/column "([^"]+)" of relation/) ||
        error.message?.match(/column "([^"]+)" does not exist/) ||
        error.message?.match(/column '([^']+)' does not exist/) ||
        error.message?.match(/column ([a-zA-Z0-9_]+) does not exist/);
      const missingCol = match ? match[1] : null;

      if (missingCol && currentPayload[missingCol] !== undefined) {
        console.warn(`[Supabase Facilities Safe] Pruning missing column '${missingCol}' and retrying`);
        delete currentPayload[missingCol];
        continue;
      }

      // Safe pruning of optional columns
      const optionalCols = [
        'parent_facility_id',
        'job_roles',
        'solar_capacity_kw',
        'has_solar_pv',
        'electricity_account_no',
        'contact_number',
        'head_designation',
        'parent_name',
        'parent_id'
      ];
      const nextCol = optionalCols.find(col => currentPayload[col] !== undefined);
      if (nextCol) {
        console.warn(`[Supabase Facilities Safe] Pruning optional column '${nextCol}' and retrying`);
        delete currentPayload[nextCol];
        continue;
      }
    }

    return { success: false, error };
  }

  return { success: false, error: new Error('Exceeded maximum schema retry attempts for facility mutation') };
}

export function toEmissionFactorRow(ef: Partial<EmissionFactor>): Record<string, any> {
  const row: Record<string, any> = {};
  if (ef.id !== undefined) {
    if (isValidUUID(ef.id)) {
      row.id = ef.id;
    }
  }
  if (ef.category !== undefined) {
    row.category = ef.category;
  }
  if (ef.name !== undefined || ef.fuel_or_material !== undefined) {
    const n = (ef.fuel_or_material || ef.name || '').trim();
    row.fuel_or_material = n;
    row.name = n;
  }
  if (ef.factor !== undefined || ef.factor_kg_co2e !== undefined) {
    const val = Number(ef.factor_kg_co2e ?? ef.factor ?? 0);
    row.factor_kg_co2e = val;
    row.factor = val;
  }
  if (ef.unit !== undefined) {
    row.unit = ef.unit.trim();
  }
  
  // Mandatory NOT NULL column: source_standard
  const stdSource = (ef.source_standard || ef.source || ef.referenceSource || 'Custom / LECO Defined').trim() || 'Custom / LECO Defined';
  row.source_standard = stdSource;
  row.source = stdSource;
  row.reference_source = stdSource;

  if (ef.description !== undefined && ef.description !== null) {
    row.description = ef.description.trim();
    row.notes = ef.description.trim();
  }
  return row;
}

export function fromEmissionFactorRow(row: any): EmissionFactor {
  const categoryRaw = String(row.category || row.scope_category || row.scope || 'Scope 1');
  let scope: 'Scope 1' | 'Scope 2' | 'Scope 3' = 'Scope 1';
  const catLower = categoryRaw.toLowerCase();
  if (catLower.includes('scope 2') || catLower.includes('scope2') || catLower.includes('grid')) {
    scope = 'Scope 2';
  } else if (catLower.includes('scope 3') || catLower.includes('scope3') || catLower.includes('category')) {
    scope = 'Scope 3';
  } else {
    scope = 'Scope 1';
  }

  const name = String(row.fuel_or_material || row.name || row.itemName || row.item_name || row.fuel_type || 'Emission Factor');
  const factor = Number(row.factor_kg_co2e ?? row.factor ?? row.coefficient ?? row.value ?? 0);
  const unit = String(row.unit || row.unit_of_measure || 'Units');
  const source = String(row.source_standard || row.source || row.reference_source || row.referenceSource || row.governing_authority || 'Custom / LECO Defined');
  const description = String(row.description || row.notes || row.subCategory || row.sub_category || '');

  return {
    id: String(row.id || ''),
    category: categoryRaw,
    scope,
    name,
    factor,
    unit,
    source,
    source_standard: source,
    description,
    fuel_or_material: name,
    factor_kg_co2e: factor,
    referenceSource: source
  };
}

/**
 * Schema-Safe Supabase Emission Factor Mutation Helper.
 * Handles UUID generation, NOT NULL constraints (source_standard), and missing columns (PGRST204).
 */
export async function safeSupabaseEmissionFactorMutation(
  operation: 'insert' | 'update' | 'delete',
  payload: Record<string, any>,
  factorId?: string
): Promise<{ success: boolean; data?: any; error?: any; isNetworkError?: boolean }> {
  if (!supabase) {
    return { success: false, error: new Error('Supabase client is not configured') };
  }

  if (operation === 'delete') {
    if (!factorId) return { success: false, error: new Error('Factor ID required for deletion') };
    try {
      const { error } = await supabase.from('emission_factors').delete().eq('id', factorId);
      if (error) {
        return { success: false, error };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err };
    }
  }

  let currentPayload: Record<string, any> = { ...payload };

  // On INSERT: ALWAYS delete frontend ID so PostgreSQL can auto-generate via DEFAULT uuid_generate_v4()
  if (operation === 'insert') {
    delete currentPayload.id;
  }

  // Ensure source_standard is always provided (satisfies NOT NULL constraint)
  if (!currentPayload.source_standard) {
    currentPayload.source_standard = currentPayload.source || currentPayload.reference_source || 'Custom / LECO Defined';
  }

  const maxRetries = 8;
  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;
    let queryResult: any;

    try {
      if (operation === 'insert') {
        queryResult = await supabase.from('emission_factors').insert([currentPayload]).select().single();
      } else {
        const idToUpdate = factorId || currentPayload.id;
        queryResult = await supabase.from('emission_factors').update(currentPayload).eq('id', idToUpdate).select().single();
      }
    } catch (err: any) {
      queryResult = { error: err };
    }

    const { data, error } = queryResult;

    if (!error) {
      return { success: true, data: data ? fromEmissionFactorRow(data) : undefined };
    }

    // 0. Network error
    const errorMsg = error.message || String(error || '');
    if (
      errorMsg.includes('Failed to fetch') ||
      errorMsg.includes('NetworkError') ||
      errorMsg.includes('fetch failed')
    ) {
      return { success: false, isNetworkError: true, error };
    }

    // 1. UUID syntax error (22P02): "invalid input syntax for type uuid"
    if (error.code === '22P02' || error.message?.includes('invalid input syntax for type uuid')) {
      console.warn('[Supabase EF Safe] UUID syntax error (22P02):', error.message);
      if (operation === 'insert' && currentPayload.id) {
        delete currentPayload.id;
        continue;
      }
    }

    // 2. Not-null constraint violation on ID (23502)
    if (error.code === '23502' && (error.message?.includes('"id"') || error.message?.includes('column "id"'))) {
      console.warn('[Supabase EF Safe] Generating explicit UUID for ID');
      currentPayload.id = generateUUID();
      continue;
    }

    // 3. Not-null constraint on source_standard (23502)
    if (error.code === '23502' && (error.message?.includes('source_standard') || error.message?.includes('"source_standard"'))) {
      currentPayload.source_standard = 'Custom / LECO Defined';
      continue;
    }

    // 4. Unique violation (23505)
    if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
      if (error.message?.includes('emission_factors_pkey') || error.message?.includes('id')) {
        currentPayload.id = generateUUID();
        continue;
      }
    }

    // 5. Missing column error (PGRST204 / 42703)
    if (
      error.code === 'PGRST204' || 
      error.code === '42703' || 
      error.message?.includes('Could not find the') || 
      (error.message?.includes('column') && error.message?.includes('does not exist'))
    ) {
      const match = 
        error.message?.match(/Could not find the '([^']+)' column/) ||
        error.message?.match(/column "([^"]+)" of relation/) ||
        error.message?.match(/column "([^"]+)" does not exist/) ||
        error.message?.match(/column '([^']+)' does not exist/) ||
        error.message?.match(/column ([a-zA-Z0-9_]+) does not exist/);
      const missingCol = match ? match[1] : null;

      if (missingCol && currentPayload[missingCol] !== undefined) {
        console.warn(`[Supabase EF Safe] Pruning missing column '${missingCol}' and retrying`);
        delete currentPayload[missingCol];
        continue;
      }

      // Safe pruning of optional alias columns (never prune core schema columns)
      const optionalCols = [
        'reference_source',
        'notes',
        'description',
        'unit_of_measure',
        'item_name',
        'name',
        'source',
        'factor'
      ];
      const nextCol = optionalCols.find(col => currentPayload[col] !== undefined);
      if (nextCol) {
        console.warn(`[Supabase EF Safe] Pruning optional column '${nextCol}' and retrying`);
        delete currentPayload[nextCol];
        continue;
      }
    }

    return { success: false, error };
  }

  return { success: false, error: new Error('Exceeded maximum schema retry attempts for emission factor mutation') };
}


