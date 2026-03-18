/**
 * App - Composant racine de l'application
 * 
 * Structure:
 * - Écran de verrouillage si l'app n'est pas déverrouillée
 * - Layout global avec Sidebar + Header
 * - Système de navigation via Zustand
 * - Rendu conditionnel des pages
 */

import { LockScreen } from '@/components/security';
import { Sidebar, Header } from '@/components/layout';
import { useNavigationStore } from '@/stores/navigationStore';
import { useSecurityStore } from '@/stores';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Toaster } from 'sonner';
import type { PageId } from '@/types/navigation';

// Import des pages
import { DashboardPage } from '@/app/dashboard';
import { ExamSetupPage } from '@/app/exam-setup';
import { SchoolsPage } from '@/app/schools';
import { StudentsPage } from '@/app/students';
import { SubjectsPage } from '@/app/subjects';
import { ScoresPage } from '@/app/scores';
import { RankingsPage } from '@/app/rankings';
import { StatisticsPage } from '@/app/statistics';
import { RoomsPage } from '@/app/rooms';
import { ExportsPage } from '@/app/exports';
import { AdminPage } from '@/app/admin';

// Map des composants de page par ID
const PAGES: Record<PageId, React.ComponentType> = {
  dashboard: DashboardPage,
  'exam-setup': ExamSetupPage,
  schools: SchoolsPage,
  students: StudentsPage,
  subjects: SubjectsPage,
  scores: ScoresPage,
  rankings: RankingsPage,
  statistics: StatisticsPage,
  rooms: RoomsPage,
  exports: ExportsPage,
  admin: AdminPage,
};

function App() {
  const { currentPage } = useNavigationStore();
  const { isAppUnlocked } = useSecurityStore();

  // Raccourcis clavier globaux
  useKeyboardShortcuts();
  
  // Afficher l'écran de verrouillage si l'app n'est pas déverrouillée
  if (!isAppUnlocked) {
    return (
      <>
        <LockScreen />
        <Toaster position="top-right" richColors closeButton />
      </>
    );
  }

  // Récupérer le composant de la page courante
  const PageComponent = PAGES[currentPage];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar de navigation - fixe à gauche */}
      <Sidebar />

      {/* Zone principale */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header avec titre et infos examen */}
        <Header />

        {/* Contenu de la page - scrollable */}
        <main className="flex-1 overflow-auto p-6">
          <div
            key={currentPage}
            className="h-full animate-in fade-in slide-in-from-bottom-1 duration-200"
          >
            <PageComponent />
          </div>
        </main>
      </div>

      {/* Notifications toast globales */}
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}

export default App;
