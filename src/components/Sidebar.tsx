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
  Users,
  Shield,
  ShieldCheck,
  Lock,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type TabKey = 
  | 'dashboard'
  | 'scope1'
  | 'scope2'
  | 'scope3'
  | 'reports'
  | 'facilities'
  | 'users'
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
  const { user, isSuperAdmin, isBranchAdmin, canDelete, canAccessModule } = useAuth();

  const allNavItems = [
    {
      id: 'dashboard' as TabKey,
      label: 'Executive Dashboard',
      subtitle: 'Corporate GHG overview & KPIs',
      icon: LayoutDashboard,
      badge: 'Live'
    },
    {
      id: 'scope1' as TabKey,
      label: 'Scope 1 Direct',
      subtitle: 'Vehicles, Gens, LPG, Ref, SF6',
      icon: Flame,
      color: 'text-amber-400'
    },
    {
      id: 'scope2' as TabKey,
      label: 'Scope 2 Clean & Grid',
      subtitle: 'Electricity bills & Solar PV',
      icon: Zap,
      color: 'text-sky-400'
    },
    {
      id: 'scope3' as TabKey,
      label: 'Scope 3 Value Chain',
      subtitle: 'Goods, Freight, Waste, T&D Loss',
      icon: Layers,
      color: 'text-emerald-400'
    },
    {
      id: 'reports' as TabKey,
      label: 'GHG Audit Reports',
      subtitle: 'ISO 14064 & PDF/Excel Export',
      icon: FileSpreadsheet,
      badge: 'ISO 14064'
    },
    {
      id: 'facilities' as TabKey,
      label: 'Facilities Directory',
      subtitle: 'Branches, CSCs & Factory directory',
      icon: Building2
    },
    {
      id: 'users' as TabKey,
      label: 'User Management',
      subtitle: 'RBAC Roles, Branches & Delete Permissions',
      icon: Users,
      badge: isSuperAdmin ? 'Admin' : 'RBAC'
    },
    {
      id: 'emission-factors' as TabKey,
      label: 'Emission Factors',
      subtitle: 'GWP & Grid factor settings',
      icon: Sliders,
      adminOnly: true
    },
    {
      id: 'calculator' as TabKey,
      label: 'Quick Sandbox Calc',
      subtitle: 'Instant activity conversions',
      icon: Calculator
    },
    {
      id: 'supabase-sql' as TabKey,
      label: 'Supabase Database',
      subtitle: 'Postgres SQL Schema & Sync',
      icon: Database
    }
  ];

  // Filter items based on user access permissions
  const navItems = allNavItems.filter(item => {
    if (isSuperAdmin) return true;
    if (item.adminOnly && !isSuperAdmin) return false;
    return canAccessModule(item.id);
  });

  const handleSelect = (tab: TabKey) => {
    setActiveTab(tab);
    onCloseMobile();
  };

  const roleBadgeLabel = isSuperAdmin
    ? 'Super Admin'
    : isBranchAdmin
    ? 'Branch Admin'
    : 'Facility User';

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
        <div className="p-5 border-b border-emerald-800/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-400 rounded-lg flex items-center justify-center font-black text-[#064E3B] text-base shadow-sm">
              L
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white block leading-none">
                LECO
              </span>
              <span className="text-[10px] text-emerald-200/70 font-medium tracking-wide">
                GHG Protocol Registry
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
                id={`sidebar-nav-${item.id}`}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors text-xs cursor-pointer ${
                  isActive
                    ? 'bg-emerald-800/60 text-white font-semibold border border-emerald-700/60 shadow-sm'
                    : 'text-emerald-100/75 hover:bg-emerald-800/30 hover:text-white font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
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

        {/* Footer User Profile & RBAC Card */}
        <div className="p-3.5 border-t border-emerald-800/80 bg-emerald-950/40">
          <div className="p-2.5 rounded-xl bg-emerald-900/40 border border-emerald-800/60 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                isSuperAdmin
                  ? 'bg-amber-400 text-slate-900'
                  : isBranchAdmin
                  ? 'bg-indigo-400 text-slate-900'
                  : 'bg-emerald-400 text-[#064E3B]'
              }`}>
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">
                  {user?.name || 'LECO User'}
                </p>
                <p className="text-[10px] text-emerald-300/70 truncate font-mono">
                  {user?.email || 'user@leco.com'}
                </p>
              </div>
            </div>

            {/* Role & Permissions Badge */}
            <div className="pt-1.5 border-t border-emerald-800/60 flex items-center justify-between text-[10px]">
              <span className="px-1.5 py-0.5 rounded bg-emerald-800 text-emerald-100 font-semibold inline-flex items-center space-x-1">
                {isSuperAdmin ? <Shield className="w-2.5 h-2.5 text-amber-300" /> : <ShieldCheck className="w-2.5 h-2.5 text-emerald-300" />}
                <span>{roleBadgeLabel}</span>
              </span>

              <span className={`px-1.5 py-0.5 rounded font-mono font-bold ${
                canDelete
                  ? 'bg-emerald-900 text-emerald-200 border border-emerald-700'
                  : 'bg-rose-950/80 text-rose-300 border border-rose-800/80'
              }`}>
                {canDelete ? 'Del: ON' : 'Del: OFF'}
              </span>
            </div>

            {/* Job Role or Assigned Branch */}
            {user?.jobRole && (
              <div className="text-[10px] text-emerald-200/80 truncate">
                Role: <span className="font-semibold text-white">{user.jobRole}</span>
              </div>
            )}
            {user?.facilityName && !isSuperAdmin && (
              <div className="text-[10px] text-emerald-200/70 truncate">
                Branch: <span className="text-emerald-100">{user.facilityName}</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
