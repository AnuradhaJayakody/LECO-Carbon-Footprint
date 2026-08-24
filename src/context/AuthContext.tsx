import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Facility, AppModule } from '../types';
import { api } from '../services/api';
import { supabase, isSupabaseConfigured, signInWithSupabaseAuth, signOutSupabaseAuth, parseAssignedFacilityIds } from '../services/supabase';

interface AuthContextType {
  user: User | null;
  facilities: Facility[];
  selectedFacilityId: string;
  selectedYear: number;
  activeModule: AppModule;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSuperAdmin: boolean;
  isBranchAdmin: boolean;
  isFacilityUser: boolean;
  canDelete: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  setSelectedFacilityId: (id: string) => void;
  setSelectedYear: (year: number) => void;
  setActiveModule: (module: AppModule) => void;
  refreshFacilities: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  notify: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  toast: { message: string; type: 'success' | 'error' | 'info' | 'warning' } | null;
  hasAccessToModule: (module: AppModule) => boolean;
  hasFacilityAccess: (facilityId: string) => boolean;
  getScopedFacilities: () => Facility[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const LOCAL_STORAGE_USER_KEY = 'leco_auth_user_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [activeModule, setActiveModule] = useState<AppModule>('dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  const notify = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const loadFacilities = async () => {
    try {
      const data = await api.getFacilities();
      setFacilities(data);
    } catch (err) {
      console.error('Error loading facilities:', err);
    }
  };

  const initAuth = async () => {
    setIsLoading(true);
    try {
      await loadFacilities();
      
      // Check stored session
      const savedUserStr = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (savedUserStr) {
        try {
          const parsedUser: User = JSON.parse(savedUserStr);
          // Verify with current user roster from server
          const allUsers = await api.getUsers();
          const verified = allUsers.find(u => u.id === parsedUser.id || u.email.toLowerCase() === parsedUser.email.toLowerCase());
          if (verified && verified.isActive) {
            const normalizedUser: User = {
              ...verified,
              assignedFacilityIds: parseAssignedFacilityIds(verified.assignedFacilityIds ?? (verified.facilityId ? [verified.facilityId] : []))
            };
            setUser(normalizedUser);
            if (normalizedUser.role === 'facility_user' && normalizedUser.facilityId) {
              setSelectedFacilityId(normalizedUser.facilityId);
            } else if (normalizedUser.role === 'branch_admin' && normalizedUser.assignedFacilityIds?.length) {
              setSelectedFacilityId(normalizedUser.assignedFacilityIds[0]);
            } else if (normalizedUser.role === 'branch_admin' && normalizedUser.facilityId) {
              setSelectedFacilityId(normalizedUser.facilityId);
            } else if (normalizedUser.role === 'super_admin') {
              setSelectedFacilityId('ALL');
            }
          } else {
            localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
            setUser(null);
          }
        } catch {
          localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
        }
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (email: string, password?: string) => {
    try {
      // 1. If Supabase is configured, attempt Supabase Auth in parallel/background
      if (isSupabaseConfigured && supabase) {
        try {
          await signInWithSupabaseAuth(email, password);
        } catch (sbErr: any) {
          console.warn('Supabase Auth response notice (using verified backend user profile):', sbErr?.message || sbErr);
        }
      }

      // 2. Authenticate and retrieve RBAC user profile
      const res = await api.login(email, password);
      const rawUser = res.user;
      const loggedUser: User = {
        ...rawUser,
        assignedFacilityIds: parseAssignedFacilityIds(rawUser.assignedFacilityIds ?? (rawUser.facilityId ? [rawUser.facilityId] : []))
      };
      setUser(loggedUser);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(loggedUser));

      // Auto-set the active facility scope based on user role
      if (loggedUser.role === 'facility_user' && loggedUser.facilityId) {
        setSelectedFacilityId(loggedUser.facilityId);
      } else if (loggedUser.role === 'branch_admin' && loggedUser.assignedFacilityIds?.length) {
        setSelectedFacilityId(loggedUser.assignedFacilityIds[0]);
      } else if (loggedUser.role === 'branch_admin' && loggedUser.facilityId) {
        setSelectedFacilityId(loggedUser.facilityId);
      } else {
        setSelectedFacilityId('ALL');
      }

      const roleTitle = loggedUser.role === 'super_admin' ? 'Super Administrator' : loggedUser.role === 'branch_admin' ? 'Branch Administrator' : 'Facility User';
      notify(`Welcome back, ${loggedUser.name}! Signed in as ${roleTitle}.`, 'success');
    } catch (err: any) {
      notify(err.message || 'Login failed. Please verify your email and password.', 'error');
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    signOutSupabaseAuth().catch(() => {});
    setSelectedFacilityId('ALL');
    setActiveModule('dashboard');
    notify('You have been securely signed out.', 'info');
  };

  const refreshFacilities = async () => {
    await loadFacilities();
  };

  const refreshUsers = async () => {
    // Reload user session if updated
    if (user) {
      try {
        const allUsers = await api.getUsers();
        const updated = allUsers.find(u => u.id === user.id);
        if (updated) {
          const normalizedUser: User = {
            ...updated,
            assignedFacilityIds: parseAssignedFacilityIds(updated.assignedFacilityIds ?? (updated.facilityId ? [updated.facilityId] : []))
          };
          setUser(normalizedUser);
          localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(normalizedUser));
        }
      } catch (err) {
        console.error('Error refreshing users:', err);
      }
    }
  };

  const isSuperAdmin = user?.role === 'super_admin';
  const isBranchAdmin = user?.role === 'branch_admin';
  const isFacilityUser = user?.role === 'facility_user';
  const canDelete = isSuperAdmin || (user?.canDelete ?? false);

  const hasAccessToModule = (module: AppModule): boolean => {
    if (!user) return false;
    if (isSuperAdmin) return true;
    if (user.allowedModules && user.allowedModules.includes(module)) return true;
    return false;
  };

  const hasFacilityAccess = (facilityId: string): boolean => {
    if (!user) return false;
    if (isSuperAdmin) return true;
    if (facilityId === 'ALL') return isSuperAdmin;
    
    if (isBranchAdmin) {
      const allowedIds = parseAssignedFacilityIds(user.assignedFacilityIds?.length ? user.assignedFacilityIds : (user.facilityId ? [user.facilityId] : []));
      return allowedIds.includes(facilityId);
    }

    return user.facilityId === facilityId;
  };

  const getScopedFacilities = (): Facility[] => {
    if (!user || isSuperAdmin) {
      return facilities;
    }
    if (isBranchAdmin) {
      const allowedIds = parseAssignedFacilityIds(user.assignedFacilityIds?.length ? user.assignedFacilityIds : (user.facilityId ? [user.facilityId] : []));
      return facilities.filter(f => allowedIds.includes(f.id));
    }
    if (user.facilityId) {
      return facilities.filter(f => f.id === user.facilityId);
    }
    return [];
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        facilities,
        selectedFacilityId,
        selectedYear,
        activeModule,
        isAuthenticated: !!user,
        isLoading,
        isSuperAdmin,
        isBranchAdmin,
        isFacilityUser,
        canDelete,
        login,
        logout,
        setSelectedFacilityId,
        setSelectedYear,
        setActiveModule,
        refreshFacilities,
        refreshUsers,
        notify,
        toast,
        hasAccessToModule,
        hasFacilityAccess,
        getScopedFacilities
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

