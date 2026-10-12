import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  Layers,
  Award,
  TrendingUp,
} from 'lucide-react';
import { Rapport, Tache, PeriodeFiltre } from '../types/database';
import { calculateDashboardStats } from '../services/statsService';
import { DashboardCharts } from '../components/DashboardCharts';
import { StatCard } from '../components/StatCard';

interface StatisticsPageProps {
  rapports: Rapport[];
  taches: Tache[];
}

export const StatisticsPage: React.FC<StatisticsPageProps> = ({ rapports, taches }) => {
  const [periode, setPeriode] = useState<PeriodeFiltre>('30d');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

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

  // Indicateurs clés additionnels
  const termineesCount = useMemo(() => {
    return taches.filter((t) => t.statut === 'Terminée').length;
  }, [taches]);

  const tauxAchevement = useMemo(() => {
    return taches.length > 0 ? Math.round((termineesCount / taches.length) * 100) : 0;
  }, [taches, termineesCount]);

  const moyenneTachesParRapport = useMemo(() => {
    return rapports.length > 0 ? (taches.length / rapports.length).toFixed(1) : '0';
  }, [rapports, taches]);

  return (
    <div className="space-y-6">
      {/* Top Header & Filter */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Analyses & Statistiques d'Activité
            </h2>
            <p className="text-xs text-slate-500">
              Visualisation complète des tendances, volumes et taux de réalisation
            </p>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-600">
          <button
            onClick={() => setPeriode('7d')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              periode === '7d' ? 'bg-white text-orange-600 font-semibold shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            7 jours
          </button>
          <button
            onClick={() => setPeriode('30d')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              periode === '30d' ? 'bg-white text-orange-600 font-semibold shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            30 jours
          </button>
          <button
            onClick={() => setPeriode('90d')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              periode === '90d' ? 'bg-white text-orange-600 font-semibold shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            90 jours
          </button>
          <button
            onClick={() => setPeriode('year')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              periode === 'year' ? 'bg-white text-orange-600 font-semibold shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Cette année
          </button>
        </div>
      </div>

      {/* Cartes statistiques principales */}
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

      {/* Cartes de synthèse supplémentaires */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Taux d'achèvement
            </span>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {tauxAchevement}%
            </div>
            <p className="text-[11px] text-slate-400">
              {termineesCount} tâches terminées sur {taches.length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Moyenne par rapport
            </span>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {moyenneTachesParRapport}
            </div>
            <p className="text-[11px] text-slate-400">
              Tâches enregistrées par compte-rendu
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Catégories actives
            </span>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {stats.categoryDistribution.length}
            </div>
            <p className="text-[11px] text-slate-400">
              Domaines d'intervention renseignés
            </p>
          </div>
        </div>
      </div>

      {/* Quatre graphiques analytiques */}
      <DashboardCharts stats={stats} />
    </div>
  );
};
