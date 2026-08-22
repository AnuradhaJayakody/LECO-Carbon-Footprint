import { 
  User, 
  Facility, 
  EmissionFactor, 
  Scope1Record, 
  Scope2Record, 
  Scope3Record, 
  DashboardSummary 
} from '../types';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Network error or server error' }));
      throw new Error(err.error || `HTTP error! status: ${res.status}`);
    }
    return res.json();
  } catch (error: any) {
    // If backend isn't available or running in standalone frontend mode, use localStorage or mock data
    console.warn(`API call to ${url} failed, using local handling:`, error);
    throw error;
  }
}

export const api = {
  // Auth
  login: async (email: string, password?: string): Promise<{ success: boolean; user: User }> => {
    try {
      return await fetchJson<{ success: boolean; user: User }>(`${API_BASE}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
    } catch (err: any) {
      // Fallback local lookup if server is not reachable
      const users = await api.getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
      if (user) {
        if (!user.isActive) throw new Error('Account is deactivated');
        return { success: true, user };
      }
      throw new Error(err.message || 'Invalid credentials');
    }
  },

  // Facilities
  getFacilities: async (): Promise<Facility[]> => {
    try {
      return await fetchJson<Facility[]>(`${API_BASE}/facilities`);
    } catch {
      const stored = localStorage.getItem('leco_facilities');
      return stored ? JSON.parse(stored) : [];
    }
  },
  createFacility: async (fac: Partial<Facility>): Promise<Facility> => {
    return await fetchJson<Facility>(`${API_BASE}/facilities`, {
      method: 'POST',
      body: JSON.stringify(fac)
    });
  },
  updateFacility: async (id: string, updates: Partial<Facility>): Promise<Facility> => {
    return await fetchJson<Facility>(`${API_BASE}/facilities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },
  deleteFacility: async (id: string): Promise<{ success: boolean }> => {
    return await fetchJson<{ success: boolean }>(`${API_BASE}/facilities/${id}`, {
      method: 'DELETE'
    });
  },

  // Users
  getUsers: async (): Promise<User[]> => {
    try {
      return await fetchJson<User[]>(`${API_BASE}/users`);
    } catch {
      const stored = localStorage.getItem('leco_users');
      return stored ? JSON.parse(stored) : [];
    }
  },
  createUser: async (user: Partial<User>): Promise<User> => {
    return await fetchJson<User>(`${API_BASE}/users`, {
      method: 'POST',
      body: JSON.stringify(user)
    });
  },
  updateUser: async (id: string, updates: Partial<User>): Promise<User> => {
    return await fetchJson<User>(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },
  deleteUser: async (id: string): Promise<{ success: boolean }> => {
    return await fetchJson<{ success: boolean }>(`${API_BASE}/users/${id}`, {
      method: 'DELETE'
    });
  },

  // Emission Factors
  getEmissionFactors: async (): Promise<EmissionFactor[]> => {
    return await fetchJson<EmissionFactor[]>(`${API_BASE}/emission-factors`);
  },
  createEmissionFactor: async (factor: Partial<EmissionFactor>): Promise<EmissionFactor> => {
    return await fetchJson<EmissionFactor>(`${API_BASE}/emission-factors`, {
      method: 'POST',
      body: JSON.stringify(factor)
    });
  },
  updateEmissionFactor: async (id: string, updates: Partial<EmissionFactor>): Promise<EmissionFactor> => {
    return await fetchJson<EmissionFactor>(`${API_BASE}/emission-factors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },
  deleteEmissionFactor: async (id: string): Promise<{ success: boolean }> => {
    return await fetchJson<{ success: boolean }>(`${API_BASE}/emission-factors/${id}`, {
      method: 'DELETE'
    });
  },

  // Scope 1
  getScope1: async (year?: number, facilityId?: string): Promise<Scope1Record[]> => {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (facilityId) params.append('facilityId', facilityId);
    return await fetchJson<Scope1Record[]>(`${API_BASE}/scope1?${params.toString()}`);
  },
  createScope1: async (rec: Partial<Scope1Record>): Promise<Scope1Record> => {
    return await fetchJson<Scope1Record>(`${API_BASE}/scope1`, {
      method: 'POST',
      body: JSON.stringify(rec)
    });
  },
  updateScope1: async (id: string, updates: Partial<Scope1Record>): Promise<Scope1Record> => {
    return await fetchJson<Scope1Record>(`${API_BASE}/scope1/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },
  deleteScope1: async (id: string): Promise<{ success: boolean }> => {
    return await fetchJson<{ success: boolean }>(`${API_BASE}/scope1/${id}`, {
      method: 'DELETE'
    });
  },

  // Scope 2
  getScope2: async (year?: number, facilityId?: string): Promise<Scope2Record[]> => {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (facilityId) params.append('facilityId', facilityId);
    return await fetchJson<Scope2Record[]>(`${API_BASE}/scope2?${params.toString()}`);
  },
  createScope2: async (rec: Partial<Scope2Record>): Promise<Scope2Record> => {
    return await fetchJson<Scope2Record>(`${API_BASE}/scope2`, {
      method: 'POST',
      body: JSON.stringify(rec)
    });
  },
  updateScope2: async (id: string, updates: Partial<Scope2Record>): Promise<Scope2Record> => {
    return await fetchJson<Scope2Record>(`${API_BASE}/scope2/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },
  deleteScope2: async (id: string): Promise<{ success: boolean }> => {
    return await fetchJson<{ success: boolean }>(`${API_BASE}/scope2/${id}`, {
      method: 'DELETE'
    });
  },

  // Scope 3
  getScope3: async (year?: number, facilityId?: string): Promise<Scope3Record[]> => {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (facilityId) params.append('facilityId', facilityId);
    return await fetchJson<Scope3Record[]>(`${API_BASE}/scope3?${params.toString()}`);
  },
  createScope3: async (rec: Partial<Scope3Record>): Promise<Scope3Record> => {
    return await fetchJson<Scope3Record>(`${API_BASE}/scope3`, {
      method: 'POST',
      body: JSON.stringify(rec)
    });
  },
  updateScope3: async (id: string, updates: Partial<Scope3Record>): Promise<Scope3Record> => {
    return await fetchJson<Scope3Record>(`${API_BASE}/scope3/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },
  deleteScope3: async (id: string): Promise<{ success: boolean }> => {
    return await fetchJson<{ success: boolean }>(`${API_BASE}/scope3/${id}`, {
      method: 'DELETE'
    });
  },

  // Dashboard Summary
  getDashboardSummary: async (year?: number, facilityId?: string): Promise<DashboardSummary> => {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (facilityId) params.append('facilityId', facilityId);
    return await fetchJson<DashboardSummary>(`${API_BASE}/dashboard/summary?${params.toString()}`);
  }
};
