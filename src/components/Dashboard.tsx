import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DashboardSummary } from '../types';
import { 
  Flame, 
  Zap, 
  Network, 
  Sun, 
  Building2, 
  TrendingUp, 
  ArrowUpRight, 
  FileText, 
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Leaf
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { selectedYear, selectedFacilityId, facilities, setActiveModule } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboardSummary(selectedYear, selectedFacilityId);
      setSummary(data);
    } catch (err) {
      console.error('Error loading dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [selectedYear, selectedFacilityId]);

  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-500">Calculating corporate GHG inventory metrics...</span>
        </div>
      </div>
    );
  }

  const selectedFacilityObj = facilities.find(f => f.id === selectedFacilityId);
  const scopeBreakdownData = [
    { name: 'Scope 1: Direct Combustion & SF6', value: summary.scope1TotalTons, color: '#f97316' },
    { name: 'Scope 2: Grid Electricity', value: summary.scope2TotalTons, color: '#0ea5e9' },
    { name: 'Scope 3: Value Chain & Logistics', value: summary.scope3TotalTons, color: '#8b5cf6' },
  ].filter(d => d.value > 0);

  const netEmissions = Math.max(0, Number((summary.totalEmissionsTonsCO2e - summary.solarOffsetTotalTons).toFixed(2)));

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner / Scope Indicator */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
            <Leaf className="w-4 h-4" />
            <span>GHG Protocol Corporate Standard &bull; FY {selectedYear}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            {selectedFacilityId === 'ALL' 
              ? 'LECO Corporate Carbon Footprint Overview' 
              : `${selectedFacilityObj?.name || 'Selected Facility'} Emissions Dashboard`}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {selectedFacilityId === 'ALL'
              ? 'Consolidated Scope 1, 2, and 3 GHG accounting across all 7 regional branches, CSC network, stores, and manufacturing centers.'
              : `Facility Location: ${selectedFacilityObj?.location || 'Western & Southern Network'} | Officer: ${selectedFacilityObj?.responsibleOfficer || 'N/A'}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSummary}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Recalculate</span>
          </button>
          <button
            onClick={() => setActiveModule('reports')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Gross Emissions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Gross GHG Emissions</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{summary.totalEmissionsTonsCO2e}</span>
            <span className="text-xs font-bold text-slate-500">tCO₂e</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Net after Solar: <strong className="text-emerald-600">{netEmissions} tCO₂e</strong></span>
            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono">{summary.recordsCount} records</span>
          </div>
        </div>

        {/* Scope 1 */}
        <div 
          onClick={() => setActiveModule('scope1')}
          className="bg-white border border-orange-200/80 hover:border-orange-400 rounded-2xl p-5 shadow-sm cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600">Scope 1: Direct GHG</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{summary.scope1TotalTons}</span>
            <span className="text-xs font-bold text-slate-500">tCO₂e</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Generators, Fleet & SF6</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-orange-500 opacity-0 group-hover:opacity-100 transition" />
          </div>
        </div>

        {/* Scope 2 */}
        <div 
          onClick={() => setActiveModule('scope2')}
          className="bg-white border border-blue-200/80 hover:border-blue-400 rounded-2xl p-5 shadow-sm cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Scope 2: Purchased Energy</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{summary.scope2TotalTons}</span>
            <span className="text-xs font-bold text-slate-500">tCO₂e</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Grid Electricity Usage</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-blue-500 opacity-0 group-hover:opacity-100 transition" />
          </div>
        </div>

        {/* Solar Offset */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Solar PV Avoided GHG</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Sun className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-700">{summary.solarOffsetTotalTons}</span>
            <span className="text-xs font-bold text-emerald-800">tCO₂e Avoided</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-700">
            Rooftop Solar PV Green Generation
          </div>
        </div>

      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Trend Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Monthly Emission Trends (tCO₂e)</h2>
              <p className="text-xs text-slate-500">Breakdown of Scope 1, 2, and 3 emissions across FY {selectedYear}</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-orange-500 inline-block" /> Scope 1
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" /> Scope 2
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-purple-500 inline-block" /> Scope 3
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="monthName" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }} 
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="scope1" name="Scope 1 (tCO2e)" fill="#f97316" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="scope2" name="Scope 2 (tCO2e)" fill="#0ea5e9" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="scope3" name="Scope 3 (tCO2e)" fill="#8b5cf6" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scope Breakdown Pie Chart (1 Col) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Emissions by Scope Share</h2>
            <p className="text-xs text-slate-500">Distribution proportion of total carbon footprint</p>
          </div>

          <div className="h-56 w-full my-2">
            {scopeBreakdownData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={scopeBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {scopeBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any) => [`${val} tCO₂e`, 'Emissions']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No emission records logged for this filter scope.
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            {scopeBreakdownData.map((item, idx) => {
              const pct = summary.totalEmissionsTonsCO2e > 0 
                ? ((item.value / summary.totalEmissionsTonsCO2e) * 100).toFixed(1) 
                : '0';
              return (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-600 font-medium truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="truncate">{item.name.split(':')[0]}</span>
                  </span>
                  <span className="font-bold text-slate-900">{pct}% ({item.value} t)</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Facility Rankings Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Hierarchical Facility Emission Inventory</h2>
            <p className="text-xs text-slate-500">Breakdown per parent branch, customer service centre (CSC), and standalone depots</p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-semibold">
            {summary.facilityStats.length} Facilities Monitored
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <th className="py-3 px-4">Facility / CSC Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Parent Branch</th>
                <th className="py-3 px-4 text-right">Scope 1 (tCO₂e)</th>
                <th className="py-3 px-4 text-right">Scope 2 (tCO₂e)</th>
                <th className="py-3 px-4 text-right">Scope 3 (tCO₂e)</th>
                <th className="py-3 px-4 text-right font-black text-slate-900">Total (tCO₂e)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {summary.facilityStats.map((fac) => (
                <tr key={fac.facilityId} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{fac.facilityName}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      fac.facilityType === 'Branch' ? 'bg-blue-100 text-blue-800' :
                      fac.facilityType === 'CSC' ? 'bg-amber-100 text-amber-800' :
                      fac.facilityType === 'Head Office' ? 'bg-purple-100 text-purple-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {fac.facilityType}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {fac.parentName ? (
                      <span className="text-slate-600 font-medium">↳ {fac.parentName}</span>
                    ) : (
                      <span className="text-slate-400 italic">Self / Primary</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-orange-600 font-medium">{fac.scope1.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-mono text-blue-600 font-medium">{fac.scope2.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-mono text-purple-600 font-medium">{fac.scope3.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-mono font-black text-slate-900 bg-slate-50/50">
                    {fac.total.toFixed(2)}
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
