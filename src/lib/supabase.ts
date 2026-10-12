import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration de la base de données Cloud
const ENV_URL = import.meta.env.VITE_SUPABASE_URL || '';
const ENV_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Identifiants par défaut du projet Supabase de l'application
const DEFAULT_URL = 'https://xcghmecugjdyorsibtno.supabase.co';
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjZ2htZWN1Z2pkeW9yc2lidG5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3OTU2NzksImV4cCI6MjEwNzM3MTY3OX0.U2pK6ono0ne6TcKkd5BwKmGoJTpQpXzuX12cu_N_O2c';

/**
 * Nettoie et normalise l'URL du projet Supabase.
 * Supprime les éventuels "/rest/v1" ou slashes superflus qui causent des erreurs 404.
 */
export function sanitizeSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  url = url.replace(/\/+$/, '');
  url = url.replace(/\/rest\/v1\/?$/i, '');
  return url;
}

// Récupérer les clés depuis l'environnement, le stockage local ou les valeurs par défaut
export function getSupabaseCredentials(): { url: string; anonKey: string; isConfigured: boolean } {
  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('dailyreport_supabase_url') : null;
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('dailyreport_supabase_anon_key') : null;

  let url = '';
  if (localUrl && localUrl.trim().length > 0) {
    url = sanitizeSupabaseUrl(localUrl);
  } else if (ENV_URL && ENV_URL.trim().length > 0 && !ENV_URL.includes('your-project-id')) {
    url = sanitizeSupabaseUrl(ENV_URL);
  } else {
    url = DEFAULT_URL;
  }

  let anonKey = '';
  if (localKey && localKey.trim().length > 0) {
    anonKey = localKey.trim();
  } else if (ENV_ANON_KEY && ENV_ANON_KEY.trim().length > 0 && !ENV_ANON_KEY.includes('your-anon-key')) {
    anonKey = ENV_ANON_KEY.trim();
  } else {
    anonKey = DEFAULT_ANON_KEY;
  }

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
