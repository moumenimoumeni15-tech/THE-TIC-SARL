import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  ArrowUpDown,
  FileText,
  AlertCircle,
  Eye,
} from 'lucide-react';
import {
  Tache,
  Rapport,
  StatutTache,
  PrioriteTache,
  CATEGORIES_TACHES,
  STATUTS_CONFIG,
  PRIORITES_CONFIG,
} from '../types/database';
import { formatDateFrench, formatDateShort, formatTime } from '../utils/dateUtils';
import { TaskModal } from '../components/TaskModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { createTache, updateTache, updateTacheStatut, deleteTache } from '../services/taskService';
import { useNotification } from '../context/NotificationContext';

interface TasksPageProps {
  taches: Tache[];
  rapports: Rapport[];
  onNavigate: (tab: any, param?: any) => void;
  onRefreshData: () => Promise<void>;
}

export const TasksPage: React.FC<TasksPageProps> = ({
  taches,
  rapports,
  onNavigate,
  onRefreshData,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatut, setFilterStatut] = useState<string>('all');
  const [filterCategorie, setFilterCategorie] = useState<string>('all');
  const [filterPriorite, setFilterPriorite] = useState<string>('all');
  const [filterPeriode, setFilterPeriode] = useState<string>('all');

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [taskToEdit, setTaskToEdit] = useState<Tache | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Tache | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const { showNotification } = useNotification();

  // Filtrage combiné des tâches
  const filteredTasks = useMemo(() => {
    const now = new Date();

    return taches.filter((t) => {
      // Recherche textuelle
      const matchesSearch =
        t.intitule.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.resultat && t.resultat.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.rapport_titre && t.rapport_titre.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      // Filtre Statut
      if (filterStatut !== 'all' && t.statut !== filterStatut) {
        return false;
      }

      // Filtre Catégorie
      if (filterCategorie !== 'all' && t.categorie !== filterCategorie) {
        return false;
      }

      // Filtre Priorité
      if (filterPriorite !== 'all' && t.priorite !== filterPriorite) {
        return false;
      }

      // Filtre Période
      if (filterPeriode !== 'all') {
        const d = new Date(t.date_realisation);
        if (filterPeriode === '7d' && now.getTime() - d.getTime() > 7 * 86400000) return false;
        if (filterPeriode === '30d' && now.getTime() - d.getTime() > 30 * 86400000) return false;
        if (filterPeriode === 'this_year' && d.getFullYear() !== now.getFullYear()) return false;
      }

      return true;
    });
  }, [taches, searchTerm, filterStatut, filterCategorie, filterPriorite, filterPeriode]);

  // Modification rapide de statut
  const handleQuickStatusChange = async (taskId: string, newStatut: StatutTache) => {
    try {
      const res = await updateTacheStatut(taskId, newStatut);
      if (res.error) throw new Error(res.error);

      showNotification('success', 'Statut actualisé', `La tâche est désormais « ${newStatut} »`);
      await onRefreshData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showNotification('error', 'Erreur de mise à jour', msg);
    }
  };

  // Enregistrer ou modifier une tâche
  const handleSaveTask = async (taskData: Partial<Tache>, isEditing: boolean) => {
    setIsSaving(true);
    try {
      if (isEditing && taskToEdit) {
        const res = await updateTache(taskToEdit.id, taskData);
        if (res.error) throw new Error(res.error);
        showNotification('success', 'Tâche mise à jour', 'Modifications enregistrées sans doublon.');
      } else {
        const res = await createTache(
          taskData as Omit<Tache, 'id' | 'created_at' | 'updated_at' | 'rapport_titre' | 'rapport_date'>
        );
        if (res.error) throw new Error(res.error);
        showNotification('success', 'Tâche créée', 'Tâche reliée au rapport sélectionné.');
      }
      await onRefreshData();
      setIsTaskModalOpen(false);
      setTaskToEdit(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showNotification('error', 'Erreur d\'enregistrement', msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Suppression d'une tâche
  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteTache(taskToDelete.id);
      if (res.error) throw new Error(res.error);
      showNotification('success', 'Tâche supprimée', 'Tâche retirée avec succès.');
      await onRefreshData();
      setTaskToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showNotification('error', 'Erreur de suppression', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <CheckSquare className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Gestion de toutes les tâches ({taches.length})
            </h2>
            <p className="text-xs text-slate-500">
              Vue transversale de l'ensemble des tâches réparties dans tous les rapports
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setTaskToEdit(null);
            setIsTaskModalOpen(true);
          }}
          disabled={rapports.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs hover:shadow-orange-500/20 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
          title={rapports.length === 0 ? 'Créez d\'abord un rapport' : 'Créer une tâche'}
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Ajouter une tâche</span>
        </button>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3">
        {/* Recherche */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Recherche instantanée : intitulé, rapport, résultat..."
            className="w-full text-xs sm:text-sm pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-900"
          />
        </div>

        {/* 4 Filtres : Statut, Catégorie, Priorité, Période */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {/* Statut */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Statut
            </label>
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-1 focus:ring-orange-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="À faire">À faire</option>
              <option value="En cours">En cours</option>
              <option value="Terminée">Terminée</option>
              <option value="Bloquée">Bloquée</option>
            </select>
          </div>

          {/* Catégorie */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Catégorie
            </label>
            <select
              value={filterCategorie}
              onChange={(e) => setFilterCategorie(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-1 focus:ring-orange-500"
            >
              <option value="all">Toutes les catégories</option>
              {CATEGORIES_TACHES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Priorité */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Priorité
            </label>
            <select
              value={filterPriorite}
              onChange={(e) => setFilterPriorite(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-1 focus:ring-orange-500"
            >
              <option value="all">Toutes les priorités</option>
              <option value="Faible">Faible</option>
              <option value="Normale">Normale</option>
              <option value="Élevée">Élevée</option>
              <option value="Urgente">Urgente</option>
            </select>
          </div>

          {/* Période */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Période
            </label>
            <select
              value={filterPeriode}
              onChange={(e) => setFilterPeriode(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-1 focus:ring-orange-500"
            >
              <option value="all">Toute la durée</option>
              <option value="7d">7 derniers jours</option>
              <option value="30d">30 derniers jours</option>
              <option value="this_year">Cette année</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tableau complet des tâches */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">Aucune tâche trouvée</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {searchTerm || filterStatut !== 'all' || filterCategorie !== 'all'
                ? 'Aucune tâche ne correspond à vos critères de filtrage.'
                : 'Commencez par ajouter des tâches à vos rapports journaliers.'}
            </p>
          </div>
        ) : (
          <>
            {/* VUE MOBILE (Cartes de tâches adaptées aux téléphones) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {filteredTasks.map((t) => {
                const confStatus = STATUTS_CONFIG[t.statut];
                const confPriorite = PRIORITES_CONFIG[t.priorite];

                return (
                  <div key={t.id} className="p-4 space-y-3 hover:bg-slate-50/70 transition-colors">
                    {/* Ligne 1 : Intitulé et Priorité */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-block px-2 py-0.5 rounded-md border text-[10px] font-bold ${confPriorite.badge}`}>
                            {t.priorite}
                          </span>
                          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {t.categorie}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm leading-snug">
                          {t.intitule}
                        </h4>
                      </div>

                      {/* Statut rapide */}
                      <select
                        value={t.statut}
                        onChange={(e) => handleQuickStatusChange(t.id, e.target.value as StatutTache)}
                        className={`text-xs font-bold px-2 py-1 rounded-lg border cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-500 shrink-0 ${confStatus.bg} ${confStatus.text} ${confStatus.border}`}
                      >
                        <option value="À faire">À faire</option>
                        <option value="En cours">En cours</option>
                        <option value="Terminée">Terminée</option>
                        <option value="Bloquée">Bloquée</option>
                      </select>
                    </div>

                    {/* Description si présente */}
                    {t.description && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {t.description}
                      </p>
                    )}

                    {/* Résultat obtenu */}
                    {t.resultat && (
                      <div className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-100 p-2 rounded-lg">
                        <span className="font-semibold">Résultat : </span>
                        {t.resultat}
                      </div>
                    )}

                    {/* Date, Heure & Rapport associé */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-700">
                          {formatDateShort(t.date_realisation)}
                        </span>
                        {t.heure_debut && (
                          <span className="text-[11px] text-slate-400">
                            {formatTime(t.heure_debut)} {t.heure_fin ? `à ${formatTime(t.heure_fin)}` : ''}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => onNavigate('reports', t.rapport_id)}
                        className="text-orange-600 font-semibold hover:underline flex items-center gap-1 text-[11px]"
                      >
                        <FileText className="w-3 h-3" />
                        <span className="max-w-[120px] truncate">{t.rapport_titre || 'Rapport'}</span>
                      </button>
                    </div>

                    {/* Actions sur mobile */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setTaskToEdit(t);
                          setIsTaskModalOpen(true);
                        }}
                        className="py-1 px-2.5 bg-slate-50 hover:bg-slate-100 text-blue-600 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-200/60 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Modifier</span>
                      </button>

                      <button
                        onClick={() => setTaskToDelete(t)}
                        className="py-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold flex items-center gap-1 border border-rose-200/60 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Supprimer</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* VUE TABLETTE & DESKTOP (Tableau complet) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Intitulé</th>
                    <th className="py-3.5 px-4">Rapport associé</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Catégorie</th>
                    <th className="py-3.5 px-4 text-center">Priorité</th>
                    <th className="py-3.5 px-4 text-center">Statut (Rapide)</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.map((t) => {
                    const confStatus = STATUTS_CONFIG[t.statut];
                    const confPriorite = PRIORITES_CONFIG[t.priorite];

                    return (
                      <tr
                        key={t.id}
                        className="hover:bg-orange-50/20 transition-colors group"
                      >
                        {/* Intitulé */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-bold text-slate-900 line-clamp-1">
                            {t.intitule}
                          </div>
                          {t.description && (
                            <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {t.description}
                            </div>
                          )}
                          {t.resultat && (
                            <div className="text-[10px] text-emerald-700 font-medium line-clamp-1 mt-0.5">
                              ✓ {t.resultat}
                            </div>
                          )}
                        </td>

                        {/* Rapport associé */}
                        <td className="py-3.5 px-4 max-w-[180px]">
                          <button
                            onClick={() => onNavigate('reports', t.rapport_id)}
                            className="font-semibold text-slate-700 hover:text-orange-600 transition-colors text-left line-clamp-1 cursor-pointer flex items-center gap-1.5"
                            title="Voir le rapport"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{t.rapport_titre || 'Rapport lié'}</span>
                          </button>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                          <span className="font-medium">
                            {formatDateShort(t.date_realisation)}
                          </span>
                          {t.heure_debut && (
                            <span className="block text-[10px] text-slate-400">
                              {formatTime(t.heure_debut)} {t.heure_fin ? `à ${formatTime(t.heure_fin)}` : ''}
                            </span>
                          )}
                        </td>

                        {/* Catégorie */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                            {t.categorie}
                          </span>
                        </td>

                        {/* Priorité */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md border text-[10px] font-bold ${confPriorite.badge}`}
                          >
                            {t.priorite}
                          </span>
                        </td>

                        {/* Statut avec modification rapide */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <select
                            value={t.statut}
                            onChange={(e) => handleQuickStatusChange(t.id, e.target.value as StatutTache)}
                            className={`text-xs font-bold px-2 py-1 rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 ${confStatus.bg} ${confStatus.text} ${confStatus.border}`}
                          >
                            <option value="À faire">À faire</option>
                            <option value="En cours">En cours</option>
                            <option value="Terminée">Terminée</option>
                            <option value="Bloquée">Bloquée</option>
                          </select>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {/* Aller au rapport */}
                            <button
                              onClick={() => onNavigate('reports', t.rapport_id)}
                              className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                              title="Voir le rapport complet"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Modifier la tâche */}
                            <button
                              onClick={() => {
                                setTaskToEdit(t);
                                setIsTaskModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Modifier cette tâche"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Supprimer la tâche */}
                            <button
                              onClick={() => setTaskToDelete(t)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Supprimer cette tâche"
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

      {/* Modal d'édition/création */}
      {isTaskModalOpen && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setTaskToEdit(null);
          }}
          onSave={handleSaveTask}
          taskToEdit={taskToEdit}
          rapportsList={rapports}
          isLoading={isSaving}
        />
      )}

      {/* Modal de confirmation de suppression */}
      {taskToDelete && (
        <ConfirmModal
          isOpen={Boolean(taskToDelete)}
          onClose={() => setTaskToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Supprimer cette tâche ?"
          message={`Êtes-vous sûr de vouloir supprimer définitivement la tâche « ${taskToDelete.intitule} » ?`}
          confirmLabel="Supprimer la tâche"
          isDestructive={true}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};
