/**
 * Module de calcul des moyennes des élèves
 * 
 * Ce module calcule la moyenne d'un élève en fonction de ses notes.
 * - Si au moins un coefficient est défini, utilise la moyenne pondérée.
 * - Sinon, utilise la moyenne simple.
 * - Les notes manquantes sont ignorées.
 * - Le résultat est arrondi à 2 décimales.
 */

// ============================================
// TYPES
// ============================================

/**
 * Représente la note d'un élève pour une épreuve
 */
export interface StudentScore {
  /** Identifiant de l'épreuve */
  subjectId: string;
  /** Note obtenue */
  score: number;
  /** Coefficient de l'épreuve (optionnel) */
  coefficient?: number;
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
 * Vérifie si un score est valide (non null, non undefined, et est un nombre fini)
 * @param score - Score à valider
 * @returns true si le score est valide
 */
function isValidScore(score: StudentScore): boolean {
  return (
    score !== null &&
    score !== undefined &&
    typeof score.score === 'number' &&
    Number.isFinite(score.score)
  );
}

/**
 * Détermine si au moins un coefficient est défini dans les scores
 * @param scores - Liste des scores
 * @returns true si au moins un coefficient est défini et > 0
 */
function hasAnyCoefficient(scores: StudentScore[]): boolean {
  return scores.some(
    (s) => s.coefficient !== undefined && s.coefficient !== null && s.coefficient > 0
  );
}

// ============================================
// FONCTION PRINCIPALE
// ============================================

/**
 * Calcule la moyenne d'un élève en fonction de ses notes
 * 
 * Règles métier :
 * - Si au moins un coefficient est défini, calcule une moyenne pondérée
 * - Si aucun coefficient n'est défini, calcule une moyenne simple
 * - Les notes invalides ou manquantes sont ignorées
 * - Le résultat est arrondi à 2 décimales
 * 
 * @param scores - Liste des notes de l'élève
 * @returns Moyenne calculée, ou null si aucune note valide
 * 
 * @example
 * // Moyenne simple (pas de coefficients)
 * calculateStudentAverage([
 *   { subjectId: '1', score: 12 },
 *   { subjectId: '2', score: 14 },
 * ]); // => 13.00
 * 
 * @example
 * // Moyenne pondérée (avec coefficients)
 * calculateStudentAverage([
 *   { subjectId: '1', score: 12, coefficient: 2 },
 *   { subjectId: '2', score: 14, coefficient: 1 },
 * ]); // => (12*2 + 14*1) / (2+1) = 12.67
 */
export function calculateStudentAverage(scores: StudentScore[]): number | null {
  // Filtrer les scores valides
  const validScores = scores.filter(isValidScore);

  // Si aucun score valide, retourner null
  if (validScores.length === 0) {
    return null;
  }

  // Déterminer le type de moyenne à calculer
  const useWeightedAverage = hasAnyCoefficient(validScores);

  if (useWeightedAverage) {
    // Moyenne pondérée
    // Formule: Σ(note × coefficient) / Σ(coefficient)
    let totalWeightedScore = 0;
    let totalCoefficients = 0;

    for (const s of validScores) {
      // Si pas de coefficient défini, on utilise 1 par défaut
      const coef = s.coefficient !== undefined && s.coefficient !== null ? s.coefficient : 1;
      totalWeightedScore += s.score * coef;
      totalCoefficients += coef;
    }

    // Protection contre la division par zéro
    if (totalCoefficients === 0) {
      return null;
    }

    return roundToTwoDecimals(totalWeightedScore / totalCoefficients);
  } else {
    // Moyenne simple
    // Formule: Σ(notes) / nombre de notes
    const sum = validScores.reduce((acc, s) => acc + s.score, 0);
    return roundToTwoDecimals(sum / validScores.length);
  }
}
