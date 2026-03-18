/**
 * SettingsPage - Paramètres de l'application
 *
 * Onglets :
 * 1. Mentions - Configuration des seuils de mentions
 * 2. Documents - Personnalisation des en-têtes, signatures, formats
 * 3. Général - Configuration générale (affichage, calculs, exports)
 */

import { useState } from 'react';
import { PageContainer } from '@/components/layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSettingsStore } from '@/stores';
import type { MentionThreshold } from '@/stores';
import {
  Award,
  FileText,
  Plus,
  RotateCcw,
  Settings2,
  SlidersHorizontal,
  Trash2,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================
// Sous-composant : Mentions
// ============================================

function MentionsTab() {
  const { mentions, addMention, updateMention, deleteMention, resetMentions } =
    useSettingsStore();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Formulaire
  const [formLabel, setFormLabel] = useState('');
  const [formMinScore, setFormMinScore] = useState('');
  const [formColor, setFormColor] = useState('#3b82f6');

  const handleOpenAdd = () => {
    setFormLabel('');
    setFormMinScore('');
    setFormColor('#3b82f6');
    setIsAddOpen(true);
  };

  const handleOpenEdit = (mention: MentionThreshold) => {
    setEditingId(mention.id);
    setFormLabel(mention.label);
    setFormMinScore(mention.minScore.toString());
    setFormColor(mention.color);
    setIsEditOpen(true);
  };

  const handleAdd = () => {
    if (!formLabel.trim() || !formMinScore) return;
    const id = formLabel.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    addMention({
      id,
      label: formLabel.trim(),
      minScore: parseFloat(formMinScore),
      color: formColor,
    });
    setIsAddOpen(false);
    toast.success(`Mention "${formLabel.trim()}" ajoutée`);
  };

  const handleEdit = () => {
    if (!editingId || !formLabel.trim() || !formMinScore) return;
    updateMention(editingId, {
      label: formLabel.trim(),
      minScore: parseFloat(formMinScore),
      color: formColor,
    });
    setIsEditOpen(false);
    toast.success('Mention modifiée');
  };

  const handleDelete = (id: string, label: string) => {
    deleteMention(id);
    toast.success(`Mention "${label}" supprimée`);
  };

  const handleReset = () => {
    resetMentions();
    setIsResetOpen(false);
    toast.success('Mentions réinitialisées');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Award className="h-4 w-4 text-primary" />
                Seuils de mentions
              </CardTitle>
              <CardDescription>
                Définissez les seuils pour attribuer automatiquement les mentions
                aux candidats selon leur moyenne.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsResetOpen(true)}>
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Réinitialiser
              </Button>
              <Button size="sm" onClick={handleOpenAdd}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Ajouter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {mentions.length > 0 ? (
            <div className="space-y-3">
              {mentions.map((mention) => (
                <div
                  key={mention.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ backgroundColor: mention.color }}
                    />
                    <div>
                      <span className="font-medium">{mention.label}</span>
                      <span className="ml-2 text-sm text-muted-foreground">
                        (≥ {mention.minScore})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge style={{ backgroundColor: mention.color, color: '#fff' }}>
                      {mention.label}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenEdit(mention)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(mention.id, mention.label)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucune mention configurée. Ajoutez des seuils de mentions.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Dialog Ajouter */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une mention</DialogTitle>
            <DialogDescription>
              Définissez le libellé, le seuil minimum et la couleur.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Libellé</Label>
              <Input
                placeholder="Ex: Très Bien"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Seuil minimum (≥)</Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                placeholder="Ex: 16"
                value={formMinScore}
                onChange={(e) => setFormMinScore(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  className="h-10 w-14 rounded border cursor-pointer"
                />
                <Input
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  className="max-w-[120px]"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAdd} disabled={!formLabel.trim() || !formMinScore}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifier */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la mention</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Libellé</Label>
              <Input
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Seuil minimum (≥)</Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={formMinScore}
                onChange={(e) => setFormMinScore(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  className="h-10 w-14 rounded border cursor-pointer"
                />
                <Input
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  className="max-w-[120px]"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEdit} disabled={!formLabel.trim() || !formMinScore}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Reset */}
      <AlertDialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réinitialiser les mentions ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les seuils seront remplacés par les valeurs par défaut (Passable, Assez
              Bien, Bien, Très Bien, Excellent).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>Réinitialiser</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================
// Sous-composant : Documents
// ============================================

function DocumentsTab() {
  const { documentConfig, setDocumentConfig, resetDocumentConfig } =
    useSettingsStore();
  const [isResetOpen, setIsResetOpen] = useState(false);

  const handleReset = () => {
    resetDocumentConfig();
    setIsResetOpen(false);
    toast.success('Configuration des documents réinitialisée');
  };

  return (
    <div className="space-y-6">
      {/* En-tête des documents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-primary" />
                En-tête des documents
              </CardTitle>
              <CardDescription>
                Personnalisez l'en-tête qui apparaîtra sur tous les documents
                exportés (PDF).
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsResetOpen(true)}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Réinitialiser
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Titre principal</Label>
              <Input
                placeholder="Ex: République du Cameroun"
                value={documentConfig.headerTitle}
                onChange={(e) =>
                  setDocumentConfig({ headerTitle: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Sous-titre</Label>
              <Input
                placeholder="Ex: Ministère de l'Éducation"
                value={documentConfig.headerSubtitle}
                onChange={(e) =>
                  setDocumentConfig({ headerSubtitle: e.target.value })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Nom de l'institution</Label>
            <Input
              placeholder="Ex: Lycée Bilingue de Yaoundé"
              value={documentConfig.institutionName}
              onChange={(e) =>
                setDocumentConfig({ institutionName: e.target.value })
              }
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="logoEnabled"
              checked={documentConfig.logoEnabled}
              onCheckedChange={(checked) =>
                setDocumentConfig({ logoEnabled: checked === true })
              }
            />
            <Label htmlFor="logoEnabled">Afficher le logo dans les documents</Label>
          </div>
        </CardContent>
      </Card>

      {/* Signatures */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Signatures</CardTitle>
          <CardDescription>
            Définissez les zones de signature qui apparaîtront en bas des documents
            officiels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Signature gauche</Label>
              <Input
                placeholder="Ex: Le Président du Jury"
                value={documentConfig.signatureLeft}
                onChange={(e) =>
                  setDocumentConfig({ signatureLeft: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Signature centre</Label>
              <Input
                placeholder="Ex: Le Directeur"
                value={documentConfig.signatureCenter}
                onChange={(e) =>
                  setDocumentConfig({ signatureCenter: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Signature droite</Label>
              <Input
                placeholder="Ex: Le Secrétaire"
                value={documentConfig.signatureRight}
                onChange={(e) =>
                  setDocumentConfig({ signatureRight: e.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pied de page & Format */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pied de page & Format</CardTitle>
          <CardDescription>
            Options de pied de page et de mise en forme des documents.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Texte de pied de page</Label>
            <Input
              placeholder="Ex: Document généré par G-Exam"
              value={documentConfig.footerText}
              onChange={(e) =>
                setDocumentConfig({ footerText: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Orientation</Label>
              <Select
                value={documentConfig.orientation}
                onValueChange={(val: 'portrait' | 'landscape') =>
                  setDocumentConfig({ orientation: val })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="landscape">Paysage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Taille de police</Label>
              <Select
                value={documentConfig.fontSize}
                onValueChange={(val: 'small' | 'medium' | 'large') =>
                  setDocumentConfig({ fontSize: val })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Petite</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="large">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showPageNumbers"
                checked={documentConfig.showPageNumbers}
                onCheckedChange={(checked) =>
                  setDocumentConfig({ showPageNumbers: checked === true })
                }
              />
              <Label htmlFor="showPageNumbers">Afficher les numéros de page</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showDate"
                checked={documentConfig.showDate}
                onCheckedChange={(checked) =>
                  setDocumentConfig({ showDate: checked === true })
                }
              />
              <Label htmlFor="showDate">Afficher la date d'impression</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aperçu */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aperçu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-6 bg-white dark:bg-zinc-950 space-y-6 text-center">
            {/* En-tête */}
            <div className="space-y-1">
              {documentConfig.headerTitle && (
                <p className="font-bold text-sm uppercase">
                  {documentConfig.headerTitle}
                </p>
              )}
              {documentConfig.headerSubtitle && (
                <p className="text-xs text-muted-foreground">
                  {documentConfig.headerSubtitle}
                </p>
              )}
              {documentConfig.institutionName && (
                <p className="text-sm font-semibold mt-2">
                  {documentConfig.institutionName}
                </p>
              )}
            </div>

            <div className="border-t" />

            {/* Corps simulé */}
            <div className="space-y-2 py-4">
              <div className="h-3 bg-muted rounded w-3/4 mx-auto" />
              <div className="h-3 bg-muted rounded w-full mx-auto" />
              <div className="h-3 bg-muted rounded w-5/6 mx-auto" />
              <div className="h-3 bg-muted rounded w-2/3 mx-auto" />
            </div>

            <div className="border-t" />

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                {documentConfig.signatureLeft && (
                  <>
                    <p className="text-xs font-medium">
                      {documentConfig.signatureLeft}
                    </p>
                    <div className="mt-8 border-b border-dashed w-24 mx-auto" />
                  </>
                )}
              </div>
              <div className="text-center">
                {documentConfig.signatureCenter && (
                  <>
                    <p className="text-xs font-medium">
                      {documentConfig.signatureCenter}
                    </p>
                    <div className="mt-8 border-b border-dashed w-24 mx-auto" />
                  </>
                )}
              </div>
              <div className="text-center">
                {documentConfig.signatureRight && (
                  <>
                    <p className="text-xs font-medium">
                      {documentConfig.signatureRight}
                    </p>
                    <div className="mt-8 border-b border-dashed w-24 mx-auto" />
                  </>
                )}
              </div>
            </div>

            {/* Pied de page */}
            <div className="border-t pt-2 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{documentConfig.footerText}</span>
              <div className="flex gap-3">
                {documentConfig.showDate && <span>18/03/2026</span>}
                {documentConfig.showPageNumbers && <span>Page 1/1</span>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirm Reset */}
      <AlertDialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Réinitialiser la configuration des documents ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tous les paramètres de personnalisation seront remplacés par les
              valeurs par défaut.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>Réinitialiser</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================
// Sous-composant : Général
// ============================================

function GeneralTab() {
  const { generalConfig, setGeneralConfig, resetGeneralConfig } =
    useSettingsStore();
  const [isResetOpen, setIsResetOpen] = useState(false);

  const handleReset = () => {
    resetGeneralConfig();
    setIsResetOpen(false);
    toast.success('Configuration générale réinitialisée');
  };

  return (
    <div className="space-y-6">
      {/* Affichage */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings2 className="h-4 w-4 text-primary" />
                Affichage
              </CardTitle>
              <CardDescription>
                Paramètres d'affichage des classements et tableaux.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsResetOpen(true)}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Réinitialiser
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Éléments par page (pagination)</Label>
            <Select
              value={String(generalConfig.defaultPageSize)}
              onValueChange={(val) =>
                setGeneralConfig({ defaultPageSize: parseInt(val) })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showMentions"
                checked={generalConfig.showMentions}
                onCheckedChange={(checked) =>
                  setGeneralConfig({ showMentions: checked === true })
                }
              />
              <Label htmlFor="showMentions">
                Afficher les mentions dans les classements et résultats
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showRankInScores"
                checked={generalConfig.showRankInScores}
                onCheckedChange={(checked) =>
                  setGeneralConfig({ showRankInScores: checked === true })
                }
              />
              <Label htmlFor="showRankInScores">
                Afficher le rang dans le récapitulatif des notes
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Calculs</CardTitle>
          <CardDescription>
            Options de calcul des moyennes et statistiques.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre de décimales pour les moyennes</Label>
            <Select
              value={String(generalConfig.roundingDecimals)}
              onValueChange={(val) =>
                setGeneralConfig({ roundingDecimals: parseInt(val) })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 décimale</SelectItem>
                <SelectItem value="1">1 décimale</SelectItem>
                <SelectItem value="2">2 décimales</SelectItem>
                <SelectItem value="3">3 décimales</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeAbsentInStats"
              checked={generalConfig.includeAbsentInStats}
              onCheckedChange={(checked) =>
                setGeneralConfig({ includeAbsentInStats: checked === true })
              }
            />
            <Label htmlFor="includeAbsentInStats">
              Inclure les absents dans les statistiques globales
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Exports */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exports</CardTitle>
          <CardDescription>
            Options par défaut pour l'exportation des documents.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Format d'export par défaut</Label>
            <Select
              value={generalConfig.defaultExportFormat}
              onValueChange={(val: 'pdf' | 'excel') =>
                setGeneralConfig({ defaultExportFormat: val })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeSchoolLogo"
              checked={generalConfig.includeSchoolLogo}
              onCheckedChange={(checked) =>
                setGeneralConfig({ includeSchoolLogo: checked === true })
              }
            />
            <Label htmlFor="includeSchoolLogo">
              Inclure le logo dans les documents exportés
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Confirm Reset */}
      <AlertDialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Réinitialiser la configuration générale ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tous les paramètres seront remplacés par les valeurs par défaut.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>Réinitialiser</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================
// Composant principal
// ============================================

export function SettingsPage() {
  return (
    <PageContainer description="Configurez les mentions, personnalisez les documents et ajustez les paramètres de l'application.">
      <Tabs defaultValue="mentions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="mentions" className="gap-1.5">
            <Award className="h-4 w-4" />
            Mentions
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="general" className="gap-1.5">
            <SlidersHorizontal className="h-4 w-4" />
            Général
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mentions">
          <MentionsTab />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsTab />
        </TabsContent>

        <TabsContent value="general">
          <GeneralTab />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
