import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, UserRole, AppModule, Facility } from '../types';
import { api } from '../services/api';
import { 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  Building2, 
  UserCheck, 
  Key, 
  Check, 
  X, 
  Search, 
  Lock, 
  Mail, 
  Phone, 
  CheckCircle2, 
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Shield,
  Layers
} from 'lucide-react';
import { isSupabaseConfigured, signUpWithSupabaseAuth } from '../services/supabase';

const ALL_MODULES: { id: AppModule; label: string; desc: string }[] = [
  { id: 'dashboard', label: 'Executive Dashboard', desc: 'Summary metrics & charts' },
  { id: 'scope1', label: 'Scope 1 Module', desc: 'Direct fuel combustion & SF6 gas logging' },
  { id: 'scope2', label: 'Scope 2 Module', desc: 'Grid electricity and Solar PV tracking' },
  { id: 'scope3', label: 'Scope 3 Module', desc: 'Purchased goods, freight & commuting' },
  { id: 'reports', label: 'GHG Inventory Reports', desc: 'ISO 14064 reporting & export' },
  { id: 'calculator', label: 'Quick Estimator', desc: 'Single-source emissions calculator' },
  { id: 'facilities', label: 'Facilities Management', desc: 'Branch and CSC operational hierarchy' },
  { id: 'users', label: 'User Roles & RBAC', desc: 'User management & permissions' },
  { id: 'factors', label: 'Emission Factors', desc: 'GHG coefficients repository' },
  { id: 'sync', label: 'Supabase Cloud Sync', desc: 'Database connection and schema' }
];

