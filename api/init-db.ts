import type { IncomingMessage, ServerResponse } from 'http';
import { Pool } from 'pg';

// Schéma SQL d'initialisation automatique des tables
const INIT_SQL = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.rapports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    date_rapport DATE NOT NULL DEFAULT CURRENT_DATE,
    titre TEXT NOT NULL,
    lieu_service TEXT,
    objectif TEXT,
    resume TEXT,
    difficultes TEXT,
    solutions TEXT,
    competences_acquises TEXT,
    observations TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.taches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rapport_id UUID NOT NULL REFERENCES public.rapports(id) ON DELETE CASCADE,
    user_id UUID,
    intitule TEXT NOT NULL,
    description TEXT,
    categorie TEXT DEFAULT 'Développement web',
    date_realisation DATE NOT NULL DEFAULT CURRENT_DATE,
    heure_debut TIME,
    heure_fin TIME,
    statut TEXT NOT NULL DEFAULT 'À faire',
    priorite TEXT NOT NULL DEFAULT 'Normale',
    resultat TEXT,
    difficultes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rapports_date ON public.rapports(date_rapport DESC);
CREATE INDEX IF NOT EXISTS idx_rapports_created_at ON public.rapports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_taches_rapport_id ON public.taches(rapport_id);
CREATE INDEX IF NOT EXISTS idx_taches_statut ON public.taches(statut);
CREATE INDEX IF NOT EXISTS idx_taches_date_realisation ON public.taches(date_realisation DESC);

ALTER TABLE public.rapports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taches ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'rapports' AND policyname = 'rapports_all_access'
    ) THEN
        CREATE POLICY rapports_all_access ON public.rapports FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'taches' AND policyname = 'taches_all_access'
    ) THEN
        CREATE POLICY taches_all_access ON public.taches FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;
`;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Configurer les en-têtes CORS et JSON
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  const connectionString =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.SUPABASE_DB_URL;

  if (!connectionString) {
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        success: true,
        tablesCreated: false,
        message:
          'Prêt pour le déploiement Vercel. Aucune chaîne POSTGRES_URL détectée directement, les tables utilisent le schéma client et local.',
      })
    );
    return;
  }

  try {
    const pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      connectionTimeoutMillis: 5000,
    });

    await pool.query(INIT_SQL);
    await pool.end();

    res.statusCode = 200;
    res.end(
      JSON.stringify({
        success: true,
        tablesCreated: true,
        message: 'Les tables "rapports" et "taches" ont été créées ou vérifiées avec succès dans PostgreSQL !',
      })
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Erreur initialisation DB:', errorMsg);

    res.statusCode = 200;
    res.end(
      JSON.stringify({
        success: false,
        error: errorMsg,
        message: `Erreur lors de la création automatique des tables : ${errorMsg}`,
      })
    );
  }
}
