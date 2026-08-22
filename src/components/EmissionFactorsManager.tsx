import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { EmissionFactor } from '../types';
import { api } from '../services/api';
import { 
  Sliders, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  X, 
  BookOpen, 
  ShieldCheck, 
  Check, 
  Flame, 
  Zap, 
  Network 
} from 'lucide-react';

export const EmissionFactorsManager: React.FC = () => {
  const { isSuperAdmin, canDelete, notify } = useAuth();
  const [factors, setFactors] = useState<EmissionFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [scopeFilter, setScopeFilter] = useState<string>('ALL');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFactor, setEditingFactor] = useState<EmissionFactor | null>(null);

  // Form
  const [category, setCategory] = useState<'Scope 1' | 'Scope 2' | 'Scope 3'>('Scope 1');
  const [name, setName] = useState('');
  const [factor, setFactor] = useState<number>(2.687);
  const [unit, setUnit] = useState('kg CO2e / Liter');
  const [source, setSource] = useState('IPCC 2006 / SLSEA');
  const [description, setDescription] = useState('');

  const fetchFactors = async () => {
    setLoading(true);
    try {
      const data = await api.getEmissionFactors();
      setFactors(data);
    } catch (err) {
      console.error('Error fetching emission factors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFactors();
  }, []);

  const openAddModal = () => {
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
    setEditingFactor(ef);
    setCategory(ef.category);
    setName(ef.name);
    setFactor(ef.factor);
    setUnit(ef.unit);
    setSource(ef.source);
    setDescription(ef.description || '');
    setIsModalOpen(true);
  };

  const handleSaveFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      notify('Factor name is required', 'error');
      return;
    }

    const payload: Partial<EmissionFactor> = {
      category,
      name: name.trim(),
      factor: Number(factor),
      unit: unit.trim(),
      source: source.trim(),
      description: description.trim()
    };

    try {
      if (editingFactor) {
        await api.updateEmissionFactor(editingFactor.id, payload);
        notify('Emission factor updated!', 'success');
      } else {
        await api.createEmissionFactor({
          ...payload,
          id: `ef-${Date.now().toString(36)}`
        });
        notify('New emission factor registered!', 'success');
      }
      setIsModalOpen(false);
      await fetchFactors();
    } catch (err: any) {
      notify(err.message || 'Failed to save factor', 'error');
    }
  };

  const handleDeleteFactor = async (id: string) => {
    if (!canDelete) {
      notify('You do not have deletion rights.', 'error');
      return;
    }
    try {
      await api.deleteEmissionFactor(id);
      notify('Factor removed.', 'success');
      await fetchFactors();
    } catch (err: any) {
      notify(err.message || 'Failed to delete factor', 'error');
    }
  };

  const filteredFactors = factors.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesScope = scopeFilter === 'ALL' || f.category === scopeFilter;
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

      {/* Filter and Search */}
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
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'Scope 1', 'Scope 2', 'Scope 3'].map(s => (
            <button
              key={s}
              onClick={() => setScopeFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                scopeFilter === s
                  ? 'bg-slate-900 text-white'
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
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredFactors.map(f => (
                <tr key={f.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      f.category === 'Scope 1' ? 'bg-orange-100 text-orange-800' :
                      f.category === 'Scope 2' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {f.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <div>{f.name}</div>
                    {f.description && <div className="text-[11px] text-slate-400 font-normal">{f.description}</div>}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 text-sm">
                    {f.factor}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">
                    {f.unit}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700">
                      {f.source}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {isSuperAdmin && (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(f)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteFactor(f.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
            
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white">
                  {editingFactor ? 'Edit Emission Factor' : 'Register New Emission Factor'}
                </h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form id="factor-form" onSubmit={handleSaveFactor} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Scope Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                >
                  <option value="Scope 1">Scope 1 (Direct Fuel / SF6)</option>
                  <option value="Scope 2">Scope 2 (Grid Electricity / Solar)</option>
                  <option value="Scope 3">Scope 3 (Value Chain / Embodied Carbon)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Factor Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Industrial Diesel Fuel"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Factor Value *</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={factor}
                    onChange={(e) => setFactor(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Unit *</label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="kg CO2e / Liter"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Authority Source *</label>
                <input
                  type="text"
                  required
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g. SLSEA 2023 / IPCC AR5"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Technical Notes</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description of methodology..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                />
              </div>
            </form>

            <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="factor-form"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow cursor-pointer"
              >
                Save Factor
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
