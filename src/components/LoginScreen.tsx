import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Zap, 
  Lock, 
  Mail, 
  ShieldCheck, 
  Building2, 
  UserCheck, 
  ArrowRight, 
  Globe2,
  Sparkles,
  AlertCircle,
  Leaf,
  Info
} from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabase';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your LECO officer corporate email address');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify your email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string = 'Sadmin@cf369') => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Graphic Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-full bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md my-8">
        {/* Brand Card */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-900/60 via-slate-900 to-slate-900 p-6 border-b border-slate-800 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 mb-3 shadow-inner">
              <Zap className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              LANKA ELECTRICITY COMPANY (PVT) LTD
            </h1>
            <p className="text-xs text-emerald-400 font-semibold tracking-wider uppercase mt-1 flex items-center justify-center gap-1.5">
              <Leaf className="w-3.5 h-3.5 inline" />
              GHG Protocol Carbon Accounting Platform
            </p>
          </div>

          {/* Form Content */}
          <div className="p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-100">Officer Secure Sign In</h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your authorized LECO credentials to access facility emission logs and reporting modules.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Authentication Error:</span> {errorMsg}
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Corporate Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer.name@leco.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Password / Access Key
                  </label>
                  <span className="text-[11px] text-slate-500">Supabase Auth Verified</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Authenticate & Enter</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick Demo Fill Section */}
            <div className="mt-8 pt-6 border-t border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Quick Demo Accounts
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                  Select Role
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('superadmincf@leco.com', 'Sadmin@cf369')}
                  className="text-left px-3 py-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/40 rounded-xl text-xs text-slate-300 transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-200">Root Super Admin</div>
                      <div className="text-[10px] text-slate-400">superadmincf@leco.com (Global Scope)</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 opacity-0 group-hover:opacity-100 transition font-medium">Use &rarr;</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('admin.kotte@leco.com', 'Sadmin@cf369')}
                  className="text-left px-3 py-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/40 rounded-xl text-xs text-slate-300 transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-blue-400 group-hover:scale-110 transition shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-200">Branch Admin (Kotte & CSCs)</div>
                      <div className="text-[10px] text-slate-400">admin.kotte@leco.com (Kotte + 3 CSCs)</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-blue-400 opacity-0 group-hover:opacity-100 transition font-medium">Use &rarr;</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('officer.pitakotte@leco.com', 'Sadmin@cf369')}
                  className="text-left px-3 py-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/40 rounded-xl text-xs text-slate-300 transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="w-4 h-4 text-amber-400 group-hover:scale-110 transition shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-200">Facility Officer (Pitakotte CSC)</div>
                      <div className="text-[10px] text-slate-400">officer.pitakotte@leco.com (Scoped User)</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-amber-400 opacity-0 group-hover:opacity-100 transition font-medium">Use &rarr;</span>
                </button>
              </div>
            </div>

            {/* Supabase Status Pill */}
            <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
                {isSupabaseConfigured ? 'Supabase Cloud Connected' : 'Local Enterprise DB Mode'}
              </span>
              <span>ISO 14064 / GHG Protocol</span>
            </div>

          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-500 mt-4">
          &copy; {new Date().getFullYear()} Lanka Electricity Company (Pvt) Ltd. All Rights Reserved.
        </div>
      </div>
    </div>
  );
};
