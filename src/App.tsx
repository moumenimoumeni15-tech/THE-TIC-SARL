import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { NewReportPage } from './pages/NewReportPage';
import { ReportsListPage } from './pages/ReportsListPage';
import { ReportDetailPage } from './pages/ReportDetailPage';
import { TasksPage } from './pages/TasksPage';
import { StatisticsPage } from './pages/StatisticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuthModal } from './components/AuthModal';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';
import { Rapport, Tache } from './types/database';
import { getRapports } from './services/reportService';
import { getAllTaches } from './services/taskService';
import { getSupabaseCredentials } from './lib/supabase';
import { autoInitializeDatabase } from './lib/databaseInit';
import { Loader2 } from 'lucide-react';

function MainApp() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [reportToEdit, setReportToEdit] = useState<Rapport | null>(null);
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Données de l'application
  const [rapports, setRapports] = useState<Rapport[]>([]);
  const [taches, setTaches] = useState<Tache[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDatabaseConfigured, setIsDatabaseConfigured] = useState<boolean>(false);

  const { showNotification } = useNotification();

  // Chargement des données
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const creds = getSupabaseCredentials();
      setIsDatabaseConfigured(creds.isConfigured);

      const [rapportsRes, tachesRes] = await Promise.all([
        getRapports(),
        getAllTaches(),
      ]);

      if (rapportsRes.error) {
        console.warn('Rapports notice:', rapportsRes.error);
      }
      if (tachesRes.error) {
        console.warn('Taches notice:', tachesRes.error);
      }

      setRapports(rapportsRes.data || []);
      setTaches(tachesRes.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Erreur chargement données:', msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initialisation automatique des tables au démarrage / déploiement
    autoInitializeDatabase().catch(() => {});
    loadData();
  }, [loadData]);

  // Navigation unifiée
  const handleNavigate = (tab: NavTab, param?: any) => {
    if (tab === 'reports' && typeof param === 'string') {
      setSelectedReportId(param);
      setReportToEdit(null);
      setActiveTab('reports');
    } else if (tab === 'new-report' && param && typeof param === 'object') {
      setReportToEdit(param as Rapport);
      setSelectedReportId(null);
      setActiveTab('new-report');
    } else {
      setSelectedReportId(null);
      setReportToEdit(null);
      setActiveTab(tab);
    }
  };

  const handleHeaderNewReport = () => {
    setReportToEdit(null);
    setSelectedReportId(null);
    setActiveTab('new-report');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex font-sans">
      {/* Barre latérale */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setSelectedReportId(null);
          setReportToEdit(null);
          setActiveTab(tab);
        }}
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
        isSupabaseConfigured={isDatabaseConfigured}
      />

      {/* Zone de contenu principal */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 transition-all duration-300">
        {/* En-tête supérieur */}
        <Header
          onOpenMobileSidebar={() => setIsOpenMobile(true)}
          onNewReportClick={handleHeaderNewReport}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />

        {/* Corps de la page */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {isLoading && rapports.length === 0 && taches.length === 0 ? (
            <div className="h-96 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              <p className="text-xs font-semibold text-slate-500">
                Chargement des rapports et tâches...
              </p>
            </div>
          ) : (
            <>
              {/* Tableau de bord */}
              {activeTab === 'dashboard' && (
                <DashboardPage
                  rapports={rapports}
                  taches={taches}
                  onNavigate={handleNavigate}
                  onRefreshData={loadData}
                  isLoading={isLoading}
                />
              )}

              {/* Nouveau rapport ou Modification de rapport */}
              {activeTab === 'new-report' && (
                <NewReportPage
                  onReportCreatedOrUpdated={loadData}
                  onNavigate={handleNavigate}
                  reportToEdit={reportToEdit}
                />
              )}

              {/* Tous les rapports ou Fiche détaillée */}
              {activeTab === 'reports' && (
                <>
                  {selectedReportId ? (
                    <ReportDetailPage
                      reportId={selectedReportId}
                      rapports={rapports}
                      taches={taches}
                      onNavigate={handleNavigate}
                      onRefreshData={loadData}
                    />
                  ) : (
                    <ReportsListPage
                      rapports={rapports}
                      taches={taches}
                      onNavigate={handleNavigate}
                      onRefreshData={loadData}
                    />
                  )}
                </>
              )}

              {/* Gestion de toutes les tâches */}
              {activeTab === 'tasks' && (
                <TasksPage
                  taches={taches}
                  rapports={rapports}
                  onNavigate={handleNavigate}
                  onRefreshData={loadData}
                />
              )}

              {/* Statistiques et analyses détaillées */}
              {activeTab === 'stats' && (
                <StatisticsPage
                  rapports={rapports}
                  taches={taches}
                />
              )}

              {/* Paramètres de l'application */}
              {activeTab === 'settings' && (
                <SettingsPage onRefreshData={loadData} />
              )}
            </>
          )}
        </main>
      </div>

      {/* Modal d'authentification */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </NotificationProvider>
  );
}
