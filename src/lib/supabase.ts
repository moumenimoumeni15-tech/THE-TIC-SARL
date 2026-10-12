import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration de la base de données Cloud
const ENV_URL = import.meta.env.VITE_SUPABASE_URL || '';
const ENV_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Récupérer les clés depuis l'environnement ou le stockage local
export function getSupabaseCredentials(): { url: string; anonKey: string; isConfigured: boolean } {
  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('dailyreport_supabase_url') : null;
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('dailyreport_supabase_anon_key') : null;

  const url = (localUrl && localUrl.trim().length > 0) ? localUrl.trim() : (ENV_URL && ENV_URL.trim().length > 0 && !ENV_URL.includes('your-project-id')) ? ENV_URL.trim() : '';
  const anonKey = (localKey && localKey.trim().length > 0) ? localKey.trim() : (ENV_ANON_KEY && ENV_ANON_KEY.trim().length > 0 && !ENV_ANON_KEY.includes('your-anon-key')) ? ENV_ANON_KEY.trim() : '';

  const isConfigured = Boolean(url && anonKey && url.startsWith('http'));
  return { url, anonKey, isConfigured };
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseCredentials();

  if (!isConfigured) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (err) {
      console.error('Erreur lors de l\'initialisation de la base de données:', err);
      return null;
    }
  }

  return supabaseInstance;
}

export function saveSupabaseCredentials(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('dailyreport_supabase_url', url.trim());
    localStorage.setItem('dailyreport_supabase_anon_key', anonKey.trim());
    supabaseInstance = null; // Réinitialiser l'instance pour forcer la reconnexion
  }
}

export function clearSupabaseCredentials(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('dailyreport_supabase_url');
    localStorage.removeItem('dailyreport_supabase_anon_key');
    supabaseInstance = null;
  }
}

// Vérifier la connexion avec la base de données
export async function testSupabaseConnection(overrideUrl?: string, overrideKey?: string): Promise<{
  success: boolean;
  message: string;
  tableRapportsOk?: boolean;
  tableTachesOk?: boolean;
}> {
  try {
    const creds = getSupabaseCredentials();
    const url = overrideUrl || creds.url;
    const key = overrideKey || creds.anonKey;

    if (!url || !key) {
      return {
        success: false,
        message: 'URL et clé d\'accès à la base de données non renseignées.',
      };
    }

    const testClient = createClient(url, key);

    // Tester la requête sur la table rapports
    const { error: errRapports } = await testClient
      .from('rapports')
      .select('id')
      .limit(1);

    if (errRapports) {
      if (errRapports.code === '42P01' || errRapports.message?.includes('does not exist')) {
        return {
          success: false,
          message: 'Connecté au serveur de base de données, mais la table "rapports" n\'est pas encore créée. Le script d\'initialisation est disponible dans l\'onglet Paramètres.',
          tableRapportsOk: false,
          tableTachesOk: false,
        };
      }
      return {
        success: false,
        message: `Erreur de communication : ${errRapports.message} (code: ${errRapports.code || 'inconnu'})`,
      };
    }

    // Tester la table taches
    const { error: errTaches } = await testClient
      .from('taches')
      .select('id')
      .limit(1);

    if (errTaches) {
      return {
        success: false,
        message: 'Table "rapports" accessible, mais la table "taches" n\'est pas encore créée.',
        tableRapportsOk: true,
        tableTachesOk: false,
      };
    }

    return {
      success: true,
      message: 'Connexion à la base de données réussie ! Les tables "rapports" et "taches" sont prêtes.',
      tableRapportsOk: true,
      tableTachesOk: true,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Erreur inattendue de connexion : ${errorMsg}`,
    };
  }
}
