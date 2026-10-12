/**
 * Types de données pour THE TIC MANAGER
 */

export type StatutTache = 'À faire' | 'En cours' | 'Terminée' | 'Bloquée';
export type PrioriteTache = 'Faible' | 'Normale' | 'Élevée' | 'Urgente';

export interface Rapport {
  id: string;
  user_id?: string | null;
  date_rapport: string; // YYYY-MM-DD
  titre: string;
  lieu_service?: string | null;
  objectif?: string | null;
  resume?: string | null;
  difficultes?: string | null;
  solutions?: string | null;
  competences_acquises?: string | null;
  observations?: string | null;
  created_at: string;
  updated_at: string;
  // Propriétés jointes/calculées
  taches?: Tache[];
}

export interface Tache {
  id: string;
  rapport_id: string;
  user_id?: string | null;
  intitule: string;
  description?: string | null;
  categorie: string;
  date_realisation: string; // YYYY-MM-DD
  heure_debut?: string | null;
  heure_fin?: string | null;
  statut: StatutTache;
  priorite: PrioriteTache;
  resultat?: string | null;
  difficultes?: string | null;
  created_at: string;
  updated_at: string;
  // Propriété jointe facultative
  rapport_titre?: string;
  rapport_date?: string;
}

export interface RapportWithTachesStats extends Rapport {
  total_taches: number;
  taches_terminees: number;
}

export type PeriodeFiltre = '7d' | '30d' | '90d' | 'year' | 'custom';

export interface DashboardStats {
  totalRapports: number;
  totalTaches: number;
  rapportsEvolutionPct: number | null; // % par rapport à période précédente
  tachesEvolutionPct: number | null;
  dailyTasksTrend: { date: string; formattedDate: string; count: number }[];
  statusDistribution: { name: StatutTache; count: number; percentage: number; color: string }[];
  completedByWeek: { weekLabel: string; count: number }[];
  categoryDistribution: { category: string; count: number }[];
}

export const CATEGORIES_TACHES = [
  'Développement web',
  'Maintenance informatique',
  'Réseau informatique',
  'Installation et configuration',
  'Assistance technique',
  'Gestion de projet & Réunion',
  'Sécurité & Sauvegarde',
  'Autres activités',
] as const;

export const STATUTS_CONFIG: Record<StatutTache, { label: string; color: string; bg: string; border: string; text: string }> = {
  'À faire': {
    label: 'À faire',
    color: '#64748B',
    bg: 'bg-slate-100',
    border: 'border-slate-300',
    text: 'text-slate-700',
  },
  'En cours': {
    label: 'En cours',
    color: '#F97316',
    bg: 'bg-orange-50',
    border: 'border-orange-300',
    text: 'text-orange-700',
  },
  'Terminée': {
    label: 'Terminée',
    color: '#16A34A',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    text: 'text-emerald-700',
  },
  'Bloquée': {
    label: 'Bloquée',
    color: '#DC2626',
    bg: 'bg-rose-50',
    border: 'border-rose-300',
    text: 'text-rose-700',
  },
};

export const PRIORITES_CONFIG: Record<PrioriteTache, { label: string; badge: string; color: string }> = {
  'Faible': {
    label: 'Faible',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    color: '#94A3B8',
  },
  'Normale': {
    label: 'Normale',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    color: '#3B82F6',
  },
  'Élevée': {
    label: 'Élevée',
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    color: '#F97316',
  },
  'Urgente': {
    label: 'Urgente',
    badge: 'bg-red-50 text-red-700 border-red-200',
    color: '#EF4444',
  },
};
