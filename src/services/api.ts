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
  FacilityEmissionStat
} from '../types';

const API_BASE = '/api';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    },
    ...options
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth
  login: (email: string, password?: string) => 
    fetchJSON<{ user: User; token: string }>(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  // Users
  getUsers: () => fetchJSON<User[]>(`${API_BASE}/users`),
  createUser: (userData: Partial<User>) => 
    fetchJSON<User>(`${API_BASE}/users`, {
      method: 'POST',
      body: JSON.stringify(userData)
    }),
  updateUser: (id: string, userData: Partial<User>) => 
    fetchJSON<User>(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    }),
  deleteUser: (id: string) => 
    fetchJSON<{ success: boolean }>(`${API_BASE}/users/${id}`, {
      method: 'DELETE'
    }),
  toggleUserDelete: (id: string, canDelete: boolean) => 
    fetchJSON<User>(`${API_BASE}/users/${id}/toggle-delete`, {
      method: 'PUT',
      body: JSON.stringify({ canDelete })
    }),

  // Facilities
  getFacilities: () => fetchJSON<Facility[]>(`${API_BASE}/facilities`),
  createFacility: (data: Partial<Facility>) => 
    fetchJSON<Facility>(`${API_BASE}/facilities`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateFacility: (id: string, data: Partial<Facility>) => 
    fetchJSON<Facility>(`${API_BASE}/facilities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteFacility: (id: string) => 
    fetchJSON<{ success: boolean }>(`${API_BASE}/facilities/${id}`, {
      method: 'DELETE'
    }),
  addFacilityJobRole: (facilityId: string, roleName: string, description?: string) =>
    fetchJSON<FacilityJobRole>(`${API_BASE}/facilities/${facilityId}/job-roles`, {
      method: 'POST',
      body: JSON.stringify({ roleName, description })
    }),
  deleteFacilityJobRole: (facilityId: string, roleId: string) =>
    fetchJSON<{ success: boolean }>(`${API_BASE}/facilities/${facilityId}/job-roles/${roleId}`, {
      method: 'DELETE'
    }),

  // Emission Factors
  getEmissionFactors: () => fetchJSON<EmissionFactorEntry[]>(`${API_BASE}/emission-factors`),
  updateEmissionFactor: (id: string, factorKgCO2e: number) => 
    fetchJSON<EmissionFactorEntry>(`${API_BASE}/emission-factors/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ factorKgCO2e })
    }),

  // Analytics Summary
  getAnalyticsSummary: (year?: number, facilityId?: string) => {
    const params = new URLSearchParams();
    if (year) params.set('year', String(year));
    if (facilityId) params.set('facilityId', facilityId);
    const qs = params.toString();
    return fetchJSON<{
      totals: ScopeTotals;
      monthlyTrends: MonthlyEmissionTrend[];
      facilityStats: FacilityEmissionStat[];
    }>(`${API_BASE}/analytics/summary${qs ? `?${qs}` : ''}`);
  },

  // Scope 1: Vehicles
  getScope1Vehicles: (year?: number, facilityId?: string) => 
    fetchJSON<Scope1VehicleRecord[]>(`${API_BASE}/scope1/vehicles?${new URLSearchParams({ ...(year && { year: String(year) }), ...(facilityId && { facilityId }) }).toString()}`),
  createScope1Vehicle: (data: Partial<Scope1VehicleRecord>) => 
    fetchJSON<Scope1VehicleRecord>(`${API_BASE}/scope1/vehicles`, { method: 'POST', body: JSON.stringify(data) }),
  updateScope1Vehicle: (id: string, data: Partial<Scope1VehicleRecord>) => 
    fetchJSON<Scope1VehicleRecord>(`${API_BASE}/scope1/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteScope1Vehicle: (id: string) => 
    fetchJSON<{ success: boolean }>(`${API_BASE}/scope1/vehicles/${id}`, { method: 'DELETE' }),

  // Scope 1: Generators
  getScope1Generators: (year?: number, facilityId?: string) => 
    fetchJSON<Scope1GeneratorRecord[]>(`${API_BASE}/scope1/generators?${new URLSearchParams({ ...(year && { year: String(year) }), ...(facilityId && { facilityId }) }).toString()}`),
  createScope1Generator: (data: Partial<Scope1GeneratorRecord>) => 
    fetchJSON<Scope1GeneratorRecord>(`${API_BASE}/scope1/generators`, { method: 'POST', body: JSON.stringify(data) }),
  updateScope1Generator: (id: string, data: Partial<Scope1GeneratorRecord>) => 
    fetchJSON<Scope1GeneratorRecord>(`${API_BASE}/scope1/generators/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteScope1Generator: (id: string) => 
    fetchJSON<{ success: boolean }>(`${API_BASE}/scope1/generators/${id}`, { method: 'DELETE' }),

  // Scope 1: Stationary & LPG
  getScope1Stationary: (year?: number, facilityId?: string) => 
    fetchJSON<Scope1StationaryFuelRecord[]>(`${API_BASE}/scope1/stationary?${new URLSearchParams({ ...(year && { year: String(year) }), ...(facilityId && { facilityId }) }).toString()}`),
  createScope1Stationary: (data: Partial<Scope1StationaryFuelRecord>) => 
    fetchJSON<Scope1StationaryFuelRecord>(`${API_BASE}/scope1/stationary`, { method: 'POST', body: JSON.stringify(data) }),
  updateScope1Stationary: (id: string, data: Partial<Scope1StationaryFuelRecord>) => 
    fetchJSON<Scope1StationaryFuelRecord>(`${API_BASE}/scope1/stationary/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteScope1Stationary: (id: string) => 
    fetchJSON<{ success: boolean }>(`${API_BASE}/scope1/stationary/${id}`, { method: 'DELETE' }),

  // Scope 1: Refrigerants
  getScope1Refrigerants: (year?: number, facilityId?: string) => 
    fetchJSON<Scope1RefrigerantRecord[]>(`${API_BASE}/scope1/refrigerants?${new URLSearchParams({ ...(year && { year: String(year) }), ...(facilityId && { facilityId }) }).toString()}`),
  createScope1Refrigerant: (data: Partial<Scope1RefrigerantRecord>) => 
    fetchJSON<Scope1RefrigerantRecord>(`${API_BASE}/scope1/refrigerants`, { method: 'POST', body: JSON.stringify(data) }),
  updateScope1Refrigerant: (id: string, data: Partial<Scope1RefrigerantRecord>) => 
    fetchJSON<Scope1RefrigerantRecord>(`${API_BASE}/scope1/refrigerants/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteScope1Refrigerant: (id: string) => 
    fetchJSON<{ success: boolean }>(`${API_BASE}/scope1/refrigerants/${id}`, { method: 'DELETE' }),

  // Scope 1: SF6
  getScope1SF6: (year?: number, facilityId?: string) => 
    fetchJSON<Scope1SF6Record[]>(`${API_BASE}/scope1/sf6?${new URLSearchParams({ ...(year && { year: String(year) }), ...(facilityId && { facilityId }) }).toString()}`),
  createScope1SF6: (data: Partial<Scope1SF6Record>) => 
    fetchJSON<Scope1SF6Record>(`${API_BASE}/scope1/sf6`, { method: 'POST', body: JSON.stringify(data) }),
  updateScope1SF6: (id: string, data: Partial<Scope1SF6Record>) => 
    fetchJSON<Scope1SF6Record>(`${API_BASE}/scope1/sf6/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteScope1SF6: (id: string) => 
    fetchJSON<{ success: boolean }>(`${API_BASE}/scope1/sf6/${id}`, { method: 'DELETE' }),

  // Scope 2: Electricity
  getScope2Electricity: (year?: number, facilityId?: string) => 
    fetchJSON<Scope2ElectricityRecord[]>(`${API_BASE}/scope2/electricity?${new URLSearchParams({ ...(year && { year: String(year) }), ...(facilityId && { facilityId }) }).toString()}`),
  createScope2Electricity: (data: Partial<Scope2ElectricityRecord>) => 
    fetchJSON<Scope2ElectricityRecord>(`${API_BASE}/scope2/electricity`, { method: 'POST', body: JSON.stringify(data) }),
  updateScope2Electricity: (id: string, data: Partial<Scope2ElectricityRecord>) => 
    fetchJSON<Scope2ElectricityRecord>(`${API_BASE}/scope2/electricity/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteScope2Electricity: (id: string) => 
    fetchJSON<{ success: boolean }>(`${API_BASE}/scope2/electricity/${id}`, { method: 'DELETE' }),

  // Scope 2: Solar PV
  getScope2Solar: (year?: number, facilityId?: string) => 
    fetchJSON<Scope2SolarRecord[]>(`${API_BASE}/scope2/solar?${new URLSearchParams({ ...(year && { year: String(year) }), ...(facilityId && { facilityId }) }).toString()}`),
  createScope2Solar: (data: Partial<Scope2SolarRecord>) => 
    fetchJSON<Scope2SolarRecord>(`${API_BASE}/scope2/solar`, { method: 'POST', body: JSON.stringify(data) }),
  updateScope2Solar: (id: string, data: Partial<Scope2SolarRecord>) => 
    fetchJSON<Scope2SolarRecord>(`${API_BASE}/scope2/solar/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteScope2Solar: (id: string) => 
    fetchJSON<{ success: boolean }>(`${API_BASE}/scope2/solar/${id}`, { method: 'DELETE' }),

  // Scope 3: Purchased Goods
  getScope3Goods: (year?: number, facilityId?: string) => 
    fetchJSON<Scope3PurchasedGoodsRecord[]>(`${API_BASE}/scope3/goods?${new URLSearchParams({ ...(year && { year: String(year) }), ...(facilityId && { facilityId }) }).toString()}`),
  createScope3Goods: (data: Partial<Scope3PurchasedGoodsRecord>) => 
    fetchJSON<Scope3PurchasedGoodsRecord>(`${API_BASE}/scope3/goods`, { method: 'POST', body: JSON.stringify(data) }),
  updateScope3Goods: (id: string, data: Partial<Scope3PurchasedGoodsRecord>) => 
    fetchJSON<Scope3PurchasedGoodsRecord>(`${API_BASE}/scope3/goods/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteScope3Goods: (id: string) => 
    fetchJSON<{ success: boolean }>(`${API_BASE}/scope3/goods/${id}`, { method: 'DELETE' }),

  // Scope 3: Capital Goods
  getScope3Capital: (year?: number, facilityId?: string) => 
    fetchJSON<Scope3CapitalGoodsRecord[]>(`${API_BASE}/scope3/capital?${new URLSearchParams({ ...(year && { year: String(year) }), ...(facilityId && { facilityId }) }).toString()}`),
  createScope3Capital: (data: Partial<Scope3CapitalGoodsRecord>) => 
    fetchJSON<Scope3CapitalGoodsRecord>(`${API_BASE}/scope3/capital`, { method: 'POST', body: JSON.stringify(data) }),
  updateScope3Capital: (id: string, data: Partial<Scope3CapitalGoodsRecord>) => 
    fetchJSON<Scope3CapitalGoodsRecord>(`${API_BASE}/scope3/capital/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteScope3Capital: (id: string) => 
    fetchJSON<{ success: boolean }>(`${API_BASE}/scope3/capital/${id}`, { method: 'DELETE' }),

  // Scope 3: Construction
  getScope3Construction: (year?: number, facilityId?: string) => 
    fetchJSON<Scope3ConstructionRecord[]>(`${API_BASE}/scope3/construction?${new URLSearchParams({ ...(year && { year: String(year) }), ...(facilityId && { facilityId }) }).toString()}`),
  createScope3Construction: (data: Partial<Scope3ConstructionRecord>) => 
    fetchJSON<Scope3ConstructionRecord>(`${API_BASE}/scope3/construction`, { method: 'POST', body: JSON.stringify(data) }),
  updateScope3Construction: (id: string, data: Partial<Scope3ConstructionRecord>) => 
    fetchJSON<Scope3ConstructionRecord>(`${API_BASE}/scope3/construction/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteScope3Construction: (id: string) => 
    fetchJSON<{ success: boolean }>(`${API_BASE}/scope3/construction/${id}`, { method: 'DELETE' }),

  // Scope 3: Upstream Freight
  getScope3Freight: (year?: number, facilityId?: string) => 
    fetchJSON<Scope3UpstreamFreightRecord[]>(`${API_BASE}/scope3/freight?${new URLSearchParams({ ...(year && { year: String(year) }), ...(facilityId && { facilityId }) }).toString()}`),
  createScope3Freight: (data: Partial<Scope3UpstreamFreightRecord>) => 
    fetchJSON<Scope3UpstreamFreightRecord>(`${API_BASE}/scope3/freight`, { method: 'POST', body: JSON.stringify(data) }),
  updateScope3Freight: (id: string, data: Partial<Scope3UpstreamFreightRecord>) => 
    fetchJSON<Scope3UpstreamFreightRecord>(`${API_BASE}/scope3/freight/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteScope3Freight: (id: string) => 
    fetchJSON<{ success: boolean }>(`${API_BASE}/scope3/freight/${id}`, { method: 'DELETE' }),

  // Scope 3: Waste Operations
  getScope3Waste: (year?: number, facilityId?: string) => 
    fetchJSON<Scope3WasteRecord[]>(`${API_BASE}/scope3/waste?${new URLSearchParams({ ...(year && { year: String(year) }), ...(facilityId && { facilityId }) }).toString()}`),
  createScope3Waste: (data: Partial<Scope3WasteRecord>) => 
    fetchJSON<Scope3WasteRecord>(`${API_BASE}/scope3/waste`, { method: 'POST', body: JSON.stringify(data) }),
  updateScope3Waste: (id: string, data: Partial<Scope3WasteRecord>) => 
    fetchJSON<Scope3WasteRecord>(`${API_BASE}/scope3/waste/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteScope3Waste: (id: string) => 
    fetchJSON<{ success: boolean }>(`${API_BASE}/scope3/waste/${id}`, { method: 'DELETE' }),

  // Scope 3: Travel & Commuting
  getScope3Travel: (year?: number, facilityId?: string) => 
    fetchJSON<Scope3BusinessTravelRecord[]>(`${API_BASE}/scope3/travel?${new URLSearchParams({ ...(year && { year: String(year) }), ...(facilityId && { facilityId }) }).toString()}`),
  createScope3Travel: (data: Partial<Scope3BusinessTravelRecord>) => 
    fetchJSON<Scope3BusinessTravelRecord>(`${API_BASE}/scope3/travel`, { method: 'POST', body: JSON.stringify(data) }),
  updateScope3Travel: (id: string, data: Partial<Scope3BusinessTravelRecord>) => 
    fetchJSON<Scope3BusinessTravelRecord>(`${API_BASE}/scope3/travel/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteScope3Travel: (id: string) => 
    fetchJSON<{ success: boolean }>(`${API_BASE}/scope3/travel/${id}`, { method: 'DELETE' }),

  // Scope 3: Distribution Losses
  getScope3DistributionLosses: (year?: number, facilityId?: string) => 
    fetchJSON<Scope3DistributionLossRecord[]>(`${API_BASE}/scope3/distribution-losses?${new URLSearchParams({ ...(year && { year: String(year) }), ...(facilityId && { facilityId }) }).toString()}`),
  createScope3DistributionLoss: (data: Partial<Scope3DistributionLossRecord>) => 
    fetchJSON<Scope3DistributionLossRecord>(`${API_BASE}/scope3/distribution-losses`, { method: 'POST', body: JSON.stringify(data) }),
  updateScope3DistributionLoss: (id: string, data: Partial<Scope3DistributionLossRecord>) => 
    fetchJSON<Scope3DistributionLossRecord>(`${API_BASE}/scope3/distribution-losses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteScope3DistributionLoss: (id: string) => 
    fetchJSON<{ success: boolean }>(`${API_BASE}/scope3/distribution-losses/${id}`, { method: 'DELETE' }),

  // Admin Tools
  exportAllData: () => fetchJSON<any>(`${API_BASE}/admin/export-all`),
  resetDatabase: () => fetchJSON<{ success: boolean; message: string }>(`${API_BASE}/admin/reset-database`, { method: 'POST' }),
  getSupabaseStatus: () => fetchJSON<{ configured: boolean; url: string; mode: string }>(`${API_BASE}/admin/supabase-status`),
};