export const UserManager: React.FC = () => {
  const { 
    facilities, 
    isSuperAdmin, 
    canDelete, 
    notify, 
    refreshUsers, 
    user: currentUser 
  } = useAuth();

  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('facility_user');
  const [facilityId, setFacilityId] = useState('');
  const [assignedFacilityIds, setAssignedFacilityIds] = useState<string[]>([]);
  const [jobRole, setJobRole] = useState('');
  const [department, setDepartment] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [userCanDelete, setUserCanDelete] = useState(false);
  const [allowedModules, setAllowedModules] = useState<AppModule[]>([
    'dashboard', 'scope1', 'scope2', 'scope3', 'reports', 'calculator'
  ]);
  const [isActive, setIsActive] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsersList(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const parentBranches = facilities.filter(f => f.type === 'Branch' || f.isParent);

  const openAddModal = () => {
    setEditingUser(null);
    setEmail('');
    setPassword('Sadmin@cf369');
    setName('');
    setRole('facility_user');
    setFacilityId(facilities[0]?.id || '');
    setAssignedFacilityIds(facilities[0]?.id ? [facilities[0].id] : []);
    setJobRole('Customer Service Officer');
    setDepartment('Distribution Operations');
    setContactNumber('+94 ');
    setUserCanDelete(false);
    setAllowedModules(['dashboard', 'scope1', 'scope2', 'scope3', 'reports', 'calculator']);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setEmail(u.email);
    setPassword('');
    setName(u.name);
    setRole(u.role);
    setFacilityId(u.facilityId || '');
    setAssignedFacilityIds(u.assignedFacilityIds || (u.facilityId ? [u.facilityId] : []));
    setJobRole(u.jobRole || '');
    setDepartment(u.department || '');
    setContactNumber(u.contactNumber || '');
    setUserCanDelete(u.canDelete ?? false);
    setAllowedModules(u.allowedModules || ['dashboard', 'scope1', 'scope2', 'scope3', 'reports', 'calculator']);
    setIsActive(u.isActive);
    setIsModalOpen(true);
  };

  const toggleModule = (mod: AppModule) => {
    if (allowedModules.includes(mod)) {
      setAllowedModules(allowedModules.filter(m => m !== mod));
    } else {
      setAllowedModules([...allowedModules, mod]);
    }
  };

  const toggleAssignedFacility = (facId: string) => {
    if (assignedFacilityIds.includes(facId)) {
      setAssignedFacilityIds(assignedFacilityIds.filter(id => id !== facId));
    } else {
      setAssignedFacilityIds([...assignedFacilityIds, facId]);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) {
      notify('Email and full name are required', 'error');
      return;
    }

    const selectedFacObj = facilities.find(f => f.id === facilityId);

    const payload: Partial<User> = {
      email: email.trim().toLowerCase(),
      name: name.trim(),
      role,
      facilityId: role === 'super_admin' ? undefined : facilityId || undefined,
      facilityName: role === 'super_admin' ? undefined : selectedFacObj?.name,
      assignedFacilityIds: role === 'branch_admin' ? assignedFacilityIds : (facilityId ? [facilityId] : []),
      jobRole: jobRole.trim(),
      department: department.trim(),
      contactNumber: contactNumber.trim(),
      canDelete: role === 'super_admin' ? true : userCanDelete,
      allowedModules: role === 'super_admin' 
        ? ['dashboard', 'scope1', 'scope2', 'scope3', 'reports', 'facilities', 'users', 'factors', 'calculator', 'sync']
        : allowedModules,
      isActive
    };

    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, payload);
        notify(`User profile for "${payload.name}" updated successfully!`, 'success');
      } else {
        // If Supabase is configured, also register Supabase Auth credentials
        if (isSupabaseConfigured) {
          try {
            await signUpWithSupabaseAuth(email.trim(), password || 'Sadmin@cf369', {
              name: name.trim(),
              role,
              facilityId
            });
          } catch (sbErr: any) {
            console.warn('Supabase Auth user creation note:', sbErr?.message || sbErr);
          }
        }

        await api.createUser({
          ...payload,
          id: `usr-${Date.now().toString(36)}`
        });
        notify(`Officer user account "${payload.name}" created successfully!`, 'success');
      }
      setIsModalOpen(false);
      await fetchUsers();
      await refreshUsers();
    } catch (err: any) {
      notify(err.message || 'Failed to save user account', 'error');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!canDelete) {
      notify('You do not have administrative permission to delete users.', 'error');
      return;
    }
    try {
      await api.deleteUser(id);
      notify('User account deactivated and removed.', 'success');
      setDeleteConfirmId(null);
      await fetchUsers();
      await refreshUsers();
    } catch (err: any) {
      notify(err.message || 'Failed to delete user', 'error');
    }
  };

  const filteredUsers = usersList.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (u.facilityName && u.facilityName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
            <Users className="w-4 h-4" />
            <span>Role-Based Access Control (RBAC) & Officer Management</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            LECO User Accounts & Delete Permissions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure officer accounts, multi-facility branch permissions, module access rights, and granular record deletion capability.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New User</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by officer name, email, facility..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'super_admin', 'branch_admin', 'facility_user'].map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                roleFilter === r
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {r === 'ALL' ? 'All Roles' : r === 'super_admin' ? 'Super Admins' : r === 'branch_admin' ? 'Branch Admins' : 'Facility Users'}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <th className="py-3.5 px-4">Officer / User Name</th>
                <th className="py-3.5 px-4">Role & Scope</th>
                <th className="py-3.5 px-4">Assigned Facility / Branch</th>
                <th className="py-3.5 px-4">Delete Rights</th>
                <th className="py-3.5 px-4">Allowed Modules</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredUsers.map((u) => {
                const isRootSuper = u.email.toLowerCase() === 'superadmincf@leco.com';

                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    
                    {/* User Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {isRootSuper && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                                Root
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400 inline" />
                            <span>{u.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        u.role === 'super_admin' ? 'bg-emerald-100 text-emerald-800' :
                        u.role === 'branch_admin' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {u.role === 'super_admin' && <ShieldCheck className="w-3.5 h-3.5" />}
                        {u.role === 'branch_admin' && <Building2 className="w-3.5 h-3.5" />}
                        {u.role === 'facility_user' && <UserCheck className="w-3.5 h-3.5" />}
                        {u.role === 'super_admin' ? 'Super Admin' : u.role === 'branch_admin' ? 'Branch Admin' : 'Facility User'}
                      </span>
                      {u.jobRole && (
                        <div className="text-[10px] text-slate-500 mt-1 font-medium">
                          {u.jobRole}
                        </div>
                      )}
                    </td>

                    {/* Facility */}
                    <td className="py-3.5 px-4">
                      {u.role === 'super_admin' ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          Global LECO Scope (All Facilities)
                        </span>
                      ) : (
                        <div>
                          <div className="font-semibold text-slate-800 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span>{u.facilityName || 'Assigned Branch'}</span>
                          </div>
                          {u.assignedFacilityIds && u.assignedFacilityIds.length > 1 && (
                            <div className="text-[10px] text-blue-600 font-medium">
                              +{u.assignedFacilityIds.length - 1} subordinate CSCs
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Granular Delete Rights */}
                    <td className="py-3.5 px-4">
                      {u.canDelete || u.role === 'super_admin' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Delete Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                          <Lock className="w-3 h-3 text-slate-400" />
                          Read/Edit Only
                        </span>
                      )}
                    </td>

                    {/* Allowed Modules */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(u.allowedModules || []).slice(0, 3).map(m => (
                          <span key={m} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                            {m}
                          </span>
                        ))}
                        {(u.allowedModules || []).length > 3 && (
                          <span className="text-[9px] text-slate-400 font-medium">
                            +{(u.allowedModules || []).length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                        u.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                      }`} />
                      <span className="font-semibold text-slate-700">
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isSuperAdmin && (
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="Edit User Permissions"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {canDelete && isSuperAdmin && !isRootSuper && (
                          <button
                            onClick={() => setDeleteConfirmId(u.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Deactivate / Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete User Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Deactivate User Account</h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to revoke this user's system access? Their historical logs will remain attributed in the audit trail.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(deleteConfirmId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow transition cursor-pointer"
              >
                Confirm Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit User Modal with Fixed Header/Footer and Scrollable Body */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Modal Header (Permanently Visible) */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    {editingUser ? `Edit Officer: ${editingUser.name}` : 'Provision New LECO Officer Account'}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Assign facility boundaries, role scopes, and granular deletion authority
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body (Scrollable Only) */}
            <form id="user-form" onSubmit={handleSaveUser} className="p-6 overflow-y-auto space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Corporate Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer.name@leco.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Officer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Eng. Dilani Senanayake"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {!editingUser && (
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Initial Access Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Default: Sadmin@cf369"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    User RBAC Role *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="facility_user">Facility User (Scoped to Specific CSC/Depot)</option>
                    <option value="branch_admin">Branch Admin (Oversees Regional Branch & CSCs)</option>
                    <option value="super_admin">Corporate Super Admin (Global LECO Access)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Primary Facility / CSC Assignment
                  </label>
                  <select
                    value={facilityId}
                    onChange={(e) => setFacilityId(e.target.value)}
                    disabled={role === 'super_admin'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                  >
                    {parentBranches.map(branch => {
                      const children = facilities.filter(f => f.parentId === branch.id);
                      return (
                        <optgroup key={branch.id} label={`📍 ${branch.name}`} className="font-bold">
                          <option value={branch.id}>
                            {branch.name} (Parent Branch)
                          </option>
                          {children.map(child => (
                            <option key={child.id} value={child.id}>
                              &nbsp;&nbsp;&bull; {child.name} (CSC)
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                    <optgroup label="🏭 Special Depots & Centers">
                      {facilities.filter(f => !f.parentId && f.type !== 'Branch').map(fac => (
                        <option key={fac.id} value={fac.id}>
                          {fac.name} ({fac.type})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Multi-Facility Assignment for Branch Admin */}
              {role === 'branch_admin' && (
                <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
                  <div className="font-bold text-blue-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    Multi-Facility Scope Selection (Assigned Branches & CSCs)
                  </div>
                  <p className="text-[11px] text-blue-800">
                    Select all facilities and CSCs this Branch Admin has supervisory authority to view and audit:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pt-1">
                    {facilities.map(fac => (
                      <label key={fac.id} className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-200 hover:bg-blue-50 text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={assignedFacilityIds.includes(fac.id)}
                          onChange={() => toggleAssignedFacility(fac.id)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="truncate">{fac.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Job Role / Designation
                  </label>
                  <input
                    type="text"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    placeholder="e.g. Area Operations Engineer"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Regional Distribution Maintenance"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Granular Delete Rights ON/OFF Toggle */}
              <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-amber-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-600" />
                    Granular Record Deletion Capability
                  </div>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Enable or disable this officer's permission to permanently delete Scope 1, 2, or 3 activity records.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={role === 'super_admin' || userCanDelete}
                    disabled={role === 'super_admin'}
                    onChange={(e) => setUserCanDelete(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Allowed Modules Checklist */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Authorized Functional Modules
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {ALL_MODULES.map(m => (
                    <label key={m.id} className="flex items-start gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={role === 'super_admin' || allowedModules.includes(m.id)}
                        disabled={role === 'super_admin'}
                        onChange={() => toggleModule(m.id)}
                        className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <div className="font-bold text-slate-800">{m.label}</div>
                        <div className="text-[10px] text-slate-400">{m.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Account Status Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="isActiveCheck" className="font-semibold text-slate-700 cursor-pointer">
                  Account is Active (Officer can log in and submit data)
                </label>
              </div>

            </form>

            {/* Modal Footer (Permanently Visible) */}
            <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-700 font-semibold rounded-xl border border-slate-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="user-form"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow transition cursor-pointer"
              >
                {editingUser ? 'Save User Profile' : 'Provision Account'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
