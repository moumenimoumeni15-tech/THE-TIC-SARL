import { getSupabaseClient } from '../lib/supabase';
import { Rapport, Tache } from '../types/database';

export const SAMPLE_DATA: {
  rapports: Omit<Rapport, 'id' | 'created_at' | 'updated_at' | 'taches'>[];
  taches: (rapportIndex: number, dateOffset: number) => Omit<Tache, 'id' | 'rapport_id' | 'created_at' | 'updated_at'>[];
} = {
  rapports: [
    {
      date_rapport: '2026-10-12',
      titre: 'Déploiement infrastructure & Optimisation API',
      lieu_service: 'Centre de données & Télétravail',
      objectif: 'Finaliser la migration vers la nouvelle architecture Cloud et sécuriser les endpoints API.',
      resume: 'Journée très productive avec la mise en ligne des microservices, vérification des sauvegardes automatiques et assistance aux équipes de dev.',
      difficultes: 'Latence réseau temporaire constatée lors des tests de charge sous forte concurrence.',
      solutions: 'Configuration d\'un cache Redis intermédiaire et indexation des requêtes PostgreSQL lentes.',
      competences_acquises: 'Gestion avancée du partitionnement de tables PostgreSQL et règles de sécurité Row Level Security.',
      observations: 'Prochaine étape : automatiser les tests d\'intégration dans le pipeline CI/CD.',
    },
    {
      date_rapport: '2026-10-11',
      titre: 'Maintenance préventive des serveurs et réseau',
      lieu_service: 'Direction des Systèmes d\'Information (DSI)',
      objectif: 'Auditer l\'état des serveurs de production et mettre à niveau les correctifs de sécurité critiques.',
      resume: 'Audit complet mené avec succès. Mise à jour de 6 machines virtuelles et renouvellement des certificats SSL/TLS.',
      difficultes: 'Conflit de dépendances lors de la mise à jour d\'OpenSSL sur l\'environnement de staging.',
      solutions: 'Recompilation des paquets dans un conteneur isolé et validation via les tests unitaires.',
      competences_acquises: 'Renouvellement automatisé des certificats via Let\'s Encrypt et hooks DNS.',
      observations: 'Prévoir un redémarrage planifié du routeur principal dimanche prochain.',
    },
    {
      date_rapport: '2026-10-08',
      titre: 'Développement du tableau de bord analytique',
      lieu_service: 'Bureau principal',
      objectif: 'Concevoir l\'interface utilisateur et intégrer les graphiques de suivi des performances.',
      resume: 'Intégration réussie de Recharts avec Tailwind CSS, création des composants réutilisables et synchronisation des filtres par période.',
      difficultes: 'Mise en page complexe sur mobile pour les graphiques circulaires.',
      solutions: 'Passage en disposition responsive dynamique avec conteneur Flexbox adaptatif.',
      competences_acquises: 'Création de graphiques SVG interactifs réactifs avec Recharts et TypeScript.',
      observations: 'Le client a validé les maquettes de l\'interface utilisateur.',
    },
    {
      date_rapport: '2026-10-05',
      titre: 'Support utilisateurs & Résolution d\'incidents',
      lieu_service: 'Assistance technique niveau 2',
      objectif: 'Résoudre les tickets d\'incidents prioritaires en attente depuis le début de la semaine.',
      resume: 'Traitement de 14 tickets de support : déblocage de comptes, configuration de VPN et réinstallation de postes de travail.',
      difficultes: 'Panne intermittente sur la passerelle VPN pour certains utilisateurs distants.',
      solutions: 'Redémarrage du service de tunnelisation et mise à jour du profil de connexion des clients.',
      competences_acquises: 'Diagnostic des paquets réseau via Wireshark et logs de routage.',
      observations: 'Rédiger une fiche mémo pour l\'équipe de support niveau 1.',
    },
  ],
  taches: (rapportIndex: number, dateOffset: number) => {
    const today = new Date();
    today.setDate(today.getDate() - dateOffset);
    const dateStr = today.toISOString().split('T')[0];

    if (rapportIndex === 0) {
      return [
        {
          intitule: 'Configuration des politiques de sécurité des données',
          description: 'Mettre en place la sécurité Row Level Security sur les tables rapports et taches.',
          categorie: 'Développement web',
          date_realisation: dateStr,
          heure_debut: '08:30',
          heure_fin: '10:45',
          statut: 'Terminée',
          priorite: 'Élevée',
          resultat: 'Politiques créées, testées et validées sans fuite de données.',
          difficultes: 'Vérification des rôles anonymes vs authentifiés.',
        },
        {
          intitule: 'Optimisation des index PostgreSQL',
          description: 'Ajouter des index sur date_rapport, statut et priorite pour accélérer le tableau de bord.',
          categorie: 'Maintenance informatique',
          date_realisation: dateStr,
          heure_debut: '11:00',
          heure_fin: '12:30',
          statut: 'Terminée',
          priorite: 'Normale',
          resultat: 'Temps de réponse divisé par 4 sur les agrégations statistiques.',
          difficultes: '',
        },
        {
          intitule: 'Intégration du système de notification Toast',
          description: 'Développer un système de notifications flottantes élégant en orange et blanc.',
          categorie: 'Développement web',
          date_realisation: dateStr,
          heure_debut: '14:00',
          heure_fin: '16:00',
          statut: 'En cours',
          priorite: 'Normale',
          resultat: 'Composant créé, intégration dans les formulaires en cours.',
          difficultes: 'Gestion du z-index au-dessus des modals.',
        },
        {
          intitule: 'Audit des logs d\'erreurs serveur',
          description: 'Passer en revue les 500 dernières lignes de logs pour détecter d\'éventuelles anomalies.',
          categorie: 'Sécurité & Sauvegarde',
          date_realisation: dateStr,
          heure_debut: '16:15',
          heure_fin: '17:30',
          statut: 'À faire',
          priorite: 'Faible',
          resultat: '',
          difficultes: '',
        },
      ];
    } else if (rapportIndex === 1) {
      return [
        {
          intitule: 'Mise à niveau des paquets de sécurité Linux',
          description: 'Application des correctifs critiques sur Debian 12.',
          categorie: 'Maintenance informatique',
          date_realisation: dateStr,
          heure_debut: '09:00',
          heure_fin: '11:00',
          statut: 'Terminée',
          priorite: 'Urgente',
          resultat: '6 serveurs mis à jour avec succès.',
          difficultes: 'Redémarrage nécessaire sur 1 serveur applicatif.',
        },
        {
          intitule: 'Renouvellement des certificats SSL/TLS',
          description: 'Vérification de la validité et déploiement du nouveau certificat Wildcard.',
          categorie: 'Réseau informatique',
          date_realisation: dateStr,
          heure_debut: '11:15',
          heure_fin: '12:45',
          statut: 'Terminée',
          priorite: 'Élevée',
          resultat: 'Nouveaux certificats valides pour 1 an.',
          difficultes: '',
        },
        {
          intitule: 'Remplacement d\'un disque défaillant sur le NAS',
          description: 'Reconstruction du volume RAID après alerte de secteur défectueux.',
          categorie: 'Installation et configuration',
          date_realisation: dateStr,
          heure_debut: '14:00',
          heure_fin: '17:00',
          statut: 'Bloquée',
          priorite: 'Élevée',
          resultat: 'Disque physique reçu mais pièce incompatible avec le tiroir hot-swap.',
          difficultes: 'Attente du modèle de tiroir constructeur.',
        },
      ];
    } else if (rapportIndex === 2) {
      return [
        {
          intitule: 'Conception du composant Graphique en courbes Recharts',
          description: 'Visualisation de l\'évolution quotidienne des tâches avec thème orange.',
          categorie: 'Développement web',
          date_realisation: dateStr,
          heure_debut: '09:00',
          heure_fin: '12:00',
          statut: 'Terminée',
          priorite: 'Normale',
          resultat: 'Graphique fluide avec infobulles personnalisées.',
          difficultes: '',
        },
        {
          intitule: 'Génération de l\'export PDF A4',
          description: 'Création du modèle d\'exportation imprimable pour chaque fiche de rapport.',
          categorie: 'Développement web',
          date_realisation: dateStr,
          heure_debut: '13:30',
          heure_fin: '17:00',
          statut: 'Terminée',
          priorite: 'Élevée',
          resultat: 'Document PDF professionnel prêt à être imprimé ou partagé.',
          difficultes: '',
        },
      ];
    } else {
      return [
        {
          intitule: 'Dépannage de l\'imprimante réseau DSI',
          description: 'Reconfiguration du pilote d\'impression et de l\'IP fixe.',
          categorie: 'Assistance technique',
          date_realisation: dateStr,
          heure_debut: '09:30',
          heure_fin: '10:30',
          statut: 'Terminée',
          priorite: 'Normale',
          resultat: 'Imprimante à nouveau opérationnelle pour tout le service.',
          difficultes: '',
        },
        {
          intitule: 'Configuration d\'un poste pour un nouvel arrivant',
          description: 'Installation de Windows, suite bureautique, client VPN et certificats.',
          categorie: 'Installation et configuration',
          date_realisation: dateStr,
          heure_debut: '11:00',
          heure_fin: '13:00',
          statut: 'Terminée',
          priorite: 'Normale',
          resultat: 'Poste remis au collaborateur avec formation rapide.',
          difficultes: '',
        },
        {
          intitule: 'Investigation incident coupure VPN',
          description: 'Analyse des journaux du pare-feu suite aux déconnexions signalées.',
          categorie: 'Réseau informatique',
          date_realisation: dateStr,
          heure_debut: '14:30',
          heure_fin: '16:30',
          statut: 'Terminée',
          priorite: 'Urgente',
          resultat: 'Cause identifiée : timeout trop court dans les paramètres de session.',
          difficultes: '',
        },
      ];
    }
  },
};

