/**
 * ExportsPage - Centre d'export PDF et Excel
 *
 * Permet d'exporter:
 * - Résultats complets (tous les candidats)
 * - Résultats par établissement
 * - Statistiques par établissement
 * - Statistiques par épreuve
 * - Rapport complet multi-feuilles
 * - Liste des candidats (sans notes)
 *
 * Avec options de filtrage et tri
 */

import { EmptyState } from "@/components/common";
import { PageContainer } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { rankStudents } from "@/core/rankings/studentRanking";
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
  type ExportOptions,
  type ExportStudent,
  type SchoolStats,
  type SubjectStats,
} from "@/lib/export";
import {
  useExamStore,
  useSchoolsStore,
  useScoresStore,
  useStudentsStore,
  useSubjectsStore,
} from "@/stores";
import {
  BookOpen,
  Building2,
  Download,
  FileBarChart,
  FileSpreadsheet,
  FileText,
  Loader2,
  Trophy,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

// ============================================
// TYPES LOCAUX
// ============================================

type ExportFormat = "pdf" | "excel";
type FilterStatus = "all" | "admitted" | "failed";
type SortOption = "rank" | "name" | "school";

interface ExportState {
  isExporting: boolean;
  exportType: string | null;
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export function ExportsPage() {
  // Stores
  const { students } = useStudentsStore();
  const { subjects } = useSubjectsStore();
  const { schools } = useSchoolsStore();
  const { examName, examYear, passingGrade, maxGrade } = useExamStore();
  const { calculateAverage, scores } = useScoresStore();

  // État d'export
  const [exportState, setExportState] = useState<ExportState>({
    isExporting: false,
    exportType: null,
  });

  // Options d'export pour les résultats
  const [includeScores, setIncludeScores] = useState(true);
  const [includeRank, setIncludeRank] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortBy, setSortBy] = useState<SortOption>("rank");
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("all");

  // Préparer les informations de l'examen
  const examInfo: ExamInfo = useMemo(
    () => ({
      name: examName || "Examen",
      year: examYear || new Date().getFullYear(),
      passingGrade: passingGrade || 10,
      maxGrade: maxGrade || 20,
    }),
    [examName, examYear, passingGrade, maxGrade],
  );

  // Préparer les sujets pour le calcul
  const subjectsForCalc = useMemo(
    () =>
      subjects.map((s) => ({
        id: s.id,
        name: s.name,
        coefficient: s.coefficient,
        maxScore: s.maxScore,
      })),
    [subjects],
  );

  // Options de calcul de moyenne
  const averageOptions = useMemo(() => ({ targetScale: maxGrade }), [maxGrade]);

  // Calculer les résultats de tous les élèves
  const studentResults = useMemo(() => {
    return students.map((student) => {
      const average = calculateAverage(
        student.id,
        subjectsForCalc,
        averageOptions,
      );
      const status: "admitted" | "failed" | "pending" =
        average === null
          ? "pending"
          : average >= passingGrade
            ? "admitted"
            : "failed";

      // Récupérer les notes
      const studentScores: Record<string, number | null> = {};
      subjects.forEach((subject) => {
        const score = scores.find(
          (s) => s.studentId === student.id && s.subjectId === subject.id,
        );
        studentScores[String(subject.id)] = score?.value ?? null;
      });

      return {
        student,
        average,
        status,
        scores: studentScores,
        schoolName:
          schools.find((s) => s.id === student.schoolId)?.name || "Inconnu",
      };
    });
  }, [
    students,
    calculateAverage,
    subjectsForCalc,
    averageOptions,
    passingGrade,
    scores,
    subjects,
    schools,
  ]);

  // Classement des élèves (seulement ceux avec des notes)
  const rankedResults = useMemo(() => {
    const withScores = studentResults.filter((r) => r.average !== null);
    const rankings = rankStudents(
      withScores.map((r) => ({
        studentId: String(r.student.id),
        average: r.average!,
      })),
    );

    // Créer une map des rangs
    const rankMap = new Map<string, number>();
    rankings.forEach((r) => rankMap.set(r.studentId, r.rank));

    return studentResults.map((r) => ({
      ...r,
      rank: rankMap.get(String(r.student.id)) ?? null,
    }));
  }, [studentResults]);

  // Convertir en format d'export
  const exportStudents: ExportStudent[] = useMemo(() => {
    return rankedResults.map((r) => ({
      candidateNumber: r.student.candidateNumber,
      lastName: r.student.lastName,
      firstName: r.student.firstName,
      gender: r.student.gender,
      schoolName: r.schoolName,
      scores: r.scores,
      average: r.average,
      rank: r.rank,
      status: r.status,
    }));
  }, [rankedResults]);

  // Sujets pour l'export
  const exportSubjects = useMemo(
    () =>
      subjects.map((s) => ({
        id: String(s.id),
        name: s.name,
        coefficient: s.coefficient,
      })),
    [subjects],
  );

  // Statistiques par établissement
  const schoolStats: SchoolStats[] = useMemo(() => {
    return schools
      .map((school) => {
        const schoolStudents = rankedResults.filter(
          (r) => r.student.schoolId === school.id,
        );
        const withScores = schoolStudents.filter((r) => r.average !== null);
        const admitted = withScores.filter(
          (r) => r.status === "admitted",
        ).length;
        const failed = withScores.filter((r) => r.status === "failed").length;
        const total = withScores.length;
        const avgSum = withScores.reduce((sum, r) => sum + (r.average ?? 0), 0);

        return {
          schoolName: school.name,
          totalCandidates: total,
          admitted,
          failed,
          successRate: total > 0 ? Math.round((admitted / total) * 100) : 0,
          averageGrade: total > 0 ? avgSum / total : 0,
        };
      })
      .filter((s) => s.totalCandidates > 0);
  }, [schools, rankedResults]);

  // Statistiques par épreuve
  const subjectStats: SubjectStats[] = useMemo(() => {
    return subjects
      .map((subject) => {
        const subjectScores = scores.filter((s) => s.subjectId === subject.id);
        const values = subjectScores.map((s) => s.value);
        const total = values.length;

        return {
          subjectName: subject.name,
          coefficient: subject.coefficient,
          totalScores: total,
          average: total > 0 ? values.reduce((a, b) => a + b, 0) / total : 0,
          minScore: total > 0 ? Math.min(...values) : 0,
          maxScore: total > 0 ? Math.max(...values) : 0,
        };
      })
      .filter((s) => s.totalScores > 0);
  }, [subjects, scores]);

  // Options d'export
  const exportOptions: ExportOptions = useMemo(
    () => ({
      includeScores,
      includeRank,
      filterStatus,
      sortBy,
    }),
    [includeScores, includeRank, filterStatus, sortBy],
  );

  // Compteurs pour l'affichage
  const counts = useMemo(() => {
    const withScores = rankedResults.filter((r) => r.average !== null);
    return {
      total: students.length,
      withScores: withScores.length,
      admitted: withScores.filter((r) => r.status === "admitted").length,
      failed: withScores.filter((r) => r.status === "failed").length,
      pending: students.length - withScores.length,
    };
  }, [students, rankedResults]);

  // Vérifier si on a des données
  const hasData = students.length > 0;
  const hasScores = counts.withScores > 0;

  // ============================================
  // HANDLERS D'EXPORT
  // ============================================

  const startExport = (type: string) => {
    setExportState({ isExporting: true, exportType: type });
  };

  const endExport = () => {
    setExportState({ isExporting: false, exportType: null });
  };

  // Export des résultats globaux
  const handleExportResults = async (format: ExportFormat) => {
    startExport(`results-${format}`);
    try {
      if (format === "excel") {
        await exportResultsToExcel(
          examInfo,
          exportStudents,
          exportSubjects,
          exportOptions,
        );
      } else {
        await exportResultsToPdf(
          examInfo,
          exportStudents,
          exportSubjects,
          exportOptions,
        );
      }
    } finally {
      endExport();
    }
  };

  // Export des résultats par établissement
  const handleExportSchoolResults = async (format: ExportFormat) => {
    if (selectedSchoolId === "all") return;

    const school = schools.find((s) => s.id === parseInt(selectedSchoolId));
    if (!school) return;

    startExport(`school-results-${format}`);
    try {
      if (format === "excel") {
        await exportSchoolResultsToExcel(
          examInfo,
          exportStudents,
          exportSubjects,
          school.name,
          exportOptions,
        );
      } else {
        await exportSchoolResultsToPdf(
          examInfo,
          exportStudents,
          exportSubjects,
          school.name,
          exportOptions,
        );
      }
    } finally {
      endExport();
    }
  };

  // Export des statistiques par établissement
  const handleExportSchoolStats = async (format: ExportFormat) => {
    startExport(`school-stats-${format}`);
    try {
      if (format === "excel") {
        await exportSchoolStatsToExcel(examInfo, schoolStats);
      } else {
        await exportSchoolStatsToPdf(examInfo, schoolStats);
      }
    } finally {
      endExport();
    }
  };

  // Export des statistiques par épreuve
  const handleExportSubjectStats = async (format: ExportFormat) => {
    startExport(`subject-stats-${format}`);
    try {
      if (format === "excel") {
        await exportSubjectStatsToExcel(examInfo, subjectStats);
      } else {
        await exportSubjectStatsToPdf(examInfo, subjectStats);
      }
    } finally {
      endExport();
    }
  };

  // Export du rapport complet
  const handleExportFullReport = async () => {
    startExport("full-report");
    try {
      await exportFullReportToExcel(
        examInfo,
        exportStudents,
        exportSubjects,
        schoolStats,
        subjectStats,
      );
    } finally {
      endExport();
    }
  };

  // Bouton d'export
  const ExportButton = ({
    format,
    onClick,
    disabled,
    exportType,
  }: {
    format: ExportFormat;
    onClick: () => void;
    disabled?: boolean;
    exportType: string;
  }) => {
    const isLoading =
      exportState.isExporting &&
      exportState.exportType === `${exportType}-${format}`;
    const Icon = format === "excel" ? FileSpreadsheet : FileText;

    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onClick}
        disabled={disabled || exportState.isExporting}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Icon className="h-4 w-4 mr-2" />
        )}
        {format === "excel" ? "Excel" : "PDF"}
      </Button>
    );
  };

  // ============================================
  // RENDU
  // ============================================

  if (!hasData) {
    return (
      <PageContainer description="Exportez les données de l'examen en PDF ou Excel.">
        <EmptyState
          title="Aucune donnée à exporter"
          description="Ajoutez des candidats et des notes pour pouvoir exporter les données."
          icon={Download}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer description="Exportez les données de l'examen en PDF ou Excel pour impression et archivage.">
      <div className="space-y-6">
        {/* Résumé des données */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Données disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Badge variant="secondary" className="text-sm">
                <Users className="h-3 w-3 mr-1" />
                {counts.total} candidats
              </Badge>
              <Badge variant="secondary" className="text-sm">
                <BookOpen className="h-3 w-3 mr-1" />
                {subjects.length} épreuves
              </Badge>
              <Badge variant="secondary" className="text-sm">
                <Building2 className="h-3 w-3 mr-1" />
                {schools.length} établissements
              </Badge>
              {hasScores && (
                <>
                  <Badge className="bg-green-100 text-green-800 text-sm">
                    {counts.admitted} admis
                  </Badge>
                  <Badge variant="destructive" className="text-sm">
                    {counts.failed} ajournés
                  </Badge>
                  {counts.pending > 0 && (
                    <Badge variant="outline" className="text-sm">
                      {counts.pending} en attente
                    </Badge>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="results" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="results">
              <Trophy className="h-4 w-4 mr-2" />
              Résultats
            </TabsTrigger>
            <TabsTrigger value="school">
              <Building2 className="h-4 w-4 mr-2" />
              Par établissement
            </TabsTrigger>
            <TabsTrigger value="statistics">
              <FileBarChart className="h-4 w-4 mr-2" />
              Statistiques
            </TabsTrigger>
            <TabsTrigger value="full">
              <Download className="h-4 w-4 mr-2" />
              Rapport complet
            </TabsTrigger>
          </TabsList>

          {/* Onglet Résultats */}
          <TabsContent value="results" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Procès-verbal des résultats
                </CardTitle>
                <CardDescription>
                  Export des résultats de tous les candidats avec notes et
                  classement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Options */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeScores"
                      checked={includeScores}
                      onCheckedChange={(checked) => setIncludeScores(!!checked)}
                    />
                    <Label htmlFor="includeScores" className="text-sm">
                      Inclure les notes détaillées
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeRank"
                      checked={includeRank}
                      onCheckedChange={(checked) => setIncludeRank(!!checked)}
                    />
                    <Label htmlFor="includeRank" className="text-sm">
                      Inclure le classement
                    </Label>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-sm">Filtrer par statut</Label>
                    <Select
                      value={filterStatus}
                      onValueChange={(v) => setFilterStatus(v as FilterStatus)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les candidats</SelectItem>
                        <SelectItem value="admitted">
                          Admis uniquement
                        </SelectItem>
                        <SelectItem value="failed">
                          Ajournés uniquement
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-sm">Trier par</Label>
                    <Select
                      value={sortBy}
                      onValueChange={(v) => setSortBy(v as SortOption)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rank">Classement</SelectItem>
                        <SelectItem value="name">Nom alphabétique</SelectItem>
                        <SelectItem value="school">Établissement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Boutons d'export */}
                <div className="flex gap-2">
                  <ExportButton
                    format="pdf"
                    onClick={() => handleExportResults("pdf")}
                    disabled={!hasScores}
                    exportType="results"
                  />
                  <ExportButton
                    format="excel"
                    onClick={() => handleExportResults("excel")}
                    disabled={!hasScores}
                    exportType="results"
                  />
                  {!hasScores && (
                    <p className="text-sm text-muted-foreground ml-2 self-center">
                      Saisissez des notes pour activer l'export des résultats
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Export liste candidats simple */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Liste des candidats</CardTitle>
                <CardDescription>
                  Export simple de la liste des candidats inscrits (sans notes)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <ExportButton
                    format="pdf"
                    onClick={() => {
                      // Export sans notes ni rang
                      const opts = {
                        ...exportOptions,
                        includeScores: false,
                        includeRank: false,
                      };
                      startExport("list-pdf");
                      exportResultsToPdf(
                        examInfo,
                        exportStudents,
                        exportSubjects,
                        opts,
                      ).finally(endExport);
                    }}
                    exportType="list"
                  />
                  <ExportButton
                    format="excel"
                    onClick={() => {
                      const opts = {
                        ...exportOptions,
                        includeScores: false,
                        includeRank: false,
                      };
                      startExport("list-excel");
                      exportResultsToExcel(
                        examInfo,
                        exportStudents,
                        exportSubjects,
                        opts,
                      ).finally(endExport);
                    }}
                    exportType="list"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Par établissement */}
          <TabsContent value="school" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Résultats par établissement
                </CardTitle>
                <CardDescription>
                  Export des résultats pour un établissement spécifique avec
                  classement interne
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-sm">
                      Sélectionner un établissement
                    </Label>
                    <Select
                      value={selectedSchoolId}
                      onValueChange={setSelectedSchoolId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un établissement" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">-- Sélectionner --</SelectItem>
                        {schools.map((school) => {
                          const count = rankedResults.filter(
                            (r) =>
                              r.student.schoolId === school.id &&
                              r.average !== null,
                          ).length;
                          return (
                            <SelectItem
                              key={school.id}
                              value={String(school.id)}
                            >
                              {school.name} ({count} candidats)
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-sm">Options</Label>
                    <div className="flex flex-col gap-2 pt-1">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="schoolIncludeScores"
                          checked={includeScores}
                          onCheckedChange={(checked) =>
                            setIncludeScores(!!checked)
                          }
                        />
                        <Label
                          htmlFor="schoolIncludeScores"
                          className="text-sm"
                        >
                          Inclure les notes
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="schoolIncludeRank"
                          checked={includeRank}
                          onCheckedChange={(checked) =>
                            setIncludeRank(!!checked)
                          }
                        />
                        <Label htmlFor="schoolIncludeRank" className="text-sm">
                          Inclure le rang interne
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <ExportButton
                    format="pdf"
                    onClick={() => handleExportSchoolResults("pdf")}
                    disabled={selectedSchoolId === "all" || !hasScores}
                    exportType="school-results"
                  />
                  <ExportButton
                    format="excel"
                    onClick={() => handleExportSchoolResults("excel")}
                    disabled={selectedSchoolId === "all" || !hasScores}
                    exportType="school-results"
                  />
                  {selectedSchoolId === "all" && (
                    <p className="text-sm text-muted-foreground ml-2 self-center">
                      Sélectionnez un établissement pour exporter ses résultats
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Aperçu des établissements */}
            {schoolStats.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Aperçu par établissement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {schoolStats.slice(0, 6).map((stat) => (
                      <div
                        key={stat.schoolName}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div>
                          <p className="font-medium text-sm truncate max-w-[150px]">
                            {stat.schoolName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {stat.totalCandidates} candidats
                          </p>
                        </div>
                        <Badge
                          variant={
                            stat.successRate >= 50 ? "default" : "destructive"
                          }
                        >
                          {stat.successRate}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                  {schoolStats.length > 6 && (
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                      + {schoolStats.length - 6} autres établissements
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Onglet Statistiques */}
          <TabsContent value="statistics" className="mt-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Stats établissements */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Statistiques par établissement
                  </CardTitle>
                  <CardDescription>
                    Taux de réussite et moyennes par établissement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    {schoolStats.length} établissements avec des résultats
                  </div>
                  <div className="flex gap-2">
                    <ExportButton
                      format="pdf"
                      onClick={() => handleExportSchoolStats("pdf")}
                      disabled={schoolStats.length === 0}
                      exportType="school-stats"
                    />
                    <ExportButton
                      format="excel"
                      onClick={() => handleExportSchoolStats("excel")}
                      disabled={schoolStats.length === 0}
                      exportType="school-stats"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Stats épreuves */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Statistiques par épreuve
                  </CardTitle>
                  <CardDescription>
                    Moyennes, notes min/max par épreuve
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    {subjectStats.length} épreuves avec des notes
                  </div>
                  <div className="flex gap-2">
                    <ExportButton
                      format="pdf"
                      onClick={() => handleExportSubjectStats("pdf")}
                      disabled={subjectStats.length === 0}
                      exportType="subject-stats"
                    />
                    <ExportButton
                      format="excel"
                      onClick={() => handleExportSubjectStats("excel")}
                      disabled={subjectStats.length === 0}
                      exportType="subject-stats"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Aperçu des épreuves */}
            {subjectStats.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Aperçu des épreuves
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {subjectStats.map((stat) => (
                      <div
                        key={stat.subjectName}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {stat.subjectName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {stat.totalScores} copies • Coef.{" "}
                            {stat.coefficient ?? "—"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{stat.average.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            {stat.minScore.toFixed(1)} -{" "}
                            {stat.maxScore.toFixed(1)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Onglet Rapport complet */}
          <TabsContent value="full" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileBarChart className="h-5 w-5" />
                  Rapport complet
                </CardTitle>
                <CardDescription>
                  Export Excel multi-feuilles contenant tous les résultats et
                  statistiques
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <p className="font-medium text-sm">Ce rapport inclut:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 bg-primary rounded-full" />
                      Résultats complets avec notes et classement
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 bg-primary rounded-full" />
                      Statistiques par établissement
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 bg-primary rounded-full" />
                      Statistiques par épreuve
                    </li>
                  </ul>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button
                    onClick={handleExportFullReport}
                    disabled={!hasScores || exportState.isExporting}
                  >
                    {exportState.isExporting &&
                    exportState.exportType === "full-report" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                    )}
                    Télécharger le rapport complet (Excel)
                  </Button>
                  {!hasScores && (
                    <p className="text-sm text-muted-foreground self-center">
                      Saisissez des notes pour générer le rapport
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
