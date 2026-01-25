/**
 * Dashboard - Page d'accueil
 * 
 * Affiche les indicateurs clés de l'examen:
 * - Nombre de candidats
 * - Nombre d'épreuves
 * - Admis / Ajournés
 * - Taux de réussite
 * 
 * UX: Vue d'ensemble rapide, informations essentielles uniquement
 */

import { PageContainer } from '@/components/layout';
import { StatCard } from '@/components/common';
import { useExamStore } from '@/stores/examStore';
import { Users, FileText, CheckCircle, XCircle, Percent } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DashboardPage() {
  const {
    candidatesCount,
    subjectsCount,
    passedCount,
    failedCount,
    examName,
  } = useExamStore();

  // Calcul du taux de réussite
  const totalResults = passedCount + failedCount;
  const successRate = totalResults > 0
    ? Math.round((passedCount / totalResults) * 100)
    : 0;

  return (
    <PageContainer
      description="Vue d'ensemble de l'examen en cours. Les statistiques sont mises à jour automatiquement."
    >
      {/* Grille des indicateurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Candidats"
          value={candidatesCount}
          icon={Users}
          subtitle="inscrits à l'examen"
          variant="default"
        />
        
        <StatCard
          title="Épreuves"
          value={subjectsCount}
          icon={FileText}
          subtitle="matières configurées"
          variant="default"
        />
        
        <StatCard
          title="Admis"
          value={passedCount}
          icon={CheckCircle}
          subtitle={`sur ${totalResults} résultats`}
          variant="success"
        />
        
        <StatCard
          title="Ajournés"
          value={failedCount}
          icon={XCircle}
          subtitle={`sur ${totalResults} résultats`}
          variant="danger"
        />
      </div>

      {/* Carte du taux de réussite */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taux de réussite global
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Percent className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">{successRate}%</p>
                <p className="text-xs text-muted-foreground">
                  {totalResults > 0 
                    ? `${passedCount} admis sur ${totalResults} candidats`
                    : 'Aucun résultat disponible'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Carte d'information sur l'examen */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Guide de démarrage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {examName ? (
              <div className="space-y-3">
                <p className="text-sm">
                  L'examen <strong>{examName}</strong> est configuré. Voici les prochaines étapes:
                </p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Ajoutez les établissements participants</li>
                  <li>Importez ou saisissez les élèves</li>
                  <li>Configurez les épreuves et coefficients</li>
                  <li>Saisissez les notes</li>
                  <li>Consultez les classements et statistiques</li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Bienvenue dans Exam Manager. Pour commencer:
                </p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Allez dans <strong>Configuration</strong> pour créer un examen</li>
                  <li>Définissez l'année et le seuil de réussite</li>
                  <li>Ajoutez les établissements et élèves</li>
                </ol>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
