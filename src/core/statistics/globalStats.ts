/**
 * Module de statistiques globales de l'examen
 * 
 * Ce module génère les statistiques globales pour un examen :
 * - Nombre total de candidats
 * - Nombre d'admis et d'ajournés
 * - Taux de réussite
 * - Moyenne générale
 * - Meilleure et plus faible moyenne
 */

// ============================================
// TYPES
// ============================================

/**
 * Résultat d'un élève pour les statistiques
 */
export interface StudentResult {
  /** Moyenne générale de l'élève */
  average: number;
  /** L'élève est-il admis ? */
  admitted: boolean;
  /** L'élève est-il absent ? (false par défaut = présent) */
  isAbsent?: boolean;
}

/**
 * Statistiques globales de l'examen
 */
export interface GlobalStats {
  /** Nombre total de candidats inscrits */
  totalCandidates: number;
  /** Nombre de candidats présents */
  totalPresent: number;
  /** Nombre de candidats absents */
  totalAbsent: number;
  /** Nombre d'admis (parmi les présents) */
  admitted: number;
  /** Nombre d'ajournés (échoués, parmi les présents) */
  failed: number;
  /** Taux de réussite en pourcentage (0-100), calculé sur les présents */
  successRate: number;
  /** Moyenne générale de tous les candidats présents */
  overallAverage: number;
  /** Meilleure moyenne (parmi les présents) */
  maxAverage: number;
  /** Plus faible moyenne (parmi les présents) */
  minAverage: number;
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Arrondit un nombre à 2 décimales
 * @param value - Valeur à arrondir
 * @returns Valeur arrondie à 2 décimales
 */
function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Vérifie si une moyenne est valide (nombre fini)
 * @param average - Moyenne à valider
 * @returns true si la moyenne est valide
 */
function isValidAverage(average: number): boolean {
  return typeof average === 'number' && Number.isFinite(average);
}

// ============================================
// FONCTION PRINCIPALE
// ============================================

/**
 * Génère les statistiques globales de l'examen
 * 
 * Règles métier :
 * - totalCandidates = nombre total d'élèves inscrits
 * - totalAbsent = nombre d'élèves absents
 * - totalPresent = nombre d'élèves présents (totalCandidates - totalAbsent)
 * - admitted = nombre d'élèves présents où admitted === true
 * - failed = totalPresent - admitted
 * - successRate = (admitted / totalPresent) * 100 (calculé uniquement sur les présents)
 * - overallAverage = moyenne de toutes les moyennes des présents
 * - maxAverage = plus haute moyenne parmi les présents
 * - minAverage = plus basse moyenne parmi les présents
 * - Tous les résultats numériques sont arrondis à 2 décimales
 * - Les moyennes invalides (NaN, Infinity) sont ignorées
 * - Les élèves absents sont exclus des calculs de performance
 * 
 * @param students - Liste des résultats des élèves
 * @returns Statistiques globales de l'examen
 * 
 * @example
 * generateGlobalStats([
 *   { average: 12, admitted: true, isAbsent: false },
 *   { average: 8, admitted: false, isAbsent: false },
 *   { average: 15, admitted: true, isAbsent: false },
 *   { average: 0, admitted: false, isAbsent: true },
 * ]);
 * // Résultat:
 * // {
 * //   totalCandidates: 4,
 * //   totalPresent: 3,
 * //   totalAbsent: 1,
 * //   admitted: 2,
 * //   failed: 1,
 * //   successRate: 66.67,
 * //   overallAverage: 11.67,
 * //   maxAverage: 15,
 * //   minAverage: 8,
 * // }
 */
export function generateGlobalStats(students: StudentResult[]): GlobalStats {
  // Nombre total d'inscrits
  const totalCandidates = students.length;

  // Séparer les présents des absents
  const absentStudents = students.filter((s) => s.isAbsent === true);
  const presentStudents = students.filter((s) => s.isAbsent !== true);

  // Nombre d'absents et présents
  const totalAbsent = absentStudents.length;
  const totalPresent = presentStudents.length;

  // Filtrer les présents avec des moyennes valides pour les calculs
  const validPresentStudents = presentStudents.filter((s) => isValidAverage(s.average));

  // Cas où aucun élève présent valide
  if (validPresentStudents.length === 0) {
    return {
      totalCandidates,
      totalPresent,
      totalAbsent,
      admitted: 0,
      failed: 0,
      successRate: 0,
      overallAverage: 0,
      maxAverage: 0,
      minAverage: 0,
    };
  }

  // Nombre d'admis (parmi les présents)
  const admitted = validPresentStudents.filter((s) => s.admitted).length;

  // Nombre d'ajournés (parmi les présents)
  const failed = validPresentStudents.length - admitted;

  // Taux de réussite = (admis / présents valides) * 100
  const successRate = roundToTwoDecimals((admitted / validPresentStudents.length) * 100);

  // Moyenne générale = somme des moyennes des présents / nombre de présents
  const sumAverages = validPresentStudents.reduce((acc, s) => acc + s.average, 0);
  const overallAverage = roundToTwoDecimals(sumAverages / validPresentStudents.length);

  // Meilleure moyenne (parmi les présents)
  const maxAverage = roundToTwoDecimals(
    Math.max(...validPresentStudents.map((s) => s.average))
  );

  // Plus faible moyenne (parmi les présents)
  const minAverage = roundToTwoDecimals(
    Math.min(...validPresentStudents.map((s) => s.average))
  );

  return {
    totalCandidates,
    totalPresent,
    totalAbsent,
    admitted,
    failed,
    successRate,
    overallAverage,
    maxAverage,
    minAverage,
  };
}
