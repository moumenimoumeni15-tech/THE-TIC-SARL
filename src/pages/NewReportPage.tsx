import React, { useState, useEffect } from 'react';
import {
  FilePlus2,
  Calendar,
  Save,
  CheckSquare,
  AlertCircle,
  Building2,
  Target,
  FileText,
  AlertTriangle,
  Lightbulb,
  Award,
  MessageSquare,
  ArrowLeft,
} from 'lucide-react';
import { Rapport, Tache } from '../types/database';
import { getTodayISODate } from '../utils/dateUtils';
import { createRapport, updateRapport } from '../services/reportService';
import { useNotification } from '../context/NotificationContext';
import { TaskModal } from '../components/TaskModal';
import { createTache } from '../services/taskService';

interface NewReportPageProps {
  onReportCreatedOrUpdated: () => Promise<void>;
  onNavigate: (tab: any, param?: any) => void;
  reportToEdit?: Rapport | null;
}

export const NewReportPage: React.FC<NewReportPageProps> = ({
  onReportCreatedOrUpdated,
  onNavigate,
  reportToEdit,
}) => {
  const isEditing = Boolean(reportToEdit && reportToEdit.id);

  const [dateRapport, setDateRapport] = useState<string>(getTodayISODate());
  const [titre, setTitre] = useState<string>('');
  const [lieuService, setLieuService] = useState<string>('');
  const [objectif, setObjectif] = useState<string>('');
  const [resume, setResume] = useState<string>('');
  const [difficultes, setDifficultes] = useState<string>('');
  const [solutions, setSolutions] = useState<string>('');
  const [competencesAcquises, setCompetencesAcquises] = useState<string>('');
  const [observations, setObservations] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal pour ajouter immédiatement une tâche après la création
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [newlyCreatedReportId, setNewlyCreatedReportId] = useState<string | null>(null);

  const { showNotification } = useNotification();

  useEffect(() => {
    if (reportToEdit) {
      setDateRapport(reportToEdit.date_rapport || getTodayISODate());
      setTitre(reportToEdit.titre || '');
      setLieuService(reportToEdit.lieu_service || '');
      setObjectif(reportToEdit.objectif || '');
      setResume(reportToEdit.resume || '');
      setDifficultes(reportToEdit.difficultes || '');
      setSolutions(reportToEdit.solutions || '');
      setCompetencesAcquises(reportToEdit.competences_acquises || '');
      setObservations(reportToEdit.observations || '');
    } else {
      setDateRapport(getTodayISODate());
      setTitre('');
      setLieuService('');
      setObjectif('');
      setResume('');
      setDifficultes('');
      setSolutions('');
      setCompetencesAcquises('');
      setObservations('');
    }
  }, [reportToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation des champs obligatoires
    if (!titre.trim()) {
      setErrorMessage('Le titre du rapport est obligatoire.');
      return;
    }
    if (!dateRapport) {
      setErrorMessage('La date du rapport est obligatoire.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && reportToEdit) {
        // Mise à jour sans jamais écraser les tâches
        const res = await updateRapport(reportToEdit.id, {
          titre: titre.trim(),
          date_rapport: dateRapport,
          lieu_service: lieuService.trim() || null,
          objectif: objectif.trim() || null,
          resume: resume.trim() || null,
          difficultes: difficultes.trim() || null,
          solutions: solutions.trim() || null,
          competences_acquises: competencesAcquises.trim() || null,
          observations: observations.trim() || null,
        });

        if (res.error) {
          throw new Error(res.error);
        }

        showNotification('success', 'Rapport mis à jour avec succès !');
        await onReportCreatedOrUpdated();
        onNavigate('reports', reportToEdit.id);
      } else {
        // Enregistrement du rapport
        const res = await createRapport({
          titre: titre.trim(),
          date_rapport: dateRapport,
          lieu_service: lieuService.trim() || null,
          objectif: objectif.trim() || null,
          resume: resume.trim() || null,
          difficultes: difficultes.trim() || null,
          solutions: solutions.trim() || null,
          competences_acquises: competencesAcquises.trim() || null,
          observations: observations.trim() || null,
        });

        if (res.error || !res.data) {
          throw new Error(res.error || 'Erreur lors de la création');
        }

        const newId = res.data.id;
        setNewlyCreatedReportId(newId);
        showNotification(
          'success',
          'Rapport enregistré avec succès',
          'Vous pouvez maintenant y associer des tâches.'
        );

        await onReportCreatedOrUpdated();

        // Ouvrir automatiquement le formulaire d'ajout de tâche ou proposer à l'utilisateur
        setIsTaskModalOpen(true);
      }
    } catch (err: unknown) {
      const errorStr = err instanceof Error ? err.message : String(err);
      setErrorMessage(errorStr);
      showNotification('error', 'Échec de l\'enregistrement', errorStr);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveImmediateTask = async (taskData: Partial<Tache>) => {
    try {
      const res = await createTache(
        taskData as Omit<Tache, 'id' | 'created_at' | 'updated_at' | 'rapport_titre' | 'rapport_date'>
      );
      if (res.error) throw new Error(res.error);

      showNotification('success', 'Tâche ajoutée avec succès au rapport !');
      await onReportCreatedOrUpdated();
      setIsTaskModalOpen(false);

      if (newlyCreatedReportId) {
        onNavigate('reports', newlyCreatedReportId);
      } else {
        onNavigate('reports');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showNotification('error', 'Erreur lors de l\'ajout de la tâche', msg);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => onNavigate('reports')}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Retour à la liste"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <FilePlus2 className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEditing ? 'Modifier le rapport journalier' : 'Nouveau rapport journalier'}
            </h2>
            <p className="text-xs text-slate-500">
              {isEditing
                ? 'Mettez à jour les sections du rapport sans altérer ses tâches associées'
                : 'Enregistrez votre compte-rendu journalier et vos activités'}
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs sm:text-sm font-semibold">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Formulaire principal */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
        {/* Section 1 : Informations générales */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-orange-600 uppercase tracking-wider pb-2 border-b border-orange-100 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> 1. Informations générales du rapport
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date du rapport */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Date du rapport <span className="text-orange-600">*</span>
              </label>
              <input
                type="date"
                value={dateRapport}
                onChange={(e) => setDateRapport(e.target.value)}
                required
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-900"
              />
            </div>

            {/* Titre du rapport (prend 2 colonnes) */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Titre du rapport <span className="text-orange-600">*</span>
              </label>
              <input
                type="text"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="Ex: Déploiement des correctifs de sécurité et audit réseau"
                required
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-900 font-medium"
              />
            </div>
          </div>

          {/* Lieu ou service */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              Service ou lieu de travail (facultatif)
            </label>
            <input
              type="text"
              value={lieuService}
              onChange={(e) => setLieuService(e.target.value)}
              placeholder="Ex: Direction des Systèmes d'Information (DSI) / Télétravail"
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-900"
            />
          </div>
        </div>

        {/* Section 2 : Objectifs & Résumé */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-orange-600 uppercase tracking-wider pb-2 border-b border-orange-100 flex items-center gap-2">
            <Target className="w-4 h-4" /> 2. Objectifs & Activités du jour
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-orange-500" />
              Objectif de la journée
            </label>
            <input
              type="text"
              value={objectif}
              onChange={(e) => setObjectif(e.target.value)}
              placeholder="Ex: Migrer la base PostgreSQL et sécuriser l'accès aux données sensibles"
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-orange-500" />
              Résumé général des activités
            </label>
            <textarea
              rows={4}
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="Synthèse claire des opérations effectuées, réunions tenues, livrables produits..."
              className="w-full text-xs sm:text-sm p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-900 resize-y"
            />
          </div>
        </div>

        {/* Section 3 : Difficultés & Solutions */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-orange-600 uppercase tracking-wider pb-2 border-b border-orange-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> 3. Difficultés & Solutions apportées
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                Difficultés rencontrées
              </label>
              <textarea
                rows={3}
                value={difficultes}
                onChange={(e) => setDifficultes(e.target.value)}
                placeholder="Obstacles techniques, retards, dépendances bloquantes..."
                className="w-full text-xs sm:text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-900 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-emerald-500" />
                Solutions apportées
              </label>
              <textarea
                rows={3}
                value={solutions}
                onChange={(e) => setSolutions(e.target.value)}
                placeholder="Mesures de contournement, correctifs appliqués, optimisations..."
                className="w-full text-xs sm:text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-900 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section 4 : Compétences & Observations */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-orange-600 uppercase tracking-wider pb-2 border-b border-orange-100 flex items-center gap-2">
            <Award className="w-4 h-4" /> 4. Compétences & Remarques
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-orange-500" />
              Compétences et connaissances acquises
            </label>
            <textarea
              rows={2}
              value={competencesAcquises}
              onChange={(e) => setCompetencesAcquises(e.target.value)}
              placeholder="Outils maîtrisés, protocoles testés, bonnes pratiques appliquées..."
              className="w-full text-xs sm:text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-900 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              Observations supplémentaires
            </label>
            <textarea
              rows={2}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Points à surveiller le lendemain, notes libres, suivi..."
              className="w-full text-xs sm:text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-900 resize-none"
            />
          </div>
        </div>

        {/* Bouton Enregistrer le rapport */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onNavigate('reports')}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Annuler
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 active:scale-98 text-white rounded-xl text-sm font-semibold shadow-md shadow-orange-500/20 transition-all duration-150 cursor-pointer flex items-center gap-2.5 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isEditing ? 'Mettre à jour le rapport' : 'Enregistrer le rapport'}</span>
          </button>
        </div>
      </form>

      {/* Modal pour ajouter une première tâche immédiatement après la création */}
      {isTaskModalOpen && newlyCreatedReportId && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            onNavigate('reports', newlyCreatedReportId);
          }}
          onSave={handleSaveImmediateTask}
          defaultRapportId={newlyCreatedReportId}
          rapportsList={[{ id: newlyCreatedReportId, titre, date_rapport: dateRapport } as Rapport]}
        />
      )}
    </div>
  );
};
