import { getSupabaseClient, testSupabaseConnection } from './supabase';

export interface DatabaseInitStatus {
  success: boolean;
  serverInitAttempted: boolean;
  serverInitResult?: any;
  clientCheck: {
    success: boolean;
    message: string;
    tableRapportsOk?: boolean;
    tableTachesOk?: boolean;
  };
}

/**
 * Initialisation automatique des tables de la base de données lors du démarrage / déploiement.
 * Cette fonction :
 * 1. Appelle le point de terminaison serverless /api/init-db (utilisé lors du déploiement Vercel)
 * 2. Vérifie et synchronise l'état des tables côté client
 */
export async function autoInitializeDatabase(): Promise<DatabaseInitStatus> {
  let serverInitAttempted = false;
  let serverInitResult: any = null;

  // 1. Tenter l'appel du point d'initialisation automatique Vercel /api/init-db
  try {
    const res = await fetch('/api/init-db', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (res.ok) {
      serverInitAttempted = true;
      serverInitResult = await res.json();
    }
  } catch {
    // Si l'environnement est purement client (preview locale sans backend), continuer en douceur
  }

  // 2. Tester l'état des tables côté client
  const clientCheck = await testSupabaseConnection();

  return {
    success: clientCheck.success || Boolean(serverInitResult?.tablesCreated),
    serverInitAttempted,
    serverInitResult,
    clientCheck,
  };
}
