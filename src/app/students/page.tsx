/**
 * StudentsPage - Gestion des élèves/candidats
 *
 * Permet de:
 * - Lister les élèves
 * - Ajouter manuellement
 * - Modifier/Supprimer
 * - Rechercher et filtrer
 */

import { useState } from 'react';
import { PageContainer } from '@/components/layout';
import { EmptyState } from '@/components/common';
import { Button } from '@/components/ui/button';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Upload, Pencil, Trash2, Search } from 'lucide-react';
import { useStudentsStore, useSchoolsStore, useScoresStore, useSubjectsStore } from '@/stores';
import type { Student } from '@/stores';

export function StudentsPage() {
  const { students, addStudent, updateStudent, deleteStudent } = useStudentsStore();
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

  // Formulaire
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formSchoolId, setFormSchoolId] = useState<string>('');
  const [formGender, setFormGender] = useState<string>('');

  // Filtrage
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      !searchQuery ||
      s.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.candidateNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSchool =
      filterSchool === 'all' || s.schoolId === parseInt(filterSchool);

    return matchesSearch && matchesSchool;
  });

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
    }
  };

  const handleEdit = () => {
    if (selectedStudent && formFirstName.trim() && formLastName.trim() && formSchoolId) {
      updateStudent(selectedStudent.id, {
        firstName: formFirstName,
        lastName: formLastName,
        schoolId: parseInt(formSchoolId),
        gender: formGender || undefined,
      });
      setIsEditDialogOpen(false);
      setSelectedStudent(null);
    }
  };

  const handleDelete = () => {
    if (selectedStudent) {
      deleteStudent(selectedStudent.id);
      setIsDeleteDialogOpen(false);
      setSelectedStudent(null);
    }
  };

  const handleImportExcel = () => {
    // TODO: Implémenter l'import Excel
    console.log('Import Excel à implémenter');
  };

  const isFormValid = formFirstName.trim() && formLastName.trim() && formSchoolId;

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
            <DropdownMenuItem onClick={handleImportExcel}>
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

          {/* Table des élèves */}
          {students.length > 0 && (
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
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Badge variant="outline">{student.candidateNumber}</Badge>
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
    </PageContainer>
  );
}
