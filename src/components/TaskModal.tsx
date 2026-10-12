import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Calendar, Clock, AlertCircle } from 'lucide-react';
import { Tache, StatutTache, PrioriteTache, CATEGORIES_TACHES, Rapport } from '../types/database';
import { getTodayISODate } from '../utils/dateUtils';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<Tache>, isEditing: boolean) => Promise<void>;
  taskToEdit?: Tache | null;
  defaultRapportId?: string;
  rapportsList?: Rapport[];
  isLoading?: boolean;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  taskToEdit,
  defaultRapportId,
  rapportsList = [],
  isLoading = false,
}) => {
  const isEditing = Boolean(taskToEdit && taskToEdit.id);

  const [rapportId, setRapportId] = useState<string>('');
  const [intitule, setIntitule] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [categorie, setCategorie] = useState<string>('Développement web');
  const [dateRealisation, setDateRealisation] = useState<string>(getTodayISODate());
  const [heureDebut, setHeureDebut] = useState<string>('');
  const [heureFin, setHeureFin] = useState<string>('');
  const [statut, setStatut] = useState<StatutTache>('À faire');
  const [priorite, setPriorite] = useState<PrioriteTache>('Normale');
  const [resultat, setResultat] = useState<string>('');
  const [difficultes, setDifficultes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (taskToEdit) {
      setRapportId(taskToEdit.rapport_id || '');
      setIntitule(taskToEdit.intitule || '');
      setDescription(taskToEdit.description || '');
      setCategorie(taskToEdit.categorie || 'Développement web');
      setDateRealisation(taskToEdit.date_realisation || getTodayISODate());
      setHeureDebut(taskToEdit.heure_debut ? taskToEdit.heure_debut.substring(0, 5) : '');
      setHeureFin(taskToEdit.heure_fin ? taskToEdit.heure_fin.substring(0, 5) : '');
      setStatut(taskToEdit.statut || 'À faire');
      setPriorite(taskToEdit.priorite || 'Normale');
      setResultat(taskToEdit.resultat || '');
      setDifficultes(taskToEdit.difficultes || '');
      setFormError(null);
    } else {
      setRapportId(defaultRapportId || (rapportsList[0]?.id ?? ''));
      setIntitule('');
      setDescription('');
      setCategorie('Développement web');
      setDateRealisation(getTodayISODate());
      setHeureDebut('');
      setHeureFin('');
      setStatut('À faire');
      setPriorite('Normale');
      setResultat('');
      setDifficultes('');
      setFormError(null);
    }
  }, [taskToEdit, defaultRapportId, rapportsList, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intitule.trim()) {
      setFormError('L\'intitulé de la tâche est obligatoire.');
      return;
    }
    if (!rapportId) {
      setFormError('Veuillez sélectionner un rapport associé pour cette tâche.');
      return;
    }

    setFormError(null);

    const taskData: Partial<Tache> = {
      ...(taskToEdit ? { id: taskToEdit.id } : {}),
      rapport_id: rapportId,
      intitule: intitule.trim(),
      description: description.trim() || null,
      categorie,
      date_realisation: dateRealisation,
      heure_debut: heureDebut ? `${heureDebut}:00` : null,
      heure_fin: heureFin ? `${heureFin}:00` : null,
      statut,
      priorite,
      resultat: resultat.trim() || null,
      difficultes: difficultes.trim() || null,
    };

    await onSave(taskData, isEditing);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative bg-white rounded-2xl max-w-xl w-full max-h-[92vh] sm:max-h-[88vh] shadow-2xl border border-slate-200 z-10 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header (Fixé en haut) */}
        <div className="shrink-0 px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
              <CheckSquare className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 leading-snug truncate">
                {isEditing ? 'Modifier la tâche' : 'Ajouter une tâche'}
              </h3>
              <p className="text-xs text-slate-500 truncate">
                {isEditing ? 'Mise à jour sans créer de doublon' : 'Relier une nouvelle tâche au rapport journalier'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 shrink-0 ml-2 cursor-pointer"
            disabled={isLoading}
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps défilable du formulaire */}
        <form
          id="task-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4 overscroll-contain"
        >
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Rapport associé */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Rapport journalier associé <span className="text-orange-600">*</span>
            </label>
            {defaultRapportId && !isEditing ? (
              <div className="text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium truncate">
                {rapportsList.find((r) => r.id === defaultRapportId)?.titre || 'Rapport sélectionné'}
              </div>
            ) : (
              <select
                value={rapportId}
                onChange={(e) => setRapportId(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-800"
                required
              >
                <option value="">Sélectionnez un rapport...</option>
                {rapportsList.map((rep) => (
                  <option key={rep.id} value={rep.id}>
                    {rep.date_rapport} — {rep.titre}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Intitulé */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Intitulé de la tâche <span className="text-orange-600">*</span>
            </label>
            <input
              type="text"
              value={intitule}
              onChange={(e) => setIntitule(e.target.value)}
              placeholder="Ex: Configuration du serveur DNS secondaire"
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-900"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description détaillée
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Détails opérationnels, commandes exécutées, consignes..."
              className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-800 resize-none"
            />
          </div>

          {/* Catégorie & Date de réalisation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catégorie
              </label>
              <select
                value={categorie}
                onChange={(e) => setCategorie(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-800"
              >
                {CATEGORIES_TACHES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date de réalisation
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dateRealisation}
                  onChange={(e) => setDateRealisation(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-800"
                  required
                />
              </div>
            </div>
          </div>

          {/* Horaires début / fin */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Heure début (facultative)
              </label>
              <input
                type="time"
                value={heureDebut}
                onChange={(e) => setHeureDebut(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Heure fin (facultative)
              </label>
              <input
                type="time"
                value={heureFin}
                onChange={(e) => setHeureFin(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-800"
              />
            </div>
          </div>

          {/* Statut & Priorité */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Statut
              </label>
              <select
                value={statut}
                onChange={(e) => setStatut(e.target.value as StatutTache)}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-800 font-semibold"
              >
                <option value="À faire">À faire</option>
                <option value="En cours">En cours</option>
                <option value="Terminée">Terminée</option>
                <option value="Bloquée">Bloquée</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Priorité
              </label>
              <select
                value={priorite}
                onChange={(e) => setPriorite(e.target.value as PrioriteTache)}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-800"
              >
                <option value="Faible">Faible</option>
                <option value="Normale">Normale</option>
                <option value="Élevée">Élevée</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>
          </div>

          {/* Résultat obtenu */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Résultat obtenu
            </label>
            <input
              type="text"
              value={resultat}
              onChange={(e) => setResultat(e.target.value)}
              placeholder="Ex: Service rétabli, rapport envoyé au client..."
              className="w-full text-xs sm:text-sm px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-800"
            />
          </div>

          {/* Difficultés */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Difficultés rencontrées (facultatif)
            </label>
            <input
              type="text"
              value={difficultes}
              onChange={(e) => setDifficultes(e.target.value)}
              placeholder="Ex: Câble défectueux, droits insuffisants..."
              className="w-full text-xs sm:text-sm px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-800"
            />
          </div>
        </form>

        {/* Footer (Fixé en bas, toujours visible) */}
        <div className="shrink-0 px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/90 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="task-form"
            disabled={isLoading}
            className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 active:scale-98 rounded-xl shadow-xs transition-all duration-150 cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading && (
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            <span>{isEditing ? 'Mettre à jour la tâche' : 'Enregistrer la tâche'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
