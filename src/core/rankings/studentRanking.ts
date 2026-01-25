/**
 * Module de classement des élèves
 * 
 * Ce module classe les élèves en fonction de leur moyenne générale.
 * - Tri par moyenne décroissante
 * - Gestion des ex-aequo (même moyenne = même rang)
 * - Le rang suivant est décalé en conséquence
 * 
 * Exemple :
 * - 1er : 15.20
 * - 1er : 15.20 (ex-aequo)
 * - 3ème : 14.80 (rang 2 sauté)
 */

// ============================================
// TYPES
// ============================================

/**
 * Résultat d'un élève avec sa moyenne
 */
export interface StudentResult {
  /** Identifiant unique de l'élève */
  studentId: string;
  /** Moyenne générale de l'élève */
  average: number;
}

/**
 * Élève classé avec son rang
 */
export interface RankedStudent {
  /** Identifiant unique de l'élève */
  studentId: string;
  /** Moyenne générale de l'élève */
  average: number;
  /** Rang de l'élève (1 = premier) */
  rank: number;
}

// ============================================
// FONCTION PRINCIPALE
// ============================================

/**
 * Classe les élèves par moyenne décroissante avec gestion des ex-aequo
 * 
 * Règles métier :
 * - Les élèves sont triés par moyenne décroissante
 * - Les élèves avec la même moyenne obtiennent le même rang
 * - Le rang suivant est décalé (ex: 1, 1, 3 et non 1, 1, 2)
 * - L'ordre est déterministe (même entrée = même sortie)
 * 
 * @param students - Liste des élèves avec leurs moyennes
 * @returns Liste des élèves classés avec leur rang
 * 
 * @example
 * rankStudents([
 *   { studentId: 'A', average: 14.80 },
 *   { studentId: 'B', average: 15.20 },
 *   { studentId: 'C', average: 15.20 },
 * ]);
 * // Résultat:
 * // [
 * //   { studentId: 'B', average: 15.20, rank: 1 },
 * //   { studentId: 'C', average: 15.20, rank: 1 },
 * //   { studentId: 'A', average: 14.80, rank: 3 },
 * // ]
 */
export function rankStudents(students: StudentResult[]): RankedStudent[] {
  // Si liste vide, retourner liste vide
  if (students.length === 0) {
    return [];
  }

  // Créer une copie pour ne pas modifier l'original (pure function)
  const sortedStudents = [...students];

  // Trier par moyenne décroissante
  // En cas d'égalité, trier par studentId pour un résultat déterministe
  sortedStudents.sort((a, b) => {
    if (b.average !== a.average) {
      return b.average - a.average; // Décroissant
    }
    // En cas d'égalité, trier par ID pour être déterministe
    return a.studentId.localeCompare(b.studentId);
  });

  // Attribuer les rangs avec gestion des ex-aequo
  const rankedStudents: RankedStudent[] = [];
  let currentRank = 1;

  for (let i = 0; i < sortedStudents.length; i++) {
    const student = sortedStudents[i];

    if (i === 0) {
      // Premier élève = rang 1
      rankedStudents.push({
        studentId: student.studentId,
        average: student.average,
        rank: currentRank,
      });
    } else {
      const previousStudent = sortedStudents[i - 1];

      if (student.average === previousStudent.average) {
        // Ex-aequo : même rang que le précédent
        rankedStudents.push({
          studentId: student.studentId,
          average: student.average,
          rank: currentRank,
        });
      } else {
        // Nouvelle moyenne : le rang = position + 1 (1-indexed)
        // Cela permet de "sauter" les rangs des ex-aequo
        currentRank = i + 1;
        rankedStudents.push({
          studentId: student.studentId,
          average: student.average,
          rank: currentRank,
        });
      }
    }
  }

  return rankedStudents;
}
