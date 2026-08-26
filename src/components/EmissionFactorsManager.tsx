import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { EmissionFactor } from '../types';
import { api } from '../services/api';
import { 
  supabase, 
  toEmissionFactorRow, 
  fromEmissionFactorRow, 
  safeSupabaseEmissionFactorMutation 
} from '../services/supabase';
import { 
  Sliders, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  X, 
  Flame, 
  Zap, 
  Network,
  AlertCircle,
  RefreshCw,
  Lock,
  CheckCircle2,
  Layers,
  ChevronRight
} from 'lucide-react';

export const SCOPE_OPTIONS = ['Scope 1', 'Scope 2', 'Scope 3'] as const;
export type ScopeOption = typeof SCOPE_OPTIONS[number];

export const CATEGORIES_BY_SCOPE: Record<ScopeOption, string[]> = {
  'Scope 1': [
    'Stationary Diesel Generator (Backup Power)',
    'Mobile Fleet Vehicle (Lorry / Van / Boom Truck)',
    'Fugitive SF6 Gas (Circuit Breaker / Switchgear)',
    'Fugitive HVAC Refrigerant (R410A / R134a)'
  ],
  'Scope 2': [
    'Grid Electricity'
  ],
  'Scope 3': [
    'Category 1: Purchased Goods & Equipment',
    'Category 2: Capital Goods',
    'Category 6: Business Travel',
    'Category 7: Employee Commuting',
    'Category 5: Waste in Operations',
    'Category 4: Upstream Freight & Distribution'
  ]
};

export const UNIT_OPTIONS = [
  'Liters',
  'kg',
  'kWh',
  'Units',
  'Meters',
  'Passenger-km',
  'Tonne-km',
  'Reams'
];

