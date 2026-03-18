/**
 * AdminPage - Page d'administration des données
 *
 * Permet aux administrateurs de:
 * - S'authentifier avec le mot de passe admin
 * - Exporter les données (JSON)
 * - Importer des données (JSON)
 * - Réinitialiser les données
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  clearAllData,
  downloadExportedData,
  downloadExportedDataTauri,
  importFromFile,
  importFromFileTauri,
  isTauri,
} from "@/services/dataExport";
import { useSecurityStore } from "@/stores";
import {
  AlertTriangle,
  Database,
  Download,
  FileJson,
  KeyRound,
  LogOut,
  RefreshCw,
  Shield,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";

export function AdminPage() {
  const { isAdminAuthenticated, authenticateAdmin, logout } =
    useSecurityStore();

  // État du formulaire de connexion
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // État des opérations
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [operationMessage, setOperationMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // État des dialogues de confirmation
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  // Référence pour l'input file
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handler de connexion
  const handleLogin = async () => {
    if (!password.trim()) {
      setLoginError("Veuillez entrer le mot de passe");
      return;
    }

    setIsLoggingIn(true);
    setLoginError("");

    const success = await authenticateAdmin(password);

    if (!success) {
      setLoginError("Mot de passe incorrect");
    }

    setPassword("");
    setIsLoggingIn(false);
  };

  // Handler d'export JSON
  const handleExport = async () => {
    setIsExporting(true);
    setOperationMessage(null);

    try {
      if (isTauri()) {
        const result = await downloadExportedDataTauri();
        setOperationMessage({
          type: result.success ? "success" : "error",
          text: result.message,
        });
      } else {
        downloadExportedData();
        setOperationMessage({
          type: "success",
          text: "Données exportées avec succès",
        });
      }
    } catch (error) {
      setOperationMessage({
        type: "error",
        text: `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      });
    }

    setIsExporting(false);
  };

  // Handler d'import JSON
  const handleImportClick = () => {
    if (isTauri()) {
      handleImportTauri();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleImportTauri = async () => {
    setIsImporting(true);
    setOperationMessage(null);

    const result = await importFromFileTauri();

    setOperationMessage({
      type: result.success ? "success" : "error",
      text: result.message,
    });

    setIsImporting(false);

    if (result.success) {
      // Rafraîchir la page après import
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setOperationMessage(null);

    const result = await importFromFile(file);

    setOperationMessage({
      type: result.success ? "success" : "error",
      text: result.message,
    });

    setIsImporting(false);

    // Reset l'input file
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (result.success) {
      // Rafraîchir la page après import
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  // Handler de réinitialisation
  const handleReset = () => {
    setIsResetting(true);
    setOperationMessage(null);

    try {
      clearAllData();
      setOperationMessage({
        type: "success",
        text: "Toutes les données ont été supprimées. La page va se rafraîchir.",
      });

      // Rafraîchir la page après reset
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      setOperationMessage({
        type: "error",
        text: `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      });
    }

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
                {isLoggingIn ? "Vérification..." : "Se connecter"}
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
      {/* Input file caché pour l'import web */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Administration</h1>
          <p className="text-muted-foreground">
            Gestion des données de l'application
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
            operationMessage.type === "success"
              ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200"
              : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200"
          }`}
        >
          {operationMessage.text}
        </div>
      )}

      {/* Info stockage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Stockage des données
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            <span className="text-muted-foreground">Type: </span>
            <code className="bg-muted px-2 py-1 rounded text-xs">
              localStorage (navigateur)
            </code>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Les données sont stockées localement dans votre navigateur. Utilisez
            l'export pour créer une sauvegarde.
          </p>
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
              Téléchargez une sauvegarde de vos données au format JSON.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full"
            >
              <FileJson className="h-4 w-4 mr-2" />
              {isExporting ? "Export en cours..." : "Exporter (JSON)"}
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
              Restaurez vos données depuis un fichier JSON de sauvegarde.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="secondary"
              onClick={handleImportClick}
              disabled={isImporting}
              className="w-full"
            >
              <FileJson className="h-4 w-4 mr-2" />
              {isImporting ? "Import en cours..." : "Importer (JSON)"}
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
              onClick={() => setIsResetDialogOpen(true)}
              disabled={isResetting}
              className="w-full"
            >
              {isResetting ? "Réinitialisation..." : "Réinitialiser"}
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
            Assurez-vous d'avoir une sauvegarde avant de procéder. La page sera
            rafraîchie après ces opérations.
          </p>
        </div>
      </div>

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
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              disabled={isResetting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isResetting ? "Suppression..." : "Supprimer toutes les données"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
