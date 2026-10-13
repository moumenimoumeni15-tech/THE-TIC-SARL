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

export interface DatabaseDiagnostics {
  success: boolean;
  status: 'connected' | 'missing_tables' | 'auth_error' | 'network_error' | 'not_configured';
  message: string;
  url: string;
  tableRapportsOk?: boolean;
  tableTachesOk?: boolean;
  rawError?: string;
}

// Vérifier la connexion avec la base de données
export async function testSupabaseConnection(overrideUrl?: string, overrideKey?: string): Promise<DatabaseDiagnostics> {
  try {
    const creds = getSupabaseCredentials();
    const url = overrideUrl ? sanitizeSupabaseUrl(overrideUrl) : creds.url;
    const key = overrideKey ? overrideKey.trim() : creds.anonKey;

    if (!url || !key) {
      return {
        success: false,
        status: 'not_configured',
        url: url || '',
        message: 'URL ou clé d\'accès au serveur non renseignée.',
      };
    }

    const testClient = createClient(url, key);

    // Tester la requête sur la table rapports
    const { error: errRapports } = await testClient
      .from('rapports')
      .select('id')
      .limit(1);

    if (errRapports) {
      const errMsg = errRapports.message || '';
      const isMissingTable =
        errRapports.code === '42P01' ||
        errMsg.includes('does not exist') ||
        errMsg.includes('Could not find the table') ||
        errMsg.includes('schema cache');

      const isAuthError =
        errRapports.code === 'PGRST301' ||
        errMsg.toLowerCase().includes('jwt') ||
        errMsg.toLowerCase().includes('apikey') ||
        errMsg.toLowerCase().includes('unauthorized') ||
        errMsg.toLowerCase().includes('permission denied');

      if (isMissingTable) {
        return {
          success: false,
          status: 'missing_tables',
          url,
          message: 'Serveur connecté, mais la table "rapports" n\'est pas encore créée dans la base de données.',
          tableRapportsOk: false,
          tableTachesOk: false,
          rawError: errMsg,
        };
      }

      if (isAuthError) {
        return {
          success: false,
          status: 'auth_error',
          url,
          message: `Échec d'authentification : Clé d'accès refusée par le serveur (${errMsg})`,
          tableRapportsOk: false,
          tableTachesOk: false,
          rawError: errMsg,
        };
      }

      return {
        success: false,
        status: 'network_error',
        url,
        message: `Erreur de communication : ${errMsg} (code: ${errRapports.code || 'inconnu'})`,
        tableRapportsOk: false,
        tableTachesOk: false,
        rawError: errMsg,
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
        status: 'missing_tables',
        url,
        message: 'Table "rapports" accessible, mais la table "taches" n\'est pas encore créée.',
        tableRapportsOk: true,
        tableTachesOk: false,
        rawError: errTaches.message,
      };
    }

    return {
      success: true,
      status: 'connected',
      url,
      message: 'Connexion à la base de données réussie ! Les tables "rapports" et "taches" sont prêtes.',
      tableRapportsOk: true,
      tableTachesOk: true,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const creds = getSupabaseCredentials();
    return {
      success: false,
      status: 'network_error',
      url: creds.url,
      message: `Erreur inattendue de connexion : ${errorMsg}`,
      rawError: errorMsg,
    };
  }
}
