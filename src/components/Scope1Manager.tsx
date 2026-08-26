import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Scope1Record, Scope1Category, EmissionFactor } from '../types';
import { api } from '../services/api';
import { supabase, toScope1Row, fromScope1Row, fromEmissionFactorRow } from '../services/supabase';
import { 
  Flame, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  X, 
  Truck, 
  Building2, 
  Lock,
  RefreshCw,
  Info
} from 'lucide-react';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Fallback factors if database is initialising
const DEFAULT_S1_FACTORS: Record<string, { factor: number; unit: string; source: string }> = {
  'Diesel': { factor: 2.6878, unit: 'Liters', source: 'IPCC 2006 / SLSEA Guidelines' },
  'Auto Diesel': { factor: 2.6878, unit: 'Liters', source: 'IPCC 2006 / SLSEA Guidelines' },
  'Super Diesel': { factor: 2.6878, unit: 'Liters', source: 'IPCC 2006 / SLSEA Guidelines' },
  'Petrol': { factor: 2.3149, unit: 'Liters', source: 'DEFRA / IPCC 2006 Mobile Combustion' },
  'Petrol / Gasoline': { factor: 2.3149, unit: 'Liters', source: 'DEFRA / IPCC 2006 Mobile Combustion' },
  'Heavy Fuel Oil': { factor: 3.1780, unit: 'Liters', source: 'IPCC 2006 Stationary Guidelines' },
  'Furnace Oil': { factor: 3.1780, unit: 'Liters', source: 'IPCC 2006 Stationary Guidelines' },
  'LPG': { factor: 1.5120, unit: 'Liters', source: 'IPCC 2006 Guidelines' },
  'SF6': { factor: 22800.0, unit: 'kg', source: 'IPCC AR4/AR5 GWP Factor' },
  'R410A': { factor: 2088.0, unit: 'kg', source: 'IPCC AR4 GWP Factor' },
  'R134a': { factor: 1430.0, unit: 'kg', source: 'IPCC AR4 GWP Factor' },
  'R22': { factor: 1810.0, unit: 'kg', source: 'IPCC AR4 GWP Factor' }
};

