import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  Calendar, 
  ShieldCheck, 
  User as UserIcon, 
  LogOut, 
  LogIn, 
  Sparkles,
  Database,
  Calculator,
  RefreshCw,
  Zap
} from 'lucide-react';

interface HeaderNavbarProps {
  onOpenLogin?: () => void;
  onOpenSupabaseModal?: () => void;
  onOpenCalculatorModal?: () => void;
  onResetDemo?: () => void;
  isResetting?: boolean;
  onToggleSidebarMobile?: () => void;
  onOpenMobileNav?: () => void;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  onOpenLogin,
  onOpenSupabaseModal,
  onOpenCalculatorModal,
  onResetDemo,
  isResetting = false,
  onToggleSidebarMobile,
  onOpenMobileNav
}) => {
  const { 
    user, 
    isAuthenticated, 
    isSuperAdmin, 
    logout, 
    selectedYear, 
    setSelectedYear, 
    selectedFacilityId, 
    setSelectedFacilityId, 
    facilities,
    notify
  } = useAuth();

  const handleMobileToggle = onToggleSidebarMobile || onOpenMobileNav || (() => {});

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile Toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleMobileToggle}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
          aria-label="Open Sidebar"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <h1 className="text-base sm:text-lg font-semibold text-slate-800 tracking-tight">
          GHG Emissions Overview
        </h1>
      </div>

      {/* Center & Right Controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Global Scope Selectors (Year & Facility) */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
          <div className="flex items-center gap-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-slate-700 font-semibold text-xs py-0.5 focus:outline-none cursor-pointer"
            >
              <option value={2026}>FY 2026</option>
              <option value={2025}>FY 2025</option>
              <option value={2024}>FY 2024</option>
            </select>
          </div>

          <div className="h-3 w-px bg-slate-300" />

          <div className="flex items-center gap-1.5 text-xs">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <select
              value={selectedFacilityId}
              onChange={(e) => setSelectedFacilityId(e.target.value)}
              className="bg-transparent text-slate-700 font-semibold text-xs py-0.5 focus:outline-none cursor-pointer max-w-[180px] truncate"
            >
              <option value="ALL">All Facilities (Consolidated)</option>
              {facilities.map((fac) => (
                <option key={fac.id} value={fac.id}>
                  {fac.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reporting Period Badge */}
        <div className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100 hidden sm:inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>FY {selectedYear}</span>
        </div>

        {/* Quick Sandbox Calculator */}
        <button
          onClick={onOpenCalculatorModal}
          title="Quick GHG Calculator"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 transition shadow-xs"
        >
          <Calculator className="w-3.5 h-3.5 text-emerald-600" />
          <span>Calculator</span>
        </button>

        {/* Supabase Schema Modal Button */}
        <button
          onClick={onOpenSupabaseModal}
          title="Supabase Database & SQL Schema"
          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200 transition"
        >
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline">Supabase</span>
        </button>

        {/* Reset Demo Data (for testing) */}
        {isSuperAdmin && (
          <button
            onClick={onResetDemo}
            disabled={isResetting}
            title="Reset sample test data"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        )}

        {/* Auth / Sign Out */}
        {isAuthenticated && user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-[#064E3B] hover:bg-emerald-900 text-white px-3.5 py-1.5 rounded-xl transition shadow-xs"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
