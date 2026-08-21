import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Car, 
  Cpu, 
  Wind, 
  ShieldAlert, 
  Plus, 
  Trash2, 
  Edit3, 
  FileSpreadsheet, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle,
  X,
  Zap,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Scope1VehicleRecord, 
  Scope1GeneratorRecord, 
  Scope1StationaryFuelRecord, 
  Scope1RefrigerantRecord, 
  Scope1SF6Record,
  ReportingMonth,
  VehicleCategory,
  VehicleFuelType,
  GeneratorFuelType,
  StationaryFuelType,
  RefrigerantType
} from '../types';

type Scope1Tab = 'vehicles' | 'generators' | 'stationary' | 'refrigerants' | 'sf6';

const MONTHS: ReportingMonth[] = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const Scope1Section: React.FC = () => {
  const { selectedYear, selectedFacilityId, facilities, accessibleFacilities, canDelete, isSuperAdmin, notify } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<Scope1Tab>('vehicles');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Records state
  const [vehicles, setVehicles] = useState<Scope1VehicleRecord[]>([]);
  const [generators, setGenerators] = useState<Scope1GeneratorRecord[]>([]);
  const [stationary, setStationary] = useState<Scope1StationaryFuelRecord[]>([]);
  const [refrigerants, setRefrigerants] = useState<Scope1RefrigerantRecord[]>([]);
  const [sf6Records, setSf6Records] = useState<Scope1SF6Record[]>([]);

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [facilityId, setFacilityId] = useState(facilities[0]?.id || '');
  const [month, setMonth] = useState<ReportingMonth>('January');
  const [responsibleOfficer, setResponsibleOfficer] = useState('');
  const [remarks, setRemarks] = useState('');

  // Vehicle Form State
  const [vehicleNo, setVehicleNo] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleCategory>('Double Cab / Pickup');
  const [fuelType, setFuelType] = useState<VehicleFuelType>('Auto Diesel');
  const [quantityLiters, setQuantityLiters] = useState<number>(100);
  const [distanceKm, setDistanceKm] = useState<number>(800);
  const [fuelCardNo, setFuelCardNo] = useState('');

  // Generator Form State
  const [generatorId, setGeneratorId] = useState('');
  const [genCapacityKVA, setGenCapacityKVA] = useState<number>(250);
  const [genFuelType, setGenFuelType] = useState<GeneratorFuelType>('Diesel');
  const [genQuantityLiters, setGenQuantityLiters] = useState<number>(150);
  const [operatingHours, setOperatingHours] = useState<number>(12);
  const [maintenanceType, setMaintenanceType] = useState('');

  // Stationary Form State
  const [itemEquipment, setItemEquipment] = useState('');
  const [stationaryFuelType, setStationaryFuelType] = useState<StationaryFuelType>('LPG (Commercial 37.5kg)');
  const [stationaryQuantity, setStationaryQuantity] = useState<number>(75);
  const [stationaryUnit, setStationaryUnit] = useState<'kg' | 'Liters'>('kg');

  // Refrigerant Form State
  const [refEquipmentType, setRefEquipmentType] = useState<'Split Air Conditioner' | 'VRF / Chiller System' | 'Package AC' | 'Refrigerator / Cold Storage' | 'Vehicle AC'>('Split Air Conditioner');
  const [equipmentLocation, setEquipmentLocation] = useState('');
  const [equipmentCount, setEquipmentCount] = useState<number>(1);
  const [refrigerantType, setRefrigerantType] = useState<RefrigerantType>('R-410A');
  const [quantityRefilledKg, setQuantityRefilledKg] = useState<number>(2.5);
  const [reasonForRefill, setReasonForRefill] = useState<'Routine Maintenance' | 'Leakage Repair' | 'Retrofitting' | 'New Commissioning'>('Routine Maintenance');

  // SF6 Form State
  const [sf6EquipmentId, setSf6EquipmentId] = useState('');
  const [sf6EquipmentType, setSf6EquipmentType] = useState<'Circuit Breaker' | 'Gas Insulated Switchgear (GIS)' | 'Ring Main Unit (RMU)' | 'Current Transformer'>('Gas Insulated Switchgear (GIS)');
  const [voltageLevelKV, setVoltageLevelKV] = useState<'11 kV' | '33 kV' | '132 kV' | '220 kV'>('33 kV');
  const [nameplateCapacityKg, setNameplateCapacityKg] = useState<number>(15.0);
  const [beginningInventoryKg, setBeginningInventoryKg] = useState<number>(10.0);
  const [inventoryPurchasedRefilledKg, setInventoryPurchasedRefilledKg] = useState<number>(2.0);
  const [inventoryRecoveredKg, setInventoryRecoveredKg] = useState<number>(0.0);
  const [endingInventoryKg, setEndingInventoryKg] = useState<number>(11.0);

  // Load records
  const loadData = async () => {
    try {
      setLoading(true);
      const [v, g, st, rf, sf] = await Promise.all([
        api.getScope1Vehicles(selectedYear, selectedFacilityId),
        api.getScope1Generators(selectedYear, selectedFacilityId),
        api.getScope1Stationary(selectedYear, selectedFacilityId),
        api.getScope1Refrigerants(selectedYear, selectedFacilityId),
        api.getScope1SF6(selectedYear, selectedFacilityId)
      ]);
      setVehicles(v);
      setGenerators(g);
      setStationary(st);
      setRefrigerants(rf);
      setSf6Records(sf);
    } catch (e) {
      console.error(e);
      notify('Failed to load Scope 1 records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedYear, selectedFacilityId]);

  // Set default responsible officer when facility changes
  useEffect(() => {
    if (facilities.length > 0) {
      const currentFac = facilities.find(f => f.id === facilityId) || facilities[0];
      if (currentFac) {
        setResponsibleOfficer(currentFac.responsibleOfficer);
      }
    }
  }, [facilityId, facilities]);

  // Emission Factor Lookups
  const getVehicleEF = (fuel: VehicleFuelType) => {
    if (fuel === 'Petrol (Gasoline)') return 2.31;
    if (fuel === 'Super Diesel') return 2.69;
    if (fuel === 'Hybrid (Petrol)') return 1.85;
    if (fuel === 'EV') return 0;
    return 2.68; // Auto Diesel
  };

  const getRefrigerantGWP = (ref: RefrigerantType) => {
    switch (ref) {
      case 'R-22': return 1810;
      case 'R-410A': return 2088;
      case 'R-134a': return 1430;
      case 'R-32': return 675;
      case 'R-407C': return 1774;
      case 'R-404A': return 3922;
      default: return 1500;
    }
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingId(null);
    const defaultFac = selectedFacilityId !== 'ALL' 
      ? facilities.find(f => f.id === selectedFacilityId) || facilities[0] 
      : facilities[0];
    setFacilityId(defaultFac?.id || '');
    setResponsibleOfficer(defaultFac?.responsibleOfficer || '');
    setRemarks('');
    setShowModal(true);
  };

  // Save submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fac = facilities.find(f => f.id === facilityId) || facilities[0];

    try {
      if (activeSubTab === 'vehicles') {
        const ef = getVehicleEF(fuelType);
        const kg = quantityLiters * ef;
        const t = Number((kg / 1000).toFixed(4));
        const payload: Partial<Scope1VehicleRecord> = {
          facilityId: fac.id,
          facilityName: fac.name,
          reportingYear: selectedYear,
          month,
          responsibleOfficer: responsibleOfficer || fac.responsibleOfficer,
          vehicleNo: vehicleNo || 'WP-CAB-1001',
          vehicleType,
          fuelType,
          quantityLiters: Number(quantityLiters),
          distanceKm: Number(distanceKm),
          fuelCardNo,
          emissionFactorKgPerL: ef,
          calculatedKgCO2e: kg,
          calculatedTCO2e: t,
          status: 'Approved',
          remarks
        };
        if (editingId) {
          await api.updateScope1Vehicle(editingId, payload);
          notify('Vehicle fuel record updated successfully');
        } else {
          await api.createScope1Vehicle(payload);
          notify('Vehicle fuel record logged successfully');
        }
      } else if (activeSubTab === 'generators') {
        const ef = genFuelType === 'Diesel' ? 2.68 : 2.31;
        const kg = genQuantityLiters * ef;
        const t = Number((kg / 1000).toFixed(4));
        const payload: Partial<Scope1GeneratorRecord> = {
          facilityId: fac.id,
          facilityName: fac.name,
          reportingYear: selectedYear,
          month,
          responsibleOfficer: responsibleOfficer || fac.responsibleOfficer,
          generatorId: generatorId || 'GEN-01',
          capacityKVA: Number(genCapacityKVA),
          fuelType: genFuelType,
          quantityLiters: Number(genQuantityLiters),
          operatingHours: Number(operatingHours),
          maintenanceType,
          emissionFactorKgPerL: ef,
          calculatedKgCO2e: kg,
          calculatedTCO2e: t,
          status: 'Approved',
          remarks
        };
        if (editingId) {
          await api.updateScope1Generator(editingId, payload);
          notify('Generator fuel record updated');
        } else {
          await api.createScope1Generator(payload);
          notify('Generator fuel record logged');
        }
      } else if (activeSubTab === 'stationary') {
        const ef = stationaryFuelType.includes('LPG') ? 2.98 : 2.54;
        const kg = stationaryQuantity * ef;
        const t = Number((kg / 1000).toFixed(4));
        const payload: Partial<Scope1StationaryFuelRecord> = {
          facilityId: fac.id,
          facilityName: fac.name,
          reportingYear: selectedYear,
          month,
          responsibleOfficer: responsibleOfficer || fac.responsibleOfficer,
          itemEquipment: itemEquipment || 'Staff Canteen / Workshop Heater',
          fuelType: stationaryFuelType,
          quantity: Number(stationaryQuantity),
          unit: stationaryUnit,
          emissionFactorKgPerUnit: ef,
          calculatedKgCO2e: kg,
          calculatedTCO2e: t,
          status: 'Approved',
          remarks
        };
        if (editingId) {
          await api.updateScope1Stationary(editingId, payload);
          notify('Stationary fuel record updated');
        } else {
          await api.createScope1Stationary(payload);
          notify('Stationary fuel record logged');
        }
      } else if (activeSubTab === 'refrigerants') {
        const gwp = getRefrigerantGWP(refrigerantType);
        const kg = quantityRefilledKg * gwp;
        const t = Number((kg / 1000).toFixed(4));
        const payload: Partial<Scope1RefrigerantRecord> = {
          facilityId: fac.id,
          facilityName: fac.name,
          reportingYear: selectedYear,
          month,
          responsibleOfficer: responsibleOfficer || fac.responsibleOfficer,
          equipmentType: refEquipmentType,
          equipmentLocation: equipmentLocation || 'Main Office Floor',
          equipmentCount: Number(equipmentCount),
          refrigerantType,
          quantityRefilledKg: Number(quantityRefilledKg),
          reasonForRefill,
          gwpFactor: gwp,
          calculatedKgCO2e: kg,
          calculatedTCO2e: t,
          status: 'Approved',
          remarks
        };
        if (editingId) {
          await api.updateScope1Refrigerant(editingId, payload);
          notify('Refrigerant emission record updated');
        } else {
          await api.createScope1Refrigerant(payload);
          notify('Refrigerant emission record logged');
        }
      } else if (activeSubTab === 'sf6') {
        const netLoss = Math.max(0, (Number(beginningInventoryKg) + Number(inventoryPurchasedRefilledKg) - Number(inventoryRecoveredKg) - Number(endingInventoryKg)));
        const gwp = 23500;
        const kg = netLoss * gwp;
        const t = Number((kg / 1000).toFixed(4));
        const payload: Partial<Scope1SF6Record> = {
          facilityId: fac.id,
          facilityName: fac.name,
          reportingYear: selectedYear,
          month,
          responsibleOfficer: responsibleOfficer || fac.responsibleOfficer,
          equipmentId: sf6EquipmentId || 'GIS-33KV-BAY1',
          equipmentType: sf6EquipmentType,
          voltageLevelKV,
          nameplateCapacityKg: Number(nameplateCapacityKg),
          beginningInventoryKg: Number(beginningInventoryKg),
          inventoryPurchasedRefilledKg: Number(inventoryPurchasedRefilledKg),
          inventoryRecoveredKg: Number(inventoryRecoveredKg),
          endingInventoryKg: Number(endingInventoryKg),
          netLossKg: netLoss,
          gwpFactor: gwp,
          calculatedKgCO2e: kg,
          calculatedTCO2e: t,
          status: 'Approved',
          remarks
        };
        if (editingId) {
          await api.updateScope1SF6(editingId, payload);
          notify('SF6 equipment record updated');
        } else {
          await api.createScope1SF6(payload);
          notify('SF6 equipment record logged');
        }
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
      if (activeSubTab === 'vehicles') await api.deleteScope1Vehicle(id);
      if (activeSubTab === 'generators') await api.deleteScope1Generator(id);
      if (activeSubTab === 'stationary') await api.deleteScope1Stationary(id);
      if (activeSubTab === 'refrigerants') await api.deleteScope1Refrigerant(id);
      if (activeSubTab === 'sf6') await api.deleteScope1SF6(id);
      notify('Record removed');
      loadData();
    } catch (err) {
      notify('Failed to delete record', 'error');
    }
  };

  // Scope 1 Totals
  const totalVehiclesT = vehicles.reduce((s, i) => s + (i.calculatedTCO2e || 0), 0);
  const totalGeneratorsT = generators.reduce((s, i) => s + (i.calculatedTCO2e || 0), 0);
  const totalStationaryT = stationary.reduce((s, i) => s + (i.calculatedTCO2e || 0), 0);
  const totalRefrigerantsT = refrigerants.reduce((s, i) => s + (i.calculatedTCO2e || 0), 0);
  const totalSF6T = sf6Records.reduce((s, i) => s + (i.calculatedTCO2e || 0), 0);
  const grandScope1TotalT = totalVehiclesT + totalGeneratorsT + totalStationaryT + totalRefrigerantsT + totalSF6T;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-slate-900 rounded-2xl p-6 text-white border border-amber-800/40 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="bg-amber-500/20 text-amber-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-500/40 flex items-center space-x-1">
                <Flame className="w-3.5 h-3.5" />
                <span>Scope 1: Direct GHG Emissions</span>
              </span>
              <span className="text-slate-400 text-xs">• Year {selectedYear}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Direct Emission Sources & Fuel Accounting
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Covers fuel combustion in LECO-owned vehicle fleets, backup diesel generators, stationary LPG in canteens/workshops, refrigerant fugitive emissions, and SF₆ switchgear gas insulation.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-amber-500/30 text-right">
              <span className="text-[10px] text-amber-400 font-semibold block uppercase">Total Scope 1</span>
              <span className="text-xl font-extrabold text-white">
                {grandScope1TotalT.toFixed(3)} <span className="text-xs text-amber-400">tCO₂e</span>
              </span>
            </div>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition shadow-md shadow-amber-950"
            >
              <Plus className="w-4 h-4" />
              <span>Log New Record</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveSubTab('vehicles')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'vehicles'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>Vehicle Fuel ({vehicles.length})</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/20 text-white font-mono">
            {totalVehiclesT.toFixed(2)}t
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('generators')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'generators'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Generators ({generators.length})</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/20 text-white font-mono">
            {totalGeneratorsT.toFixed(2)}t
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('stationary')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'stationary'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>LPG & Stationary ({stationary.length})</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/20 text-white font-mono">
            {totalStationaryT.toFixed(2)}t
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('refrigerants')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'refrigerants'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Wind className="w-4 h-4" />
          <span>Refrigerants ({refrigerants.length})</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/20 text-white font-mono">
            {totalRefrigerantsT.toFixed(2)}t
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('sf6')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'sf6'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>SF₆ Switchgear ({sf6Records.length})</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/20 text-white font-mono">
            {totalSF6T.toFixed(2)}t
          </span>
        </button>
      </div>

      {/* Data Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Search and Table Tools */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search records or facility..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="text-xs text-slate-500 flex items-center space-x-2">
            <span>Calculation formula:</span>
            <code className="bg-slate-200 px-2 py-0.5 rounded text-[11px] font-mono text-slate-800">
              Activity Data × EF = kg CO₂e (tCO₂e / 1,000)
            </code>
          </div>
        </div>

        {/* 1. Vehicles Table */}
        {activeSubTab === 'vehicles' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Month</th>
                  <th className="p-3.5">Facility</th>
                  <th className="p-3.5">Vehicle No</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Fuel Type</th>
                  <th className="p-3.5 text-right">Quantity (L)</th>
                  <th className="p-3.5 text-right">EF (kg/L)</th>
                  <th className="p-3.5 text-right">Emissions (tCO₂e)</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vehicles
                  .filter(v => v.vehicleNo.toLowerCase().includes(searchTerm.toLowerCase()) || v.facilityName.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((rec) => (
                    <tr key={rec.id} className="hover:bg-amber-50/30 transition">
                      <td className="p-3.5 font-medium text-slate-900">{rec.month}</td>
                      <td className="p-3.5 text-slate-700">{rec.facilityName}</td>
                      <td className="p-3.5 font-mono font-bold text-slate-900">{rec.vehicleNo}</td>
                      <td className="p-3.5 text-slate-600">{rec.vehicleType}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-medium">
                          {rec.fuelType}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono">{rec.quantityLiters.toLocaleString()} L</td>
                      <td className="p-3.5 text-right font-mono text-slate-500">{rec.emissionFactorKgPerL}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-amber-700">
                        {rec.calculatedTCO2e.toFixed(4)} t
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                          {rec.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleDelete(rec.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                {vehicles.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      No vehicle fuel records logged for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. Generators Table */}
        {activeSubTab === 'generators' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Month</th>
                  <th className="p-3.5">Facility</th>
                  <th className="p-3.5">Generator ID</th>
                  <th className="p-3.5 text-right">Capacity (kVA)</th>
                  <th className="p-3.5">Fuel Type</th>
                  <th className="p-3.5 text-right">Fuel (L)</th>
                  <th className="p-3.5 text-right">Op Hours</th>
                  <th className="p-3.5 text-right">Emissions (tCO₂e)</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {generators
                  .filter(g => g.generatorId.toLowerCase().includes(searchTerm.toLowerCase()) || g.facilityName.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((rec) => (
                    <tr key={rec.id} className="hover:bg-amber-50/30 transition">
                      <td className="p-3.5 font-medium text-slate-900">{rec.month}</td>
                      <td className="p-3.5 text-slate-700">{rec.facilityName}</td>
                      <td className="p-3.5 font-mono font-bold text-slate-900">{rec.generatorId}</td>
                      <td className="p-3.5 text-right font-mono">{rec.capacityKVA} kVA</td>
                      <td className="p-3.5">{rec.fuelType}</td>
                      <td className="p-3.5 text-right font-mono">{rec.quantityLiters} L</td>
                      <td className="p-3.5 text-right font-mono">{rec.operatingHours} hrs</td>
                      <td className="p-3.5 text-right font-mono font-bold text-amber-700">
                        {rec.calculatedTCO2e.toFixed(4)} t
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                          {rec.status}
                        </span>
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
                {generators.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      No generator records logged for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. Stationary LPG Table */}
        {activeSubTab === 'stationary' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Month</th>
                  <th className="p-3.5">Facility</th>
                  <th className="p-3.5">Item / Equipment</th>
                  <th className="p-3.5">Fuel Type</th>
                  <th className="p-3.5 text-right">Quantity</th>
                  <th className="p-3.5 text-right">EF (kg/unit)</th>
                  <th className="p-3.5 text-right">Emissions (tCO₂e)</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stationary.map((rec) => (
                  <tr key={rec.id} className="hover:bg-amber-50/30 transition">
                    <td className="p-3.5 font-medium text-slate-900">{rec.month}</td>
                    <td className="p-3.5 text-slate-700">{rec.facilityName}</td>
                    <td className="p-3.5 font-medium text-slate-900">{rec.itemEquipment}</td>
                    <td className="p-3.5">{rec.fuelType}</td>
                    <td className="p-3.5 text-right font-mono">{rec.quantity} {rec.unit}</td>
                    <td className="p-3.5 text-right font-mono text-slate-500">{rec.emissionFactorKgPerUnit}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-amber-700">
                      {rec.calculatedTCO2e.toFixed(4)} t
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                        {rec.status}
                      </span>
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
                {stationary.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      No LPG or stationary fuel records logged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Refrigerants Table */}
        {activeSubTab === 'refrigerants' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Month</th>
                  <th className="p-3.5">Facility</th>
                  <th className="p-3.5">Equipment Type & Location</th>
                  <th className="p-3.5">Refrigerant</th>
                  <th className="p-3.5 text-right">GWP Factor</th>
                  <th className="p-3.5 text-right">Refilled (kg)</th>
                  <th className="p-3.5">Reason</th>
                  <th className="p-3.5 text-right">Emissions (tCO₂e)</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {refrigerants.map((rec) => (
                  <tr key={rec.id} className="hover:bg-amber-50/30 transition">
                    <td className="p-3.5 font-medium text-slate-900">{rec.month}</td>
                    <td className="p-3.5 text-slate-700">{rec.facilityName}</td>
                    <td className="p-3.5 font-medium text-slate-900">
                      {rec.equipmentType} ({rec.equipmentLocation})
                    </td>
                    <td className="p-3.5 font-mono font-bold text-sky-700">{rec.refrigerantType}</td>
                    <td className="p-3.5 text-right font-mono text-slate-500">{rec.gwpFactor}</td>
                    <td className="p-3.5 text-right font-mono font-bold">{rec.quantityRefilledKg} kg</td>
                    <td className="p-3.5 text-slate-600">{rec.reasonForRefill}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-amber-700">
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
                {refrigerants.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      No refrigerant refills logged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. SF6 Switchgear Table */}
        {activeSubTab === 'sf6' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Month</th>
                  <th className="p-3.5">Facility</th>
                  <th className="p-3.5">Equipment ID & Type</th>
                  <th className="p-3.5">Voltage</th>
                  <th className="p-3.5 text-right">Capacity</th>
                  <th className="p-3.5 text-right">Net Loss (kg)</th>
                  <th className="p-3.5 text-right">GWP Factor</th>
                  <th className="p-3.5 text-right">Emissions (tCO₂e)</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sf6Records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-amber-50/30 transition">
                    <td className="p-3.5 font-medium text-slate-900">{rec.month}</td>
                    <td className="p-3.5 text-slate-700">{rec.facilityName}</td>
                    <td className="p-3.5 font-mono font-bold text-slate-900">
                      {rec.equipmentId} ({rec.equipmentType})
                    </td>
                    <td className="p-3.5 text-slate-600">{rec.voltageLevelKV}</td>
                    <td className="p-3.5 text-right font-mono">{rec.nameplateCapacityKg} kg</td>
                    <td className="p-3.5 text-right font-mono font-bold text-red-600">{rec.netLossKg} kg</td>
                    <td className="p-3.5 text-right font-mono text-slate-500">23,500</td>
                    <td className="p-3.5 text-right font-mono font-bold text-amber-700">
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
                {sf6Records.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      No SF₆ high-voltage equipment records logged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Log Scope 1 Direct Emissions
                  </h2>
                  <p className="text-xs text-slate-500 capitalize">
                    {activeSubTab.replace(/([A-Z])/g, ' $1')} Activity Record
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
              {/* Common metadata fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Facility / Branch</label>
                  <select
                    value={facilityId}
                    onChange={(e) => setFacilityId(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-1 focus:ring-amber-500"
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
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-1 focus:ring-amber-500"
                  >
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Specific SubTab fields */}
              {activeSubTab === 'vehicles' && (
                <div className="space-y-4 border-t border-slate-100 pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Vehicle Registration No</label>
                      <input
                        type="text"
                        placeholder="e.g. WP-CAB-4590"
                        value={vehicleNo}
                        onChange={(e) => setVehicleNo(e.target.value)}
                        required
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono font-medium focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Vehicle Category</label>
                      <select
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value as VehicleCategory)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                      >
                        <option value="Double Cab / Pickup">Double Cab / Pickup</option>
                        <option value="Lorry / Heavy Truck">Lorry / Heavy Truck</option>
                        <option value="Van">Van</option>
                        <option value="Car / Jeep">Car / Jeep</option>
                        <option value="Motorcycle">Motorcycle</option>
                        <option value="Special Utility Vehicle">Special Utility Vehicle</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Fuel Type</label>
                      <select
                        value={fuelType}
                        onChange={(e) => setFuelType(e.target.value as VehicleFuelType)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                      >
                        <option value="Auto Diesel">Auto Diesel (2.68 kg/L)</option>
                        <option value="Super Diesel">Super Diesel (2.69 kg/L)</option>
                        <option value="Petrol (Gasoline)">Petrol (2.31 kg/L)</option>
                        <option value="Hybrid (Petrol)">Hybrid (1.85 kg/L)</option>
                        <option value="EV">EV (0 kg/L)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Quantity Consumed (L)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={quantityLiters}
                        onChange={(e) => setQuantityLiters(Number(e.target.value))}
                        required
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Distance Travelled (km)</label>
                      <input
                        type="number"
                        value={distanceKm}
                        onChange={(e) => setDistanceKm(Number(e.target.value))}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono font-medium"
                      />
                    </div>
                  </div>

                  {/* Dynamic Calculation preview box */}
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
                    <span className="text-amber-900 font-medium">Calculated Emissions:</span>
                    <span className="font-bold text-amber-900 font-mono text-sm">
                      {((quantityLiters * getVehicleEF(fuelType)) / 1000).toFixed(4)} tCO₂e ({ (quantityLiters * getVehicleEF(fuelType)).toFixed(1) } kg CO₂e)
                    </span>
                  </div>
                </div>
              )}

              {activeSubTab === 'generators' && (
                <div className="space-y-4 border-t border-slate-100 pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Generator ID / Code</label>
                      <input
                        type="text"
                        placeholder="e.g. GEN-HO-500KVA"
                        value={generatorId}
                        onChange={(e) => setGeneratorId(e.target.value)}
                        required
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Capacity (kVA)</label>
                      <input
                        type="number"
                        value={genCapacityKVA}
                        onChange={(e) => setGenCapacityKVA(Number(e.target.value))}
                        required
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Fuel Type</label>
                      <select
                        value={genFuelType}
                        onChange={(e) => setGenFuelType(e.target.value as GeneratorFuelType)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <option value="Diesel">Diesel (2.68 kg/L)</option>
                        <option value="Petrol">Petrol (2.31 kg/L)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Quantity Fuel (L)</label>
                      <input
                        type="number"
                        value={genQuantityLiters}
                        onChange={(e) => setGenQuantityLiters(Number(e.target.value))}
                        required
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Operating Hours</label>
                      <input
                        type="number"
                        step="0.5"
                        value={operatingHours}
                        onChange={(e) => setOperatingHours(Number(e.target.value))}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSubTab === 'stationary' && (
                <div className="space-y-4 border-t border-slate-100 pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Item / Equipment Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Staff Cafeteria Kitchen / Lab Burner"
                        value={itemEquipment}
                        onChange={(e) => setItemEquipment(e.target.value)}
                        required
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Stationary Fuel Type</label>
                      <select
                        value={stationaryFuelType}
                        onChange={(e) => setStationaryFuelType(e.target.value as StationaryFuelType)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <option value="LPG (Commercial 37.5kg)">LPG Commercial 37.5kg (2.98 kg/kg)</option>
                        <option value="LPG (12.5kg)">LPG Domestic 12.5kg (2.98 kg/kg)</option>
                        <option value="Kerosene">Kerosene (2.54 kg/L)</option>
                        <option value="Furnace Oil">Furnace Oil (2.95 kg/L)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Quantity Consumed</label>
                      <input
                        type="number"
                        value={stationaryQuantity}
                        onChange={(e) => setStationaryQuantity(Number(e.target.value))}
                        required
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Unit of Measure</label>
                      <select
                        value={stationaryUnit}
                        onChange={(e) => setStationaryUnit(e.target.value as 'kg' | 'Liters')}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <option value="kg">Kilograms (kg)</option>
                        <option value="Liters">Liters</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeSubTab === 'refrigerants' && (
                <div className="space-y-4 border-t border-slate-100 pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Equipment Type</label>
                      <select
                        value={refEquipmentType}
                        onChange={(e) => setRefEquipmentType(e.target.value as any)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <option value="Split Air Conditioner">Split Air Conditioner</option>
                        <option value="VRF / Chiller System">VRF / Chiller System</option>
                        <option value="Package AC">Package AC</option>
                        <option value="Refrigerator / Cold Storage">Refrigerator / Cold Storage</option>
                        <option value="Vehicle AC">Vehicle AC</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Location / Room</label>
                      <input
                        type="text"
                        placeholder="e.g. Server Room / Customer Hall"
                        value={equipmentLocation}
                        onChange={(e) => setEquipmentLocation(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Refrigerant Gas</label>
                      <select
                        value={refrigerantType}
                        onChange={(e) => setRefrigerantType(e.target.value as RefrigerantType)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                      >
                        <option value="R-410A">R-410A (GWP: 2088)</option>
                        <option value="R-22">R-22 (GWP: 1810)</option>
                        <option value="R-134a">R-134a (GWP: 1430)</option>
                        <option value="R-32">R-32 (GWP: 675)</option>
                        <option value="R-407C">R-407C (GWP: 1774)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Quantity Refilled (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={quantityRefilledKg}
                        onChange={(e) => setQuantityRefilledKg(Number(e.target.value))}
                        required
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Reason for Refill</label>
                      <select
                        value={reasonForRefill}
                        onChange={(e) => setReasonForRefill(e.target.value as any)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <option value="Routine Maintenance">Routine Maintenance</option>
                        <option value="Leakage Repair">Leakage Repair</option>
                        <option value="Retrofitting">Retrofitting</option>
                        <option value="New Commissioning">New Commissioning</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeSubTab === 'sf6' && (
                <div className="space-y-4 border-t border-slate-100 pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Equipment Identifier</label>
                      <input
                        type="text"
                        placeholder="e.g. GIS-33KV-01"
                        value={sf6EquipmentId}
                        onChange={(e) => setSf6EquipmentId(e.target.value)}
                        required
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Equipment Type</label>
                      <select
                        value={sf6EquipmentType}
                        onChange={(e) => setSf6EquipmentType(e.target.value as any)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <option value="Gas Insulated Switchgear (GIS)">Gas Insulated Switchgear (GIS)</option>
                        <option value="Circuit Breaker">Circuit Breaker</option>
                        <option value="Ring Main Unit (RMU)">Ring Main Unit (RMU)</option>
                        <option value="Current Transformer">Current Transformer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Voltage Level</label>
                      <select
                        value={voltageLevelKV}
                        onChange={(e) => setVoltageLevelKV(e.target.value as any)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      >
                        <option value="11 kV">11 kV</option>
                        <option value="33 kV">33 kV</option>
                        <option value="132 kV">132 kV</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono">
                    <div>
                      <label className="block text-slate-600 text-[10px] uppercase font-bold mb-1">Beg. Inv (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={beginningInventoryKg}
                        onChange={(e) => setBeginningInventoryKg(Number(e.target.value))}
                        className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 text-[10px] uppercase font-bold mb-1">Refilled (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={inventoryPurchasedRefilledKg}
                        onChange={(e) => setInventoryPurchasedRefilledKg(Number(e.target.value))}
                        className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 text-[10px] uppercase font-bold mb-1">Recovered (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={inventoryRecoveredKg}
                        onChange={(e) => setInventoryRecoveredKg(Number(e.target.value))}
                        className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 text-[10px] uppercase font-bold mb-1">End Inv (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={endingInventoryKg}
                        onChange={(e) => setEndingInventoryKg(Number(e.target.value))}
                        className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Responsible Officer & Remarks */}
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
                  <label className="block text-slate-700 font-semibold mb-1">Remarks / Reference Document</label>
                  <input
                    type="text"
                    placeholder="e.g. Fuel Log Book No / Service Invoice"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Footer Actions */}
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
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl transition shadow-md shadow-amber-950"
                >
                  Save Scope 1 Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
