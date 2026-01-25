/**
 * Module de répartition des élèves en salles d'examen
 * 
 * Ce module assigne automatiquement les élèves aux salles d'examen.
 * - Tri alphabétique par nom de famille puis prénom
 * - Assignation séquentielle jusqu'à capacité maximale
 * - Les élèves en surplus passent à la salle suivante
 */

// ============================================
// TYPES
// ============================================

/**
 * Élève à assigner à une salle
 */
export interface Student {
  /** Identifiant unique de l'élève */
  id: string;
  /** Nom de famille */
  lastName: string;
  /** Prénom */
  firstName: string;
}

/**
 * Assignation d'une salle avec ses élèves
 */
export interface RoomAssignment {
  /** Numéro de la salle (1-indexed) */
  roomNumber: number;
  /** Liste des élèves assignés à cette salle */
  students: Student[];
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Compare deux élèves par ordre alphabétique
 * Critère 1: Nom de famille (insensible à la casse)
 * Critère 2: Prénom (insensible à la casse)
 * Critère 3: ID (pour déterminisme)
 * 
 * @param a - Premier élève
 * @param b - Deuxième élève
 * @returns Négatif si a < b, positif si a > b, 0 si égaux
 */
function compareStudentsAlphabetically(a: Student, b: Student): number {
  // Comparer par nom de famille (insensible à la casse)
  const lastNameComparison = a.lastName
    .toLowerCase()
    .localeCompare(b.lastName.toLowerCase());
  
  if (lastNameComparison !== 0) {
    return lastNameComparison;
  }

  // En cas d'égalité, comparer par prénom
  const firstNameComparison = a.firstName
    .toLowerCase()
    .localeCompare(b.firstName.toLowerCase());
  
  if (firstNameComparison !== 0) {
    return firstNameComparison;
  }

  // En cas d'égalité complète, comparer par ID pour déterminisme
  return a.id.localeCompare(b.id);
}

// ============================================
// FONCTION PRINCIPALE
// ============================================

/**
 * Répartit les élèves dans les salles par ordre alphabétique
 * 
 * Règles métier :
 * - Les élèves sont triés par nom de famille puis prénom (ordre alphabétique)
 * - Les élèves sont assignés séquentiellement aux salles
 * - Chaque salle a une capacité maximale définie
 * - Quand une salle est pleine, les élèves suivants vont dans la salle suivante
 * - Si tous les élèves ne rentrent pas, les salles supplémentaires sont créées
 * - Le résultat est déterministe (même entrée = même sortie)
 * 
 * @param students - Liste des élèves à répartir
 * @param roomCount - Nombre de salles disponibles
 * @param roomCapacity - Capacité maximale par salle
 * @returns Liste des assignations par salle
 * 
 * @example
 * dispatchAlphabetically(
 *   [
 *     { id: '1', lastName: 'Dupont', firstName: 'Jean' },
 *     { id: '2', lastName: 'Martin', firstName: 'Marie' },
 *     { id: '3', lastName: 'Bernard', firstName: 'Pierre' },
 *     { id: '4', lastName: 'Dupont', firstName: 'Alice' },
 *   ],
 *   2,  // 2 salles
 *   2   // 2 places par salle
 * );
 * // Résultat:
 * // [
 * //   { roomNumber: 1, students: [Bernard Pierre, Dupont Alice] },
 * //   { roomNumber: 2, students: [Dupont Jean, Martin Marie] },
 * // ]
 */
export function dispatchAlphabetically(
  students: Student[],
  roomCount: number,
  roomCapacity: number
): RoomAssignment[] {
  // Validation des paramètres
  if (roomCount <= 0 || roomCapacity <= 0) {
    return [];
  }

  // Si pas d'élèves, retourner des salles vides
  if (students.length === 0) {
    const emptyRooms: RoomAssignment[] = [];
    for (let i = 1; i <= roomCount; i++) {
      emptyRooms.push({ roomNumber: i, students: [] });
    }
    return emptyRooms;
  }

  // Créer une copie triée (ne pas modifier l'original - pure function)
  const sortedStudents = [...students].sort(compareStudentsAlphabetically);

  // Initialiser les salles
  const rooms: RoomAssignment[] = [];
  for (let i = 1; i <= roomCount; i++) {
    rooms.push({ roomNumber: i, students: [] });
  }

  // Assigner les élèves aux salles
  let currentRoomIndex = 0;

  for (const student of sortedStudents) {
    // Chercher une salle avec de la place
    while (
      currentRoomIndex < rooms.length &&
      rooms[currentRoomIndex].students.length >= roomCapacity
    ) {
      currentRoomIndex++;
    }

    // Si toutes les salles sont pleines, créer une nouvelle salle
    // (gestion du débordement)
    if (currentRoomIndex >= rooms.length) {
      rooms.push({
        roomNumber: rooms.length + 1,
        students: [],
      });
    }

    // Assigner l'élève à la salle courante
    rooms[currentRoomIndex].students.push(student);
  }

  return rooms;
}

/**
 * Calcule le nombre minimum de salles nécessaires pour un nombre d'élèves
 * 
 * @param studentCount - Nombre d'élèves
 * @param roomCapacity - Capacité par salle
 * @returns Nombre minimum de salles nécessaires
 * 
 * @example
 * calculateRequiredRooms(25, 10); // => 3 (10 + 10 + 5)
 */
export function calculateRequiredRooms(
  studentCount: number,
  roomCapacity: number
): number {
  if (studentCount <= 0 || roomCapacity <= 0) {
    return 0;
  }
  return Math.ceil(studentCount / roomCapacity);
}
