import React from 'react';
import { FileText, CheckSquare, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  type: 'rapports' | 'taches';
  total: number;
  evolutionPct: number | null;
  periodLabel: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  type,
  total,
  evolutionPct,
  periodLabel,
}) => {
  const isRapports = type === 'rapports';
  const title = isRapports ? 'Total des rapports' : 'Total des tâches';
  const description = isRapports
    ? 'Rapports journaliers enregistrés'
    : 'Tâches opérationnelles suivies';

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </span>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {total.toLocaleString('fr-FR')}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            {description}
          </p>
        </div>

        {/* Icon container */}
        <div className="w-13 h-13 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 shadow-xs shrink-0 group-hover:scale-105 transition-transform">
          {isRapports ? (
            <FileText className="w-6 h-6 stroke-[2.2]" />
          ) : (
            <CheckSquare className="w-6 h-6 stroke-[2.2]" />
          )}
        </div>
      </div>

      {/* Evolution indicator */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          {evolutionPct === null ? (
            <span className="inline-flex items-center gap-1 text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-md">
              <Minus className="w-3.5 h-3.5" />
              <span>Base de référence</span>
            </span>
          ) : evolutionPct > 0 ? (
            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+{evolutionPct}%</span>
            </span>
          ) : evolutionPct < 0 ? (
            <span className="inline-flex items-center gap-1 text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>{evolutionPct}%</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">
              <Minus className="w-3.5 h-3.5" />
              <span>Stable (0%)</span>
            </span>
          )}
          <span className="text-slate-500 font-normal">vs période précédente</span>
        </div>

        <span className="text-[11px] font-medium text-slate-400">
          {periodLabel}
        </span>
      </div>
    </div>
  );
};
