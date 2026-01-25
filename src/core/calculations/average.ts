/**
 * Module de calcul des moyennes des élèves
 * 
 * Ce module calcule la moyenne d'un élève en fonction de ses notes.
 * - Supporte les barèmes différents par épreuve (ex: Math sur 60, Français sur 40)
 * - Normalise les notes vers un barème global (ex: sur 10, sur 20, sur 100)
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
  /** Barème de l'épreuve (note maximale possible, ex: 20, 60, 100) */
  maxScore?: number;
}

/**
 * Options pour le calcul de la moyenne
 */
export interface AverageOptions {
  /** Barème global vers lequel normaliser (ex: 10, 20, 100). Par défaut: 20 */
  targetScale?: number;
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
 * Normalise une note vers un barème cible
 * 
 * @param score - Note obtenue
 * @param maxScore - Barème de l'épreuve (note max possible)
 * @param targetScale - Barème cible (ex: 20)
 * @returns Note normalisée sur le barème cible
 * 
 * @example
 * normalizeScore(45, 60, 20); // => 15 (45/60 * 20)
 * normalizeScore(30, 60, 10); // => 5 (30/60 * 10)
 */
function normalizeScore(score: number, maxScore: number, targetScale: number): number {
  if (maxScore <= 0) return 0;
  return (score / maxScore) * targetScale;
}

/**
 * Calcule la moyenne d'un élève en fonction de ses notes
 * 
 * Règles métier :
 * - Si les épreuves ont des barèmes différents (maxScore), les notes sont normalisées
 *   vers le barème global (targetScale) avant le calcul
 * - Si au moins un coefficient est défini, calcule une moyenne pondérée
 * - Si aucun coefficient n'est défini, calcule une moyenne simple
 * - Les notes invalides ou manquantes sont ignorées
 * - Le résultat est arrondi à 2 décimales
 * 
 * @param scores - Liste des notes de l'élève
 * @param options - Options de calcul (barème cible)
 * @returns Moyenne calculée, ou null si aucune note valide
 * 
 * @example
 * // Moyenne simple (pas de coefficients, même barème)
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
 * 
 * @example
 * // Barèmes différents normalisés vers 10
 * // Math: 45/60, Français: 30/60, Autre: 48/60
 * // = (45+30+48) / (60+60+60) * 10 = 123/180 * 10 = 6.83
 * calculateStudentAverage([
 *   { subjectId: '1', score: 45, maxScore: 60 },
 *   { subjectId: '2', score: 30, maxScore: 60 },
 *   { subjectId: '3', score: 48, maxScore: 60 },
 * ], { targetScale: 10 }); // => 6.83
 */
export function calculateStudentAverage(
  scores: StudentScore[],
  options: AverageOptions = {}
): number | null {
  // Filtrer les scores valides
  const validScores = scores.filter(isValidScore);

  // Si aucun score valide, retourner null
  if (validScores.length === 0) {
    return null;
  }

  // Barème cible par défaut : 20
  const targetScale = options.targetScale ?? 20;

  // Déterminer si on a des barèmes différents par épreuve
  const hasVariableMaxScores = validScores.some(
    (s) => s.maxScore !== undefined && s.maxScore !== null && s.maxScore > 0
  );

  // Déterminer le type de moyenne à calculer
  const useWeightedAverage = hasAnyCoefficient(validScores);

  if (hasVariableMaxScores) {
    // Cas avec barèmes différents par épreuve
    // On normalise chaque note vers le barème cible
    
    if (useWeightedAverage) {
      // Moyenne pondérée avec normalisation
      // Formule: Σ(noteNormalisée × coefficient) / Σ(coefficient)
      let totalWeightedScore = 0;
      let totalCoefficients = 0;

      for (const s of validScores) {
        const coef = s.coefficient !== undefined && s.coefficient !== null ? s.coefficient : 1;
        const maxScore = s.maxScore !== undefined && s.maxScore !== null && s.maxScore > 0 
          ? s.maxScore 
          : targetScale; // Si pas de maxScore, on assume que c'est déjà sur le barème cible
        
        const normalizedScore = normalizeScore(s.score, maxScore, targetScale);
        totalWeightedScore += normalizedScore * coef;
        totalCoefficients += coef;
      }

      if (totalCoefficients === 0) {
        return null;
      }

      return roundToTwoDecimals(totalWeightedScore / totalCoefficients);
    } else {
      // Moyenne simple avec normalisation
      // Formule optimisée : Σ(notes) / Σ(maxScores) × targetScale
      // Cela donne le même résultat que de normaliser chaque note puis faire la moyenne
      let totalScore = 0;
      let totalMaxScore = 0;

      for (const s of validScores) {
        const maxScore = s.maxScore !== undefined && s.maxScore !== null && s.maxScore > 0 
          ? s.maxScore 
          : targetScale;
        
        totalScore += s.score;
        totalMaxScore += maxScore;
      }

      if (totalMaxScore === 0) {
        return null;
      }

      return roundToTwoDecimals((totalScore / totalMaxScore) * targetScale);
    }
  } else {
    // Cas classique : toutes les épreuves ont le même barème (ou aucun maxScore défini)
    // On assume que les notes sont déjà sur le barème cible
    
    if (useWeightedAverage) {
      // Moyenne pondérée classique
      // Formule: Σ(note × coefficient) / Σ(coefficient)
      let totalWeightedScore = 0;
      let totalCoefficients = 0;

      for (const s of validScores) {
        const coef = s.coefficient !== undefined && s.coefficient !== null ? s.coefficient : 1;
        totalWeightedScore += s.score * coef;
        totalCoefficients += coef;
      }

      if (totalCoefficients === 0) {
        return null;
      }

      return roundToTwoDecimals(totalWeightedScore / totalCoefficients);
    } else {
      // Moyenne simple classique
      // Formule: Σ(notes) / nombre de notes
      const sum = validScores.reduce((acc, s) => acc + s.score, 0);
      return roundToTwoDecimals(sum / validScores.length);
    }
  }
}
