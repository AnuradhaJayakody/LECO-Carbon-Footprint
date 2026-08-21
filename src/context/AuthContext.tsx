import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { User, Facility, FacilityJobRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isBranchAdmin: boolean;
  isFacilityUser: boolean;
  canDelete: boolean;
  isImmutableRootAdmin: boolean;
  
  // Access Control Helpers
  canAccessModule: (moduleKey: string) => boolean;
  hasFacilityAccess: (facilityId: string) => boolean;
  accessibleFacilities: Facility[];
  
  // Auth actions
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  switchUser: (targetUser: User) => void;
  
  // Year & Facility selection
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedFacilityId: string;
  setSelectedFacilityId: (id: string) => void;
  
  // Facilities & Job Roles
  facilities: Facility[];
  refreshFacilities: () => Promise<void>;
  addFacilityJobRole: (facilityId: string, roleName: string, description?: string) => Promise<FacilityJobRole | null>;
  deleteFacilityJobRole: (facilityId: string, roleId: string) => Promise<boolean>;
  
  // Users Management
  users: User[];
  refreshUsers: () => Promise<void>;
  createUser: (userData: Partial<User>) => Promise<User>;
  updateUser: (id: string, userData: Partial<User>) => Promise<User>;
  deleteUser: (id: string) => Promise<boolean>;
  toggleUserDelete: (id: string, canDelete: boolean) => Promise<void>;
  
  // Toast notifications
  notification: { type: 'success' | 'error' | 'info'; message: string } | null;
  notify: (message: string, type?: 'success' | 'error' | 'info') => void;
  clearNotification: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'leco_cf_auth_user_v2';
const LOCAL_STORAGE_YEAR_KEY = 'leco_cf_selected_year';
const LOCAL_STORAGE_FACILITY_KEY = 'leco_cf_selected_fac';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Pre-seed with Super Admin so users can immediately view the live system
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // Default logged in as Super Admin
    return {
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
  const [users, setUsers] = useState<User[]>([]);
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

  const refreshUsers = async () => {
    try {
      const uList = await api.getUsers();
      setUsers(uList);
    } catch (e) {
      console.error('Error fetching users:', e);
    }
  };

  useEffect(() => {
    refreshFacilities();
    refreshUsers();
  }, []);

  const login = async (email: string, password?: string) => {
    try {
      // 1. Try Supabase Auth in background / parallel if available
      try {
        if (isSupabaseConfigured && supabase) {
          await signInWithSupabaseAuth(email, password).catch((e) => {
            console.log('Supabase direct auth info (fallback to backend database session):', e?.message || e);
          });
        }
      } catch (sbErr) {
        console.warn('Supabase auth attempt:', sbErr);
      }

      // 2. Fetch full RBAC profile and verified session
      const res = await api.login(email, password);
      const loggedUser = res.user;
      setUser(loggedUser);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(loggedUser));

      // Auto-set the active facility scope based on role
      if (loggedUser.role === 'facility_user' && loggedUser.facilityId) {
        setSelectedFacilityId(loggedUser.facilityId);
      } else if (loggedUser.role === 'branch_admin' && loggedUser.facilityId) {
        setSelectedFacilityId(loggedUser.facilityId);
      } else if (loggedUser.role === 'branch_admin' && loggedUser.assignedFacilityIds && loggedUser.assignedFacilityIds.length > 0) {
        setSelectedFacilityId(loggedUser.assignedFacilityIds[0]);
      } else if (loggedUser.role === 'super_admin') {
        // Keep 'ALL' or current
      }

      const roleLabel = loggedUser.role === 'super_admin' ? 'Super Admin' : loggedUser.role === 'branch_admin' ? 'Branch Admin' : 'Facility User';
      notify(`Welcome back, ${loggedUser.name}! Signed in as ${roleLabel}.`, 'success');
    } catch (err: any) {
      notify(err.message || 'Login failed. Please check your credentials.', 'error');
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    signOutSupabaseAuth().catch(() => {});
    notify('Logged out successfully', 'info');
  };

  const switchUser = (targetUser: User) => {
    setUser(targetUser);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(targetUser));
    if (targetUser.role === 'facility_user' && targetUser.facilityId) {
      setSelectedFacilityId(targetUser.facilityId);
    } else if (targetUser.role === 'branch_admin' && targetUser.facilityId) {
      setSelectedFacilityId(targetUser.facilityId);
    } else if (targetUser.role === 'branch_admin' && targetUser.assignedFacilityIds?.length) {
      setSelectedFacilityId(targetUser.assignedFacilityIds[0]);
    }
    const roleLabel = targetUser.role === 'super_admin' ? 'Super Admin' : targetUser.role === 'branch_admin' ? 'Branch Admin' : 'Facility User';
    notify(`Switched session to ${targetUser.name} (${roleLabel})`, 'info');
  };

  const isSuperAdmin = user?.role === 'super_admin';
  const isBranchAdmin = user?.role === 'branch_admin';
  const isFacilityUser = user?.role === 'facility_user' || user?.role === 'facility_officer';
  const isImmutableRootAdmin = Boolean(user?.isImmutableRootAdmin || user?.email?.toLowerCase() === 'superadmincf@leco.com');
  const canDelete = isSuperAdmin ? true : Boolean(user?.canDelete);

  // Granular Module Access Control
  const canAccessModule = (moduleKey: string): boolean => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    if (user.allowedModules && user.allowedModules.length > 0) {
      return user.allowedModules.includes(moduleKey);
    }
    // Default module permissions
    if (moduleKey === 'users' || moduleKey === 'emission-factors' || moduleKey === 'supabase-sql') {
      return user.role === 'super_admin' || (user.role === 'branch_admin' && user.allowedModules?.includes(moduleKey));
    }
    return true;
  };

  // Facility Scope Filtering (including child CSCs under assigned parent branches)
  const hasFacilityAccess = (facilityId: string): boolean => {
    if (!user || facilityId === 'ALL') return isSuperAdmin;
    if (user.role === 'super_admin') return true;
    if (user.role === 'branch_admin') {
      const allowedIds = user.assignedFacilityIds || (user.facilityId ? [user.facilityId] : []);
      if (allowedIds.includes(facilityId)) return true;
      // Check if target facility is a child CSC of any allowed parent branch
      const fac = facilities.find(f => f.id === facilityId);
      if (fac && fac.parentId && allowedIds.includes(fac.parentId)) {
        return true;
      }
      return false;
    }
    return user.facilityId === facilityId;
  };

  const accessibleFacilities = useMemo(() => {
    if (!user || user.role === 'super_admin') {
      return facilities;
    }
    if (user.role === 'branch_admin') {
      const allowedIds = user.assignedFacilityIds || (user.facilityId ? [user.facilityId] : []);
      return facilities.filter(f => {
        if (allowedIds.includes(f.id)) return true;
        if (f.parentId && allowedIds.includes(f.parentId)) return true;
        return false;
      });
    }
    if (user.facilityId) {
      return facilities.filter(f => f.id === user.facilityId);
    }
    return facilities;
  }, [user, facilities]);

  // Facility Job Roles API bindings
  const addFacilityJobRole = async (facilityId: string, roleName: string, description?: string) => {
    try {
      const newRole = await api.addFacilityJobRole(facilityId, roleName, description);
      await refreshFacilities();
      notify(`Job role "${roleName}" added successfully`, 'success');
      return newRole;
    } catch (err: any) {
      notify(err.message || 'Failed to add job role', 'error');
      return null;
    }
  };

  const deleteFacilityJobRole = async (facilityId: string, roleId: string) => {
    try {
      await api.deleteFacilityJobRole(facilityId, roleId);
      await refreshFacilities();
      notify('Job role removed', 'info');
      return true;
    } catch (err: any) {
      notify(err.message || 'Failed to remove job role', 'error');
      return false;
    }
  };

  // User Management API bindings
  const createUser = async (userData: Partial<User>): Promise<User> => {
    try {
      const created = await api.createUser(userData);
      await refreshUsers();
      notify(`User ${created.name} (${created.email}) created successfully`, 'success');
      return created;
    } catch (err: any) {
      notify(err.message || 'Failed to create user', 'error');
      throw err;
    }
  };

  const updateUser = async (id: string, userData: Partial<User>): Promise<User> => {
    try {
      const updated = await api.updateUser(id, userData);
      await refreshUsers();
      if (user && user.id === id) {
        setUser(updated);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(updated));
      }
      notify(`User ${updated.name} updated successfully`, 'success');
      return updated;
    } catch (err: any) {
      notify(err.message || 'Failed to update user', 'error');
      throw err;
    }
  };

  const deleteUser = async (id: string): Promise<boolean> => {
    try {
      await api.deleteUser(id);
      await refreshUsers();
      notify('User deleted successfully', 'success');
      return true;
    } catch (err: any) {
      notify(err.message || 'Failed to delete user profile', 'error');
      return false;
    }
  };

  const toggleUserDelete = async (id: string, targetCanDelete: boolean) => {
    try {
      const updated = await api.toggleUserDelete(id, targetCanDelete);
      await refreshUsers();
      notify(`Delete permissions for ${updated.name} set to ${targetCanDelete ? 'ENABLED' : 'DISABLED'}`, 'info');
    } catch (err: any) {
      notify(err.message || 'Failed to toggle delete permission', 'error');
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isSuperAdmin,
        isBranchAdmin,
        isFacilityUser,
        canDelete,
        isImmutableRootAdmin,
        canAccessModule,
        hasFacilityAccess,
        accessibleFacilities,
        login,
        logout,
        switchUser,
        selectedYear,
        setSelectedYear,
        selectedFacilityId,
        setSelectedFacilityId,
        facilities,
        refreshFacilities,
        addFacilityJobRole,
        deleteFacilityJobRole,
        users,
        refreshUsers,
        createUser,
        updateUser,
        deleteUser,
        toggleUserDelete,
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
