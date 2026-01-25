/**
 * SchoolsPage - Gestion des établissements
 * 
 * Permet de:
 * - Lister les établissements
 * - Ajouter un établissement
 * - Modifier/Supprimer un établissement
 */

import { PageContainer } from '@/components/layout';
import { EmptyState } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Building2, Plus } from 'lucide-react';

export function SchoolsPage() {
  // TODO: Connecter au store des établissements
  const schools: unknown[] = [];

  const handleAddSchool = () => {
    // TODO: Ouvrir modal de création
    console.log('Ajouter un établissement');
  };

  return (
    <PageContainer
      description="Gérez les établissements participants à l'examen."
      action={
        <Button onClick={handleAddSchool}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un établissement
        </Button>
      }
    >
      {schools.length > 0 ? (
        // TODO: Afficher la table des établissements
        <div>Table des établissements</div>
      ) : (
        <EmptyState
          title="Aucun établissement"
          description="Ajoutez les établissements qui participent à cet examen."
          icon={Building2}
          actionLabel="Ajouter un établissement"
          onAction={handleAddSchool}
        />
      )}
    </PageContainer>
  );
}