export const EmissionFactorsManager: React.FC = () => {
  const { isSuperAdmin, notify } = useAuth();
  const [factors, setFactors] = useState<EmissionFactor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [scopeFilter, setScopeFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingFactor, setEditingFactor] = useState<EmissionFactor | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Cascading Form Fields
  const [selectedScope, setSelectedScope] = useState<ScopeOption>('Scope 1');
  const [selectedSourceCategory, setSelectedSourceCategory] = useState<string>(CATEGORIES_BY_SCOPE['Scope 1'][0]);
  const [fuelOrMaterial, setFuelOrMaterial] = useState<string>('');
  const [unit, setUnit] = useState<string>('Liters');
  const [factorValue, setFactorValue] = useState<number>(2.6878);
  const [source, setSource] = useState<string>('IPCC 2006 Guidelines / SLSEA');
  const [description, setDescription] = useState<string>('');

  const fetchFactors = async () => {
    setLoading(true);
    try {
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('emission_factors')
            .select('*')
            .order('category', { ascending: true });

          if (!error && data && data.length > 0) {
            const mapped = data.map(fromEmissionFactorRow);
            setFactors(mapped);
            setLoading(false);
            return;
          }
        } catch (sbErr) {
          console.warn('Supabase fetch emission_factors error, falling back:', sbErr);
        }
      }

      const data = await api.getEmissionFactors();
      const normalized = (data || []).map(f => ({
        ...f,
        name: f.name || f.fuel_or_material || 'Emission Factor',
        fuel_or_material: f.fuel_or_material || f.name || 'Emission Factor',
        factor: Number(f.factor ?? f.factor_kg_co2e ?? 0),
        factor_kg_co2e: Number(f.factor ?? f.factor_kg_co2e ?? 0),
        unit: f.unit || 'Liters',
        source: f.source || f.referenceSource || 'IPCC / SLSEA',
        referenceSource: f.source || f.referenceSource || 'IPCC / SLSEA',
        description: f.description || ''
      }));
      setFactors(normalized);
    } catch (err) {
      console.error('Error fetching emission factors:', err);
      notify('Failed to load emission factors library.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFactors();
  }, []);

  const getSuggestedUnit = (scope: ScopeOption, cat: string): string => {
    if (cat.includes('Generator') || cat.includes('Fleet') || cat.includes('Fuel')) return 'Liters';
    if (cat.includes('SF6') || cat.includes('Refrigerant') || cat.includes('Waste')) return 'kg';
    if (cat.includes('Grid') || cat.includes('Electricity')) return 'kWh';
    if (cat.includes('Travel') || cat.includes('Commuting')) return 'Passenger-km';
    if (cat.includes('Freight') || cat.includes('Logistics')) return 'Tonne-km';
    if (cat.includes('Capital Goods') || cat.includes('Purchased Goods')) return 'Units';
    return 'Units';
  };

  const handleScopeChange = (scope: ScopeOption) => {
    setSelectedScope(scope);
    const firstCat = CATEGORIES_BY_SCOPE[scope][0];
    setSelectedSourceCategory(firstCat);
    setUnit(getSuggestedUnit(scope, firstCat));
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedSourceCategory(cat);
    setUnit(getSuggestedUnit(selectedScope, cat));
  };

  const openAddModal = () => {
    if (!isSuperAdmin) {
      notify('Permission denied: Only Super Administrators can configure emission factors.', 'error');
      return;
    }
    setEditingFactor(null);
    setSelectedScope('Scope 1');
    setSelectedSourceCategory(CATEGORIES_BY_SCOPE['Scope 1'][0]);
    setFuelOrMaterial('');
    setUnit('Liters');
    setFactorValue(2.6878);
    setSource('IPCC 2006 Guidelines for National GHG Inventories');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (ef: EmissionFactor) => {
    if (!isSuperAdmin) {
      notify('Permission denied: Only Super Administrators can modify emission factors.', 'error');
      return;
    }
    setEditingFactor(ef);

    // Parse Scope and Category from ef.category
    const catStr = ef.category || '';
    let scope: ScopeOption = 'Scope 1';
    let sourceCat = CATEGORIES_BY_SCOPE['Scope 1'][0];

    if (catStr.startsWith('Scope 1 - ')) {
      scope = 'Scope 1';
      sourceCat = catStr.replace('Scope 1 - ', '').trim();
    } else if (catStr.startsWith('Scope 2 - ')) {
      scope = 'Scope 2';
      sourceCat = catStr.replace('Scope 2 - ', '').trim();
    } else if (catStr.startsWith('Scope 3 - ')) {
      scope = 'Scope 3';
      sourceCat = catStr.replace('Scope 3 - ', '').trim();
    } else if (catStr.toLowerCase().includes('scope 2') || catStr.toLowerCase().includes('grid')) {
      scope = 'Scope 2';
      sourceCat = 'Grid Electricity';
    } else if (catStr.toLowerCase().includes('scope 3')) {
      scope = 'Scope 3';
      sourceCat = CATEGORIES_BY_SCOPE['Scope 3'][0];
    } else {
      scope = 'Scope 1';
      sourceCat = CATEGORIES_BY_SCOPE['Scope 1'][0];
    }

    // Ensure sourceCat matches available options or fallback
    if (!CATEGORIES_BY_SCOPE[scope].includes(sourceCat)) {
      const match = CATEGORIES_BY_SCOPE[scope].find(c => sourceCat.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(sourceCat.toLowerCase()));
      sourceCat = match || CATEGORIES_BY_SCOPE[scope][0];
    }

    setSelectedScope(scope);
    setSelectedSourceCategory(sourceCat);
    setFuelOrMaterial(ef.name || ef.fuel_or_material || '');
    setUnit(ef.unit || 'Liters');
    setFactorValue(Number(ef.factor ?? ef.factor_kg_co2e ?? 0));
    setSource(ef.source || ef.referenceSource || 'IPCC 2006 / SLSEA');
    setDescription(ef.description || '');
    setIsModalOpen(true);
  };

  const handleSaveFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      notify('Permission denied: Only Super Administrators can alter emission factors.', 'error');
      return;
    }

    if (!fuelOrMaterial.trim()) {
      notify('Item / Gas / Fuel Type is required.', 'error');
      return;
    }

    if (isNaN(factorValue) || factorValue < 0) {
      notify('Please specify a valid positive numerical factor.', 'error');
      return;
    }

    setIsSaving(true);
    // Concatenate Scope and Source Category into standard category column
    const concatenatedCategory = `${selectedScope} - ${selectedSourceCategory}`;
    const standardSource = source.trim() || 'Custom / LECO Defined';

    try {
      if (editingFactor) {
        // UPDATE OPERATION
        let updatedRecord: EmissionFactor | null = null;

        if (supabase) {
          // Explicitly map all columns ensuring non-null constraints are satisfied
          const updatePayload: Record<string, any> = {
            category: concatenatedCategory,
            fuel_or_material: fuelOrMaterial.trim(),
            unit: unit.trim(),
            factor_kg_co2e: Number(factorValue),
            source_standard: standardSource
          };

          if (description.trim()) {
            updatePayload.description = description.trim();
          }

          const { data, error } = await supabase
            .from('emission_factors')
            .update(updatePayload)
            .eq('id', editingFactor.id)
            .select()
            .single();

          if (error) {
            console.warn('Direct Supabase EF update note, retrying with schema-safe helper:', error);
            const safeRes = await safeSupabaseEmissionFactorMutation('update', {
              ...updatePayload,
              name: fuelOrMaterial.trim(),
              factor: Number(factorValue),
              source: standardSource,
              reference_source: standardSource
            }, editingFactor.id);

            if (!safeRes.success || !safeRes.data) {
              throw new Error(safeRes.error?.message || error.message || 'Failed to update emission factor in database.');
            }
            updatedRecord = safeRes.data;
          } else if (data) {
            updatedRecord = fromEmissionFactorRow(data);
          }
        } else {
          // If Supabase not connected, fallback to API
          const apiPayload: Partial<EmissionFactor> = {
            category: concatenatedCategory,
            scope: selectedScope,
            name: fuelOrMaterial.trim(),
            fuel_or_material: fuelOrMaterial.trim(),
            factor: Number(factorValue),
            factor_kg_co2e: Number(factorValue),
            unit: unit.trim(),
            source: standardSource,
            source_standard: standardSource,
            referenceSource: standardSource,
            description: description.trim()
          };
          updatedRecord = await api.updateEmissionFactor(editingFactor.id, apiPayload);
        }

        if (!updatedRecord) {
          throw new Error('Database operation did not return updated emission factor data.');
        }

        // Update local React state ONLY with the actual verified returned data
        setFactors(prev => prev.map(f => f.id === editingFactor.id ? updatedRecord! : f));
        notify('Emission factor updated successfully!', 'success');
      } else {
        // INSERT OPERATION (STRICT: NO ID FIELD IN PAYLOAD)
        let createdRecord: EmissionFactor | null = null;

        if (supabase) {
          // Satisfies NOT NULL constraints: category, fuel_or_material, unit, factor_kg_co2e, source_standard
          // Strictly excludes 'id' so PostgreSQL generates the UUID via DEFAULT uuid_generate_v4()
          const insertPayload: Record<string, any> = {
            category: concatenatedCategory,
            fuel_or_material: fuelOrMaterial.trim(),
            unit: unit.trim(),
            factor_kg_co2e: Number(factorValue),
            source_standard: standardSource
          };

          if (description.trim()) {
            insertPayload.description = description.trim();
          }

          const { data, error } = await supabase
            .from('emission_factors')
            .insert([insertPayload])
            .select()
            .single();

          if (error) {
            console.warn('Direct Supabase EF insert failed, retrying with schema-safe helper:', error);
            const safeRes = await safeSupabaseEmissionFactorMutation('insert', {
              ...insertPayload,
              name: fuelOrMaterial.trim(),
              factor: Number(factorValue),
              source: standardSource,
              reference_source: standardSource
            });

            if (!safeRes.success || !safeRes.data) {
              console.error('Supabase insert emission factor failure:', error, safeRes.error);
              throw new Error(safeRes.error?.message || error.message || 'Failed to save emission factor to database.');
            }
            createdRecord = safeRes.data;
          } else if (data) {
            createdRecord = fromEmissionFactorRow(data);
          }
        } else {
          // Fallback to API if supabase client is not present
          const apiPayload: Partial<EmissionFactor> = {
            category: concatenatedCategory,
            scope: selectedScope,
            name: fuelOrMaterial.trim(),
            fuel_or_material: fuelOrMaterial.trim(),
            factor: Number(factorValue),
            factor_kg_co2e: Number(factorValue),
            unit: unit.trim(),
            source: standardSource,
            source_standard: standardSource,
            referenceSource: standardSource,
            description: description.trim()
          };
          createdRecord = await api.createEmissionFactor(apiPayload);
        }

        if (!createdRecord || !createdRecord.id) {
          throw new Error('Database operation did not return a valid saved record ID.');
        }

        // STRICT STATE UPDATE: ONLY using the actual returned data from Supabase
        setFactors(prev => [createdRecord!, ...prev]);
        notify('New emission factor saved to database!', 'success');
      }

      // Close modal ONLY after successful database confirmation
      setIsModalOpen(false);
      setEditingFactor(null);
    } catch (err: any) {
      console.error('Error saving emission factor:', err);
      // Keep modal open, show error toast, DO NOT update local list
      notify(err.message || 'Database error: Failed to save emission factor. Please check database connection.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFactor = async (id: string) => {
    if (!isSuperAdmin) {
      notify('Permission denied: Only Super Administrators can delete emission factors.', 'error');
      return;
    }

    try {
      let deleted = false;
      if (supabase) {
        const result = await safeSupabaseEmissionFactorMutation('delete', {}, id);
        if (result.success) {
          deleted = true;
        } else if (result.error) {
          console.warn('Supabase delete emission factor note:', result.error);
        }
      }

      if (!deleted) {
        await api.deleteEmissionFactor(id);
      }

      setFactors(prev => prev.filter(f => f.id !== id));
      setDeleteConfirmId(null);
      notify('Emission factor removed from library.', 'success');
    } catch (err: any) {
      console.error('Error deleting emission factor:', err);
      notify(err.message || 'Failed to delete emission factor from database.', 'error');
    }
  };

  // Safe filter logic
  const filteredFactors = factors.filter(f => {
    if (!f) return false;
    const search = (searchTerm || '').trim().toLowerCase();
    
    const nameStr = (f.name || f.fuel_or_material || '').toLowerCase();
    const sourceStr = (f.source || f.referenceSource || '').toLowerCase();
    const unitStr = (f.unit || '').toLowerCase();
    const categoryStr = (f.category || '').toLowerCase();
    const descStr = (f.description || '').toLowerCase();

    const matchesSearch = !search ||
      nameStr.includes(search) ||
      sourceStr.includes(search) ||
      unitStr.includes(search) ||
      categoryStr.includes(search) ||
      descStr.includes(search);

    let matchesScope = true;
    if (scopeFilter === 'Scope 1') {
      matchesScope = categoryStr.includes('scope 1') || categoryStr.includes('scope1');
    } else if (scopeFilter === 'Scope 2') {
      matchesScope = categoryStr.includes('scope 2') || categoryStr.includes('scope2') || categoryStr.includes('grid');
    } else if (scopeFilter === 'Scope 3') {
      matchesScope = categoryStr.includes('scope 3') || categoryStr.includes('scope3') || categoryStr.includes('category');
    }

    return matchesSearch && matchesScope;
  });

  const getScopeBadge = (cat: string) => {
    const cLower = cat.toLowerCase();
    if (cLower.includes('scope 2') || cLower.includes('grid')) {
      return { label: 'Scope 2', icon: Zap, bg: 'bg-blue-50 text-blue-800 border-blue-200' };
    }
    if (cLower.includes('scope 3') || cLower.includes('category')) {
      return { label: 'Scope 3', icon: Network, bg: 'bg-purple-50 text-purple-800 border-purple-200' };
    }
    return { label: 'Scope 1', icon: Flame, bg: 'bg-orange-50 text-orange-800 border-orange-200' };
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Sliders className="w-4 h-4 text-emerald-600" />
            <span>GHG Accounting Coefficients & Global Warming Potentials</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Emission Factors Library (IPCC & SLSEA)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Governing repository for Scope 1, Scope 2, and Scope 3 activity coefficients. Direct manual overrides in activity logs are locked.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchFactors}
            disabled={loading}
            title="Reload from database"
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Strict RBAC: Only super_admin sees Add button */}
          {isSuperAdmin && (
            <button
              onClick={openAddModal}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Emission Factor</span>
            </button>
          )}
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
            placeholder="Search by factor item, fuel, category, source..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {['ALL', 'Scope 1', 'Scope 2', 'Scope 3'].map(s => (
            <button
              key={s}
              onClick={() => setScopeFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                scopeFilter === s
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s === 'ALL' ? 'All Scopes' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Factors Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <th className="py-3.5 px-4">Scope & Source Category</th>
                <th className="py-3.5 px-4">Item / Fuel / Gas Type</th>
                <th className="py-3.5 px-4 text-right">Coefficient Factor</th>
                <th className="py-3.5 px-4">Unit of Measure</th>
                <th className="py-3.5 px-4">Governing Standard / Source</th>
                <th className="py-3.5 px-4 text-right">{isSuperAdmin ? 'Actions' : 'Access'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
                      <span>Loading emission factors library from database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredFactors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <AlertCircle className="w-6 h-6 text-slate-300" />
                      <p className="text-slate-600 font-bold">No emission factors match the current filters</p>
                      <p className="text-xs text-slate-400">Try clearing the search query or selecting "All Scopes"</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredFactors.map(f => {
                  const badge = getScopeBadge(f.category);
                  const Icon = badge.icon;
                  // Display category text nicely
                  const displayCat = f.category.includes(' - ') ? f.category.split(' - ')[1] : f.category;

                  return (
                    <tr key={f.id || f.name} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 border ${badge.bg}`}>
                            <Icon className="w-3 h-3 shrink-0" />
                            <span>{badge.label}</span>
                          </span>
                          <span className="text-[11px] font-semibold text-slate-700">
                            {displayCat}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div>{f.name || f.fuel_or_material}</div>
                        {f.description && (
                          <div className="text-[11px] text-slate-400 font-normal mt-0.5">{f.description}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 text-sm">
                        {typeof f.factor === 'number' ? f.factor.toFixed(4).replace(/\.?0+$/, '') : f.factor}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 text-xs">
                        <span className="bg-slate-100 px-2 py-0.5 rounded font-semibold text-slate-700">
                          {f.unit}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        <span className="text-[11px] font-medium text-slate-700 line-clamp-1" title={f.source || f.referenceSource}>
                          {f.source || f.referenceSource || 'Official Standard'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isSuperAdmin ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(f)}
                              title="Edit Emission Factor"
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            
                            {deleteConfirmId === f.id ? (
                              <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-lg p-1">
                                <button
                                  onClick={() => handleDeleteFactor(f.id)}
                                  className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold cursor-pointer"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-1.5 py-0.5 bg-white text-slate-600 rounded text-[10px] font-bold cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(f.id)}
                                title="Delete Emission Factor"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200 inline-flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Locked
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cascading Add/Edit Modal (Strict RBAC: Super Admin Only) */}
      {isModalOpen && isSuperAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
            
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    {editingFactor ? 'Edit Emission Factor' : 'Register New Emission Factor'}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Cascading emission coefficient configuration for automated GHG calculation
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form id="factor-form" onSubmit={handleSaveFactor} className="p-6 overflow-y-auto space-y-4 text-xs">
              
              {/* Field 1: Scope */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Field 1: Scope *
                </label>
                <select
                  value={selectedScope}
                  onChange={(e) => handleScopeChange(e.target.value as ScopeOption)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {SCOPE_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Field 2: Source Category (Cascading based on Field 1) */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Field 2: Source Category *
                </label>
                <select
                  value={selectedSourceCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {CATEGORIES_BY_SCOPE[selectedScope].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <div className="text-[10px] text-emerald-700 font-medium mt-1">
                  Database Category Key: <code className="bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">{selectedScope} - {selectedSourceCategory}</code>
                </div>
              </div>

              {/* Field 3: Item / Gas / Fuel Type */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Field 3: Item / Gas / Fuel Type *
                </label>
                <input
                  type="text"
                  required
                  value={fuelOrMaterial}
                  onChange={(e) => setFuelOrMaterial(e.target.value)}
                  placeholder="e.g. Auto Diesel, Smart Meters, R410A, SF6 Gas..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Field 4 & Field 5: Unit and Factor Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Field 4: Unit of Measure *
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {UNIT_OPTIONS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Field 5: Factor Value (kg CO₂e / unit) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={factorValue}
                    onChange={(e) => setFactorValue(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Reference Source */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Governing Standard / Reference Source *
                </label>
                <input
                  type="text"
                  required
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g. IPCC 2006 Guidelines / SLSEA 2024 Grid Factor"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Technical Notes / LCA Methodology
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional context or standard reference table..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

            </form>

            <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="factor-form"
                disabled={isSaving}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{editingFactor ? 'Update Factor' : 'Save to Library'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

