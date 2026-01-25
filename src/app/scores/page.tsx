/**
 * ScoresPage - Saisie des notes
 *
 * Permet de:
 * - Saisir les notes par élève et par épreuve
 * - Voir la moyenne automatique
 * - Filtrer par établissement
 */

import { useState, useMemo } from 'react';
import { PageContainer } from '@/components/layout';
import { EmptyState } from '@/components/common';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PenLine, Search, CheckCircle2 } from 'lucide-react';
import {
  useStudentsStore,
  useSubjectsStore,
  useScoresStore,
  useSchoolsStore,
  useExamStore,
} from '@/stores';

export function ScoresPage() {
  const { students } = useStudentsStore();
  const { subjects } = useSubjectsStore();
  const { schools } = useSchoolsStore();
  const { passingGrade, maxGrade } = useExamStore();
  const { getScore, upsertScore, calculateAverage } = useScoresStore();

  // États locaux
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSchool, setFilterSchool] = useState<string>('all');
  const [editingCell, setEditingCell] = useState<{
    studentId: number;
    subjectId: number;
  } | null>(null);
  const [inputValue, setInputValue] = useState('');

  // Vérifier si les prérequis sont remplis
  const hasPrerequisites = students.length > 0 && subjects.length > 0;

  // Filtrage des élèves
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        !searchQuery ||
        s.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.candidateNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSchool =
        filterSchool === 'all' || s.schoolId === parseInt(filterSchool);

      return matchesSearch && matchesSchool;
    });
  }, [students, searchQuery, filterSchool]);

  // Préparer les sujets pour le calcul (avec maxScore pour la normalisation)
  const subjectsForCalc = useMemo(
    () =>
      subjects.map((s) => ({
        id: s.id,
        coefficient: s.coefficient,
        maxScore: s.maxScore,
      })),
    [subjects]
  );

  // Options pour le calcul de moyenne (barème global)
  const averageOptions = useMemo(
    () => ({ targetScale: maxGrade }),
    [maxGrade]
  );

  // Handlers
  const handleCellClick = (studentId: number, subjectId: number) => {
    const existingScore = getScore(studentId, subjectId);
    setInputValue(existingScore?.value.toString() || '');
    setEditingCell({ studentId, subjectId });
  };

  const handleInputBlur = () => {
    if (editingCell && inputValue !== '') {
      const value = parseFloat(inputValue);
      const subject = subjects.find((s) => s.id === editingCell.subjectId);

      if (!isNaN(value) && value >= 0 && value <= (subject?.maxScore || 20)) {
        upsertScore(editingCell.studentId, editingCell.subjectId, value);
      }
    }
    setEditingCell(null);
    setInputValue('');
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setInputValue('');
    }
  };

  // Obtenir la moyenne d'un élève
  const getStudentAverage = (studentId: number) => {
    return calculateAverage(studentId, subjectsForCalc, averageOptions);
  };

  // Vérifier si l'élève est admis
  const isAdmitted = (average: number | null) => {
    return average !== null && average >= passingGrade;
  };

  return (
    <PageContainer description="Saisissez les notes des candidats pour chaque épreuve. Cliquez sur une cellule pour saisir une note.">
      {hasPrerequisites ? (
        <div className="space-y-4">
          {/* Barre de recherche et filtres */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un élève..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterSchool} onValueChange={setFilterSchool}>
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
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-100 border border-green-300" />
              Admis (≥ {passingGrade}/{maxGrade})
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-100 border border-red-300" />
              Ajourné ({'<'} {passingGrade}/{maxGrade})
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-gray-100 border border-gray-300" />
              Notes manquantes
            </span>
          </div>

          {/* Table de saisie */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-10">
                    Candidat
                  </TableHead>
                  {subjects.map((subject) => (
                    <TableHead key={subject.id} className="text-center min-w-[100px]">
                      <div className="flex flex-col items-center">
                        <span>{subject.name}</span>
                        <span className="text-xs text-muted-foreground">
                          / {subject.maxScore}
                          {subject.coefficient && ` (coef ${subject.coefficient})`}
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
                {filteredStudents.map((student) => {
                  const average = getStudentAverage(student.id);
                  const admitted = isAdmitted(average);

                  return (
                    <TableRow key={student.id}>
                      <TableCell className="sticky left-0 bg-background z-10 font-medium">
                        <div>
                          <p>
                            {student.lastName} {student.firstName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {student.candidateNumber}
                          </p>
                        </div>
                      </TableCell>
                      {subjects.map((subject) => {
                        const score = getScore(student.id, subject.id);
                        const isEditing =
                          editingCell?.studentId === student.id &&
                          editingCell?.subjectId === subject.id;

                        return (
                          <TableCell
                            key={subject.id}
                            className="text-center p-0"
                            onClick={() =>
                              !isEditing &&
                              handleCellClick(student.id, subject.id)
                            }
                          >
                            {isEditing ? (
                              <Input
                                type="number"
                                min="0"
                                max={subject.maxScore}
                                step="0.5"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onBlur={handleInputBlur}
                                onKeyDown={handleInputKeyDown}
                                className="w-20 mx-auto text-center"
                                autoFocus
                              />
                            ) : (
                              <div
                                className={`py-2 px-4 cursor-pointer hover:bg-muted transition-colors ${
                                  score ? '' : 'text-muted-foreground'
                                }`}
                              >
                                {score?.value ?? '—'}
                              </div>
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center">
                        {average !== null ? (
                          <span
                            className={`font-bold ${
                              admitted ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {average.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {average !== null ? (
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
        </div>
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
