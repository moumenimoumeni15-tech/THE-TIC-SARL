import React from 'react';
import { Menu, Plus, Calendar, User as UserIcon, LogOut, LogIn } from 'lucide-react';
import { getTodayFormattedHeader } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onOpenMobileSidebar: () => void;
  onNewReportClick: () => void;
  onOpenAuthModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileSidebar,
  onNewReportClick,
  onOpenAuthModal,
}) => {
  const { user, signOut } = useAuth();
  const todayFormatted = getTodayFormattedHeader();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 h-16 sm:h-18 px-3 sm:px-6 lg:px-8 flex items-center justify-between">
      {/* Left side: Hamburger button + Title + Date */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors shrink-0 cursor-pointer"
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0 flex items-center gap-2.5">
          <img
            src="/logo-128.png"
            alt="THE TIC MANAGER"
            className="w-8 h-8 rounded-lg object-cover shadow-xs border border-orange-100 lg:hidden shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-lg font-bold text-slate-900 tracking-tight truncate">
                THE TIC <span className="text-orange-500 font-semibold">MANAGER</span>
              </h1>
            </div>
            <div className="hidden xs:flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 font-medium capitalize truncate">
              <Calendar className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span className="truncate">{todayFormatted}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: New report CTA + Auth Profile */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Nouveau rapport button */}
        <button
          onClick={onNewReportClick}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-orange-500 hover:bg-orange-600 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs hover:shadow-orange-500/20 transition-all duration-150 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden sm:inline">Nouveau rapport</span>
          <span className="sm:hidden">Rapport</span>
        </button>

        {/* User profile / Auth button */}
        {user ? (
          <div className="flex items-center gap-2 pl-1 border-l border-slate-200 ml-1">
            <div
              className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-100 rounded-xl text-xs font-medium text-slate-700"
              title={user.email || 'Utilisateur connecté'}
            >
              <div className="w-6 h-6 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">
                {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="hidden md:inline max-w-[120px] truncate">{user.email}</span>
            </div>
            <button
              onClick={signOut}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-medium transition-colors"
            title="Connexion au compte"
          >
            <UserIcon className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Connexion</span>
          </button>
        )}
      </div>
    </header>
  );
};
