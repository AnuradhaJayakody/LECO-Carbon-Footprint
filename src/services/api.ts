import { 
  User, 
  Facility, 
  EmissionFactor, 
  Scope1Record, 
  Scope2Record, 
  Scope3Record, 
  DashboardSummary 
} from '../types';
import { 
  supabase, 
  toFacilityRow, 
  fromFacilityRow, 
  toUserProfileRow, 
  fromUserProfileRow,
  toScope1Row,
  fromScope1Row,
  toScope2Row,
  fromScope2Row,
  toScope3Row,
  fromScope3Row
} from './supabase';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
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
}

export const api = {
  // Auth
  login: async (email: string, password?: string): Promise<{ success: boolean; user: User }> => {
    // 1. Try Supabase user_profiles if configured
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .ilike('email', email.trim())
          .maybeSingle();

        if (!error && data) {
          const user = fromUserProfileRow(data);
          if (!user.isActive) throw new Error('Account is deactivated. Please contact your LECO Administrator.');
          return { success: true, user };
        }
      } catch (err: any) {
        if (err.message && err.message.includes('deactivated')) throw err;
        console.warn('Supabase login lookup notice, falling back to server route:', err);
      }
    }

    // 2. Fallback to API route
    try {
      return await fetchJson<{ success: boolean; user: User }>(`${API_BASE}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
    } catch (err: any) {
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
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('facilities')
          .select('*')
          .order('name', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map(fromFacilityRow);
        }
      } catch (err) {
        console.warn('Supabase getFacilities error, falling back to API:', err);
      }
    }

    try {
      return await fetchJson<Facility[]>(`${API_BASE}/facilities`);
    } catch {
      const stored = localStorage.getItem('leco_facilities');
      return stored ? JSON.parse(stored) : [];
    }
  },

  createFacility: async (fac: Partial<Facility>): Promise<Facility> => {
    let createdFacility: Facility | null = null;

    if (supabase) {
      try {
        const row = toFacilityRow(fac);
        const { data, error } = await supabase
          .from('facilities')
          .insert([row])
          .select()
          .single();

        if (error) {
          console.warn('Supabase insert facility warning:', error);
        } else if (data) {
          createdFacility = fromFacilityRow(data);
        }
      } catch (err) {
        console.warn('Supabase createFacility exception:', err);
      }
    }

    // Sync to local server
    try {
      const serverResult = await fetchJson<Facility>(`${API_BASE}/facilities`, {
        method: 'POST',
        body: JSON.stringify(fac)
      });
      return createdFacility || serverResult;
    } catch {
      return createdFacility || (fac as Facility);
    }
  },

  updateFacility: async (id: string, updates: Partial<Facility>): Promise<Facility> => {
    let updatedFacility: Facility | null = null;

    if (supabase) {
      try {
        const row = toFacilityRow(updates);
        const { data, error } = await supabase
          .from('facilities')
          .update(row)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.warn('Supabase update facility warning:', error);
        } else if (data) {
          updatedFacility = fromFacilityRow(data);
        }
      } catch (err) {
        console.warn('Supabase updateFacility exception:', err);
      }
    }

    // Sync to local server
    try {
      const serverResult = await fetchJson<Facility>(`${API_BASE}/facilities/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      return updatedFacility || serverResult;
    } catch {
      return updatedFacility || ({ ...updates, id } as Facility);
    }
  },

  deleteFacility: async (id: string): Promise<{ success: boolean }> => {
    if (supabase) {
      try {
        const { error } = await supabase
          .from('facilities')
          .delete()
          .eq('id', id);

        if (error) {
          console.warn('Supabase delete facility warning:', error);
        }
      } catch (err) {
        console.warn('Supabase deleteFacility exception:', err);
      }
    }

    try {
      return await fetchJson<{ success: boolean }>(`${API_BASE}/facilities/${id}`, {
        method: 'DELETE'
      });
    } catch {
      return { success: true };
    }
  },

  // Users
  getUsers: async (): Promise<User[]> => {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .order('name', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map(fromUserProfileRow);
        }
      } catch (err) {
        console.warn('Supabase getUsers error, falling back to API:', err);
      }
    }

    try {
      return await fetchJson<User[]>(`${API_BASE}/users`);
    } catch {
      const stored = localStorage.getItem('leco_users');
      return stored ? JSON.parse(stored) : [];
    }
  },

  createUser: async (user: Partial<User>): Promise<User> => {
    let createdUser: User | null = null;

    if (supabase) {
      try {
        const row = toUserProfileRow(user);
        const { data, error } = await supabase
          .from('user_profiles')
          .insert([row])
          .select()
          .single();

        if (error) {
          console.warn('Supabase insert user_profile warning:', error);
        } else if (data) {
          createdUser = fromUserProfileRow(data);
        }
      } catch (err) {
        console.warn('Supabase createUser exception:', err);
      }
    }

    try {
      const serverResult = await fetchJson<User>(`${API_BASE}/users`, {
        method: 'POST',
        body: JSON.stringify(user)
      });
      return createdUser || serverResult;
    } catch {
      return createdUser || (user as User);
    }
  },

  updateUser: async (id: string, updates: Partial<User>): Promise<User> => {
    let updatedUser: User | null = null;

    if (supabase) {
      try {
        const row = toUserProfileRow(updates);
        const { data, error } = await supabase
          .from('user_profiles')
          .update(row)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.warn('Supabase update user_profile warning:', error);
        } else if (data) {
          updatedUser = fromUserProfileRow(data);
        }
      } catch (err) {
        console.warn('Supabase updateUser exception:', err);
      }
    }

    try {
      const serverResult = await fetchJson<User>(`${API_BASE}/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      return updatedUser || serverResult;
    } catch {
      return updatedUser || ({ ...updates, id } as User);
    }
  },

  deleteUser: async (id: string): Promise<{ success: boolean }> => {
    if (supabase) {
      try {
        const { error } = await supabase
          .from('user_profiles')
          .delete()
          .eq('id', id);

        if (error) {
          console.warn('Supabase delete user_profile warning:', error);
        }
      } catch (err) {
        console.warn('Supabase deleteUser exception:', err);
      }
    }

    try {
      return await fetchJson<{ success: boolean }>(`${API_BASE}/users/${id}`, {
        method: 'DELETE'
      });
    } catch {
      return { success: true };
    }
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
    if (supabase) {
      try {
        let query = supabase.from('scope1_records').select('*').order('reporting_month', { ascending: true });
        if (year) {
          query = query.eq('reporting_year', year);
        }
        if (facilityId && facilityId !== 'ALL') {
          query = query.eq('facility_id', facilityId);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map(fromScope1Row);
        }
      } catch (err) {
        console.warn('Supabase getScope1 error, falling back to API:', err);
      }
    }

    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (facilityId) params.append('facilityId', facilityId);
    return await fetchJson<Scope1Record[]>(`${API_BASE}/scope1?${params.toString()}`);
  },

  createScope1: async (rec: Partial<Scope1Record>): Promise<Scope1Record> => {
    let createdRecord: Scope1Record | null = null;

    if (supabase) {
      try {
        const row = toScope1Row(rec);
        const { data, error } = await supabase
          .from('scope1_records')
          .insert([row])
          .select()
          .single();

        if (error) {
          console.warn('Supabase insert scope1_records warning:', error);
        } else if (data) {
          createdRecord = fromScope1Row(data);
        }
      } catch (err) {
        console.warn('Supabase createScope1 exception:', err);
      }
    }

    try {
      const serverResult = await fetchJson<Scope1Record>(`${API_BASE}/scope1`, {
        method: 'POST',
        body: JSON.stringify(rec)
      });
      return createdRecord || serverResult;
    } catch {
      return createdRecord || (rec as Scope1Record);
    }
  },

  updateScope1: async (id: string, updates: Partial<Scope1Record>): Promise<Scope1Record> => {
    let updatedRecord: Scope1Record | null = null;

    if (supabase) {
      try {
        const row = toScope1Row(updates);
        const { data, error } = await supabase
          .from('scope1_records')
          .update(row)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.warn('Supabase update scope1_records warning:', error);
        } else if (data) {
          updatedRecord = fromScope1Row(data);
        }
      } catch (err) {
        console.warn('Supabase updateScope1 exception:', err);
      }
    }

    try {
      const serverResult = await fetchJson<Scope1Record>(`${API_BASE}/scope1/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      return updatedRecord || serverResult;
    } catch {
      return updatedRecord || ({ ...updates, id } as Scope1Record);
    }
  },

  deleteScope1: async (id: string): Promise<{ success: boolean }> => {
    if (supabase) {
      try {
        const { error } = await supabase
          .from('scope1_records')
          .delete()
          .eq('id', id);

        if (error) {
          console.warn('Supabase delete scope1_records warning:', error);
        }
      } catch (err) {
        console.warn('Supabase deleteScope1 exception:', err);
      }
    }

    try {
      return await fetchJson<{ success: boolean }>(`${API_BASE}/scope1/${id}`, {
        method: 'DELETE'
      });
    } catch {
      return { success: true };
    }
  },

  // Scope 2
  getScope2: async (year?: number, facilityId?: string): Promise<Scope2Record[]> => {
    if (supabase) {
      try {
        let query = supabase.from('scope2_records').select('*').order('reporting_month', { ascending: true });
        if (year) {
          query = query.eq('reporting_year', year);
        }
        if (facilityId && facilityId !== 'ALL') {
          query = query.eq('facility_id', facilityId);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map(fromScope2Row);
        }
      } catch (err) {
        console.warn('Supabase getScope2 error, falling back to API:', err);
      }
    }

    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (facilityId) params.append('facilityId', facilityId);
    return await fetchJson<Scope2Record[]>(`${API_BASE}/scope2?${params.toString()}`);
  },

  createScope2: async (rec: Partial<Scope2Record>): Promise<Scope2Record> => {
    let createdRecord: Scope2Record | null = null;

    if (supabase) {
      try {
        const row = toScope2Row(rec);
        const { data, error } = await supabase
          .from('scope2_records')
          .insert([row])
          .select()
          .single();

        if (error) {
          console.warn('Supabase insert scope2_records warning:', error);
        } else if (data) {
          createdRecord = fromScope2Row(data);
        }
      } catch (err) {
        console.warn('Supabase createScope2 exception:', err);
      }
    }

    try {
      const serverResult = await fetchJson<Scope2Record>(`${API_BASE}/scope2`, {
        method: 'POST',
        body: JSON.stringify(rec)
      });
      return createdRecord || serverResult;
    } catch {
      return createdRecord || (rec as Scope2Record);
    }
  },

  updateScope2: async (id: string, updates: Partial<Scope2Record>): Promise<Scope2Record> => {
    let updatedRecord: Scope2Record | null = null;

    if (supabase) {
      try {
        const row = toScope2Row(updates);
        const { data, error } = await supabase
          .from('scope2_records')
          .update(row)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.warn('Supabase update scope2_records warning:', error);
        } else if (data) {
          updatedRecord = fromScope2Row(data);
        }
      } catch (err) {
        console.warn('Supabase updateScope2 exception:', err);
      }
    }

    try {
      const serverResult = await fetchJson<Scope2Record>(`${API_BASE}/scope2/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      return updatedRecord || serverResult;
    } catch {
      return updatedRecord || ({ ...updates, id } as Scope2Record);
    }
  },

  deleteScope2: async (id: string): Promise<{ success: boolean }> => {
    if (supabase) {
      try {
        const { error } = await supabase
          .from('scope2_records')
          .delete()
          .eq('id', id);

        if (error) {
          console.warn('Supabase delete scope2_records warning:', error);
        }
      } catch (err) {
        console.warn('Supabase deleteScope2 exception:', err);
      }
    }

    try {
      return await fetchJson<{ success: boolean }>(`${API_BASE}/scope2/${id}`, {
        method: 'DELETE'
      });
    } catch {
      return { success: true };
    }
  },

  // Scope 3
  getScope3: async (year?: number, facilityId?: string): Promise<Scope3Record[]> => {
    if (supabase) {
      try {
        let query = supabase.from('scope3_records').select('*').order('reporting_month', { ascending: true });
        if (year) {
          query = query.eq('reporting_year', year);
        }
        if (facilityId && facilityId !== 'ALL') {
          query = query.eq('facility_id', facilityId);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map(fromScope3Row);
        }
      } catch (err) {
        console.warn('Supabase getScope3 error, falling back to API:', err);
      }
    }

    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (facilityId) params.append('facilityId', facilityId);
    return await fetchJson<Scope3Record[]>(`${API_BASE}/scope3?${params.toString()}`);
  },

  createScope3: async (rec: Partial<Scope3Record>): Promise<Scope3Record> => {
    let createdRecord: Scope3Record | null = null;

    if (supabase) {
      try {
        const row = toScope3Row(rec);
        const { data, error } = await supabase
          .from('scope3_records')
          .insert([row])
          .select()
          .single();

        if (error) {
          console.warn('Supabase insert scope3_records warning:', error);
        } else if (data) {
          createdRecord = fromScope3Row(data);
        }
      } catch (err) {
        console.warn('Supabase createScope3 exception:', err);
      }
    }

    try {
      const serverResult = await fetchJson<Scope3Record>(`${API_BASE}/scope3`, {
        method: 'POST',
        body: JSON.stringify(rec)
      });
      return createdRecord || serverResult;
    } catch {
      return createdRecord || (rec as Scope3Record);
    }
  },

  updateScope3: async (id: string, updates: Partial<Scope3Record>): Promise<Scope3Record> => {
    let updatedRecord: Scope3Record | null = null;

    if (supabase) {
      try {
        const row = toScope3Row(updates);
        const { data, error } = await supabase
          .from('scope3_records')
          .update(row)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.warn('Supabase update scope3_records warning:', error);
        } else if (data) {
          updatedRecord = fromScope3Row(data);
        }
      } catch (err) {
        console.warn('Supabase updateScope3 exception:', err);
      }
    }

    try {
      const serverResult = await fetchJson<Scope3Record>(`${API_BASE}/scope3/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      return updatedRecord || serverResult;
    } catch {
      return updatedRecord || ({ ...updates, id } as Scope3Record);
    }
  },

  deleteScope3: async (id: string): Promise<{ success: boolean }> => {
    if (supabase) {
      try {
        const { error } = await supabase
          .from('scope3_records')
          .delete()
          .eq('id', id);

        if (error) {
          console.warn('Supabase delete scope3_records warning:', error);
        }
      } catch (err) {
        console.warn('Supabase deleteScope3 exception:', err);
      }
    }

    try {
      return await fetchJson<{ success: boolean }>(`${API_BASE}/scope3/${id}`, {
        method: 'DELETE'
      });
    } catch {
      return { success: true };
    }
  },

  // Dashboard Summary
  getDashboardSummary: async (year?: number, facilityId?: string): Promise<DashboardSummary> => {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (facilityId) params.append('facilityId', facilityId);
    return await fetchJson<DashboardSummary>(`${API_BASE}/dashboard/summary?${params.toString()}`);
  }
};
