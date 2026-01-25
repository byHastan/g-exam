/**
 * ScoresPage - Saisie des notes
 * 
 * Permet de:
 * - Saisir les notes par élève et par épreuve
 * - Voir la moyenne automatique
 * - Filtrer par établissement/épreuve
 */

import { PageContainer } from '@/components/layout';
import { EmptyState } from '@/components/common';
import { PenLine } from 'lucide-react';
import { useExamStore } from '@/stores/examStore';

export function ScoresPage() {
  const { candidatesCount, subjectsCount } = useExamStore();

  // Vérifier si les prérequis sont remplis
  const hasPrerequisites = candidatesCount > 0 && subjectsCount > 0;

  return (
    <PageContainer
      description="Saisissez les notes des candidats pour chaque épreuve. La moyenne est calculée automatiquement."
    >
      {hasPrerequisites ? (
        // TODO: Afficher le formulaire de saisie des notes
        <div>Formulaire de saisie des notes</div>
      ) : (
        <EmptyState
          title="Saisie impossible"
          description={
            candidatesCount === 0
              ? "Ajoutez d'abord des élèves avant de saisir les notes."
              : "Définissez d'abord les épreuves avant de saisir les notes."
          }
          icon={PenLine}
        />
      )}
    </PageContainer>
  );
}
