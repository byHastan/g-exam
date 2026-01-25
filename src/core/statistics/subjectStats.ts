/**
 * Module de statistiques par épreuve
 * 
 * Ce module génère les statistiques pour chaque épreuve de l'examen :
 * - Moyenne des notes
 * - Note minimale
 * - Note maximale
 * - Nombre de notes
 */

// ============================================
// TYPES
// ============================================

/**
 * Note d'un élève pour une épreuve
 */
export interface SubjectScore {
  /** Identifiant de l'épreuve */
  subjectId: string;
  /** Note obtenue */
  score: number;
}

/**
 * Statistiques d'une épreuve
 */
export interface SubjectStats {
  /** Identifiant de l'épreuve */
  subjectId: string;
  /** Moyenne des notes */
  average: number;
  /** Note minimale */
  minScore: number;
  /** Note maximale */
  maxScore: number;
  /** Nombre de notes */
  count: number;
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
 * Vérifie si une note est valide (nombre fini, non null)
 * @param score - Note à valider
 * @returns true si la note est valide
 */
function isValidScore(score: SubjectScore): boolean {
  return (
    score !== null &&
    score !== undefined &&
    typeof score.score === 'number' &&
    Number.isFinite(score.score) &&
    typeof score.subjectId === 'string' &&
    score.subjectId.length > 0
  );
}

// ============================================
// FONCTION PRINCIPALE
// ============================================

/**
 * Génère les statistiques par épreuve
 * 
 * Règles métier :
 * - Groupe les notes par subjectId
 * - Pour chaque épreuve, calcule :
 *   - average : moyenne des notes
 *   - minScore : note la plus basse
 *   - maxScore : note la plus haute
 *   - count : nombre de notes
 * - Tous les résultats sont arrondis à 2 décimales
 * - Les notes invalides (null, NaN, Infinity) sont ignorées
 * 
 * @param scores - Liste de toutes les notes
 * @returns Liste des statistiques par épreuve
 * 
 * @example
 * generateSubjectStats([
 *   { subjectId: 'math', score: 12 },
 *   { subjectId: 'math', score: 14 },
 *   { subjectId: 'math', score: 10 },
 *   { subjectId: 'french', score: 15 },
 *   { subjectId: 'french', score: 13 },
 * ]);
 * // Résultat:
 * // [
 * //   { subjectId: 'math', average: 12, minScore: 10, maxScore: 14, count: 3 },
 * //   { subjectId: 'french', average: 14, minScore: 13, maxScore: 15, count: 2 },
 * // ]
 */
export function generateSubjectStats(scores: SubjectScore[]): SubjectStats[] {
  // Filtrer les notes valides
  const validScores = scores.filter(isValidScore);

  // Si aucune note valide, retourner liste vide
  if (validScores.length === 0) {
    return [];
  }

  // Grouper les notes par épreuve
  const subjectMap = new Map<string, number[]>();

  for (const score of validScores) {
    const existing = subjectMap.get(score.subjectId);
    if (existing) {
      existing.push(score.score);
    } else {
      subjectMap.set(score.subjectId, [score.score]);
    }
  }

  // Calculer les statistiques pour chaque épreuve
  const stats: SubjectStats[] = [];

  for (const [subjectId, subjectScores] of subjectMap) {
    const count = subjectScores.length;
    
    // Moyenne = somme / nombre
    const sum = subjectScores.reduce((acc, s) => acc + s, 0);
    const average = roundToTwoDecimals(sum / count);
    
    // Min et Max
    const minScore = roundToTwoDecimals(Math.min(...subjectScores));
    const maxScore = roundToTwoDecimals(Math.max(...subjectScores));

    stats.push({
      subjectId,
      average,
      minScore,
      maxScore,
      count,
    });
  }

  // Trier par subjectId pour un résultat déterministe
  stats.sort((a, b) => a.subjectId.localeCompare(b.subjectId));

  return stats;
}
