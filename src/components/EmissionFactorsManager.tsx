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
  ShieldCheck, 
  Flame, 
  Zap, 
  Network,
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

export const EmissionFactorsManager: React.FC = () => {
  const { user, isSuperAdmin, canDelete, notify } = useAuth();
  const [factors, setFactors] = useState<EmissionFactor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [scopeFilter, setScopeFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingFactor, setEditingFactor] = useState<EmissionFactor | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [category, setCategory] = useState<'Scope 1' | 'Scope 2' | 'Scope 3'>('Scope 1');
  const [name, setName] = useState<string>('');
  const [factor, setFactor] = useState<number>(2.687);
  const [unit, setUnit] = useState<string>('kg CO2e / Liter');
  const [source, setSource] = useState<string>('IPCC 2006 / SLSEA');
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
        unit: f.unit || 'kg CO2e',
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

  const openAddModal = () => {
    if (!isSuperAdmin) {
      notify('Permission denied: Only Super Administrators can configure emission factors.', 'error');
      return;
    }
    setEditingFactor(null);
    setCategory('Scope 1');
    setName('');
    setFactor(2.687);
    setUnit('kg CO2e / Liter');
    setSource('IPCC Guidelines / SLSEA 2023');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (ef: EmissionFactor) => {
    if (!isSuperAdmin) {
      notify('Permission denied: Only Super Administrators can modify emission factors.', 'error');
      return;
    }
    setEditingFactor(ef);
    setCategory(ef.category);
    setName(ef.name || ef.fuel_or_material || '');
    setFactor(Number(ef.factor ?? ef.factor_kg_co2e ?? 0));
    setUnit(ef.unit || 'kg CO2e / Liter');
    setSource(ef.source || ef.referenceSource || 'IPCC Guidelines / SLSEA');
    setDescription(ef.description || '');
    setIsModalOpen(true);
  };

  const handleSaveFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      notify('Permission denied: Only Super Administrators can alter emission factors.', 'error');
      return;
    }

    if (!name.trim()) {
      notify('Factor name is required.', 'error');
      return;
    }

    if (isNaN(factor) || factor < 0) {
      notify('Please specify a valid numerical coefficient factor.', 'error');
      return;
    }

    setIsSaving(true);
    const payload: Partial<EmissionFactor> = {
      category,
      name: name.trim(),
      fuel_or_material: name.trim(),
      factor: Number(factor),
      factor_kg_co2e: Number(factor),
      unit: unit.trim(),
      source: source.trim(),
      referenceSource: source.trim(),
      description: description.trim()
    };

    try {
      if (editingFactor) {
        // UPDATE OPERATION
        let updatedRecord: EmissionFactor | null = null;
        if (supabase) {
          const rowPayload = toEmissionFactorRow(payload);
          const result = await safeSupabaseEmissionFactorMutation('update', rowPayload, editingFactor.id);
          if (result.success && result.data) {
            updatedRecord = result.data;
          } else if (result.error && !result.isNetworkError) {
            console.warn('Supabase emission factor update note:', result.error);
          }
        }

        if (!updatedRecord) {
          updatedRecord = await api.updateEmissionFactor(editingFactor.id, payload);
        }

        // Update local state ONLY after successful DB update
        setFactors(prev => prev.map(f => f.id === editingFactor.id ? { ...f, ...payload, id: editingFactor.id } : f));
        notify('Emission factor updated successfully!', 'success');
      } else {
        // INSERT OPERATION
        let createdRecord: EmissionFactor | null = null;
        if (supabase) {
          const rowPayload = toEmissionFactorRow(payload);
          const result = await safeSupabaseEmissionFactorMutation('insert', rowPayload);
          if (result.success && result.data) {
            createdRecord = result.data;
          } else if (result.error && !result.isNetworkError) {
            console.warn('Supabase emission factor insert note:', result.error);
          }
        }

        if (!createdRecord) {
          createdRecord = await api.createEmissionFactor({
            ...payload,
            id: `ef-${Date.now().toString(36)}`
          });
        }

        // Update local state ONLY after successful DB insertion
        if (createdRecord) {
          setFactors(prev => [createdRecord!, ...prev]);
        } else {
          await fetchFactors();
        }
        notify('New emission factor registered in database!', 'success');
      }

      setIsModalOpen(false);
      setEditingFactor(null);
    } catch (err: any) {
      console.error('Error saving emission factor:', err);
      notify(err.message || 'Failed to save emission factor to database.', 'error');
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

      // Update state ONLY after successful DB deletion
      setFactors(prev => prev.filter(f => f.id !== id));
      setDeleteConfirmId(null);
      notify('Emission factor removed from library.', 'success');
    } catch (err: any) {
      console.error('Error deleting emission factor:', err);
      notify(err.message || 'Failed to delete emission factor from database.', 'error');
    }
  };

  // Safe search and filter with complete optional chaining
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

    const matchesScope = scopeFilter === 'ALL' || categoryStr === scopeFilter.toLowerCase();
    return matchesSearch && matchesScope;
  });

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
            Reference repository of published emissions factors for fuels, Sri Lanka national grid electricity, and SF₆ switchgear gas.
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
            placeholder="Search by factor name, standard source..."
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
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Fuel / Material / Activity</th>
                <th className="py-3.5 px-4 text-right">Coefficient Factor</th>
                <th className="py-3.5 px-4">Unit of Measure</th>
                <th className="py-3.5 px-4">Governing Authority / Source</th>
                <th className="py-3.5 px-4 text-right">{isSuperAdmin ? 'Actions' : 'Access Level'}</th>
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
                filteredFactors.map(f => (
                  <tr key={f.id || f.name} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                        f.category === 'Scope 1' ? 'bg-orange-100 text-orange-800' :
                        f.category === 'Scope 2' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {f.category === 'Scope 1' && <Flame className="w-3 h-3 text-orange-600" />}
                        {f.category === 'Scope 2' && <Zap className="w-3 h-3 text-blue-600" />}
                        {f.category === 'Scope 3' && <Network className="w-3 h-3 text-purple-600" />}
                        <span>{f.category || 'Scope 1'}</span>
                      </span>
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
                      {f.unit}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700">
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
                        <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                          Read-only
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Super Admin */}
      {isModalOpen && isSuperAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
            
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white">
                  {editingFactor ? 'Edit Emission Factor' : 'Register New Emission Factor'}
                </h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form id="factor-form" onSubmit={handleSaveFactor} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Scope Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="Scope 1">Scope 1 (Direct Fuel / SF6 Fugitive)</option>
                  <option value="Scope 2">Scope 2 (Grid Electricity / Solar PV)</option>
                  <option value="Scope 3">Scope 3 (Value Chain / Embodied Carbon)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Fuel / Material / Activity Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Industrial Diesel Fuel (Stationary Combustion)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Coefficient Factor (kg CO₂e) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={factor}
                    onChange={(e) => setFactor(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Unit of Measure *</label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="kg CO2e / Liter"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Governing Authority / Source *</label>
                <input
                  type="text"
                  required
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g. IPCC 2006 / SLSEA 2023 Grid Factor"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Technical Notes / Calculation Method</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional context, IPCC table reference, or methodology..."
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
