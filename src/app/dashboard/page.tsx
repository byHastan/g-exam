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

import { useMemo } from 'react';
import { PageContainer } from '@/components/layout';
import { StatCard } from '@/components/common';
import {
  useExamStore,
  useStudentsStore,
  useSubjectsStore,
  useScoresStore,
  useSchoolsStore,
} from '@/stores';
import { Users, FileText, CheckCircle, XCircle, Percent, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DashboardPage() {
  const { examName, passingGrade } = useExamStore();
  const { students } = useStudentsStore();
  const { subjects } = useSubjectsStore();
  const { schools } = useSchoolsStore();
  const { calculateAverage } = useScoresStore();

  // Préparer les sujets pour le calcul
  const subjectsForCalc = useMemo(
    () =>
      subjects.map((s) => ({
        id: s.id,
        coefficient: s.coefficient,
      })),
    [subjects]
  );

  // Calculer les statistiques
  const stats = useMemo(() => {
    let passed = 0;
    let failed = 0;
    let withAverage = 0;

    students.forEach((student) => {
      const average = calculateAverage(student.id, subjectsForCalc);
      if (average !== null) {
        withAverage++;
        if (average >= passingGrade) {
          passed++;
        } else {
          failed++;
        }
      }
    });

    const totalResults = passed + failed;
    const successRate = totalResults > 0 ? Math.round((passed / totalResults) * 100) : 0;

    return {
      candidatesCount: students.length,
      subjectsCount: subjects.length,
      schoolsCount: schools.length,
      passedCount: passed,
      failedCount: failed,
      withAverageCount: withAverage,
      successRate,
    };
  }, [students, subjects, schools, calculateAverage, subjectsForCalc, passingGrade]);

  const totalResults = stats.passedCount + stats.failedCount;

  return (
    <PageContainer description="Vue d'ensemble de l'examen en cours. Les statistiques sont mises à jour automatiquement.">
      {/* Grille des indicateurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Candidats"
          value={stats.candidatesCount}
          icon={Users}
          subtitle="inscrits à l'examen"
          variant="default"
        />

        <StatCard
          title="Épreuves"
          value={stats.subjectsCount}
          icon={FileText}
          subtitle="matières configurées"
          variant="default"
        />

        <StatCard
          title="Admis"
          value={stats.passedCount}
          icon={CheckCircle}
          subtitle={`sur ${totalResults} résultats`}
          variant="success"
        />

        <StatCard
          title="Ajournés"
          value={stats.failedCount}
          icon={XCircle}
          subtitle={`sur ${totalResults} résultats`}
          variant="danger"
        />
      </div>

      {/* Cartes d'information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Taux de réussite */}
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
                <p className="text-3xl font-bold">{stats.successRate}%</p>
                <p className="text-xs text-muted-foreground">
                  {totalResults > 0
                    ? `${stats.passedCount} admis sur ${totalResults} candidats`
                    : 'Aucun résultat disponible'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Établissements */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Établissements participants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.schoolsCount}</p>
                <p className="text-xs text-muted-foreground">
                  établissement{stats.schoolsCount > 1 ? 's' : ''} inscrit
                  {stats.schoolsCount > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guide de démarrage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Guide de démarrage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {examName ? (
              <div className="space-y-3">
                <p className="text-sm">
                  L'examen <strong>{examName}</strong> est configuré. Voici les
                  prochaines étapes:
                </p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li
                    className={
                      stats.schoolsCount > 0 ? 'line-through opacity-50' : ''
                    }
                  >
                    Ajoutez les établissements participants
                  </li>
                  <li
                    className={
                      stats.candidatesCount > 0 ? 'line-through opacity-50' : ''
                    }
                  >
                    Importez ou saisissez les élèves
                  </li>
                  <li
                    className={
                      stats.subjectsCount > 0 ? 'line-through opacity-50' : ''
                    }
                  >
                    Configurez les épreuves et coefficients
                  </li>
                  <li className={totalResults > 0 ? 'line-through opacity-50' : ''}>
                    Saisissez les notes
                  </li>
                  <li>Consultez les classements et statistiques</li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Bienvenue dans Exam Manager. Pour commencer:
                </p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>
                    Allez dans <strong>Configuration</strong> pour créer un
                    examen
                  </li>
                  <li>Définissez l'année et le seuil de réussite</li>
                  <li>Ajoutez les établissements et élèves</li>
                </ol>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progression de la saisie */}
      {stats.candidatesCount > 0 && stats.subjectsCount > 0 && (
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Progression de la saisie des notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  {stats.withAverageCount} / {stats.candidatesCount} élèves avec
                  des notes
                </span>
                <span className="font-medium">
                  {Math.round((stats.withAverageCount / stats.candidatesCount) * 100)}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{
                    width: `${(stats.withAverageCount / stats.candidatesCount) * 100}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
