import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  Flame, 
  Zap, 
  Layers, 
  Sun, 
  TrendingDown, 
  Building2, 
  PlusCircle, 
  FileText, 
  ArrowUpRight, 
  Leaf, 
  Activity,
  CheckCircle,
  AlertTriangle,
  Award,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ScopeTotals, MonthlyEmissionTrend, FacilityEmissionStat } from '../types';
import { TabKey } from './Sidebar';

interface DashboardProps {
  onNavigateTab: (tab: TabKey) => void;
}

const SCOPE_COLORS = {
  scope1: '#10b981', // Emerald - Scope 1
  scope2: '#3b82f6', // Blue - Scope 2
  scope3: '#f59e0b', // Amber - Scope 3
  avoided: '#059669' // Green - Solar
};

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateTab }) => {
  const { selectedYear, selectedFacilityId, facilities } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    totals: ScopeTotals;
    monthlyTrends: MonthlyEmissionTrend[];
    facilityStats: FacilityEmissionStat[];
  } | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.getAnalyticsSummary(selectedYear, selectedFacilityId);
      setData(res);
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedYear, selectedFacilityId]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Calculating corporate GHG inventory...</p>
        </div>
      </div>
    );
  }

  const { totals, monthlyTrends, facilityStats } = data;

  // Pie chart data
  const pieData = [
    { name: 'Scope 1: Direct', value: totals.scope1.totalTCO2e, color: SCOPE_COLORS.scope1 },
    { name: 'Scope 2: Purchased Electricity', value: totals.scope2.totalTCO2e, color: SCOPE_COLORS.scope2 },
    { name: 'Scope 3: Value Chain', value: totals.scope3.totalTCO2e, color: SCOPE_COLORS.scope3 },
  ];

  // Detailed categories bar chart
  const categoryBreakdown = [
    { category: 'Vehicles', tCO2e: totals.scope1.vehiclesTCO2e, scope: 'Scope 1' },
    { category: 'Generators', tCO2e: totals.scope1.generatorsTCO2e, scope: 'Scope 1' },
    { category: 'LPG / Heat', tCO2e: totals.scope1.stationaryLPGTCO2e, scope: 'Scope 1' },
    { category: 'Refrigerants', tCO2e: totals.scope1.refrigerantsTCO2e, scope: 'Scope 1' },
    { category: 'SF6 Switchgear', tCO2e: totals.scope1.sf6TCO2e, scope: 'Scope 1' },
    { category: 'Grid Electricity', tCO2e: totals.scope2.gridElectricityTCO2e, scope: 'Scope 2' },
    { category: 'Purchased Goods', tCO2e: totals.scope3.purchasedGoodsTCO2e, scope: 'Scope 3' },
    { category: 'Capital Assets', tCO2e: totals.scope3.capitalGoodsTCO2e, scope: 'Scope 3' },
    { category: 'Construction', tCO2e: totals.scope3.constructionTCO2e, scope: 'Scope 3' },
    { category: 'Upstream Freight', tCO2e: totals.scope3.upstreamFreightTCO2e, scope: 'Scope 3' },
    { category: 'Waste Operations', tCO2e: Math.max(0, totals.scope3.wasteTCO2e), scope: 'Scope 3' },
    { category: 'Travel & Commute', tCO2e: totals.scope3.businessTravelCommutingTCO2e, scope: 'Scope 3' },
    { category: 'T&D Grid Loss', tCO2e: totals.scope3.distributionLossTCO2e, scope: 'Scope 3' }
  ].filter(c => c.tCO2e > 0);

  const selectedFacilityObj = facilities.find(f => f.id === selectedFacilityId);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header / Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              {selectedFacilityId === 'ALL' ? 'Corporate Consolidated' : `${selectedFacilityObj?.name || 'Selected Facility'}`}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">Reporting Year {selectedYear}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
            Carbon Accounting Dashboard
          </h2>
        </div>

        {/* Action quick buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('scope1')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3 py-2 rounded-xl border border-emerald-200 transition"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>+ Scope 1</span>
          </button>
          <button
            onClick={() => onNavigateTab('scope2')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-800 px-3 py-2 rounded-xl border border-blue-200 transition"
          >
            <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>+ Scope 2</span>
          </button>
          <button
            onClick={() => onNavigateTab('scope3')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 px-3 py-2 rounded-xl border border-amber-200 transition"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>+ Scope 3</span>
          </button>
          <button
            onClick={() => onNavigateTab('reports')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl transition shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Reports</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid - Sleek Interface Style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {/* Total Gross Footprint */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Total Gross Footprint
            </p>
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-3xl font-bold text-slate-900">
                {totals.grandTotalTCO2e.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <span className="text-xs font-bold text-slate-400">tCO₂e</span>
            </div>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <span className="text-emerald-600 font-semibold">{totals.totalRecordsCount} entries</span>
              <span>across all scopes</span>
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Net after solar:</span>
            <span className="font-bold text-emerald-700">{totals.netTotalTCO2e.toFixed(2)} tCO₂e</span>
          </div>
        </div>

        {/* Scope 1 */}
        <div 
          onClick={() => onNavigateTab('scope1')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between cursor-pointer hover:border-emerald-300 transition group"
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Scope 1 (Direct)
              </p>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-100">
                {totals.grandTotalTCO2e > 0 ? ((totals.scope1.totalTCO2e / totals.grandTotalTCO2e) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-3xl font-bold text-emerald-700">
                {totals.scope1.totalTCO2e.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <span className="text-xs font-bold text-slate-400">tCO₂e</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Vehicles, Generators, SF₆ & LPG
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Vehicles + Gens:</span>
            <span className="font-semibold text-slate-800">
              {(totals.scope1.vehiclesTCO2e + totals.scope1.generatorsTCO2e).toFixed(2)} t
            </span>
          </div>
        </div>

        {/* Scope 2 */}
        <div 
          onClick={() => onNavigateTab('scope2')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between cursor-pointer hover:border-blue-300 transition group"
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Scope 2 (Electricity)
              </p>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full border border-blue-100">
                {totals.grandTotalTCO2e > 0 ? ((totals.scope2.totalTCO2e / totals.grandTotalTCO2e) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-3xl font-bold text-blue-700">
                {totals.scope2.totalTCO2e.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <span className="text-xs font-bold text-slate-400">tCO₂e</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Purchased Grid Power
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Solar Avoided:</span>
            <span className="font-bold text-emerald-700">-{totals.scope2.solarAvoidedTCO2e.toFixed(2)} t</span>
          </div>
        </div>

        {/* Scope 3 */}
        <div 
          onClick={() => onNavigateTab('scope3')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between cursor-pointer hover:border-amber-300 transition group"
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Scope 3 (Value Chain)
              </p>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-100">
                {totals.grandTotalTCO2e > 0 ? ((totals.scope3.totalTCO2e / totals.grandTotalTCO2e) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-3xl font-bold text-amber-600">
                {totals.scope3.totalTCO2e.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <span className="text-xs font-bold text-slate-400">tCO₂e</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Supply Chain & T&D Losses
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>T&D Grid Loss:</span>
            <span className="font-semibold text-slate-800">{totals.scope3.distributionLossTCO2e.toFixed(2)} t</span>
          </div>
        </div>
      </div>

      {/* Main Charts: 12-Column Sleek Interface Grid (7 / 5 split) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Emissions Trend (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Monthly Emissions Trend</h4>
              <p className="text-xs text-slate-400">Scope 1, 2, and 3 breakdown across 12 calendar months</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600 text-[11px] font-medium">Scope 1</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-slate-600 text-[11px] font-medium">Scope 2</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-600 text-[11px] font-medium">Scope 3</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="monthShort" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(val: any, name: any) => [`${Number(val).toFixed(2)} tCO₂e`, name]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="scope1" name="Scope 1" stackId="a" fill={SCOPE_COLORS.scope1} radius={[0, 0, 0, 0]} />
                <Bar dataKey="scope2" name="Scope 2" stackId="a" fill={SCOPE_COLORS.scope2} radius={[0, 0, 0, 0]} />
                <Bar dataKey="scope3" name="Scope 3" stackId="a" fill={SCOPE_COLORS.scope3} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Aggregated by verified GHG emission records</span>
            <span className="text-emerald-700 font-semibold">Active Carbon Balance FY {selectedYear}</span>
          </div>
        </div>

        {/* Scope Distribution Donut (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-800 text-sm">Scope Distribution</h4>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md uppercase">
                GHG Protocol
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-2">Proportion of total organizational footprint</p>

            <div className="h-52 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={78}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any) => [`${Number(val).toFixed(2)} tCO₂e`, 'Emissions']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Total</span>
                <span className="text-lg font-bold text-slate-900">{totals.grandTotalTCO2e.toFixed(1)}t</span>
              </div>
            </div>
          </div>

          {/* Legend rows */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-medium text-slate-700">Scope 1 (Direct)</span>
              </div>
              <span className="font-bold text-slate-900">
                {totals.scope1.totalTCO2e.toFixed(2)} t ({totals.grandTotalTCO2e > 0 ? ((totals.scope1.totalTCO2e / totals.grandTotalTCO2e) * 100).toFixed(1) : 0}%)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="font-medium text-slate-700">Scope 2 (Electricity)</span>
              </div>
              <span className="font-bold text-slate-900">
                {totals.scope2.totalTCO2e.toFixed(2)} t ({totals.grandTotalTCO2e > 0 ? ((totals.scope2.totalTCO2e / totals.grandTotalTCO2e) * 100).toFixed(1) : 0}%)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="font-medium text-slate-700">Scope 3 (Value Chain)</span>
              </div>
              <span className="font-bold text-slate-900">
                {totals.scope3.totalTCO2e.toFixed(2)} t ({totals.grandTotalTCO2e > 0 ? ((totals.scope3.totalTCO2e / totals.grandTotalTCO2e) * 100).toFixed(1) : 0}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Row: Category Breakdown & Facility Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category-wise Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Emissions by Activity Category</h4>
              <p className="text-xs text-slate-400">Granular fuel, equipment and supply chain sources</p>
            </div>
          </div>

          <div className="h-68 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryBreakdown}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis 
                  dataKey="category" 
                  type="category" 
                  tick={{ fontSize: 11, fill: '#334155' }} 
                  axisLine={false} 
                  tickLine={false}
                  width={90}
                />
                <Tooltip 
                  formatter={(val: any) => [`${Number(val).toFixed(3)} tCO₂e`, 'Emissions']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                />
                <Bar 
                  dataKey="tCO2e" 
                  fill="#10b981" 
                  radius={[0, 4, 4, 0]}
                  barSize={13}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Facility Ranking / Leaderboard */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Facility Emissions Leaderboard</h4>
                <p className="text-xs text-slate-400">Head Office, Branch Offices, Central Stores & Meter Factory</p>
              </div>
              <Building2 className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-68 pr-1">
              {facilityStats
                .sort((a, b) => b.total - a.total)
                .map((fac, idx) => (
                  <div 
                    key={fac.facilityId}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-100/80 transition"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-slate-800">{fac.facilityName}</span>
                        <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {fac.facilityType}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-900">{fac.total.toFixed(2)} tCO₂e</span>
                        <span className="text-[10px] text-slate-500 ml-1.5">({fac.percentage}%)</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-emerald-500 h-full" 
                        style={{ width: `${fac.total > 0 ? (fac.scope1 / fac.total) * 100 : 0}%` }} 
                        title={`Scope 1: ${fac.scope1}t`}
                      />
                      <div 
                        className="bg-blue-500 h-full" 
                        style={{ width: `${fac.total > 0 ? (fac.scope2 / fac.total) * 100 : 0}%` }} 
                        title={`Scope 2: ${fac.scope2}t`}
                      />
                      <div 
                        className="bg-amber-500 h-full" 
                        style={{ width: `${fac.total > 0 ? (fac.scope3 / fac.total) * 100 : 0}%` }} 
                        title={`Scope 3: ${fac.scope3}t`}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Color code: Emerald (S1), Blue (S2), Amber (S3)</span>
            <button 
              onClick={() => onNavigateTab('facilities')}
              className="text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1"
            >
              <span>Manage Facilities</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Sustainable Transition & Net-Zero 2030 Roadmap Card */}
      <div className="bg-[#064E3B] text-white rounded-2xl p-6 border border-emerald-800/80 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-emerald-800/60 rounded-xl border border-emerald-600/40 text-emerald-300 shrink-0">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">LECO Decarbonization Targets & Clean Power (2030)</h3>
              <p className="text-xs text-emerald-100/80 mt-0.5 max-w-xl leading-relaxed">
                LECO is actively investing in smart grid distribution efficiency, SF₆ gas mitigation, renewable rooftop solar, and electrified fleet operations across Sri Lanka.
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs text-emerald-200 font-medium">Rooftop Solar Avoided:</span>
            <p className="text-2xl font-bold text-emerald-300">
              {totals.scope2.solarAvoidedTCO2e.toFixed(2)} tCO₂e
            </p>
            <span className="text-[10px] text-emerald-200/60">
              ({totals.scope2.solarGeneratedKWh.toLocaleString()} kWh Clean Solar Generation)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
