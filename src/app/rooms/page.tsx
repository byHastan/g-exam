/**
 * RoomsPage - Répartition en salles
 *
 * Permet de:
 * - Définir le nombre de salles
 * - Définir la capacité par salle
 * - Générer la répartition alphabétique
 * - Visualiser les listes
 */

import { useState, useMemo } from 'react';
import { PageContainer } from '@/components/layout';
import { EmptyState } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DoorOpen,
  Settings2,
  Users,
  RefreshCw,
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useStudentsStore, useSchoolsStore, useExamStore } from '@/stores';
import {
  exportRoomToExcel,
  exportAllRoomsToExcel,
  exportRoomToPdf,
  exportAllRoomsToPdf,
  printRoom,
  printAllRooms,
  type ExportRoom,
  type ExamInfo,
} from '@/lib/export';
import {
  dispatchAlphabetically,
  calculateRequiredRooms,
} from '@/core/room-dispatch/alphabeticalDispatch';
import type { RoomAssignment } from '@/core/room-dispatch/alphabeticalDispatch';

export function RoomsPage() {
  const { students } = useStudentsStore();
  const { schools } = useSchoolsStore();
  const { examName, examYear, passingGrade, maxGrade } = useExamStore();

  // États
  const [roomCount, setRoomCount] = useState(5);
  const [roomCapacity, setRoomCapacity] = useState(30);
  const [roomAssignments, setRoomAssignments] = useState<RoomAssignment[]>([]);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);

  // Formulaire
  const [formRoomCount, setFormRoomCount] = useState('5');
  const [formRoomCapacity, setFormRoomCapacity] = useState('30');

  const hasStudents = students.length > 0;

  // Calcul du nombre minimum de salles recommandées
  const recommendedRooms = useMemo(() => {
    return calculateRequiredRooms(students.length, roomCapacity);
  }, [students.length, roomCapacity]);

  // Helper pour obtenir le nom de l'établissement
  const getSchoolName = (schoolId: number) => {
    return schools.find((s) => s.id === schoolId)?.name || 'Inconnu';
  };

  // Handlers
  const handleOpenConfig = () => {
    setFormRoomCount(roomCount.toString());
    setFormRoomCapacity(roomCapacity.toString());
    setIsConfigDialogOpen(true);
  };

  const handleSaveConfig = () => {
    const newRoomCount = parseInt(formRoomCount) || 5;
    const newCapacity = parseInt(formRoomCapacity) || 30;
    setRoomCount(newRoomCount);
    setRoomCapacity(newCapacity);
    setIsConfigDialogOpen(false);
  };

  const handleGenerateAssignments = () => {
    // Convertir les élèves au format attendu
    const studentsForDispatch = students.map((s) => ({
      id: String(s.id),
      lastName: s.lastName,
      firstName: s.firstName,
    }));

    const assignments = dispatchAlphabetically(
      studentsForDispatch,
      roomCount,
      roomCapacity
    );

    setRoomAssignments(assignments);
  };

  const handleClearAssignments = () => {
    setRoomAssignments([]);
  };

  // Statistiques des salles
  const roomStats = useMemo(() => {
    if (roomAssignments.length === 0) return null;

    const totalAssigned = roomAssignments.reduce(
      (sum, room) => sum + room.students.length,
      0
    );
    const filledRooms = roomAssignments.filter(
      (r) => r.students.length > 0
    ).length;
    const avgPerRoom =
      filledRooms > 0 ? Math.round(totalAssigned / filledRooms) : 0;

    return {
      totalAssigned,
      filledRooms,
      emptyRooms: roomAssignments.length - filledRooms,
      avgPerRoom,
    };
  }, [roomAssignments]);

  // Filtrer les salles avec des élèves
  const filledRooms = roomAssignments.filter((r) => r.students.length > 0);

  // Préparer les données pour l'export
  const examInfo: ExamInfo = useMemo(
    () => ({
      name: examName || 'Examen',
      year: examYear || new Date().getFullYear(),
      passingGrade: passingGrade || 10,
      maxGrade: maxGrade || 20,
    }),
    [examName, examYear, passingGrade, maxGrade]
  );

  // Convertir les données de salle au format export
  const getExportRoom = (room: RoomAssignment): ExportRoom => ({
    roomNumber: room.roomNumber,
    capacity: roomCapacity,
    students: room.students.map((student) => {
      const fullStudent = students.find((s) => String(s.id) === student.id);
      return {
        id: student.id,
        lastName: student.lastName,
        firstName: student.firstName,
        schoolName: fullStudent ? getSchoolName(fullStudent.schoolId) : undefined,
      };
    }),
  });

  const exportRooms: ExportRoom[] = useMemo(
    () => filledRooms.map(getExportRoom),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filledRooms, students, schools, roomCapacity]
  );

  // Handlers d'export
  const handleExportRoomExcel = async (room: RoomAssignment) => {
    await exportRoomToExcel(examInfo, getExportRoom(room));
  };

  const handleExportAllExcel = async () => {
    await exportAllRoomsToExcel(examInfo, exportRooms);
  };

  const handleExportRoomPdf = async (room: RoomAssignment) => {
    await exportRoomToPdf(examInfo, getExportRoom(room));
  };

  const handleExportAllPdf = async () => {
    await exportAllRoomsToPdf(examInfo, exportRooms);
  };

  const handlePrintRoom = async (room: RoomAssignment) => {
    await printRoom(examInfo, getExportRoom(room));
  };

  const handlePrintAll = async () => {
    await printAllRooms(examInfo, exportRooms);
  };

  return (
    <PageContainer
      description="Répartissez les candidats dans les salles d'examen selon vos critères."
      action={
        hasStudents && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleOpenConfig}>
              <Settings2 className="h-4 w-4 mr-2" />
              Configurer
            </Button>
            {roomAssignments.length === 0 ? (
              <Button onClick={handleGenerateAssignments}>
                <Users className="h-4 w-4 mr-2" />
                Générer la répartition
              </Button>
            ) : (
              <Button variant="secondary" onClick={handleGenerateAssignments}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Regénérer
              </Button>
            )}
          </div>
        )
      }
    >
      {hasStudents ? (
        <div className="space-y-6">
          {/* Configuration actuelle */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Candidats à répartir
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{students.length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Nombre de salles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{roomCount}</p>
                <p className="text-xs text-muted-foreground">
                  Minimum recommandé: {recommendedRooms}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Capacité par salle
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{roomCapacity}</p>
                <p className="text-xs text-muted-foreground">places maximum</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Capacité totale
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {roomCount * roomCapacity}
                </p>
                <p className="text-xs text-muted-foreground">
                  {roomCount * roomCapacity >= students.length ? (
                    <span className="text-green-600">Suffisant</span>
                  ) : (
                    <span className="text-red-600">Insuffisant</span>
                  )}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Résultat de la répartition */}
          {roomAssignments.length > 0 ? (
            <div className="space-y-4">
              {/* Stats + Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="text-base">
                        Résumé de la répartition
                      </CardTitle>
                      {roomStats && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {roomStats.totalAssigned} élèves
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {roomStats.filledRooms} salles
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            ~{roomStats.avgPerRoom}/salle
                          </Badge>
                          {roomStats.emptyRooms > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {roomStats.emptyRooms} vide(s)
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Barre d'actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Exporter tout */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Exporter
                            <ChevronDown className="h-4 w-4 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={handleExportAllExcel}>
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            Toutes les salles (Excel)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleExportAllPdf}>
                            <FileText className="h-4 w-4 mr-2" />
                            Toutes les salles (PDF)
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Imprimer tout */}
                      <Button size="sm" variant="outline" onClick={handlePrintAll}>
                        <Printer className="h-4 w-4 mr-2" />
                        Imprimer tout
                      </Button>

                      {/* Effacer */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={handleClearAssignments}
                      >
                        Effacer
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Onglets par salle */}
              <Tabs defaultValue={`room-1`} className="w-full">
                <TabsList className="flex flex-wrap h-auto gap-1">
                  {filledRooms.map((room) => (
                    <TabsTrigger
                      key={room.roomNumber}
                      value={`room-${room.roomNumber}`}
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <DoorOpen className="h-4 w-4 mr-1" />
                      Salle {room.roomNumber}
                      <Badge variant="outline" className="ml-2">
                        {room.students.length}
                      </Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {filledRooms.map((room) => (
                  <TabsContent
                    key={room.roomNumber}
                    value={`room-${room.roomNumber}`}
                    className="mt-4"
                  >
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              <DoorOpen className="h-5 w-5" />
                              Salle {room.roomNumber}
                            </CardTitle>
                            <CardDescription>
                              {room.students.length} élève(s) sur {roomCapacity}{' '}
                              places
                            </CardDescription>
                          </div>
                          {/* Actions par salle */}
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleExportRoomExcel(room)}
                              title="Exporter en Excel"
                            >
                              <FileSpreadsheet className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleExportRoomPdf(room)}
                              title="Exporter en PDF"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handlePrintRoom(room)}
                              title="Imprimer"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[60px]">N°</TableHead>
                                <TableHead>Nom</TableHead>
                                <TableHead>Prénom</TableHead>
                                <TableHead>Établissement</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {room.students.map((student, index) => {
                                const fullStudent = students.find(
                                  (s) => String(s.id) === student.id
                                );
                                return (
                                  <TableRow key={student.id}>
                                    <TableCell className="font-medium">
                                      {index + 1}
                                    </TableCell>
                                    <TableCell>{student.lastName}</TableCell>
                                    <TableCell>{student.firstName}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                      {fullStudent
                                        ? getSchoolName(fullStudent.schoolId)
                                        : '—'}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Répartition alphabétique
                </CardTitle>
                <CardDescription>
                  Les élèves seront répartis par ordre alphabétique (nom puis
                  prénom) dans les salles configurées.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Cliquez sur "Générer la répartition" pour distribuer les{' '}
                    {students.length} candidats dans {roomCount} salles.
                  </p>
                  <Button onClick={handleGenerateAssignments}>
                    <Users className="h-4 w-4 mr-2" />
                    Générer la répartition
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <EmptyState
          title="Aucun candidat à répartir"
          description="Ajoutez d'abord des élèves pour pouvoir les répartir en salles."
          icon={DoorOpen}
        />
      )}

      {/* Dialog Configuration */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configuration des salles</DialogTitle>
            <DialogDescription>
              Définissez le nombre de salles et leur capacité.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="roomCount">Nombre de salles</Label>
              <Input
                id="roomCount"
                type="number"
                min="1"
                max="100"
                value={formRoomCount}
                onChange={(e) => setFormRoomCount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Minimum recommandé:{' '}
                {calculateRequiredRooms(
                  students.length,
                  parseInt(formRoomCapacity) || 30
                )}{' '}
                salles
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="roomCapacity">Capacité par salle</Label>
              <Input
                id="roomCapacity"
                type="number"
                min="1"
                max="500"
                value={formRoomCapacity}
                onChange={(e) => setFormRoomCapacity(e.target.value)}
              />
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Capacité totale:</strong>{' '}
                {(parseInt(formRoomCount) || 0) *
                  (parseInt(formRoomCapacity) || 0)}{' '}
                places
              </p>
              <p className="text-sm text-muted-foreground">
                {(parseInt(formRoomCount) || 0) *
                  (parseInt(formRoomCapacity) || 0) >=
                students.length
                  ? '✓ Suffisant pour tous les candidats'
                  : '⚠ Insuffisant pour tous les candidats'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfigDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button onClick={handleSaveConfig}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
