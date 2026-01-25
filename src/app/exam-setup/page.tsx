/**
 * ExamSetupPage - Configuration de l'examen
 * 
 * Permet de:
 * - Créer un nouvel examen
 * - Définir le nom, l'année, le seuil de réussite
 * - Verrouiller/déverrouiller l'examen
 */

import { PageContainer } from '@/components/layout';
import { EmptyState } from '@/components/common';
import { Button } from '@/components/ui/button';
import { useExamStore } from '@/stores/examStore';
import { Settings, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function ExamSetupPage() {
  const { examName, examYear, status, passingGrade, setExam } = useExamStore();
  const hasExam = examName && examYear;

  // Fonction temporaire pour créer un examen de test
  const handleCreateExam = () => {
    setExam('CEPE', 2026);
  };

  return (
    <PageContainer
      description="Configurez les paramètres de l'examen: nom, année scolaire, seuil de réussite."
      action={
        hasExam ? (
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        ) : (
          <Button onClick={handleCreateExam}>
            <Plus className="h-4 w-4 mr-2" />
            Créer un examen
          </Button>
        )
      }
    >
      {hasExam ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nom de l'examen</CardTitle>
              <CardDescription>Identifiant de l'examen</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{examName}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Année scolaire</CardTitle>
              <CardDescription>Session de l'examen</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{examYear}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Seuil de réussite</CardTitle>
              <CardDescription>Moyenne minimale pour être admis</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{passingGrade}/20</p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-base">Statut de l'examen</CardTitle>
              <CardDescription>
                Un examen verrouillé ne peut plus être modifié
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <Badge variant={status === 'locked' ? 'default' : 'secondary'}>
                {status === 'locked' ? 'Verrouillé' : 'Brouillon'}
              </Badge>
              <Button variant="outline" size="sm">
                {status === 'locked' ? 'Déverrouiller' : 'Verrouiller'}
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <EmptyState
          title="Aucun examen configuré"
          description="Créez un examen pour commencer à gérer les candidats, les épreuves et les notes."
          icon={Settings}
          actionLabel="Créer un examen"
          onAction={handleCreateExam}
        />
      )}
    </PageContainer>
  );
}
