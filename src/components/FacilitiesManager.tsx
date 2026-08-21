import React, { useState } from 'react';
import { 
  Building2, Plus, Edit2, Trash2, MapPin, Users, Sun, Briefcase, 
  ShieldCheck, Phone, Mail, UserCheck, X, Check, Search, Filter, Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Facility, FacilityJobRole } from '../types';
import { api } from '../services/api';

export const FacilitiesManager: React.FC = () => {
  const { facilities, refreshFacilities, isSuperAdmin, notify, addFacilityJobRole, deleteFacilityJobRole } = useAuth();
  
  const [showModal, setShowModal] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<Facility['type']>('Branch');
  const [location, setLocation] = useState('');
  const [responsibleOfficer, setResponsibleOfficer] = useState('');
  const [headDesignation, setHeadDesignation] = useState('');
  const [officerEmail, setOfficerEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [electricityAccountNo, setElectricityAccountNo] = useState('');
  const [hasSolarPV, setHasSolarPV] = useState(false);
  const [solarCapacityKW, setSolarCapacityKW] = useState<number>(0);
  
  // Job Roles State inside Modal
  const [modalJobRoles, setModalJobRoles] = useState<Array<{ id?: string; roleName: string; description?: string }>>([]);
  const [newJobRoleInput, setNewJobRoleInput] = useState('');
  const [newJobRoleDesc, setNewJobRoleDesc] = useState('');

  // Quick inline job role addition on a card
  const [activeFacilityJobRoleModal, setActiveFacilityJobRoleModal] = useState<Facility | null>(null);
  const [inlineRoleName, setInlineRoleName] = useState('');
  const [inlineRoleDesc, setInlineRoleDesc] = useState('');

  const handleOpenAdd = () => {
    setEditingFacility(null);
    setName('');
    setCode(`LECO-BR-${String(facilities.length + 1).padStart(2, '0')}`);
    setType('Branch');
    setLocation('');
    setResponsibleOfficer('');
    setHeadDesignation('Branch Operations Manager');
    setOfficerEmail('');
    setContactNumber('+94 11 ');
    setElectricityAccountNo('');
    setHasSolarPV(false);
    setSolarCapacityKW(0);
    setModalJobRoles([
      { roleName: 'Operations Lead', description: 'Facility operations and dispatch' },
      { roleName: 'Customer Relations Officer', description: 'Customer inquiry and billing management' }
    ]);
    setNewJobRoleInput('');
    setNewJobRoleDesc('');
    setShowModal(true);
  };

  const handleOpenEdit = (fac: Facility) => {
    setEditingFacility(fac);
    setName(fac.name);
    setCode(fac.code);
    setType(fac.type);
    setLocation(fac.location || '');
    setResponsibleOfficer(fac.responsibleOfficer || '');
    setHeadDesignation(fac.headDesignation || '');
    setOfficerEmail(fac.officerEmail || '');
    setContactNumber(fac.contactNumber || '');
    setElectricityAccountNo(fac.electricityAccountNo || '');
    setHasSolarPV(Boolean(fac.hasSolarPV || (fac.solarCapacityKW && fac.solarCapacityKW > 0)));
    setSolarCapacityKW(fac.solarCapacityKW || 0);
    setModalJobRoles(fac.jobRoles ? [...fac.jobRoles] : []);
    setNewJobRoleInput('');
    setNewJobRoleDesc('');
    setShowModal(true);
  };

  const handleAddJobRoleToModal = () => {
    if (!newJobRoleInput.trim()) return;
    setModalJobRoles([
      ...modalJobRoles,
      {
        id: `temp-${Date.now()}`,
        roleName: newJobRoleInput.trim(),
        description: newJobRoleDesc.trim() || undefined
      }
    ]);
    setNewJobRoleInput('');
    setNewJobRoleDesc('');
  };

  const handleRemoveJobRoleFromModal = (index: number) => {
    const updated = [...modalJobRoles];
    updated.splice(index, 1);
    setModalJobRoles(updated);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!isSuperAdmin) {
      notify('Super Admin privileges required to remove facilities', 'error');
      return;
    }
    if (facilities.length <= 1) {
      notify('Cannot delete the last remaining LECO facility', 'error');
      return;
    }
    if (window.confirm(`Are you sure you want to remove facility "${name}"? This action cannot be undone.`)) {
      try {
        await api.deleteFacility(id);
        await refreshFacilities();
        notify(`Facility "${name}" removed successfully`, 'info');
      } catch (e: any) {
        notify(e.message || 'Failed to delete facility', 'error');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      notify('Facility name and code are required', 'error');
      return;
    }

    try {
      const facilityPayload: Partial<Facility> = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        type,
        location: location.trim(),
        responsibleOfficer: responsibleOfficer.trim(),
        headDesignation: headDesignation.trim(),
        officerEmail: officerEmail.trim().toLowerCase(),
        contactNumber: contactNumber.trim(),
        electricityAccountNo: electricityAccountNo.trim(),
        hasSolarPV,
        solarCapacityKW: hasSolarPV ? Number(solarCapacityKW) : 0,
        jobRoles: modalJobRoles.map((jr, idx) => ({
          id: jr.id || `jr-${Date.now()}-${idx}`,
          facilityId: editingFacility ? editingFacility.id : '',
          roleName: jr.roleName,
          description: jr.description
        }))
      };

      if (editingFacility) {
        await api.updateFacility(editingFacility.id, facilityPayload);
        notify(`Facility "${name}" updated successfully`, 'success');
      } else {
        await api.createFacility(facilityPayload);
        notify(`New facility "${name}" registered successfully`, 'success');
      }
      await refreshFacilities();
      setShowModal(false);
    } catch (err: any) {
      notify(err.message || 'Failed to save facility', 'error');
    }
  };

  const handleInlineAddJobRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFacilityJobRoleModal || !inlineRoleName.trim()) return;
    await addFacilityJobRole(activeFacilityJobRoleModal.id, inlineRoleName.trim(), inlineRoleDesc.trim());
    setInlineRoleName('');
    setInlineRoleDesc('');
  };

  const handleInlineDeleteJobRole = async (roleId: string) => {
    if (!activeFacilityJobRoleModal) return;
    await deleteFacilityJobRole(activeFacilityJobRoleModal.id, roleId);
  };

  // Filtered facilities
  const filteredFacilities = facilities.filter(fac => {
    const matchesSearch = 
      fac.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fac.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fac.responsibleOfficer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fac.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'ALL' || fac.type === filterType;
    return matchesSearch && matchesType;
  });

  const totalSolarKW = facilities.reduce((sum, f) => sum + (f.solarCapacityKW || 0), 0);
  const totalJobRolesCount = facilities.reduce((sum, f) => sum + (f.jobRoles?.length || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Metrics */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <Building2 className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                LECO Facility & Branch Management
              </h1>
              <p className="text-xs text-slate-500">
                Manage branch offices, responsible facility heads, and define customized job roles for RBAC assignment
              </p>
            </div>
          </div>
        </div>

        {isSuperAdmin && (
          <button
            onClick={handleOpenAdd}
            id="btn-add-facility"
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Facility</span>
          </button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Facilities</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{facilities.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Operating locations</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Defined Job Roles</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{totalJobRolesCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">RBAC role templates</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Solar PV Clean Energy</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{totalSolarKW.toFixed(1)} <span className="text-xs font-normal text-slate-500">kWp</span></div>
          <div className="text-[11px] text-slate-400 mt-0.5">{facilities.filter(f => f.hasSolarPV).length} solar sites</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Responsible Heads</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{facilities.filter(f => f.responsibleOfficer).length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Assigned Officers in Charge</div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search facility name, code, officer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Type:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Facility Types</option>
            <option value="Head Office">Head Office</option>
            <option value="Branch">Branch</option>
            <option value="Meter Factory">Meter Factory</option>
            <option value="Store">Store / Warehouse</option>
            <option value="Training Centre">Training Centre</option>
          </select>
        </div>
      </div>

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFacilities.map((fac) => (
          <div
            key={fac.id}
            id={`facility-card-${fac.id}`}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-bold tracking-wider">
                      {fac.code}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                      {fac.type}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-2">{fac.name}</h3>
                </div>

                {isSuperAdmin && (
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(fac)}
                      title="Edit Facility"
                      className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(fac.id, fac.name)}
                      title="Delete Facility"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Responsible Person / Head */}
              <div className="mt-4 p-3 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 flex items-center space-x-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-semibold text-slate-700">Person Responsible (Head):</span>
                  </span>
                </div>
                <div className="font-bold text-slate-900 text-xs">{fac.responsibleOfficer || 'Not Assigned'}</div>
                {fac.headDesignation && (
                  <div className="text-[11px] text-emerald-700 font-medium">{fac.headDesignation}</div>
                )}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[10px] text-slate-500">
                  {fac.officerEmail && (
                    <span className="flex items-center space-x-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{fac.officerEmail}</span>
                    </span>
                  )}
                  {fac.contactNumber && (
                    <span className="flex items-center space-x-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{fac.contactNumber}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Location & Electricity details */}
              <div className="space-y-2 mt-3.5 text-xs text-slate-600">
                <div className="flex items-start space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="truncate text-slate-600">{fac.location || 'Location not specified'}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-slate-400">Electricity Account:</span>
                  <span className="font-mono text-slate-800 font-medium">{fac.electricityAccountNo || 'ACC-N/A'}</span>
                </div>
              </div>

              {/* Associated Job Roles */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center space-x-1">
                    <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                    <span>Facility Job Roles ({fac.jobRoles?.length || 0})</span>
                  </span>
                  {isSuperAdmin && (
                    <button
                      onClick={() => setActiveFacilityJobRoleModal(fac)}
                      className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                    >
                      + Manage Roles
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {fac.jobRoles && fac.jobRoles.length > 0 ? (
                    fac.jobRoles.map((jr) => (
                      <span
                        key={jr.id}
                        title={jr.description || jr.roleName}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium rounded-md border border-slate-200 transition"
                      >
                        {jr.roleName}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">No job roles defined yet</span>
                  )}
                </div>
              </div>
            </div>

            {/* Solar Clean Energy Footer */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 text-[11px]">Solar PV Clean Energy:</span>
              {fac.hasSolarPV && fac.solarCapacityKW && fac.solarCapacityKW > 0 ? (
                <span className="inline-flex items-center space-x-1 font-bold text-amber-600 text-xs">
                  <Sun className="w-3.5 h-3.5" />
                  <span>{fac.solarCapacityKW} kWp Installed</span>
                </span>
              ) : (
                <span className="text-slate-400 text-[11px]">No Rooftop Solar</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Create / Edit Facility */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">
                  {editingFacility ? 'Update Facility & Branch Details' : 'Register New Facility / Branch'}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Facility Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Negombo Branch & Operations"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Facility Code *</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    placeholder="e.g. LECO-BR-NG"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Facility Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as Facility['type'])}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="Head Office">Head Office</option>
                    <option value="Branch">Branch Office / CSC</option>
                    <option value="Meter Factory">Meter Testing & Assembly Factory</option>
                    <option value="Store">Central Materials Store</option>
                    <option value="Training Centre">Technical Training Centre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Location / Address</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Greens Road, Negombo"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Head of Facility (Person Responsible) */}
              <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-3">
                <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>Person Responsible (Head of Facility)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Head of Facility Name</label>
                    <input
                      type="text"
                      value={responsibleOfficer}
                      onChange={(e) => setResponsibleOfficer(e.target.value)}
                      placeholder="e.g. Eng. Priyantha Dissanayake"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Head Designation / Title</label>
                    <input
                      type="text"
                      value={headDesignation}
                      onChange={(e) => setHeadDesignation(e.target.value)}
                      placeholder="e.g. Chief Area Electrical Engineer"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Official Email</label>
                    <input
                      type="email"
                      value={officerEmail}
                      onChange={(e) => setOfficerEmail(e.target.value)}
                      placeholder="e.g. priyantha.d@leco.com"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      placeholder="+94 31 223 8812"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Job Roles associated with Facility */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                    <Briefcase className="w-4 h-4 text-slate-600" />
                    <span>Associated Job Roles ({modalJobRoles.length})</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Available as dropdown roles for users</span>
                </div>

                {/* Job Role list tags */}
                <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-white rounded-lg border border-slate-200">
                  {modalJobRoles.map((jr, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-[11px] font-medium"
                    >
                      <span>{jr.roleName}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveJobRoleFromModal(idx)}
                        className="text-emerald-600 hover:text-rose-600 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {modalJobRoles.length === 0 && (
                    <span className="text-slate-400 text-xs italic">No roles added yet. Add one below.</span>
                  )}
                </div>

                {/* Add new Job Role row */}
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Job Role Title (e.g. Calibration Engineer)"
                    value={newJobRoleInput}
                    onChange={(e) => setNewJobRoleInput(e.target.value)}
                    className="w-full sm:flex-1 p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Brief description / scope (optional)"
                    value={newJobRoleDesc}
                    onChange={(e) => setNewJobRoleDesc(e.target.value)}
                    className="w-full sm:flex-1 p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddJobRoleToModal}
                    className="w-full sm:w-auto px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shrink-0 transition"
                  >
                    + Add Role
                  </button>
                </div>
              </div>

              {/* Electricity & Solar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Electricity Account Number</label>
                  <input
                    type="text"
                    value={electricityAccountNo}
                    onChange={(e) => setElectricityAccountNo(e.target.value)}
                    placeholder="e.g. ACC-031-1029"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 pt-3">
                    <input
                      type="checkbox"
                      id="hasSolarPV"
                      checked={hasSolarPV}
                      onChange={(e) => setHasSolarPV(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="hasSolarPV" className="font-semibold text-slate-800 cursor-pointer">
                      Has Rooftop Solar PV Installation
                    </label>
                  </div>

                  {hasSolarPV && (
                    <div>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={solarCapacityKW}
                        onChange={(e) => setSolarCapacityKW(Number(e.target.value))}
                        placeholder="Capacity in kWp (e.g. 50)"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:outline-none"
                      />
                    </div>
                  )}
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
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-sm transition"
                >
                  {editingFacility ? 'Save Changes' : 'Create Facility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Manage Job Roles for specific facility */}
      {activeFacilityJobRoleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Job Roles: {activeFacilityJobRoleModal.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Define official roles used when provisioning facility-level users
                </p>
              </div>
              <button
                onClick={() => setActiveFacilityJobRoleModal(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of existing roles */}
            <div className="mt-4 space-y-2 max-h-60 overflow-y-auto pr-1">
              {activeFacilityJobRoleModal.jobRoles && activeFacilityJobRoleModal.jobRoles.length > 0 ? (
                activeFacilityJobRoleModal.jobRoles.map((jr) => (
                  <div
                    key={jr.id}
                    className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{jr.roleName}</div>
                      {jr.description && (
                        <div className="text-[11px] text-slate-500">{jr.description}</div>
                      )}
                    </div>
                    <button
                      onClick={() => handleInlineDeleteJobRole(jr.id)}
                      title="Remove Role"
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No job roles configured for this branch.
                </div>
              )}
            </div>

            {/* Add new role form */}
            <form onSubmit={handleInlineAddJobRole} className="mt-4 pt-3 border-t border-slate-100 space-y-2.5 text-xs">
              <label className="block text-slate-700 font-semibold">Add New Role to Facility</label>
              <input
                type="text"
                placeholder="Role Title (e.g. Senior Calibration Engineer)"
                value={inlineRoleName}
                onChange={(e) => setInlineRoleName(e.target.value)}
                required
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
              />
              <input
                type="text"
                placeholder="Role responsibilities (optional)"
                value={inlineRoleDesc}
                onChange={(e) => setInlineRoleDesc(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
              />
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs shadow-sm"
                >
                  Save Job Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
