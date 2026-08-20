import React, { useState } from 'react';
import { Building2, Plus, Edit2, Trash2, MapPin, Users, Sun, Zap, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Facility } from '../types';

export const FacilitiesManager: React.FC = () => {
  const { facilities, setFacilities, isSuperAdmin, notify } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<any>('Branch Office');
  const [address, setAddress] = useState('');
  const [region, setRegion] = useState('Western Province South');
  const [staffCount, setStaffCount] = useState<number>(30);
  const [floorAreaSqFt, setFloorAreaSqFt] = useState<number>(5000);
  const [responsibleOfficer, setResponsibleOfficer] = useState('');
  const [electricityAccountNo, setElectricityAccountNo] = useState('');
  const [hasSolar, setHasSolar] = useState(false);
  const [solarCapacityKW, setSolarCapacityKW] = useState<number>(50);

  const handleOpenAdd = () => {
    setEditingFacility(null);
    setName('');
    setCode(`FAC-0${facilities.length + 1}`);
    setType('Branch Office');
    setAddress('');
    setRegion('Western Province South');
    setStaffCount(25);
    setFloorAreaSqFt(4500);
    setResponsibleOfficer('Branch Manager');
    setElectricityAccountNo('');
    setHasSolar(false);
    setSolarCapacityKW(0);
    setShowModal(true);
  };

  const handleOpenEdit = (fac: Facility) => {
    setEditingFacility(fac);
    setName(fac.name);
    setCode(fac.code);
    setType(fac.type);
    setAddress(fac.address);
    setRegion(fac.region);
    setStaffCount(fac.staffCount);
    setFloorAreaSqFt(fac.floorAreaSqFt);
    setResponsibleOfficer(fac.responsibleOfficer);
    setElectricityAccountNo(fac.electricityAccountNo || '');
    setHasSolar(!!fac.solarCapacityKW);
    setSolarCapacityKW(fac.solarCapacityKW || 0);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (!isSuperAdmin) {
      notify('Super Admin role required to delete facilities', 'error');
      return;
    }
    if (facilities.length <= 1) {
      notify('Cannot delete the last remaining facility', 'error');
      return;
    }
    if (window.confirm('Are you sure you want to remove this facility?')) {
      const updated = facilities.filter(f => f.id !== id);
      setFacilities(updated);
      notify('Facility removed');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFacility) {
      const updated = facilities.map(f => {
        if (f.id === editingFacility.id) {
          return {
            ...f,
            name,
            code,
            type,
            address,
            region,
            staffCount: Number(staffCount),
            floorAreaSqFt: Number(floorAreaSqFt),
            responsibleOfficer,
            electricityAccountNo,
            solarCapacityKW: hasSolar ? Number(solarCapacityKW) : 0
          };
        }
        return f;
      });
      setFacilities(updated);
      notify('Facility updated successfully');
    } else {
      const newFac: Facility = {
        id: `fac-${Date.now()}`,
        name,
        code,
        type,
        location: address || region || 'Western Province',
        address,
        region,
        staffCount: Number(staffCount),
        floorAreaSqFt: Number(floorAreaSqFt),
        responsibleOfficer,
        electricityAccountNo,
        meterNumbers: ['MTR-01'],
        solarCapacityKW: hasSolar ? Number(solarCapacityKW) : 0,
      };
      setFacilities([...facilities, newFac]);
      notify('New facility created');
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <span>LECO Facilities & Infrastructure Directory</span>
          </h1>
          <p className="text-xs text-slate-500">
            Manage corporate head office, branch network, customer service centers, stores, and meter factory
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Facility</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {facilities.map((fac) => (
          <div
            key={fac.id}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                    {fac.code}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1.5">{fac.name}</h3>
                  <p className="text-xs text-slate-500">{fac.type}</p>
                </div>
                {isSuperAdmin && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(fac)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(fac.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2 mt-4 text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{fac.address || 'Address on file'}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-slate-400">Officer in Charge:</span>
                  <span className="font-semibold text-slate-800">{fac.responsibleOfficer}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Employees & Area:</span>
                  <span className="font-medium text-slate-700">{fac.staffCount} staff | {fac.floorAreaSqFt.toLocaleString()} sq.ft</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Electricity Account:</span>
                  <span className="font-mono text-slate-800">{fac.electricityAccountNo || 'ACC-N/A'}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Solar PV Setup:</span>
              {fac.solarCapacityKW && fac.solarCapacityKW > 0 ? (
                <span className="inline-flex items-center space-x-1 font-bold text-emerald-600">
                  <Sun className="w-3.5 h-3.5" />
                  <span>{fac.solarCapacityKW} kWp Installed</span>
                </span>
              ) : (
                <span className="text-slate-400">None Installed</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              {editingFacility ? 'Edit Facility Record' : 'Register New Facility'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Facility Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Negombo Branch Office"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Facility Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Facility Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Head Office">Head Office</option>
                    <option value="Branch Office">Branch Office</option>
                    <option value="Customer Service Center (CSC)">Customer Service Center (CSC)</option>
                    <option value="Central Stores">Central Stores</option>
                    <option value="Electricity Meter Factory">Electricity Meter Factory</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Region / Zone</label>
                  <input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Responsible Officer</label>
                  <input
                    type="text"
                    value={responsibleOfficer}
                    onChange={(e) => setResponsibleOfficer(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Electricity Account No</label>
                  <input
                    type="text"
                    value={electricityAccountNo}
                    onChange={(e) => setElectricityAccountNo(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="hasSolar"
                  checked={hasSolar}
                  onChange={(e) => setHasSolar(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="hasSolar" className="font-semibold text-slate-800">
                  Has On-site Rooftop Solar PV Installation
                </label>
              </div>

              {hasSolar && (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Solar PV Capacity (kWp)</label>
                  <input
                    type="number"
                    value={solarCapacityKW}
                    onChange={(e) => setSolarCapacityKW(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-sm"
                >
                  Save Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
