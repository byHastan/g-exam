/**
 * ExportsPage - Exports PDF et Excel
 * 
 * Permet d'exporter:
 * - Liste des candidats
 * - Résultats individuels
 * - Classements
 * - Statistiques
 * - Listes de salles
 */

import { PageContainer } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSpreadsheet, FileText } from 'lucide-react';

// Types d'exports disponibles
const EXPORT_TYPES = [
  {
    id: 'students-list',
    title: 'Liste des candidats',
    description: 'Export de tous les élèves inscrits avec leurs informations',
    formats: ['pdf', 'excel'],
  },
  {
    id: 'results',
    title: 'Résultats individuels',
    description: 'Notes et moyennes de chaque candidat',
    formats: ['pdf', 'excel'],
  },
  {
    id: 'rankings',
    title: 'Classements',
    description: 'Classement des élèves et des établissements',
    formats: ['pdf', 'excel'],
  },
  {
    id: 'statistics',
    title: 'Statistiques',
    description: 'Rapport statistique complet de l\'examen',
    formats: ['pdf'],
  },
  {
    id: 'rooms',
    title: 'Listes de salles',
    description: 'Répartition des candidats par salle',
    formats: ['pdf'],
  },
];

export function ExportsPage() {
  const handleExport = (type: string, format: 'pdf' | 'excel') => {
    // TODO: Implémenter l'export
    console.log(`Export ${type} en ${format}`);
  };

  return (
    <PageContainer
      description="Exportez les données de l'examen en PDF ou Excel pour impression et archivage."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {EXPORT_TYPES.map((exportType) => (
          <Card key={exportType.id}>
            <CardHeader>
              <CardTitle className="text-base">{exportType.title}</CardTitle>
              <CardDescription>{exportType.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              {exportType.formats.includes('pdf') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport(exportType.id, 'pdf')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              )}
              {exportType.formats.includes('excel') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport(exportType.id, 'excel')}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
