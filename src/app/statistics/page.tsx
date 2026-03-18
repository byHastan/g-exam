/**
 * StatisticsPage - Statistiques et graphiques
 *
 * Affiche:
 * - Statistiques globales
 * - Statistiques par épreuve
 * - Graphiques de distribution
 * - Export PDF et Excel
 */

import { EmptyState } from "@/components/common";
import { PageContainer } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateGlobalStats } from "@/core/statistics/globalStats";
import { generateSubjectStats } from "@/core/statistics/subjectStats";
import {
  exportFullReportToExcel,
  exportResultsToExcel,
  exportResultsToPdf,
  exportSchoolResultsToExcel,
  exportSchoolResultsToPdf,
  exportSchoolStatsToExcel,
  exportSchoolStatsToPdf,
  exportSubjectStatsToExcel,
  exportSubjectStatsToPdf,
  type ExamInfo,
  type ExportStudent,
  type SubjectStats as ExportSubjectStats,
  type SchoolStats,
} from "@/lib/export";
import {
  useExamStore,
  useSchoolsStore,
  useScoresStore,
  useStudentsStore,
  useSubjectsStore,
} from "@/stores";
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#22c55e", "#ef4444"];

export function StatisticsPage() {
  const { students } = useStudentsStore();
  const { subjects } = useSubjectsStore();
  const { schools } = useSchoolsStore();
  const { examName, examYear, passingGrade, maxGrade } = useExamStore();
  const { scores, calculateAverage, getScoresByStudent } = useScoresStore();

  // État pour le chargement pendant l'export
  const [isExporting, setIsExporting] = useState(false);

  // Préparer les sujets pour le calcul (avec maxScore pour la normalisation)
  const subjectsForCalc = useMemo(
    () =>
      subjects.map((s) => ({
        id: s.id,
        coefficient: s.coefficient,
        maxScore: s.maxScore,
      })),
    [subjects],
  );

  // Options pour le calcul de moyenne (barème global)
  const averageOptions = useMemo(() => ({ targetScale: maxGrade }), [maxGrade]);

  // Calculer les résultats des élèves pour les stats globales
  const studentResults = useMemo(() => {
    return students.map((student) => {
      const average = calculateAverage(
        student.id,
        subjectsForCalc,
        averageOptions,
      );
      return {
        average: average ?? 0,
        admitted: average !== null && average >= passingGrade,
        isAbsent: student.isAbsent,
      };
    });
  }, [
    students,
    calculateAverage,
    subjectsForCalc,
    averageOptions,
    passingGrade,
  ]);

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
    return (
      subjects.find((s) => s.id === parseInt(subjectId))?.name || "Inconnu"
    );
  };

  // Données pour le graphique camembert
  const pieData = useMemo(() => {
    if (globalStats.totalCandidates === 0) return [];
    return [
      { name: "Admis", value: globalStats.admitted },
      { name: "Ajournés", value: globalStats.failed },
    ];
  }, [globalStats]);

  // Données pour le graphique des épreuves
  const subjectChartData = useMemo(() => {
    return subjectStats.map((stat) => {
      const subject = subjects.find((s) => s.id === parseInt(stat.subjectId));
      return {
        name: subject?.name || "Inconnu",
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
      const average = calculateAverage(
        student.id,
        subjectsForCalc,
        averageOptions,
      );
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
      schoolName: schools.find((s) => s.id === schoolId)?.name || "Inconnu",
      total: data.total,
      admitted: data.admitted,
      successRate:
        data.total > 0 ? Math.round((data.admitted / data.total) * 100) : 0,
      average:
        data.total > 0 ? Math.round((data.sumAvg / data.total) * 100) / 100 : 0,
    }));
  }, [
    students,
    calculateAverage,
    subjectsForCalc,
    averageOptions,
    passingGrade,
    schools,
  ]);

  // Radar chart data: average per subject per school (top 5 schools by candidates)
  const radarData = useMemo(() => {
    if (subjects.length === 0 || schoolStats.length === 0) return [];

    // Pick top schools (by number of candidates, max 5 for readability)
    const topSchools = [...schoolStats]
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // For each subject, compute average per school
    return subjects.map((subject) => {
      const row: Record<string, string | number> = { subject: subject.name };
      topSchools.forEach((school) => {
        const schoolStudents = students.filter(
          (s) => s.schoolId === school.schoolId && !s.isAbsent,
        );
        const subjectScores = schoolStudents
          .map((st) => {
            const sc = scores.find(
              (s) => s.studentId === st.id && s.subjectId === subject.id && !s.isAbsent,
            );
            return sc ? sc.value : null;
          })
          .filter((v): v is number => v !== null);

        const avg =
          subjectScores.length > 0
            ? subjectScores.reduce((a, b) => a + b, 0) / subjectScores.length
            : 0;
        row[school.schoolName] = Math.round(avg * 100) / 100;
      });
      return row;
    });
  }, [subjects, schoolStats, students, scores]);

  const radarSchoolNames = useMemo(() => {
    return [...schoolStats]
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map((s) => s.schoolName);
  }, [schoolStats]);

  const RADAR_COLORS = [
    '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  ];

  const hasResults = globalStats.totalCandidates > 0;

  // ============================================
  // DONNÉES POUR L'EXPORT
  // ============================================

  // Informations de l'examen pour les exports
  const examInfo: ExamInfo = useMemo(
    () => ({
      name: examName || "Examen",
      year: examYear || new Date().getFullYear(),
      passingGrade,
      maxGrade,
      totalPresent: globalStats.totalPresent,
      totalAbsent: globalStats.totalAbsent,
    }),
    [
      examName,
      examYear,
      passingGrade,
      maxGrade,
      globalStats.totalPresent,
      globalStats.totalAbsent,
    ],
  );

  // Préparer les données des élèves pour l'export
  const exportStudents: ExportStudent[] = useMemo(() => {
    // Calculer les moyennes et trier par rang
    const studentsWithAverage = students.map((student) => {
      const average = calculateAverage(
        student.id,
        subjectsForCalc,
        averageOptions,
      );
      const studentScores = getScoresByStudent(student.id);
      const scoresMap: Record<string, number | null> = {};

      subjects.forEach((s) => {
        const score = studentScores.find((sc) => sc.subjectId === s.id);
        scoresMap[String(s.id)] = score?.value ?? null;
      });

      return {
        ...student,
        average,
        scores: scoresMap,
      };
    });
    // Inclure tous les élèves (présents avec moyenne + absents / en attente)
    const allWithData = studentsWithAverage.concat(
      students
        .filter((s) => !studentsWithAverage.some((w) => w.id === s.id))
        .map((student) => {
          const average = calculateAverage(
            student.id,
            subjectsForCalc,
            averageOptions,
          );
          const studentScores = getScoresByStudent(student.id);
          const scoresMap: Record<string, number | null> = {};
          subjects.forEach((subj) => {
            const score = studentScores.find((sc) => sc.subjectId === subj.id);
            scoresMap[String(subj.id)] = score?.value ?? null;
          });
          return { ...student, average, scores: scoresMap };
        }),
    );

    // Trier : présents avec moyenne par rang, puis absents / en attente
    const presentWithAvg = allWithData.filter(
      (s) => !s.isAbsent && s.average !== null,
    );
    const sortedPresent = [...presentWithAvg].sort(
      (a, b) => (b.average ?? 0) - (a.average ?? 0),
    );
    const rest = allWithData.filter((s) => s.isAbsent || s.average === null);
    const sorted = [...sortedPresent, ...rest];

    return sorted.map((student) => {
      const school = schools.find((s) => s.id === student.schoolId);
      const status: "admitted" | "failed" | "pending" | "absent" =
        student.isAbsent
          ? "absent"
          : student.average === null
            ? "pending"
            : student.average >= passingGrade
              ? "admitted"
              : "failed";
      const rank =
        !student.isAbsent && student.average !== null
          ? sortedPresent.findIndex((s) => s.id === student.id) + 1
          : null;

      return {
        candidateNumber: student.candidateNumber,
        lastName: student.lastName,
        firstName: student.firstName,
        gender: student.gender,
        schoolName: school?.name || "Inconnu",
        scores: student.scores,
        average: student.average,
        rank,
        status,
      };
    });
  }, [
    students,
    subjects,
    schools,
    calculateAverage,
    getScoresByStudent,
    subjectsForCalc,
    averageOptions,
    passingGrade,
  ]);

  // Statistiques d'établissement formatées pour l'export
  const exportSchoolStats: SchoolStats[] = useMemo(() => {
    return schoolStats.map((stat) => ({
      schoolName: stat.schoolName,
      totalCandidates: stat.total,
      admitted: stat.admitted,
      failed: stat.total - stat.admitted,
      successRate: stat.successRate,
      averageGrade: stat.average,
    }));
  }, [schoolStats]);

  // Statistiques d'épreuves formatées pour l'export
  const exportSubjectStats: ExportSubjectStats[] = useMemo(() => {
    return subjectStats.map((stat) => {
      const subject = subjects.find((s) => s.id === parseInt(stat.subjectId));
      return {
        subjectName: subject?.name || "Inconnu",
        coefficient: subject?.coefficient ?? null,
        totalScores: stat.count,
        average: stat.average,
        minScore: stat.minScore,
        maxScore: stat.maxScore,
      };
    });
  }, [subjectStats, subjects]);

  // Sujets formatés pour l'export
  const exportSubjects = useMemo(() => {
    return subjects.map((s) => ({
      id: String(s.id),
      name: s.name,
      coefficient: s.coefficient,
    }));
  }, [subjects]);

  // ============================================
  // FONCTIONS D'EXPORT
  // ============================================

  const handleExport = useCallback(async (exportFn: () => Promise<void>) => {
    setIsExporting(true);
    try {
      await exportFn();
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
    } finally {
      setIsExporting(false);
    }
  }, []);

  // Export résultats complets
  const handleExportResultsExcel = useCallback(() => {
    handleExport(() =>
      exportResultsToExcel(examInfo, exportStudents, exportSubjects, {
        includeScores: true,
        includeRank: true,
        sortBy: "rank",
      }),
    );
  }, [handleExport, examInfo, exportStudents, exportSubjects]);

  const handleExportResultsPdf = useCallback(() => {
    handleExport(() =>
      exportResultsToPdf(examInfo, exportStudents, exportSubjects, {
        includeScores: true,
        includeRank: true,
        sortBy: "rank",
      }),
    );
  }, [handleExport, examInfo, exportStudents, exportSubjects]);

  // Export admis uniquement
  const handleExportAdmittedExcel = useCallback(() => {
    handleExport(() =>
      exportResultsToExcel(examInfo, exportStudents, exportSubjects, {
        includeRank: true,
        sortBy: "rank",
        filterStatus: "admitted",
      }),
    );
  }, [handleExport, examInfo, exportStudents, exportSubjects]);

  const handleExportAdmittedPdf = useCallback(() => {
    handleExport(() =>
      exportResultsToPdf(examInfo, exportStudents, exportSubjects, {
        includeRank: true,
        sortBy: "rank",
        filterStatus: "admitted",
      }),
    );
  }, [handleExport, examInfo, exportStudents, exportSubjects]);

  // Export stats établissements
  const handleExportSchoolStatsExcel = useCallback(() => {
    handleExport(() => exportSchoolStatsToExcel(examInfo, exportSchoolStats));
  }, [handleExport, examInfo, exportSchoolStats]);

  const handleExportSchoolStatsPdf = useCallback(() => {
    handleExport(() => exportSchoolStatsToPdf(examInfo, exportSchoolStats));
  }, [handleExport, examInfo, exportSchoolStats]);

  // Export stats épreuves
  const handleExportSubjectStatsExcel = useCallback(() => {
    handleExport(() => exportSubjectStatsToExcel(examInfo, exportSubjectStats));
  }, [handleExport, examInfo, exportSubjectStats]);

  const handleExportSubjectStatsPdf = useCallback(() => {
    handleExport(() => exportSubjectStatsToPdf(examInfo, exportSubjectStats));
  }, [handleExport, examInfo, exportSubjectStats]);

  // Export rapport complet
  const handleExportFullReportExcel = useCallback(() => {
    handleExport(() =>
      exportFullReportToExcel(
        examInfo,
        exportStudents,
        exportSubjects,
        exportSchoolStats,
        exportSubjectStats,
      ),
    );
  }, [
    handleExport,
    examInfo,
    exportStudents,
    exportSubjects,
    exportSchoolStats,
    exportSubjectStats,
  ]);

  // Export résultats par établissement
  const handleExportSchoolResultsExcel = useCallback(
    (schoolName: string) => {
      handleExport(() =>
        exportSchoolResultsToExcel(
          examInfo,
          exportStudents,
          exportSubjects,
          schoolName,
          { includeScores: true, includeRank: true, sortBy: "rank" },
        ),
      );
    },
    [handleExport, examInfo, exportStudents, exportSubjects],
  );

  const handleExportSchoolResultsPdf = useCallback(
    (schoolName: string) => {
      handleExport(() =>
        exportSchoolResultsToPdf(
          examInfo,
          exportStudents,
          exportSubjects,
          schoolName,
          { includeScores: true, includeRank: true, sortBy: "rank" },
        ),
      );
    },
    [handleExport, examInfo, exportStudents, exportSubjects],
  );

  return (
    <PageContainer description="Analysez les résultats de l'examen avec des statistiques détaillées et des graphiques.">
      {hasResults ? (
        <Tabs defaultValue="global" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="global">Vue globale</TabsTrigger>
              <TabsTrigger value="subjects">Par épreuve</TabsTrigger>
              <TabsTrigger value="schools">Par établissement</TabsTrigger>
            </TabsList>

            {/* Menu d'export */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isExporting}>
                  {isExporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Exporter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Rapport complet</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleExportFullReportExcel}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Rapport complet (Excel)
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Résultats</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleExportResultsExcel}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Tous les résultats (Excel)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportResultsPdf}>
                  <FileText className="mr-2 h-4 w-4" />
                  Tous les résultats (PDF)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportAdmittedExcel}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Liste des admis (Excel)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportAdmittedPdf}>
                  <FileText className="mr-2 h-4 w-4" />
                  Liste des admis (PDF)
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Statistiques</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleExportSchoolStatsExcel}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Par établissement (Excel)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportSchoolStatsPdf}>
                  <FileText className="mr-2 h-4 w-4" />
                  Par établissement (PDF)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportSubjectStatsExcel}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Par épreuve (Excel)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportSubjectStatsPdf}>
                  <FileText className="mr-2 h-4 w-4" />
                  Par épreuve (PDF)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

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
                  <p className="text-xs text-muted-foreground">
                    {globalStats.totalPresent} présent(s) /{" "}
                    {globalStats.totalAbsent} absent(s)
                  </p>
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
                  <CardTitle className="text-base">
                    Résumé statistique
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm">Moyenne générale</span>
                    <span className="font-bold text-lg">
                      {globalStats.overallAverage.toFixed(2)}/{maxGrade}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm">Candidats présents</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {globalStats.totalPresent}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="text-sm">Candidats absents</span>
                    <Badge className="bg-orange-100 text-orange-800">
                      {globalStats.totalAbsent}
                    </Badge>
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
                    <span className="font-medium">
                      {passingGrade}/{maxGrade}
                    </span>
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
                        <YAxis domain={[0, maxGrade]} />
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
          <TabsContent value="schools" className="mt-4 space-y-6">
            {/* Radar chart : comparaison inter-établissements par matière */}
            {radarData.length > 0 && radarSchoolNames.length >= 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Comparaison par matière (top {radarSchoolNames.length} établissements)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                        <PolarRadiusAxis angle={90} domain={[0, 'auto']} tick={{ fontSize: 10 }} />
                        {radarSchoolNames.map((name, i) => (
                          <Radar
                            key={name}
                            name={name}
                            dataKey={name}
                            stroke={RADAR_COLORS[i % RADAR_COLORS.length]}
                            fill={RADAR_COLORS[i % RADAR_COLORS.length]}
                            fillOpacity={0.1}
                          />
                        ))}
                        <Legend />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Établissement</TableHead>
                    <TableHead className="text-center">Candidats</TableHead>
                    <TableHead className="text-center">Admis</TableHead>
                    <TableHead className="text-center">
                      Taux de réussite
                    </TableHead>
                    <TableHead className="text-center">Moyenne</TableHead>
                    <TableHead className="text-center">Exporter</TableHead>
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
                        <TableCell className="text-center">
                          {stat.total}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{stat.admitted}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`font-bold ${
                              stat.successRate >= 50
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {stat.successRate}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {stat.average.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={isExporting}
                              >
                                {isExporting ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>
                                Exporter {stat.schoolName}
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  handleExportSchoolResultsExcel(
                                    stat.schoolName,
                                  )
                                }
                              >
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                Résultats (Excel)
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleExportSchoolResultsPdf(stat.schoolName)
                                }
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                Résultats (PDF)
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
