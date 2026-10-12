import { getSupabaseClient } from '../lib/supabase';
import { Rapport, RapportWithTachesStats, Tache } from '../types/database';

// Démo locale de secours uniquement si Supabase n'est pas configuré
const LOCAL_STORAGE_KEY_RAPPORTS = 'dailyreport_fallback_rapports';

function getLocalFallbackRapports(): Rapport[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_RAPPORTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalFallbackRapports(data: Rapport[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_KEY_RAPPORTS, JSON.stringify(data));
}

// 1. LECTURE DE TOUS LES RAPPORTS (avec calcul du nombre de tâches)
export async function getRapports(): Promise<{ data: RapportWithTachesStats[]; error: string | null; isSupabase: boolean }> {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      // Récupérer les rapports triés par date décroissante
      const { data: rapports, error: errRapports } = await supabase
        .from('rapports')
        .select('*')
        .order('date_rapport', { ascending: false });

      if (errRapports) {
        throw new Error(errRapports.message);
      }

      // Récupérer les tâches pour compter les totaux
      const { data: taches, error: errTaches } = await supabase
        .from('taches')
        .select('id, rapport_id, statut');

      if (errTaches) {
        throw new Error(errTaches.message);
      }

      const tachesList: Tache[] = (taches as Tache[]) || [];

      const reportsWithStats: RapportWithTachesStats[] = (rapports || []).map((r) => {
        const reportTasks = tachesList.filter((t) => t.rapport_id === r.id);
        const terminees = reportTasks.filter((t) => t.statut === 'Terminée').length;
        return {
          ...r,
          total_taches: reportTasks.length,
          taches_terminees: terminees,
        };
      });

      return { data: reportsWithStats, error: null, isSupabase: true };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn('Erreur lors de la récupération des rapports:', errorMsg);

      // Si les tables ne sont pas encore créées sur la base distante, basculer en mode local transparent
      if (
        errorMsg.includes('Could not find the table') ||
        errorMsg.includes('does not exist') ||
        errorMsg.includes('42P01')
      ) {
        const localRapports = getLocalFallbackRapports();
        const localStats: RapportWithTachesStats[] = localRapports.map((r) => ({
          ...r,
          total_taches: 0,
          taches_terminees: 0,
        }));
        return { data: localStats, error: null, isSupabase: false };
      }

      return { data: [], error: errorMsg, isSupabase: true };
    }
  }

  // Fallback si non configuré
  const localRapports = getLocalFallbackRapports();
  const localStats: RapportWithTachesStats[] = localRapports.map((r) => ({
    ...r,
    total_taches: 0,
    taches_terminees: 0,
  }));
  return { data: localStats, error: null, isSupabase: false };
}

// 2. LECTURE D'UN RAPPORT PAR SON ID (avec ses tâches)
export async function getRapportById(id: string): Promise<{ data: Rapport | null; error: string | null; isSupabase: boolean }> {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data: rapport, error: errRapport } = await supabase
        .from('rapports')
        .select('*')
        .eq('id', id)
        .single();

      if (errRapport) throw new Error(errRapport.message);

      // Récupérer les tâches associées
      const { data: taches, error: errTaches } = await supabase
        .from('taches')
        .select('*')
        .eq('rapport_id', id)
        .order('created_at', { ascending: true });

      if (errTaches) throw new Error(errTaches.message);

      return {
        data: {
          ...rapport,
          taches: taches || [],
        },
        error: null,
        isSupabase: true,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return { data: null, error: errorMsg, isSupabase: true };
    }
  }

  const local = getLocalFallbackRapports().find((r) => r.id === id) || null;
  return { data: local, error: null, isSupabase: false };
}

// 3. CRÉATION D'UN NOUVEAU RAPPORT
export async function createRapport(
  rapportData: Omit<Rapport, 'id' | 'created_at' | 'updated_at' | 'taches'>
): Promise<{ data: Rapport | null; error: string | null }> {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      // Obtenir l'utilisateur courant si connecté
      const { data: { user } } = await supabase.auth.getUser();

      const payload = {
        ...rapportData,
        user_id: user?.id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('rapports')
        .insert([payload])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return { data, error: null };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (
        errorMsg.includes('Could not find the table') ||
        errorMsg.includes('does not exist') ||
        errorMsg.includes('42P01')
      ) {
        const newRapport: Rapport = {
          ...rapportData,
          id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          taches: [],
        };
        const list = getLocalFallbackRapports();
        saveLocalFallbackRapports([newRapport, ...list]);
        return { data: newRapport, error: null };
      }
      return { data: null, error: errorMsg };
    }
  }

  // Fallback local
  const newRapport: Rapport = {
    ...rapportData,
    id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    taches: [],
  };
  const list = getLocalFallbackRapports();
  saveLocalFallbackRapports([newRapport, ...list]);
  return { data: newRapport, error: null };
}

// 4. MODIFICATION D'UN RAPPORT
export async function updateRapport(
  id: string,
  updates: Partial<Omit<Rapport, 'id' | 'created_at' | 'taches'>>
): Promise<{ data: Rapport | null; error: string | null }> {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const payload = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('rapports')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return { data, error: null };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return { data: null, error: errorMsg };
    }
  }

  // Fallback local
  const list = getLocalFallbackRapports();
  const index = list.findIndex((r) => r.id === id);
  if (index === -1) return { data: null, error: 'Rapport introuvable' };

  const updated: Rapport = {
    ...list[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  list[index] = updated;
  saveLocalFallbackRapports(list);
  return { data: updated, error: null };
}

// 5. SUPPRESSION D'UN RAPPORT (Cascade effectuée côté Supabase via contrainte ON DELETE CASCADE)
export async function deleteRapport(id: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { error } = await supabase
        .from('rapports')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
      return { success: true, error: null };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return { success: false, error: errorMsg };
    }
  }

  // Fallback local
  const list = getLocalFallbackRapports();
  const filtered = list.filter((r) => r.id !== id);
  saveLocalFallbackRapports(filtered);
  return { success: true, error: null };
}
