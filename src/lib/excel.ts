/**
 * Utilitaires pour l'import/export Excel
 * 
 * Gère la lecture de fichiers Excel et la génération de templates
 * Supporte le mode web et le mode Tauri/desktop
 */

import * as XLSX from 'xlsx';

// ============================================
// DÉTECTION TAURI
// ============================================

/**
 * Vérifie si l'application tourne en mode Tauri (desktop)
 */
function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

// ============================================
// TYPES
// ============================================

/**
 * Données d'un élève extraites du fichier Excel
 */
export interface ExcelStudentRow {
  lastName: string;
  firstName: string;
  gender?: string;
  birthDate?: Date;
}

/**
 * Résultat de l'import Excel
 */
export interface ExcelImportResult {
  success: boolean;
  students: ExcelStudentRow[];
  errors: string[];
  totalRows: number;
}

// ============================================
// CONSTANTES
// ============================================

/**
 * Colonnes attendues dans le fichier Excel
 * Les noms sont normalisés (minuscules, sans accents)
 */
const COLUMN_MAPPINGS: Record<string, keyof ExcelStudentRow> = {
  // Nom
  'nom': 'lastName',
  'lastname': 'lastName',
  'last_name': 'lastName',
  'nom de famille': 'lastName',
  // Prénom
  'prenom': 'firstName',
  'prénom': 'firstName',
  'firstname': 'firstName',
  'first_name': 'firstName',
  // Sexe
  'sexe': 'gender',
  'genre': 'gender',
  'gender': 'gender',
  'sex': 'gender',
  // Date de naissance
  'date de naissance': 'birthDate',
  'date_naissance': 'birthDate',
  'naissance': 'birthDate',
  'birthdate': 'birthDate',
  'birth_date': 'birthDate',
  'ddn': 'birthDate',
};

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Normalise une chaîne pour la comparaison
 * Supprime les accents, met en minuscules, supprime les espaces en trop
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Trouve la correspondance de colonne à partir du header
 */
function findColumnMapping(header: string): keyof ExcelStudentRow | null {
  const normalized = normalizeString(header);
  return COLUMN_MAPPINGS[normalized] || null;
}

/**
 * Parse une valeur de sexe
 */
function parseGender(value: unknown): string | undefined {
  if (!value) return undefined;
  const str = String(value).toUpperCase().trim();
  if (str === 'M' || str === 'MASCULIN' || str === 'HOMME' || str === 'H') return 'M';
  if (str === 'F' || str === 'FEMININ' || str === 'FÉMININ' || str === 'FEMME') return 'F';
  return undefined;
}

/**
 * Parse une date depuis Excel
 * Excel stocke les dates comme des nombres (jours depuis 1900)
 */
function parseDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  
  // Si c'est un nombre (format Excel)
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      return new Date(date.y, date.m - 1, date.d);
    }
  }
  
  // Si c'est une chaîne, essayer de parser
  if (typeof value === 'string') {
    const str = value.trim();
    // Format DD/MM/YYYY ou DD-MM-YYYY
    const match = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (match) {
      const [, day, month, year] = match;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    // Format YYYY-MM-DD
    const isoMatch = str.match(/^(\d{4})[/-](\d{1,2})[/ -](\d{1,2})$/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
  }
  
  return undefined;
}

// ============================================
// FONCTIONS PRINCIPALES
// ============================================

/**
 * Parse un fichier Excel et extrait les données des élèves
 * 
 * @param file - Fichier Excel à parser
 * @returns Résultat de l'import avec les élèves et les erreurs
 */
export async function parseExcelFile(file: File): Promise<ExcelImportResult> {
  const errors: string[] = [];
  const students: ExcelStudentRow[] = [];
  
  try {
    // Lire le fichier
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    
    // Prendre la première feuille
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return {
        success: false,
        students: [],
        errors: ['Le fichier Excel est vide ou ne contient pas de feuille.'],
        totalRows: 0,
      };
    }
    
    const worksheet = workbook.Sheets[sheetName];
    
    // Convertir en JSON avec headers
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: '',
    });
    
    if (jsonData.length === 0) {
      return {
        success: false,
        students: [],
        errors: ['Le fichier Excel ne contient pas de données.'],
        totalRows: 0,
      };
    }
    
    // Trouver les mappings de colonnes à partir des headers
    const firstRow = jsonData[0];
    const headers = Object.keys(firstRow);
    const columnMap: Record<string, keyof ExcelStudentRow> = {};
    
    for (const header of headers) {
      const mapping = findColumnMapping(header);
      if (mapping) {
        columnMap[header] = mapping;
      }
    }
    
    // Vérifier que les colonnes obligatoires sont présentes
    const hasLastName = Object.values(columnMap).includes('lastName');
    const hasFirstName = Object.values(columnMap).includes('firstName');
    
    if (!hasLastName || !hasFirstName) {
      const missing: string[] = [];
      if (!hasLastName) missing.push('Nom');
      if (!hasFirstName) missing.push('Prénom');
      return {
        success: false,
        students: [],
        errors: [`Colonnes obligatoires manquantes: ${missing.join(', ')}`],
        totalRows: jsonData.length,
      };
    }
    
    // Parser chaque ligne
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowNum = i + 2; // +2 car Excel commence à 1 et la première ligne est le header
      
      const student: Partial<ExcelStudentRow> = {};
      
      // Mapper les valeurs
      for (const [header, field] of Object.entries(columnMap)) {
        const value = row[header];
        
        switch (field) {
          case 'lastName':
            student.lastName = String(value || '').trim();
            break;
          case 'firstName':
            student.firstName = String(value || '').trim();
            break;
          case 'gender':
            student.gender = parseGender(value);
            break;
          case 'birthDate':
            student.birthDate = parseDate(value);
            break;
        }
      }
      
      // Valider les données obligatoires
      if (!student.lastName) {
        errors.push(`Ligne ${rowNum}: Nom manquant`);
        continue;
      }
      if (!student.firstName) {
        errors.push(`Ligne ${rowNum}: Prénom manquant`);
        continue;
      }
      
      students.push(student as ExcelStudentRow);
    }
    
    return {
      success: students.length > 0,
      students,
      errors,
      totalRows: jsonData.length,
    };
  } catch (error) {
    return {
      success: false,
      students: [],
      errors: [`Erreur lors de la lecture du fichier: ${error instanceof Error ? error.message : 'Erreur inconnue'}`],
      totalRows: 0,
    };
  }
}

