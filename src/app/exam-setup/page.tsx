/**
 * ExamSetupPage - Configuration de l'examen
 *
 * Permet de:
 * - Créer un nouvel examen
 * - Définir le nom, l'année, le seuil de réussite
 * - Verrouiller/déverrouiller l'examen
 */

import { EmptyState } from '@/components/common';
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useExamStore,
  useSchoolsStore,
  useScoresStore,
  useStudentsStore,
  useSubjectsStore,
} from '@/stores';
import { Lock, Pencil, Plus, Settings, Trash2, Unlock } from 'lucide-react';
import { useState } from 'react';

// Compteur simple pour les IDs d'examen
let examIdCounter = 1;

export function ExamSetupPage() {
  const {
    examId,
    examName,
    examYear,
    status,
    passingGrade,
    maxGrade,
    setExam,
    setStatus,
    clearExam,
  } = useExamStore();
  const { students, clearAll: clearStudents, setExamYear } = useStudentsStore();
  const { subjects, clearAll: clearSubjects } = useSubjectsStore();
  const { scores, clearAll: clearScores } = useScoresStore();
  const { schools } = useSchoolsStore();

  const hasExam = examName && examYear;

  // États des dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLockDialogOpen, setIsLockDialogOpen] = useState(false);

  // Formulaire
  const [formName, setFormName] = useState('');
  const [formYear, setFormYear] = useState(new Date().getFullYear().toString());
  const [formMaxGrade, setFormMaxGrade] = useState('20');
  const [formPassingGrade, setFormPassingGrade] = useState('10');

  // Handlers
  const handleOpenCreate = () => {
    setFormName('');
    setFormYear(new Date().getFullYear().toString());
    setFormMaxGrade('20');
    setFormPassingGrade('10');
    setIsCreateDialogOpen(true);
  };

  const handleOpenEdit = () => {
    setFormName(examName || '');
    setFormYear(examYear?.toString() || new Date().getFullYear().toString());
    setFormMaxGrade(maxGrade.toString());
    setFormPassingGrade(passingGrade.toString());
    setIsEditDialogOpen(true);
  };

  const handleCreate = () => {
    if (formName.trim() && formYear) {
      const year = parseInt(formYear);
      const max = parseFloat(formMaxGrade) || 20;
      const grade = parseFloat(formPassingGrade) || (max / 2);
      setExam(examIdCounter++, formName.trim(), year, grade, max);
      setExamYear(year);
      setIsCreateDialogOpen(false);
    }
  };

  const handleEdit = () => {
    if (formName.trim() && formYear && examId) {
      const year = parseInt(formYear);
      const max = parseFloat(formMaxGrade) || 20;
      const grade = parseFloat(formPassingGrade) || (max / 2);
      setExam(examId, formName.trim(), year, grade, max);
      setExamYear(year);
      setIsEditDialogOpen(false);
    }
  };

  const handleDelete = () => {
    // Supprimer toutes les données associées
    clearScores();
    clearStudents();
    clearSubjects();
    clearExam();
    setIsDeleteDialogOpen(false);
  };

  const handleToggleLock = () => {
    if (status === 'locked') {
      setStatus('draft');
    } else {
      setIsLockDialogOpen(true);
    }
  };

  const handleConfirmLock = () => {
    setStatus('locked');
    setIsLockDialogOpen(false);
  };

  const isFormValid = formName.trim() && formYear && parseInt(formYear) > 2000;

  return (
    <PageContainer
      description="Configurez les paramètres de l'examen: nom, année scolaire, seuil de réussite."
      action={
        hasExam ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleOpenEdit}
              disabled={status === 'locked'}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </div>
        ) : (
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Créer un examen
          </Button>
        )
      }
    >
      {hasExam ? (
        <div className="space-y-6">
          {/* Informations de l'examen */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Nom de l'examen</CardTitle>
                <CardDescription>Identifiant de l'examen</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{examName}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Année scolaire</CardTitle>
                <CardDescription>Session de l'examen</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{examYear}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Seuil de réussite</CardTitle>
                <CardDescription>Moyenne minimale pour être admis</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{passingGrade}/{maxGrade}</p>
              </CardContent>
            </Card>
          </div>

          {/* Résumé des données */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Données de l'examen</CardTitle>
              <CardDescription>
                Résumé des informations enregistrées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold">{schools.length}</p>
                  <p className="text-sm text-muted-foreground">Établissements</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold">{students.length}</p>
                  <p className="text-sm text-muted-foreground">Candidats</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold">{subjects.length}</p>
                  <p className="text-sm text-muted-foreground">Épreuves</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold">{scores.length}</p>
                  <p className="text-sm text-muted-foreground">Notes saisies</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statut et actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Statut de l'examen</CardTitle>
              <CardDescription>
                Un examen verrouillé ne peut plus être modifié
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge
                  variant={status === 'locked' ? 'default' : 'secondary'}
                  className="text-sm"
                >
                  {status === 'locked' ? (
                    <>
                      <Lock className="h-3 w-3 mr-1" />
                      Verrouillé
                    </>
                  ) : (
                    <>
                      <Unlock className="h-3 w-3 mr-1" />
                      Brouillon
                    </>
                  )}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {status === 'locked'
                    ? 'Les notes ne peuvent plus être modifiées'
                    : 'Les modifications sont autorisées'}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleToggleLock}>
                  {status === 'locked' ? (
                    <>
                      <Unlock className="h-4 w-4 mr-2" />
                      Déverrouiller
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Verrouiller
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <EmptyState
          title="Aucun examen configuré"
          description="Créez un examen pour commencer à gérer les candidats, les épreuves et les notes."
          icon={Settings}
          actionLabel="Créer un examen"
          onAction={handleOpenCreate}
        />
      )}

      {/* Dialog Création */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un examen</DialogTitle>
            <DialogDescription>
              Configurez les paramètres de base de l'examen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l'examen *</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: CEPE, BEPC, BAC..."
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Année *</Label>
                <Input
                  id="year"
                  type="number"
                  min="2000"
                  max="2100"
                  value={formYear}
                  onChange={(e) => setFormYear(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxGrade">Barème</Label>
                <Input
                  id="maxGrade"
                  type="number"
                  min="1"
                  max="1000"
                  step="1"
                  value={formMaxGrade}
                  onChange={(e) => setFormMaxGrade(e.target.value)}
                  placeholder="Ex: 20, 100..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passingGrade">Seuil de réussite</Label>
                <Input
                  id="passingGrade"
                  type="number"
                  min="0"
                  max={formMaxGrade}
                  step="0.5"
                  value={formPassingGrade}
                  onChange={(e) => setFormPassingGrade(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={!isFormValid}>
              Créer l'examen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Modification */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'examen</DialogTitle>
            <DialogDescription>
              Modifiez les paramètres de l'examen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nom de l'examen *</Label>
              <Input
                id="edit-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-year">Année *</Label>
                <Input
                  id="edit-year"
                  type="number"
                  min="2000"
                  max="2100"
                  value={formYear}
                  onChange={(e) => setFormYear(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-maxGrade">Barème</Label>
                <Input
                  id="edit-maxGrade"
                  type="number"
                  min="1"
                  max="1000"
                  step="1"
                  value={formMaxGrade}
                  onChange={(e) => setFormMaxGrade(e.target.value)}
                  placeholder="Ex: 20, 100..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-passingGrade">Seuil de réussite</Label>
                <Input
                  id="edit-passingGrade"
                  type="number"
                  min="0"
                  max={formMaxGrade}
                  step="0.5"
                  value={formPassingGrade}
                  onChange={(e) => setFormPassingGrade(e.target.value)}
                />
              </div>
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

      {/* Dialog Verrouillage */}
      <AlertDialog open={isLockDialogOpen} onOpenChange={setIsLockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verrouiller l'examen ?</AlertDialogTitle>
            <AlertDialogDescription>
              Une fois verrouillé, les notes ne pourront plus être modifiées.
              Vous pourrez toutefois déverrouiller l'examen si nécessaire.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmLock}>
              Verrouiller
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Suppression */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'examen ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les données seront
              supprimées:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>{students.length} candidat(s)</li>
                <li>{subjects.length} épreuve(s)</li>
                <li>{scores.length} note(s)</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
