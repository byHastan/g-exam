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
}

/**
 * Statistiques globales de l'examen
 */
export interface GlobalStats {
  /** Nombre total de candidats */
  totalCandidates: number;
  /** Nombre d'admis */
  admitted: number;
  /** Nombre d'ajournés (échoués) */
  failed: number;
  /** Taux de réussite en pourcentage (0-100) */
  successRate: number;
  /** Moyenne générale de tous les candidats */
  overallAverage: number;
  /** Meilleure moyenne */
  maxAverage: number;
  /** Plus faible moyenne */
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
 * - totalCandidates = nombre total d'élèves avec une moyenne valide
 * - admitted = nombre d'élèves où admitted === true
 * - failed = totalCandidates - admitted
 * - successRate = (admitted / totalCandidates) * 100
 * - overallAverage = moyenne de toutes les moyennes
 * - maxAverage = plus haute moyenne
 * - minAverage = plus basse moyenne
 * - Tous les résultats numériques sont arrondis à 2 décimales
 * - Les moyennes invalides (NaN, Infinity) sont ignorées
 * 
 * @param students - Liste des résultats des élèves
 * @returns Statistiques globales de l'examen
 * 
 * @example
 * generateGlobalStats([
 *   { average: 12, admitted: true },
 *   { average: 8, admitted: false },
 *   { average: 15, admitted: true },
 *   { average: 10, admitted: true },
 * ]);
 * // Résultat:
 * // {
 * //   totalCandidates: 4,
 * //   admitted: 3,
 * //   failed: 1,
 * //   successRate: 75,
 * //   overallAverage: 11.25,
 * //   maxAverage: 15,
 * //   minAverage: 8,
 * // }
 */
export function generateGlobalStats(students: StudentResult[]): GlobalStats {
  // Filtrer les résultats avec des moyennes valides
  const validStudents = students.filter((s) => isValidAverage(s.average));

  // Cas où aucun élève valide
  if (validStudents.length === 0) {
    return {
      totalCandidates: 0,
      admitted: 0,
      failed: 0,
      successRate: 0,
      overallAverage: 0,
      maxAverage: 0,
      minAverage: 0,
    };
  }

  // Nombre total de candidats
  const totalCandidates = validStudents.length;

  // Nombre d'admis
  const admitted = validStudents.filter((s) => s.admitted).length;

  // Nombre d'ajournés
  const failed = totalCandidates - admitted;

  // Taux de réussite = (admis / total) * 100
  const successRate = roundToTwoDecimals((admitted / totalCandidates) * 100);

  // Moyenne générale = somme des moyennes / nombre de candidats
  const sumAverages = validStudents.reduce((acc, s) => acc + s.average, 0);
  const overallAverage = roundToTwoDecimals(sumAverages / totalCandidates);

  // Meilleure moyenne
  const maxAverage = roundToTwoDecimals(
    Math.max(...validStudents.map((s) => s.average))
  );

  // Plus faible moyenne
  const minAverage = roundToTwoDecimals(
    Math.min(...validStudents.map((s) => s.average))
  );

  return {
    totalCandidates,
    admitted,
    failed,
    successRate,
    overallAverage,
    maxAverage,
    minAverage,
  };
}
