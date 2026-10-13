import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Database,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  X,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { testSupabaseConnection, DatabaseDiagnostics, getSupabaseCredentials } from '../lib/supabase';

export const DatabaseStatusBanner: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<DatabaseDiagnostics | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const diag = await testSupabaseConnection();
      setDiagnostics(diag);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const creds = getSupabaseCredentials();
      setDiagnostics({
        success: false,
        status: 'network_error',
        url: creds.url,
        message: msg,
        rawError: msg,
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const copySqlToClipboard = async () => {
    try {
      // Charger le contenu de schema.sql ou fournir le schéma complet
      const sqlContent = `-- Schéma de création des tables THE TIC MANAGER
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

ALTER TABLE public.rapports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taches ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS rapports_all_access ON public.rapports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS taches_all_access ON public.taches FOR ALL USING (true) WITH CHECK (true);
`;
      await navigator.clipboard.writeText(sqlContent);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    } catch {
      // Fallback
    }
  };

  if (!diagnostics || diagnostics.success || isDismissed) {
    return null;
  }

  const isMissingTables = diagnostics.status === 'missing_tables';
  const isAuthError = diagnostics.status === 'auth_error';

  return (
    <>
      {/* Bandeau d'alerte */}
      <div
        className={`w-full px-4 py-2.5 text-xs sm:text-sm font-medium border-b flex items-center justify-between gap-3 shadow-xs transition-colors ${
          isMissingTables
            ? 'bg-amber-50 text-amber-900 border-amber-200'
            : isAuthError
            ? 'bg-rose-50 text-rose-900 border-rose-200'
            : 'bg-orange-50 text-orange-900 border-orange-200'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <AlertTriangle
            className={`w-4 h-4 shrink-0 ${
              isMissingTables
                ? 'text-amber-600'
                : isAuthError
                ? 'text-rose-600'
                : 'text-orange-600'
            }`}
          />
          <p className="truncate">
            <span className="font-bold">Base de données : </span>
            {diagnostics.message}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all flex items-center gap-1 cursor-pointer"
          >
            <span>Détails & Solution</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
            title="Masquer le bandeau"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modal de diagnostic détaillé */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2.5 rounded-xl ${
                    isMissingTables ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Diagnostic Connexion Base de Données
                  </h3>
                  <p className="text-xs text-slate-500">
                    État de synchronisation avec le serveur Cloud
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Diagnostic boxes */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">URL du serveur :</span>
                <span className="font-mono font-semibold text-slate-800 truncate max-w-[260px]">
                  {diagnostics.url || 'Non configurée'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Statut de la table "rapports" :</span>
                <span
                  className={`inline-flex items-center gap-1 font-semibold ${
                    diagnostics.tableRapportsOk ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {diagnostics.tableRapportsOk ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Prête
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" /> Non trouvée
                    </>
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Statut de la table "taches" :</span>
                <span
                  className={`inline-flex items-center gap-1 font-semibold ${
                    diagnostics.tableTachesOk ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {diagnostics.tableTachesOk ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Prête
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" /> Non trouvée
                    </>
                  )}
                </span>
              </div>
              {diagnostics.rawError && (
                <div className="pt-2 text-slate-600 border-t border-slate-200/60 font-mono text-[11px] bg-white p-2 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-700">Erreur retournée : </span>
                  {diagnostics.rawError}
                </div>
              )}
            </div>

            {/* Instructions pour résoudre */}
            {isMissingTables && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-2.5 text-xs text-amber-900">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <span>🛠️ Comment créer les tables en 1 minute :</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 pl-1 text-amber-900/90 leading-relaxed">
                  <li>
                    Ouvrez votre tableau de bord Supabase :{' '}
                    <a
                      href="https://supabase.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold underline hover:text-amber-950"
                    >
                      dashboard Supabase <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>Allez dans le menu de gauche sur <strong>"SQL Editor"</strong>.</li>
                  <li>Cliquez sur <strong>"New query"</strong>, collez le script SQL ci-dessous et cliquez sur <strong>"Run"</strong>.</li>
                </ol>

                <div className="pt-1">
                  <button
                    onClick={copySqlToClipboard}
                    className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Script SQL copié dans le presse-papier !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copier le script SQL (schema.sql)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Fermer
              </button>

              <button
                onClick={checkConnection}
                disabled={isChecking}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                <span>{isChecking ? 'Test en cours...' : 'Tester à nouveau la connexion'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
