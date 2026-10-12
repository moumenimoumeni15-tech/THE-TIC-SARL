import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Building2,
  Edit2,
  Plus,
  Printer,
  FileDown,
  Target,
  FileText,
  AlertTriangle,
  Lightbulb,
  Award,
  MessageSquare,
  CheckSquare,
  Clock,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { Rapport, Tache, STATUTS_CONFIG, PRIORITES_CONFIG, StatutTache } from '../types/database';
import { formatDateFrench, formatDateShort, formatTime } from '../utils/dateUtils';
import { exportRapportToPDF, printCurrentReport } from '../utils/pdfExport';
import { TaskModal } from '../components/TaskModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { createTache, updateTache, updateTacheStatut, deleteTache } from '../services/taskService';
import { useNotification } from '../context/NotificationContext';

interface ReportDetailPageProps {
  reportId: string;
  rapports: Rapport[];
  taches: Tache[];
  onNavigate: (tab: any, param?: any) => void;
  onRefreshData: () => Promise<void>;
}

export const ReportDetailPage: React.FC<ReportDetailPageProps> = ({
  reportId,
  rapports,
  taches,
  onNavigate,
  onRefreshData,
}) => {
  const currentReport = rapports.find((r) => r.id === reportId);
  const reportTasks = taches.filter((t) => t.rapport_id === reportId);

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [taskToEdit, setTaskToEdit] = useState<Tache | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Tache | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState<boolean>(false);

  const { showNotification } = useNotification();

  if (!currentReport) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
        <h3 className="text-base font-bold text-slate-800">Rapport introuvable</h3>
        <p className="text-xs text-slate-500 mt-1">
          Ce rapport n'existe plus ou a été supprimé.
        </p>
        <button
          onClick={() => onNavigate('reports')}
          className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-semibold"
        >
          Retour aux rapports
        </button>
      </div>
    );
  }

  // Changer rapidement le statut d'une tâche
  const handleToggleStatus = async (task: Tache, newStatus: StatutTache) => {
    try {
      const res = await updateTacheStatut(task.id, newStatus);
      if (res.error) throw new Error(res.error);
      showNotification('success', 'Statut mis à jour', `La tâche est désormais « ${newStatus} »`);
      await onRefreshData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showNotification('error', 'Erreur de mise à jour', msg);
    }
  };

  // Enregistrer ou modifier une tâche
  const handleSaveTask = async (taskData: Partial<Tache>, isEditing: boolean) => {
    try {
      if (isEditing && taskToEdit) {
        const res = await updateTache(taskToEdit.id, taskData);
        if (res.error) throw new Error(res.error);
        showNotification('success', 'Tâche mise à jour avec succès');
      } else {
        const res = await createTache(
          taskData as Omit<Tache, 'id' | 'created_at' | 'updated_at' | 'rapport_titre' | 'rapport_date'>
        );
        if (res.error) throw new Error(res.error);
        showNotification('success', 'Tâche ajoutée au rapport');
      }
      await onRefreshData();
      setIsTaskModalOpen(false);
      setTaskToEdit(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showNotification('error', 'Erreur lors de l\'enregistrement', msg);
    }
  };

  // Suppression d'une tâche
  const handleConfirmDeleteTask = async () => {
    if (!taskToDelete) return;
    setIsDeletingTask(true);
    try {
      const res = await deleteTache(taskToDelete.id);
      if (res.error) throw new Error(res.error);
      showNotification('success', 'Tâche supprimée avec succès');
      await onRefreshData();
      setTaskToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showNotification('error', 'Erreur de suppression', msg);
    } finally {
      setIsDeletingTask(false);
    }
  };

  const handleExportPDF = () => {
    const fullReport: Rapport = {
      ...currentReport,
      taches: reportTasks,
    };
    exportRapportToPDF(fullReport);
    showNotification('success', 'PDF généré', 'Téléchargement du document en cours...');
  };

  return (
    <div className="space-y-6">
      {/* Action Header bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('reports')}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Retour à la liste"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider">
              Fiche détaillée du rapport
            </span>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">
              {currentReport.titre}
            </h2>
          </div>
        </div>

        {/* Buttons: Modifier, Ajouter une tâche, Imprimer, Exporter en PDF */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => onNavigate('new-report', currentReport)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            <Edit2 className="w-4 h-4 text-slate-500" />
            <span>Modifier</span>
          </button>

          <button
            onClick={() => {
              setTaskToEdit(null);
              setIsTaskModalOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Ajouter une tâche</span>
          </button>

          <button
            onClick={printCurrentReport}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            title="Imprimer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Imprimer</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            title="Exporter en PDF"
          >
            <FileDown className="w-4 h-4" />
            <span>Exporter en PDF</span>
          </button>
        </div>
      </div>

      {/* Dossier du rapport (Printable layout with clean orange brand) */}
      <div id="printable-report" className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
        {/* Banner header */}
        <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-md bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wider">
                Rapport Journalier
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ID: {currentReport.id.substring(0, 8)}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {currentReport.titre}
            </h1>
            {currentReport.lieu_service && (
              <p className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 font-medium mt-1">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>{currentReport.lieu_service}</span>
              </p>
            )}
          </div>

          <div className="bg-orange-50/80 border border-orange-200/70 p-3.5 rounded-2xl sm:text-right shrink-0">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider block">
              Date du rapport
            </span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900 block mt-0.5">
              {formatDateFrench(currentReport.date_rapport)}
            </span>
          </div>
        </div>

        {/* 1. Objectif du jour */}
        {currentReport.objectif && (
          <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-100">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-700 uppercase tracking-wider mb-1.5">
              <Target className="w-4 h-4" />
              <span>Objectif de la journée</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
              {currentReport.objectif}
            </p>
          </div>
        )}

        {/* 2. Résumé général des activités */}
        {currentReport.resume && (
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              <FileText className="w-4 h-4 text-orange-500" />
              <span>Résumé général des activités</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
              {currentReport.resume}
            </div>
          </div>
        )}

        {/* 3. Tâches associées */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <CheckSquare className="w-4 h-4 text-orange-500" />
              <span>Tâches associées ({reportTasks.length})</span>
            </div>
            <button
              onClick={() => {
                setTaskToEdit(null);
                setIsTaskModalOpen(true);
              }}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 print:hidden"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter une tâche</span>
            </button>
          </div>

          {reportTasks.length === 0 ? (
            <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
              <p className="text-xs text-slate-500 font-medium">
                Aucune tâche n'a encore été rattachée à ce rapport.
              </p>
              <button
                onClick={() => {
                  setTaskToEdit(null);
                  setIsTaskModalOpen(true);
                }}
                className="mt-2.5 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-semibold shadow-2xs"
              >
                Ajouter la première tâche
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {reportTasks.map((task) => {
                const confStatus = STATUTS_CONFIG[task.statut];
                const confPriorite = PRIORITES_CONFIG[task.priorite];

                return (
                  <div
                    key={task.id}
                    className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="text-sm font-bold text-slate-900">
                            {task.intitule}
                          </h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${confStatus.bg} ${confStatus.text} ${confStatus.border}`}
                          >
                            {task.statut}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${confPriorite.badge}`}
                          >
                            {task.priorite}
                          </span>
                        </div>

                        {task.description && (
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        {/* Heures & Catégorie */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                          <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {task.categorie}
                          </span>
                          {task.heure_debut && (
                            <span className="flex items-center gap-1 text-[11px]">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {formatTime(task.heure_debut)} {task.heure_fin ? `à ${formatTime(task.heure_fin)}` : ''}
                            </span>
                          )}
                        </div>

                        {/* Résultat obtenu */}
                        {task.resultat && (
                          <div className="mt-2 text-xs bg-emerald-50/60 border border-emerald-100 p-2 rounded-lg text-emerald-900">
                            <span className="font-semibold text-emerald-800">Résultat : </span>
                            {task.resultat}
                          </div>
                        )}

                        {/* Difficultés de la tâche */}
                        {task.difficultes && (
                          <div className="mt-1.5 text-xs bg-rose-50/60 border border-rose-100 p-2 rounded-lg text-rose-900">
                            <span className="font-semibold text-rose-800">Difficulté : </span>
                            {task.difficultes}
                          </div>
                        )}
                      </div>

                      {/* Statut switcher & Actions (Hidden during print) */}
                      <div className="flex items-center gap-1.5 shrink-0 print:hidden self-end sm:self-start">
                        {/* Sélecteur de statut rapide */}
                        <select
                          value={task.statut}
                          onChange={(e) => handleToggleStatus(task, e.target.value as StatutTache)}
                          className="text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-1 focus:ring-orange-500"
                        >
                          <option value="À faire">À faire</option>
                          <option value="En cours">En cours</option>
                          <option value="Terminée">Terminée</option>
                          <option value="Bloquée">Bloquée</option>
                        </select>

                        <button
                          onClick={() => {
                            setTaskToEdit(task);
                            setIsTaskModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Modifier la tâche"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setTaskToDelete(task)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Supprimer la tâche"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Difficultés & Solutions */}
        {(currentReport.difficultes || currentReport.solutions) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {currentReport.difficultes && (
              <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 uppercase tracking-wider mb-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span>Difficultés rencontrées</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                  {currentReport.difficultes}
                </p>
              </div>
            )}

            {currentReport.solutions && (
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1.5">
                  <Lightbulb className="w-4 h-4 text-emerald-500" />
                  <span>Solutions apportées</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                  {currentReport.solutions}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 5. Compétences acquises */}
        {currentReport.competences_acquises && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              <Award className="w-4 h-4 text-orange-500" />
              <span>Compétences et connaissances acquises</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
              {currentReport.competences_acquises}
            </p>
          </div>
        )}

        {/* 6. Observations */}
        {currentReport.observations && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              <span>Observations supplémentaires</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
              {currentReport.observations}
            </p>
          </div>
        )}
      </div>

      {/* Modal d'édition/ajout de tâche */}
      {isTaskModalOpen && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setTaskToEdit(null);
          }}
          onSave={handleSaveTask}
          taskToEdit={taskToEdit}
          defaultRapportId={currentReport.id}
          rapportsList={[currentReport]}
        />
      )}

      {/* Modal de confirmation de suppression de tâche */}
      {taskToDelete && (
        <ConfirmModal
          isOpen={Boolean(taskToDelete)}
          onClose={() => setTaskToDelete(null)}
          onConfirm={handleConfirmDeleteTask}
          title="Supprimer cette tâche ?"
          message={`Êtes-vous sûr de vouloir supprimer définitivement la tâche « ${taskToDelete.intitule} » ?`}
          confirmLabel="Supprimer la tâche"
          isDestructive={true}
          isLoading={isDeletingTask}
        />
      )}
    </div>
  );
};
