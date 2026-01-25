/**
 * Module de classement des établissements
 * 
 * Ce module classe les établissements scolaires en fonction de leurs performances.
 * - Calcul du nombre de candidats par établissement
 * - Calcul du nombre d'admis
 * - Calcul du taux de réussite
 * - Calcul de la moyenne générale
 * - Classement par taux de réussite puis par moyenne
 */

// ============================================
// TYPES
// ============================================

/**
 * Résultat d'un élève pour le classement des établissements
 */
export interface StudentResult {
  /** Identifiant unique de l'élève */
  studentId: string;
  /** Identifiant de l'établissement de l'élève */
  schoolId: string;
  /** Moyenne générale de l'élève */
  average: number;
  /** L'élève est-il admis ? */
  admitted: boolean;
}

/**
 * Établissement classé avec ses statistiques
 */
export interface RankedSchool {
  /** Identifiant de l'établissement */
  schoolId: string;
  /** Nombre total de candidats */
  total: number;
  /** Nombre d'admis */
  admitted: number;
  /** Taux de réussite en pourcentage (0-100) */
  successRate: number;
  /** Moyenne générale de l'établissement */
  average: number;
  /** Rang de l'établissement */
  rank: number;
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
 * Statistiques intermédiaires d'un établissement (avant classement)
 */
interface SchoolStats {
  schoolId: string;
  total: number;
  admitted: number;
  successRate: number;
  average: number;
}

/**
 * Agrège les résultats des élèves par établissement
 * @param students - Liste des résultats des élèves
 * @returns Map des statistiques par établissement
 */
function aggregateBySchool(students: StudentResult[]): Map<string, SchoolStats> {
  const schoolMap = new Map<string, { students: StudentResult[] }>();

  // Grouper les élèves par établissement
  for (const student of students) {
    const existing = schoolMap.get(student.schoolId);
    if (existing) {
      existing.students.push(student);
    } else {
      schoolMap.set(student.schoolId, { students: [student] });
    }
  }

  // Calculer les statistiques pour chaque établissement
  const statsMap = new Map<string, SchoolStats>();

  for (const [schoolId, data] of schoolMap) {
    const total = data.students.length;
    const admitted = data.students.filter((s) => s.admitted).length;
    
    // Taux de réussite = (admis / total) * 100
    const successRate = total > 0 ? roundToTwoDecimals((admitted / total) * 100) : 0;
    
    // Moyenne de l'établissement = moyenne des moyennes des élèves
    const sumAverages = data.students.reduce((acc, s) => acc + s.average, 0);
    const average = total > 0 ? roundToTwoDecimals(sumAverages / total) : 0;

    statsMap.set(schoolId, {
      schoolId,
      total,
      admitted,
      successRate,
      average,
    });
  }

  return statsMap;
}

// ============================================
// FONCTION PRINCIPALE
// ============================================

/**
 * Classe les établissements par performance
 * 
 * Règles métier :
 * - Pour chaque établissement, calcule :
 *   - Nombre total de candidats
 *   - Nombre d'admis
 *   - Taux de réussite = (admis / total) * 100
 *   - Moyenne générale de l'établissement
 * - Classement par :
 *   1. Taux de réussite (décroissant)
 *   2. Moyenne générale (décroissant) en cas d'égalité
 * - Gestion des ex-aequo (même rang si mêmes critères)
 * 
 * @param students - Liste des résultats de tous les élèves
 * @returns Liste des établissements classés
 * 
 * @example
 * rankSchools([
 *   { studentId: '1', schoolId: 'A', average: 12, admitted: true },
 *   { studentId: '2', schoolId: 'A', average: 14, admitted: true },
 *   { studentId: '3', schoolId: 'B', average: 8, admitted: false },
 *   { studentId: '4', schoolId: 'B', average: 11, admitted: true },
 * ]);
 * // École A: 2 candidats, 2 admis, 100% réussite, moyenne 13
 * // École B: 2 candidats, 1 admis, 50% réussite, moyenne 9.5
 * // Résultat: A rang 1, B rang 2
 */
export function rankSchools(students: StudentResult[]): RankedSchool[] {
  // Si liste vide, retourner liste vide
  if (students.length === 0) {
    return [];
  }

  // Agréger les statistiques par établissement
  const statsMap = aggregateBySchool(students);
  const schoolStats = Array.from(statsMap.values());

  // Trier les établissements
  // Critère 1: Taux de réussite (décroissant)
  // Critère 2: Moyenne (décroissant)
  // Critère 3: ID (pour déterminisme)
  schoolStats.sort((a, b) => {
    // Premier critère : taux de réussite
    if (b.successRate !== a.successRate) {
      return b.successRate - a.successRate;
    }
    // Deuxième critère : moyenne
    if (b.average !== a.average) {
      return b.average - a.average;
    }
    // Troisième critère : ID pour déterminisme
    return a.schoolId.localeCompare(b.schoolId);
  });

  // Attribuer les rangs avec gestion des ex-aequo
  const rankedSchools: RankedSchool[] = [];
  let currentRank = 1;

  for (let i = 0; i < schoolStats.length; i++) {
    const school = schoolStats[i];

    if (i === 0) {
      // Premier établissement = rang 1
      rankedSchools.push({
        ...school,
        rank: currentRank,
      });
    } else {
      const previous = schoolStats[i - 1];

      // Ex-aequo si même taux ET même moyenne
      if (school.successRate === previous.successRate && school.average === previous.average) {
        rankedSchools.push({
          ...school,
          rank: currentRank,
        });
      } else {
        // Nouveau rang = position + 1
        currentRank = i + 1;
        rankedSchools.push({
          ...school,
          rank: currentRank,
        });
      }
    }
  }

  return rankedSchools;
}
