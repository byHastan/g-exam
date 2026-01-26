/**
 * AdminPage - Page d'administration de la base de données
 *
 * Permet aux administrateurs de:
 * - S'authentifier avec le mot de passe admin
 * - Exporter la base de données
 * - Importer une base de données
 * - Réinitialiser la base de données
 */

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
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  exportDatabase,
  getDatabasePath,
  importDatabase,
  resetDatabase,
} from '@/services/db/admin';
import { useSecurityStore } from '@/stores';
import {
  AlertTriangle,
  Database,
  Download,
  KeyRound,
  LogOut,
  RefreshCw,
  Shield,
  Upload,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export function AdminPage() {
  const { isAdminAuthenticated, authenticateAdmin, logout, isSessionValid } =
    useSecurityStore();

  // État du formulaire de connexion
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // État des opérations
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [operationMessage, setOperationMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // État des dialogues de confirmation
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  // Chemin de la BD
  const [dbPath, setDbPath] = useState<string>('');

  // Charger le chemin de la BD au montage
  useEffect(() => {
    getDatabasePath()
      .then(setDbPath)
      .catch((err) => console.error('Erreur chemin BD:', err));
  }, []);

  // Vérifier la validité de la session au montage
  useEffect(() => {
    isSessionValid();
  }, [isSessionValid]);

  // Handler de connexion
  const handleLogin = async () => {
    if (!password.trim()) {
      setLoginError('Veuillez entrer le mot de passe');
      return;
    }

    setIsLoggingIn(true);
    setLoginError('');

    const success = await authenticateAdmin(password);

    if (!success) {
      setLoginError('Mot de passe incorrect');
    }

    setPassword('');
    setIsLoggingIn(false);
  };

  // Handler d'export
  const handleExport = async () => {
    setIsExporting(true);
    setOperationMessage(null);

    const result = await exportDatabase();

    setOperationMessage({
      type: result.success ? 'success' : 'error',
      text: result.message,
    });

    setIsExporting(false);
  };

  // Handler d'import
  const handleImport = async () => {
    if (!confirmPassword.trim()) {
      setOperationMessage({
        type: 'error',
        text: 'Veuillez confirmer avec votre mot de passe',
      });
      return;
    }

    setIsImporting(true);
    setOperationMessage(null);

    const result = await importDatabase(confirmPassword);

    setOperationMessage({
      type: result.success ? 'success' : 'error',
      text: result.message,
    });

    setConfirmPassword('');
    setIsImportDialogOpen(false);
    setIsImporting(false);
  };

  // Handler de réinitialisation
  const handleReset = async () => {
    if (!confirmPassword.trim()) {
      setOperationMessage({
        type: 'error',
        text: 'Veuillez confirmer avec votre mot de passe',
      });
      return;
    }

    setIsResetting(true);
    setOperationMessage(null);

    const result = await resetDatabase(confirmPassword);

    setOperationMessage({
      type: result.success ? 'success' : 'error',
      text: result.message,
    });

    setConfirmPassword('');
    setIsResetDialogOpen(false);
    setIsResetting(false);
  };

  // Affichage du formulaire de connexion si non authentifié
  if (!isAdminAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Administration</CardTitle>
            <CardDescription>
              Entrez le mot de passe administrateur pour accéder aux fonctions
              avancées de gestion de la base de données.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe administrateur</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Entrez le mot de passe..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    autoFocus
                  />
                </div>
                {loginError && (
                  <p className="text-sm text-destructive">{loginError}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isLoggingIn}>
                {isLoggingIn ? 'Vérification...' : 'Se connecter'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Affichage du panneau d'administration
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Administration</h1>
          <p className="text-muted-foreground">
            Gestion avancée de la base de données
          </p>
        </div>
        <Button variant="outline" onClick={logout}>
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </Button>
      </div>

      {/* Message d'opération */}
      {operationMessage && (
        <div
          className={`p-4 rounded-lg border ${
            operationMessage.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
          }`}
        >
          {operationMessage.text}
        </div>
      )}

      {/* Info base de données */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Informations de la base de données
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            <span className="text-muted-foreground">Emplacement: </span>
            <code className="bg-muted px-2 py-1 rounded text-xs break-all">
              {dbPath || 'Chargement...'}
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Download className="h-5 w-5" />
              Exporter
            </CardTitle>
            <CardDescription>
              Téléchargez une copie de sauvegarde de la base de données.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full"
            >
              {isExporting ? 'Export en cours...' : 'Exporter la base de données'}
            </Button>
          </CardContent>
        </Card>

        {/* Import */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Upload className="h-5 w-5" />
              Importer
            </CardTitle>
            <CardDescription>
              Remplacez la base de données actuelle par une sauvegarde.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="secondary"
              onClick={() => {
                setConfirmPassword('');
                setIsImportDialogOpen(true);
              }}
              disabled={isImporting}
              className="w-full"
            >
              {isImporting ? 'Import en cours...' : 'Importer une base de données'}
            </Button>
          </CardContent>
        </Card>

        {/* Réinitialisation */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-destructive">
              <RefreshCw className="h-5 w-5" />
              Réinitialiser
            </CardTitle>
            <CardDescription>
              Supprimez toutes les données et recommencez à zéro.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmPassword('');
                setIsResetDialogOpen(true);
              }}
              disabled={isResetting}
              className="w-full"
            >
              {isResetting ? 'Réinitialisation...' : 'Réinitialiser la base de données'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Avertissement */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div>
          <p className="font-medium text-amber-800 dark:text-amber-200">
            Attention
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Les opérations d'import et de réinitialisation sont irréversibles.
            Assurez-vous d'avoir une sauvegarde avant de procéder.
            L'application devra être redémarrée après ces opérations.
          </p>
        </div>
      </div>

      {/* Dialog de confirmation d'import */}
      <AlertDialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l'import</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action va remplacer toutes les données actuelles par celles
              du fichier importé. Cette opération est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="confirm-import-password">
              Confirmez votre mot de passe administrateur
            </Label>
            <Input
              id="confirm-import-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Mot de passe administrateur"
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmPassword('')}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleImport} disabled={isImporting}>
              {isImporting ? 'Import...' : 'Confirmer l\'import'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmation de réinitialisation */}
      <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Confirmer la réinitialisation
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong>ATTENTION:</strong> Cette action va supprimer TOUTES les
              données de l'application (examens, élèves, notes, etc.). Cette
              opération est IRRÉVERSIBLE.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="confirm-reset-password">
              Confirmez votre mot de passe administrateur
            </Label>
            <Input
              id="confirm-reset-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Mot de passe administrateur"
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmPassword('')}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              disabled={isResetting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isResetting ? 'Suppression...' : 'Supprimer toutes les données'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
