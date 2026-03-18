/**
 * ScoresPage - Saisie des notes
 *
 * Deux onglets :
 * 1. Saisie rapide : workflow matière → matricule → note
 * 2. Récapitulatif : tableau en lecture seule (élèves × matières)
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
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useExamStore,
  useSchoolsStore,
  useScoresStore,
  useStudentsStore,
  useSubjectsStore,
} from "@/stores";
import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Hash,
  PenLine,
  Search,
  Send,
  UserSearch,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import { Pagination } from "@/components/common";

// ============================================
// Types internes
// ============================================

interface SessionEntry {
  id: number;
  studentName: string;
  candidateNumber: string;
  subjectName: string;
  value: number;
  isUpdate: boolean;
  timestamp: Date;
}

// ============================================
// Sous-composant : Saisie rapide
// ============================================

function QuickEntryTab() {
  const { students } = useStudentsStore();
  const { subjects } = useSubjectsStore();
  const { getScore, upsertScore, getScoresBySubject } = useScoresStore();

  // États du formulaire
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [matriculeQuery, setMatriculeQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    null,
  );
  const [noteValue, setNoteValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sessionEntries, setSessionEntries] = useState<SessionEntry[]>([]);
  const [sessionCounter, setSessionCounter] = useState(0);

  // Refs
  const matriculeInputRef = useRef<HTMLInputElement>(null);
  const noteInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Matière sélectionnée
  const selectedSubject = useMemo(
    () => subjects.find((s) => String(s.id) === selectedSubjectId),
    [subjects, selectedSubjectId],
  );

  // Candidat sélectionné
  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId),
    [students, selectedStudentId],
  );

  // Progression : notes saisies pour la matière
  const subjectProgress = useMemo(() => {
    if (!selectedSubject) return { entered: 0, total: 0 };
    const scores = getScoresBySubject(selectedSubject.id);
    const nonAbsentStudents = students.filter((s) => !s.isAbsent);
    return { entered: scores.length, total: nonAbsentStudents.length };
  }, [selectedSubject, students, getScoresBySubject, sessionCounter]);

  // Autocomplete : suggestions filtrées
  const suggestions = useMemo(() => {
    if (!matriculeQuery.trim()) return [];
    const q = matriculeQuery.toLowerCase();
    return students
      .filter(
        (s) =>
          s.candidateNumber.toLowerCase().includes(q) ||
          s.lastName.toLowerCase().includes(q) ||
          s.firstName.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [students, matriculeQuery]);

  // Note existante pour le candidat + matière
  const existingScore = useMemo(() => {
    if (!selectedStudentId || !selectedSubject) return null;
    return getScore(selectedStudentId, selectedSubject.id);
  }, [selectedStudentId, selectedSubject, getScore, sessionCounter]);

  // Fermer les suggestions quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        matriculeInputRef.current &&
        !matriculeInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  // Sélectionner un candidat depuis les suggestions
  const handleSelectStudent = useCallback(
    (student: (typeof students)[0]) => {
      setSelectedStudentId(student.id);
      setMatriculeQuery(student.candidateNumber);
      setShowSuggestions(false);

      // Pré-remplir si note existante
      if (selectedSubject) {
        const existing = getScore(student.id, selectedSubject.id);
        if (existing) {
          setNoteValue(existing.value.toString());
        } else {
          setNoteValue("");
        }
      }

      // Focus sur le champ note
      setTimeout(() => noteInputRef.current?.focus(), 50);
    },
    [selectedSubject, getScore],
  );

  // Validation de la saisie du matricule (Enter dans le champ)
  const handleMatriculeValidation = useCallback(() => {
    if (suggestions.length === 1) {
      handleSelectStudent(suggestions[0]);
    } else if (suggestions.length === 0 && matriculeQuery.trim()) {
      toast.error("Matricule introuvable");
    }
  }, [suggestions, matriculeQuery, handleSelectStudent]);

  // Soumettre la note
  const handleSubmit = useCallback(() => {
    if (!selectedSubject || !selectedStudentId || !noteValue.trim()) return;

    const value = parseFloat(noteValue);
    if (isNaN(value) || value < 0 || value > selectedSubject.maxScore) {
      toast.error(`La note doit être entre 0 et ${selectedSubject.maxScore}`);
      return;
    }

    const student = students.find((s) => s.id === selectedStudentId);
    if (!student) return;

    const isUpdate = !!getScore(selectedStudentId, selectedSubject.id);
    upsertScore(selectedStudentId, selectedSubject.id, value);

    // Ajouter à l'historique de session
    const entry: SessionEntry = {
      id: Date.now(),
      studentName: `${student.lastName} ${student.firstName}`,
      candidateNumber: student.candidateNumber,
      subjectName: selectedSubject.name,
      value,
      isUpdate,
      timestamp: new Date(),
    };
    setSessionEntries((prev) => [entry, ...prev]);
    setSessionCounter((c) => c + 1);

    toast.success(
      isUpdate
        ? `Note modifiée : ${value}/${selectedSubject.maxScore}`
        : `Note enregistrée : ${value}/${selectedSubject.maxScore}`
    );

    // Reset pour la prochaine saisie
    setSelectedStudentId(null);
    setMatriculeQuery("");
    setNoteValue("");

    // Focus retour sur matricule
    setTimeout(() => matriculeInputRef.current?.focus(), 50);
  }, [
    selectedSubject,
    selectedStudentId,
    noteValue,
    students,
    getScore,
    upsertScore,
  ]);

  // Raccourci Enter dans le champ note
  const handleNoteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleMatriculeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleMatriculeValidation();
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const progressPercent =
    subjectProgress.total > 0
      ? Math.round((subjectProgress.entered / subjectProgress.total) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Colonne gauche : formulaire de saisie */}
      <div className="lg:col-span-3 space-y-5">
        {/* Étape 1 : Sélection de la matière */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4 text-primary" />
              Matière
            </CardTitle>
            <CardDescription>
              Sélectionnez la matière pour laquelle vous saisissez les notes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedSubjectId}
              onValueChange={(val) => {
                setSelectedSubjectId(val);
                // Reset candidat si on change de matière
                setSelectedStudentId(null);
                setMatriculeQuery("");
                setNoteValue("");
                setTimeout(() => matriculeInputRef.current?.focus(), 50);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choisir une matière..." />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={String(subject.id)}>
                    <span className="font-medium">{subject.name}</span>
                    <span className="ml-2 text-muted-foreground text-xs">
                      /{subject.maxScore}
                      {subject.coefficient
                        ? ` · coef ${subject.coefficient}`
                        : ""}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Barre de progression */}
            {selectedSubject && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progression</span>
                  <span className="font-medium">
                    {subjectProgress.entered}/{subjectProgress.total} notes
                    saisies
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Étape 2 & 3 : Matricule + Note */}
        <Card
          className={!selectedSubject ? "opacity-50 pointer-events-none" : ""}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Hash className="h-4 w-4 text-primary" />
              Candidat & Note
            </CardTitle>
            <CardDescription>
              Saisissez le matricule puis la note du candidat
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Champ matricule avec autocomplete */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <UserSearch className="h-3.5 w-3.5" />
                Matricule
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={matriculeInputRef}
                  placeholder="Tapez un matricule ou un nom..."
                  value={matriculeQuery}
                  onChange={(e) => {
                    setMatriculeQuery(e.target.value);
                    setSelectedStudentId(null);
                    setNoteValue("");
                    setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    if (matriculeQuery.trim()) setShowSuggestions(true);
                  }}
                  onKeyDown={handleMatriculeKeyDown}
                  className="pl-9"
                  disabled={!selectedSubject}
                />

                {/* Dropdown suggestions */}
                {showSuggestions && matriculeQuery.trim() && (
                  <div
                    ref={suggestionsRef}
                    className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg"
                  >
                    {suggestions.length > 0 ? (
                      <ul className="py-1 max-h-64 overflow-y-auto">
                        {suggestions.map((student) => {
                          const hasScore =
                            selectedSubject &&
                            getScore(student.id, selectedSubject.id);
                          return (
                            <li
                              key={student.id}
                              className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-accent transition-colors"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelectStudent(student);
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-sm bg-muted px-1.5 py-0.5 rounded">
                                  {student.candidateNumber}
                                </span>
                                <span className="text-sm">
                                  {student.lastName} {student.firstName}
                                </span>
                                {student.isAbsent && (
                                  <Badge
                                    variant="destructive"
                                    className="text-xs"
                                  >
                                    Absent
                                  </Badge>
                                )}
                              </div>
                              {hasScore && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs shrink-0"
                                >
                                  {hasScore.value}/{selectedSubject!.maxScore}
                                </Badge>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-3 text-sm text-destructive">
                        <XCircle className="h-4 w-4" />
                        Matricule introuvable
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Info candidat sélectionné */}
              {selectedStudent && (
                <div
                  className={`flex items-center gap-3 rounded-md border px-3 py-2 text-sm ${
                    selectedStudent.isAbsent
                      ? "bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800"
                      : "bg-muted/50"
                  }`}
                >
                  <div className="flex-1">
                    <span className="font-medium">
                      {selectedStudent.lastName} {selectedStudent.firstName}
                    </span>
                    <span className="mx-2 text-muted-foreground">·</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {selectedStudent.candidateNumber}
                    </span>
                  </div>
                  {selectedStudent.isAbsent && (
                    <Badge variant="destructive" className="text-xs">
                      Absent
                    </Badge>
                  )}
                  {existingScore && !selectedStudent.isAbsent && (
                    <Badge
                      variant="outline"
                      className="text-xs text-amber-600 border-amber-300"
                    >
                      Modification ({existingScore.value}/
                      {selectedSubject?.maxScore})
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Champ note */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <PenLine className="h-3.5 w-3.5" />
                Note
                {selectedSubject && (
                  <span className="font-normal text-muted-foreground">
                    (sur {selectedSubject.maxScore})
                  </span>
                )}
              </label>
              <div className="flex items-center gap-3">
                <Input
                  ref={noteInputRef}
                  type="number"
                  min="0"
                  max={selectedSubject?.maxScore ?? 20}
                  step="0.5"
                  placeholder={
                    selectedSubject ? `0 – ${selectedSubject.maxScore}` : "—"
                  }
                  value={noteValue}
                  onChange={(e) => setNoteValue(e.target.value)}
                  onKeyDown={handleNoteKeyDown}
                  disabled={
                    !selectedStudentId || (selectedStudent?.isAbsent ?? false)
                  }
                  className="max-w-[140px] text-center text-lg font-semibold"
                />
                <Button
                  onClick={handleSubmit}
                  disabled={
                    !selectedStudentId ||
                    !noteValue.trim() ||
                    (selectedStudent?.isAbsent ?? false)
                  }
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Enregistrer & Suivant
                </Button>
              </div>
              {selectedStudent?.isAbsent && (
                <p className="text-sm text-destructive">
                  Ce candidat est absent. Saisie de note impossible.
                </p>
              )}
            </div>

          </CardContent>
        </Card>
      </div>

      {/* Colonne droite : historique de session */}
      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-primary" />
              Historique de saisie
            </CardTitle>
            <CardDescription>
              {sessionEntries.length > 0
                ? `${sessionEntries.length} note(s) saisie(s) cette session`
                : "Les notes saisies apparaîtront ici"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sessionEntries.length > 0 ? (
              <ScrollArea className="h-[420px]">
                <div className="space-y-2 pr-3">
                  {sessionEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">
                            {entry.candidateNumber}
                          </span>
                          <span className="truncate font-medium">
                            {entry.studentName}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {entry.subjectName}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="font-semibold tabular-nums">
                          {entry.value}
                        </span>
                        {entry.isUpdate && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 text-amber-600 border-amber-300"
                          >
                            modif
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                <ClipboardList className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">Aucune note saisie pour le moment</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================
// Sous-composant : Récapitulatif
// ============================================

function RecapTab() {
  const { students } = useStudentsStore();
  const { subjects } = useSubjectsStore();
  const { schools } = useSchoolsStore();
  const { passingGrade, maxGrade } = useExamStore();
  const { getScore, calculateAverage } = useScoresStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterSchool, setFilterSchool] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Filtrage des élèves
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        !debouncedSearch ||
        s.firstName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        s.lastName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        s.candidateNumber.toLowerCase().includes(debouncedSearch.toLowerCase());

      const matchesSchool =
        filterSchool === "all" || s.schoolId === parseInt(filterSchool);

      return matchesSearch && matchesSchool;
    });
  }, [students, debouncedSearch, filterSchool]);

  // Pagination
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  const subjectsForCalc = useMemo(
    () =>
      subjects.map((s) => ({
        id: s.id,
        coefficient: s.coefficient,
        maxScore: s.maxScore,
      })),
    [subjects],
  );

  const averageOptions = useMemo(() => ({ targetScale: maxGrade }), [maxGrade]);

  const getStudentAverage = (studentId: number) =>
    calculateAverage(studentId, subjectsForCalc, averageOptions);

  const isAdmitted = (average: number | null) =>
    average !== null && average >= passingGrade;

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un élève..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterSchool} onValueChange={(val) => { setFilterSchool(val); setCurrentPage(1); }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tous les établissements" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les établissements</SelectItem>
            {schools.map((school) => (
              <SelectItem key={school.id} value={String(school.id)}>
                {school.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {filteredStudents.length} élève(s)
        </span>
      </div>

      {/* Légende */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-100 border border-green-300" />
          Admis (≥ {passingGrade}/{maxGrade})
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-100 border border-red-300" />
          Ajourné ({"<"} {passingGrade}/{maxGrade})
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gray-100 border border-gray-300" />
          Notes manquantes
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-orange-100 border border-orange-300" />
          Absent
        </span>
      </div>

      {/* Tableau récapitulatif en lecture seule */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-background z-10">
                Candidat
              </TableHead>
              {subjects.map((subject) => (
                <TableHead
                  key={subject.id}
                  className="text-center min-w-[100px]"
                >
                  <div className="flex flex-col items-center">
                    <span>{subject.name}</span>
                    <span className="text-xs text-muted-foreground">
                      / {subject.maxScore}
                      {subject.coefficient &&
                        ` (coef ${subject.coefficient})`}
                    </span>
                  </div>
                </TableHead>
              ))}
              <TableHead className="text-center min-w-[100px]">
                Moyenne
              </TableHead>
              <TableHead className="text-center">Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedStudents.map((student) => {
              const average = getStudentAverage(student.id);
              const admitted = isAdmitted(average);
              const isAbsent = student.isAbsent;

              return (
                <TableRow
                  key={student.id}
                  className={isAbsent ? "opacity-70 bg-muted/30" : ""}
                >
                  <TableCell className="sticky left-0 bg-background z-10 font-medium">
                    <div>
                      <p>
                        {student.lastName} {student.firstName}
                        {isAbsent && (
                          <Badge
                            variant="destructive"
                            className="ml-2 text-xs"
                          >
                            Absent
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {student.candidateNumber}
                      </p>
                    </div>
                  </TableCell>
                  {subjects.map((subject) => {
                    const score = getScore(student.id, subject.id);
                    return (
                      <TableCell
                        key={subject.id}
                        className={`text-center ${isAbsent ? "bg-muted/20" : ""}`}
                      >
                        {isAbsent ? (
                          <span className="text-muted-foreground text-sm">
                            —
                          </span>
                        ) : (
                          <span
                            className={
                              score
                                ? "font-medium"
                                : "text-muted-foreground"
                            }
                          >
                            {score?.value ?? "—"}
                          </span>
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center">
                    {isAbsent ? (
                      <span className="text-muted-foreground text-sm">—</span>
                    ) : average !== null ? (
                      <span
                        className={`font-bold ${
                          admitted ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {average.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {isAbsent ? (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground"
                      >
                        Absent
                      </Badge>
                    ) : average !== null ? (
                      admitted ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Admis
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Ajourné</Badge>
                      )
                    ) : (
                      <Badge variant="secondary">En attente</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredStudents.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={subjects.length + 3}
                  className="text-center py-8"
                >
                  <p className="text-muted-foreground">Aucun élève trouvé</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {filteredStudents.length > pageSize && (
        <Pagination
          currentPage={currentPage}
          totalItems={filteredStudents.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
}

// ============================================
// Composant principal
// ============================================

export function ScoresPage() {
  const { students } = useStudentsStore();
  const { subjects } = useSubjectsStore();

  const hasPrerequisites = students.length > 0 && subjects.length > 0;

  return (
    <PageContainer description="Saisissez les notes des candidats par matière. Utilisez la saisie rapide pour un flux de travail optimisé.">
      {hasPrerequisites ? (
        <Tabs defaultValue="entry" className="space-y-4">
          <TabsList>
            <TabsTrigger value="entry" className="gap-1.5">
              <PenLine className="h-4 w-4" />
              Saisie rapide
            </TabsTrigger>
            <TabsTrigger value="recap" className="gap-1.5">
              <ClipboardList className="h-4 w-4" />
              Récapitulatif
            </TabsTrigger>
          </TabsList>

          <TabsContent value="entry">
            <QuickEntryTab />
          </TabsContent>

          <TabsContent value="recap">
            <RecapTab />
          </TabsContent>
        </Tabs>
      ) : (
        <EmptyState
          title="Saisie impossible"
          description={
            students.length === 0
              ? "Ajoutez d'abord des élèves avant de saisir les notes."
              : "Définissez d'abord les épreuves avant de saisir les notes."
          }
          icon={PenLine}
        />
      )}
    </PageContainer>
  );
}
