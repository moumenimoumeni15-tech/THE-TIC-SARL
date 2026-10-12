import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  Key,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  FolderPlus,
  ShieldCheck,
  Code2,
  Play,
  Server,
} from 'lucide-react';
import {
  getSupabaseCredentials,
  saveSupabaseCredentials,
  clearSupabaseCredentials,
  testSupabaseConnection,
} from '../lib/supabase';
import { autoInitializeDatabase } from '../lib/databaseInit';
import { seedInitialData } from '../services/seedService';
import { useNotification } from '../context/NotificationContext';

const SQL_SCHEMA_CONTENT = `-- ==============================================================================
-- THE TIC MANAGER — STRUCTURE POSTGRESQL (CRÉATION AUTOMATIQUE)
-- ==============================================================================

-- 1. Extension pour les UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Trigger automatique updated_at
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

CREATE INDEX IF NOT EXISTS idx_rapports_date ON public.rapports(date_rapport DESC);
CREATE INDEX IF NOT EXISTS idx_rapports_user ON public.rapports(user_id);
CREATE INDEX IF NOT EXISTS idx_rapports_created_at ON public.rapports(created_at DESC);

DROP TRIGGER IF EXISTS trigger_rapports_updated_at ON public.rapports;
CREATE TRIGGER trigger_rapports_updated_at
    BEFORE UPDATE ON public.rapports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Table des TÂCHES (Suppression en cascade sur rapports)
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
    statut TEXT NOT NULL DEFAULT 'À faire' CHECK (statut IN ('À faire', 'En cours', 'Terminée', 'Bloquée')),
    priorite TEXT NOT NULL DEFAULT 'Normale' CHECK (priorite IN ('Faible', 'Normale', 'Élevée', 'Urgente')),
    resultat TEXT,
    difficultes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_taches_rapport_id ON public.taches(rapport_id);
CREATE INDEX IF NOT EXISTS idx_taches_statut ON public.taches(statut);
CREATE INDEX IF NOT EXISTS idx_taches_categorie ON public.taches(categorie);
CREATE INDEX IF NOT EXISTS idx_taches_date_realisation ON public.taches(date_realisation DESC);

DROP TRIGGER IF EXISTS trigger_taches_updated_at ON public.taches;
CREATE TRIGGER trigger_taches_updated_at
    BEFORE UPDATE ON public.taches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Row Level Security (RLS)
ALTER TABLE public.rapports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taches ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rapports' AND policyname = 'rapports_all_access') THEN
        CREATE POLICY rapports_all_access ON public.rapports FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'taches' AND policyname = 'taches_all_access') THEN
        CREATE POLICY taches_all_access ON public.taches FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;`;

