import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { HeaderNavbar } from './components/HeaderNavbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Scope1Manager } from './components/Scope1Manager';
import { Scope2Manager } from './components/Scope2Manager';
import { Scope3Manager } from './components/Scope3Manager';
import { ReportsManager } from './components/ReportsManager';
import { FacilitiesManager } from './components/FacilitiesManager';
import { UserManager } from './components/UserManager';
import { EmissionFactorsManager } from './components/EmissionFactorsManager';
import { QuickEstimator } from './components/QuickEstimator';
import { SupabaseSync } from './components/SupabaseSync';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { 
    isAuthenticated, 
    isLoading, 
    activeModule, 
    setActiveModule, 
    toast 
  } = useAuth();

  return (
    <>
      {/* Toast Notification Container with high z-index (z-[9999]) to always display on top of all modals */}
      {toast && (
        <div className="fixed top-4 right-4 z-[9999] animate-bounce duration-300 pointer-events-none">
          <div className={`px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 text-xs font-semibold pointer-events-auto ${
            toast.type === 'success' ? 'bg-emerald-900 text-white border-emerald-700' :
            toast.type === 'error' ? 'bg-rose-900 text-white border-rose-700' :
            toast.type === 'warning' ? 'bg-amber-900 text-white border-amber-700' :
            'bg-slate-900 text-white border-slate-700'
          }`}>
            {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold text-slate-400">Loading LECO Carbon Footprint Platform...</span>
          </div>
        </div>
      ) : !isAuthenticated ? (
        <LoginScreen />
      ) : (
        <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900">
          {/* Global Top Navbar */}
          <HeaderNavbar />

          {/* Main Workspace with Sidebar and Active Content Area */}
          <div className="flex flex-1 overflow-hidden">
            <Sidebar currentModule={activeModule} onSelectModule={setActiveModule} />

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              {activeModule === 'dashboard' && <Dashboard />}
              {activeModule === 'scope1' && <Scope1Manager />}
              {activeModule === 'scope2' && <Scope2Manager />}
              {activeModule === 'scope3' && <Scope3Manager />}
              {activeModule === 'reports' && <ReportsManager />}
              {activeModule === 'facilities' && <FacilitiesManager />}
              {activeModule === 'users' && <UserManager />}
              {activeModule === 'factors' && <EmissionFactorsManager />}
              {activeModule === 'calculator' && <QuickEstimator />}
              {activeModule === 'sync' && <SupabaseSync />}
            </main>
          </div>
        </div>
      )}
    </>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

export default App;
