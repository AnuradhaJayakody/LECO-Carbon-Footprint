import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Scope3Record, Scope3Category, EmissionFactor } from '../types';
import { api } from '../services/api';
import { supabase, toScope3Row, fromScope3Row, fromEmissionFactorRow } from '../services/supabase';
import { 
  Network, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  X, 
  Building2, 
  Lock,
  Info,
  RefreshCw
} from 'lucide-react';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface Scope3Preset {
  id: string;
  category: Scope3Category;
  name: string;
  factorTonsPerUnit: number;
  unit: string;
  source: string;
  defaultQty: number;
}

const DEFAULT_SCOPE3_PRESETS: Scope3Preset[] = [
  {
    id: 'p1',
    category: 'purchased_goods',
    name: 'Smart Single-Phase Electricity Meters (LHM)',
    factorTonsPerUnit: 0.0085, // 8.5 kg CO2e / unit = 0.0085 tCO2e
    unit: 'Units',
    source: 'LECO Meter Factory LCA Study / DEFRA',
    defaultQty: 500
  },
  {
    id: 'p2',
    category: 'purchased_goods',
    name: 'Distribution Transformers 100kVA - 250kVA',
    factorTonsPerUnit: 0.420, // 420 kg CO2e per unit
    unit: 'Units',
    source: 'LECO LCA Environmental Assessment 2023',
    defaultQty: 10
  },
  {
    id: 'p3',
    category: 'purchased_goods',
    name: 'A4 Office Copy Paper (Reams)',
    factorTonsPerUnit: 0.00095, // 0.95 kg CO2e / kg
    unit: 'kg',
    source: 'DEFRA 2024 Material Use',
    defaultQty: 150
  },
  {
    id: 'p4',
    category: 'purchased_goods',
    name: 'Aerial Bundled Cables (ABC) & Conductors',
    factorTonsPerUnit: 0.0021, // 2.1 kg CO2e / meter
    unit: 'Meters',
    source: 'DEFRA 2024 / IPCC Embodied Carbon Guidelines',
    defaultQty: 1000
  },
  {
    id: 'p5',
    category: 'capital_goods',
    name: 'Primary Substation GIS & Switchgear Assemblies',
    factorTonsPerUnit: 4.500, // 4.5 tCO2e per bay/unit
    unit: 'Units',
    source: 'LECO Capital Equipment Carbon Inventory',
    defaultQty: 2
  },
  {
    id: 'p6',
    category: 'capital_goods',
    name: 'Concrete Transmission & Distribution Poles',
    factorTonsPerUnit: 0.185, // 185 kg CO2e per pole
    unit: 'Units',
    source: 'SLSEA Embodied Construction Standards',
    defaultQty: 50
  },
  {
    id: 'p7',
    category: 'business_travel',
    name: 'Domestic & Regional Business Travel (Air & Road)',
    factorTonsPerUnit: 0.00017, // 0.170 kg CO2e / pass-km
    unit: 'Passenger-km',
    source: 'DEFRA 2024 Business Travel Guidelines',
    defaultQty: 1200
  },
  {
    id: 'p8',
    category: 'employee_commuting',
    name: 'Daily Staff Commuting (Motorbike, Bus, Train blend)',
    factorTonsPerUnit: 0.000089, // 0.089 kg CO2e / pass-km
    unit: 'Passenger-km',
    source: 'DEFRA 2024 / SLSEA Commuting Factors',
    defaultQty: 4500
  },
  {
    id: 'p9',
    category: 'waste_generated',
    name: 'Municipal Solid Waste & Operational Landfill',
    factorTonsPerUnit: 0.00052, // 0.520 kg CO2e / kg
    unit: 'kg',
    source: 'DEFRA 2024 Waste Disposal Standards',
    defaultQty: 800
  },
  {
    id: 'p10',
    category: 'waste_generated',
    name: 'Recycled Copper Wire & Metallic Scrap',
    factorTonsPerUnit: 0.00045, // 0.450 kg CO2e / kg
    unit: 'kg',
    source: 'IPCC Waste Treatment Guidelines',
    defaultQty: 300
  },
  {
    id: 'p11',
    category: 'upstream_logistics',
    name: 'Central Stores to Regional CSC Heavy Freight Transport',
    factorTonsPerUnit: 0.00012, // 0.120 kg CO2e / tonne-km
    unit: 'Tonne-km',
    source: 'DEFRA 2024 Freight Logistics Factor',
    defaultQty: 2500
  }
];

