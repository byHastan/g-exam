/**
 * StudentsPage - Gestion des élèves/candidats
 * 
 * Permet de:
 * - Lister les élèves
 * - Importer via Excel
 * - Ajouter manuellement
 * - Modifier/Supprimer
 * - Rechercher et filtrer
 */

import { PageContainer } from '@/components/layout';
import { EmptyState } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Users, Plus, Upload } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function StudentsPage() {
  // TODO: Connecter au store des élèves
  const students: unknown[] = [];

  const handleAddStudent = () => {
    // TODO: Ouvrir modal de création
    console.log('Ajouter un élève');
  };

  const handleImportExcel = () => {
    // TODO: Ouvrir modal d'import
    console.log('Importer Excel');
  };

  return (
    <PageContainer
      description="Gérez la liste des candidats. Vous pouvez importer un fichier Excel ou ajouter les élèves manuellement."
      action={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter des élèves
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleAddStudent}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter manuellement
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleImportExcel}>
              <Upload className="h-4 w-4 mr-2" />
              Importer un fichier Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      }
    >
      {students.length > 0 ? (
        // TODO: Afficher la table des élèves avec recherche
        <div>Table des élèves</div>
      ) : (
        <EmptyState
          title="Aucun élève inscrit"
          description="Importez un fichier Excel ou ajoutez les élèves manuellement pour commencer."
          icon={Users}
          actionLabel="Ajouter un élève"
          onAction={handleAddStudent}
        />
      )}
    </PageContainer>
  );
}
