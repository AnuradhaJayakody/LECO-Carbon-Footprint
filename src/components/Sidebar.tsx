import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AppModule } from '../types';
import { 
  LayoutDashboard, 
  Flame, 
  Zap, 
  Network, 
  FileText, 
  Building2, 
  Users, 
  Calculator, 
  Sliders, 
  Database, 
  Shield, 
  Layers 
} from 'lucide-react';

interface SidebarProps {
  currentModule: AppModule;
  onSelectModule: (module: AppModule) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentModule, onSelectModule }) => {
  const { isSuperAdmin, isBranchAdmin, hasAccessToModule } = useAuth();

  const navItems: { id: AppModule; label: string; icon: React.FC<{ className?: string }>; badge?: string; category?: string }[] = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard, category: 'OVERVIEW' },
    { id: 'scope1', label: 'Scope 1: Direct GHG', icon: Flame, badge: 'Direct', category: 'ACCOUNTING MODULES' },
    { id: 'scope2', label: 'Scope 2: Grid & Solar', icon: Zap, badge: 'Energy', category: 'ACCOUNTING MODULES' },
    { id: 'scope3', label: 'Scope 3: Value Chain', icon: Network, badge: 'Indirect', category: 'ACCOUNTING MODULES' },
    { id: 'reports', label: 'GHG Inventory Reports', icon: FileText, category: 'ANALYTICS & COMPLIANCE' },
    { id: 'calculator', label: 'Quick GHG Estimator', icon: Calculator, category: 'ANALYTICS & COMPLIANCE' },
    { id: 'facilities', label: 'Facilities & CSC Tree', icon: Building2, category: 'ADMINISTRATION' },
    { id: 'users', label: 'User Roles & RBAC', icon: Users, category: 'ADMINISTRATION' },
    { id: 'factors', label: 'Emission Factors Library', icon: Sliders, category: 'ADMINISTRATION' },
    { id: 'sync', label: 'Supabase Cloud Sync', icon: Database, category: 'SYSTEM & DATABASE' },
  ];

  const visibleItems = navItems.filter(item => hasAccessToModule(item.id));

  // Group by category
  const categories = Array.from(new Set(visibleItems.map(i => i.category || 'GENERAL')));

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 flex-1 space-y-6 overflow-y-auto">
        {categories.map(cat => {
          const items = visibleItems.filter(i => (i.category || 'GENERAL') === cat);
          if (items.length === 0) return null;

          return (
            <div key={cat} className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                {cat}
              </div>
              {items.map(item => {
                const Icon = item.icon;
                const isActive = currentModule === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectModule(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                        isActive 
                          ? 'bg-emerald-700/80 text-white' 
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* ISO / GHG Protocol Compliance Banner */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/50">
        <div className="flex items-center gap-2.5 text-[11px] text-slate-400">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <div className="font-semibold text-slate-300">ISO 14064-1 & GHG Protocol</div>
            <div className="text-[10px] text-slate-500">Corporate Standard Compliant</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
