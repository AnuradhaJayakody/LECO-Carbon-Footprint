import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Scope2Record, EmissionFactor } from '../types';
import { api } from '../services/api';
import { supabase, toScope2Row, fromScope2Row, fromEmissionFactorRow } from '../services/supabase';
import { 
  Zap, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  X, 
  Sun, 
  Building2, 
  Layers, 
  Lock,
  RefreshCw,
  Info
} from 'lucide-react';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const Scope2Manager: React.FC = () => {
  const { 
    selectedYear, 
    selectedFacilityId, 
    facilities, 
    canDelete, 
    notify, 
    user,
    isFacilityUser,
    getScopedFacilities
  } = useAuth();

  const [records, setRecords] = useState<Scope2Record[]>([]);
  const [emissionFactors, setEmissionFactors] = useState<EmissionFactor[]>([]);
  const [gridFactor, setGridFactor] = useState<number>(0.582);
  const [gridFactorSource, setGridFactorSource] = useState<string>('Sri Lanka Sustainable Energy Authority (SLSEA)');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Scope2Record | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form Fields
  const [facilityId, setFacilityId] = useState<string>('');
  const [reportingMonth, setReportingMonth] = useState<number>(1);
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [meterNumber, setMeterNumber] = useState<string>('');
  const [gridElectricityKWh, setGridElectricityKWh] = useState<number>(3500);
  const [solarGenerationKWh, setSolarGenerationKWh] = useState<number>(850);
  const [costLKR, setCostLKR] = useState<number>(125000);
  const [notes, setNotes] = useState<string>('');

  const scopedFacilities = getScopedFacilities();

  // 1. Fetch Emission Factors on Mount
  const fetchEmissionFactors = async () => {
    try {
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('emission_factors')
            .select('*')
            .order('category', { ascending: true });

          if (!error && data && data.length > 0) {
            const mapped = data.map(fromEmissionFactorRow);
            setEmissionFactors(mapped);
            resolveGridFactor(mapped);
            return;
          }
        } catch (sbErr) {
          console.warn('Supabase fetch emission factors in Scope 2:', sbErr);
        }
      }

      const data = await api.getEmissionFactors();
      if (data) {
        setEmissionFactors(data);
        resolveGridFactor(data);
      }
    } catch (err) {
      console.warn('Failed to load emission factors for Scope 2:', err);
    }
  };

  const resolveGridFactor = (factors: EmissionFactor[]) => {
    const match = factors.find(f => {
      if (f.category === 'Scope 2 - Grid Electricity') return true;
      const cat = (f.category || '').toLowerCase();
      const n = (f.name || f.fuel_or_material || '').toLowerCase();
      return cat.includes('scope 2') || n.includes('grid') || n.includes('ceb') || n.includes('electricity');
    });

    if (match) {
      const val = Number(match.factor ?? match.factor_kg_co2e ?? 0.582);
      setGridFactor(val);
      setGridFactorSource(match.source || match.referenceSource || 'SLSEA National Grid Standard');
    } else {
      setGridFactor(0.582);
      setGridFactorSource('Sri Lanka Sustainable Energy Authority (SLSEA)');
    }
  };

  // 2. Fetch Scope 2 Records
  const fetchRecords = async () => {
    setLoading(true);
    try {
      if (supabase) {
        try {
          let query = supabase.from('scope2_records').select('*').order('reporting_month', { ascending: true });
          if (selectedYear) {
            query = query.eq('reporting_year', selectedYear);
          }
          if (selectedFacilityId && selectedFacilityId !== 'ALL') {
            const allFacs = facilities;
            const targetIds = [selectedFacilityId];
            allFacs.filter(f => f.parentId === selectedFacilityId).forEach(cf => targetIds.push(cf.id));
            query = query.in('facility_id', targetIds);
          }
          const { data, error } = await query;
          if (!error && data) {
            setRecords(data.map(fromScope2Row));
            setLoading(false);
            return;
          }
        } catch (sbErr) {
          console.warn('Supabase fetch Scope2 notice:', sbErr);
        }
      }

      const data = await api.getScope2(selectedYear, selectedFacilityId);
      setRecords(data);
    } catch (err) {
      console.error('Error fetching Scope 2 records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmissionFactors();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [selectedYear, selectedFacilityId]);

  const openAddModal = () => {
    const defaultFacId = (selectedFacilityId !== 'ALL' && selectedFacilityId) 
      ? selectedFacilityId 
      : (user?.facilityId || scopedFacilities[0]?.id || '');
    const facObj = facilities.find(f => f.id === defaultFacId);
    
    setEditingRecord(null);
    setFacilityId(defaultFacId);
    setReportingMonth(new Date().getMonth() + 1);
    setAccountNumber(facObj?.electricityAccountNo || 'ACC-011-9876');
    setMeterNumber(facObj?.meterNumbers?.[0] || 'MTR-88421');
    setGridElectricityKWh(3200);
    setSolarGenerationKWh(facObj?.hasSolarPV ? (facObj.solarCapacityKW ? facObj.solarCapacityKW * 120 : 650) : 0);
    setCostLKR(115000);
    setNotes('CEB Monthly Utility Bill');
    setIsModalOpen(true);
  };

  const openEditModal = (r: Scope2Record) => {
    setEditingRecord(r);
    setFacilityId(r.facilityId);
    setReportingMonth(r.reportingMonth);
    setAccountNumber(r.accountNumber || '');
    setMeterNumber(r.meterNumber || '');
    setGridElectricityKWh(r.gridElectricityKWh);
    setSolarGenerationKWh(r.solarGenerationKWh || 0);
    setCostLKR(r.costLKR || 0);
    setNotes(r.notes || '');
    setIsModalOpen(true);
  };

  const handleFacilityChange = (facId: string) => {
    setFacilityId(facId);
    const fac = facilities.find(f => f.id === facId);
    if (fac) {
      if (fac.electricityAccountNo) setAccountNumber(fac.electricityAccountNo);
      if (fac.hasSolarPV && (!solarGenerationKWh || solarGenerationKWh === 0)) {
        setSolarGenerationKWh(fac.solarCapacityKW ? fac.solarCapacityKW * 120 : 500);
      }
    }
  };

  // Real-time calculations using dynamically fetched grid factor
  const calculatedOutputs = useMemo(() => {
    const grossTons = Number((((Number(gridElectricityKWh) || 0) * gridFactor) / 1000).toFixed(4));
    const solarOffsetTons = Number((((Number(solarGenerationKWh) || 0) * gridFactor) / 1000).toFixed(4));
    const netTons = Math.max(0, Number((grossTons - solarOffsetTons).toFixed(4)));
    return {
      grossTons,
      solarOffsetTons,
      netTons,
      grossKg: Number(((Number(gridElectricityKWh) || 0) * gridFactor).toFixed(2)),
      solarOffsetKg: Number(((Number(solarGenerationKWh) || 0) * gridFactor).toFixed(2))
    };
  }, [gridElectricityKWh, solarGenerationKWh, gridFactor]);

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityId) {
      notify('Please select a facility for this electricity bill log', 'error');
      return;
    }

    const targetFac = facilities.find(f => f.id === facilityId);

    const payload: Partial<Scope2Record> = {
      facilityId,
      facilityName: targetFac?.name || 'Facility',
      reportingYear: selectedYear,
      reportingMonth: Number(reportingMonth),
      accountNumber: accountNumber.trim(),
      meterNumber: meterNumber.trim(),
      gridElectricityKWh: Number(gridElectricityKWh),
      solarGenerationKWh: Number(solarGenerationKWh),
      gridEmissionFactor: gridFactor,
      emissionsTonsCO2e: calculatedOutputs.grossTons,
      solarOffsetTonsCO2e: calculatedOutputs.solarOffsetTons,
      netEmissionsTonsCO2e: calculatedOutputs.netTons,
      costLKR: Number(costLKR),
      notes: notes.trim()
    };

    try {
      if (editingRecord) {
        if (supabase) {
          try {
            const { error: sbErr } = await supabase
              .from('scope2_records')
              .update(toScope2Row(payload))
              .eq('id', editingRecord.id);
            if (sbErr) console.warn('Supabase Scope 2 update notice:', sbErr);
          } catch (e) {
            console.warn('Supabase Scope 2 update error:', e);
          }
        }

        await api.updateScope2(editingRecord.id, payload);
        notify('Scope 2 electricity record updated successfully!', 'success');
      } else {
        const newRecordId = `s2-${Date.now().toString(36)}`;
        const newRecord = {
          ...payload,
          id: newRecordId,
          createdById: user?.id,
          createdByName: user?.name
        };

        if (supabase) {
          try {
            const { error: sbErr } = await supabase
              .from('scope2_records')
              .insert([toScope2Row(newRecord)]);
            if (sbErr) console.warn('Supabase Scope 2 insert notice:', sbErr);
          } catch (e) {
            console.warn('Supabase Scope 2 insert error:', e);
          }
        }

        await api.createScope2(newRecord);
        notify('Scope 2 electricity record logged successfully!', 'success');
      }
      setIsModalOpen(false);
      await fetchRecords();
    } catch (err: any) {
      notify(err.message || 'Failed to save electricity record', 'error');
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!canDelete) {
      notify('You do not have permission to delete emission records.', 'error');
      return;
    }
    try {
      if (supabase) {
        try {
          const { error: sbErr } = await supabase
            .from('scope2_records')
            .delete()
            .eq('id', id);
          if (sbErr) console.warn('Supabase Scope 2 delete notice:', sbErr);
        } catch (e) {
          console.warn('Supabase Scope 2 delete error:', e);
        }
      }

      await api.deleteScope2(id);
      notify('Scope 2 record removed successfully', 'success');
      setDeleteConfirmId(null);
      await fetchRecords();
    } catch (err: any) {
      notify(err.message || 'Failed to delete record', 'error');
    }
  };

  const totalGridKWh = records.reduce((acc, r) => acc + (r.gridElectricityKWh || 0), 0);
  const totalScope2Tons = records.reduce((acc, r) => acc + (r.emissionsTonsCO2e || 0), 0);
  const totalSolarOffset = records.reduce((acc, r) => acc + (r.solarOffsetTonsCO2e || 0), 0);

  const filteredRecords = records.filter(r => {
    return (r.facilityName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
           (r.accountNumber && r.accountNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
           (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
            <Zap className="w-4 h-4" />
            <span>Scope 2 Purchased Electricity & Solar PV &bull; FY {selectedYear}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            CEB Grid Purchased Electricity & Clean Solar Offsets
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Record monthly utility electricity consumption and clean rooftop solar PV generation across all LECO premises with database-governed emission factors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-500 uppercase">Gross Grid Emissions</div>
            <div className="text-xl font-black text-blue-600">{totalScope2Tons.toFixed(2)} tCO₂e</div>
          </div>
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log Electricity Bill</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Total Grid Electricity</div>
            <div className="text-xl font-black text-slate-900 mt-0.5 font-mono">{totalGridKWh.toLocaleString()} kWh</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Gross GHG (tCO₂e)</div>
            <div className="text-xl font-black text-blue-600 mt-0.5 font-mono">{totalScope2Tons.toFixed(2)} t</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-emerald-800 uppercase">Solar Avoided Carbon</div>
            <div className="text-xl font-black text-emerald-700 mt-0.5 font-mono">-{totalSolarOffset.toFixed(2)} tCO₂e</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Sun className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by facility, account no..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Active Grid Factor: <strong>{gridFactor.toFixed(4).replace(/\.?0+$/, '')} kg CO₂e / kWh</strong></span>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <th className="py-3.5 px-4">Period</th>
                <th className="py-3.5 px-4">Facility / CSC</th>
                <th className="py-3.5 px-4">Account / Meter</th>
                <th className="py-3.5 px-4 text-right">Grid Consumed (kWh)</th>
                <th className="py-3.5 px-4 text-right">Solar Generated (kWh)</th>
                <th className="py-3.5 px-4 text-right">Factor Used</th>
                <th className="py-3.5 px-4 text-right font-black text-slate-900">Gross GHG (tCO₂e)</th>
                <th className="py-3.5 px-4 text-right text-emerald-700 font-bold">Solar Offset</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No Scope 2 electricity records found. Click "Log Electricity Bill" to add data.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {MONTH_NAMES[r.reportingMonth - 1]} {r.reportingYear}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{r.facilityName}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      <div>{r.accountNumber || 'ACC-N/A'}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{r.meterNumber || 'MTR-N/A'}</div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {(r.gridElectricityKWh || 0).toLocaleString()} kWh
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-emerald-700">
                      {(r.solarGenerationKWh || 0).toLocaleString()} kWh
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold">
                        {r.gridEmissionFactor ? Number(r.gridEmissionFactor).toFixed(4).replace(/\.?0+$/, '') : gridFactor.toFixed(4).replace(/\.?0+$/, '')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-black text-blue-600 bg-blue-50/30">
                      {(r.emissionsTonsCO2e || 0).toFixed(3)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                      -{(r.solarOffsetTonsCO2e || 0).toFixed(3)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(r)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="Edit Record"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => setDeleteConfirmId(r.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Record Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Electricity Record</h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to permanently delete this Scope 2 record?
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteRecord(deleteConfirmId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow transition cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Activity Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    {editingRecord ? 'Edit Electricity Billing Record' : 'Log Scope 2 Purchased Electricity'}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Grid energy consumption and clean rooftop solar generation offset
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

            {/* Body */}
            <form id="scope2-form" onSubmit={handleSaveRecord} className="p-6 overflow-y-auto space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700 uppercase tracking-wider">
                      Facility / CSC *
                    </label>
                    {isFacilityUser && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                        🔒 Assigned CSC
                      </span>
                    )}
                  </div>
                  <select
                    value={facilityId}
                    onChange={(e) => handleFacilityChange(e.target.value)}
                    disabled={isFacilityUser && scopedFacilities.length === 1}
                    className={`w-full px-3 py-2 border rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isFacilityUser && scopedFacilities.length === 1 
                        ? 'bg-slate-100 border-slate-200 cursor-not-allowed text-slate-600' 
                        : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    {scopedFacilities.map(fac => (
                      <option key={fac.id} value={fac.id}>
                        {fac.name} ({fac.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Billing Period Month *
                  </label>
                  <select
                    value={reportingMonth}
                    onChange={(e) => setReportingMonth(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {MONTH_NAMES.map((m, idx) => (
                      <option key={idx + 1} value={idx + 1}>
                        {m} ({selectedYear})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    CEB Utility Account Number
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="e.g. ACC-011-3341"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Energy Meter Serial Number
                  </label>
                  <input
                    type="text"
                    value={meterNumber}
                    onChange={(e) => setMeterNumber(e.target.value)}
                    placeholder="e.g. MTR-994821"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Grid Electricity Consumed (kWh) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={gridElectricityKWh}
                    onChange={(e) => setGridElectricityKWh(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Rooftop Solar Generated (kWh)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={solarGenerationKWh}
                    onChange={(e) => setSolarGenerationKWh(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-emerald-50/70 border border-emerald-300 rounded-xl text-emerald-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Read-Only Auto-Fetched Grid Emission Factor */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Grid Emission Factor (kg CO₂e / kWh) *
                  </label>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-700" /> Auto-Fetched Factor (Read-Only)
                  </span>
                </div>
                <input
                  type="number"
                  value={gridFactor}
                  readOnly
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-800 font-mono font-black text-sm cursor-not-allowed select-none"
                />
                <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Info className="w-3 h-3 text-slate-400" />
                    <span>Authority Benchmark: {gridFactorSource}</span>
                  </span>
                  <span className="text-emerald-700 font-medium">Synchronized with Emission Factors Library</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Total Utility Cost (LKR)
                  </label>
                  <input
                    type="number"
                    step="100"
                    value={costLKR}
                    onChange={(e) => setCostLKR(Number(e.target.value))}
                    placeholder="e.g. 150000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Invoice Notes / Tariff
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. General Commercial Tariff GP-1"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Realtime Calculated Emission Preview */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl grid grid-cols-2 gap-4">
                <div>
                  <span className="font-bold text-blue-900 uppercase text-[10px] block">
                    Gross Grid Carbon Output
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xl font-black text-blue-700 font-mono">
                      {calculatedOutputs.grossTons.toFixed(3)}
                    </span>
                    <span className="text-xs font-bold text-blue-800">tCO₂e</span>
                  </div>
                  <div className="text-[10px] text-blue-600 font-mono mt-0.5">
                    {calculatedOutputs.grossKg.toLocaleString()} kg CO₂e
                  </div>
                </div>

                <div>
                  <span className="font-bold text-emerald-900 uppercase text-[10px] block">
                    Solar Clean Energy Offset
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xl font-black text-emerald-700 font-mono">
                      -{calculatedOutputs.solarOffsetTons.toFixed(3)}
                    </span>
                    <span className="text-xs font-bold text-emerald-800">tCO₂e</span>
                  </div>
                  <div className="text-[10px] text-emerald-600 font-mono mt-0.5">
                    Net: {calculatedOutputs.netTons.toFixed(3)} tCO₂e
                  </div>
                </div>
              </div>

            </form>

            {/* Footer */}
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
                form="scope2-form"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow transition cursor-pointer"
              >
                {editingRecord ? 'Save Changes' : 'Log Electricity Bill'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

