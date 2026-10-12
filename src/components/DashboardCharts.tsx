import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { DashboardStats } from '../types/database';
import { Activity, PieChart as PieIcon, CheckCircle2, Layers, AlertCircle } from 'lucide-react';

interface DashboardChartsProps {
  stats: DashboardStats;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ stats }) => {
  const {
    dailyTasksTrend,
    statusDistribution,
    completedByWeek,
    categoryDistribution,
    totalTaches,
  } = stats;

  const hasData = totalTaches > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ========================================================
          GRAPHIQUE 1 : Évolution quotidienne des tâches
          ======================================================== */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <Activity className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                1. Évolution quotidienne des tâches
              </h3>
              <p className="text-xs text-slate-500">
                Volume de tâches réalisées par date
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 bg-orange-50 text-orange-600 rounded-md border border-orange-200/60">
            Courbe
          </span>
        </div>

        <div className="h-64 w-full">
          {!hasData || dailyTasksTrend.length === 0 ? (
            <EmptyChartState message="Aucune tâche enregistrée sur cette période." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyTasksTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="formattedDate"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as { date: string; count: number };
                      return (
                        <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-xl shadow-lg border border-slate-800">
                          <p className="font-semibold text-orange-400">{data.date}</p>
                          <p className="mt-0.5 font-medium">
                            {data.count} tâche{data.count > 1 ? 's' : ''}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#F97316"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#FFFFFF', stroke: '#F97316', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#EA580C', stroke: '#FFFFFF', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ========================================================
          GRAPHIQUE 2 : Répartition des tâches par statut
          ======================================================== */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col">
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
              <PieIcon className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                2. Répartition des tâches par statut
              </h3>
              <p className="text-xs text-slate-500">
                Proportion des 4 statuts d'activité
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 bg-orange-50 text-orange-600 rounded-md border border-orange-200/60 shrink-0">
            Anneau
          </span>
        </div>

        <div className="w-full flex-1 flex flex-col md:flex-row items-center justify-center gap-3 sm:gap-5 py-1">
          {!hasData ? (
            <div className="h-48 sm:h-64 w-full flex items-center justify-center">
              <EmptyChartState message="Aucune tâche disponible pour calculer la répartition." />
            </div>
          ) : (
            <>
              {/* Conteneur de l'anneau Recharts */}
              <div className="w-full md:w-1/2 h-44 sm:h-56 flex items-center justify-center shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={44}
                      outerRadius={68}
                      paddingAngle={3}
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any, item: any) => [
                        `${value} tâches (${item.payload.percentage}%)`,
                        name,
                      ]}
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderRadius: '12px',
                        color: '#FFF',
                        fontSize: '12px',
                        border: 'none',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Légende responsive (Grille 2 colonnes sur mobile, 1 colonne sur desktop) */}
              <div className="w-full md:w-1/2 grid grid-cols-2 md:grid-cols-1 gap-2 justify-center">
                {statusDistribution.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-semibold text-slate-800 text-[11px] sm:text-xs truncate">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 pl-1">
                      <span className="font-bold text-slate-900 text-xs">{item.count}</span>
                      <span className="text-slate-400 text-[10px] sm:text-[11px]">
                        ({item.percentage}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ========================================================
          GRAPHIQUE 3 : Tâches terminées par semaine
          ======================================================== */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                3. Tâches terminées par semaine
              </h3>
              <p className="text-xs text-slate-500">
                Progression du travail accompli au fil des semaines
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 bg-orange-50 text-orange-600 rounded-md border border-orange-200/60">
            Barres
          </span>
        </div>

        <div className="h-64 w-full">
          {!hasData || completedByWeek.length === 0 ? (
            <EmptyChartState message="Aucune tâche terminée sur la période sélectionnée." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={completedByWeek} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="weekLabel"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: '#FFF7ED' }}
                  formatter={(val: any) => [`${val} tâches terminées`, 'Accompli']}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '12px',
                    color: '#FFF',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#F97316"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ========================================================
          GRAPHIQUE 4 : Répartition des tâches par catégorie
          ======================================================== */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <Layers className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                4. Répartition des tâches par catégorie
              </h3>
              <p className="text-xs text-slate-500">
                Typologie d'interventions et domaines d'activité
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 bg-orange-50 text-orange-600 rounded-md border border-orange-200/60">
            Horizontal
          </span>
        </div>

        <div className="h-64 w-full">
          {!hasData || categoryDistribution.length === 0 ? (
            <EmptyChartState message="Aucune catégorie de tâche trouvée pour la période." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryDistribution.slice(0, 6)}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 25, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  tick={{ fontSize: 10, fill: '#475569' }}
                  width={110}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: '#FFF7ED' }}
                  formatter={(val: any) => [`${val} tâches`, 'Volume']}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '12px',
                    color: '#FFF',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#EA580C"
                  radius={[0, 6, 6, 0]}
                  maxBarSize={22}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

const EmptyChartState: React.FC<{ message: string }> = ({ message }) => (
  <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
    <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
    <p className="text-xs font-medium text-slate-500 max-w-xs leading-relaxed">
      {message}
    </p>
  </div>
);
