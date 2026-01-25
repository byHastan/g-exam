/**
 * SubjectsPage - Gestion des épreuves/matières
 * 
 * Permet de:
 * - Lister les épreuves
 * - Ajouter une épreuve avec coefficient
 * - Modifier/Supprimer
 */

import { PageContainer } from '@/components/layout';
import { EmptyState } from '@/components/common';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';

export function SubjectsPage() {
  // TODO: Connecter au store des épreuves
  const subjects: unknown[] = [];

  const handleAddSubject = () => {
    // TODO: Ouvrir modal de création
    console.log('Ajouter une épreuve');
  };

  return (
    <PageContainer
      description="Définissez les épreuves de l'examen et leurs coefficients."
      action={
        <Button onClick={handleAddSubject}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une épreuve
        </Button>
      }
    >
      {subjects.length > 0 ? (
        // TODO: Afficher la table des épreuves
        <div>Table des épreuves</div>
      ) : (
        <EmptyState
          title="Aucune épreuve définie"
          description="Ajoutez les matières de l'examen avec leurs coefficients respectifs."
          icon={FileText}
          actionLabel="Ajouter une épreuve"
          onAction={handleAddSubject}
        />
      )}
    </PageContainer>
  );
}
