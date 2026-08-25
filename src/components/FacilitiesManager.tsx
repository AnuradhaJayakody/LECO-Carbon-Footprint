import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Facility, FacilityType, JobRole } from '../types';
import { api } from '../services/api';
import { 
  supabase, 
  toFacilityRow, 
  fromFacilityRow, 
  isSupabaseConfigured,
  safeSupabaseFacilityMutation,
  generateUUID,
  isValidUUID
} from '../services/supabase';
import { 
  Building2, 
  Plus, 
  Edit3, 
  Trash2, 
  Sun, 
  CheckCircle, 
  Layers, 
  Search, 
  X, 
  MapPin, 
  UserCheck, 
  Mail, 
  Phone, 
  FileText,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  ShieldAlert,
  RefreshCw,
  Database,
  Loader2,
  LayoutGrid,
  GitFork,
  CornerDownRight,
  Network,
  Zap,
  Info
} from 'lucide-react';

export const FacilitiesManager: React.FC = () => {
  const { 
    facilities: globalFacilities, 
    refreshFacilities, 
    isSuperAdmin, 
    isBranchAdmin,
    canDelete, 
    notify,
    getScopedFacilities,
    user: currentUser
  } = useAuth();

  const [facilitiesList, setFacilitiesList] = useState<Facility[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'hierarchy' | 'grid'>('hierarchy');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<FacilityType>('CSC');
  const [parentId, setParentId] = useState<string>('');
  const [isParent, setIsParent] = useState(false);
  const [location, setLocation] = useState('');
  const [responsibleOfficer, setResponsibleOfficer] = useState('');
  const [headDesignation, setHeadDesignation] = useState('');
  const [officerEmail, setOfficerEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [electricityAccountNo, setElectricityAccountNo] = useState('');
  const [hasSolarPV, setHasSolarPV] = useState(false);
  const [solarCapacityKW, setSolarCapacityKW] = useState<number>(0);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  // ==========================================================================
  // READ: Fetch facilities directly from Supabase on mount
  // ==========================================================================
  const fetchFacilities = async () => {
    setLoading(true);
    try {
      if (supabase) {
        let { data, error } = await supabase
          .from('facilities')
          .select('*')
          .order('name', { ascending: true });

        if (error) {
          // If order by name failed, retry without order
          const fallback = await supabase.from('facilities').select('*');
          data = fallback.data;
          error = fallback.error;
        }

        if (error) {
          console.warn('Supabase fetch facilities notice:', error.message || error);
          const fallbackData = await api.getFacilities();
          setFacilitiesList(fallbackData);
          return;
        }

        if (data && data.length > 0) {
          const mapped = data.map(fromFacilityRow);
          setFacilitiesList(mapped);
          return;
        } else {
          // If Supabase facilities table is completely empty, seed initial default facilities
          const initialApiFacilities = await api.getFacilities();
          if (initialApiFacilities && initialApiFacilities.length > 0) {
            for (const fac of initialApiFacilities) {
              try {
                const r = toFacilityRow(fac);
                await safeSupabaseFacilityMutation('insert', { ...r, parent_facility_id: null, parent_id: null });
              } catch (seedErr) {
                console.warn('Initial facility seed notice:', seedErr);
              }
            }
            // Re-fetch after seeding
            const refreshed = await supabase.from('facilities').select('*');
            if (refreshed.data && refreshed.data.length > 0) {
              setFacilitiesList(refreshed.data.map(fromFacilityRow));
              return;
            }
          }
          setFacilitiesList([]);
          return;
        }
      }

      // Fallback when Supabase client is not configured
      const data = await api.getFacilities();
      setFacilitiesList(data);
    } catch (err: any) {
      console.error('Failed to fetch facilities:', err);
      const fallback = await api.getFacilities();
      setFacilitiesList(fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  // Parent Branches derived from current facilities list
  const parentBranches = facilitiesList.filter(f => f.type === 'Branch' || f.isParent);

  // Scoped list according to user RBAC
  const userScopedFacilities = isSuperAdmin
    ? facilitiesList
    : isBranchAdmin && currentUser?.assignedFacilityIds?.length
      ? facilitiesList.filter(f => currentUser.assignedFacilityIds?.includes(f.id) || f.id === currentUser.facilityId)
      : currentUser?.facilityId
        ? facilitiesList.filter(f => f.id === currentUser.facilityId)
        : facilitiesList;

  const openAddModal = (defaultParentId?: string) => {
    setEditingFacility(null);
    setCode(`LECO-FAC-${Date.now().toString(36).toUpperCase()}`);
    setName('');
    setType(defaultParentId ? 'CSC' : 'CSC');
    setParentId(defaultParentId || '');
    setIsParent(false);
    setLocation('');
    setResponsibleOfficer('');
    setHeadDesignation('Customer Service Lead');
    setOfficerEmail('');
    setContactNumber('+94 ');
    setElectricityAccountNo('');
    setHasSolarPV(false);
    setSolarCapacityKW(0);
    setJobRoles([
      { id: `jr-1`, facilityId: '', roleName: 'Customer Service Lead', description: 'Customer queries and billing' },
      { id: `jr-2`, facilityId: '', roleName: 'Breakdown Technician', description: 'Emergency fault repairs' }
    ]);
    setIsModalOpen(true);
  };

  const openEditModal = (fac: Facility) => {
    setEditingFacility(fac);
    setCode(fac.code);
    setName(fac.name);
    setType(fac.type);
    setParentId(fac.parentId || '');
    setIsParent(fac.isParent || false);
    setLocation(fac.location);
    setResponsibleOfficer(fac.responsibleOfficer);
    setHeadDesignation(fac.headDesignation || '');
    setOfficerEmail(fac.officerEmail);
    setContactNumber(fac.contactNumber || '');
    setElectricityAccountNo(fac.electricityAccountNo || '');
    setHasSolarPV(fac.hasSolarPV || false);
    setSolarCapacityKW(fac.solarCapacityKW || 0);
    setJobRoles(fac.jobRoles || []);
    setIsModalOpen(true);
  };

  const handleAddJobRole = () => {
    if (!newRoleName.trim()) return;
    const newRole: JobRole = {
      id: `jr-${Date.now().toString(36)}`,
      facilityId: editingFacility ? editingFacility.id : '',
      roleName: newRoleName.trim(),
      description: newRoleDesc.trim() || undefined
    };
    setJobRoles([...jobRoles, newRole]);
    setNewRoleName('');
    setNewRoleDesc('');
  };

  const handleRemoveJobRole = (id: string) => {
    setJobRoles(jobRoles.filter(r => r.id !== id));
  };

  // ==========================================================================
  // CREATE / UPDATE: Direct Supabase Mutation & Verified State Synchronisation
  // ==========================================================================
  const handleSaveFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim() || !responsibleOfficer.trim() || !officerEmail.trim()) {
      notify('Please complete all mandatory facility fields', 'error');
      return;
    }

    if (type === 'CSC' && (!parentId || parentId === 'null' || parentId === 'none' || parentId.trim() === '')) {
      notify('Please select a Subordinate Parent Branch for this CSC', 'error');
      return;
    }

    setIsSubmitting(true);

    const cleanParentId = (type === 'CSC' && parentId && parentId !== 'null' && parentId !== 'none' && parentId.trim() !== '')
      ? parentId.trim() 
      : null;

    const payload: Partial<Facility> = {
      code: code.trim(),
      name: name.trim(),
      type,
      parentId: cleanParentId,
      parentName: cleanParentId ? parentBranches.find(b => b.id === cleanParentId)?.name : undefined,
      isParent: type === 'Branch' ? true : isParent,
      location: location.trim(),
      responsibleOfficer: responsibleOfficer.trim(),
      headDesignation: headDesignation.trim() || undefined,
      officerEmail: officerEmail.trim().toLowerCase(),
      contactNumber: contactNumber.trim() || undefined,
      electricityAccountNo: electricityAccountNo.trim() || undefined,
      hasSolarPV,
      solarCapacityKW: hasSolarPV ? Number(solarCapacityKW) : 0,
      jobRoles
    };

    try {
      if (editingFacility) {
        // ------------------ UPDATE EXISTING FACILITY ------------------
        const row = toFacilityRow({ ...payload, id: editingFacility.id });
        delete row.id; // DB ID is passed in query where clause

        if (supabase) {
          const result = await safeSupabaseFacilityMutation('update', row, editingFacility.id);
          if (!result.success) {
            const msg = result.error?.message || 'Failed to update facility in Supabase database';
            notify(msg, 'error');
            setIsSubmitting(false);
            return;
          }
        }

        // Secondary sync to local server API for consistency
        try {
          await fetch(`/api/facilities/${editingFacility.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, id: editingFacility.id })
          });
        } catch (apiErr) {
          console.warn('Local API update notice:', apiErr);
        }

        // Update local UI state ONLY after successful DB operation
        await fetchFacilities();
        await refreshFacilities();
        notify(`Facility "${payload.name}" updated successfully!`, 'success');
      } else {
        // ------------------ CREATE NEW FACILITY ------------------
        // Strictly omit temporary frontend id so PostgreSQL assigns a valid UUID (DEFAULT gen_random_uuid())
        const row = toFacilityRow(payload);
        delete row.id;

        let createdFacility: Facility | undefined;

        if (supabase) {
          const result = await safeSupabaseFacilityMutation('insert', row);
          if (!result.success) {
            const msg = result.error?.message || 'Failed to create facility in Supabase database';
            notify(msg, 'error');
            setIsSubmitting(false);
            return; // Do NOT update state or close modal on error
          }
          if (result.data) {
            createdFacility = result.data;
          }
        }

        if (!createdFacility) {
          createdFacility = {
            ...payload,
            id: generateUUID()
          } as Facility;
        }

        // Secondary sync to local server without duplicate Supabase mutation
        try {
          await fetch('/api/facilities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(createdFacility)
          });
        } catch (apiErr) {
          console.warn('Local API insert notice:', apiErr);
        }

        // Update local UI state ONLY after successful DB operation
        await fetchFacilities();
        await refreshFacilities();
        notify(`New Facility "${payload.name}" created successfully!`, 'success');
      }

      setIsModalOpen(false);
    } catch (err: any) {
      notify(err.message || 'Failed to save facility', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================================================
  // DELETE: Direct Supabase Deletion & State Synchronisation
  // ==========================================================================
  const handleDeleteFacility = async (id: string) => {
    if (!canDelete) {
      notify('You do not have permission to delete facility records.', 'error');
      return;
    }

    try {
      if (supabase) {
        const result = await safeSupabaseFacilityMutation('delete', {}, id);
        if (!result.success) {
          const msg = result.error?.message || 'Could not delete facility from Supabase database';
          notify(msg, 'error');
          return;
        }
      }

      // Secondary sync to local server API
      try {
        await fetch(`/api/facilities/${id}`, {
          method: 'DELETE'
        });
      } catch (apiErr) {
        console.warn('Local API delete notice:', apiErr);
      }

      // Update local UI state ONLY after successful DB operation
      await fetchFacilities();
      await refreshFacilities();
      setDeleteConfirmId(null);
      notify('Facility record removed successfully from database', 'success');
    } catch (err: any) {
      notify(err.message || 'Could not delete facility', 'error');
    }
  };

  // Filtered List
  const filteredFacilities = userScopedFacilities.filter(f => {
    const matchesSearch = 
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.responsibleOfficer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedTypeFilter === 'ALL' || f.type === selectedTypeFilter;
    return matchesSearch && matchesType;
  });

  // Hierarchical groupings
  const branchFacilities = filteredFacilities.filter(f => f.type === 'Branch' || f.isParent);
  const unassignedCSCs = filteredFacilities.filter(f => f.type === 'CSC' && (!f.parentId || !parentBranches.some(b => b.id === f.parentId)));
  const standaloneFacilities = filteredFacilities.filter(f => f.type !== 'CSC' && f.type !== 'Branch' && !f.isParent);

  // Summary Metrics
  const totalFacilitiesCount = facilitiesList.length;
  const totalBranchesCount = facilitiesList.filter(f => f.type === 'Branch' || f.isParent).length;
  const totalCSCsCount = facilitiesList.filter(f => f.type === 'CSC').length;
  const totalSolarCapacity = facilitiesList.reduce((sum, f) => sum + (f.hasSolarPV ? (Number(f.solarCapacityKW) || 0) : 0), 0);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            <span>Operational Boundary & Organizational Hierarchy</span>
            {isSupabaseConfigured && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Database className="w-3 h-3" />
                Live Supabase Connected
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            LECO Facilities & Customer Service Centres (CSC)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage parent Branches, subordinate CSCs, meter testing plants, and logistics stores according to ISO 14064 operational boundaries.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchFacilities}
            disabled={loading}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer disabled:opacity-50"
            title="Refresh database records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => openAddModal()}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Facility / CSC</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">{totalFacilitiesCount}</div>
            <div className="text-[11px] font-semibold text-slate-500">Total Facilities</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-blue-900">{totalBranchesCount}</div>
            <div className="text-[11px] font-semibold text-blue-700">Regional Branches (Hubs)</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-amber-900">{totalCSCsCount}</div>
            <div className="text-[11px] font-semibold text-amber-700">Customer Service Centres</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-emerald-900">{totalSolarCapacity.toFixed(1)} <span className="text-xs font-bold text-slate-500">kWp</span></div>
            <div className="text-[11px] font-semibold text-emerald-700">Rooftop Solar PV Assets</div>
          </div>
        </div>
      </div>

      {/* Filter, Search & View Toggle Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, code, officer..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0 w-full sm:w-auto">
            <button
              onClick={() => setViewMode('hierarchy')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                viewMode === 'hierarchy'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Hierarchical Tree</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid View</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
          {['ALL', 'Branch', 'CSC', 'Head Office', 'Store', 'Training Centre', 'Special Centre', 'Meter Factory'].map(t => (
            <button
              key={t}
              onClick={() => setSelectedTypeFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedTypeFilter === t
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t === 'ALL' ? 'All Types' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">Loading Facilities Data</h3>
          <p className="text-xs text-slate-400 mt-1">Connecting to Supabase database...</p>
        </div>
      ) : filteredFacilities.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No Facilities Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm || selectedTypeFilter !== 'ALL' 
              ? 'No facilities match the specified filter and search criteria.'
              : 'No facilities registered in the database yet.'}
          </p>
        </div>
      ) : viewMode === 'hierarchy' && selectedTypeFilter === 'ALL' && !searchTerm ? (
        /* ========================================================================= */
        /* HIERARCHICAL BRANCH & CSC TREE VIEW                                       */
        /* ========================================================================= */
        <div className="space-y-6">
          
          {/* Section: Regional Branches & Linked CSCs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Regional Branches & Subordinate Customer Service Centres</span>
                <span className="text-xs font-semibold text-slate-400 lowercase">({branchFacilities.length} branches)</span>
              </h2>
            </div>

            <div className="space-y-4">
              {branchFacilities.map(branch => {
                const childCSCs = facilitiesList.filter(f => f.type === 'CSC' && (f.parentId === branch.id || (!f.parentId && f.parentName === branch.name)));

                return (
                  <div 
                    key={branch.id} 
                    className="bg-white border border-blue-200 rounded-2xl p-5 shadow-sm space-y-4 ring-1 ring-blue-50/50"
                  >
                    {/* Branch Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono font-bold text-blue-800 uppercase bg-blue-100 px-2 py-0.5 rounded">
                            {branch.code}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-700 text-white flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            Parent Regional Branch
                          </span>
                          {branch.hasSolarPV && (
                            <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                              <Sun className="w-3 h-3" />
                              {branch.solarCapacityKW} kW Solar
                            </span>
                          )}
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                            {childCSCs.length} Subordinate CSC{childCSCs.length === 1 ? '' : 's'} Linked
                          </span>
                        </div>

                        <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                          {branch.name}
                        </h3>

                        <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap pt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {branch.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                            <strong className="text-slate-800">{branch.responsibleOfficer}</strong>
                            {branch.headDesignation && <span className="text-slate-400">({branch.headDesignation})</span>}
                          </span>
                          <span className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {branch.officerEmail}
                          </span>
                        </div>
                      </div>

                      {/* Branch Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isSuperAdmin && (
                          <button
                            onClick={() => openAddModal(branch.id)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                            title={`Add subordinate CSC under ${branch.name}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add CSC</span>
                          </button>
                        )}
                        {isSuperAdmin && (
                          <button
                            onClick={() => openEditModal(branch)}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
                            title="Edit Branch"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && isSuperAdmin && (
                          <button
                            onClick={() => setDeleteConfirmId(branch.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                            title="Delete Branch"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Subordinate CSCs List */}
                    <div className="space-y-2 pt-1 pl-2 sm:pl-4">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-2">
                        <CornerDownRight className="w-3.5 h-3.5 text-blue-500" />
                        <span>Subordinate Customer Service Centres (Linked via parent_facility_id)</span>
                      </div>

                      {childCSCs.length === 0 ? (
                        <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
                          <p className="text-xs text-slate-500">
                            No Customer Service Centres are currently assigned to {branch.name}.
                          </p>
                          {isSuperAdmin && (
                            <button
                              onClick={() => openAddModal(branch.id)}
                              className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Register first CSC for this branch</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {childCSCs.map(csc => (
                            <div 
                              key={csc.id}
                              className="bg-slate-50/70 border border-slate-200 hover:border-amber-300 rounded-xl p-3.5 transition flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-1.5">
                                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                                    {csc.code}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {csc.hasSolarPV && (
                                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                        <Sun className="w-2.5 h-2.5" />
                                        {csc.solarCapacityKW}kW
                                      </span>
                                    )}
                                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
                                      CSC
                                    </span>
                                  </div>
                                </div>

                                <h4 className="text-sm font-bold text-slate-900">
                                  {csc.name}
                                </h4>

                                <div className="mt-2 space-y-1 text-[11px] text-slate-600">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="truncate">{csc.location}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 truncate">
                                    <UserCheck className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="truncate font-medium text-slate-700">{csc.responsibleOfficer}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 truncate text-slate-500 font-mono text-[10px]">
                                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="truncate">{csc.officerEmail}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                                <span className="text-[10px] text-slate-400 font-mono">
                                  Acc: {csc.electricityAccountNo || 'N/A'}
                                </span>

                                <div className="flex items-center gap-1">
                                  {isSuperAdmin && (
                                    <button
                                      onClick={() => openEditModal(csc)}
                                      className="p-1 text-slate-500 hover:text-blue-600 rounded transition cursor-pointer"
                                      title="Edit CSC"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </button>
                                  )}
                                  {canDelete && isSuperAdmin && (
                                    <button
                                      onClick={() => setDeleteConfirmId(csc.id)}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                                      title="Delete CSC"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Unassigned CSCs (if any) */}
          {unassignedCSCs.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Customer Service Centres Requiring Parent Branch Linkage ({unassignedCSCs.length})</span>
                </div>
              </div>
              <p className="text-xs text-amber-800">
                The following CSCs currently have no database parent branch assigned (`parent_facility_id` is null). Edit them to select their parent branch.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {unassignedCSCs.map(csc => (
                  <div key={csc.id} className="bg-white border border-amber-300 rounded-xl p-3.5 flex flex-col justify-between shadow-xs">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {csc.code}
                        </span>
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                          Unassigned CSC
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{csc.name}</h4>
                      <p className="text-xs text-slate-500 mt-1 truncate">{csc.location}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">{csc.responsibleOfficer}</span>
                      {isSuperAdmin && (
                        <button
                          onClick={() => openEditModal(csc)}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <GitFork className="w-3 h-3" />
                          <span>Link Branch</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Specialized Operational Facilities (Head Office, Stores, Training Centres, Meter Factory) */}
          {standaloneFacilities.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-purple-600" />
                  <span>Specialised Facilities, Logistics Depots & Support Units</span>
                  <span className="text-xs font-semibold text-slate-400 lowercase">({standaloneFacilities.length} facilities)</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {standaloneFacilities.map(fac => (
                  <div key={fac.id} className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                          {fac.code}
                        </span>
                        <div className="flex items-center gap-1">
                          {fac.hasSolarPV && (
                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-emerald-200">
                              <Sun className="w-3 h-3" />
                              {fac.solarCapacityKW} kW
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            fac.type === 'Head Office' ? 'bg-purple-100 text-purple-800' :
                            fac.type === 'Store' ? 'bg-indigo-100 text-indigo-800' :
                            fac.type === 'Meter Factory' ? 'bg-teal-100 text-teal-800' :
                            'bg-slate-200 text-slate-800'
                          }`}>
                            {fac.type}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-base font-bold text-slate-900">{fac.name}</h4>
                      
                      <div className="mt-2.5 space-y-1 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{fac.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate font-medium text-slate-800">{fac.responsibleOfficer}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate font-mono text-[11px] text-slate-500">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{fac.officerEmail}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-2.5 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-mono">
                        Acc: {fac.electricityAccountNo || 'N/A'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {isSuperAdmin && (
                          <button
                            onClick={() => openEditModal(fac)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg transition cursor-pointer"
                            title="Edit Facility"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && isSuperAdmin && (
                          <button
                            onClick={() => setDeleteConfirmId(fac.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                            title="Delete Facility"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : (
        /* ========================================================================= */
        /* STANDARD / FILTERED GRID VIEW                                             */
        /* ========================================================================= */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredFacilities.map(fac => {
            const isChildCSC = fac.type === 'CSC' && fac.parentId;
            const parentBranch = parentBranches.find(b => b.id === fac.parentId);
            const childCount = facilitiesList.filter(f => f.parentId === fac.id).length;

            return (
              <div 
                key={fac.id}
                className={`bg-white border rounded-2xl p-5 shadow-sm transition flex flex-col justify-between ${
                  fac.isParent || fac.type === 'Branch' ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Badge Top */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded">
                      {fac.code}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {fac.hasSolarPV && (
                        <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Sun className="w-3 h-3" />
                          {fac.solarCapacityKW} kW Solar
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        fac.type === 'Branch' ? 'bg-blue-100 text-blue-800' :
                        fac.type === 'CSC' ? 'bg-amber-100 text-amber-800' :
                        fac.type === 'Head Office' ? 'bg-purple-100 text-purple-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {fac.type}
                      </span>
                    </div>
                  </div>

                  {/* Facility Name & Parent */}
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    {fac.name}
                  </h3>
                  {isChildCSC && (
                    <div className="text-[11px] text-blue-700 font-semibold flex items-center gap-1 mt-1 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200/60 w-fit">
                      <GitFork className="w-3 h-3 text-blue-500" />
                      <span>Subordinate to: {parentBranch ? `${parentBranch.name} (${parentBranch.code})` : (fac.parentName || 'Parent Branch')}</span>
                    </div>
                  )}
                  {(fac.isParent || fac.type === 'Branch') && (
                    <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                      <Layers className="w-3 h-3" />
                      <span>Parent Branch &bull; {childCount} Assigned CSCs</span>
                    </div>
                  )}

                  {/* Location & Officer Details */}
                  <div className="mt-3 space-y-1.5 text-xs text-slate-600 pt-3 border-t border-slate-100">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="truncate">{fac.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-800 truncate">{fac.responsibleOfficer}</span>
                      {fac.headDesignation && <span className="text-slate-400 truncate">({fac.headDesignation})</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-500 font-mono text-[11px] truncate">{fac.officerEmail}</span>
                    </div>
                  </div>

                  {/* Job Roles Chips */}
                  {fac.jobRoles && fac.jobRoles.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Operational Roles ({fac.jobRoles.length})
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {fac.jobRoles.slice(0, 3).map((r, i) => (
                          <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                            {r.roleName}
                          </span>
                        ))}
                        {fac.jobRoles.length > 3 && (
                          <span className="text-[10px] text-slate-400 font-medium px-1">
                            +{fac.jobRoles.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Acc: {fac.electricityAccountNo || 'N/A'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {isSuperAdmin && (
                      <button
                        onClick={() => openEditModal(fac)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                        title="Edit Facility"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {canDelete && isSuperAdmin && (
                      <button
                        onClick={() => setDeleteConfirmId(fac.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Delete Facility"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Confirm Facility Deletion</h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to remove this facility from the Supabase database? Any associated emission records and subordinate CSC links will be safely detached.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteFacility(deleteConfirmId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow transition cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Facility Modal with Fixed Header/Footer and Scrollable Body */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Modal Header (Permanently Visible) */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    {editingFacility ? `Edit Facility: ${editingFacility.name}` : 'Register New LECO Facility / CSC'}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Define operational bounds, parent branch hierarchy, and renewable generation assets
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
            <form id="facility-form" onSubmit={handleSaveFacility} className="p-6 overflow-y-auto space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Facility Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. LECO-BR-KT, LECO-CSC-PKT"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Facility Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Kotte Branch, Pitakotte CSC"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Facility Type *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => {
                      const newType = e.target.value as FacilityType;
                      setType(newType);
                      if (newType !== 'CSC') {
                        setParentId('');
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Branch">Branch (Regional Hub)</option>
                    <option value="CSC">Customer Service Centre (CSC)</option>
                    <option value="Head Office">Corporate Head Office</option>
                    <option value="Store">Materials & Logistics Depot (Store)</option>
                    <option value="Training Centre">Training Centre</option>
                    <option value="Special Centre">Specialised Engineering Centre (SDMC)</option>
                    <option value="Meter Factory">Meter Assembly & Testing Factory</option>
                    <option value="Other">Other Substation / Asset</option>
                  </select>
                </div>

                {type === 'CSC' ? (
                  <div>
                    <label className="block font-bold text-blue-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Subordinate Parent Branch (parent_facility_id) *</span>
                    </label>
                    <select
                      value={parentId}
                      onChange={(e) => setParentId(e.target.value)}
                      required={type === 'CSC'}
                      className="w-full px-3 py-2 bg-blue-50/60 border border-blue-300 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="" disabled>-- Select Parent Branch --</option>
                      {parentBranches.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-blue-600 mt-1">
                      Stores relational linkage in database column `parent_facility_id`
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Branch Hierarchy Role
                    </label>
                    <div className="px-3 py-2 bg-slate-100 rounded-xl text-slate-600 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isParentCheck"
                        checked={type === 'Branch' || isParent}
                        onChange={(e) => setIsParent(e.target.checked)}
                        disabled={type === 'Branch'}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <label htmlFor="isParentCheck" className="font-semibold text-slate-800 cursor-pointer text-xs">
                        Acts as Regional Parent for CSCs
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Physical Address / Location *
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. 325 Kotte Road, Ethul Kotte"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Responsible Officer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={responsibleOfficer}
                    onChange={(e) => setResponsibleOfficer(e.target.value)}
                    placeholder="e.g. Eng. Dilani Senanayake"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Designation / Role Title
                  </label>
                  <input
                    type="text"
                    value={headDesignation}
                    onChange={(e) => setHeadDesignation(e.target.value)}
                    placeholder="e.g. Area Operations Manager"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Officer Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={officerEmail}
                    onChange={(e) => setOfficerEmail(e.target.value)}
                    placeholder="officer@leco.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="+94 11 286 5520"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Electricity & Solar PV Attributes */}
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3">
                <div className="font-bold text-emerald-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-emerald-600" />
                  Energy & Renewable Solar PV Configuration
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Electricity Account Number
                    </label>
                    <input
                      type="text"
                      value={electricityAccountNo}
                      onChange={(e) => setElectricityAccountNo(e.target.value)}
                      placeholder="e.g. ACC-011-3341"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Rooftop Solar PV Installed?
                    </label>
                    <div className="flex items-center gap-4 mt-2">
                      <label className="flex items-center gap-1.5 font-semibold text-slate-800 cursor-pointer">
                        <input
                          type="radio"
                          name="solarPvRadio"
                          checked={hasSolarPV === true}
                          onChange={() => setHasSolarPV(true)}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        Yes (Grid-tied Solar)
                      </label>
                      <label className="flex items-center gap-1.5 font-semibold text-slate-800 cursor-pointer">
                        <input
                          type="radio"
                          name="solarPvRadio"
                          checked={hasSolarPV === false}
                          onChange={() => { setHasSolarPV(false); setSolarCapacityKW(0); }}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        No Solar
                      </label>
                    </div>
                  </div>
                </div>

                {hasSolarPV && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Solar System Installed Capacity (kWp)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={solarCapacityKW}
                      onChange={(e) => setSolarCapacityKW(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Job Roles Management */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Facility Job Roles Configuration
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder="New role title (e.g. Field Lineman Lead)"
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-800"
                  />
                  <input
                    type="text"
                    value={newRoleDesc}
                    onChange={(e) => setNewRoleDesc(e.target.value)}
                    placeholder="Role responsibilities..."
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={handleAddJobRole}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold cursor-pointer"
                  >
                    Add Role
                  </button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
                  {jobRoles.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{r.roleName}</span>
                        {r.description && <span className="text-slate-500 ml-2 text-[11px]">- {r.description}</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveJobRole(r.id)}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </form>

            {/* Modal Footer (Permanently Visible) */}
            <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-700 font-semibold rounded-xl border border-slate-300 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="facility-form"
                disabled={isSubmitting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{editingFacility ? 'Save Changes' : 'Create Facility'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

