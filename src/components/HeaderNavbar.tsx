import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Zap, 
  Building2, 
  Calendar, 
  LogOut, 
  ShieldCheck, 
  User as UserIcon, 
  ChevronDown,
  Layers,
  Leaf,
  Sparkles,
  Database
} from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabase';

export const HeaderNavbar: React.FC = () => {
  const { 
    user, 
    logout, 
    facilities, 
    selectedFacilityId, 
    setSelectedFacilityId, 
    selectedYear, 
    setSelectedYear,
    isSuperAdmin,
    isBranchAdmin,
    getScopedFacilities
  } = useAuth();

  const scopedFacilities = getScopedFacilities();

  // Group facilities into Branches and their child CSCs for clean selection
  const parentBranches = scopedFacilities.filter(f => f.type === 'Branch' || f.isParent);
  const standaloneFacilities = scopedFacilities.filter(f => !f.parentId && f.type !== 'Branch' && !f.isParent);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-inner">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">LECO</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  Carbon Accounting
                </span>
              </div>
              <div className="text-[11px] text-slate-400 hidden sm:block">
                Lanka Electricity Company (Pvt) Ltd &bull; Corporate GHG Inventory
              </div>
            </div>
          </div>

          {/* Center: Global Scope Selectors (Facility & Year) */}
          <div className="hidden md:flex items-center gap-3">
            {/* Facility Filter */}
            <div className="flex items-center bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-sm">
              <Building2 className="w-4 h-4 text-emerald-400 mr-2 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Facility Scope</span>
                <select
                  value={selectedFacilityId}
                  onChange={(e) => setSelectedFacilityId(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-100 focus:outline-none cursor-pointer pr-4"
                >
                  {isSuperAdmin && (
                    <option value="ALL" className="bg-slate-900 text-white">
                      🏢 ALL LECO Facilities (Corporate Global)
                    </option>
                  )}

                  {/* Branches & their CSCs */}
                  {parentBranches.map(branch => {
                    const children = scopedFacilities.filter(f => f.parentId === branch.id);
                    return (
                      <optgroup key={branch.id} label={`📍 ${branch.name}`} className="bg-slate-900 text-slate-200 font-bold">
                        <option value={branch.id} className="bg-slate-900 text-white font-semibold pl-4">
                          ↳ {branch.name} (Parent Branch & All CSCs)
                        </option>
                        {children.map(child => (
                          <option key={child.id} value={child.id} className="bg-slate-900 text-slate-300 pl-6">
                            &nbsp;&nbsp;&bull; {child.name}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}

                  {/* Standalone facilities */}
                  {standaloneFacilities.length > 0 && (
                    <optgroup label="🏭 Specialised Facilities & Depots" className="bg-slate-900 text-slate-200 font-bold">
                      {standaloneFacilities.map(fac => (
                        <option key={fac.id} value={fac.id} className="bg-slate-900 text-white">
                          &bull; {fac.name} ({fac.type})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
            </div>

            {/* Reporting Year Selector */}
            <div className="flex items-center bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-sm">
              <Calendar className="w-4 h-4 text-amber-400 mr-2 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Reporting Year</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-transparent text-xs font-semibold text-slate-100 focus:outline-none cursor-pointer"
                >
                  <option value={2026} className="bg-slate-900 text-white">FY 2026</option>
                  <option value={2025} className="bg-slate-900 text-white">FY 2025</option>
                  <option value={2024} className="bg-slate-900 text-white">FY 2024</option>
                  <option value={2023} className="bg-slate-900 text-white">FY 2023</option>
                  <option value={2022} className="bg-slate-900 text-white">FY 2022</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right: User Profile & Logout */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-100 flex items-center justify-end gap-1.5">
                    {user.name}
                    {isSuperAdmin && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-end gap-1.5">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                      isSuperAdmin ? 'bg-emerald-400' : isBranchAdmin ? 'bg-blue-400' : 'bg-amber-400'
                    }`} />
                    <span>
                      {isSuperAdmin ? 'Super Admin' : isBranchAdmin ? `Branch Admin (${user.facilityName || 'Branch'})` : `${user.facilityName || 'Officer'}`}
                    </span>
                  </div>
                </div>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-sm shadow-inner">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