/**
 * Crée le workbook Excel template pour l'import des élèves
 * Fonction pure utilisée par les deux modes (web et Tauri)
 */
function createStudentTemplateWorkbook(): XLSX.WorkBook {
  // Créer les données d'exemple
  const templateData = [
    {
      'Nom': 'Dupont',
      'Prénom': 'Jean',
      'Sexe': 'M',
      'Date de naissance': '15/03/2008',
    },
    {
      'Nom': 'Martin',
      'Prénom': 'Marie',
      'Sexe': 'F',
      'Date de naissance': '22/07/2008',
    },
    {
      'Nom': 'Bernard',
      'Prénom': 'Pierre',
      'Sexe': 'M',
      'Date de naissance': '10/11/2008',
    },
  ];
  
  // Créer le workbook
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(templateData);
  
  // Définir les largeurs de colonnes
  worksheet['!cols'] = [
    { wch: 20 }, // Nom
    { wch: 20 }, // Prénom
    { wch: 10 }, // Sexe
    { wch: 18 }, // Date de naissance
  ];
  
  // Ajouter la feuille au workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Élèves');
  
  return workbook;
}

/**
 * Télécharge le template en mode web (navigateur standard)
 */
function downloadTemplateWeb(): void {
  const workbook = createStudentTemplateWorkbook();
  XLSX.writeFile(workbook, 'template_import_eleves.xlsx');
}

/**
 * Télécharge le template en mode Tauri (desktop)
 * Utilise le dialogue de sauvegarde natif
 */
async function downloadTemplateTauri(): Promise<void> {
  // Import dynamique des plugins Tauri
  const { save } = await import('@tauri-apps/plugin-dialog');
  const { writeFile } = await import('@tauri-apps/plugin-fs');
  
  // Ouvrir le dialogue de sauvegarde
  const filePath = await save({
    defaultPath: 'template_import_eleves.xlsx',
    filters: [
      { name: 'Excel', extensions: ['xlsx'] }
    ],
    title: 'Enregistrer le template',
  });
  
  // L'utilisateur a annulé
  if (!filePath) return;
  
  // Créer le workbook et le convertir en Uint8Array
  const workbook = createStudentTemplateWorkbook();
  const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  
  // Écrire le fichier via l'API Tauri
  await writeFile(filePath, new Uint8Array(excelBuffer));
}

/**
 * Génère et télécharge un fichier Excel template pour l'import des élèves
 * Détecte automatiquement le mode (web ou Tauri) et utilise la méthode appropriée
 */
export async function downloadStudentTemplate(): Promise<void> {
  if (isTauri()) {
    await downloadTemplateTauri();
  } else {
    downloadTemplateWeb();
  }
}

/**
 * Valide un fichier avant import
 * Vérifie l'extension et la taille
 */
export function validateExcelFile(file: File): { valid: boolean; error?: string } {
  // Vérifier l'extension
  const validExtensions = ['.xlsx', '.xls', '.csv'];
  const fileName = file.name.toLowerCase();
  const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
  
  if (!hasValidExtension) {
    return {
      valid: false,
      error: 'Format de fichier non supporté. Utilisez .xlsx, .xls ou .csv',
    };
  }
  
  // Vérifier la taille (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Le fichier est trop volumineux (max 5 Mo)',
    };
  }
  
  return { valid: true };
}
