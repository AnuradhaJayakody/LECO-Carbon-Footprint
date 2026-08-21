import React, { useState } from 'react';
import { 
  Users, UserPlus, Shield, ShieldCheck, ShieldAlert, Edit2, Trash2, 
  Lock, CheckCircle2, XCircle, Building2, Briefcase, Mail, Phone,
  Search, Filter, Check, Eye, EyeOff, Sparkles, AlertCircle, Key
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { User, UserRole, Facility } from '../types';

export const UserManager: React.FC = () => {
  const { 
    user: currentUser, 
    users, 
    facilities, 
    isSuperAdmin, 
    isBranchAdmin, 
    createUser, 
    updateUser, 
    deleteUser, 
    toggleUserDelete,
    switchUser,
    notify 
  } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [facilityFilter, setFacilityFilter] = useState('ALL');

  // Form State
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('facility_user');
  const [facilityId, setFacilityId] = useState<string>('');
  const [assignedFacilityIds, setAssignedFacilityIds] = useState<string[]>([]);
  const [jobRole, setJobRole] = useState('');
  const [department, setDepartment] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [canDelete, setCanDelete] = useState<boolean>(false);
  const [allowedModules, setAllowedModules] = useState<string[]>([
    'dashboard', 'scope1', 'scope2', 'scope3', 'reports', 'calculator'
  ]);

  // All available system modules for granular assignment
  const AVAILABLE_MODULES = [
    { key: 'dashboard', label: 'Overview Dashboard' },
    { key: 'scope1', label: 'Scope 1 Emissions' },
    { key: 'scope2', label: 'Scope 2 Clean & Grid' },
    { key: 'scope3', label: 'Scope 3 Supply Chain' },
    { key: 'reports', label: 'GHG Verification Reports' },
    { key: 'facilities', label: 'Facilities Directory' },
    { key: 'users', label: 'User Management (RBAC)' },
    { key: 'emission-factors', label: 'Emission Factors Config' },
    { key: 'calculator', label: 'Live Instant Calculator' },
  ];

  // List of facilities the current actor is permitted to assign/manage
  const manageableFacilities = isSuperAdmin
    ? facilities
    : facilities.filter(f => currentUser?.assignedFacilityIds?.includes(f.id));

  // Determine dynamic job roles available for selected facility in form
  const selectedFacilityObj = facilities.find(f => f.id === facilityId);
  const availableJobRoles = selectedFacilityObj?.jobRoles || [];

  const handleOpenAdd = () => {
    setEditingUser(null);
    setEmail('');
    setName('');
    setRole('facility_user');
    const firstFacId = manageableFacilities[0]?.id || facilities[0]?.id || 'fac-1';
    setFacilityId(firstFacId);
    setAssignedFacilityIds([firstFacId]);
    const firstFacObj = facilities.find(f => f.id === firstFacId);
    setJobRole(firstFacObj?.jobRoles?.[0]?.roleName || 'Operations Officer');
    setDepartment('Operations');
    setContactNumber('+94 ');
    setCanDelete(false);
    setAllowedModules(['dashboard', 'scope1', 'scope2', 'scope3', 'reports', 'calculator']);
    setShowModal(true);
  };

  const handleOpenEdit = (targetUser: User) => {
    if (targetUser.isImmutableRootAdmin || targetUser.email.toLowerCase() === 'superadmincf@leco.com') {
      notify('Root Super Admin (superadmincf@leco.com) is immutable and protected by security policy.', 'info');
      return;
    }
    setEditingUser(targetUser);
    setEmail(targetUser.email);
    setName(targetUser.name);
    setRole(targetUser.role);
    setFacilityId(targetUser.facilityId || manageableFacilities[0]?.id || '');
    setAssignedFacilityIds(targetUser.assignedFacilityIds || (targetUser.facilityId ? [targetUser.facilityId] : []));
    setJobRole(targetUser.jobRole || '');
    setDepartment(targetUser.department || '');
    setContactNumber(targetUser.contactNumber || '');
    setCanDelete(Boolean(targetUser.canDelete));
    setAllowedModules(targetUser.allowedModules || ['dashboard', 'scope1', 'scope2', 'scope3', 'reports', 'calculator']);
    setShowModal(true);
  };

  const handleFacilityChange = (newFacId: string) => {
    setFacilityId(newFacId);
    const facObj = facilities.find(f => f.id === newFacId);
    if (facObj?.jobRoles && facObj.jobRoles.length > 0) {
      setJobRole(facObj.jobRoles[0].roleName);
    } else {
      setJobRole('');
    }
  };

  const handleToggleModule = (modKey: string) => {
    if (allowedModules.includes(modKey)) {
      setAllowedModules(allowedModules.filter(m => m !== modKey));
    } else {
      setAllowedModules([...allowedModules, modKey]);
    }
  };

  const handleToggleAssignedFacility = (facId: string) => {
    if (assignedFacilityIds.includes(facId)) {
      if (assignedFacilityIds.length === 1) {
        notify('Branch Admin must have at least one assigned facility', 'error');
        return;
      }
      setAssignedFacilityIds(assignedFacilityIds.filter(id => id !== facId));
    } else {
      setAssignedFacilityIds([...assignedFacilityIds, facId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) {
      notify('Email and full name are required', 'error');
      return;
    }

    try {
      const selectedFac = facilities.find(f => f.id === facilityId);

      const payload: Partial<User> = {
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role,
        facilityId: role === 'facility_user' ? facilityId : undefined,
        facilityName: role === 'facility_user' ? selectedFac?.name : undefined,
        assignedFacilityIds: role === 'branch_admin' ? assignedFacilityIds : undefined,
        jobRole: role === 'facility_user' ? jobRole : undefined,
        department: department.trim() || undefined,
        contactNumber: contactNumber.trim() || undefined,
        canDelete: role === 'super_admin' ? true : Boolean(canDelete),
        allowedModules: role === 'super_admin' 
          ? AVAILABLE_MODULES.map(m => m.key) 
          : allowedModules
      };

      if (editingUser) {
        await updateUser(editingUser.id, payload);
      } else {
        await createUser(payload);
      }
      setShowModal(false);
    } catch (err) {
      // Notification handled in context
    }
  };

  const handleDeleteUser = async (targetUser: User) => {
    if (targetUser.isImmutableRootAdmin || targetUser.email.toLowerCase() === 'superadmincf@leco.com') {
      notify('Security Exception: Root Super Admin profile is immutable and cannot be deleted.', 'error');
      return;
    }

    if (window.confirm(`Are you sure you want to permanently remove user account "${targetUser.name}" (${targetUser.email})?`)) {
      await deleteUser(targetUser.id);
    }
  };

  const handleToggleDelete = async (targetUser: User) => {
    if (targetUser.isImmutableRootAdmin || targetUser.email.toLowerCase() === 'superadmincf@leco.com') {
      notify('Super Admin has permanent full delete privileges.', 'info');
      return;
    }
    await toggleUserDelete(targetUser.id, !targetUser.canDelete);
  };

  // Filtered users list
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.jobRole?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.facilityName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

    const matchesFacility = 
      facilityFilter === 'ALL' || 
      u.facilityId === facilityFilter || 
      (u.assignedFacilityIds && u.assignedFacilityIds.includes(facilityFilter));

    return matchesSearch && matchesRole && matchesFacility;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <span>LECO Access Control & User Management</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-md uppercase">
                  RBAC Level 2
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Provision branch users, define module access boundaries, and manage granular delete capabilities
              </p>
            </div>
          </div>
        </div>

        {(isSuperAdmin || isBranchAdmin) && (
          <button
            onClick={handleOpenAdd}
            id="btn-add-user"
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New User</span>
          </button>
        )}
      </div>

      {/* Role Impersonation / Fast Testing Bar */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white flex items-center space-x-2">
                <span>Live Session Preview & Role Switcher</span>
                <span className="text-[10px] text-slate-400">(Simulate granular permissions instantly)</span>
              </div>
              <div className="text-[11px] text-slate-300">
                Active User: <span className="font-bold text-emerald-400">{currentUser?.name}</span> ({currentUser?.role})
                {currentUser?.canDelete ? (
                  <span className="ml-2 px-1.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded text-[10px] font-mono">Delete: ON</span>
                ) : (
                  <span className="ml-2 px-1.5 py-0.5 bg-rose-950 text-rose-300 border border-rose-800 rounded text-[10px] font-mono">Delete: OFF</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 mr-1">Switch session to:</span>
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => switchUser(u)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center space-x-1 ${
                  currentUser?.id === u.id
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                <span>{u.name.split(' ')[0]}</span>
                <span className="text-[10px] opacity-75">
                  ({u.role === 'super_admin' ? 'SuperAdmin' : u.role === 'branch_admin' ? 'BranchAdmin' : u.canDelete ? 'User:Del✓' : 'User:Del✗'})
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Active Accounts</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{users.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">LECO personnel</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Super Admins</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {users.filter(u => u.role === 'super_admin').length}
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5 font-medium flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3" />
            <span>Root account protected</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Branch Admins</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">
            {users.filter(u => u.role === 'branch_admin').length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Multi-facility scope</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Facility Users</div>
          <div className="text-2xl font-bold text-slate-700 mt-1">
            {users.filter(u => u.role === 'facility_user' || u.role === 'facility_officer').length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Branch specific entry</div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, role, job title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="branch_admin">Branch Admin</option>
              <option value="facility_user">Facility User</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-500 font-medium">Facility:</span>
            <select
              value={facilityFilter}
              onChange={(e) => setFacilityFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none max-w-[160px] truncate"
            >
              <option value="ALL">All Facilities</option>
              {facilities.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">User Details</th>
                <th className="py-3 px-4">Role & Scope</th>
                <th className="py-3 px-4">Facility / Assigned Branches</th>
                <th className="py-3 px-4">Job Role & Title</th>
                <th className="py-3 px-4 text-center">Delete Privilege</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const isRootAdmin = u.isImmutableRootAdmin || u.email.toLowerCase() === 'superadmincf@leco.com';

                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition">
                    {/* User Details */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          isRootAdmin 
                            ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                            : u.role === 'branch_admin' 
                            ? 'bg-indigo-100 text-indigo-800' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                            <span>{u.name}</span>
                            {isRootAdmin && (
                              <span 
                                title="Root Super Admin: Immutable & Permanently Protected"
                                className="px-1.5 py-0.2 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[9px] font-bold tracking-tight inline-flex items-center space-x-0.5"
                              >
                                <Lock className="w-2.5 h-2.5" />
                                <span>IMMUTABLE ROOT</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center space-x-1 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{u.email}</span>
                          </div>
                          {u.department && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Dept: {u.department}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Role & Scope */}
                    <td className="py-3.5 px-4">
                      <div>
                        {u.role === 'super_admin' ? (
                          <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-[11px] inline-flex items-center space-x-1">
                            <Shield className="w-3 h-3" />
                            <span>Super Admin</span>
                          </span>
                        ) : u.role === 'branch_admin' ? (
                          <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold text-[11px] inline-flex items-center space-x-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Branch Admin</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-[11px] inline-flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>Facility User</span>
                          </span>
                        )}

                        <div className="text-[10px] text-slate-400 mt-1">
                          {u.role === 'super_admin' ? 'All 8 facilities' : u.role === 'branch_admin' ? `${u.assignedFacilityIds?.length || 0} branches` : '1 branch locked'}
                        </div>
                      </div>
                    </td>

                    {/* Facility / Assigned branches */}
                    <td className="py-3.5 px-4">
                      {u.role === 'super_admin' ? (
                        <div className="font-semibold text-blue-700 flex items-center space-x-1">
                          <Building2 className="w-3.5 h-3.5 text-blue-500" />
                          <span>All LECO Network (Global)</span>
                        </div>
                      ) : u.role === 'branch_admin' ? (
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-800 text-[11px]">
                            {u.assignedFacilityIds?.length} Branches Assigned:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {u.assignedFacilityIds?.map(fid => {
                              const fac = facilities.find(f => f.id === fid);
                              return (
                                <span key={fid} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px]">
                                  {fac?.name || fid}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="font-semibold text-slate-800 flex items-center space-x-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{u.facilityName || facilities.find(f => f.id === u.facilityId)?.name || 'Not assigned'}</span>
                        </div>
                      )}
                    </td>

                    {/* Job Role & Title */}
                    <td className="py-3.5 px-4">
                      {u.jobRole ? (
                        <div className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md font-medium text-[11px]">
                          <Briefcase className="w-3 h-3 text-emerald-600" />
                          <span>{u.jobRole}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Default Role</span>
                      )}
                    </td>

                    {/* Delete Privilege Toggle */}
                    <td className="py-3.5 px-4 text-center">
                      {isRootAdmin ? (
                        <span 
                          title="Super Admin has immutable delete capability"
                          className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full font-bold text-[10px] inline-flex items-center space-x-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Permanent</span>
                        </span>
                      ) : isSuperAdmin ? (
                        <button
                          onClick={() => handleToggleDelete(u)}
                          className={`px-3 py-1 rounded-full font-bold text-[10px] transition inline-flex items-center space-x-1 cursor-pointer ${
                            u.canDelete
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {u.canDelete ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Enabled</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-rose-500" />
                              <span>Disabled</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                          u.canDelete ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {u.canDelete ? 'Enabled' : 'Disabled'}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {isRootAdmin ? (
                          <span 
                            title="Root Super Admin profile cannot be edited or deleted" 
                            className="text-[10px] text-slate-400 font-mono px-2 py-1 bg-slate-100 rounded-md border border-slate-200 flex items-center space-x-1"
                          >
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>Protected</span>
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenEdit(u)}
                              title="Edit User"
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u)}
                              title="Delete User"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
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

      {/* Modal: Create / Edit User */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">
                  {editingUser ? `Edit Account: ${editingUser.name}` : 'Provision New LECO Account'}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
              {/* Account Credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Eng. Priyantha Dissanayake"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Official LECO Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={!!editingUser}
                    placeholder="e.g. priyantha.d@leco.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Account Role Category *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('facility_user')}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      role === 'facility_user'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-900'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold text-xs">Facility User</div>
                    <div className="text-[10px] text-slate-500 mt-1">Single branch bound</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('branch_admin')}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      role === 'branch_admin'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold text-xs">Branch Admin</div>
                    <div className="text-[10px] text-slate-500 mt-1">Multi-branch scope</div>
                  </button>

                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => setRole('super_admin')}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        role === 'super_admin'
                          ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-bold text-xs">Super Admin</div>
                      <div className="text-[10px] text-slate-500 mt-1">Full system access</div>
                    </button>
                  )}
                </div>
              </div>

              {/* Facility-Level Scope Assignment */}
              {role === 'facility_user' && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                    <Building2 className="w-4 h-4 text-slate-600" />
                    <span>Facility & Job Role Binding</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Assigned Facility / Branch *</label>
                      <select
                        value={facilityId}
                        onChange={(e) => handleFacilityChange(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        {manageableFacilities.map(f => (
                          <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        Assigned Job Role (from Facility) *
                      </label>
                      {availableJobRoles.length > 0 ? (
                        <select
                          value={jobRole}
                          onChange={(e) => setJobRole(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                          {availableJobRoles.map(jr => (
                            <option key={jr.id} value={jr.roleName}>{jr.roleName}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={jobRole}
                          onChange={(e) => setJobRole(e.target.value)}
                          placeholder="e.g. Operations Assistant"
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      )}
                      <div className="text-[10px] text-slate-400 mt-1">
                        {availableJobRoles.length > 0 ? `${availableJobRoles.length} roles configured for this branch` : 'No pre-set roles. Type custom role title.'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Branch Admin Scope (Multi-Branch Selection) */}
              {role === 'branch_admin' && (
                <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2.5">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      <span>Select Managed Facilities / Branches</span>
                    </span>
                    <span className="text-[10px] text-indigo-700 font-medium">
                      {assignedFacilityIds.length} selected
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 bg-white rounded-lg border border-indigo-100">
                    {facilities.map(f => {
                      const isSelected = assignedFacilityIds.includes(f.id);
                      return (
                        <label
                          key={f.id}
                          className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer transition ${
                            isSelected ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleAssignedFacility(f.id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="font-medium text-slate-800 truncate text-[11px]">{f.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Delete Capability Toggle */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                    <Trash2 className="w-4 h-4 text-slate-600" />
                    <span>Delete Capability (Granular Permission)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Controls whether this user can remove emission records in Scope 1, 2 & 3
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canDelete}
                    onChange={(e) => setCanDelete(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Allowed Modules Checklist */}
              {role !== 'super_admin' && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <label className="block text-slate-700 font-bold">Permitted System Modules</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {AVAILABLE_MODULES.map(mod => {
                      const isChecked = allowedModules.includes(mod.key);
                      return (
                        <label
                          key={mod.key}
                          className={`flex items-center space-x-2 p-2 rounded-lg border text-[11px] cursor-pointer transition ${
                            isChecked ? 'bg-white border-blue-400 font-medium text-slate-900 shadow-xs' : 'bg-slate-100/60 border-slate-200 text-slate-500'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleModule(mod.key)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="truncate">{mod.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Department & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Operations / Billing"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="+94 11 286 5500"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-sm transition"
                >
                  {editingUser ? 'Save User Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
