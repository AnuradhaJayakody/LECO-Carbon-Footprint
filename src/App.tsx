import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HeaderNavbar } from './components/HeaderNavbar';
import { Sidebar, TabKey } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Scope1Section } from './components/Scope1Section';
import { Scope2Section } from './components/Scope2Section';
import { Scope3Section } from './components/Scope3Section';
import { GhgReports } from './components/GhgReports';
import { QuickCalculator } from './components/QuickCalculator';
import { FacilitiesManager } from './components/FacilitiesManager';
import { UserManager } from './components/UserManager';
import { EmissionFactorsManager } from './components/EmissionFactorsManager';
import { SupabaseSyncView } from './components/SupabaseSyncView';
import { 
  Lock, 
  Mail, 
  KeyRound, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  X,
  Zap,
  Flame,
  Layers,
  Leaf,
  Users
} from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, login, logout, isSuperAdmin, notification, notify } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Login form state
  const [email, setEmail] = useState('superadmincf@leco.com');
  const [password, setPassword] = useState('Sadmin@cf369');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      await login(email, password);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleFillDemoSuperAdmin = () => {
    setEmail('superadmincf@leco.com');
    setPassword('Sadmin@cf369');
  };

  const handleFillDemoBranchAdmin = () => {
    setEmail('admin.western@leco.com');
    setPassword('Leco@2025');
  };

  const handleFillDemoOfficer = () => {
    setEmail('officer.kalutara@leco.com');
    setPassword('Leco@2025');
  };

  // If not authenticated, render the high-craft corporate login screen
  if (!user) {
    return (
      <div className="min-h-screen bg-[#064E3B] flex flex-col justify-center items-center p-4 relative overflow-hidden text-slate-100">
        {/* Ambient Subtle Accent */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 text-center max-w-lg mb-6">
          <div className="inline-flex items-center gap-2 bg-emerald-900/80 px-3.5 py-1 rounded-full border border-emerald-700/60 text-emerald-200 text-xs font-semibold mb-4 shadow-xs">
            <Leaf className="w-3.5 h-3.5 text-emerald-400" />
            <span>GHG Protocol Corporate Standard & ISO 14064-1</span>
          </div>

          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-emerald-400 text-[#064E3B] font-black text-2xl flex items-center justify-center tracking-tighter shadow-md">
              L
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              LECO Carbon Accounting
            </h1>
          </div>
          <p className="text-xs text-emerald-100/70 max-w-sm mx-auto">
            Lanka Electricity Company Corporate Carbon Footprint Accounting Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="relative z-10 w-full max-w-md bg-white p-8 rounded-2xl border border-slate-200 shadow-xl text-slate-900">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Employee Authentication</h2>
              <p className="text-xs text-slate-500">Sign in with authorized LECO credentials</p>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          {loginError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">Corporate Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="employee@leco.com"
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">Account Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 bg-[#064E3B] hover:bg-emerald-900 active:bg-emerald-950 text-white font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {loginLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Authenticate & Access System</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block text-center">
              Quick Role Test Credentials
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={handleFillDemoSuperAdmin}
                className="p-2 bg-slate-50 hover:bg-emerald-50 text-left rounded-xl border border-slate-200 hover:border-emerald-200 transition group"
              >
                <span className="text-[10px] font-bold text-slate-800 block group-hover:text-emerald-800 truncate">
                  Super Admin
                </span>
                <span className="text-[9px] text-slate-500 font-mono block truncate">
                  superadmincf@leco.com
                </span>
              </button>

              <button
                type="button"
                onClick={handleFillDemoBranchAdmin}
                className="p-2 bg-slate-50 hover:bg-indigo-50 text-left rounded-xl border border-slate-200 hover:border-indigo-200 transition group"
              >
                <span className="text-[10px] font-bold text-slate-800 block group-hover:text-indigo-800 truncate">
                  Branch Admin
                </span>
                <span className="text-[9px] text-slate-500 font-mono block truncate">
                  admin.western@leco.com
                </span>
              </button>

              <button
                type="button"
                onClick={handleFillDemoOfficer}
                className="p-2 bg-slate-50 hover:bg-emerald-50 text-left rounded-xl border border-slate-200 hover:border-emerald-200 transition group"
              >
                <span className="text-[10px] font-bold text-slate-800 block group-hover:text-emerald-800 truncate">
                  Facility User
                </span>
                <span className="text-[9px] text-slate-500 font-mono block truncate">
                  officer.kalutara@leco.com
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Notes */}
        <div className="mt-6 text-center text-xs text-emerald-200/60">
          <p>© {new Date().getFullYear()} Lanka Electricity Company (Pvt) Ltd. All Rights Reserved.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900 antialiased">
      {/* Toast Notification Container */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold flex items-center space-x-2.5 ${
              notification.type === 'error'
                ? 'bg-red-900 text-white border-red-700'
                : notification.type === 'info'
                ? 'bg-sky-900 text-white border-sky-700'
                : 'bg-[#064E3B] text-emerald-200 border-emerald-600/40'
            }`}
          >
            {notification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Global Top Navbar */}
      <HeaderNavbar 
        onOpenMobileNav={() => setIsMobileNavOpen(true)}
        onToggleSidebarMobile={() => setIsMobileNavOpen(!isMobileNavOpen)}
        onOpenCalculatorModal={() => setActiveTab('calculator')}
        onOpenSupabaseModal={() => setActiveTab('supabase-sql')}
      />

      {/* Layout Body: Sidebar + Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpenMobile={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && <Dashboard onNavigateTab={setActiveTab} />}
          {activeTab === 'scope1' && <Scope1Section />}
          {activeTab === 'scope2' && <Scope2Section />}
          {activeTab === 'scope3' && <Scope3Section />}
          {activeTab === 'reports' && <GhgReports />}
          {activeTab === 'calculator' && <QuickCalculator />}
          {activeTab === 'facilities' && <FacilitiesManager />}
          {activeTab === 'users' && <UserManager />}
          {activeTab === 'emission-factors' && <EmissionFactorsManager />}
          {activeTab === 'supabase-sql' && <SupabaseSyncView />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