interface SettingsPageProps {
  onRefreshData: () => Promise<void>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onRefreshData }) => {
  const [supabaseUrl, setSupabaseUrl] = useState<string>('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState<string>('');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isAutoInitializing, setIsAutoInitializing] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    tableRapportsOk?: boolean;
    tableTachesOk?: boolean;
  } | null>(null);

  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);

  const { showNotification } = useNotification();

  useEffect(() => {
    const creds = getSupabaseCredentials();
    setSupabaseUrl(creds.url);
    setSupabaseAnonKey(creds.anonKey);
    if (creds.isConfigured) {
      testSupabaseConnection().then(setTestResult);
    }
  }, []);

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await testSupabaseConnection(supabaseUrl, supabaseAnonKey);
      setTestResult(res);

      if (res.success) {
        saveSupabaseCredentials(supabaseUrl, supabaseAnonKey);
        showNotification('success', 'Connexion réussie', 'Configuration enregistrée dans l\'application !');
        await onRefreshData();
      } else {
        showNotification('error', 'Échec de connexion', res.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestResult({ success: false, message: msg });
      showNotification('error', 'Erreur', msg);
    } finally {
      setIsTesting(false);
    }
  };

  const handleAutoInitTables = async () => {
    setIsAutoInitializing(true);
    try {
      const result = await autoInitializeDatabase();
      if (result.success) {
        showNotification(
          'success',
          'Tables prêtes',
          'Les tables de base de données ont été vérifiées et sont opérationnelles !'
        );
        const check = await testSupabaseConnection();
        setTestResult(check);
        await onRefreshData();
      } else {
        showNotification(
          'info',
          'Vérification des tables',
          result.clientCheck.message || 'Exécutez le script SQL ci-dessous dans votre console de base de données.'
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showNotification('error', 'Information', msg);
    } finally {
      setIsAutoInitializing(false);
    }
  };

  const handleReset = () => {
    clearSupabaseCredentials();
    setSupabaseUrl('');
    setSupabaseAnonKey('');
    setTestResult(null);
    showNotification('info', 'Réinitialisation', 'Paramètres locaux effacés.');
    onRefreshData();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_CONTENT);
    setCopiedSql(true);
    showNotification('success', 'Copié dans le presse-papiers', 'Collez ce script dans l\'éditeur SQL de votre serveur.');
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const res = await seedInitialData();
      if (res.success) {
        showNotification('success', 'Données créées', res.message);
        await onRefreshData();
      } else {
        showNotification('error', 'Erreur d\'injection', res.message);
      }
    } catch (err: unknown) {
      showNotification('error', 'Erreur', String(err));
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <Settings className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Paramètres & Base de Données
            </h2>
            <p className="text-xs text-slate-500">
              Configuration de la base de données PostgreSQL, statut des tables et déploiement
            </p>
          </div>
        </div>
      </div>

      {/* État de connexion actuel */}
      {testResult && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
            testResult.success
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-rose-50/70 border-rose-200 text-rose-900'
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <h4 className="text-sm font-bold">
              {testResult.success ? 'La base de données est connectée et opérationnelle' : 'Connexion à la base de données non établie'}
            </h4>
            <p className="text-xs mt-0.5 leading-relaxed">{testResult.message}</p>
            {testResult.success && (
              <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-emerald-200 font-semibold text-emerald-700">
                  <Check className="w-3.5 h-3.5" /> Table `rapports` active
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-emerald-200 font-semibold text-emerald-700">
                  <Check className="w-3.5 h-3.5" /> Table `taches` active
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-emerald-200 font-semibold text-emerald-700">
                  <ShieldCheck className="w-3.5 h-3.5" /> Sécurité active
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Carte d'initialisation automatique des tables */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Server className="w-4 h-4 text-orange-500" />
            Création automatique des tables
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
            Prêt pour le déploiement sur Vercel. Les tables sont automatiquement initialisées et vérifiées. Vous pouvez également déclencher manuellement la synchronisation.
          </p>
        </div>

        <button
          onClick={handleAutoInitTables}
          disabled={isAutoInitializing}
          className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-98 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer flex items-center gap-2 disabled:opacity-50"
        >
          {isAutoInitializing ? (
            <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span>Initialiser les tables</span>
        </button>
      </div>

      {/* Formulaire de configuration des clés de base de données */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
        <div className="pb-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-orange-500" />
            Identifiants du Serveur de Base de Données
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Renseignez l'URL et la clé d'accès publique de votre serveur pour activer la persistance cloud
          </p>
        </div>

        <form onSubmit={handleTestAndSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              URL du serveur (<code className="font-mono text-orange-600">VITE_SUPABASE_URL</code>)
            </label>
            <input
              type="url"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://votre-projet.domaine.co"
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-900 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Clé d'accès publique (<code className="font-mono text-orange-600">VITE_SUPABASE_ANON_KEY</code>)
            </label>
            <input
              type="password"
              value={supabaseAnonKey}
              onChange={(e) => setSupabaseAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-900 font-mono"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Utilisez la clé publique pour garantir la sécurité dans le navigateur.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Effacer les identifiants
            </button>

            <button
              type="submit"
              disabled={isTesting}
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {isTesting ? (
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>Tester et Enregistrer</span>
            </button>
          </div>
        </form>
      </div>

      {/* Injection de données d'exemple */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-orange-500" />
            Jeu de données de démonstration
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Insère automatiquement 4 rapports complets et 12 tâches avec différents statuts pour tester immédiatement les graphiques
          </p>
        </div>

        <button
          onClick={handleSeed}
          disabled={isSeeding}
          className="px-4 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-xl text-xs font-semibold shadow-2xs transition-colors shrink-0 cursor-pointer flex items-center gap-2 disabled:opacity-50"
        >
          {isSeeding ? (
            <span className="w-3.5 h-3.5 border-2 border-orange-500/40 border-t-orange-600 rounded-full animate-spin" />
          ) : (
            <FolderPlus className="w-4 h-4" />
          )}
          <span>Générer les rapports de test</span>
        </button>
      </div>

      {/* Script SQL complet à copier */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-orange-500" />
              Script SQL PostgreSQL (<code className="font-mono text-xs text-slate-600">schema.sql</code>)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Script complet avec contraintes d'intégrité, index de performance et triggers automatiques.
            </p>
          </div>

          <button
            onClick={handleCopySql}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors shrink-0 cursor-pointer"
          >
            {copiedSql ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Copié !</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-600" />
                <span>Copier le script SQL</span>
              </>
            )}
          </button>
        </div>

        <div className="relative">
          <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto max-h-72 leading-relaxed border border-slate-800">
            {SQL_SCHEMA_CONTENT}
          </pre>
        </div>
      </div>
    </div>
  );
};
