/**
 * StatisticsPage - Statistiques et graphiques
 * 
 * Affiche:
 * - Statistiques globales
 * - Statistiques par épreuve
 * - Statistiques par établissement
 * - Graphiques de distribution
 */

import { PageContainer } from '@/components/layout';
import { EmptyState } from '@/components/common';
import { BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useExamStore } from '@/stores/examStore';

export function StatisticsPage() {
  const { passedCount, failedCount } = useExamStore();
  const hasResults = passedCount > 0 || failedCount > 0;

  return (
    <PageContainer
      description="Analysez les résultats de l'examen avec des statistiques détaillées et des graphiques."
    >
      {hasResults ? (
        <Tabs defaultValue="global" className="w-full">
          <TabsList>
            <TabsTrigger value="global">Vue globale</TabsTrigger>
            <TabsTrigger value="subjects">Par épreuve</TabsTrigger>
            <TabsTrigger value="schools">Par établissement</TabsTrigger>
          </TabsList>
          <TabsContent value="global" className="mt-4">
            {/* TODO: Statistiques globales avec Recharts */}
            <div className="border rounded-md p-4">
              Statistiques globales (graphique camembert admis/ajournés, distribution des notes)
            </div>
          </TabsContent>
          <TabsContent value="subjects" className="mt-4">
            {/* TODO: Statistiques par épreuve */}
            <div className="border rounded-md p-4">
              Moyenne, min, max par épreuve (graphique en barres)
            </div>
          </TabsContent>
          <TabsContent value="schools" className="mt-4">
            {/* TODO: Statistiques par établissement */}
            <div className="border rounded-md p-4">
              Taux de réussite par établissement (graphique en barres)
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <EmptyState
          title="Aucune statistique disponible"
          description="Les statistiques seront générées après la saisie des notes."
          icon={BarChart3}
        />
      )}
    </PageContainer>
  );
}
