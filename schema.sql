-- ==============================================================================
-- THE TIC MANAGER — POSTGRESQL SCHEMA
-- ==============================================================================
-- Exécutez ce script dans l'éditeur SQL de votre serveur de base de données.
-- Ce script configure les extensions, les tables 'rapports' et 'taches',
-- les contraintes, les index de performance et les politiques de sécurité (RLS).
-- ==============================================================================

-- 1. Activer l'extension pgcrypto pour les UUID si ce n'est pas déjà fait
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Fonction de mise à jour automatique de la colonne updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Table des RAPPORTS
CREATE TABLE IF NOT EXISTS public.rapports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Index pour accélérer les recherches sur les rapports
CREATE INDEX IF NOT EXISTS idx_rapports_date ON public.rapports(date_rapport DESC);
CREATE INDEX IF NOT EXISTS idx_rapports_user ON public.rapports(user_id);
CREATE INDEX IF NOT EXISTS idx_rapports_created_at ON public.rapports(created_at DESC);

-- Trigger pour la mise à jour automatique de updated_at sur rapports
DROP TRIGGER IF EXISTS trigger_rapports_updated_at ON public.rapports;
CREATE TRIGGER trigger_rapports_updated_at
    BEFORE UPDATE ON public.rapports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Table des TÂCHES
CREATE TABLE IF NOT EXISTS public.taches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rapport_id UUID NOT NULL REFERENCES public.rapports(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    intitule TEXT NOT NULL,
    description TEXT,
    categorie TEXT DEFAULT 'Développement web',
    date_realisation DATE NOT NULL DEFAULT CURRENT_DATE,
    heure_debut TIME,
    heure_fin TIME,
    statut TEXT NOT NULL DEFAULT 'À faire' CHECK (statut IN ('À faire', 'En cours', 'Terminée', 'Bloquée')),
    priorite TEXT NOT NULL DEFAULT 'Normale' CHECK (priorite IN ('Faible', 'Normale', 'Élevée', 'Urgente')),
    resultat TEXT,
    difficultes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour accélérer les recherches et filtres sur les tâches
CREATE INDEX IF NOT EXISTS idx_taches_rapport_id ON public.taches(rapport_id);
CREATE INDEX IF NOT EXISTS idx_taches_statut ON public.taches(statut);
CREATE INDEX IF NOT EXISTS idx_taches_categorie ON public.taches(categorie);
CREATE INDEX IF NOT EXISTS idx_taches_date_realisation ON public.taches(date_realisation DESC);
CREATE INDEX IF NOT EXISTS idx_taches_user ON public.taches(user_id);

-- Trigger pour la mise à jour automatique de updated_at sur taches
DROP TRIGGER IF EXISTS trigger_taches_updated_at ON public.taches;
CREATE TRIGGER trigger_taches_updated_at
    BEFORE UPDATE ON public.taches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- Activation de RLS sur les deux tables
ALTER TABLE public.rapports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taches ENABLE ROW LEVEL SECURITY;

-- Politiques pour la table RAPPORTS :
-- Permet l'accès complet si l'utilisateur est connecté et propriétaire,
-- ou pour les applications avec mode invité/partagé si user_id IS NULL.
DROP POLICY IF EXISTS "Rapports: lecture pour tous autorisés" ON public.rapports;
CREATE POLICY "Rapports: lecture pour tous autorisés"
    ON public.rapports FOR SELECT
    USING (
        auth.uid() IS NULL 
        OR user_id IS NULL 
        OR auth.uid() = user_id
    );

DROP POLICY IF EXISTS "Rapports: insertion" ON public.rapports;
CREATE POLICY "Rapports: insertion"
    ON public.rapports FOR INSERT
    WITH CHECK (
        auth.uid() IS NULL 
        OR user_id IS NULL 
        OR auth.uid() = user_id
    );

DROP POLICY IF EXISTS "Rapports: mise à jour" ON public.rapports;
CREATE POLICY "Rapports: mise à jour"
    ON public.rapports FOR UPDATE
    USING (
        auth.uid() IS NULL 
        OR user_id IS NULL 
        OR auth.uid() = user_id
    )
    WITH CHECK (
        auth.uid() IS NULL 
        OR user_id IS NULL 
        OR auth.uid() = user_id
    );

DROP POLICY IF EXISTS "Rapports: suppression" ON public.rapports;
CREATE POLICY "Rapports: suppression"
    ON public.rapports FOR DELETE
    USING (
        auth.uid() IS NULL 
        OR user_id IS NULL 
        OR auth.uid() = user_id
    );

-- Politiques pour la table TÂCHES :
DROP POLICY IF EXISTS "Taches: lecture pour tous autorisés" ON public.taches;
CREATE POLICY "Taches: lecture pour tous autorisés"
    ON public.taches FOR SELECT
    USING (
        auth.uid() IS NULL 
        OR user_id IS NULL 
        OR auth.uid() = user_id
    );

DROP POLICY IF EXISTS "Taches: insertion" ON public.taches;
CREATE POLICY "Taches: insertion"
    ON public.taches FOR INSERT
    WITH CHECK (
        auth.uid() IS NULL 
        OR user_id IS NULL 
        OR auth.uid() = user_id
    );

DROP POLICY IF EXISTS "Taches: mise à jour" ON public.taches;
CREATE POLICY "Taches: mise à jour"
    ON public.taches FOR UPDATE
    USING (
        auth.uid() IS NULL 
        OR user_id IS NULL 
        OR auth.uid() = user_id
    )
    WITH CHECK (
        auth.uid() IS NULL 
        OR user_id IS NULL 
        OR auth.uid() = user_id
    );

DROP POLICY IF EXISTS "Taches: suppression" ON public.taches;
CREATE POLICY "Taches: suppression"
    ON public.taches FOR DELETE
    USING (
        auth.uid() IS NULL 
        OR user_id IS NULL 
        OR auth.uid() = user_id
    );

-- ==============================================================================
-- FIN DU SCRIPT. Vos tables 'rapports' et 'taches' sont prêtes et sécurisées !
-- ==============================================================================
