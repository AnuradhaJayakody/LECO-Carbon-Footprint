import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Zap, 
  Building2, 
  Calendar, 
  LogOut, 
  ShieldCheck, 
  Lock,
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
    isFacilityUser,
    getScopedFacilities
  } = useAuth();

  const scopedFacilities = getScopedFacilities();

  // Keep selectedFacilityId within valid RBAC boundary
  useEffect(() => {
    if (isFacilityUser && user?.facilityId) {
      if (selectedFacilityId !== user.facilityId) {
        setSelectedFacilityId(user.facilityId);
      }
    } else if (isBranchAdmin && scopedFacilities.length > 0) {
      const isCurrentlyValid = scopedFacilities.some(f => f.id === selectedFacilityId);
      if (!isCurrentlyValid) {
        setSelectedFacilityId(scopedFacilities[0].id);
      }
    }
  }, [user?.role, user?.facilityId, isFacilityUser, isBranchAdmin, scopedFacilities, selectedFacilityId, setSelectedFacilityId]);

  // Group scoped facilities into Branches and child CSCs for clean selection
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
            {/* Facility Filter based on RBAC */}
            <div className="flex items-center bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-sm">
              <Building2 className={`w-4 h-4 mr-2 shrink-0 ${isSuperAdmin ? 'text-emerald-400' : isBranchAdmin ? 'text-blue-400' : 'text-amber-400'}`} />
              
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    {isFacilityUser ? 'Assigned Facility' : isBranchAdmin ? 'Branch Admin Scope' : 'Facility Scope'}
                  </span>
                  {isFacilityUser && <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />}
                </div>

                {isFacilityUser ? (
                  // Facility User: Locked to their single facility_id (no dropdown/locked view)
                  <div className="text-xs font-bold text-slate-200 truncate max-w-[200px]" title={facilities.find(f => f.id === user?.facilityId)?.name || user?.facilityName || 'Assigned Facility'}>
                    {facilities.find(f => f.id === user?.facilityId)?.name || user?.facilityName || 'Assigned CSC'}
                  </div>
                ) : (
                  // Super Admin or Branch Admin: Scoped Dropdown
                  <select
                    value={selectedFacilityId}
                    onChange={(e) => setSelectedFacilityId(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-slate-100 focus:outline-none cursor-pointer pr-4 max-w-[240px] truncate"
                  >
                    {isSuperAdmin && (
                      <option value="ALL" className="bg-slate-900 text-white font-bold">
                        🏢 ALL LECO Facilities (Corporate Global)
                      </option>
                    )}

                    {/* Branches & their assigned CSCs */}
                    {parentBranches.map(branch => {
                      const children = scopedFacilities.filter(f => f.parentId === branch.id);
                      return (
                        <optgroup key={branch.id} label={`📍 ${branch.name}`} className="bg-slate-900 text-slate-200 font-bold">
                          <option value={branch.id} className="bg-slate-900 text-white font-semibold pl-4">
                            ↳ {branch.name} {children.length > 0 ? '(Branch & CSCs)' : '(Parent Branch)'}
                          </option>
                          {children.map(child => (
                            <option key={child.id} value={child.id} className="bg-slate-900 text-slate-300 pl-6">
                              &nbsp;&nbsp;&bull; {child.name}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}

                    {/* Scoped Child CSCs whose parent branch is not explicitly in scoped list */}
                    {scopedFacilities.filter(f => f.parentId && !parentBranches.some(p => p.id === f.parentId)).length > 0 && (
                      <optgroup label="🏢 Assigned CSC Units" className="bg-slate-900 text-slate-200 font-bold">
                        {scopedFacilities
                          .filter(f => f.parentId && !parentBranches.some(p => p.id === f.parentId))
                          .map(fac => (
                            <option key={fac.id} value={fac.id} className="bg-slate-900 text-white">
                              &bull; {fac.name} ({fac.parentName || 'CSC'})
                            </option>
                          ))}
                      </optgroup>
                    )}

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
                )}
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

