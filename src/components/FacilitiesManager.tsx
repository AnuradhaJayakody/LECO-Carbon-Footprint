import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Facility, FacilityType, JobRole } from '../types';
import { api } from '../services/api';
import { supabase, toFacilityRow } from '../services/supabase';
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
  ShieldAlert
} from 'lucide-react';

export const FacilitiesManager: React.FC = () => {
  const { 
    facilities, 
    refreshFacilities, 
    isSuperAdmin, 
    canDelete, 
    notify,
    getScopedFacilities
  } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
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

  const scopedFacilities = getScopedFacilities();
  const parentBranches = facilities.filter(f => f.type === 'Branch' || f.isParent);

  const openAddModal = () => {
    setEditingFacility(null);
    setCode(`LECO-FAC-${Date.now().toString(36).toUpperCase()}`);
    setName('');
    setType('CSC');
    setParentId(parentBranches[0]?.id || '');
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

  const handleSaveFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim() || !responsibleOfficer.trim() || !officerEmail.trim()) {
      notify('Please complete all mandatory facility fields', 'error');
      return;
    }

    const payload: Partial<Facility> = {
      code: code.trim(),
      name: name.trim(),
      type,
      parentId: type === 'CSC' ? parentId || null : null,
      parentName: type === 'CSC' ? parentBranches.find(b => b.id === parentId)?.name : undefined,
      isParent: type === 'Branch' ? true : isParent,
      location: location.trim(),
      responsibleOfficer: responsibleOfficer.trim(),
      headDesignation: headDesignation.trim(),
      officerEmail: officerEmail.trim().toLowerCase(),
      contactNumber: contactNumber.trim(),
      electricityAccountNo: electricityAccountNo.trim(),
      hasSolarPV,
      solarCapacityKW: hasSolarPV ? Number(solarCapacityKW) : 0,
      jobRoles
    };

    try {
      if (editingFacility) {
        // Execute Supabase update if client configured
        if (supabase) {
          try {
            const { error: sbErr } = await supabase
              .from('facilities')
              .update(toFacilityRow(payload))
              .eq('id', editingFacility.id);
            if (sbErr) console.warn('Supabase facility update notice:', sbErr);
          } catch (e) {
            console.warn('Supabase facility update error:', e);
          }
        }

        await api.updateFacility(editingFacility.id, payload);
        notify(`Facility "${payload.name}" updated successfully!`, 'success');
      } else {
        const newFacilityId = `fac-${Date.now().toString(36)}`;
        const newRecord = {
          ...payload,
          id: newFacilityId
        };

        // Execute Supabase insert if client configured
        if (supabase) {
          try {
            const { error: sbErr } = await supabase
              .from('facilities')
              .insert([toFacilityRow(newRecord)]);
            if (sbErr) console.warn('Supabase facility insert notice:', sbErr);
          } catch (e) {
            console.warn('Supabase facility insert error:', e);
          }
        }

        await api.createFacility(newRecord);
        notify(`New Facility "${payload.name}" created successfully!`, 'success');
      }
      setIsModalOpen(false);
      await refreshFacilities();
    } catch (err: any) {
      notify(err.message || 'Failed to save facility', 'error');
    }
  };

  const handleDeleteFacility = async (id: string) => {
    if (!canDelete) {
      notify('You do not have permission to delete facility records.', 'error');
      return;
    }
    try {
      if (supabase) {
        try {
          const { error: sbErr } = await supabase
            .from('facilities')
            .delete()
            .eq('id', id);
          if (sbErr) console.warn('Supabase facility delete notice:', sbErr);
        } catch (e) {
          console.warn('Supabase facility delete error:', e);
        }
      }

      await api.deleteFacility(id);
      notify('Facility record removed successfully', 'success');
      setDeleteConfirmId(null);
      await refreshFacilities();
    } catch (err: any) {
      notify(err.message || 'Could not delete facility', 'error');
    }
  };

  // Filtered List
  const filteredFacilities = scopedFacilities.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.responsibleOfficer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedTypeFilter === 'ALL' || f.type === selectedTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            <span>Operational Boundary & Organizational Hierarchy</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            LECO Facilities & Customer Service Centres (CSC)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage parent Branches, subordinate CSCs, meter testing plants, and logistics stores according to ISO 14064 operational boundaries.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Facility / CSC</span>
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
            placeholder="Search by name, code, officer..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
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

      {/* Facilities Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredFacilities.map(fac => {
          const isChildCSC = fac.type === 'CSC' && fac.parentId;
          const childCount = facilities.filter(f => f.parentId === fac.id).length;

          return (
            <div 
              key={fac.id}
              className={`bg-white border rounded-2xl p-5 shadow-sm transition flex flex-col justify-between ${
                fac.isParent ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200'
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
                  <div className="text-[11px] text-blue-600 font-semibold flex items-center gap-1 mt-0.5">
                    <span>Subordinate to: {fac.parentName || 'Parent Branch'}</span>
                  </div>
                )}
                {fac.isParent && (
                  <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                    <Layers className="w-3 h-3" />
                    <span>Parent Branch &bull; {childCount} Assigned Customer Service Centres</span>
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Confirm Facility Deletion</h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to remove this facility? Any associated emission records and CSC links will be updated.
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
                    onChange={(e) => setType(e.target.value as FacilityType)}
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
                    <label className="block font-bold text-blue-700 uppercase tracking-wider mb-1">
                      Subordinate Parent Branch *
                    </label>
                    <select
                      value={parentId}
                      onChange={(e) => setParentId(e.target.value)}
                      className="w-full px-3 py-2 bg-blue-50/60 border border-blue-300 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select Parent Branch --</option>
                      {parentBranches.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Branch Hierarchy Type
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
                      <label htmlFor="isParentCheck" className="font-semibold text-slate-800 cursor-pointer">
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
                className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-700 font-semibold rounded-xl border border-slate-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="facility-form"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow transition cursor-pointer"
              >
                {editingFacility ? 'Save Changes' : 'Create Facility'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
