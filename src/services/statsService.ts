import { Rapport, Tache, DashboardStats, StatutTache, PeriodeFiltre } from '../types/database';
import { getWeekNumber } from '../utils/dateUtils';

export function calculateDashboardStats(
  rapports: Rapport[],
  taches: Tache[],
  periode: PeriodeFiltre,
  customStartDate?: string,
  customEndDate?: string
): DashboardStats {
  const now = new Date();
  let filterStartDate: Date;

  switch (periode) {
    case '7d':
      filterStartDate = new Date(now.getTime() - 7 * 86400000);
      break;
    case '30d':
      filterStartDate = new Date(now.getTime() - 30 * 86400000);
      break;
    case '90d':
      filterStartDate = new Date(now.getTime() - 90 * 86400000);
      break;
    case 'year':
      filterStartDate = new Date(now.getFullYear(), 0, 1);
      break;
    case 'custom':
      filterStartDate = customStartDate ? new Date(customStartDate) : new Date(now.getTime() - 30 * 86400000);
      break;
    default:
      filterStartDate = new Date(now.getTime() - 30 * 86400000);
  }

  const filterEndDate = customEndDate && periode === 'custom' ? new Date(`${customEndDate}T23:59:59`) : now;

  // Calcul de la période précédente pour l'évolution
  const periodDurationMs = filterEndDate.getTime() - filterStartDate.getTime();
  const prevPeriodStart = new Date(filterStartDate.getTime() - periodDurationMs);
  const prevPeriodEnd = new Date(filterStartDate.getTime());

  // Filtrer rapports et tâches dans la période active
  const filteredRapports = rapports.filter((r) => {
    const d = new Date(r.date_rapport);
    return d >= filterStartDate && d <= filterEndDate;
  });

  const prevRapports = rapports.filter((r) => {
    const d = new Date(r.date_rapport);
    return d >= prevPeriodStart && d < prevPeriodEnd;
  });

  const filteredTaches = taches.filter((t) => {
    const d = new Date(t.date_realisation);
    return d >= filterStartDate && d <= filterEndDate;
  });

  const prevTaches = taches.filter((t) => {
    const d = new Date(t.date_realisation);
    return d >= prevPeriodStart && d < prevPeriodEnd;
  });

  // Calcul de l'évolution en % (par rapport à la période précédente)
  let rapportsEvolutionPct: number | null = null;
  if (prevRapports.length > 0) {
    rapportsEvolutionPct = Math.round(((filteredRapports.length - prevRapports.length) / prevRapports.length) * 100);
  } else if (filteredRapports.length > 0) {
    rapportsEvolutionPct = 100;
  }

  let tachesEvolutionPct: number | null = null;
  if (prevTaches.length > 0) {
    tachesEvolutionPct = Math.round(((filteredTaches.length - prevTaches.length) / prevTaches.length) * 100);
  } else if (filteredTaches.length > 0) {
    tachesEvolutionPct = 100;
  }

  // 1. Évolution quotidienne des tâches (LineChart)
  // Grouper les tâches par jour
  const tasksByDayMap = new Map<string, number>();

  // Pré-remplir les dates pour les 7 ou 14 derniers jours si filtre court pour afficher une belle courbe
  const daysDiff = Math.max(1, Math.min(30, Math.round(periodDurationMs / 86400000)));
  for (let i = daysDiff - 1; i >= 0; i--) {
    const d = new Date(filterEndDate.getTime() - i * 86400000);
    const dateKey = d.toISOString().split('T')[0];
    tasksByDayMap.set(dateKey, 0);
  }

  filteredTaches.forEach((t) => {
    const dateKey = t.date_realisation;
    tasksByDayMap.set(dateKey, (tasksByDayMap.get(dateKey) || 0) + 1);
  });

  const dailyTasksTrend = Array.from(tasksByDayMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => {
      const parts = date.split('-');
      const formatted = parts.length === 3 ? `${parts[2]}/${parts[1]}` : date;
      return {
        date,
        formattedDate: formatted,
        count,
      };
    });

  // 2. Répartition par statut (Donut)
  const statuts: StatutTache[] = ['À faire', 'En cours', 'Terminée', 'Bloquée'];
  const statusColors: Record<StatutTache, string> = {
    'À faire': '#94A3B8', // Slate
    'En cours': '#F97316', // Orange principal
    'Terminée': '#16A34A', // Vert discret
    'Bloquée': '#EF4444', // Rouge discret
  };

  const statusCountMap: Record<StatutTache, number> = {
    'À faire': 0,
    'En cours': 0,
    'Terminée': 0,
    'Bloquée': 0,
  };

  filteredTaches.forEach((t) => {
    if (statusCountMap[t.statut] !== undefined) {
      statusCountMap[t.statut]++;
    }
  });

  const totalFilteredTasks = filteredTaches.length;
  const statusDistribution = statuts.map((st) => {
    const count = statusCountMap[st];
    const percentage = totalFilteredTasks > 0 ? Math.round((count / totalFilteredTasks) * 100) : 0;
    return {
      name: st,
      count,
      percentage,
      color: statusColors[st],
    };
  });

  // 3. Tâches terminées par semaine (BarChart)
  const completedTasks = filteredTaches.filter((t) => t.statut === 'Terminée');
  const completedByWeekMap = new Map<string, number>();

  completedTasks.forEach((t) => {
    const date = new Date(t.date_realisation);
    const weekNum = getWeekNumber(date);
    const year = date.getFullYear();
    const weekKey = `Semaine ${weekNum} (${year})`;
    completedByWeekMap.set(weekKey, (completedByWeekMap.get(weekKey) || 0) + 1);
  });

  // Si pas assez de semaines, inclure la semaine courante
  if (completedByWeekMap.size === 0) {
    const currentWeek = getWeekNumber(now);
    completedByWeekMap.set(`Semaine ${currentWeek} (${now.getFullYear()})`, 0);
  }

  const completedByWeek = Array.from(completedByWeekMap.entries()).map(([weekLabel, count]) => ({
    weekLabel,
    count,
  }));

  // 4. Répartition des tâches par catégorie (Horizontal BarChart)
  const categoryMap = new Map<string, number>();
  filteredTaches.forEach((t) => {
    const cat = t.categorie || 'Autres activités';
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
  });

  const categoryDistribution = Array.from(categoryMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalRapports: filteredRapports.length,
    totalTaches: filteredTaches.length,
    rapportsEvolutionPct,
    tachesEvolutionPct,
    dailyTasksTrend,
    statusDistribution,
    completedByWeek,
    categoryDistribution,
  };
}
