/**
 * SchoolsPage - Gestion des établissements
 *
 * Permet de:
 * - Lister les établissements
 * - Ajouter un établissement
 * - Modifier/Supprimer un établissement
 */

import { useState } from 'react';
import { PageContainer } from '@/components/layout';
import { EmptyState } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Building2, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useSchoolsStore, useStudentsStore } from '@/stores';
import type { School } from '@/stores';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';

export function SchoolsPage() {
  const { schools, addSchool, updateSchool, deleteSchool } = useSchoolsStore();
  const { getStudentsBySchool } = useStudentsStore();

  // États locaux
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  // Formulaire
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');

  // Debounce + Filtrage
  const debouncedSearch = useDebounce(searchQuery, 300);
  const filteredSchools = debouncedSearch
    ? schools.filter(
        (s) =>
          s.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          s.code?.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : schools;

  // Handlers
  const handleOpenAdd = () => {
    setFormName('');
    setFormCode('');
    setIsAddDialogOpen(true);
  };

  const handleOpenEdit = (school: School) => {
    setSelectedSchool(school);
    setFormName(school.name);
    setFormCode(school.code || '');
    setIsEditDialogOpen(true);
  };

  const handleOpenDelete = (school: School) => {
    setSelectedSchool(school);
    setIsDeleteDialogOpen(true);
  };

  const handleAdd = () => {
    if (formName.trim()) {
      addSchool(formName, formCode || undefined);
      setIsAddDialogOpen(false);
      setFormName('');
      setFormCode('');
      toast.success(`Établissement "${formName}" ajouté`);
    }
  };

  const handleEdit = () => {
    if (selectedSchool && formName.trim()) {
      updateSchool(selectedSchool.id, {
        name: formName,
        code: formCode || undefined,
      });
      setIsEditDialogOpen(false);
      setSelectedSchool(null);
      toast.success(`Établissement modifié`);
    }
  };

  const handleDelete = () => {
    if (selectedSchool) {
      const name = selectedSchool.name;
      deleteSchool(selectedSchool.id);
      setIsDeleteDialogOpen(false);
      setSelectedSchool(null);
      toast.success(`Établissement "${name}" supprimé`);
    }
  };

  // Compte des élèves par établissement
  const getStudentCount = (schoolId: number) => {
    return getStudentsBySchool(schoolId).length;
  };

  return (
    <PageContainer
      description="Gérez les établissements participants à l'examen."
      action={
        <Button onClick={handleOpenAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un établissement
        </Button>
      }
    >
      {schools.length > 0 ? (
        <div className="space-y-4">
          {/* Barre de recherche */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un établissement..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {filteredSchools.length} établissement(s)
            </span>
          </div>

          {/* Table des établissements */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="text-center">Élèves</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchools.map((school) => (
                  <TableRow key={school.id}>
                    <TableCell className="font-medium">{school.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {school.code || '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStudentCount(school.id)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(school)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDelete(school)}
                          disabled={getStudentCount(school.id) > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSchools.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <p className="text-muted-foreground">
                        Aucun établissement trouvé
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <EmptyState
          title="Aucun établissement"
          description="Ajoutez les établissements qui participent à cet examen."
          icon={Building2}
          actionLabel="Ajouter un établissement"
          onAction={handleOpenAdd}
        />
      )}

      {/* Dialog Ajout */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un établissement</DialogTitle>
            <DialogDescription>
              Renseignez les informations de l'établissement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Lycée Victor Hugo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code (optionnel)</Label>
              <Input
                id="code"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                placeholder="Ex: LVH001"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAdd} disabled={!formName.trim()}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Modification */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'établissement</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'établissement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nom *</Label>
              <Input
                id="edit-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Lycée Victor Hugo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-code">Code (optionnel)</Label>
              <Input
                id="edit-code"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                placeholder="Ex: LVH001"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button onClick={handleEdit} disabled={!formName.trim()}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Suppression */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'établissement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'établissement "
              {selectedSchool?.name}" ? Cette action est irréversible.
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
