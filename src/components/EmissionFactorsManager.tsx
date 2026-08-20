import React, { useState } from 'react';
import { Sliders, Plus, Edit2, ShieldAlert, CheckCircle2, Info, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { EmissionFactor } from '../types';

export const EmissionFactorsManager: React.FC = () => {
  const { emissionFactors, isSuperAdmin, notify } = useAuth();
  const [factors, setFactors] = useState<EmissionFactor[]>(emissionFactors);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = ['ALL', 'Scope 1 - Fuel', 'Scope 1 - Refrigerant & Gas', 'Scope 2 - Grid Electricity', 'Scope 3 - Logistics & Materials'];

  const filtered = selectedCategory === 'ALL' 
    ? factors 
    : factors.filter(f => f.category === selectedCategory);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-emerald-600" />
            <span>Emission Factors & GWP Conversion Library</span>
          </h1>
          <p className="text-xs text-slate-500">
            Authoritative GHG Protocol, IPCC 5th Assessment (AR5), and CEB Sri Lanka Grid emission factors
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700">
          <BookOpen className="w-4 h-4 text-emerald-600" />
          <span>Standard: IPCC AR5 & ISO 14064-1</span>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Fuel / Gas / Material</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5 text-right">Factor Value</th>
                <th className="p-3.5">Unit</th>
                <th className="p-3.5">Authoritative Source</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition">
                  <td className="p-3.5 font-bold text-slate-900">{item.name}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-medium">
                      {item.category}
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-emerald-700">
                    {item.factorValue.toLocaleString()}
                  </td>
                  <td className="p-3.5 font-mono text-slate-600">{item.unit}</td>
                  <td className="p-3.5 text-slate-500">{item.source}</td>
                  <td className="p-3.5 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Verified
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
