/**
 * SubjectsPage - Gestion des épreuves/matières
 *
 * Permet de:
 * - Lister les épreuves
 * - Ajouter une épreuve avec coefficient
 * - Modifier/Supprimer
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
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Pencil, Trash2 } from 'lucide-react';
import { useSubjectsStore, useScoresStore } from '@/stores';
import type { Subject } from '@/stores';
import { toast } from 'sonner';

export function SubjectsPage() {
  const { subjects, addSubject, updateSubject, deleteSubject, getTotalCoefficients, hasCoefficients } =
    useSubjectsStore();
  const { getScoresBySubject } = useScoresStore();

  // États locaux
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // Formulaire
  const [formName, setFormName] = useState('');
  const [formCoefficient, setFormCoefficient] = useState('');
  const [formMaxScore, setFormMaxScore] = useState('20');

  // Helpers
  const getScoresCount = (subjectId: number) => {
    return getScoresBySubject(subjectId).length;
  };

  // Handlers
  const handleOpenAdd = () => {
    setFormName('');
    setFormCoefficient('');
    setFormMaxScore('20');
    setIsAddDialogOpen(true);
  };

  const handleOpenEdit = (subject: Subject) => {
    setSelectedSubject(subject);
    setFormName(subject.name);
    setFormCoefficient(subject.coefficient?.toString() || '');
    setFormMaxScore(subject.maxScore.toString());
    setIsEditDialogOpen(true);
  };

  const handleOpenDelete = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsDeleteDialogOpen(true);
  };

  const handleAdd = () => {
    if (formName.trim()) {
      addSubject({
        name: formName,
        coefficient: formCoefficient ? parseFloat(formCoefficient) : undefined,
        maxScore: formMaxScore ? parseFloat(formMaxScore) : 20,
      });
      setIsAddDialogOpen(false);
      toast.success(`Épreuve "${formName}" ajoutée`);
    }
  };

  const handleEdit = () => {
    if (selectedSubject && formName.trim()) {
      updateSubject(selectedSubject.id, {
        name: formName,
        coefficient: formCoefficient ? parseFloat(formCoefficient) : undefined,
        maxScore: formMaxScore ? parseFloat(formMaxScore) : 20,
      });
      setIsEditDialogOpen(false);
      setSelectedSubject(null);
      toast.success(`Épreuve modifiée`);
    }
  };

  const handleDelete = () => {
    if (selectedSubject) {
      const name = selectedSubject.name;
      deleteSubject(selectedSubject.id);
      setIsDeleteDialogOpen(false);
      setSelectedSubject(null);
      toast.success(`Épreuve "${name}" supprimée`);
    }
  };

  const totalCoef = getTotalCoefficients();
  const useCoefficients = hasCoefficients();

  return (
    <PageContainer
      description="Définissez les épreuves de l'examen et leurs coefficients."
      action={
        <Button onClick={handleOpenAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une épreuve
        </Button>
      }
    >
      {subjects.length > 0 ? (
        <div className="space-y-4">
          {/* Résumé */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm text-muted-foreground">Épreuves</p>
              <p className="text-2xl font-bold">{subjects.length}</p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div>
              <p className="text-sm text-muted-foreground">Mode de calcul</p>
              <p className="text-lg font-medium">
                {useCoefficients ? (
                  <span>
                    Moyenne pondérée{' '}
                    <Badge variant="secondary">Σ coef = {totalCoef}</Badge>
                  </span>
                ) : (
                  'Moyenne simple'
                )}
              </p>
            </div>
          </div>

          {/* Table des épreuves */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom de l'épreuve</TableHead>
                  <TableHead className="text-center">Coefficient</TableHead>
                  <TableHead className="text-center">Note max</TableHead>
                  <TableHead className="text-center">Notes saisies</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell className="font-medium">{subject.name}</TableCell>
                    <TableCell className="text-center">
                      {subject.coefficient !== null ? (
                        <Badge>{subject.coefficient}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {subject.maxScore}
                    </TableCell>
                    <TableCell className="text-center">
                      {getScoresCount(subject.id)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(subject)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDelete(subject)}
                          disabled={getScoresCount(subject.id) > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <EmptyState
          title="Aucune épreuve définie"
          description="Ajoutez les matières de l'examen avec leurs coefficients respectifs."
          icon={FileText}
          actionLabel="Ajouter une épreuve"
          onAction={handleOpenAdd}
        />
      )}

      {/* Dialog Ajout */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une épreuve</DialogTitle>
            <DialogDescription>
              Renseignez les informations de l'épreuve. Le coefficient est
              optionnel.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l'épreuve *</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Mathématiques"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coefficient">Coefficient (optionnel)</Label>
                <Input
                  id="coefficient"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formCoefficient}
                  onChange={(e) => setFormCoefficient(e.target.value)}
                  placeholder="Ex: 2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxScore">Note maximale</Label>
                <Input
                  id="maxScore"
                  type="number"
                  min="1"
                  value={formMaxScore}
                  onChange={(e) => setFormMaxScore(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Si au moins une épreuve a un coefficient, la moyenne sera
              pondérée. Sinon, ce sera une moyenne simple.
            </p>
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
            <DialogTitle>Modifier l'épreuve</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'épreuve.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nom de l'épreuve *</Label>
              <Input
                id="edit-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-coefficient">Coefficient (optionnel)</Label>
                <Input
                  id="edit-coefficient"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formCoefficient}
                  onChange={(e) => setFormCoefficient(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-maxScore">Note maximale</Label>
                <Input
                  id="edit-maxScore"
                  type="number"
                  min="1"
                  value={formMaxScore}
                  onChange={(e) => setFormMaxScore(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEdit} disabled={!formName.trim()}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Suppression */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'épreuve ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'épreuve "
              {selectedSubject?.name}" ? Cette action est irréversible.
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
