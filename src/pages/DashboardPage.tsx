import React, { useState, useMemo } from 'react';
import {
  FileText,
  CheckSquare,
  Calendar,
  Filter,
  Plus,
  ArrowRight,
  FolderPlus,
  RefreshCw,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { Rapport, Tache, PeriodeFiltre, STATUTS_CONFIG, PRIORITES_CONFIG } from '../types/database';
import { calculateDashboardStats } from '../services/statsService';
import { StatCard } from '../components/StatCard';
import { DashboardCharts } from '../components/DashboardCharts';
import { formatDateFrench, formatDateShort } from '../utils/dateUtils';
import { seedInitialData } from '../services/seedService';
import { useNotification } from '../context/NotificationContext';

interface DashboardPageProps {
  rapports: Rapport[];
  taches: Tache[];
  onNavigate: (tab: any, param?: any) => void;
  onRefreshData: () => Promise<void>;
  isLoading: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  rapports,
  taches,
  onNavigate,
  onRefreshData,
  isLoading,
}) => {
  const [periode, setPeriode] = useState<PeriodeFiltre>('30d');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [isSeeding, setIsSeeding] = useState<boolean>(false);

  const { showNotification } = useNotification();

  // Calcul dynamique des statistiques depuis les données
  const stats = useMemo(() => {
    return calculateDashboardStats(rapports, taches, periode, customStart, customEnd);
  }, [rapports, taches, periode, customStart, customEnd]);

  const periodLabels: Record<PeriodeFiltre, string> = {
    '7d': '7 derniers jours',
    '30d': '30 derniers jours',
    '90d': '90 derniers jours',
    'year': 'Cette année',
    'custom': 'Période personnalisée',
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const res = await seedInitialData();
      if (res.success) {
        showNotification('success', 'Données initialisées', res.message);
        await onRefreshData();
      } else {
        showNotification('error', 'Erreur d\'initialisation', res.message);
      }
    } catch (err: unknown) {
      showNotification('error', 'Erreur', String(err));
    } finally {
      setIsSeeding(false);
    }
  };

  // Derniers rapports pour l'aperçu
  const recentReports = useMemo(() => {
    return rapports.slice(0, 3);
  }, [rapports]);

  // Dernières tâches urgentes ou en cours
  const urgentTasks = useMemo(() => {
    return taches.filter((t) => t.statut === 'En cours' || t.statut === 'Bloquée' || t.priorite === 'Urgente').slice(0, 4);
  }, [taches]);

  return (
    <div className="space-y-6">
      {/* Top banner / Filters bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Tableau de bord d'activité
          </h2>
          <p className="text-xs text-slate-500">
            Suivi en temps réel de vos rapports journaliers et volume de travail
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-600 shrink-0">
            <button
              onClick={() => setPeriode('7d')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                periode === '7d' ? 'bg-white text-orange-600 font-semibold shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              7 jours
            </button>
            <button
              onClick={() => setPeriode('30d')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                periode === '30d' ? 'bg-white text-orange-600 font-semibold shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              30 jours
            </button>
            <button
              onClick={() => setPeriode('90d')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                periode === '90d' ? 'bg-white text-orange-600 font-semibold shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              90 jours
            </button>
            <button
              onClick={() => setPeriode('year')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                periode === 'year' ? 'bg-white text-orange-600 font-semibold shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Cette année
            </button>
            <button
              onClick={() => setPeriode('custom')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                periode === 'custom' ? 'bg-white text-orange-600 font-semibold shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Personnalisé
            </button>
          </div>

          <button
            onClick={() => onRefreshData()}
            disabled={isLoading}
            className="p-2 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors border border-slate-200 cursor-pointer disabled:opacity-50"
            title="Actualiser les données"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-orange-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Custom date range pickers if 'custom' is active */}
      {periode === 'custom' && (
        <div className="bg-orange-50/70 border border-orange-200 p-4 rounded-2xl flex flex-wrap items-center gap-3 animate-in fade-in duration-200">
          <span className="text-xs font-semibold text-orange-800 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" /> Période personnalisée :
          </span>
          <div className="flex items-center gap-2 text-xs">
            <label className="text-slate-600">Du :</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-800"
            />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <label className="text-slate-600">Au :</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-800"
            />
          </div>
        </div>
      )}

      {/* ======================================================================
          SECTION 4 : EXACTEMENT DEUX CARTES STATISTIQUES
          ====================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          type="rapports"
          total={stats.totalRapports}
          evolutionPct={stats.rapportsEvolutionPct}
          periodLabel={periodLabels[periode]}
        />
        <StatCard
          type="taches"
          total={stats.totalTaches}
          evolutionPct={stats.tachesEvolutionPct}
          periodLabel={periodLabels[periode]}
        />
      </div>

      {/* Si aucune donnée n'est présente, proposer d'insérer des données de démo */}
      {rapports.length === 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-white rounded-2xl p-6 border border-orange-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white border border-orange-200/80 shadow-xs flex items-center justify-center shrink-0 p-0.5">
              <img
                src="/logo-128.png"
                alt="THE TIC MANAGER"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Bienvenue sur THE TIC MANAGER !
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Votre base ne contient pas encore de rapports. Créez votre premier rapport ou injectez un jeu de données de test.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleSeedData}
              disabled={isSeeding}
              className="px-4 py-2 bg-white hover:bg-orange-50 text-orange-600 border border-orange-300 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              {isSeeding ? 'Initialisation...' : 'Insérer données de test'}
            </button>
            <button
              onClick={() => onNavigate('new-report')}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Nouveau rapport
            </button>
          </div>
        </div>
      )}

      {/* ======================================================================
          SECTION 5 : EXACTEMENT QUATRE GRAPHIQUES
          ====================================================================== */}
      <DashboardCharts stats={stats} />

      {/* ======================================================================
          SECTION COMPLÉMENTAIRE : ACTIVITÉ RÉCENTE (Rapports & Tâches à suivre)
          ====================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Rapports récents (2 colonnes) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 mb-3 sm:mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Derniers rapports enregistrés
              </h3>
              <p className="text-xs text-slate-500">
                Accès direct aux comptes-rendus journaliers récents
              </p>
            </div>
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Voir tout ({rapports.length})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {recentReports.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">
              Aucun rapport créé pour le moment.
            </p>
          ) : (
            <div className="space-y-3">
              {recentReports.map((r) => {
                const totalReportTasks = taches.filter((t) => t.rapport_id === r.id).length;
                const completedTasks = taches.filter((t) => t.rapport_id === r.id && t.statut === 'Terminée').length;

                return (
                  <div
                    key={r.id}
                    onClick={() => onNavigate('reports', r.id)}
                    className="p-3 sm:p-4 rounded-xl border border-slate-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all cursor-pointer flex items-center justify-between gap-3 sm:gap-4 group"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-50 border border-orange-100 text-orange-600 flex items-center justify-center shrink-0 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors truncate">
                          {r.titre}
                        </h4>
                        <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-500 mt-0.5">
                          <span className="truncate">{formatDateShort(r.date_rapport)}</span>
                          {r.lieu_service && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[120px] sm:max-w-none">{r.lieu_service}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-800">
                          {completedTasks}/{totalReportTasks}
                        </span>
                        <p className="text-[10px] text-slate-400">
                          {totalReportTasks > 0 ? Math.round((completedTasks / totalReportTasks) * 100) : 0}%
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tâches nécessitant une attention (1 colonne) */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 mb-3 sm:mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Tâches à surveiller
              </h3>
              <p className="text-xs text-slate-500">
                En cours, bloquées ou urgentes
              </p>
            </div>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 cursor-pointer"
            >
              Gérer
            </button>
          </div>

          {urgentTasks.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">
              Aucune tâche critique ou bloquée à ce jour.
            </p>
          ) : (
            <div className="space-y-2.5">
              {urgentTasks.map((t) => {
                const conf = STATUTS_CONFIG[t.statut];
                return (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-slate-200 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="text-xs font-semibold text-slate-900 leading-snug line-clamp-2">
                        {t.intitule}
                      </h5>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${conf.bg} ${conf.text} ${conf.border}`}
                      >
                        {t.statut}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-200/60">
                      <span>{formatDateShort(t.date_realisation)}</span>
                      <span className="font-medium text-slate-600">{t.categorie}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