export const Scope3Manager: React.FC = () => {
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

  const [records, setRecords] = useState<Scope3Record[]>([]);
  const [emissionFactors, setEmissionFactors] = useState<EmissionFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [factorsLoading, setFactorsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Scope3Record | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form Fields
  const [facilityId, setFacilityId] = useState<string>('');
  const [reportingMonth, setReportingMonth] = useState<number>(1);
  const [category, setCategory] = useState<Scope3Category>('purchased_goods');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('p1');
  const [itemName, setItemName] = useState<string>('Smart Single-Phase Electricity Meters (LHM)');
  const [supplierName, setSupplierName] = useState<string>('LECO Meter Testing & Assembly Factory');
  const [quantity, setQuantity] = useState<number>(500);
  const [unit, setUnit] = useState<string>('Units');
  const [factorUsed, setFactorUsed] = useState<number>(0.0085);
  const [factorSource, setFactorSource] = useState<string>('LECO Meter Factory LCA Study / DEFRA');
  const [notes, setNotes] = useState<string>('');

  const scopedFacilities = getScopedFacilities();

  // 1. Fetch Active Emission Factors from Supabase
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
          console.warn('Supabase fetch emission factors in Scope 3:', sbErr);
        }
      }

      const data = await api.getEmissionFactors();
      setEmissionFactors(data || []);
    } catch (err) {
      console.warn('Failed to load emission factors for Scope 3:', err);
    } finally {
      setFactorsLoading(false);
    }
  };

  // 2. Fetch Scope 3 Records
  const fetchRecords = async () => {
    setLoading(true);
    try {
      if (supabase) {
        try {
          let query = supabase.from('scope3_records').select('*').order('reporting_month', { ascending: true });
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
            setRecords(data.map(fromScope3Row));
            setLoading(false);
            return;
          }
        } catch (sbErr) {
          console.warn('Supabase fetch Scope3 notice:', sbErr);
        }
      }

      const data = await api.getScope3(selectedYear, selectedFacilityId);
      setRecords(data);
    } catch (err) {
      console.error('Error fetching Scope 3 records:', err);
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

  // Helper to map Scope3Category enum to emission factor category key
  const getCategoryKey = (cat: Scope3Category): string => {
    switch (cat) {
      case 'purchased_goods': return 'Scope 3 - Category 1: Purchased Goods & Equipment';
      case 'capital_goods': return 'Scope 3 - Category 2: Capital Goods';
      case 'business_travel': return 'Scope 3 - Category 6: Business Travel';
      case 'employee_commuting': return 'Scope 3 - Category 7: Employee Commuting';
      case 'waste_generated': return 'Scope 3 - Category 5: Waste in Operations';
      case 'upstream_logistics': return 'Scope 3 - Category 4: Upstream Freight & Distribution';
      default: return 'Scope 3';
    }
  };

  // Dynamic filtering of active emission factors for the selected Scope 3 Category
  const availableItems: Scope3Preset[] = useMemo(() => {
    const targetKey = getCategoryKey(category);
    const matchedFromDb = emissionFactors.filter(f => {
      if (f.category === targetKey) return true;
      const catStr = (f.category || '').toLowerCase();
      if (!catStr.includes('scope 3') && !catStr.includes('category')) return false;

      if (category === 'purchased_goods' && (catStr.includes('category 1') || catStr.includes('purchased'))) return true;
      if (category === 'capital_goods' && (catStr.includes('category 2') || catStr.includes('capital'))) return true;
      if (category === 'business_travel' && (catStr.includes('category 6') || catStr.includes('travel'))) return true;
      if (category === 'employee_commuting' && (catStr.includes('category 7') || catStr.includes('commuting'))) return true;
      if (category === 'waste_generated' && (catStr.includes('category 5') || catStr.includes('waste'))) return true;
      if (category === 'upstream_logistics' && (catStr.includes('category 4') || catStr.includes('freight') || catStr.includes('logistics') || catStr.includes('upstream'))) return true;
      return false;
    });

    if (matchedFromDb.length > 0) {
      return matchedFromDb.map(f => {
        const rawFactor = Number(f.factor ?? f.factor_kg_co2e ?? 0);
        // If rawFactor is in kg CO2e, convert to tCO2e for formula (kg / 1000) if rawFactor > 0.05 or unit is kg/unit
        // Usually factor_kg_co2e is in kg CO2e. Convert to tCO2e per unit:
        const factorTonsPerUnit = rawFactor >= 0.01 ? Number((rawFactor / 1000).toFixed(6)) : rawFactor;
        return {
          id: f.id || f.name,
          category,
          name: f.name || f.fuel_or_material,
          factorTonsPerUnit: factorTonsPerUnit || 0.001,
          unit: f.unit || 'Units',
          source: f.source || f.referenceSource || 'IPCC / DEFRA / SLSEA Standard',
          defaultQty: 100
        };
      });
    }

    return DEFAULT_SCOPE3_PRESETS.filter(p => p.category === category);
  }, [category, emissionFactors]);

  const handleCategoryChange = (cat: Scope3Category) => {
    setCategory(cat);
    const targetKey = getCategoryKey(cat);
    const matchedFromDb = emissionFactors.filter(f => {
      if (f.category === targetKey) return true;
      const catStr = (f.category || '').toLowerCase();
      if (!catStr.includes('scope 3') && !catStr.includes('category')) return false;
      if (cat === 'purchased_goods' && (catStr.includes('category 1') || catStr.includes('purchased'))) return true;
      if (cat === 'capital_goods' && (catStr.includes('category 2') || catStr.includes('capital'))) return true;
      if (cat === 'business_travel' && (catStr.includes('category 6') || catStr.includes('travel'))) return true;
      if (cat === 'employee_commuting' && (catStr.includes('category 7') || catStr.includes('commuting'))) return true;
      if (cat === 'waste_generated' && (catStr.includes('category 5') || catStr.includes('waste'))) return true;
      if (cat === 'upstream_logistics' && (catStr.includes('category 4') || catStr.includes('freight') || catStr.includes('logistics') || catStr.includes('upstream'))) return true;
      return false;
    });

    if (matchedFromDb.length > 0) {
      const first = matchedFromDb[0];
      const rawFactor = Number(first.factor ?? first.factor_kg_co2e ?? 0);
      const factorTons = rawFactor >= 0.01 ? Number((rawFactor / 1000).toFixed(6)) : rawFactor;
      setSelectedPresetId(first.id || first.name);
      setItemName(first.name || first.fuel_or_material);
      setUnit(first.unit || 'Units');
      setFactorUsed(factorTons || 0.001);
      setFactorSource(first.source || first.referenceSource || 'IPCC / SLSEA');
      setQuantity(100);
      return;
    }

    const presetsForCat = DEFAULT_SCOPE3_PRESETS.filter(p => p.category === cat);
    if (presetsForCat.length > 0) {
      const first = presetsForCat[0];
      setSelectedPresetId(first.id);
      setItemName(first.name);
      setUnit(first.unit);
      setFactorUsed(first.factorTonsPerUnit);
      setFactorSource(first.source);
      setQuantity(first.defaultQty);
    }
  };

  const handlePresetSelect = (presetId: string) => {
    setSelectedPresetId(presetId);
    const found = availableItems.find(p => p.id === presetId);
    if (found) {
      setItemName(found.name);
      setUnit(found.unit);
      setFactorUsed(found.factorTonsPerUnit);
      setFactorSource(found.source);
      setQuantity(found.defaultQty);
    }
  };

  const openAddModal = () => {
    const defaultFacId = (selectedFacilityId !== 'ALL' && selectedFacilityId) 
      ? selectedFacilityId 
      : (user?.facilityId || scopedFacilities[0]?.id || '');
    
    setEditingRecord(null);
    setFacilityId(defaultFacId);
    setReportingMonth(new Date().getMonth() + 1);
    setCategory('purchased_goods');
    setSelectedPresetId('p1');
    setItemName('Smart Single-Phase Electricity Meters (LHM)');
    setSupplierName('LECO Meter Testing & Assembly Factory');
    setQuantity(500);
    setUnit('Units');
    setFactorUsed(0.0085);
    setFactorSource('LECO Meter Factory LCA Study / DEFRA');
    setNotes('Procured for Western Customer Service expansion');
    setIsModalOpen(true);
  };

  const openEditModal = (r: Scope3Record) => {
    setEditingRecord(r);
    setFacilityId(r.facilityId);
    setReportingMonth(r.reportingMonth);
    setCategory(r.category);
    setItemName(r.itemName);
    setSupplierName(r.supplierName || '');
    setQuantity(r.quantity);
    setUnit(r.unit);
    setFactorUsed(r.emissionFactorUsed);
    
    const matchedPreset = DEFAULT_SCOPE3_PRESETS.find(p => p.name.toLowerCase() === r.itemName.toLowerCase());
    setFactorSource(matchedPreset?.source || 'IPCC / SLSEA Official Standard');
    setNotes(r.notes || '');
    setIsModalOpen(true);
  };

  const calculateEmissions = (qty: number, ef: number): number => {
    return Number((qty * ef).toFixed(3));
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityId) {
      notify('Please select a facility for this record', 'error');
      return;
    }

    const calculatedTons = calculateEmissions(quantity, factorUsed);
    const targetFac = facilities.find(f => f.id === facilityId);

    const payload: Partial<Scope3Record> = {
      facilityId,
      facilityName: targetFac?.name || 'Facility',
      reportingYear: selectedYear,
      reportingMonth: Number(reportingMonth),
      category,
      itemName: itemName.trim(),
      supplierName: supplierName.trim(),
      quantity: Number(quantity),
      unit,
      emissionFactorUsed: Number(factorUsed),
      emissionsTonsCO2e: calculatedTons,
      notes: notes.trim()
    };

    try {
      if (editingRecord) {
        if (supabase) {
          try {
            const { error: sbErr } = await supabase
              .from('scope3_records')
              .update(toScope3Row(payload))
              .eq('id', editingRecord.id);
            if (sbErr) console.warn('Supabase Scope 3 update notice:', sbErr);
          } catch (e) {
            console.warn('Supabase Scope 3 update error:', e);
          }
        }

        await api.updateScope3(editingRecord.id, payload);
        notify('Scope 3 value chain record updated successfully!', 'success');
      } else {
        const newRecordId = `s3-${Date.now().toString(36)}`;
        const newRecord = {
          ...payload,
          id: newRecordId,
          createdById: user?.id,
          createdByName: user?.name
        };

        if (supabase) {
          try {
            const { error: sbErr } = await supabase
              .from('scope3_records')
              .insert([toScope3Row(newRecord)]);
            if (sbErr) console.warn('Supabase Scope 3 insert notice:', sbErr);
          } catch (e) {
            console.warn('Supabase Scope 3 insert error:', e);
          }
        }

        await api.createScope3(newRecord);
        notify('Scope 3 record logged successfully!', 'success');
      }
      setIsModalOpen(false);
      await fetchRecords();
    } catch (err: any) {
      notify(err.message || 'Failed to save Scope 3 record', 'error');
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
            .from('scope3_records')
            .delete()
            .eq('id', id);
          if (sbErr) console.warn('Supabase Scope 3 delete notice:', sbErr);
        } catch (e) {
          console.warn('Supabase Scope 3 delete error:', e);
        }
      }

      await api.deleteScope3(id);
      notify('Scope 3 record removed successfully', 'success');
      setDeleteConfirmId(null);
      await fetchRecords();
    } catch (err: any) {
      notify(err.message || 'Failed to delete record', 'error');
    }
  };

  const totalScope3Tons = records.reduce((acc, r) => acc + (r.emissionsTonsCO2e || 0), 0);

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.facilityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (r.supplierName && r.supplierName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'ALL' || r.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 uppercase tracking-wider">
            <Network className="w-4 h-4" />
            <span>Scope 3 Value Chain GHG Inventory &bull; FY {selectedYear}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Procured Equipment, Commuting, Freight & Waste
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track upstream embodied carbon in energy meters, transformers, logistics freight from central stores, employee commuting, and operational scrap.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-500 uppercase">Filtered Scope 3 Total</div>
            <div className="text-xl font-black text-purple-600">{totalScope3Tons.toFixed(2)} tCO₂e</div>
          </div>
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log Scope 3 Activity</span>
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
            placeholder="Search by equipment, supplier, CSC..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['ALL', 'purchased_goods', 'capital_goods', 'business_travel', 'employee_commuting', 'waste_generated', 'upstream_logistics'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'All Categories' : 
               cat === 'purchased_goods' ? '📦 Purchased Goods' :
               cat === 'capital_goods' ? '🏭 Capital Assets' :
               cat === 'business_travel' ? '✈️ Business Travel' :
               cat === 'employee_commuting' ? '🚌 Commuting' :
               cat === 'waste_generated' ? '♻️ Waste' : '🚛 Logistics'}
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
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Item / Description</th>
                <th className="py-3.5 px-4">Supplier / Route</th>
                <th className="py-3.5 px-4 text-right">Quantity</th>
                <th className="py-3.5 px-4 text-right font-black text-slate-900">Emissions (tCO₂e)</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
                      <span>Loading Scope 3 records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No Scope 3 indirect emission records found for the active filter. Click "Log Scope 3 Activity" to record data.
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

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 uppercase">
                        {r.category.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Item */}
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {r.itemName}
                    </td>

                    {/* Supplier */}
                    <td className="py-3.5 px-4 text-slate-500">
                      {r.supplierName || 'Internal / N/A'}
                    </td>

                    {/* Quantity */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      {(r.quantity ?? (r as any).activityData ?? 0).toLocaleString()} {r.unit}
                    </td>

                    {/* Emissions */}
                    <td className="py-3.5 px-4 text-right font-mono font-black text-purple-600 bg-purple-50/30">
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
            <h3 className="text-base font-bold text-slate-900">Delete Scope 3 Record</h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to permanently delete this Scope 3 activity item?
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
            
            {/* Header (Permanently Visible) */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Network className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    {editingRecord ? 'Edit Scope 3 Record' : 'Log Value Chain Scope 3 GHG Activity'}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Procurement, capital equipment, freight logistics, business flights & commuting
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

            {/* Body (Scrollable Only) */}
            <form id="scope3-form" onSubmit={handleSaveRecord} className="p-6 overflow-y-auto space-y-4 text-xs">
              
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
                    className={`w-full px-3 py-2 border rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 ${
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                    Scope 3 Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value as Scope3Category)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="purchased_goods">Category 1: Purchased Goods & Equipment (Meters, Cables)</option>
                    <option value="capital_goods">Category 2: Capital Goods (Distribution Transformers, GIS)</option>
                    <option value="business_travel">Category 6: Business Travel (Flights, Seminars)</option>
                    <option value="employee_commuting">Category 7: Employee Commuting (Bus, Motorcycle, Train)</option>
                    <option value="waste_generated">Category 5: Waste in Operations (Recycled Copper, Scrap)</option>
                    <option value="upstream_logistics">Category 4: Upstream Freight & Distribution</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Activity Preset & Standard Factor *
                  </label>
                  <select
                    value={selectedPresetId}
                    onChange={(e) => handlePresetSelect(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {availableItems.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.factorTonsPerUnit} tCO₂e / {p.unit})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Item / Activity Description *
                  </label>
                  <input
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g. 100kVA Transformers / Smart Energy Meters"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Supplier / Logistics Vendor
                  </label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="e.g. LTL Transformers / Central Stores"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Activity Quantity *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full pl-3 pr-16 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                      {unit}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700 uppercase tracking-wider">
                      Emission Factor (Read-Only)
                    </label>
                    <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Official Standard
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.000001"
                      disabled
                      readOnly
                      value={factorUsed}
                      className="w-full pl-3 pr-24 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-mono font-bold cursor-not-allowed select-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-[11px]">
                      tCO₂e / {unit}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                    <Info className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{factorSource}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Reference Notes / Tender ID
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Tender LECO/PROC/2024/MTR-09 &bull; Freight Bill #9928"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Realtime Calculated Emission Preview */}
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-purple-900 uppercase text-[11px] block">
                    Calculated Scope 3 Embodied Emissions
                  </span>
                  <span className="text-[11px] text-purple-800">
                    Formula: {quantity.toLocaleString()} {unit} &times; {factorUsed} tCO₂e/{unit}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-purple-600 font-mono">
                    {calculateEmissions(quantity, factorUsed)}
                  </span>
                  <span className="text-xs font-bold text-purple-800 ml-1">tCO₂e</span>
                </div>
              </div>

            </form>

            {/* Footer (Permanently Visible) */}
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
                form="scope3-form"
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow transition cursor-pointer"
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
