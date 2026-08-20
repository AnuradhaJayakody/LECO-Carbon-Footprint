import React, { useState } from 'react';
import { Calculator, Flame, Zap, Layers, Wind, ShieldAlert, Truck, ArrowRight, RefreshCw } from 'lucide-react';

export const QuickCalculator: React.FC = () => {
  // Fuel calc
  const [fuelType, setFuelType] = useState('Diesel');
  const [fuelQuantity, setFuelQuantity] = useState<number>(100);

  // Electricity calc
  const [electricityKWh, setElectricityKWh] = useState<number>(1500);
  const [gridFactor, setGridFactor] = useState<number>(0.655);

  // Refrigerant calc
  const [refrigerantType, setRefrigerantType] = useState('R-410A');
  const [refrigerantKg, setRefrigerantKg] = useState<number>(5);

  // SF6 calc
  const [sf6LossKg, setSf6LossKg] = useState<number>(1.2);

  // Freight calc
  const [freightTonnes, setFreightTonnes] = useState<number>(15);
  const [freightKm, setFreightKm] = useState<number>(120);

  // Calculation outputs
  const getFuelEF = () => {
    if (fuelType === 'Diesel') return 2.68;
    if (fuelType === 'Petrol') return 2.31;
    if (fuelType === 'Super Diesel') return 2.69;
    if (fuelType === 'LPG') return 2.98;
    return 2.54;
  };

  const getRefGWP = () => {
    if (refrigerantType === 'R-410A') return 2088;
    if (refrigerantType === 'R-22') return 1810;
    if (refrigerantType === 'R-134a') return 1430;
    if (refrigerantType === 'R-32') return 675;
    return 1774;
  };

  const fuelKgCO2e = fuelQuantity * getFuelEF();
  const electricityKgCO2e = electricityKWh * gridFactor;
  const refrigerantKgCO2e = refrigerantKg * getRefGWP();
  const sf6KgCO2e = sf6LossKg * 23500;
  const freightKgCO2e = freightTonnes * freightKm * 0.162;

  const totalSandboxTCO2e = (fuelKgCO2e + electricityKgCO2e + refrigerantKgCO2e + sf6KgCO2e + freightKgCO2e) / 1000;

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 rounded-2xl text-white border border-emerald-800/40 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-emerald-600 rounded-xl text-white">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Interactive Carbon Footprint Sandbox Calculator</h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Quickly test GHG emission scenarios across fuels, electricity, refrigerants, SF₆ switchgear, and freight logistics.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. Fuel Calculator */}
        <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-amber-700 font-bold text-sm mb-3">
              <Flame className="w-4 h-4" />
              <span>Fuel Combustion</span>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Fuel Type</label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="Diesel">Auto Diesel (2.68 kg/L)</option>
                  <option value="Petrol">Petrol / Gasoline (2.31 kg/L)</option>
                  <option value="Super Diesel">Super Diesel (2.69 kg/L)</option>
                  <option value="LPG">LPG (2.98 kg/kg)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Quantity Consumed (L or kg)</label>
                <input
                  type="number"
                  value={fuelQuantity}
                  onChange={(e) => setFuelQuantity(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 bg-amber-50/50 p-2.5 rounded-xl">
            <span className="text-[11px] text-amber-900 block font-medium">Emissions Result:</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-extrabold text-amber-900 font-mono">{(fuelKgCO2e / 1000).toFixed(4)} tCO₂e</span>
              <span className="text-xs text-amber-700 font-mono">{fuelKgCO2e.toFixed(1)} kg CO₂e</span>
            </div>
          </div>
        </div>

        {/* 2. Electricity Calculator */}
        <div className="bg-white rounded-2xl p-5 border border-sky-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-sky-700 font-bold text-sm mb-3">
              <Zap className="w-4 h-4" />
              <span>Grid Electricity</span>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Electricity Consumed (kWh)</label>
                <input
                  type="number"
                  value={electricityKWh}
                  onChange={(e) => setElectricityKWh(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Grid Factor (kg CO₂e / kWh)</label>
                <input
                  type="number"
                  step="0.001"
                  value={gridFactor}
                  onChange={(e) => setGridFactor(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 bg-sky-50/50 p-2.5 rounded-xl">
            <span className="text-[11px] text-sky-900 block font-medium">Emissions Result:</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-extrabold text-sky-900 font-mono">{(electricityKgCO2e / 1000).toFixed(4)} tCO₂e</span>
              <span className="text-xs text-sky-700 font-mono">{electricityKgCO2e.toFixed(1)} kg CO₂e</span>
            </div>
          </div>
        </div>

        {/* 3. Refrigerants Calculator */}
        <div className="bg-white rounded-2xl p-5 border border-cyan-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-cyan-700 font-bold text-sm mb-3">
              <Wind className="w-4 h-4" />
              <span>Fugitive Refrigerant</span>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Refrigerant Gas</label>
                <select
                  value={refrigerantType}
                  onChange={(e) => setRefrigerantType(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                >
                  <option value="R-410A">R-410A (GWP: 2,088)</option>
                  <option value="R-22">R-22 (GWP: 1,810)</option>
                  <option value="R-134a">R-134a (GWP: 1,430)</option>
                  <option value="R-32">R-32 (GWP: 675)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Quantity Refilled (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={refrigerantKg}
                  onChange={(e) => setRefrigerantKg(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 bg-cyan-50/50 p-2.5 rounded-xl">
            <span className="text-[11px] text-cyan-900 block font-medium">Emissions Result:</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-extrabold text-cyan-900 font-mono">{(refrigerantKgCO2e / 1000).toFixed(4)} tCO₂e</span>
              <span className="text-xs text-cyan-700 font-mono">{refrigerantKgCO2e.toLocaleString()} kg CO₂e</span>
            </div>
          </div>
        </div>

        {/* 4. SF6 Switchgear Calculator */}
        <div className="bg-white rounded-2xl p-5 border border-red-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-red-700 font-bold text-sm mb-3">
              <ShieldAlert className="w-4 h-4" />
              <span>SF₆ Switchgear Gas</span>
            </div>
            <div className="space-y-3 text-xs">
              <p className="text-[11px] text-slate-500">
                SF₆ has an extreme GWP of <strong>23,500</strong> over a 100-year horizon.
              </p>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Net SF₆ Gas Loss (kg)</label>
                <input
                  type="number"
                  step="0.05"
                  value={sf6LossKg}
                  onChange={(e) => setSf6LossKg(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 bg-red-50/50 p-2.5 rounded-xl">
            <span className="text-[11px] text-red-900 block font-medium">Emissions Result:</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-extrabold text-red-900 font-mono">{(sf6KgCO2e / 1000).toFixed(4)} tCO₂e</span>
              <span className="text-xs text-red-700 font-mono">{sf6KgCO2e.toLocaleString()} kg CO₂e</span>
            </div>
          </div>
        </div>

        {/* 5. Freight Logistics Calculator */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-emerald-700 font-bold text-sm mb-3">
              <Truck className="w-4 h-4" />
              <span>Heavy Freight Transport</span>
            </div>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Cargo (Tonnes)</label>
                  <input
                    type="number"
                    value={freightTonnes}
                    onChange={(e) => setFreightTonnes(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Distance (km)</label>
                  <input
                    type="number"
                    value={freightKm}
                    onChange={(e) => setFreightKm(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 bg-emerald-50/50 p-2.5 rounded-xl">
            <span className="text-[11px] text-emerald-900 block font-medium">Emissions Result:</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-extrabold text-emerald-900 font-mono">{(freightKgCO2e / 1000).toFixed(4)} tCO₂e</span>
              <span className="text-xs text-emerald-700 font-mono">{freightKgCO2e.toFixed(1)} kg CO₂e</span>
            </div>
          </div>
        </div>

        {/* Total Combined Sandbox Box */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
              Combined Sandbox Estimate
            </span>
            <p className="text-xs text-slate-400 mt-1">
              Sum of current sandbox parameter tests
            </p>
            <div className="mt-4">
              <span className="text-3xl font-black text-white">{totalSandboxTCO2e.toFixed(3)}</span>
              <span className="text-sm font-bold text-emerald-400 ml-2">tCO₂e</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            Based on GHG Protocol Corporate Standard conversion factors.
          </div>
        </div>
      </div>
    </div>
  );
};