export const Scope1Manager: React.FC = () => {
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

  const [records, setRecords] = useState<Scope1Record[]>([]);
  const [emissionFactors, setEmissionFactors] = useState<EmissionFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [factorsLoading, setFactorsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Scope1Record | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form Fields
  const [facilityId, setFacilityId] = useState<string>('');
  const [reportingMonth, setReportingMonth] = useState<number>(1);
  const [category, setCategory] = useState<Scope1Category>('stationary_generator');
  const [sourceName, setSourceName] = useState<string>('Main Backup Generator 100kVA');
  const [fuelType, setFuelType] = useState<string>('Diesel');
  const [quantity, setQuantity] = useState<number>(100);
  const [unit, setUnit] = useState<string>('Liters');
  const [vehicleNumber, setVehicleNumber] = useState<string>('');
  const [vehicleType, setVehicleType] = useState<string>('Lorry');
  const [gasType, setGasType] = useState<string>('SF6');
  const [initialChargeKg, setInitialChargeKg] = useState<number>(0);
  const [leakedKg, setLeakedKg] = useState<number>(0);
  const [currentFactor, setCurrentFactor] = useState<number>(2.6878);
  const [currentFactorSource, setCurrentFactorSource] = useState<string>('IPCC 2006 / SLSEA Guidelines');
  const [notes, setNotes] = useState<string>('');

  const scopedFacilities = getScopedFacilities();

  // 1. Fetch Emission Factors on Mount
  const fetchEmissionFactors = async () => {
    setFactorsLoading(true);
    try {
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('emission_factors')
            .select('*')
            .order('category', { ascending: true });

          if (!error && data && data.length > 0) {
            setEmissionFactors(data.map(fromEmissionFactorRow));
            setFactorsLoading(false);
            return;
          }
        } catch (sbErr) {
          console.warn('Supabase fetch emission factors in Scope 1:', sbErr);
        }
      }

      const data = await api.getEmissionFactors();
      setEmissionFactors(data || []);
    } catch (err) {
      console.warn('Failed to load emission factors for Scope 1:', err);
    } finally {
      setFactorsLoading(false);
    }
  };

  // 2. Fetch Scope 1 Records
  const fetchRecords = async () => {
    setLoading(true);
    try {
      if (supabase) {
        try {
          let query = supabase.from('scope1_records').select('*').order('reporting_month', { ascending: true });
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
            setRecords(data.map(fromScope1Row));
            setLoading(false);
            return;
          }
        } catch (sbErr) {
          console.warn('Supabase fetch Scope1 notice:', sbErr);
        }
      }

      const data = await api.getScope1(selectedYear, selectedFacilityId);
      setRecords(data);
    } catch (err) {
      console.error('Error fetching Scope 1 records:', err);
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

  // Helper to find exact matching emission factor from active library
  const resolveFactor = (cat: Scope1Category, fuel: string, gas: string) => {
    if (cat === 'fugitive_sf6') {
      const match = emissionFactors.find(f => 
        (f.name && f.name.toLowerCase().includes('sf6')) || 
        (f.fuel_or_material && f.fuel_or_material.toLowerCase().includes('sf6'))
      );
      if (match) {
        return {
          factor: Number(match.factor ?? match.factor_kg_co2e ?? 22800),
          source: match.source || match.referenceSource || 'IPCC AR4/AR5 GWP Factor',
          unit: match.unit?.split('/')[1]?.trim() || 'kg'
        };
      }
      return { factor: 22800, source: 'IPCC AR4/AR5 GWP Factor (22,800 kg CO₂e/kg)', unit: 'kg' };
    }

    if (cat === 'fugitive_refrigerant') {
      const targetGas = (gas || 'R410A').toLowerCase();
      const match = emissionFactors.find(f => {
        const n = (f.name || f.fuel_or_material || '').toLowerCase();
        return n.includes(targetGas);
      });
      if (match) {
        return {
          factor: Number(match.factor ?? match.factor_kg_co2e ?? 2088),
          source: match.source || match.referenceSource || 'IPCC AR4 GWP Factor',
          unit: match.unit?.split('/')[1]?.trim() || 'kg'
        };
      }
      const fallback = DEFAULT_S1_FACTORS[gas] || { factor: 2088, unit: 'kg', source: 'IPCC AR4 GWP Factor' };
      return { factor: fallback.factor, source: fallback.source, unit: fallback.unit };
    }

    // Fuel Combustion (stationary or mobile)
    const targetFuel = (fuel || 'Diesel').toLowerCase();
    const match = emissionFactors.find(f => {
      if (f.category !== 'Scope 1') return false;
      const n = (f.name || f.fuel_or_material || '').toLowerCase();
      const sub = (f.subCategory || '').toLowerCase();
      
      if (cat === 'stationary_generator') {
        if (targetFuel.includes('diesel') && (n.includes('industrial generator') || n.includes('stationary'))) return true;
        if (targetFuel.includes('heavy fuel') && n.includes('heavy fuel')) return true;
        if (targetFuel.includes('lpg') && n.includes('lpg')) return true;
      } else if (cat === 'mobile_fleet') {
        if (targetFuel.includes('diesel') && (n.includes('commercial') || n.includes('mobile') || n.includes('truck'))) return true;
        if (targetFuel.includes('petrol') && (n.includes('petrol') || n.includes('gasoline'))) return true;
      }
      return n.includes(targetFuel);
    });

    if (match) {
      return {
        factor: Number(match.factor ?? match.factor_kg_co2e ?? 2.6878),
        source: match.source || match.referenceSource || 'IPCC 2006 Guidelines',
        unit: 'Liters'
      };
    }

    // Fallback default
    const fallback = DEFAULT_S1_FACTORS[fuel] || (targetFuel.includes('petrol') ? DEFAULT_S1_FACTORS['Petrol'] : DEFAULT_S1_FACTORS['Diesel']);
    return { factor: fallback.factor, source: fallback.source, unit: fallback.unit };
  };

  // Auto-update factor when category, fuelType, or gasType changes
  useEffect(() => {
    if (isModalOpen) {
      const resolved = resolveFactor(category, fuelType, gasType);
      setCurrentFactor(resolved.factor);
      setCurrentFactorSource(resolved.source);
      if (category === 'fugitive_sf6' || category === 'fugitive_refrigerant') {
        setUnit('kg');
      } else {
        setUnit(resolved.unit || 'Liters');
      }
    }
  }, [category, fuelType, gasType, isModalOpen, emissionFactors]);

  const openAddModal = () => {
    const defaultFacId = (selectedFacilityId !== 'ALL' && selectedFacilityId) 
      ? selectedFacilityId 
      : (user?.facilityId || scopedFacilities[0]?.id || '');
    
    const initialCategory: Scope1Category = 'stationary_generator';
    const initialFuel = 'Diesel';
    const resolved = resolveFactor(initialCategory, initialFuel, 'SF6');

    setEditingRecord(null);
    setFacilityId(defaultFacId);
    setReportingMonth(new Date().getMonth() + 1);
    setCategory(initialCategory);
    setSourceName('Emergency Diesel Generator 150 kVA');
    setFuelType(initialFuel);
    setQuantity(200);
    setUnit(resolved.unit);
    setVehicleNumber('');
    setVehicleType('Lorry');
    setGasType('SF6');
    setInitialChargeKg(10);
    setLeakedKg(0.2);
    setCurrentFactor(resolved.factor);
    setCurrentFactorSource(resolved.source);
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (r: Scope1Record) => {
    setEditingRecord(r);
    setFacilityId(r.facilityId);
    setReportingMonth(r.reportingMonth);
    setCategory(r.category);
    setSourceName(r.sourceName);
    setFuelType(r.fuelType || 'Diesel');
    setQuantity(r.quantity);
    setUnit(r.unit);
    setVehicleNumber(r.vehicleNumber || '');
    setVehicleType(r.vehicleType || 'Lorry');
    setGasType(r.gasType || 'SF6');
    setInitialChargeKg(r.initialChargeKg || 0);
    setLeakedKg(r.leakedKg || 0);
    
    // Use stored factor or auto-resolve if missing
    const resolved = resolveFactor(r.category, r.fuelType || 'Diesel', r.gasType || 'SF6');
    setCurrentFactor(r.emissionFactorUsed || resolved.factor);
    setCurrentFactorSource(resolved.source);
    setNotes(r.notes || '');
    setIsModalOpen(true);
  };

  // Real-time calculation using dynamically fetched factor
  const calculatedOutputs = useMemo(() => {
    let kgCO2e = 0;
    if (category === 'fugitive_sf6' || category === 'fugitive_refrigerant') {
      kgCO2e = (Number(leakedKg) || 0) * currentFactor;
    } else {
      kgCO2e = (Number(quantity) || 0) * currentFactor;
    }
    const tCO2e = Number((kgCO2e / 1000).toFixed(4));
    return { kgCO2e: Number(kgCO2e.toFixed(2)), tCO2e };
  }, [category, quantity, leakedKg, currentFactor]);

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityId) {
      notify('Please select a facility for this emission record', 'error');
      return;
    }

    const targetFac = facilities.find(f => f.id === facilityId);
    const calculatedTons = calculatedOutputs.tCO2e;

    const payload: Partial<Scope1Record> = {
      facilityId,
      facilityName: targetFac?.name || 'Facility',
      reportingYear: selectedYear,
      reportingMonth: Number(reportingMonth),
      category,
      sourceName: sourceName.trim(),
      fuelType: (category === 'stationary_generator' || category === 'mobile_fleet') ? fuelType : undefined,
      quantity: (category === 'stationary_generator' || category === 'mobile_fleet') ? Number(quantity) : 0,
      unit,
      vehicleNumber: category === 'mobile_fleet' ? vehicleNumber.trim() : undefined,
      vehicleType: category === 'mobile_fleet' ? vehicleType : undefined,
      gasType: (category === 'fugitive_sf6' || category === 'fugitive_refrigerant') ? gasType : undefined,
      initialChargeKg: (category === 'fugitive_sf6' || category === 'fugitive_refrigerant') ? Number(initialChargeKg) : undefined,
      leakedKg: (category === 'fugitive_sf6' || category === 'fugitive_refrigerant') ? Number(leakedKg) : undefined,
      gwp: (category === 'fugitive_sf6' || category === 'fugitive_refrigerant') ? Number(currentFactor) : undefined,
      emissionFactorUsed: Number(currentFactor),
      emissionsTonsCO2e: calculatedTons,
      notes: notes.trim()
    };

    try {
      if (editingRecord) {
        if (supabase) {
          try {
            const { error: sbErr } = await supabase
              .from('scope1_records')
              .update(toScope1Row(payload))
              .eq('id', editingRecord.id);
            if (sbErr) console.warn('Supabase Scope 1 update notice:', sbErr);
          } catch (e) {
            console.warn('Supabase Scope 1 update error:', e);
          }
        }

        await api.updateScope1(editingRecord.id, payload);
        notify('Scope 1 direct emission record updated successfully!', 'success');
      } else {
        const newRecordId = `s1-${Date.now().toString(36)}`;
        const newRecord = {
          ...payload,
          id: newRecordId,
          createdById: user?.id,
          createdByName: user?.name
        };

        if (supabase) {
          try {
            const { error: sbErr } = await supabase
              .from('scope1_records')
              .insert([toScope1Row(newRecord)]);
            if (sbErr) console.warn('Supabase Scope 1 insert notice:', sbErr);
          } catch (e) {
            console.warn('Supabase Scope 1 insert error:', e);
          }
        }

        await api.createScope1(newRecord);
        notify('Scope 1 emission record logged successfully!', 'success');
      }
      setIsModalOpen(false);
      await fetchRecords();
    } catch (err: any) {
      notify(err.message || 'Failed to save record', 'error');
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
            .from('scope1_records')
            .delete()
            .eq('id', id);
          if (sbErr) console.warn('Supabase Scope 1 delete notice:', sbErr);
        } catch (e) {
          console.warn('Supabase Scope 1 delete error:', e);
        }
      }

      await api.deleteScope1(id);
      notify('Scope 1 record removed successfully', 'success');
      setDeleteConfirmId(null);
      await fetchRecords();
    } catch (err: any) {
      notify(err.message || 'Failed to delete record', 'error');
    }
  };

  const totalScope1Tons = records.reduce((acc, r) => acc + (r.emissionsTonsCO2e || 0), 0);

  const filteredRecords = records.filter(r => {
    const matchesSearch = (r.sourceName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (r.facilityName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (r.vehicleNumber && r.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'ALL' || r.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase tracking-wider">
            <Flame className="w-4 h-4" />
            <span>Scope 1 Direct GHG Inventory &bull; FY {selectedYear}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Direct Fuel Combustion, Fleet & SF₆ Fugitive Emissions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log backup diesel generator runtime, fleet vehicles, and high-voltage substation SF₆ gas top-ups with database-governed emission factors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-500 uppercase">Filtered Scope 1 Total</div>
            <div className="text-xl font-black text-orange-600">{totalScope1Tons.toFixed(2)} tCO₂e</div>
          </div>
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log Scope 1 Activity</span>
          </button>
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
            placeholder="Search by source, facility, vehicle..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['ALL', 'stationary_generator', 'mobile_fleet', 'fugitive_sf6', 'fugitive_refrigerant'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'All Sources' : 
               cat === 'stationary_generator' ? '⚡ Generators' :
               cat === 'mobile_fleet' ? '🚛 Mobile Fleet' :
               cat === 'fugitive_sf6' ? '🛡️ SF₆ Gas' : '❄️ Refrigerants'}
            </button>
          ))}
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
                <th className="py-3.5 px-4">Category & Source</th>
                <th className="py-3.5 px-4">Fuel / Gas Detail</th>
                <th className="py-3.5 px-4 text-right">Activity Quantity</th>
                <th className="py-3.5 px-4 text-right">Factor Used</th>
                <th className="py-3.5 px-4 text-right font-black text-slate-900">Emissions (tCO₂e)</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No Scope 1 emission records found for the active filter. Click "Log Scope 1 Activity" to record data.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    
                    {/* Period */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {MONTH_NAMES[r.reportingMonth - 1]} {r.reportingYear}
                    </td>

                    {/* Facility */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{r.facilityName}</span>
                      </div>
                    </td>

                    {/* Category & Source */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{r.sourceName}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">
                        {r.category.replace('_', ' ')}
                      </div>
                    </td>

                    {/* Fuel / Gas Detail */}
                    <td className="py-3.5 px-4">
                      {r.category === 'mobile_fleet' ? (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Truck className="w-3.5 h-3.5 text-slate-400" />
                          <span>{r.vehicleNumber || 'LECO Fleet'} ({r.vehicleType})</span>
                        </div>
                      ) : r.category === 'fugitive_sf6' ? (
                        <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-mono font-bold">
                          SF₆ Switchgear (GWP {r.emissionFactorUsed || 22800})
                        </span>
                      ) : (
                        <span className="text-slate-600 font-medium">
                          {r.fuelType} Fuel
                        </span>
                      )}
                    </td>

                    {/* Quantity */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      {r.category === 'fugitive_sf6' || r.category === 'fugitive_refrigerant' ? (
                        <span>{r.leakedKg ?? 0} kg top-up</span>
                      ) : (
                        <span>{(r.quantity ?? 0).toLocaleString()} {r.unit}</span>
                      )}
                    </td>

                    {/* Factor Used */}
                    <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold">
                        {r.emissionFactorUsed ? Number(r.emissionFactorUsed).toFixed(4).replace(/\.?0+$/, '') : '2.6878'}
                      </span>
                    </td>

                    {/* Emissions */}
                    <td className="py-3.5 px-4 text-right font-mono font-black text-orange-600 bg-orange-50/30">
                      {(r.emissionsTonsCO2e ?? (r as any).totalEmissionsTonsCO2e ?? 0).toFixed(3)}
                    </td>

                    {/* Actions */}
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
            <h3 className="text-base font-bold text-slate-900">Delete Emission Record</h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to permanently delete this Scope 1 record? Total inventory tallies will be automatically recalculated.
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
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    {editingRecord ? 'Edit Scope 1 Emission Record' : 'Log Direct Scope 1 GHG Activity'}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Stationary combustion, mobile fleet fuels, and SF₆ switchgear gas leakage
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
            <form id="scope1-form" onSubmit={handleSaveRecord} className="p-6 overflow-y-auto space-y-4 text-xs">
              
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
                    onChange={(e) => setFacilityId(e.target.value)}
                    disabled={isFacilityUser && scopedFacilities.length === 1}
                    className={`w-full px-3 py-2 border rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 ${
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
                    Reporting Month *
                  </label>
                  <select
                    value={reportingMonth}
                    onChange={(e) => setReportingMonth(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                    Source Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      const cat = e.target.value as Scope1Category;
                      setCategory(cat);
                      if (cat === 'stationary_generator') setSourceName('Emergency Diesel Generator');
                      if (cat === 'mobile_fleet') setSourceName('Breakdown Support Lorry');
                      if (cat === 'fugitive_sf6') setSourceName('33kV Substation GIS Switchgear');
                      if (cat === 'fugitive_refrigerant') setSourceName('HQ Server Room HVAC Unit');
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="stationary_generator">Stationary Diesel Generator (Backup Power)</option>
                    <option value="mobile_fleet">Mobile Fleet Vehicle (Lorry / Van / Boom Truck)</option>
                    <option value="fugitive_sf6">Fugitive SF₆ Gas (Circuit Breaker / Switchgear)</option>
                    <option value="fugitive_refrigerant">Fugitive HVAC Refrigerant (R410A / R134a)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Equipment / Asset Description *
                  </label>
                  <input
                    type="text"
                    required
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    placeholder="e.g. 150 kVA Standby Generator"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Dynamic Sub-sections */}
              {category === 'mobile_fleet' && (
                <div className="p-3.5 bg-orange-50/60 border border-orange-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Vehicle Registration Number</label>
                    <input
                      type="text"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      placeholder="e.g. WP LE-4589"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Vehicle Classification</label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                    >
                      <option value="Lorry">Heavy / Medium Lorry</option>
                      <option value="Van">Crew Van / Cab</option>
                      <option value="Boom Truck">Hydraulic Boom Truck</option>
                      <option value="Motorcycle">Inspection Motorcycle</option>
                    </select>
                  </div>
                </div>
              )}

              {(category === 'fugitive_sf6' || category === 'fugitive_refrigerant') ? (
                <div className="space-y-3 p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        {category === 'fugitive_sf6' ? 'Fugitive Gas Type' : 'Refrigerant Type'}
                      </label>
                      {category === 'fugitive_sf6' ? (
                        <select
                          value={gasType}
                          onChange={(e) => setGasType(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono font-bold"
                        >
                          <option value="SF6">SF₆ (Sulfur Hexafluoride - Switchgear)</option>
                        </select>
                      ) : (
                        <select
                          value={gasType}
                          onChange={(e) => setGasType(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono font-bold"
                        >
                          <option value="R410A">R410A Refrigerant</option>
                          <option value="R134a">R134a Refrigerant</option>
                          <option value="R22">R22 Refrigerant</option>
                        </select>
                      )}
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Top-Up Leakage (kg) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={leakedKg}
                        onChange={(e) => setLeakedKg(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* Disabled Emission Factor Auto-Fetched from Library */}
                  <div className="bg-white/80 p-3 rounded-lg border border-amber-200">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                        Auto-Fetched GWP Factor (kg CO₂e / kg) *
                      </label>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold inline-flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Auto-Fetched Factor (Read-Only)
                      </span>
                    </div>
                    <input
                      type="number"
                      value={currentFactor}
                      readOnly
                      disabled
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 font-mono font-black text-sm cursor-not-allowed select-none"
                    />
                    <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                      <Info className="w-3 h-3 text-slate-400" />
                      <span>Authority Standard: {currentFactorSource}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Fuel Type *
                      </label>
                      <select
                        value={fuelType}
                        onChange={(e) => setFuelType(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="Diesel">Auto Diesel (Generator / Trucks)</option>
                        <option value="Super Diesel">Super Diesel (Euro 4)</option>
                        <option value="Heavy Fuel Oil">Heavy Fuel Oil (Furnace Oil)</option>
                        <option value="LPG">LPG (Liquid Petroleum Gas)</option>
                        <option value="Petrol">Petrol / Gasoline (Vans & Cycles)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Consumed Quantity *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Unit
                      </label>
                      <input
                        type="text"
                        value={unit}
                        readOnly
                        disabled
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-mono cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Auto-Fetched Read-Only Emission Factor */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                        Governing Emission Factor (kg CO₂e / {unit}) *
                      </label>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1">
                        <Lock className="w-3 h-3 text-emerald-700" /> Auto-Fetched Factor (Read-Only)
                      </span>
                    </div>
                    <input
                      type="number"
                      value={currentFactor}
                      readOnly
                      disabled
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-800 font-mono font-black text-sm cursor-not-allowed select-none"
                    />
                    <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                      <span>Source: {currentFactorSource}</span>
                      <span className="text-emerald-700 font-medium">Synchronized with Emission Factors Library</span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Log Notes / Fuel Invoice Reference
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Monthly maintenance run + Emergency storm outage support"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Realtime Calculated Emission Preview */}
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-orange-900 uppercase text-[11px] block">
                    Calculated Greenhouse Gas Output
                  </span>
                  <span className="text-[11px] text-orange-800">
                    Formula: Activity Quantity &times; {currentFactor} kg CO₂e / 1,000
                  </span>
                  <div className="text-[11px] text-orange-700 font-mono mt-0.5">
                    {calculatedOutputs.kgCO2e.toLocaleString()} kg CO₂e Total
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-orange-600 font-mono">
                    {calculatedOutputs.tCO2e.toFixed(3)}
                  </span>
                  <span className="text-xs font-bold text-orange-800 ml-1">tCO₂e</span>
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
                form="scope1-form"
                className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl shadow transition cursor-pointer"
              >
                {editingRecord ? 'Save Changes' : 'Log Activity'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

