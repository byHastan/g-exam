/**
 * Service d'export/import des données depuis localStorage
 *
 * Permet d'exporter et importer toutes les données de l'application
 * stockées dans les stores Zustand (localStorage)
 */

// ============================================
// TYPES
// ============================================

/**
 * Structure des données exportées
 */
export interface ExportedData {
  version: string;
  exportDate: string;
  data: {
    exam: unknown;
    schools: unknown;
    students: unknown;
    subjects: unknown;
    scores: unknown;
  };
}

/**
 * Clés localStorage des stores Zustand
 */
const STORAGE_KEYS = {
  exam: "exam-storage",
  schools: "schools-storage",
  students: "students-storage",
  subjects: "subjects-storage",
  scores: "scores-storage",
} as const;

/**
 * Version actuelle du format d'export
 */
const EXPORT_VERSION = "1.0";

// ============================================
// FONCTIONS D'EXPORT
// ============================================

/**
 * Récupère les données d'un store depuis localStorage
 */
function getStoreData(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    // Les stores Zustand persist stockent les données dans .state
    return parsed.state || parsed;
  } catch (error) {
    console.error(`Erreur lecture store ${key}:`, error);
    return null;
  }
}

/**
 * Exporte toutes les données de l'application en JSON
 */
export function exportAllData(): ExportedData {
  const exportData: ExportedData = {
    version: EXPORT_VERSION,
    exportDate: new Date().toISOString(),
    data: {
      exam: getStoreData(STORAGE_KEYS.exam),
      schools: getStoreData(STORAGE_KEYS.schools),
      students: getStoreData(STORAGE_KEYS.students),
      subjects: getStoreData(STORAGE_KEYS.subjects),
      scores: getStoreData(STORAGE_KEYS.scores),
    },
  };

  return exportData;
}

/**
 * Télécharge les données exportées en fichier JSON
 */
export function downloadExportedData(filename?: string): void {
  const data = exportAllData();
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download =
    filename ||
    `exam-manager-backup-${new Date().toISOString().split("T")[0]}.json`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Télécharge les données via Tauri (dialog natif)
 */
export async function downloadExportedDataTauri(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const { writeTextFile } = await import("@tauri-apps/plugin-fs");

    const filePath = await save({
      defaultPath: `exam-manager-backup-${new Date().toISOString().split("T")[0]}.json`,
      filters: [{ name: "JSON", extensions: ["json"] }],
      title: "Exporter les données",
    });

    if (!filePath) {
      return { success: false, message: "Export annulé par l'utilisateur" };
    }

    const data = exportAllData();
    const jsonString = JSON.stringify(data, null, 2);
    await writeTextFile(filePath, jsonString);

    return { success: true, message: `Données exportées vers: ${filePath}` };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Erreur lors de l'export: ${errorMessage}`,
    };
  }
}

// ============================================
// FONCTIONS D'IMPORT
// ============================================

/**
 * Valide le format des données importées
 */
function validateImportData(data: unknown): data is ExportedData {
  if (!data || typeof data !== "object") return false;

  const obj = data as Record<string, unknown>;

  if (typeof obj.version !== "string") return false;
  if (typeof obj.exportDate !== "string") return false;
  if (!obj.data || typeof obj.data !== "object") return false;

  return true;
}

/**
 * Écrit les données d'un store dans localStorage
 */
function setStoreData(key: string, data: unknown): void {
  if (data === null || data === undefined) return;

  try {
    // Format Zustand persist
    const storeData = { state: data, version: 0 };
    localStorage.setItem(key, JSON.stringify(storeData));
  } catch (error) {
    console.error(`Erreur écriture store ${key}:`, error);
    throw error;
  }
}

/**
 * Importe les données depuis un objet JSON
 */
export function importData(data: ExportedData): {
  success: boolean;
  message: string;
} {
  try {
    if (!validateImportData(data)) {
      return { success: false, message: "Format de données invalide" };
    }

    // Importer chaque store
    if (data.data.exam) setStoreData(STORAGE_KEYS.exam, data.data.exam);
    if (data.data.schools)
      setStoreData(STORAGE_KEYS.schools, data.data.schools);
    if (data.data.students)
      setStoreData(STORAGE_KEYS.students, data.data.students);
    if (data.data.subjects)
      setStoreData(STORAGE_KEYS.subjects, data.data.subjects);
    if (data.data.scores) setStoreData(STORAGE_KEYS.scores, data.data.scores);

    return {
      success: true,
      message: "Données importées avec succès. Veuillez rafraîchir la page.",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Erreur lors de l'import: ${errorMessage}`,
    };
  }
}

/**
 * Importe les données depuis un fichier JSON (web)
 */
export function importFromFile(
  file: File,
): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        const result = importData(data);
        resolve(result);
      } catch {
        resolve({
          success: false,
          message: "Fichier JSON invalide",
        });
      }
    };

    reader.onerror = () => {
      resolve({ success: false, message: "Erreur de lecture du fichier" });
    };

    reader.readAsText(file);
  });
}

/**
 * Importe les données via Tauri (dialog natif)
 */
export async function importFromFileTauri(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const { readTextFile } = await import("@tauri-apps/plugin-fs");

    const filePath = await open({
      multiple: false,
      filters: [{ name: "JSON", extensions: ["json"] }],
      title: "Importer des données",
    });

    if (!filePath) {
      return { success: false, message: "Import annulé par l'utilisateur" };
    }

    const content = await readTextFile(filePath as string);
    const data = JSON.parse(content);
    return importData(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Erreur lors de l'import: ${errorMessage}`,
    };
  }
}

/**
 * Efface toutes les données de l'application
 */
export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}

/**
 * Vérifie si l'application tourne en mode Tauri
 */
export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}
