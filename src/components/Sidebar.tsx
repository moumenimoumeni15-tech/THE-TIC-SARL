import React from 'react';
import {
  LayoutDashboard,
  FilePlus2,
  Files,
  CheckSquare,
  BarChart3,
  Settings,
  Database,
  X,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'new-report' | 'reports' | 'tasks' | 'stats' | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  isSupabaseConfigured: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile,
  setIsOpenMobile,
  isSupabaseConfigured,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'new-report', label: 'Nouveau rapport', icon: <FilePlus2 className="w-5 h-5" /> },
    { id: 'reports', label: 'Tous les rapports', icon: <Files className="w-5 h-5" /> },
    { id: 'tasks', label: 'Gestion des tâches', icon: <CheckSquare className="w-5 h-5" /> },
    { id: 'stats', label: 'Statistiques', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'settings', label: 'Paramètres', icon: <Settings className="w-5 h-5" /> },
  ];

  const handleSelect = (tab: NavTab) => {
    setActiveTab(tab);
    setIsOpenMobile(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-18 px-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border border-slate-200/80 shadow-xs flex items-center justify-center shrink-0 p-0.5">
              <img
                src="/logo-256.png"
                alt="THE TIC MANAGER Logo"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-base block leading-tight">
                THE TIC
              </span>
              <span className="text-[11px] font-bold text-orange-500 uppercase tracking-wider block">
                MANAGER
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsOpenMobile(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Menu Principal
          </div>

          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 relative ${
                  isActive
                    ? 'bg-orange-50 text-orange-600 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-orange-500 rounded-r-full" />
                )}
                <span className={isActive ? 'text-orange-500' : 'text-slate-400 group-hover:text-slate-600'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Database status footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 m-3 rounded-2xl">
          <div className="flex items-center gap-2.5 mb-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-amber-400 ring-2 ring-amber-200'}`} />
            <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-slate-500" />
              {isSupabaseConfigured ? 'Base Cloud Connectée' : 'Mode Autonome'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            {isSupabaseConfigured
              ? 'Synchronisation avec le serveur PostgreSQL active.'
              : 'Données stockées localement. Connectez votre serveur dans Paramètres.'}
          </p>
          {!isSupabaseConfigured && (
            <button
              onClick={() => handleSelect('settings')}
              className="mt-2.5 w-full text-center py-1.5 px-2 text-[11px] font-semibold text-orange-600 bg-white border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors shadow-2xs cursor-pointer"
            >
              Connecter la base de données
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
