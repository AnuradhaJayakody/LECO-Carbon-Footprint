import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  Award, 
  Building2, 
  CheckCircle2, 
  Flame, 
  Zap, 
  Layers, 
  Calendar,
  FileText,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ScopeTotals } from '../types';

export const GhgReports: React.FC = () => {
  const { selectedYear, selectedFacilityId, facilities, notify } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState<ScopeTotals | null>(null);

  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        setLoading(true);
        const data = await api.getAnalyticsSummary(selectedYear, selectedFacilityId);
        setTotals(data.totals);
      } catch (e) {
        console.error(e);
        notify('Failed to generate audit report', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchReportsData();
  }, [selectedYear, selectedFacilityId]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!totals) return;
    const csvRows = [
      ['LECO CORPORATE CARBON FOOTPRINT AUDIT REPORT'],
      ['Reporting Year', selectedYear],
      ['Facility Scope', selectedFacilityId === 'ALL' ? 'Consolidated All Facilities' : selectedFacilityId],
      ['Standard', 'GHG Protocol Corporate Standard & ISO 14064-1:2018'],
      ['Generated Date', new Date().toISOString()],
      [],
      ['SCOPE', 'CATEGORY', 'EMISSIONS (tCO2e)', 'PERCENTAGE (%)'],
      ['Scope 1 (Direct)', 'Company Vehicles Fleet', totals.scope1.vehiclesTCO2e.toFixed(4), ((totals.scope1.vehiclesTCO2e / (totals.grandTotalTCO2e || 1)) * 100).toFixed(2)],
      ['Scope 1 (Direct)', 'Backup Diesel Generators', totals.scope1.generatorsTCO2e.toFixed(4), ((totals.scope1.generatorsTCO2e / (totals.grandTotalTCO2e || 1)) * 100).toFixed(2)],
      ['Scope 1 (Direct)', 'Stationary LPG & Heat', totals.scope1.stationaryLPGTCO2e.toFixed(4), ((totals.scope1.stationaryLPGTCO2e / (totals.grandTotalTCO2e || 1)) * 100).toFixed(2)],
      ['Scope 1 (Direct)', 'Fugitive Refrigerants', totals.scope1.refrigerantsTCO2e.toFixed(4), ((totals.scope1.refrigerantsTCO2e / (totals.grandTotalTCO2e || 1)) * 100).toFixed(2)],
      ['Scope 1 (Direct)', 'SF6 Switchgear Losses', totals.scope1.sf6TCO2e.toFixed(4), ((totals.scope1.sf6TCO2e / (totals.grandTotalTCO2e || 1)) * 100).toFixed(2)],
      ['Scope 1 Subtotal', 'All Scope 1 Sources', totals.scope1.totalTCO2e.toFixed(4), ((totals.scope1.totalTCO2e / (totals.grandTotalTCO2e || 1)) * 100).toFixed(2)],
      [],
      ['Scope 2 (Indirect)', 'Purchased Grid Electricity', totals.scope2.gridElectricityTCO2e.toFixed(4), ((totals.scope2.gridElectricityTCO2e / (totals.grandTotalTCO2e || 1)) * 100).toFixed(2)],
      ['Scope 2 Avoided', 'On-Site Rooftop Solar PV', `-${totals.scope2.solarAvoidedTCO2e.toFixed(4)}`, 'N/A (Offset)'],
      ['Scope 2 Subtotal', 'Gross Scope 2 Electricity', totals.scope2.totalTCO2e.toFixed(4), ((totals.scope2.totalTCO2e / (totals.grandTotalTCO2e || 1)) * 100).toFixed(2)],
      [],
      ['Scope 3 (Value Chain)', 'Purchased Goods & Services', totals.scope3.purchasedGoodsTCO2e.toFixed(4), ((totals.scope3.purchasedGoodsTCO2e / (totals.grandTotalTCO2e || 1)) * 100).toFixed(2)],
      ['Scope 3 (Value Chain)', 'Capital Goods', totals.scope3.capitalGoodsTCO2e.toFixed(4), ((totals.scope3.capitalGoodsTCO2e / (totals.grandTotalTCO2e || 1)) * 100).toFixed(2)],
      ['Scope 3 (Value Chain)', 'Construction Projects', totals.scope3.constructionTCO2e.toFixed(4), ((totals.scope3.constructionTCO2e / (totals.grandTotalTCO2e || 1)) * 100).toFixed(2)],
      ['Scope 3 (Value Chain)', 'Upstream Freight', totals.scope3.upstreamFreightTCO2e.toFixed(4), ((totals.scope3.upstreamFreightTCO2e / (totals.grandTotalTCO2e || 1)) * 100).toFixed(2)],
      ['Scope 3 (Value Chain)', 'Waste Operations', totals.scope3.wasteTCO2e.toFixed(4), ((totals.scope3.wasteTCO2e / (totals.grandTotalTCO2e || 1)) * 100).toFixed(2)],
      ['Scope 3 (Value Chain)', 'Travel & Commuting', totals.scope3.businessTravelCommutingTCO2e.toFixed(4), ((totals.scope3.businessTravelCommutingTCO2e / (totals.grandTotalTCO2e || 1)) * 100).toFixed(2)],
      ['Scope 3 (Value Chain)', 'T&D Electricity Grid Losses', totals.scope3.distributionLossTCO2e.toFixed(4), ((totals.scope3.distributionLossTCO2e / (totals.grandTotalTCO2e || 1)) * 100).toFixed(2)],
      ['Scope 3 Subtotal', 'All Scope 3 Categories', totals.scope3.totalTCO2e.toFixed(4), ((totals.scope3.totalTCO2e / (totals.grandTotalTCO2e || 1)) * 100).toFixed(2)],
      [],
      ['SUMMARY', 'GROSS CORPORATE TOTAL (tCO2e)', totals.grandTotalTCO2e.toFixed(4), '100.00%'],
      ['SUMMARY', 'SOLAR AVOIDED EMISSIONS (tCO2e)', totals.scope2.solarAvoidedTCO2e.toFixed(4), ''],
      ['SUMMARY', 'NET CARBON FOOTPRINT (tCO2e)', totals.netTotalTCO2e.toFixed(4), '']
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LECO_GHG_Audit_Report_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('GHG Audit Report CSV downloaded');
  };

  if (loading || !totals) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const selectedFacName = selectedFacilityId === 'ALL' 
    ? 'All LECO Facilities (Corporate Consolidated)' 
    : facilities.find(f => f.id === selectedFacilityId)?.name || 'Selected Facility';

  return (
    <div className="space-y-6 pb-12">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <span>GHG Verification & Audit Reporting</span>
          </h1>
          <p className="text-xs text-slate-500">
            Compliant with ISO 14064-1 & GHG Protocol Corporate Accounting Standard
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV Dataset</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print Audit Statement</span>
          </button>
        </div>
      </div>

      {/* Printable Audit Statement Document */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-8 max-w-5xl mx-auto printable-report">
        {/* Report Header */}
        <div className="border-b-2 border-slate-900 pb-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xl flex items-center justify-center tracking-tighter shadow-md">
                  LECO
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    LANKA ELECTRICITY COMPANY (PVT) LTD
                  </h2>
                  <p className="text-xs font-semibold text-slate-600">
                    Corporate Sustainability & Carbon Accounting Registry
                  </p>
                </div>
              </div>
            </div>

            <div className="text-right text-xs text-slate-500">
              <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg mb-1">
                ISO 14064-1 COMPLIANT
              </span>
              <p>Audit Ref: <strong>LECO-GHG-{selectedYear}-AUD</strong></p>
              <p>Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Reporting Period</span>
              <span className="font-bold text-slate-900">{selectedYear} (1 Jan - 31 Dec)</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Facility Boundary</span>
              <span className="font-bold text-slate-900">{selectedFacName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Consolidation</span>
              <span className="font-bold text-slate-900">Operational Control</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">GWP Base</span>
              <span className="font-bold text-slate-900">IPCC 5th Assessment (AR5)</span>
            </div>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
            <span className="text-xs font-bold text-amber-800 uppercase block">Scope 1 Direct</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {totals.scope1.totalTCO2e.toFixed(2)} <span className="text-xs text-amber-700 font-semibold">tCO₂e</span>
            </span>
            <span className="text-[11px] text-amber-700">
              {totals.grandTotalTCO2e > 0 ? ((totals.scope1.totalTCO2e / totals.grandTotalTCO2e) * 100).toFixed(1) : 0}% of Gross Footprint
            </span>
          </div>

          <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200">
            <span className="text-xs font-bold text-sky-800 uppercase block">Scope 2 Grid Electricity</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {totals.scope2.totalTCO2e.toFixed(2)} <span className="text-xs text-sky-700 font-semibold">tCO₂e</span>
            </span>
            <span className="text-[11px] text-sky-700">
              {totals.grandTotalTCO2e > 0 ? ((totals.scope2.totalTCO2e / totals.grandTotalTCO2e) * 100).toFixed(1) : 0}% of Gross Footprint
            </span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <span className="text-xs font-bold text-emerald-800 uppercase block">Scope 3 Value Chain</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {totals.scope3.totalTCO2e.toFixed(2)} <span className="text-xs text-emerald-700 font-semibold">tCO₂e</span>
            </span>
            <span className="text-[11px] text-emerald-700">
              {totals.grandTotalTCO2e > 0 ? ((totals.scope3.totalTCO2e / totals.grandTotalTCO2e) * 100).toFixed(1) : 0}% of Gross Footprint
            </span>
          </div>
        </div>

        {/* Audit Data Table */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
            Comprehensive Emission Inventory Breakdown
          </h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="p-3">GHG Scope</th>
                  <th className="p-3">Source / Activity Category</th>
                  <th className="p-3 text-right">Emissions (kg CO₂e)</th>
                  <th className="p-3 text-right">Emissions (tCO₂e)</th>
                  <th className="p-3 text-right">Share (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Scope 1 */}
                <tr className="bg-amber-50/30">
                  <td className="p-3 font-bold text-amber-900" rowSpan={5}>Scope 1: Direct</td>
                  <td className="p-3 font-medium">Company Vehicles (Petrol, Diesel, Hybrid)</td>
                  <td className="p-3 text-right font-mono">{(totals.scope1.vehiclesTCO2e * 1000).toLocaleString()}</td>
                  <td className="p-3 text-right font-mono font-bold text-amber-900">{totals.scope1.vehiclesTCO2e.toFixed(3)}</td>
                  <td className="p-3 text-right font-mono text-slate-500">
                    {totals.grandTotalTCO2e > 0 ? ((totals.scope1.vehiclesTCO2e / totals.grandTotalTCO2e) * 100).toFixed(2) : 0}%
                  </td>
                </tr>
                <tr className="bg-amber-50/30">
                  <td className="p-3 font-medium">Backup Diesel Generators</td>
                  <td className="p-3 text-right font-mono">{(totals.scope1.generatorsTCO2e * 1000).toLocaleString()}</td>
                  <td className="p-3 text-right font-mono font-bold text-amber-900">{totals.scope1.generatorsTCO2e.toFixed(3)}</td>
                  <td className="p-3 text-right font-mono text-slate-500">
                    {totals.grandTotalTCO2e > 0 ? ((totals.scope1.generatorsTCO2e / totals.grandTotalTCO2e) * 100).toFixed(2) : 0}%
                  </td>
                </tr>
                <tr className="bg-amber-50/30">
                  <td className="p-3 font-medium">Stationary LPG & Fuel (Kitchens/Workshops)</td>
                  <td className="p-3 text-right font-mono">{(totals.scope1.stationaryLPGTCO2e * 1000).toLocaleString()}</td>
                  <td className="p-3 text-right font-mono font-bold text-amber-900">{totals.scope1.stationaryLPGTCO2e.toFixed(3)}</td>
                  <td className="p-3 text-right font-mono text-slate-500">
                    {totals.grandTotalTCO2e > 0 ? ((totals.scope1.stationaryLPGTCO2e / totals.grandTotalTCO2e) * 100).toFixed(2) : 0}%
                  </td>
                </tr>
                <tr className="bg-amber-50/30">
                  <td className="p-3 font-medium">Fugitive Refrigerants (R-410A, R-22, R-134a)</td>
                  <td className="p-3 text-right font-mono">{(totals.scope1.refrigerantsTCO2e * 1000).toLocaleString()}</td>
                  <td className="p-3 text-right font-mono font-bold text-amber-900">{totals.scope1.refrigerantsTCO2e.toFixed(3)}</td>
                  <td className="p-3 text-right font-mono text-slate-500">
                    {totals.grandTotalTCO2e > 0 ? ((totals.scope1.refrigerantsTCO2e / totals.grandTotalTCO2e) * 100).toFixed(2) : 0}%
                  </td>
                </tr>
                <tr className="bg-amber-50/30 font-semibold border-b border-slate-300">
                  <td className="p-3 font-medium">SF₆ High-Voltage Switchgear Gas Insulation</td>
                  <td className="p-3 text-right font-mono">{(totals.scope1.sf6TCO2e * 1000).toLocaleString()}</td>
                  <td className="p-3 text-right font-mono font-bold text-amber-900">{totals.scope1.sf6TCO2e.toFixed(3)}</td>
                  <td className="p-3 text-right font-mono text-slate-500">
                    {totals.grandTotalTCO2e > 0 ? ((totals.scope1.sf6TCO2e / totals.grandTotalTCO2e) * 100).toFixed(2) : 0}%
                  </td>
                </tr>

                {/* Scope 2 */}
                <tr className="bg-sky-50/30">
                  <td className="p-3 font-bold text-sky-900" rowSpan={2}>Scope 2: Indirect</td>
                  <td className="p-3 font-medium">Purchased Grid Electricity (CEB Grid)</td>
                  <td className="p-3 text-right font-mono">{(totals.scope2.gridElectricityTCO2e * 1000).toLocaleString()}</td>
                  <td className="p-3 text-right font-mono font-bold text-sky-900">{totals.scope2.gridElectricityTCO2e.toFixed(3)}</td>
                  <td className="p-3 text-right font-mono text-slate-500">
                    {totals.grandTotalTCO2e > 0 ? ((totals.scope2.gridElectricityTCO2e / totals.grandTotalTCO2e) * 100).toFixed(2) : 0}%
                  </td>
                </tr>
                <tr className="bg-sky-50/30 border-b border-slate-300">
                  <td className="p-3 font-medium text-emerald-700 flex items-center space-x-1">
                    <span>• Rooftop Solar PV Generation (Green Avoided Emissions)</span>
                  </td>
                  <td className="p-3 text-right font-mono text-emerald-700">-{(totals.scope2.solarAvoidedTCO2e * 1000).toLocaleString()}</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-700">-{totals.scope2.solarAvoidedTCO2e.toFixed(3)}</td>
                  <td className="p-3 text-right font-mono text-emerald-700">Offset</td>
                </tr>

                {/* Scope 3 */}
                <tr className="bg-emerald-50/30">
                  <td className="p-3 font-bold text-emerald-900" rowSpan={7}>Scope 3: Value Chain</td>
                  <td className="p-3 font-medium">Purchased Goods & Materials</td>
                  <td className="p-3 text-right font-mono">{(totals.scope3.purchasedGoodsTCO2e * 1000).toLocaleString()}</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-900">{totals.scope3.purchasedGoodsTCO2e.toFixed(3)}</td>
                  <td className="p-3 text-right font-mono text-slate-500">
                    {totals.grandTotalTCO2e > 0 ? ((totals.scope3.purchasedGoodsTCO2e / totals.grandTotalTCO2e) * 100).toFixed(2) : 0}%
                  </td>
                </tr>
                <tr className="bg-emerald-50/30">
                  <td className="p-3 font-medium">Capital Goods & Transformers</td>
                  <td className="p-3 text-right font-mono">{(totals.scope3.capitalGoodsTCO2e * 1000).toLocaleString()}</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-900">{totals.scope3.capitalGoodsTCO2e.toFixed(3)}</td>
                  <td className="p-3 text-right font-mono text-slate-500">
                    {totals.grandTotalTCO2e > 0 ? ((totals.scope3.capitalGoodsTCO2e / totals.grandTotalTCO2e) * 100).toFixed(2) : 0}%
                  </td>
                </tr>
                <tr className="bg-emerald-50/30">
                  <td className="p-3 font-medium">Construction Projects</td>
                  <td className="p-3 text-right font-mono">{(totals.scope3.constructionTCO2e * 1000).toLocaleString()}</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-900">{totals.scope3.constructionTCO2e.toFixed(3)}</td>
                  <td className="p-3 text-right font-mono text-slate-500">
                    {totals.grandTotalTCO2e > 0 ? ((totals.scope3.constructionTCO2e / totals.grandTotalTCO2e) * 100).toFixed(2) : 0}%
                  </td>
                </tr>
                <tr className="bg-emerald-50/30">
                  <td className="p-3 font-medium">Upstream Transportation & Logistics</td>
                  <td className="p-3 text-right font-mono">{(totals.scope3.upstreamFreightTCO2e * 1000).toLocaleString()}</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-900">{totals.scope3.upstreamFreightTCO2e.toFixed(3)}</td>
                  <td className="p-3 text-right font-mono text-slate-500">
                    {totals.grandTotalTCO2e > 0 ? ((totals.scope3.upstreamFreightTCO2e / totals.grandTotalTCO2e) * 100).toFixed(2) : 0}%
                  </td>
                </tr>
                <tr className="bg-emerald-50/30">
                  <td className="p-3 font-medium">Waste Generated in Operations</td>
                  <td className="p-3 text-right font-mono">{(totals.scope3.wasteTCO2e * 1000).toLocaleString()}</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-900">{totals.scope3.wasteTCO2e.toFixed(3)}</td>
                  <td className="p-3 text-right font-mono text-slate-500">
                    {totals.grandTotalTCO2e > 0 ? ((totals.scope3.wasteTCO2e / totals.grandTotalTCO2e) * 100).toFixed(2) : 0}%
                  </td>
                </tr>
                <tr className="bg-emerald-50/30">
                  <td className="p-3 font-medium">Business Travel & Employee Commuting</td>
                  <td className="p-3 text-right font-mono">{(totals.scope3.businessTravelCommutingTCO2e * 1000).toLocaleString()}</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-900">{totals.scope3.businessTravelCommutingTCO2e.toFixed(3)}</td>
                  <td className="p-3 text-right font-mono text-slate-500">
                    {totals.grandTotalTCO2e > 0 ? ((totals.scope3.businessTravelCommutingTCO2e / totals.grandTotalTCO2e) * 100).toFixed(2) : 0}%
                  </td>
                </tr>
                <tr className="bg-emerald-50/30 border-b border-slate-300">
                  <td className="p-3 font-medium">Electricity Distribution Losses (T&D Losses)</td>
                  <td className="p-3 text-right font-mono">{(totals.scope3.distributionLossTCO2e * 1000).toLocaleString()}</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-900">{totals.scope3.distributionLossTCO2e.toFixed(3)}</td>
                  <td className="p-3 text-right font-mono text-slate-500">
                    {totals.grandTotalTCO2e > 0 ? ((totals.scope3.distributionLossTCO2e / totals.grandTotalTCO2e) * 100).toFixed(2) : 0}%
                  </td>
                </tr>

                {/* Grand Total */}
                <tr className="bg-slate-900 text-white font-extrabold">
                  <td colSpan={2} className="p-4 text-sm uppercase">
                    Gross Corporate Carbon Footprint
                  </td>
                  <td className="p-4 text-right font-mono text-sm">
                    {(totals.grandTotalTCO2e * 1000).toLocaleString()} kg
                  </td>
                  <td className="p-4 text-right font-mono text-base text-emerald-400">
                    {totals.grandTotalTCO2e.toFixed(3)} tCO₂e
                  </td>
                  <td className="p-4 text-right font-mono text-sm">
                    100.00%
                  </td>
                </tr>
                <tr className="bg-slate-800 text-slate-300 font-bold">
                  <td colSpan={2} className="p-3 text-xs uppercase">
                    Net Carbon Footprint (After Solar PV Offsets)
                  </td>
                  <td className="p-3 text-right font-mono">
                    {(totals.netTotalTCO2e * 1000).toLocaleString()} kg
                  </td>
                  <td className="p-3 text-right font-mono text-sm text-emerald-300">
                    {totals.netTotalTCO2e.toFixed(3)} tCO₂e
                  </td>
                  <td className="p-3 text-right font-mono">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Verification & Signoff Signatures */}
        <div className="pt-8 border-t border-slate-200 mt-8 grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs text-slate-600">
          <div>
            <p className="font-semibold text-slate-900 mb-10">Prepared By:</p>
            <div className="border-t border-slate-300 pt-1">
              <p className="font-bold text-slate-800">LECO Sustainability Officer</p>
              <p className="text-[11px] text-slate-500">Corporate Planning Division</p>
            </div>
          </div>
          <div>
            <p className="font-semibold text-slate-900 mb-10">Verified By:</p>
            <div className="border-t border-slate-300 pt-1">
              <p className="font-bold text-slate-800">Head of Engineering / Operations</p>
              <p className="text-[11px] text-slate-500">LECO Management Committee</p>
            </div>
          </div>
          <div>
            <p className="font-semibold text-slate-900 mb-10">External GHG Auditor:</p>
            <div className="border-t border-slate-300 pt-1">
              <p className="font-bold text-slate-800">Certified ISO 14064-1 Verifier</p>
              <p className="text-[11px] text-slate-500">Sri Lanka Climate Fund / SLSI</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