export async function seedInitialData(): Promise<{ success: boolean; message: string; countRapports: number; countTaches: number }> {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      let rapportsCreated = 0;
      let tachesCreated = 0;

      for (let i = 0; i < SAMPLE_DATA.rapports.length; i++) {
        const rep = SAMPLE_DATA.rapports[i];
        const dateOffset = i * 2;

        const { data: createdRapport, error: errRep } = await supabase
          .from('rapports')
          .insert([{
            ...rep,
            user_id: user?.id || null,
            created_at: new Date(Date.now() - dateOffset * 86400000).toISOString(),
            updated_at: new Date().toISOString(),
          }])
          .select()
          .single();

        if (errRep || !createdRapport) {
          throw new Error(errRep?.message || 'Erreur insertion rapport');
        }

        rapportsCreated++;

        const tasksToInsert = SAMPLE_DATA.taches(i, dateOffset).map((t) => ({
          ...t,
          rapport_id: createdRapport.id,
          user_id: user?.id || null,
          created_at: new Date(Date.now() - dateOffset * 86400000).toISOString(),
          updated_at: new Date().toISOString(),
        }));

        const { error: errTasks } = await supabase
          .from('taches')
          .insert(tasksToInsert);

        if (errTasks) {
          throw new Error(errTasks.message);
        }

        tachesCreated += tasksToInsert.length;
      }

      return {
        success: true,
        message: `${rapportsCreated} rapports et ${tachesCreated} tâches insérés avec succès dans votre base de données !`,
        countRapports: rapportsCreated,
        countTaches: tachesCreated,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        message: `Erreur d'insertion dans la base de données : ${errorMsg}`,
        countRapports: 0,
        countTaches: 0,
      };
    }
  }

  // Fallback local
  let totalTasks = 0;
  const localRapports: Rapport[] = [];
  const localTaches: Tache[] = [];

  SAMPLE_DATA.rapports.forEach((r, idx) => {
    const rId = `demo-rep-${idx + 1}`;
    localRapports.push({
      ...r,
      id: rId,
      created_at: new Date(Date.now() - idx * 2 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    });

    const tasks = SAMPLE_DATA.taches(idx, idx * 2).map((t, tIdx) => ({
      ...t,
      id: `demo-task-${idx + 1}-${tIdx + 1}`,
      rapport_id: rId,
      created_at: new Date(Date.now() - idx * 2 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      rapport_titre: r.titre,
      rapport_date: r.date_rapport,
    }));

    totalTasks += tasks.length;
    localTaches.push(...tasks);
  });

  localStorage.setItem('dailyreport_fallback_rapports', JSON.stringify(localRapports));
  localStorage.setItem('dailyreport_fallback_taches', JSON.stringify(localTaches));

  return {
    success: true,
    message: `${localRapports.length} rapports et ${totalTasks} tâches de démonstration initialisés !`,
    countRapports: localRapports.length,
    countTaches: totalTasks,
  };
}
