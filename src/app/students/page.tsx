/**
 * StudentsPage - Gestion des élèves/candidats
 *
 * Permet de:
 * - Lister les élèves
 * - Ajouter manuellement
 * - Importer via fichier Excel
 * - Modifier/Supprimer
 * - Rechercher et filtrer
 */

import { EmptyState, Pagination } from '@/components/common';
import { PageContainer } from '@/components/layout';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { downloadStudentTemplate, parseExcelFile, validateExcelFile, type ExcelStudentRow } from '@/lib/excel';
import type { Student } from '@/stores';
import { useSchoolsStore, useScoresStore, useStudentsStore, useSubjectsStore } from '@/stores';
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Pencil, Plus, Search, Trash2, Upload, Users } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';

export function StudentsPage() {
  const { students, addStudent, addManyStudents, updateStudent, deleteStudent } = useStudentsStore();
  const { schools } = useSchoolsStore();
  const { getScoresByStudent } = useScoresStore();
  const { subjects } = useSubjectsStore();

  // États locaux
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSchool, setFilterSchool] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // États pour l'import Excel
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importSchoolId, setImportSchoolId] = useState<string>('');
  const [, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ExcelStudentRow[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Formulaire
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formSchoolId, setFormSchoolId] = useState<string>('');
  const [formGender, setFormGender] = useState<string>('');
  const [formIsAbsent, setFormIsAbsent] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Debounce de la recherche
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Filtrage
  const filteredStudents = useMemo(() => students.filter((s) => {
    const matchesSearch =
      !debouncedSearch ||
      s.firstName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      s.lastName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      s.candidateNumber.toLowerCase().includes(debouncedSearch.toLowerCase());

    const matchesSchool =
      filterSchool === 'all' || s.schoolId === parseInt(filterSchool);

    return matchesSearch && matchesSchool;
  }), [students, debouncedSearch, filterSchool]);

  // Pagination des résultats filtrés
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  // Helpers
  const getSchoolName = (schoolId: number) => {
    return schools.find((s) => s.id === schoolId)?.name || 'Inconnu';
  };

  const getScoresCount = (studentId: number) => {
    return getScoresByStudent(studentId).length;
  };

  // Handlers
  const handleOpenAdd = () => {
    setFormFirstName('');
    setFormLastName('');
    setFormSchoolId('');
    setFormGender('');
    setIsAddDialogOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setSelectedStudent(student);
    setFormFirstName(student.firstName);
    setFormLastName(student.lastName);
    setFormSchoolId(String(student.schoolId));
    setFormGender(student.gender || '');
    setFormIsAbsent(student.isAbsent);
    setIsEditDialogOpen(true);
  };

  const handleOpenDelete = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };

  const handleAdd = () => {
    if (formFirstName.trim() && formLastName.trim() && formSchoolId) {
      addStudent({
        firstName: formFirstName,
        lastName: formLastName,
        schoolId: parseInt(formSchoolId),
        gender: formGender || undefined,
      });
      setIsAddDialogOpen(false);
      toast.success(`Élève "${formLastName} ${formFirstName}" ajouté`);
    }
  };

  const handleEdit = () => {
    if (selectedStudent && formFirstName.trim() && formLastName.trim() && formSchoolId) {
      updateStudent(selectedStudent.id, {
        firstName: formFirstName,
        lastName: formLastName,
        schoolId: parseInt(formSchoolId),
        gender: formGender || undefined,
        isAbsent: formIsAbsent,
      });
      setIsEditDialogOpen(false);
      setSelectedStudent(null);
      toast.success('Élève modifié');
    }
  };

  const handleDelete = () => {
    if (selectedStudent) {
      const name = `${selectedStudent.lastName} ${selectedStudent.firstName}`;
      deleteStudent(selectedStudent.id);
      setIsDeleteDialogOpen(false);
      setSelectedStudent(null);
      toast.success(`Élève "${name}" supprimé`);
    }
  };

  // ============================================
  // IMPORT EXCEL HANDLERS
  // ============================================

  const handleOpenImportDialog = () => {
    setImportSchoolId('');
    setImportFile(null);
    setImportPreview([]);
    setImportErrors([]);
    setImportSuccess(null);
    setIsImportDialogOpen(true);
  };

  const handleCloseImportDialog = () => {
    setIsImportDialogOpen(false);
    setImportFile(null);
    setImportPreview([]);
    setImportErrors([]);
    setImportSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Valider le fichier
    const validation = validateExcelFile(file);
    if (!validation.valid) {
      setImportErrors([validation.error || 'Fichier invalide']);
      setImportFile(null);
      setImportPreview([]);
      return;
    }

    setImportFile(file);
    setImportErrors([]);
    setImportSuccess(null);

    // Parser le fichier pour la prévisualisation
    const result = await parseExcelFile(file);
    
    if (result.success) {
      setImportPreview(result.students);
      setImportErrors(result.errors);
    } else {
      setImportPreview([]);
      setImportErrors(result.errors);
    }
  };

  const handleImportConfirm = async () => {
    if (!importSchoolId || importPreview.length === 0) return;

    setIsImporting(true);
    
    try {
      // Convertir les données Excel en format attendu par le store
      const studentsToAdd = importPreview.map(student => ({
        firstName: student.firstName,
        lastName: student.lastName,
        schoolId: parseInt(importSchoolId),
        gender: student.gender,
        birthDate: student.birthDate,
      }));

      // Ajouter les élèves
      const count = addManyStudents(studentsToAdd);
      setImportSuccess(count);
      setImportPreview([]);
      setImportFile(null);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setImportErrors([`Erreur lors de l'import: ${error instanceof Error ? error.message : 'Erreur inconnue'}`]);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadStudentTemplate();
    } catch (error) {
      console.error('Erreur lors du téléchargement du template:', error);
    }
  };

  const isFormValid = formFirstName.trim() && formLastName.trim() && formSchoolId;
  const isImportValid = importSchoolId && importPreview.length > 0 && !isImporting;

  return (
    <PageContainer
      description="Gérez la liste des candidats. Vous pouvez ajouter les élèves manuellement."
      action={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter des élèves
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleOpenAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter manuellement
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleOpenImportDialog}>
              <Upload className="h-4 w-4 mr-2" />
              Importer un fichier Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      }
    >
      {students.length > 0 || schools.length === 0 ? (
        <div className="space-y-4">
          {/* Avertissement si pas d'établissements */}
          {schools.length === 0 && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <p className="text-sm text-yellow-800">
                Vous devez d'abord ajouter au moins un établissement avant de pouvoir ajouter des élèves.
              </p>
            </div>
          )}

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

          {/* Table des élèves */}
          {students.length > 0 && (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Candidat</TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Prénom</TableHead>
                      <TableHead>Établissement</TableHead>
                      <TableHead className="text-center">Notes</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedStudents.map((student) => (
                      <TableRow key={student.id} className={student.isAbsent ? 'opacity-60' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{student.candidateNumber}</Badge>
                            {student.isAbsent && (
                              <Badge variant="destructive" className="text-xs">Absent</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {student.lastName}
                        </TableCell>
                        <TableCell>{student.firstName}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {getSchoolName(student.schoolId)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={getScoresCount(student.id) === subjects.length ? 'default' : 'secondary'}>
                            {getScoresCount(student.id)} / {subjects.length}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(student)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDelete(student)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredStudents.length === 0 && students.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <p className="text-muted-foreground">
                            Aucun élève trouvé
                          </p>
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
            </>
          )}

          {/* État vide */}
          {students.length === 0 && schools.length > 0 && (
            <EmptyState
              title="Aucun élève inscrit"
              description="Ajoutez les élèves manuellement pour commencer."
              icon={Users}
              actionLabel="Ajouter un élève"
              onAction={handleOpenAdd}
            />
          )}
        </div>
      ) : (
        <EmptyState
          title="Aucun élève inscrit"
          description="Ajoutez les élèves manuellement pour commencer."
          icon={Users}
          actionLabel="Ajouter un élève"
          onAction={handleOpenAdd}
        />
      )}

      {/* Dialog Ajout */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un élève</DialogTitle>
            <DialogDescription>
              Renseignez les informations de l'élève.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  value={formLastName}
                  onChange={(e) => setFormLastName(e.target.value)}
                  placeholder="Dupont"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom *</Label>
                <Input
                  id="firstName"
                  value={formFirstName}
                  onChange={(e) => setFormFirstName(e.target.value)}
                  placeholder="Jean"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="school">Établissement *</Label>
              <Select value={formSchoolId} onValueChange={setFormSchoolId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un établissement" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={String(school.id)}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Sexe (optionnel)</Label>
              <Select value={formGender} onValueChange={setFormGender}>
                <SelectTrigger>
                  <SelectValue placeholder="Non renseigné" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculin</SelectItem>
                  <SelectItem value="F">Féminin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAdd} disabled={!isFormValid}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Modification */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'élève</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'élève.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">Nom *</Label>
                <Input
                  id="edit-lastName"
                  value={formLastName}
                  onChange={(e) => setFormLastName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">Prénom *</Label>
                <Input
                  id="edit-firstName"
                  value={formFirstName}
                  onChange={(e) => setFormFirstName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-school">Établissement *</Label>
              <Select value={formSchoolId} onValueChange={setFormSchoolId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un établissement" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={String(school.id)}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-gender">Sexe (optionnel)</Label>
              <Select value={formGender} onValueChange={setFormGender}>
                <SelectTrigger>
                  <SelectValue placeholder="Non renseigné" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculin</SelectItem>
                  <SelectItem value="F">Féminin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="edit-absent"
                checked={formIsAbsent}
                onCheckedChange={(checked) => setFormIsAbsent(checked === true)}
              />
              <Label htmlFor="edit-absent" className="text-sm font-normal cursor-pointer">
                Marquer comme absent
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEdit} disabled={!isFormValid}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Suppression */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'élève ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer {selectedStudent?.firstName}{' '}
              {selectedStudent?.lastName} ? Cette action est irréversible et
              supprimera également toutes ses notes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Import Excel */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Importer des élèves depuis Excel
            </DialogTitle>
            <DialogDescription>
              Sélectionnez l'établissement puis importez votre fichier Excel contenant la liste des élèves.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Message de succès */}
            {importSuccess !== null && (
              <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Import réussi !</p>
                  <p className="text-sm text-green-700">
                    {importSuccess} élève(s) ont été ajoutés avec succès.
                  </p>
                </div>
              </div>
            )}

            {/* Étape 1: Sélection de l'établissement */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  1
                </span>
                Sélectionner l'établissement *
              </Label>
              <Select value={importSchoolId} onValueChange={setImportSchoolId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir l'établissement des élèves" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={String(school.id)}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Tous les élèves importés seront assignés à cet établissement.
              </p>
            </div>

            {/* Étape 2: Import du fichier */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  2
                </span>
                Importer le fichier Excel
              </Label>
              
              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  disabled={!importSchoolId}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="whitespace-nowrap"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Template
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Formats acceptés: .xlsx, .xls, .csv — Le fichier doit contenir les colonnes "Nom" et "Prénom" (obligatoires), et optionnellement "Sexe" et "Date de naissance".
              </p>
            </div>

            {/* Erreurs */}
            {importErrors.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium text-red-800">
                      {importPreview.length > 0 ? 'Avertissements' : 'Erreurs'}
                    </p>
                    <ul className="list-disc list-inside text-sm text-red-700 space-y-0.5">
                      {importErrors.slice(0, 5).map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                      {importErrors.length > 5 && (
                        <li>... et {importErrors.length - 5} autre(s) erreur(s)</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Prévisualisation */}
            {importPreview.length > 0 && (
              <div className="space-y-2">
                <Label>Aperçu ({importPreview.length} élève(s) à importer)</Label>
                <div className="rounded-md border max-h-48 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Prénom</TableHead>
                        <TableHead>Sexe</TableHead>
                        <TableHead>Date de naissance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importPreview.slice(0, 10).map((student, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{student.lastName}</TableCell>
                          <TableCell>{student.firstName}</TableCell>
                          <TableCell>{student.gender || '—'}</TableCell>
                          <TableCell>
                            {student.birthDate
                              ? student.birthDate.toLocaleDateString('fr-FR')
                              : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                      {importPreview.length > 10 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            ... et {importPreview.length - 10} autre(s) élève(s)
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseImportDialog}>
              {importSuccess !== null ? 'Fermer' : 'Annuler'}
            </Button>
            {importSuccess === null && (
              <Button
                onClick={handleImportConfirm}
                disabled={!isImportValid}
              >
                {isImporting ? (
                  <>Importation...</>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Importer {importPreview.length > 0 ? `(${importPreview.length})` : ''}
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
