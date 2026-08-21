import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Sun, 
  Plus, 
  Trash2, 
  FileSpreadsheet, 
  Search, 
  Building2, 
  TrendingDown, 
  X,
  Leaf,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Scope2ElectricityRecord, Scope2SolarRecord, ReportingMonth } from '../types';

type Scope2Tab = 'electricity' | 'solar';

const MONTHS: ReportingMonth[] = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const Scope2Section: React.FC = () => {
  const { selectedYear, selectedFacilityId, facilities, accessibleFacilities, canDelete, notify } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<Scope2Tab>('electricity');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [electricityRecords, setElectricityRecords] = useState<Scope2ElectricityRecord[]>([]);
  const [solarRecords, setSolarRecords] = useState<Scope2SolarRecord[]>([]);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [facilityId, setFacilityId] = useState(facilities[0]?.id || '');
  const [month, setMonth] = useState<ReportingMonth>('January');
  const [responsibleOfficer, setResponsibleOfficer] = useState('');
  const [remarks, setRemarks] = useState('');

  // Electricity Fields
  const [accountNumber, setAccountNumber] = useState('');
  const [meterNumber, setMeterNumber] = useState('');
  const [tariffCategory, setTariffCategory] = useState('Commercial / General');
  const [consumedKWh, setConsumedKWh] = useState<number>(15000);
  const [billedAmountLKR, setBilledAmountLKR] = useState<number>(960000);
  const [gridFactor, setGridFactor] = useState<number>(0.655);

  // Solar Fields
  const [systemCapacityKWp, setSystemCapacityKWp] = useState<number>(75.0);
  const [solarGeneratedKWh, setSolarGeneratedKWh] = useState<number>(9500);
  const [selfConsumedKWh, setSelfConsumedKWh] = useState<number>(8500);
  const [exportedToGridKWh, setExportedToGridKWh] = useState<number>(1000);
  const [importedFromGridKWh, setImportedFromGridKWh] = useState<number>(25000);

  const loadData = async () => {
    try {
      setLoading(true);
      const [el, sol] = await Promise.all([
        api.getScope2Electricity(selectedYear, selectedFacilityId),
        api.getScope2Solar(selectedYear, selectedFacilityId)
      ]);
      setElectricityRecords(el);
      setSolarRecords(sol);
    } catch (e) {
      console.error(e);
      notify('Failed to load Scope 2 records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedYear, selectedFacilityId]);

  useEffect(() => {
    if (facilities.length > 0) {
      const fac = facilities.find(f => f.id === facilityId) || facilities[0];
      if (fac) {
        setResponsibleOfficer(fac.responsibleOfficer);
        setAccountNumber(fac.electricityAccountNo || '');
        setMeterNumber(fac.meterNumbers?.[0] || '');
        if (fac.solarCapacityKW) {
          setSystemCapacityKWp(fac.solarCapacityKW);
        }
      }
    }
  }, [facilityId, facilities]);

  const handleOpenAdd = () => {
    const fac = selectedFacilityId !== 'ALL' 
      ? facilities.find(f => f.id === selectedFacilityId) || facilities[0] 
      : facilities[0];
    setFacilityId(fac?.id || '');
    setResponsibleOfficer(fac?.responsibleOfficer || '');
    setAccountNumber(fac?.electricityAccountNo || 'ACC-011-8890');
    setMeterNumber(fac?.meterNumbers?.[0] || 'MTR-01');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fac = facilities.find(f => f.id === facilityId) || facilities[0];

    try {
      if (activeSubTab === 'electricity') {
        const kg = consumedKWh * gridFactor;
        const t = Number((kg / 1000).toFixed(4));
        const payload: Partial<Scope2ElectricityRecord> = {
          facilityId: fac.id,
          facilityName: fac.name,
          reportingYear: selectedYear,
          month,
          responsibleOfficer: responsibleOfficer || fac.responsibleOfficer,
          accountNumber,
          meterNumber,
          tariffCategory,
          consumedKWh: Number(consumedKWh),
          billedAmountLKR: Number(billedAmountLKR),
          gridEmissionFactorKgPerKWh: gridFactor,
          calculatedKgCO2e: kg,
          calculatedTCO2e: t,
          status: 'Approved',
          remarks
        };
        await api.createScope2Electricity(payload);
        notify('Electricity consumption recorded successfully');
      } else {
        const avoidedT = Number(((solarGeneratedKWh * gridFactor) / 1000).toFixed(4));
        const netPurchased = Math.max(0, importedFromGridKWh - exportedToGridKWh);
        const netScope2T = Number(((netPurchased * gridFactor) / 1000).toFixed(4));
        const payload: Partial<Scope2SolarRecord> = {
          facilityId: fac.id,
          facilityName: fac.name,
          reportingYear: selectedYear,
          month,
          responsibleOfficer: responsibleOfficer || fac.responsibleOfficer,
          systemCapacityKWp: Number(systemCapacityKWp),
          solarGeneratedKWh: Number(solarGeneratedKWh),
          selfConsumedKWh: Number(selfConsumedKWh),
          exportedToGridKWh: Number(exportedToGridKWh),
          importedFromGridKWh: Number(importedFromGridKWh),
          avoidedEmissionsTCO2e: avoidedT,
          netPurchasedKWh: netPurchased,
          netScope2EmissionsTCO2e: netScope2T,
          status: 'Approved',
          remarks
        };
        await api.createScope2Solar(payload);
        notify('Solar PV generation recorded successfully');
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      notify(err.message || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) {
      notify('Delete capability is disabled for your user profile.', 'error');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      if (activeSubTab === 'electricity') await api.deleteScope2Electricity(id);
      else await api.deleteScope2Solar(id);
      notify('Record removed');
      loadData();
    } catch (err) {
      notify('Failed to delete record', 'error');
    }
  };

  const totalGridElectricityT = electricityRecords.reduce((s, i) => s + (i.calculatedTCO2e || 0), 0);
  const totalSolarAvoidedT = solarRecords.reduce((s, i) => s + (i.avoidedEmissionsTCO2e || 0), 0);
  const totalSolarGeneratedKWh = solarRecords.reduce((s, i) => s + (i.solarGeneratedKWh || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Scope 2 Header Banner */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-slate-900 rounded-2xl p-6 text-white border border-sky-800/40 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="bg-sky-500/20 text-sky-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-sky-500/40 flex items-center space-x-1">
                <Zap className="w-3.5 h-3.5" />
                <span>Scope 2: Indirect Electricity Emissions</span>
              </span>
              <span className="text-slate-400 text-xs">• Year {selectedYear}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Purchased Grid Electricity & On-site Solar PV
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Calculated using the location-based Sri Lanka Grid Emission Factor (~0.655 kg CO₂e/kWh). On-site rooftop Solar PV arrays generate clean electricity and provide verified avoided emissions.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-sky-500/30 text-right">
              <span className="text-[10px] text-sky-400 font-semibold block uppercase">Gross Grid Scope 2</span>
              <span className="text-xl font-extrabold text-white">
                {totalGridElectricityT.toFixed(3)} <span className="text-xs text-sky-400">tCO₂e</span>
              </span>
            </div>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition shadow-md shadow-sky-950"
            >
              <Plus className="w-4 h-4" />
              <span>Log Electricity / Solar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveSubTab('electricity')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'electricity'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Purchased Grid Electricity ({electricityRecords.length})</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/20 text-white font-mono">
            {totalGridElectricityT.toFixed(2)}t
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('solar')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'solar'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sun className="w-4 h-4" />
          <span>On-Site Rooftop Solar PV ({solarRecords.length})</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/20 text-white font-mono">
            -{totalSolarAvoidedT.toFixed(2)}t Avoided
          </span>
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by facility or account no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="text-xs text-slate-500 flex items-center space-x-2">
            <Leaf className="w-4 h-4 text-emerald-600" />
            <span>Sri Lanka Grid Factor: <strong>0.655 kg CO₂e / kWh</strong></span>
          </div>
        </div>

        {/* 1. Electricity Grid Table */}
        {activeSubTab === 'electricity' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Month</th>
                  <th className="p-3.5">Facility / Location</th>
                  <th className="p-3.5">Account No</th>
                  <th className="p-3.5">Meter No</th>
                  <th className="p-3.5 text-right">Consumed (kWh)</th>
                  <th className="p-3.5 text-right">Billed (LKR)</th>
                  <th className="p-3.5 text-right">Grid Factor</th>
                  <th className="p-3.5 text-right">Emissions (tCO₂e)</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {electricityRecords
                  .filter(r => r.facilityName.toLowerCase().includes(searchTerm.toLowerCase()) || r.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((rec) => (
                    <tr key={rec.id} className="hover:bg-sky-50/30 transition">
                      <td className="p-3.5 font-medium text-slate-900">{rec.month}</td>
                      <td className="p-3.5 text-slate-700 font-medium">{rec.facilityName}</td>
                      <td className="p-3.5 font-mono text-slate-600">{rec.accountNumber}</td>
                      <td className="p-3.5 font-mono font-bold text-slate-800">{rec.meterNumber}</td>
                      <td className="p-3.5 text-right font-mono font-bold">{rec.consumedKWh.toLocaleString()} kWh</td>
                      <td className="p-3.5 text-right font-mono text-slate-600">
                        {rec.billedAmountLKR ? `Rs. ${rec.billedAmountLKR.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-3.5 text-right font-mono text-slate-500">{rec.gridEmissionFactorKgPerKWh}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-sky-700">
                        {rec.calculatedTCO2e.toFixed(4)} t
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleDelete(rec.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                {electricityRecords.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      No electricity consumption records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. Solar PV Table */}
        {activeSubTab === 'solar' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Month</th>
                  <th className="p-3.5">Facility</th>
                  <th className="p-3.5 text-right">Capacity (kWp)</th>
                  <th className="p-3.5 text-right">Generated (kWh)</th>
                  <th className="p-3.5 text-right">Self-Consumed</th>
                  <th className="p-3.5 text-right">Exported</th>
                  <th className="p-3.5 text-right">Imported</th>
                  <th className="p-3.5 text-right">Avoided (tCO₂e)</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {solarRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-emerald-50/30 transition">
                    <td className="p-3.5 font-medium text-slate-900">{rec.month}</td>
                    <td className="p-3.5 text-slate-700 font-medium">{rec.facilityName}</td>
                    <td className="p-3.5 text-right font-mono">{rec.systemCapacityKWp} kWp</td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-700">
                      {rec.solarGeneratedKWh.toLocaleString()} kWh
                    </td>
                    <td className="p-3.5 text-right font-mono">{rec.selfConsumedKWh.toLocaleString()} kWh</td>
                    <td className="p-3.5 text-right font-mono text-slate-600">{rec.exportedToGridKWh.toLocaleString()} kWh</td>
                    <td className="p-3.5 text-right font-mono text-slate-600">{rec.importedFromGridKWh.toLocaleString()} kWh</td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-600">
                      -{rec.avoidedEmissionsTCO2e.toFixed(4)} t
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleDelete(rec.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {solarRecords.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      No solar PV generation records logged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Scope 2 Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Log Scope 2 Electricity Data
                  </h2>
                  <p className="text-xs text-slate-500">
                    {activeSubTab === 'electricity' ? 'Purchased Grid Electricity Bill Record' : 'On-Site Solar PV Generation'}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Facility / Branch</label>
                  <select
                    value={facilityId}
                    onChange={(e) => setFacilityId(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {accessibleFacilities.map((f) => (
                      <option key={f.id} value={f.id}>{f.name} ({f.type})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Reporting Month</label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value as ReportingMonth)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {activeSubTab === 'electricity' ? (
                <div className="space-y-4 border-t border-slate-100 pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Account Number</label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="ACC-010-9882"
                        required
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Meter Number</label>
                      <input
                        type="text"
                        value={meterNumber}
                        onChange={(e) => setMeterNumber(e.target.value)}
                        placeholder="MTR-001"
                        required
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Electricity Consumed (kWh)</label>
                      <input
                        type="number"
                        value={consumedKWh}
                        onChange={(e) => setConsumedKWh(Number(e.target.value))}
                        required
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Billed Amount (LKR)</label>
                      <input
                        type="number"
                        value={billedAmountLKR}
                        onChange={(e) => setBilledAmountLKR(Number(e.target.value))}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Grid Factor (kg/kWh)</label>
                      <input
                        type="number"
                        step="0.001"
                        value={gridFactor}
                        onChange={(e) => setGridFactor(Number(e.target.value))}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 flex items-center justify-between text-xs">
                    <span className="text-sky-900 font-medium">Calculated Scope 2 Emissions:</span>
                    <span className="font-bold text-sky-900 font-mono text-sm">
                      {((consumedKWh * gridFactor) / 1000).toFixed(4)} tCO₂e ({ (consumedKWh * gridFactor).toLocaleString() } kg CO₂e)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 border-t border-slate-100 pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">System Capacity (kWp)</label>
                      <input
                        type="number"
                        value={systemCapacityKWp}
                        onChange={(e) => setSystemCapacityKWp(Number(e.target.value))}
                        required
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Solar Generated (kWh)</label>
                      <input
                        type="number"
                        value={solarGeneratedKWh}
                        onChange={(e) => setSolarGeneratedKWh(Number(e.target.value))}
                        required
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Self-Consumed (kWh)</label>
                      <input
                        type="number"
                        value={selfConsumedKWh}
                        onChange={(e) => setSelfConsumedKWh(Number(e.target.value))}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Exported to Grid (kWh)</label>
                      <input
                        type="number"
                        value={exportedToGridKWh}
                        onChange={(e) => setExportedToGridKWh(Number(e.target.value))}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Imported from Grid (kWh)</label>
                      <input
                        type="number"
                        value={importedFromGridKWh}
                        onChange={(e) => setImportedFromGridKWh(Number(e.target.value))}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                    <span className="text-emerald-900 font-medium">Verified Avoided Emissions (Green Credit):</span>
                    <span className="font-bold text-emerald-700 font-mono text-sm">
                      -{((solarGeneratedKWh * gridFactor) / 1000).toFixed(4)} tCO₂e
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Responsible Officer</label>
                  <input
                    type="text"
                    value={responsibleOfficer}
                    onChange={(e) => setResponsibleOfficer(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Remarks</label>
                  <input
                    type="text"
                    placeholder="e.g. Monthly CEB invoice reference"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl transition shadow-md shadow-sky-950"
                >
                  Save Scope 2 Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
