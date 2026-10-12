import React, { useState, useMemo } from 'react';
import {
  Files,
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  FileDown,
  Printer,
  Calendar,
  CheckCircle2,
  Filter,
  CheckSquare,
  AlertCircle,
  MoreVertical,
} from 'lucide-react';
import { Rapport, Tache } from '../types/database';
import { formatDateFrench, formatDateShort } from '../utils/dateUtils';
import { exportRapportToPDF } from '../utils/pdfExport';
import { ConfirmModal } from '../components/ConfirmModal';
import { TaskModal } from '../components/TaskModal';
import { deleteRapport } from '../services/reportService';
import { createTache } from '../services/taskService';
import { useNotification } from '../context/NotificationContext';

interface ReportsListPageProps {
  rapports: Rapport[];
  taches: Tache[];
  onNavigate: (tab: any, param?: any) => void;
  onRefreshData: () => Promise<void>;
}

export const ReportsListPage: React.FC<ReportsListPageProps> = ({
  rapports,
  taches,
  onNavigate,
  onRefreshData,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Deletion modal state
  const [reportToDelete, setReportToDelete] = useState<Rapport | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Quick add task to report modal
  const [reportForNewTask, setReportForNewTask] = useState<Rapport | null>(null);
  const [isAddingTask, setIsAddingTask] = useState<boolean>(false);

  const { showNotification } = useNotification();

  // Extraire les années disponibles
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    rapports.forEach((r) => {
      if (r.date_rapport) {
        years.add(r.date_rapport.substring(0, 4));
      }
    });
    return Array.from(years).sort().reverse();
  }, [rapports]);

  // Filtrer les rapports
  const filteredReports = useMemo(() => {
    return rapports.filter((r) => {
      // Recherche textuelle
      const matchesSearch =
        r.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.lieu_service && r.lieu_service.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.resume && r.resume.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      // Filtre par année
      if (selectedYear !== 'all') {
        const year = r.date_rapport.substring(0, 4);
        if (year !== selectedYear) return false;
      }

      // Filtre par mois
      if (selectedMonth !== 'all') {
        const month = r.date_rapport.substring(5, 7);
        if (month !== selectedMonth) return false;
      }

      return true;
    });
  }, [rapports, searchTerm, selectedYear, selectedMonth]);

  // Confirmation de suppression
  const handleConfirmDelete = async () => {
    if (!reportToDelete) return;
    setIsDeleting(true);

    try {
      const res = await deleteRapport(reportToDelete.id);
      if (res.error) throw new Error(res.error);

      showNotification(
        'success',
        'Rapport supprimé',
        'Le rapport et ses tâches associées ont été supprimés avec succès.'
      );
      await onRefreshData();
      setReportToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showNotification('error', 'Erreur de suppression', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Ajout rapide de tâche
  const handleSaveTask = async (taskData: Partial<Tache>) => {
    setIsAddingTask(true);
    try {
      const res = await createTache(
        taskData as Omit<Tache, 'id' | 'created_at' | 'updated_at' | 'rapport_titre' | 'rapport_date'>
      );
      if (res.error) throw new Error(res.error);

      showNotification('success', 'Tâche ajoutée avec succès au rapport !');
      await onRefreshData();
      setReportForNewTask(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showNotification('error', 'Erreur lors de l\'ajout', msg);
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleExportPDF = (report: Rapport) => {
    const reportTasks = taches.filter((t) => t.rapport_id === report.id);
    const fullReport: Rapport = {
      ...report,
      taches: reportTasks,
    };
    exportRapportToPDF(fullReport);
    showNotification('success', 'PDF généré', `Le rapport du ${report.date_rapport} a été exporté.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <Files className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Tous les rapports ({rapports.length})
            </h2>
            <p className="text-xs text-slate-500">
              Historique complet de vos comptes-rendus journaliers et interventions
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('new-report')}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs hover:shadow-orange-500/20 active:scale-98 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nouveau rapport</span>
        </button>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Champ de recherche */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par mot-clé, titre, lieu, résumé..."
            className="w-full text-xs sm:text-sm pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-900"
          />
        </div>

        {/* Filtres par année et mois */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Année */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="flex-1 md:flex-none text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-700 font-medium"
          >
            <option value="all">Toutes les années</option>
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>

          {/* Mois */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="flex-1 md:flex-none text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-700 font-medium"
          >
            <option value="all">Tous les mois</option>
            <option value="01">Janvier</option>
            <option value="02">Février</option>
            <option value="03">Mars</option>
            <option value="04">Avril</option>
            <option value="05">Mai</option>
            <option value="06">Juin</option>
            <option value="07">Juillet</option>
            <option value="08">Août</option>
            <option value="09">Septembre</option>
            <option value="10">Octobre</option>
            <option value="11">Novembre</option>
            <option value="12">Décembre</option>
          </select>
        </div>
      </div>

      {/* Conteneur des rapports (Tableau Desktop + Cartes Mobiles) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {filteredReports.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">Aucun rapport trouvé</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {searchTerm || selectedYear !== 'all' || selectedMonth !== 'all'
                ? 'Aucun résultat ne correspond à vos filtres de recherche.'
                : 'Commencez par créer votre premier rapport journalier.'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => onNavigate('new-report')}
                className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                Créer un rapport
              </button>
            )}
          </div>
        ) : (
          <>
            {/* VUE MOBILE (Cartes adaptées smartphones et petits écrans) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {filteredReports.map((report, index) => {
                const reportTasks = taches.filter((t) => t.rapport_id === report.id);
                const total = reportTasks.length;
                const completed = reportTasks.filter((t) => t.statut === 'Terminée').length;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

                return (
                  <div key={report.id} className="p-4 space-y-3 hover:bg-slate-50/70 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                            #{index + 1}
                          </span>
                          <span className="text-xs font-bold text-orange-600">
                            {formatDateFrench(report.date_rapport)}
                          </span>
                        </div>
                        <h3
                          onClick={() => onNavigate('reports', report.id)}
                          className="font-bold text-slate-900 text-sm leading-snug cursor-pointer hover:text-orange-600"
                        >
                          {report.titre}
                        </h3>
                        {report.lieu_service && (
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                            {report.lieu_service}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-slate-800">
                          {completed}/{total}
                        </span>
                        <span className="text-[10px] text-slate-400 block">tâches</span>
                      </div>
                    </div>

                    {/* Jauge d'achèvement */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                        <span>Avancement</span>
                        <span className="font-semibold text-slate-700">{pct}% achevé</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions sur mobile (Touch targets confortables) */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                      <button
                        onClick={() => onNavigate('reports', report.id)}
                        className="flex-1 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border border-slate-200/60 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Détails</span>
                      </button>

                      <button
                        onClick={() => onNavigate('new-report', report)}
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 text-blue-600 rounded-lg border border-slate-200/60 cursor-pointer"
                        title="Modifier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setReportForNewTask(report)}
                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200/60 cursor-pointer"
                        title="Ajouter une tâche"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>

                      <button
                        onClick={() => handleExportPDF(report)}
                        className="p-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg border border-orange-200/60 cursor-pointer"
                        title="PDF"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setReportToDelete(report)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200/60 cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* VUE TABLETTE & DESKTOP (Tableau professionnel complet) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">N°</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Titre & Lieu</th>
                    <th className="py-3.5 px-4 text-center">Tâches</th>
                    <th className="py-3.5 px-4 text-center">Terminées</th>
                    <th className="py-3.5 px-4">Dernière modif.</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReports.map((report, index) => {
                    const reportTasks = taches.filter((t) => t.rapport_id === report.id);
                    const total = reportTasks.length;
                    const completed = reportTasks.filter((t) => t.statut === 'Terminée').length;
                    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

                    return (
                      <tr
                        key={report.id}
                        className="hover:bg-orange-50/20 transition-colors group"
                      >
                        <td className="py-4 px-4 font-mono text-[11px] font-bold text-slate-400">
                          #{index + 1}
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="font-semibold text-slate-900 block">
                            {formatDateShort(report.date_rapport)}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {formatDateFrench(report.date_rapport).split(' ')[1]}
                          </span>
                        </td>

                        <td className="py-4 px-4 max-w-xs sm:max-w-md">
                          <button
                            onClick={() => onNavigate('reports', report.id)}
                            className="font-bold text-slate-900 hover:text-orange-600 transition-colors text-left line-clamp-1 cursor-pointer"
                          >
                            {report.titre}
                          </button>
                          {report.lieu_service && (
                            <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                              {report.lieu_service}
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md font-bold text-xs bg-slate-100 text-slate-800">
                            {total}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <span className="font-bold text-xs text-slate-900">
                              {completed} / {total}
                            </span>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-500">
                          {formatDateShort(report.updated_at.split('T')[0])}
                        </td>

                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onNavigate('reports', report.id)}
                              className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                              title="Voir la fiche détaillée"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => onNavigate('new-report', report)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Modifier ce rapport"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setReportForNewTask(report)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Ajouter une tâche à ce rapport"
                            >
                              <Plus className="w-4 h-4 stroke-[2.5]" />
                            </button>

                            <button
                              onClick={() => handleExportPDF(report)}
                              className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                              title="Télécharger en PDF"
                            >
                              <FileDown className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setReportToDelete(report)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Supprimer ce rapport"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      {reportToDelete && (
        <ConfirmModal
          isOpen={Boolean(reportToDelete)}
          onClose={() => setReportToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Supprimer ce rapport journalier ?"
          message={`Êtes-vous sûr de vouloir supprimer définitivement le rapport « ${reportToDelete.titre} » du ${formatDateFrench(reportToDelete.date_rapport)} ? Toutes les tâches associées seront également supprimées en cascade sans laisser de données orphelines.`}
          confirmLabel="Supprimer définitivement"
          isDestructive={true}
          isLoading={isDeleting}
        />
      )}

      {/* Modal d'ajout rapide de tâche */}
      {reportForNewTask && (
        <TaskModal
          isOpen={Boolean(reportForNewTask)}
          onClose={() => setReportForNewTask(null)}
          onSave={handleSaveTask}
          defaultRapportId={reportForNewTask.id}
          rapportsList={[reportForNewTask]}
          isLoading={isAddingTask}
        />
      )}
    </div>
  );
};
