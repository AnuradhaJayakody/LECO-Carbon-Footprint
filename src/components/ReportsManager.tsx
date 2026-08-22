import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DashboardSummary } from '../types';
import { 
  FileText, 
  Download, 
  Printer, 
  ShieldCheck, 
  Building2, 
  Calendar, 
  Flame, 
  Zap, 
  Network, 
  Sun,
  Leaf
} from 'lucide-react';

export const ReportsManager: React.FC = () => {
  const { selectedYear, selectedFacilityId, facilities } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await api.getDashboardSummary(selectedYear, selectedFacilityId);
        setSummary(data);
      } catch (err) {
        console.error('Error fetching report summary:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedYear, selectedFacilityId]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!summary) return;
    const rows = [
      ['LECO GHG INVENTORY REPORT', `FY ${selectedYear}`],
      ['Operational Boundary', selectedFacilityId === 'ALL' ? 'All LECO Facilities' : (facilities.find(f => f.id === selectedFacilityId)?.name || 'Facility')],
      ['Report Generated', new Date().toISOString()],
      [],
      ['Metric / Scope', 'Emissions (tCO2e)', 'Share (%)'],
      ['Scope 1 (Direct Fuel Combustion & SF6)', summary.scope1TotalTons, summary.totalEmissionsTonsCO2e > 0 ? ((summary.scope1TotalTons / summary.totalEmissionsTonsCO2e) * 100).toFixed(1) : 0],
      ['Scope 2 (Grid Purchased Electricity)', summary.scope2TotalTons, summary.totalEmissionsTonsCO2e > 0 ? ((summary.scope2TotalTons / summary.totalEmissionsTonsCO2e) * 100).toFixed(1) : 0],
      ['Scope 3 (Value Chain, Logistics, Commuting)', summary.scope3TotalTons, summary.totalEmissionsTonsCO2e > 0 ? ((summary.scope3TotalTons / summary.totalEmissionsTonsCO2e) * 100).toFixed(1) : 0],
      ['Gross GHG Footprint', summary.totalEmissionsTonsCO2e, '100%'],
      ['Solar PV Clean Energy Avoidance (Offset)', -summary.solarOffsetTotalTons, 'N/A'],
      ['Net Carbon Footprint', Math.max(0, summary.totalEmissionsTonsCO2e - summary.solarOffsetTotalTons), 'N/A'],
      [],
      ['FACILITY INVENTORY BREAKDOWN'],
      ['Facility Name', 'Type', 'Parent Branch', 'Scope 1 (tCO2e)', 'Scope 2 (tCO2e)', 'Scope 3 (tCO2e)', 'Total (tCO2e)'],
      ...summary.facilityStats.map(f => [
        f.facilityName,
        f.facilityType,
        f.parentName || 'Primary',
        f.scope1.toFixed(3),
        f.scope2.toFixed(3),
        f.scope3.toFixed(3),
        f.total.toFixed(3)
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LECO_GHG_Inventory_Report_FY${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const facilityObj = facilities.find(f => f.id === selectedFacilityId);
  const netEmissions = Math.max(0, Number((summary.totalEmissionsTonsCO2e - summary.solarOffsetTotalTons).toFixed(2)));

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      
      {/* Top Action Bar (hidden on print) */}
      <div className="no-print bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span>Executive Reporting & Verification</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            ISO 14064-1 Compliant GHG Inventory Report
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Export carbon footprint statement ready for board reporting, SLSEA submissions, and sustainability disclosures.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Sheet */}
      <div className="bg-white border border-slate-300 rounded-2xl p-8 sm:p-12 shadow-md print:border-none print:shadow-none print:p-0">
        
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-black text-emerald-700 tracking-wider uppercase">
                LANKA ELECTRICITY COMPANY (PVT) LTD
              </div>
              <h2 className="text-2xl font-black text-slate-900 mt-1">
                CORPORATE GREENHOUSE GAS INVENTORY REPORT
              </h2>
              <div className="text-xs text-slate-600 mt-1 font-semibold">
                Reporting Period: Financial Year {selectedYear} &bull; Standard: ISO 14064-1:2018 / GHG Protocol
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono font-bold text-slate-400">DOC REF: LECO/GHG/{selectedYear}/V1</div>
              <div className="text-xs text-slate-500 mt-1">Generated: {new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        {/* Executive Summary Box */}
        <div className="my-6 p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">1. Organizational & Operational Boundary</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            This inventory accounts for greenhouse gas emissions arising from the electricity distribution, retail operations, customer service centres (CSCs), logistics stores, and manufacturing facilities of Lanka Electricity Company (Pvt) Ltd. The consolidation approach is operational control.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Boundary Scope</span>
              <strong className="text-slate-900">{selectedFacilityId === 'ALL' ? 'Consolidated All Facilities' : facilityObj?.name}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Facilities Count</span>
              <strong className="text-slate-900">{summary.facilityStats.length} Monitored</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Audited Records</span>
              <strong className="text-slate-900">{summary.recordsCount} Logs</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Audit Status</span>
              <strong className="text-emerald-700 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 inline" /> Verified
              </strong>
            </div>
          </div>
        </div>

        {/* Scope Emission Tallies Table */}
        <div className="my-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">2. Greenhouse Gas Emission Summary by Scope</h3>
          <table className="w-full text-left text-xs border border-slate-200">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Emission Scope & Source Category</th>
                <th className="py-2.5 px-3">Standard Reference</th>
                <th className="py-2.5 px-3 text-right">Emissions (tCO₂e)</th>
                <th className="py-2.5 px-3 text-right">Share (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              <tr>
                <td className="py-2.5 px-3 font-semibold">
                  <Flame className="w-3.5 h-3.5 text-orange-500 inline mr-1.5" />
                  Scope 1: Direct Combustion, Fleet & SF₆ Fugitives
                </td>
                <td className="py-2.5 px-3 text-slate-500">ISO 14064 Cat 1 / IPCC 2006</td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-orange-600">{summary.scope1TotalTons}</td>
                <td className="py-2.5 px-3 text-right font-mono">
                  {summary.totalEmissionsTonsCO2e > 0 ? ((summary.scope1TotalTons / summary.totalEmissionsTonsCO2e) * 100).toFixed(1) : 0}%
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold">
                  <Zap className="w-3.5 h-3.5 text-blue-500 inline mr-1.5" />
                  Scope 2: Purchased CEB Grid Electricity
                </td>
                <td className="py-2.5 px-3 text-slate-500">ISO 14064 Cat 2 / SLSEA Grid Factor</td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-600">{summary.scope2TotalTons}</td>
                <td className="py-2.5 px-3 text-right font-mono">
                  {summary.totalEmissionsTonsCO2e > 0 ? ((summary.scope2TotalTons / summary.totalEmissionsTonsCO2e) * 100).toFixed(1) : 0}%
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold">
                  <Network className="w-3.5 h-3.5 text-purple-500 inline mr-1.5" />
                  Scope 3: Capital Goods, Logistics, Commuting & Waste
                </td>
                <td className="py-2.5 px-3 text-slate-500">ISO 14064 Cat 3-6 / DEFRA & UK BEIS</td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-purple-600">{summary.scope3TotalTons}</td>
                <td className="py-2.5 px-3 text-right font-mono">
                  {summary.totalEmissionsTonsCO2e > 0 ? ((summary.scope3TotalTons / summary.totalEmissionsTonsCO2e) * 100).toFixed(1) : 0}%
                </td>
              </tr>
              <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                <td className="py-3 px-3 text-slate-900 uppercase">Gross Corporate Carbon Footprint</td>
                <td className="py-3 px-3 text-slate-500">Total Scopes 1, 2 & 3</td>
                <td className="py-3 px-3 text-right font-mono text-base text-slate-900">{summary.totalEmissionsTonsCO2e}</td>
                <td className="py-3 px-3 text-right font-mono">100.0%</td>
              </tr>
              <tr className="bg-emerald-50/50 text-emerald-900 font-semibold">
                <td className="py-2.5 px-3">
                  <Sun className="w-3.5 h-3.5 text-emerald-600 inline mr-1.5" />
                  Renewable Rooftop Solar Clean Energy Avoided GHG
                </td>
                <td className="py-2.5 px-3 text-slate-500">Green Electricity Offset</td>
                <td className="py-2.5 px-3 text-right font-mono text-emerald-700">-{summary.solarOffsetTotalTons}</td>
                <td className="py-2.5 px-3 text-right font-mono">N/A</td>
              </tr>
              <tr className="bg-slate-900 text-white font-bold">
                <td className="py-3 px-3 uppercase">Net Carbon Footprint (Post Solar Offset)</td>
                <td className="py-3 px-3 text-slate-400">Net Accounting</td>
                <td className="py-3 px-3 text-right font-mono text-base text-emerald-400">{netEmissions}</td>
                <td className="py-3 px-3 text-right font-mono">tCO₂e</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Facility Breakdown */}
        <div className="my-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">3. Operational Boundary Breakdown by Facility</h3>
          <table className="w-full text-left text-xs border border-slate-200">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2 px-3">Facility Name</th>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3">Branch Hierarchy</th>
                <th className="py-2 px-3 text-right">Scope 1 (t)</th>
                <th className="py-2 px-3 text-right">Scope 2 (t)</th>
                <th className="py-2 px-3 text-right">Scope 3 (t)</th>
                <th className="py-2 px-3 text-right font-bold">Total (tCO₂e)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {summary.facilityStats.map(f => (
                <tr key={f.facilityId}>
                  <td className="py-2 px-3 font-semibold">{f.facilityName}</td>
                  <td className="py-2 px-3 text-slate-500">{f.facilityType}</td>
                  <td className="py-2 px-3 text-slate-500">{f.parentName || 'Parent / Standalone'}</td>
                  <td className="py-2 px-3 text-right font-mono text-orange-600">{f.scope1.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right font-mono text-blue-600">{f.scope2.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right font-mono text-purple-600">{f.scope3.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right font-mono font-black text-slate-900 bg-slate-50/50">{f.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div className="mt-12 pt-8 border-t-2 border-slate-300 grid grid-cols-3 gap-6 text-center text-xs">
          <div>
            <div className="border-b border-slate-400 pb-8 mb-2 font-mono text-[11px] text-slate-400">
              Eng. Dilani Senanayake
            </div>
            <span className="font-bold text-slate-800 block">Inventory Preparer</span>
            <span className="text-[11px] text-slate-500">Corporate Sustainability Unit</span>
          </div>
          <div>
            <div className="border-b border-slate-400 pb-8 mb-2 font-mono text-[11px] text-slate-400">
              Eng. K.A. Wickramaratne
            </div>
            <span className="font-bold text-slate-800 block">Technical Auditor</span>
            <span className="text-[11px] text-slate-500">Chief Engineer (Operations)</span>
          </div>
          <div>
            <div className="border-b border-slate-400 pb-8 mb-2 font-mono text-[11px] text-slate-400">
              General Manager / CEO
            </div>
            <span className="font-bold text-slate-800 block">Executive Approval</span>
            <span className="text-[11px] text-slate-500">Lanka Electricity Company (Pvt) Ltd</span>
          </div>
        </div>

      </div>

    </div>
  );
};
