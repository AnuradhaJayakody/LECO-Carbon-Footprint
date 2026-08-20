import React from 'react';
import { 
  LayoutDashboard, 
  Flame, 
  Zap, 
  Layers, 
  FileSpreadsheet, 
  Building2, 
  Sliders, 
  Database, 
  Calculator,
  Car,
  CheckCircle2,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type TabKey = 
  | 'dashboard'
  | 'scope1'
  | 'scope2'
  | 'scope3'
  | 'reports'
  | 'facilities'
  | 'emission-factors'
  | 'supabase-sql'
  | 'calculator';

interface SidebarProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile,
  onCloseMobile
}) => {
  const { isSuperAdmin } = useAuth();

  const navItems = [
    {
      id: 'dashboard' as TabKey,
      label: 'Executive Dashboard',
      subtitle: 'Corporate GHG overview & KPIs',
      icon: LayoutDashboard,
      badge: 'Real-time'
    },
    {
      id: 'scope1' as TabKey,
      label: 'Scope 1 Direct',
      subtitle: 'Vehicles, Gens, LPG, Ref, SF6',
      icon: Flame,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10'
    },
    {
      id: 'scope2' as TabKey,
      label: 'Scope 2 Indirect',
      subtitle: 'Electricity bills & Solar PV',
      icon: Zap,
      color: 'text-sky-500',
      bgColor: 'bg-sky-500/10'
    },
    {
      id: 'scope3' as TabKey,
      label: 'Scope 3 Value Chain',
      subtitle: 'Goods, Freight, Waste, T&D Loss',
      icon: Layers,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10'
    },
    {
      id: 'reports' as TabKey,
      label: 'GHG Audit Reports',
      subtitle: 'ISO 14064 & PDF/Excel Export',
      icon: FileSpreadsheet,
      badge: 'Audit Ready'
    },
    {
      id: 'calculator' as TabKey,
      label: 'Quick Sandbox Calc',
      subtitle: 'Instant activity conversions',
      icon: Calculator
    },
    {
      id: 'facilities' as TabKey,
      label: 'LECO Facilities',
      subtitle: 'Branches, CSCs & Factory directory',
      icon: Building2
    },
    {
      id: 'emission-factors' as TabKey,
      label: 'Emission Factors Library',
      subtitle: 'GWP & Grid factor settings',
      icon: Sliders,
      adminOnly: true
    },
    {
      id: 'supabase-sql' as TabKey,
      label: 'Supabase Database',
      subtitle: 'Postgres SQL Schema & Sync',
      icon: Database
    }
  ];

  const handleSelect = (tab: TabKey) => {
    setActiveTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#064E3B] text-emerald-50 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 shrink-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-emerald-800/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-400 rounded-lg flex items-center justify-center font-black text-[#064E3B] text-base shadow-sm">
              L
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white block leading-none">
                LECO
              </span>
              <span className="text-[10px] text-emerald-200/60 font-medium tracking-wide">
                Carbon Registry
              </span>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-colors text-xs ${
                  isActive
                    ? 'bg-emerald-800/50 text-white font-semibold border border-emerald-700/50 shadow-sm'
                    : 'text-emerald-100/70 hover:bg-emerald-800/30 hover:text-white font-medium'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-5 h-5 flex items-center justify-center opacity-80 shrink-0">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-300' : 'text-emerald-200/70'}`} />
                  </div>
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                      isActive
                        ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30'
                        : 'bg-emerald-900/60 text-emerald-300/80'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer User Profile Card */}
        <div className="p-4 border-t border-emerald-800">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
            <div className="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-bold text-white border border-emerald-500/50 shrink-0">
              {isSuperAdmin ? 'SA' : 'FO'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {isSuperAdmin ? 'Super Admin' : 'Facility Officer'}
              </p>
              <p className="text-[10px] text-emerald-300/60 font-mono truncate">
                {isSuperAdmin ? 'superadmincf@leco.com' : 'officer.kalutara@leco.com'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
