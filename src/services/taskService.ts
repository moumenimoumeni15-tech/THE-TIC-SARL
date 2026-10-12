import { getSupabaseClient } from '../lib/supabase';
import { Tache, StatutTache } from '../types/database';

const LOCAL_STORAGE_KEY_TACHES = 'dailyreport_fallback_taches';

function getLocalFallbackTaches(): Tache[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_TACHES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalFallbackTaches(data: Tache[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_KEY_TACHES, JSON.stringify(data));
}

// 1. LECTURE DE TOUTES LES TÂCHES (avec informations sur le rapport associé)
export async function getAllTaches(): Promise<{ data: Tache[]; error: string | null; isSupabase: boolean }> {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      // Jointure avec rapports pour récupérer le titre et la date du rapport
      const { data, error } = await supabase
        .from('taches')
        .select(`
          *,
          rapports (
            titre,
            date_rapport
          )
        `)
        .order('date_realisation', { ascending: false });

      if (error) throw new Error(error.message);

      // Formater la réponse pour inclure rapport_titre et rapport_date
      const formattedTasks: Tache[] = (data || []).map((item) => {
        const rapportInfo = item.rapports as { titre?: string; date_rapport?: string } | null;
        return {
          id: item.id,
          rapport_id: item.rapport_id,
          user_id: item.user_id,
          intitule: item.intitule,
          description: item.description,
          categorie: item.categorie,
          date_realisation: item.date_realisation,
          heure_debut: item.heure_debut,
          heure_fin: item.heure_fin,
          statut: item.statut,
          priorite: item.priorite,
          resultat: item.resultat,
          difficultes: item.difficultes,
          created_at: item.created_at,
          updated_at: item.updated_at,
          rapport_titre: rapportInfo?.titre || 'Rapport sans titre',
          rapport_date: rapportInfo?.date_rapport || '',
        };
      });

      return { data: formattedTasks, error: null, isSupabase: true };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn('Erreur lors de la récupération des tâches:', errorMsg);
      return { data: [], error: errorMsg, isSupabase: true };
    }
  }

  // Fallback local
  const localTasks = getLocalFallbackTaches();
  return { data: localTasks, error: null, isSupabase: false };
}

// 2. CRÉATION D'UNE TÂCHE
export async function createTache(
  tacheData: Omit<Tache, 'id' | 'created_at' | 'updated_at' | 'rapport_titre' | 'rapport_date'>
): Promise<{ data: Tache | null; error: string | null }> {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const payload = {
        ...tacheData,
        user_id: user?.id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('taches')
        .insert([payload])
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
  const newTache: Tache = {
    ...tacheData,
    id: `local-task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const list = getLocalFallbackTaches();
  saveLocalFallbackTaches([newTache, ...list]);
  return { data: newTache, error: null };
}

// 3. MODIFICATION D'UNE TÂCHE
export async function updateTache(
  id: string,
  updates: Partial<Omit<Tache, 'id' | 'created_at' | 'rapport_titre' | 'rapport_date'>>
): Promise<{ data: Tache | null; error: string | null }> {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const payload = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('taches')
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
  const list = getLocalFallbackTaches();
  const index = list.findIndex((t) => t.id === id);
  if (index === -1) return { data: null, error: 'Tâche introuvable' };

  const updated: Tache = {
    ...list[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  list[index] = updated;
  saveLocalFallbackTaches(list);
  return { data: updated, error: null };
}

// 4. CHANGEMENT RAPIDE DU STATUT D'UNE TÂCHE
export async function updateTacheStatut(
  id: string,
  statut: StatutTache
): Promise<{ data: Tache | null; error: string | null }> {
  return updateTache(id, { statut });
}

// 5. SUPPRESSION D'UNE TÂCHE
export async function deleteTache(id: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { error } = await supabase
        .from('taches')
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
  const list = getLocalFallbackTaches();
  const filtered = list.filter((t) => t.id !== id);
  saveLocalFallbackTaches(filtered);
  return { success: true, error: null };
}
