import React, { useState } from 'react';
import { Calculator, Sparkles, RefreshCw, Flame, Zap, Network, ArrowRight } from 'lucide-react';

export const QuickEstimator: React.FC = () => {
  const [calcType, setCalcType] = useState<'fuel' | 'electricity' | 'sf6' | 'transformer'>('fuel');
  
  // Fuel
  const [fuelQuantity, setFuelQuantity] = useState<number>(500);
  const [fuelType, setFuelType] = useState<string>('Diesel');

  // Electricity
  const [kwh, setKwh] = useState<number>(4500);

  // SF6
  const [sf6Kg, setSf6Kg] = useState<number>(1.5);

  // Transformers
  const [transformerCount, setTransformerCount] = useState<number>(5);

  const calculateResult = () => {
    if (calcType === 'fuel') {
      const factor = fuelType === 'Diesel' ? 2.687 : 2.31;
      const tco2e = (fuelQuantity * factor) / 1000;
      return {
        tons: tco2e.toFixed(3),
        desc: `${fuelQuantity} Liters of ${fuelType}`,
        factorText: `${factor} kg CO₂e / L`
      };
    }
    if (calcType === 'electricity') {
      const factor = 0.582;
      const tco2e = (kwh * factor) / 1000;
      return {
        tons: tco2e.toFixed(3),
        desc: `${kwh.toLocaleString()} kWh Purchased CEB Electricity`,
        factorText: `${factor} kg CO₂e / kWh (SLSEA Grid Standard)`
      };
    }
    if (calcType === 'sf6') {
      const factor = 23500;
      const tco2e = (sf6Kg * factor) / 1000;
      return {
        tons: tco2e.toFixed(3),
        desc: `${sf6Kg} kg SF₆ Gas Leakage / GIS Top-up`,
        factorText: `IPCC AR5 GWP: 23,500 kg CO₂e/kg`
      };
    }
    if (calcType === 'transformer') {
      const factor = 0.45;
      const tco2e = transformerCount * factor;
      return {
        tons: tco2e.toFixed(3),
        desc: `${transformerCount} Units Distribution Transformers (160kVA)`,
        factorText: `0.450 tCO₂e per unit embodied carbon`
      };
    }
    return { tons: '0.000', desc: '', factorText: '' };
  };

  const result = calculateResult();

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
          <Calculator className="w-4 h-4" />
          <span>Interactive Quick Emission Calculator</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 mt-1">
          GHG Protocol Carbon Footprint Estimator
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Estimate carbon emissions instantly for generator fuels, grid electricity consumption, and substation SF₆ switchgear gas.
        </p>
      </div>

      {/* Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setCalcType('fuel')}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
            calcType === 'fuel'
              ? 'bg-orange-500 text-white border-orange-600 shadow-md shadow-orange-950/20'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Flame className={`w-5 h-5 mb-2 ${calcType === 'fuel' ? 'text-white' : 'text-orange-500'}`} />
          <div className="font-bold text-xs">Generator & Fleet Fuel</div>
          <div className={`text-[10px] mt-0.5 ${calcType === 'fuel' ? 'text-orange-100' : 'text-slate-400'}`}>Scope 1 Diesel / Petrol</div>
        </button>

        <button
          onClick={() => setCalcType('electricity')}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
            calcType === 'electricity'
              ? 'bg-blue-600 text-white border-blue-700 shadow-md shadow-blue-950/20'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Zap className={`w-5 h-5 mb-2 ${calcType === 'electricity' ? 'text-white' : 'text-blue-500'}`} />
          <div className="font-bold text-xs">Grid Electricity</div>
          <div className={`text-[10px] mt-0.5 ${calcType === 'electricity' ? 'text-blue-100' : 'text-slate-400'}`}>Scope 2 CEB Grid (kWh)</div>
        </button>

        <button
          onClick={() => setCalcType('sf6')}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
            calcType === 'sf6'
              ? 'bg-amber-600 text-white border-amber-700 shadow-md shadow-amber-950/20'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Sparkles className={`w-5 h-5 mb-2 ${calcType === 'sf6' ? 'text-white' : 'text-amber-500'}`} />
          <div className="font-bold text-xs">SF₆ Switchgear Gas</div>
          <div className={`text-[10px] mt-0.5 ${calcType === 'sf6' ? 'text-amber-100' : 'text-slate-400'}`}>High GWP (23,500)</div>
        </button>

        <button
          onClick={() => setCalcType('transformer')}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
            calcType === 'transformer'
              ? 'bg-purple-600 text-white border-purple-700 shadow-md shadow-purple-950/20'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Network className={`w-5 h-5 mb-2 ${calcType === 'transformer' ? 'text-white' : 'text-purple-500'}`} />
          <div className="font-bold text-xs">Hardware Procurement</div>
          <div className={`text-[10px] mt-0.5 ${calcType === 'transformer' ? 'text-purple-100' : 'text-slate-400'}`}>Scope 3 Transformers</div>
        </button>
      </div>

      {/* Input Parameters Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">Activity Inputs</h2>

        {calcType === 'fuel' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Fuel Type</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
              >
                <option value="Diesel">Auto Diesel (2.687 kg CO₂e / L)</option>
                <option value="Petrol">Super Petrol (2.31 kg CO₂e / L)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Quantity (Liters)</label>
              <input
                type="number"
                value={fuelQuantity}
                onChange={(e) => setFuelQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
              />
            </div>
          </div>
        )}

        {calcType === 'electricity' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Grid Electricity Consumption (kWh)</label>
            <input
              type="number"
              value={kwh}
              onChange={(e) => setKwh(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">SLSEA Sri Lanka National Grid Emission Factor: 0.582 kg CO₂e / kWh</span>
          </div>
        )}

        {calcType === 'sf6' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">SF₆ Gas Quantity Added / Leaked (kg)</label>
            <input
              type="number"
              step="0.1"
              value={sf6Kg}
              onChange={(e) => setSf6Kg(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">SF₆ has an atmospheric lifetime of 3,200 years and GWP of 23,500</span>
          </div>
        )}

        {calcType === 'transformer' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Number of 160kVA Distribution Transformers</label>
            <input
              type="number"
              value={transformerCount}
              onChange={(e) => setTransformerCount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
            />
          </div>
        )}

        {/* Calculated Result Card */}
        <div className="p-6 bg-slate-900 rounded-2xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Estimated Carbon Output</span>
            <div className="text-sm font-semibold text-slate-200 mt-1">{result.desc}</div>
            <div className="text-xs text-slate-400 mt-0.5">Coefficient: {result.factorText}</div>
          </div>

          <div className="text-right">
            <div className="text-3xl font-black text-white font-mono">{result.tons}</div>
            <div className="text-xs font-bold text-emerald-400">Metric Tons CO₂e</div>
          </div>
        </div>
      </div>

    </div>
  );
};
