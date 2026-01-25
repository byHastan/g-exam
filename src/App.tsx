/**
 * App - Composant racine de l'application
 * 
 * Structure:
 * - Layout global avec Sidebar + Header
 * - Système de navigation via Zustand
 * - Rendu conditionnel des pages
 */

import { Sidebar, Header } from '@/components/layout';
import { useNavigationStore } from '@/stores/navigationStore';
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
};

function App() {
  const { currentPage } = useNavigationStore();
  
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
          <PageComponent />
        </main>
      </div>
    </div>
  );
}

export default App;
