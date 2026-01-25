/**
 * RankingsPage - Classements
 * 
 * Affiche:
 * - Classement des élèves par moyenne
 * - Classement des établissements par taux de réussite
 */

import { PageContainer } from '@/components/layout';
import { EmptyState } from '@/components/common';
import { Trophy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useExamStore } from '@/stores/examStore';

export function RankingsPage() {
  const { passedCount, failedCount } = useExamStore();
  const hasResults = passedCount > 0 || failedCount > 0;

  return (
    <PageContainer
      description="Consultez les classements des élèves et des établissements."
    >
      {hasResults ? (
        <Tabs defaultValue="students" className="w-full">
          <TabsList>
            <TabsTrigger value="students">Élèves</TabsTrigger>
            <TabsTrigger value="schools">Établissements</TabsTrigger>
          </TabsList>
          <TabsContent value="students" className="mt-4">
            {/* TODO: Table de classement des élèves */}
            <div className="border rounded-md p-4">
              Classement des élèves par moyenne décroissante
            </div>
          </TabsContent>
          <TabsContent value="schools" className="mt-4">
            {/* TODO: Table de classement des établissements */}
            <div className="border rounded-md p-4">
              Classement des établissements par taux de réussite
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <EmptyState
          title="Aucun résultat disponible"
          description="Les classements seront disponibles après la saisie des notes."
          icon={Trophy}
        />
      )}
    </PageContainer>
  );
}
