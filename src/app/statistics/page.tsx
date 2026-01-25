/**
 * StatisticsPage - Statistiques et graphiques
 *
 * Affiche:
 * - Statistiques globales
 * - Statistiques par épreuve
 * - Graphiques de distribution
 */

import { useMemo } from 'react';
import { PageContainer } from '@/components/layout';
import { EmptyState } from '@/components/common';
import { BarChart3, TrendingUp, TrendingDown, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  useStudentsStore,
  useSubjectsStore,
  useScoresStore,
  useSchoolsStore,
  useExamStore,
} from '@/stores';
import { generateGlobalStats } from '@/core/statistics/globalStats';
import { generateSubjectStats } from '@/core/statistics/subjectStats';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = ['#22c55e', '#ef4444'];

export function StatisticsPage() {
  const { students } = useStudentsStore();
  const { subjects } = useSubjectsStore();
  const { schools } = useSchoolsStore();
  const { passingGrade } = useExamStore();
  const { scores, calculateAverage } = useScoresStore();

  // Préparer les sujets pour le calcul
  const subjectsForCalc = useMemo(
    () =>
      subjects.map((s) => ({
        id: s.id,
        coefficient: s.coefficient,
      })),
    [subjects]
  );

  // Calculer les résultats des élèves pour les stats globales
  const studentResults = useMemo(() => {
    return students
      .map((student) => {
        const average = calculateAverage(student.id, subjectsForCalc);
        return {
          average: average ?? 0,
          admitted: average !== null && average >= passingGrade,
        };
      })
      .filter((r) => r.average > 0);
  }, [students, calculateAverage, subjectsForCalc, passingGrade]);

  // Statistiques globales
  const globalStats = useMemo(() => {
    return generateGlobalStats(studentResults);
  }, [studentResults]);

  // Statistiques par épreuve
  const subjectStats = useMemo(() => {
    const scoresData = scores.map((s) => ({
      subjectId: String(s.subjectId),
      score: s.value,
    }));
    return generateSubjectStats(scoresData);
  }, [scores]);

  // Helper pour obtenir le nom d'une épreuve
  const getSubjectName = (subjectId: string) => {
    return subjects.find((s) => s.id === parseInt(subjectId))?.name || 'Inconnu';
  };

  // Données pour le graphique camembert
  const pieData = useMemo(() => {
    if (globalStats.totalCandidates === 0) return [];
    return [
      { name: 'Admis', value: globalStats.admitted },
      { name: 'Ajournés', value: globalStats.failed },
    ];
  }, [globalStats]);

  // Données pour le graphique des épreuves
  const subjectChartData = useMemo(() => {
    return subjectStats.map((stat) => {
      const subject = subjects.find((s) => s.id === parseInt(stat.subjectId));
      return {
        name: subject?.name || 'Inconnu',
        moyenne: stat.average,
        min: stat.minScore,
        max: stat.maxScore,
      };
    });
  }, [subjectStats, subjects]);

  // Statistiques par établissement
  const schoolStats = useMemo(() => {
    const statsMap = new Map<
      number,
      { total: number; admitted: number; sumAvg: number }
    >();

    students.forEach((student) => {
      const average = calculateAverage(student.id, subjectsForCalc);
      if (average === null) return;

      const existing = statsMap.get(student.schoolId) || {
        total: 0,
        admitted: 0,
        sumAvg: 0,
      };
      existing.total++;
      existing.sumAvg += average;
      if (average >= passingGrade) {
        existing.admitted++;
      }
      statsMap.set(student.schoolId, existing);
    });

    return Array.from(statsMap.entries()).map(([schoolId, data]) => ({
      schoolId,
      schoolName:
        schools.find((s) => s.id === schoolId)?.name || 'Inconnu',
      total: data.total,
      admitted: data.admitted,
      successRate:
        data.total > 0 ? Math.round((data.admitted / data.total) * 100) : 0,
      average: data.total > 0 ? Math.round((data.sumAvg / data.total) * 100) / 100 : 0,
    }));
  }, [students, calculateAverage, subjectsForCalc, passingGrade, schools]);

  const hasResults = globalStats.totalCandidates > 0;

  return (
    <PageContainer description="Analysez les résultats de l'examen avec des statistiques détaillées et des graphiques.">
      {hasResults ? (
        <Tabs defaultValue="global" className="w-full">
          <TabsList>
            <TabsTrigger value="global">Vue globale</TabsTrigger>
            <TabsTrigger value="subjects">Par épreuve</TabsTrigger>
            <TabsTrigger value="schools">Par établissement</TabsTrigger>
          </TabsList>

          {/* Statistiques globales */}
          <TabsContent value="global" className="mt-4 space-y-6">
            {/* Cartes de stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total candidats
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {globalStats.totalCandidates}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Taux de réussite
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {globalStats.successRate}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {globalStats.admitted} admis / {globalStats.failed} ajournés
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Meilleure moyenne
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {globalStats.maxAverage.toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Plus faible moyenne
                  </CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {globalStats.minAverage.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Graphiques */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Camembert admis/ajournés */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Répartition des résultats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`
                          }
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Stats supplémentaires */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Résumé statistique</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm">Moyenne générale</span>
                    <span className="font-bold text-lg">
                      {globalStats.overallAverage.toFixed(2)}/20
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm">Candidats admis</span>
                    <Badge className="bg-green-100 text-green-800">
                      {globalStats.admitted}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-sm">Candidats ajournés</span>
                    <Badge variant="destructive">{globalStats.failed}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm">Seuil de réussite</span>
                    <span className="font-medium">{passingGrade}/20</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Statistiques par épreuve */}
          <TabsContent value="subjects" className="mt-4 space-y-6">
            {/* Graphique en barres */}
            {subjectChartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Moyennes par épreuve
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={subjectChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 20]} />
                        <Tooltip />
                        <Bar dataKey="moyenne" fill="#3b82f6" name="Moyenne" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Table détaillée */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Épreuve</TableHead>
                    <TableHead className="text-center">Notes</TableHead>
                    <TableHead className="text-center">Moyenne</TableHead>
                    <TableHead className="text-center">Min</TableHead>
                    <TableHead className="text-center">Max</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjectStats.map((stat) => (
                    <TableRow key={stat.subjectId}>
                      <TableCell className="font-medium">
                        {getSubjectName(stat.subjectId)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{stat.count}</Badge>
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {stat.average.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center text-red-600">
                        {stat.minScore.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center text-green-600">
                        {stat.maxScore.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Statistiques par établissement */}
          <TabsContent value="schools" className="mt-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Établissement</TableHead>
                    <TableHead className="text-center">Candidats</TableHead>
                    <TableHead className="text-center">Admis</TableHead>
                    <TableHead className="text-center">Taux de réussite</TableHead>
                    <TableHead className="text-center">Moyenne</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schoolStats
                    .sort((a, b) => b.successRate - a.successRate)
                    .map((stat) => (
                      <TableRow key={stat.schoolId}>
                        <TableCell className="font-medium">
                          {stat.schoolName}
                        </TableCell>
                        <TableCell className="text-center">{stat.total}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{stat.admitted}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`font-bold ${
                              stat.successRate >= 50
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {stat.successRate}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {stat.average.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <EmptyState
          title="Aucune statistique disponible"
          description="Les statistiques seront générées après la saisie des notes."
          icon={BarChart3}
        />
      )}
    </PageContainer>
  );
}
