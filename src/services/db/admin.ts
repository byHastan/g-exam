/**
 * Service d'administration de la base de données
 *
 * Gère les opérations sensibles nécessitant une authentification admin:
 * - Vérification du mot de passe admin
 * - Export de la base de données
 * - Import d'une base de données
 * - Réinitialisation de la base de données
 */

import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';

// ============================================
// TYPES
// ============================================

/**
 * Résultat d'une opération admin
 */
export interface AdminOperationResult {
  success: boolean;
  message: string;
}

// ============================================
// FONCTIONS D'AUTHENTIFICATION
// ============================================

/**
 * Vérifie si le mot de passe admin est correct
 *
 * @param password - Mot de passe à vérifier
 * @returns true si le mot de passe est correct
 */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  try {
    const result = await invoke<boolean>('verify_admin', { password });
    return result;
  } catch (error) {
    console.error('Erreur lors de la vérification admin:', error);
    return false;
  }
}

// ============================================
// FONCTIONS DE GESTION DE LA BASE DE DONNÉES
// ============================================

/**
 * Récupère le chemin de la base de données
 *
 * @returns Chemin complet de la BD
 */
export async function getDatabasePath(): Promise<string> {
  return invoke<string>('get_database_path');
}

/**
 * Initialise la base de données (crée le fichier si nécessaire)
 *
 * @returns Chemin de la BD initialisée
 */
export async function initDatabase(): Promise<string> {
  return invoke<string>('init_database');
}

/**
 * Vérifie si la base de données existe
 *
 * @returns true si la BD existe
 */
export async function databaseExists(): Promise<boolean> {
  return invoke<boolean>('database_exists');
}

/**
 * Exporte la base de données vers un fichier choisi par l'utilisateur
 * Ouvre un dialogue de sauvegarde pour sélectionner la destination
 *
 * @returns Résultat de l'opération
 */
export async function exportDatabase(): Promise<AdminOperationResult> {
  try {
    // Ouvrir le dialogue de sauvegarde
    const destPath = await save({
      defaultPath: 'exam-manager-backup.db',
      filters: [
        {
          name: 'Base de données SQLite',
          extensions: ['db', 'sqlite', 'sqlite3'],
        },
      ],
      title: 'Exporter la base de données',
    });

    if (!destPath) {
      return {
        success: false,
        message: 'Export annulé par l\'utilisateur',
      };
    }

    await invoke('export_database', { destPath });

    return {
      success: true,
      message: `Base de données exportée vers: ${destPath}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Erreur lors de l'export: ${errorMessage}`,
    };
  }
}

/**
 * Importe une base de données depuis un fichier choisi par l'utilisateur
 * Ouvre un dialogue de sélection pour choisir le fichier source
 * ATTENTION: Cette opération remplace la BD existante!
 *
 * @param adminPassword - Mot de passe admin pour autoriser l'opération
 * @returns Résultat de l'opération
 */
export async function importDatabase(
  adminPassword: string
): Promise<AdminOperationResult> {
  try {
    // Ouvrir le dialogue de sélection de fichier
    const srcPath = await open({
      multiple: false,
      filters: [
        {
          name: 'Base de données SQLite',
          extensions: ['db', 'sqlite', 'sqlite3'],
        },
      ],
      title: 'Importer une base de données',
    });

    if (!srcPath) {
      return {
        success: false,
        message: 'Import annulé par l\'utilisateur',
      };
    }

    await invoke('import_database', { srcPath, adminPassword });

    return {
      success: true,
      message: 'Base de données importée avec succès. Veuillez redémarrer l\'application.',
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
 * Réinitialise la base de données (supprime toutes les données)
 * ATTENTION: Cette opération est irréversible!
 *
 * @param adminPassword - Mot de passe admin pour autoriser l'opération
 * @returns Résultat de l'opération
 */
export async function resetDatabase(
  adminPassword: string
): Promise<AdminOperationResult> {
  try {
    await invoke('reset_database', { adminPassword });

    return {
      success: true,
      message: 'Base de données réinitialisée. Veuillez redémarrer l\'application.',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Erreur lors de la réinitialisation: ${errorMessage}`,
    };
  }
}
