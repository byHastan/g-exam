/**
 * RankingsPage - Classements
 *
 * Affiche:
 * - Classement des élèves par moyenne
 * - Classement des établissements par taux de réussite
 */

import { useMemo } from 'react';
import { PageContainer } from '@/components/layout';
import { EmptyState } from '@/components/common';
import { Trophy, Medal, Award } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useStudentsStore,
  useSubjectsStore,
  useScoresStore,
  useSchoolsStore,
  useExamStore,
} from '@/stores';
import { rankStudents } from '@/core/rankings/studentRanking';
import { rankSchools } from '@/core/rankings/schoolRanking';

export function RankingsPage() {
  const { students } = useStudentsStore();
  const { subjects } = useSubjectsStore();
  const { schools } = useSchoolsStore();
  const { passingGrade } = useExamStore();
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

  // Calculer les résultats des élèves
  const studentResults = useMemo(() => {
    return students
      .map((student) => {
        const average = calculateAverage(student.id, subjectsForCalc);
        return {
          studentId: String(student.id),
          schoolId: String(student.schoolId),
          average: average ?? 0,
          admitted: average !== null && average >= passingGrade,
          student,
        };
      })
      .filter((r) => r.average > 0); // Seulement les élèves avec des notes
  }, [students, calculateAverage, subjectsForCalc, passingGrade]);

  // Classement des élèves
  const rankedStudents = useMemo(() => {
    const results = studentResults.map((r) => ({
      studentId: r.studentId,
      average: r.average,
    }));
    return rankStudents(results);
  }, [studentResults]);

  // Classement des établissements
  const rankedSchools = useMemo(() => {
    const results = studentResults.map((r) => ({
      studentId: r.studentId,
      schoolId: r.schoolId,
      average: r.average,
      admitted: r.admitted,
    }));
    return rankSchools(results);
  }, [studentResults]);

  // Helper pour obtenir les infos d'un élève
  const getStudentInfo = (studentId: string) => {
    const result = studentResults.find((r) => r.studentId === studentId);
    return result?.student;
  };

  // Helper pour obtenir le nom d'un établissement
  const getSchoolName = (schoolId: string) => {
    return schools.find((s) => s.id === parseInt(schoolId))?.name || 'Inconnu';
  };

  // Helper pour obtenir le nom de l'établissement d'un élève
  const getStudentSchool = (studentId: string) => {
    const student = getStudentInfo(studentId);
    if (!student) return 'Inconnu';
    return getSchoolName(String(student.schoolId));
  };

  // Icône de rang
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return null;
    }
  };

  const hasResults = rankedStudents.length > 0;

  return (
    <PageContainer description="Consultez les classements des élèves et des établissements.">
      {hasResults ? (
        <Tabs defaultValue="students" className="w-full">
          <TabsList>
            <TabsTrigger value="students">
              Élèves ({rankedStudents.length})
            </TabsTrigger>
            <TabsTrigger value="schools">
              Établissements ({rankedSchools.length})
            </TabsTrigger>
          </TabsList>

          {/* Classement des élèves */}
          <TabsContent value="students" className="mt-4">
            <div className="space-y-4">
              {/* Podium */}
              {rankedStudents.length >= 3 && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {/* 2ème place */}
                  <Card className="text-center border-gray-300">
                    <CardHeader className="pb-2">
                      <Medal className="h-8 w-8 mx-auto text-gray-400" />
                      <CardTitle className="text-lg">2ème</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {rankedStudents.filter((s) => s.rank === 2).map((s) => {
                        const student = getStudentInfo(s.studentId);
                        return (
                          <div key={s.studentId}>
                            <p className="font-medium">
                              {student?.lastName} {student?.firstName}
                            </p>
                            <p className="text-2xl font-bold text-gray-600">
                              {s.average.toFixed(2)}
                            </p>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>

                  {/* 1ère place */}
                  <Card className="text-center border-yellow-400 bg-yellow-50">
                    <CardHeader className="pb-2">
                      <Trophy className="h-10 w-10 mx-auto text-yellow-500" />
                      <CardTitle className="text-xl">1er</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {rankedStudents.filter((s) => s.rank === 1).map((s) => {
                        const student = getStudentInfo(s.studentId);
                        return (
                          <div key={s.studentId}>
                            <p className="font-medium">
                              {student?.lastName} {student?.firstName}
                            </p>
                            <p className="text-3xl font-bold text-yellow-600">
                              {s.average.toFixed(2)}
                            </p>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>

                  {/* 3ème place */}
                  <Card className="text-center border-amber-400">
                    <CardHeader className="pb-2">
                      <Award className="h-8 w-8 mx-auto text-amber-600" />
                      <CardTitle className="text-lg">3ème</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {rankedStudents.filter((s) => s.rank === 3).map((s) => {
                        const student = getStudentInfo(s.studentId);
                        return (
                          <div key={s.studentId}>
                            <p className="font-medium">
                              {student?.lastName} {student?.firstName}
                            </p>
                            <p className="text-2xl font-bold text-amber-700">
                              {s.average.toFixed(2)}
                            </p>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Table complète */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Rang</TableHead>
                      <TableHead>Candidat</TableHead>
                      <TableHead>Établissement</TableHead>
                      <TableHead className="text-center">Moyenne</TableHead>
                      <TableHead className="text-center">Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankedStudents.map((ranked) => {
                      const student = getStudentInfo(ranked.studentId);
                      const admitted = ranked.average >= passingGrade;
                      return (
                        <TableRow key={ranked.studentId}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getRankIcon(ranked.rank)}
                              <span
                                className={
                                  ranked.rank <= 3 ? 'font-bold' : ''
                                }
                              >
                                {ranked.rank}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {student?.lastName} {student?.firstName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {student?.candidateNumber}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {getStudentSchool(ranked.studentId)}
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`font-bold ${
                                admitted ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {ranked.average.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            {admitted ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                Admis
                              </Badge>
                            ) : (
                              <Badge variant="destructive">Ajourné</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* Classement des établissements */}
          <TabsContent value="schools" className="mt-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Rang</TableHead>
                    <TableHead>Établissement</TableHead>
                    <TableHead className="text-center">Candidats</TableHead>
                    <TableHead className="text-center">Admis</TableHead>
                    <TableHead className="text-center">Taux de réussite</TableHead>
                    <TableHead className="text-center">Moyenne</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rankedSchools.map((school) => (
                    <TableRow key={school.schoolId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRankIcon(school.rank)}
                          <span className={school.rank <= 3 ? 'font-bold' : ''}>
                            {school.rank}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {getSchoolName(school.schoolId)}
                      </TableCell>
                      <TableCell className="text-center">{school.total}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{school.admitted}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`font-bold ${
                            school.successRate >= 50
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {school.successRate.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {school.average.toFixed(2)}
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
          title="Aucun résultat disponible"
          description="Les classements seront disponibles après la saisie des notes."
          icon={Trophy}
        />
      )}
    </PageContainer>
  );
}
