import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  ShoppingBag, 
  HardHat, 
  Truck, 
  Trash2, 
  Plane, 
  ZapOff, 
  Plus, 
  Search, 
  Building2, 
  X, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  Package
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Scope3PurchasedGoodsRecord, 
  Scope3CapitalGoodsRecord, 
  Scope3ConstructionRecord, 
  Scope3UpstreamFreightRecord, 
  Scope3WasteRecord, 
  Scope3BusinessTravelRecord, 
  Scope3DistributionLossRecord,
  ReportingMonth,
  TransportMode,
  WasteCategory,
  DisposalMethod,
  TravelMode
} from '../types';

type Scope3Tab = 'goods' | 'capital' | 'construction' | 'freight' | 'waste' | 'travel' | 'loss';

const MONTHS: ReportingMonth[] = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const Scope3Section: React.FC = () => {
  const { selectedYear, selectedFacilityId, facilities, accessibleFacilities, canDelete, notify } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<Scope3Tab>('goods');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Collections
  const [goods, setGoods] = useState<Scope3PurchasedGoodsRecord[]>([]);
  const [capital, setCapital] = useState<Scope3CapitalGoodsRecord[]>([]);
  const [construction, setConstruction] = useState<Scope3ConstructionRecord[]>([]);
  const [freight, setFreight] = useState<Scope3UpstreamFreightRecord[]>([]);
  const [waste, setWaste] = useState<Scope3WasteRecord[]>([]);
  const [travel, setTravel] = useState<Scope3BusinessTravelRecord[]>([]);
  const [distributionLosses, setDistributionLosses] = useState<Scope3DistributionLossRecord[]>([]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [facilityId, setFacilityId] = useState(facilities[0]?.id || '');
  const [month, setMonth] = useState<ReportingMonth>('January');
  const [responsibleOfficer, setResponsibleOfficer] = useState('');
  const [remarks, setRemarks] = useState('');

  // Form Fields
  // Goods
  const [goodsCategory, setGoodsCategory] = useState<any>('Cables & Conductors');
  const [goodsDesc, setGoodsDesc] = useState('');
  const [goodsQty, setGoodsQty] = useState<number>(10);
  const [goodsUnit, setGoodsUnit] = useState('Kilometers');
  const [goodsSupplier, setGoodsSupplier] = useState('');
  const [goodsValueLKR, setGoodsValueLKR] = useState<number>(5000000);

  // Capital
  const [capitalName, setCapitalName] = useState('');
  const [capitalType, setCapitalType] = useState<any>('Distribution Transformers');
  const [capitalQty, setCapitalQty] = useState<number>(5);
  const [capitalSupplier, setCapitalSupplier] = useState('');
  const [capitalValueLKR, setCapitalValueLKR] = useState<number>(15000000);

  // Construction
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState<any>('Underground Cabling');
  const [contractorName, setContractorName] = useState('');
  const [constructionPeriodMonths, setConstructionPeriodMonths] = useState<number>(6);
  const [projectValueLKR, setProjectValueLKR] = useState<number>(25000000);
  const [majorMaterials, setMajorMaterials] = useState('');

  // Freight
  const [freightMaterial, setFreightMaterial] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [weightTonnes, setWeightTonnes] = useState<number>(20);
  const [distanceKm, setDistanceKm] = useState<number>(45);
  const [transportMode, setTransportMode] = useState<TransportMode>('Heavy Diesel Truck (14t+)');

  // Waste
  const [wasteType, setWasteType] = useState<WasteCategory>('Scrap Copper & Aluminum');
  const [wasteQtyKg, setWasteQtyKg] = useState<number>(1200);
  const [disposalMethod, setDisposalMethod] = useState<DisposalMethod>('Authorized Certified Recycling');
  const [wasteContractor, setWasteContractor] = useState('');

  // Travel
  const [travelCategory, setTravelCategory] = useState<'Business Travel' | 'Employee Commuting'>('Business Travel');
  const [travelPurpose, setTravelPurpose] = useState('');
  const [travelOrigin, setTravelOrigin] = useState('');
  const [travelDest, setTravelDest] = useState('');
  const [travelMode, setTravelMode] = useState<TravelMode>('Company Car / Hired Vehicle');
  const [numberOfTrips, setNumberOfTrips] = useState<number>(1);
  const [distanceKmPerTrip, setDistanceKmPerTrip] = useState<number>(120);

  // T&D Losses
  const [recMWh, setRecMWh] = useState<number>(145000);
  const [ownMWh, setOwnMWh] = useState<number>(105);
  const [billedMWh, setBilledMWh] = useState<number>(139200);

  const loadData = async () => {
    try {
      setLoading(true);
      const [g, c, cn, fr, ws, tr, dl] = await Promise.all([
        api.getScope3Goods(selectedYear, selectedFacilityId),
        api.getScope3Capital(selectedYear, selectedFacilityId),
        api.getScope3Construction(selectedYear, selectedFacilityId),
        api.getScope3Freight(selectedYear, selectedFacilityId),
        api.getScope3Waste(selectedYear, selectedFacilityId),
        api.getScope3Travel(selectedYear, selectedFacilityId),
        api.getScope3DistributionLosses(selectedYear, selectedFacilityId)
      ]);
      setGoods(g);
      setCapital(c);
      setConstruction(cn);
      setFreight(fr);
      setWaste(ws);
      setTravel(tr);
      setDistributionLosses(dl);
    } catch (e) {
      console.error(e);
      notify('Failed to load Scope 3 data', 'error');
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
      }
    }
  }, [facilityId, facilities]);

  const handleOpenAdd = () => {
    const fac = selectedFacilityId !== 'ALL' 
      ? facilities.find(f => f.id === selectedFacilityId) || facilities[0] 
      : facilities[0];
    setFacilityId(fac?.id || '');
    setResponsibleOfficer(fac?.responsibleOfficer || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fac = facilities.find(f => f.id === facilityId) || facilities[0];

    try {
      if (activeSubTab === 'goods') {
        const factor = 0.48; // kg CO2e per 1,000 LKR
        const kg = (goodsValueLKR / 1000) * factor;
        const t = Number((kg / 1000).toFixed(4));
        await api.createScope3Goods({
          facilityId: fac.id,
          facilityName: fac.name,
          reportingYear: selectedYear,
          month,
          responsibleOfficer: responsibleOfficer || fac.responsibleOfficer,
          category: goodsCategory,
          itemDescription: goodsDesc || 'Distribution line materials',
          quantity: Number(goodsQty),
          unit: goodsUnit,
          supplierName: goodsSupplier || 'Authorized Supplier',
          valueLKR: Number(goodsValueLKR),
          spendEmissionFactorKgPer1000LKR: factor,
          calculatedKgCO2e: kg,
          calculatedTCO2e: t,
          status: 'Approved',
          remarks
        });
        notify('Purchased goods entry saved');
      } else if (activeSubTab === 'capital') {
        const factor = 0.52;
        const kg = (capitalValueLKR / 1000) * factor;
        const t = Number((kg / 1000).toFixed(4));
        await api.createScope3Capital({
          facilityId: fac.id,
          facilityName: fac.name,
          reportingYear: selectedYear,
          month,
          responsibleOfficer: responsibleOfficer || fac.responsibleOfficer,
          assetName: capitalName || 'High-Voltage Distribution Transformer',
          assetType: capitalType,
          quantity: Number(capitalQty),
          supplier: capitalSupplier || 'LTL Transformers',
          valueLKR: Number(capitalValueLKR),
          spendEmissionFactorKgPer1000LKR: factor,
          calculatedKgCO2e: kg,
          calculatedTCO2e: t,
          status: 'Approved',
          remarks
        });
        notify('Capital goods asset saved');
      } else if (activeSubTab === 'construction') {
        const factor = 0.38;
        const kg = (projectValueLKR / 1000) * factor;
        const t = Number((kg / 1000).toFixed(4));
        await api.createScope3Construction({
          facilityId: fac.id,
          facilityName: fac.name,
          reportingYear: selectedYear,
          month,
          responsibleOfficer: responsibleOfficer || fac.responsibleOfficer,
          projectName: projectName || 'LECO Network Modernization Project',
          projectType,
          contractorName: contractorName || 'Civil Works Contractor',
          constructionPeriodMonths: Number(constructionPeriodMonths),
          projectValueLKR: Number(projectValueLKR),
          majorMaterialsSummary: majorMaterials || 'Cables, concrete, conduits',
          calculatedKgCO2e: kg,
          calculatedTCO2e: t,
          status: 'Approved',
          remarks
        });
        notify('Construction project record saved');
      } else if (activeSubTab === 'freight') {
        const factor = 0.162;
        const kg = weightTonnes * distanceKm * factor;
        const t = Number((kg / 1000).toFixed(4));
        await api.createScope3Freight({
          facilityId: fac.id,
          facilityName: fac.name,
          reportingYear: selectedYear,
          month,
          responsibleOfficer: responsibleOfficer || fac.responsibleOfficer,
          materialDescription: freightMaterial || 'Bulk transformer oil and conductors',
          origin: origin || 'Colombo Port',
          destination: destination || 'Central Store Kotikawatta',
          weightTonnes: Number(weightTonnes),
          distanceKm: Number(distanceKm),
          transportMode,
          emissionFactorKgPerTonneKm: factor,
          calculatedKgCO2e: kg,
          calculatedTCO2e: t,
          status: 'Approved',
          remarks
        });
        notify('Upstream freight logistics saved');
      } else if (activeSubTab === 'waste') {
        const factor = wasteType.includes('Scrap') ? -0.22 : 0.58;
        const kg = wasteQtyKg * factor;
        const t = Number((kg / 1000).toFixed(4));
        await api.createScope3Waste({
          facilityId: fac.id,
          facilityName: fac.name,
          reportingYear: selectedYear,
          month,
          responsibleOfficer: responsibleOfficer || fac.responsibleOfficer,
          wasteType,
          quantityKg: Number(wasteQtyKg),
          disposalMethod,
          contractorName: wasteContractor || 'Authorized Recycler',
          emissionFactorKgPerKg: factor,
          calculatedKgCO2e: kg,
          calculatedTCO2e: t,
          status: 'Approved',
          remarks
        });
        notify('Waste operations record saved');
      } else if (activeSubTab === 'travel') {
        let factor = 0.171;
        if (travelMode.includes('Air')) factor = 0.102;
        if (travelMode.includes('Bus')) factor = 0.042;
        if (travelMode.includes('Train')) factor = 0.035;
        if (travelMode.includes('Motorcycle')) factor = 0.103;

        const totalPkm = numberOfTrips * distanceKmPerTrip;
        const kg = totalPkm * factor;
        const t = Number((kg / 1000).toFixed(4));
        await api.createScope3Travel({
          facilityId: fac.id,
          facilityName: fac.name,
          reportingYear: selectedYear,
          month,
          responsibleOfficer: responsibleOfficer || fac.responsibleOfficer,
          travelCategory,
          purposeOrEmployeeGroup: travelPurpose || 'Staff Operational Travel',
          origin: travelOrigin || 'Branch Office',
          destination: travelDest || 'Site',
          transportMode: travelMode,
          numberOfTrips: Number(numberOfTrips),
          distanceKmPerTrip: Number(distanceKmPerTrip),
          totalPassengerKm: totalPkm,
          emissionFactorKgPerPassengerKm: factor,
          calculatedKgCO2e: kg,
          calculatedTCO2e: t,
          status: 'Approved',
          remarks
        });
        notify('Business travel / commuting record saved');
      } else if (activeSubTab === 'loss') {
        const lossMWh = Math.max(0, recMWh - ownMWh - billedMWh);
        const lossPct = Number(((lossMWh / recMWh) * 100).toFixed(2));
        const gridFactor = 0.655;
        const t = Number((lossMWh * gridFactor).toFixed(4));
        const kg = t * 1000;
        await api.createScope3DistributionLoss({
          facilityId: fac.id,
          facilityName: fac.name,
          reportingYear: selectedYear,
          month,
          responsibleOfficer: responsibleOfficer || fac.responsibleOfficer,
          electricityReceivedFromCEBMWh: Number(recMWh),
          lecoOwnConsumptionMWh: Number(ownMWh),
          electricityBilledToConsumersMWh: Number(billedMWh),
          distributionLossMWh: lossMWh,
          lossPercentage: lossPct,
          gridEmissionFactorTonnePerMWh: gridFactor,
          calculatedKgCO2e: kg,
          calculatedTCO2e: t,
          status: 'Approved',
          remarks
        });
        notify('Electricity distribution loss recorded');
      }

      setShowModal(false);
      loadData();
    } catch (err: any) {
      notify(err.message || 'Failed to save', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) {
      notify('Delete capability is disabled for your user profile.', 'error');
      return;
    }
    if (!window.confirm('Delete this record?')) return;
    try {
      if (activeSubTab === 'goods') await api.deleteScope3Goods(id);
      if (activeSubTab === 'capital') await api.deleteScope3Capital(id);
      if (activeSubTab === 'construction') await api.deleteScope3Construction(id);
      if (activeSubTab === 'freight') await api.deleteScope3Freight(id);
      if (activeSubTab === 'waste') await api.deleteScope3Waste(id);
      if (activeSubTab === 'travel') await api.deleteScope3Travel(id);
      if (activeSubTab === 'loss') await api.deleteScope3DistributionLoss(id);
      notify('Record deleted');
      loadData();
    } catch (e) {
      notify('Delete failed', 'error');
    }
  };

  const totalGoodsT = goods.reduce((s, i) => s + (i.calculatedTCO2e || 0), 0);
  const totalCapitalT = capital.reduce((s, i) => s + (i.calculatedTCO2e || 0), 0);
  const totalConstructionT = construction.reduce((s, i) => s + (i.calculatedTCO2e || 0), 0);
  const totalFreightT = freight.reduce((s, i) => s + (i.calculatedTCO2e || 0), 0);
  const totalWasteT = waste.reduce((s, i) => s + (i.calculatedTCO2e || 0), 0);
  const totalTravelT = travel.reduce((s, i) => s + (i.calculatedTCO2e || 0), 0);
  const totalLossT = distributionLosses.reduce((s, i) => s + (i.calculatedTCO2e || 0), 0);
  const grandScope3TotalT = totalGoodsT + totalCapitalT + totalConstructionT + totalFreightT + totalWasteT + totalTravelT + totalLossT;

  return (
    <div className="space-y-6 pb-12">
      {/* Scope 3 Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 rounded-2xl p-6 text-white border border-emerald-800/40 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/40 flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5" />
                <span>Scope 3: Value Chain Emissions</span>
              </span>
              <span className="text-slate-400 text-xs">• Year {selectedYear}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Upstream Supply Chain & Value Chain Accounting
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Covers purchased goods, capitalized transformers/plant, network construction projects, freight logistics, waste recycling, business travel, employee commuting, and distribution grid losses.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-emerald-500/30 text-right">
              <span className="text-[10px] text-emerald-400 font-semibold block uppercase">Total Scope 3</span>
              <span className="text-xl font-extrabold text-white">
                {grandScope3TotalT.toFixed(3)} <span className="text-xs text-emerald-400">tCO₂e</span>
              </span>
            </div>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition shadow-md shadow-emerald-950"
            >
              <Plus className="w-4 h-4" />
              <span>Log Scope 3 Record</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveSubTab('goods')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'goods' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Purchased Goods ({goods.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('capital')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'capital' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Capital Goods ({capital.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('construction')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'construction' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <HardHat className="w-3.5 h-3.5" />
          <span>Construction ({construction.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('freight')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'freight' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Upstream Freight ({freight.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('waste')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'waste' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Waste Operations ({waste.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('travel')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'travel' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <Plane className="w-3.5 h-3.5" />
          <span>Travel & Commute ({travel.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('loss')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'loss' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <ZapOff className="w-3.5 h-3.5" />
          <span>T&D Grid Loss ({distributionLosses.length})</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="text-xs text-slate-500">
            GHG Protocol Scope 3 Standardized EEIO & Activity Metrics
          </div>
        </div>

        {/* 1. Purchased Goods Table */}
        {activeSubTab === 'goods' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Month</th>
                  <th className="p-3.5">Facility</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Item Description</th>
                  <th className="p-3.5">Supplier</th>
                  <th className="p-3.5 text-right">Value (LKR)</th>
                  <th className="p-3.5 text-right">Emissions (tCO₂e)</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {goods.map((rec) => (
                  <tr key={rec.id} className="hover:bg-emerald-50/30 transition">
                    <td className="p-3.5 font-medium text-slate-900">{rec.month}</td>
                    <td className="p-3.5 text-slate-700">{rec.facilityName}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-medium">
                        {rec.category}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium text-slate-900">{rec.itemDescription}</td>
                    <td className="p-3.5 text-slate-600">{rec.supplierName}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                      Rs. {rec.valueLKR.toLocaleString()}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-700">
                      {rec.calculatedTCO2e.toFixed(4)} t
                    </td>
                    <td className="p-3.5 text-center">
                      <button onClick={() => handleDelete(rec.id)} className="p-1 text-slate-400 hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {goods.length === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-slate-400">No purchased goods records logged.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. Capital Goods Table */}
        {activeSubTab === 'capital' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Month</th>
                  <th className="p-3.5">Facility</th>
                  <th className="p-3.5">Asset Item</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5 text-right">Qty</th>
                  <th className="p-3.5 text-right">Value (LKR)</th>
                  <th className="p-3.5 text-right">Emissions (tCO₂e)</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {capital.map((rec) => (
                  <tr key={rec.id} className="hover:bg-emerald-50/30 transition">
                    <td className="p-3.5 font-medium text-slate-900">{rec.month}</td>
                    <td className="p-3.5 text-slate-700">{rec.facilityName}</td>
                    <td className="p-3.5 font-bold text-slate-900">{rec.assetName}</td>
                    <td className="p-3.5 text-slate-600">{rec.assetType}</td>
                    <td className="p-3.5 text-right font-mono">{rec.quantity}</td>
                    <td className="p-3.5 text-right font-mono font-bold">Rs. {rec.valueLKR.toLocaleString()}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-700">{rec.calculatedTCO2e.toFixed(4)} t</td>
                    <td className="p-3.5 text-center">
                      <button onClick={() => handleDelete(rec.id)} className="p-1 text-slate-400 hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {capital.length === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-slate-400">No capital goods records logged.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. Construction Table */}
        {activeSubTab === 'construction' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Month</th>
                  <th className="p-3.5">Project Name</th>
                  <th className="p-3.5">Project Type</th>
                  <th className="p-3.5">Contractor</th>
                  <th className="p-3.5 text-right">Value (LKR)</th>
                  <th className="p-3.5 text-right">Emissions (tCO₂e)</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {construction.map((rec) => (
                  <tr key={rec.id} className="hover:bg-emerald-50/30 transition">
                    <td className="p-3.5 font-medium text-slate-900">{rec.month}</td>
                    <td className="p-3.5 font-bold text-slate-900">{rec.projectName}</td>
                    <td className="p-3.5 text-slate-600">{rec.projectType}</td>
                    <td className="p-3.5 text-slate-600">{rec.contractorName}</td>
                    <td className="p-3.5 text-right font-mono font-bold">Rs. {rec.projectValueLKR.toLocaleString()}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-700">{rec.calculatedTCO2e.toFixed(4)} t</td>
                    <td className="p-3.5 text-center">
                      <button onClick={() => handleDelete(rec.id)} className="p-1 text-slate-400 hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {construction.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-400">No construction project records logged.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Freight Table */}
        {activeSubTab === 'freight' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Month</th>
                  <th className="p-3.5">Material Description</th>
                  <th className="p-3.5">Route</th>
                  <th className="p-3.5">Transport Mode</th>
                  <th className="p-3.5 text-right">Weight (t)</th>
                  <th className="p-3.5 text-right">Distance (km)</th>
                  <th className="p-3.5 text-right">Emissions (tCO₂e)</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {freight.map((rec) => (
                  <tr key={rec.id} className="hover:bg-emerald-50/30 transition">
                    <td className="p-3.5 font-medium text-slate-900">{rec.month}</td>
                    <td className="p-3.5 font-bold text-slate-900">{rec.materialDescription}</td>
                    <td className="p-3.5 text-slate-600">{rec.origin} → {rec.destination}</td>
                    <td className="p-3.5">{rec.transportMode}</td>
                    <td className="p-3.5 text-right font-mono">{rec.weightTonnes} t</td>
                    <td className="p-3.5 text-right font-mono">{rec.distanceKm} km</td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-700">{rec.calculatedTCO2e.toFixed(4)} t</td>
                    <td className="p-3.5 text-center">
                      <button onClick={() => handleDelete(rec.id)} className="p-1 text-slate-400 hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {freight.length === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-slate-400">No freight records logged.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Waste Table */}
        {activeSubTab === 'waste' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Month</th>
                  <th className="p-3.5">Facility</th>
                  <th className="p-3.5">Waste Type</th>
                  <th className="p-3.5 text-right">Quantity (kg)</th>
                  <th className="p-3.5">Disposal Method</th>
                  <th className="p-3.5">Contractor</th>
                  <th className="p-3.5 text-right">Emissions (tCO₂e)</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {waste.map((rec) => (
                  <tr key={rec.id} className="hover:bg-emerald-50/30 transition">
                    <td className="p-3.5 font-medium text-slate-900">{rec.month}</td>
                    <td className="p-3.5 text-slate-700">{rec.facilityName}</td>
                    <td className="p-3.5 font-bold text-slate-900">{rec.wasteType}</td>
                    <td className="p-3.5 text-right font-mono font-bold">{rec.quantityKg.toLocaleString()} kg</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        rec.disposalMethod.includes('Recycling') ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {rec.disposalMethod}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600">{rec.contractorName}</td>
                    <td className={`p-3.5 text-right font-mono font-bold ${
                      rec.calculatedTCO2e < 0 ? 'text-emerald-600' : 'text-slate-800'
                    }`}>
                      {rec.calculatedTCO2e.toFixed(4)} t
                    </td>
                    <td className="p-3.5 text-center">
                      <button onClick={() => handleDelete(rec.id)} className="p-1 text-slate-400 hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {waste.length === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-slate-400">No waste operation records logged.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. Travel & Commuting Table */}
        {activeSubTab === 'travel' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Month</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Purpose / Survey Group</th>
                  <th className="p-3.5">Route</th>
                  <th className="p-3.5">Mode</th>
                  <th className="p-3.5 text-right">Pass-km</th>
                  <th className="p-3.5 text-right">Emissions (tCO₂e)</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {travel.map((rec) => (
                  <tr key={rec.id} className="hover:bg-emerald-50/30 transition">
                    <td className="p-3.5 font-medium text-slate-900">{rec.month}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-medium">
                        {rec.travelCategory}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">{rec.purposeOrEmployeeGroup}</td>
                    <td className="p-3.5 text-slate-600">{rec.origin} → {rec.destination}</td>
                    <td className="p-3.5">{rec.transportMode}</td>
                    <td className="p-3.5 text-right font-mono">{rec.totalPassengerKm.toLocaleString()}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-700">{rec.calculatedTCO2e.toFixed(4)} t</td>
                    <td className="p-3.5 text-center">
                      <button onClick={() => handleDelete(rec.id)} className="p-1 text-slate-400 hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {travel.length === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-slate-400">No travel or commuting survey records logged.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 7. Distribution Losses Table */}
        {activeSubTab === 'loss' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Month</th>
                  <th className="p-3.5">Facility</th>
                  <th className="p-3.5 text-right">Received (MWh)</th>
                  <th className="p-3.5 text-right">LECO Own (MWh)</th>
                  <th className="p-3.5 text-right">Billed (MWh)</th>
                  <th className="p-3.5 text-right">T&D Loss (MWh)</th>
                  <th className="p-3.5 text-right">Loss Rate (%)</th>
                  <th className="p-3.5 text-right">Emissions (tCO₂e)</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {distributionLosses.map((rec) => (
                  <tr key={rec.id} className="hover:bg-emerald-50/30 transition">
                    <td className="p-3.5 font-medium text-slate-900">{rec.month}</td>
                    <td className="p-3.5 text-slate-700">{rec.facilityName}</td>
                    <td className="p-3.5 text-right font-mono font-bold">{rec.electricityReceivedFromCEBMWh.toLocaleString()} MWh</td>
                    <td className="p-3.5 text-right font-mono">{rec.lecoOwnConsumptionMWh.toLocaleString()} MWh</td>
                    <td className="p-3.5 text-right font-mono">{rec.electricityBilledToConsumersMWh.toLocaleString()} MWh</td>
                    <td className="p-3.5 text-right font-mono font-bold text-amber-700">{rec.distributionLossMWh.toLocaleString()} MWh</td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-700">{rec.lossPercentage}%</td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-700">{rec.calculatedTCO2e.toFixed(2)} t</td>
                    <td className="p-3.5 text-center">
                      <button onClick={() => handleDelete(rec.id)} className="p-1 text-slate-400 hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {distributionLosses.length === 0 && (
                  <tr><td colSpan={9} className="p-8 text-center text-slate-400">No grid distribution loss records logged.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Scope 3 Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Log Scope 3 Value Chain Record
                  </h2>
                  <p className="text-xs text-slate-500 capitalize">
                    Category: {activeSubTab}
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
                  <label className="block text-slate-700 font-semibold mb-1">Facility / Store</label>
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

              {/* Goods Fields */}
              {activeSubTab === 'goods' && (
                <div className="space-y-3 border-t border-slate-100 pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Goods Category</label>
                      <select
                        value={goodsCategory}
                        onChange={(e) => setGoodsCategory(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <option value="Cables & Conductors">Cables & Conductors</option>
                        <option value="Transformers & Substations">Transformers & Substations</option>
                        <option value="Electricity Meters & Testing">Electricity Meters & Testing</option>
                        <option value="Insulators & Hardware">Insulators & Hardware</option>
                        <option value="Office & Paper Supplies">Office & Paper Supplies</option>
                        <option value="IT Equipment & Software">IT Equipment & Software</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Item Description</label>
                      <input
                        type="text"
                        placeholder="e.g. Aerial Bundled Conductor (ABC) Cables"
                        value={goodsDesc}
                        onChange={(e) => setGoodsDesc(e.target.value)}
                        required
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Quantity</label>
                      <input
                        type="number"
                        value={goodsQty}
                        onChange={(e) => setGoodsQty(Number(e.target.value))}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Supplier</label>
                      <input
                        type="text"
                        placeholder="e.g. Kelani Cables PLC"
                        value={goodsSupplier}
                        onChange={(e) => setGoodsSupplier(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Value (LKR)</label>
                      <input
                        type="number"
                        value={goodsValueLKR}
                        onChange={(e) => setGoodsValueLKR(Number(e.target.value))}
                        required
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Capital Fields */}
              {activeSubTab === 'capital' && (
                <div className="space-y-3 border-t border-slate-100 pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Asset Name</label>
                      <input
                        type="text"
                        placeholder="e.g. 500kVA Distribution Transformer"
                        value={capitalName}
                        onChange={(e) => setCapitalName(e.target.value)}
                        required
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Asset Type</label>
                      <select
                        value={capitalType}
                        onChange={(e) => setCapitalType(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <option value="Distribution Transformers">Distribution Transformers</option>
                        <option value="Substation Heavy Plant">Substation Heavy Plant</option>
                        <option value="Utility Vehicles (Capitalized)">Utility Vehicles (Capitalized)</option>
                        <option value="Factory Production Machinery">Factory Production Machinery</option>
                        <option value="Buildings & Structures">Buildings & Structures</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Supplier</label>
                      <input
                        type="text"
                        placeholder="e.g. LTL Transformers"
                        value={capitalSupplier}
                        onChange={(e) => setCapitalSupplier(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Capital Value (LKR)</label>
                      <input
                        type="number"
                        value={capitalValueLKR}
                        onChange={(e) => setCapitalValueLKR(Number(e.target.value))}
                        required
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Construction Fields */}
              {activeSubTab === 'construction' && (
                <div className="space-y-3 border-t border-slate-100 pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Project Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Negombo 33kV Underground Cabling"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        required
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Project Type</label>
                      <select
                        value={projectType}
                        onChange={(e) => setProjectType(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <option value="Underground Cabling">Underground Cabling</option>
                        <option value="Substation Civil Works">Substation Civil Works</option>
                        <option value="Rural Electrification Expansion">Rural Electrification Expansion</option>
                        <option value="Meter Factory Upgrade">Meter Factory Upgrade</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Contractor Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Sierra Construction"
                        value={contractorName}
                        onChange={(e) => setContractorName(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Contract Value (LKR)</label>
                      <input
                        type="number"
                        value={projectValueLKR}
                        onChange={(e) => setProjectValueLKR(Number(e.target.value))}
                        required
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Freight Fields */}
              {activeSubTab === 'freight' && (
                <div className="space-y-3 border-t border-slate-100 pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Material / Cargo</label>
                      <input
                        type="text"
                        placeholder="e.g. Bulk Transformer Oil"
                        value={freightMaterial}
                        onChange={(e) => setFreightMaterial(e.target.value)}
                        required
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Transport Mode</label>
                      <select
                        value={transportMode}
                        onChange={(e) => setTransportMode(e.target.value as TransportMode)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <option value="Heavy Diesel Truck (14t+)">Heavy Diesel Truck 14t+ (0.162 kg/t-km)</option>
                        <option value="Medium Truck (7.5t)">Medium Truck 7.5t (0.245 kg/t-km)</option>
                        <option value="Light Commercial Van">Light Commercial Van</option>
                        <option value="Rail Freight">Rail Freight</option>
                        <option value="Cargo Vessel (Sea)">Cargo Vessel (Sea)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Origin</label>
                      <input
                        type="text"
                        placeholder="Colombo Port"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Destination</label>
                      <input
                        type="text"
                        placeholder="Central Store"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Weight (Tonnes)</label>
                      <input
                        type="number"
                        value={weightTonnes}
                        onChange={(e) => setWeightTonnes(Number(e.target.value))}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Distance (km)</label>
                      <input
                        type="number"
                        value={distanceKm}
                        onChange={(e) => setDistanceKm(Number(e.target.value))}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Waste Fields */}
              {activeSubTab === 'waste' && (
                <div className="space-y-3 border-t border-slate-100 pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Waste Category</label>
                      <select
                        value={wasteType}
                        onChange={(e) => setWasteType(e.target.value as WasteCategory)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <option value="Scrap Copper & Aluminum">Scrap Copper & Aluminum (Recycled Avoided)</option>
                        <option value="Used Transformer Oil">Used Transformer Oil</option>
                        <option value="Damaged Electricity Meters (E-Waste)">Damaged Electricity Meters (E-Waste)</option>
                        <option value="Mixed Municipal Solid Waste">Mixed Municipal Solid Waste</option>
                        <option value="Paper & Cardboard">Paper & Cardboard</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Disposal / Treatment Method</label>
                      <select
                        value={disposalMethod}
                        onChange={(e) => setDisposalMethod(e.target.value as DisposalMethod)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <option value="Authorized Certified Recycling">Authorized Certified Recycling</option>
                        <option value="Oil Re-refining">Oil Re-refining</option>
                        <option value="Controlled Landfill">Controlled Landfill</option>
                        <option value="Composting">Composting</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Quantity (kg)</label>
                      <input
                        type="number"
                        value={wasteQtyKg}
                        onChange={(e) => setWasteQtyKg(Number(e.target.value))}
                        required
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Waste Contractor</label>
                      <input
                        type="text"
                        placeholder="e.g. Green Metals Recycling Ltd"
                        value={wasteContractor}
                        onChange={(e) => setWasteContractor(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Travel Fields */}
              {activeSubTab === 'travel' && (
                <div className="space-y-3 border-t border-slate-100 pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Category</label>
                      <select
                        value={travelCategory}
                        onChange={(e) => setTravelCategory(e.target.value as any)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <option value="Business Travel">Business Travel</option>
                        <option value="Employee Commuting">Employee Commuting Survey</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Purpose / Group</label>
                      <input
                        type="text"
                        placeholder="e.g. Substation Engineering Inspections"
                        value={travelPurpose}
                        onChange={(e) => setTravelPurpose(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Travel Mode</label>
                      <select
                        value={travelMode}
                        onChange={(e) => setTravelMode(e.target.value as TravelMode)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <option value="Company Car / Hired Vehicle">Company Car / Hired Vehicle</option>
                        <option value="International Air Flight">International Air Flight</option>
                        <option value="Public Bus">Public Bus</option>
                        <option value="Train">Train</option>
                        <option value="Motorcycle">Motorcycle</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Number of Trips</label>
                      <input
                        type="number"
                        value={numberOfTrips}
                        onChange={(e) => setNumberOfTrips(Number(e.target.value))}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Distance (km/trip)</label>
                      <input
                        type="number"
                        value={distanceKmPerTrip}
                        onChange={(e) => setDistanceKmPerTrip(Number(e.target.value))}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* T&D Losses Fields */}
              {activeSubTab === 'loss' && (
                <div className="space-y-3 border-t border-slate-100 pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Electricity Received (MWh)</label>
                      <input
                        type="number"
                        value={recMWh}
                        onChange={(e) => setRecMWh(Number(e.target.value))}
                        required
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">LECO Own Consumption (MWh)</label>
                      <input
                        type="number"
                        value={ownMWh}
                        onChange={(e) => setOwnMWh(Number(e.target.value))}
                        required
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Billed to Consumers (MWh)</label>
                      <input
                        type="number"
                        value={billedMWh}
                        onChange={(e) => setBilledMWh(Number(e.target.value))}
                        required
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
                    <span className="text-emerald-900 font-medium">Calculated Technical & Commercial Loss: </span>
                    <span className="font-bold font-mono text-emerald-900">
                      {(recMWh - ownMWh - billedMWh).toLocaleString()} MWh (
                      {recMWh > 0 ? (((recMWh - ownMWh - billedMWh) / recMWh) * 100).toFixed(2) : 0}% Loss Rate)
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
                  <label className="block text-slate-700 font-semibold mb-1">Remarks / Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. Purchase Order / Grid Meter Report"
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition shadow-md shadow-emerald-950"
                >
                  Save Scope 3 Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
