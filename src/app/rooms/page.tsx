/**
 * RoomsPage - Répartition en salles
 * 
 * Permet de:
 * - Définir le nombre de salles
 * - Définir la capacité par salle
 * - Choisir le critère de répartition
 * - Visualiser et exporter les listes
 */

import { PageContainer } from '@/components/layout';
import { EmptyState } from '@/components/common';
import { Button } from '@/components/ui/button';
import { DoorOpen, Settings2 } from 'lucide-react';
import { useExamStore } from '@/stores/examStore';

export function RoomsPage() {
  const { candidatesCount } = useExamStore();
  const hasStudents = candidatesCount > 0;

  const handleConfigureRooms = () => {
    // TODO: Ouvrir modal de configuration
    console.log('Configurer les salles');
  };

  return (
    <PageContainer
      description="Répartissez les candidats dans les salles d'examen selon vos critères."
      action={
        hasStudents && (
          <Button onClick={handleConfigureRooms}>
            <Settings2 className="h-4 w-4 mr-2" />
            Configurer les salles
          </Button>
        )
      }
    >
      {hasStudents ? (
        // TODO: Afficher la configuration et les listes de salles
        <div className="space-y-4">
          <div className="border rounded-md p-4">
            <p className="text-sm text-muted-foreground mb-4">
              Configurez le nombre de salles et la capacité, puis choisissez le critère de répartition:
            </p>
            <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
              <li><strong>Alphabétique</strong> - Par ordre alphabétique des noms</li>
              <li><strong>Par établissement</strong> - Regrouper les élèves du même établissement</li>
              <li><strong>Mixte</strong> - Mélanger les établissements</li>
            </ul>
          </div>
        </div>
      ) : (
        <EmptyState
          title="Aucun candidat à répartir"
          description="Ajoutez d'abord des élèves pour pouvoir les répartir en salles."
          icon={DoorOpen}
        />
      )}
    </PageContainer>
  );
}
