import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Facility } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedFacilityId: string;
  setSelectedFacilityId: (id: string) => void;
  facilities: Facility[];
  refreshFacilities: () => Promise<void>;
  notification: { type: 'success' | 'error' | 'info'; message: string } | null;
  notify: (message: string, type?: 'success' | 'error' | 'info') => void;
  clearNotification: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'leco_cf_auth_user';
const LOCAL_STORAGE_YEAR_KEY = 'leco_cf_selected_year';
const LOCAL_STORAGE_FACILITY_KEY = 'leco_cf_selected_fac';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Pre-seed with Super Admin so users can immediately view the live system without getting blocked
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // Default logged in as Super Admin for instant convenience
    return {
      id: 'usr-1',
      email: 'superadmincf@leco.com',
      name: 'Super Admin (LECO Sustainability Lead)',
      role: 'super_admin',
      department: 'Corporate Sustainability & Executive Engineering',
      createdAt: new Date().toISOString()
    };
  });

  const [selectedYear, setSelectedYearState] = useState<number>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_YEAR_KEY);
    return saved ? Number(saved) : 2025;
  });

  const [selectedFacilityId, setSelectedFacilityIdState] = useState<string>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_FACILITY_KEY);
    return saved || 'ALL';
  });

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const notify = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const clearNotification = () => setNotification(null);

  const setSelectedYear = (yr: number) => {
    setSelectedYearState(yr);
    localStorage.setItem(LOCAL_STORAGE_YEAR_KEY, String(yr));
  };

  const setSelectedFacilityId = (fid: string) => {
    setSelectedFacilityIdState(fid);
    localStorage.setItem(LOCAL_STORAGE_FACILITY_KEY, fid);
  };

  const refreshFacilities = async () => {
    try {
      const facs = await api.getFacilities();
      setFacilities(facs);
    } catch (e) {
      console.error('Error fetching facilities:', e);
    }
  };

  useEffect(() => {
    refreshFacilities();
  }, []);

  const login = async (email: string, password?: string) => {
    try {
      const res = await api.login(email, password);
      setUser(res.user);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(res.user));
      notify(`Welcome, ${res.user.name}! Authenticated as ${res.user.role === 'super_admin' ? 'Super Admin' : 'Officer'}.`, 'success');
    } catch (err: any) {
      notify(err.message || 'Login failed', 'error');
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    notify('Logged out successfully', 'info');
  };

  const isAuthenticated = !!user;
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isSuperAdmin,
        login,
        logout,
        selectedYear,
        setSelectedYear,
        selectedFacilityId,
        setSelectedFacilityId,
        facilities,
        refreshFacilities,
        notification,
        notify,
        clearNotification
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
