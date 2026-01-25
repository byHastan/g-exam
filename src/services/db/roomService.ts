/**
 * Service de gestion des salles et assignations
 *
 * CRUD et opérations métier pour les entités Room et RoomAssignment
 */

import { getPrismaClient } from './client';
import type { Room, RoomAssignment } from './client';

// ============================================
// TYPES
// ============================================

/**
 * Données pour créer une salle
 */
export interface CreateRoomInput {
  name: string;
  capacity: number;
  examId: number;
}

/**
 * Données pour mettre à jour une salle
 */
export interface UpdateRoomInput {
  name?: string;
  capacity?: number;
}

/**
 * Données pour assigner un élève à une salle
 */
export interface AssignStudentInput {
  studentId: number;
  roomId: number;
  seatNumber?: number;
}

// ============================================
// FONCTIONS CRUD - ROOM
// ============================================

/**
 * Récupère toutes les salles d'un examen
 *
 * @param examId - ID de l'examen
 * @returns Liste des salles triées par nom
 */
export async function getRoomsByExam(examId: number): Promise<Room[]> {
  const prisma = getPrismaClient();
  return prisma.room.findMany({
    where: { examId },
    orderBy: { name: 'asc' },
  });
}

/**
 * Récupère une salle par son ID
 *
 * @param id - ID de la salle
 * @returns Salle trouvée ou null
 */
export async function getRoomById(id: number): Promise<Room | null> {
  const prisma = getPrismaClient();
  return prisma.room.findUnique({
    where: { id },
  });
}

/**
 * Crée une nouvelle salle
 *
 * @param data - Données de la salle
 * @returns Salle créée
 */
export async function createRoom(data: CreateRoomInput): Promise<Room> {
  const prisma = getPrismaClient();
  return prisma.room.create({
    data: {
      name: data.name.trim(),
      capacity: data.capacity,
      examId: data.examId,
    },
  });
}

/**
 * Crée plusieurs salles en une seule opération
 *
 * @param rooms - Liste des salles à créer
 * @returns Nombre de salles créées
 */
export async function createManyRooms(rooms: CreateRoomInput[]): Promise<number> {
  const prisma = getPrismaClient();
  const result = await prisma.room.createMany({
    data: rooms.map((r) => ({
      name: r.name.trim(),
      capacity: r.capacity,
      examId: r.examId,
    })),
  });
  return result.count;
}

/**
 * Met à jour une salle
 *
 * @param id - ID de la salle
 * @param data - Données à mettre à jour
 * @returns Salle mise à jour
 */
export async function updateRoom(
  id: number,
  data: UpdateRoomInput
): Promise<Room> {
  const prisma = getPrismaClient();
  return prisma.room.update({
    where: { id },
    data: {
      name: data.name?.trim(),
      capacity: data.capacity,
    },
  });
}

/**
 * Supprime une salle et toutes ses assignations
 *
 * @param id - ID de la salle
 * @returns Salle supprimée
 */
export async function deleteRoom(id: number): Promise<Room> {
  const prisma = getPrismaClient();
  return prisma.room.delete({
    where: { id },
  });
}

/**
 * Supprime toutes les salles d'un examen
 *
 * @param examId - ID de l'examen
 * @returns Nombre de salles supprimées
 */
export async function deleteAllRoomsByExam(examId: number): Promise<number> {
  const prisma = getPrismaClient();
  const result = await prisma.room.deleteMany({
    where: { examId },
  });
  return result.count;
}

// ============================================
// FONCTIONS CRUD - ROOM ASSIGNMENT
// ============================================

/**
 * Récupère une salle avec tous ses élèves assignés
 *
 * @param roomId - ID de la salle
 * @returns Salle avec la liste des élèves
 */
export async function getRoomWithStudents(roomId: number) {
  const prisma = getPrismaClient();
  return prisma.room.findUnique({
    where: { id: roomId },
    include: {
      assignments: {
        include: {
          student: {
            include: {
              school: true,
            },
          },
        },
        orderBy: [
          { student: { lastName: 'asc' } },
          { student: { firstName: 'asc' } },
        ],
      },
    },
  });
}

/**
 * Récupère toutes les salles d'un examen avec leurs assignations
 *
 * @param examId - ID de l'examen
 * @returns Liste des salles avec élèves
 */
export async function getRoomsWithAssignments(examId: number) {
  const prisma = getPrismaClient();
  return prisma.room.findMany({
    where: { examId },
    include: {
      assignments: {
        include: {
          student: {
            include: {
              school: true,
            },
          },
        },
        orderBy: [
          { student: { lastName: 'asc' } },
          { student: { firstName: 'asc' } },
        ],
      },
    },
    orderBy: { name: 'asc' },
  });
}

/**
 * Assigne un élève à une salle
 *
 * @param data - Données d'assignation
 * @returns Assignation créée
 * @throws Error si l'élève est déjà assigné ou la salle pleine
 */
export async function assignStudentToRoom(
  data: AssignStudentInput
): Promise<RoomAssignment> {
  const prisma = getPrismaClient();

  // Vérifier que l'élève n'est pas déjà assigné
  const existingAssignment = await prisma.roomAssignment.findUnique({
    where: { studentId: data.studentId },
  });

  if (existingAssignment) {
    throw new Error("L'élève est déjà assigné à une salle");
  }

  // Vérifier que la salle n'est pas pleine
  const room = await prisma.room.findUnique({
    where: { id: data.roomId },
    include: {
      _count: {
        select: { assignments: true },
      },
    },
  });

  if (!room) {
    throw new Error('Salle non trouvée');
  }

  if (room._count.assignments >= room.capacity) {
    throw new Error('La salle est pleine');
  }

  return prisma.roomAssignment.create({
    data: {
      studentId: data.studentId,
      roomId: data.roomId,
      seatNumber: data.seatNumber,
    },
  });
}

/**
 * Assigne plusieurs élèves à une salle
 *
 * @param assignments - Liste des assignations
 * @returns Nombre d'assignations créées
 */
export async function assignManyStudentsToRoom(
  assignments: AssignStudentInput[]
): Promise<number> {
  const prisma = getPrismaClient();

  const result = await prisma.roomAssignment.createMany({
    data: assignments.map((a) => ({
      studentId: a.studentId,
      roomId: a.roomId,
      seatNumber: a.seatNumber,
    })),
    skipDuplicates: true,
  });

  return result.count;
}

/**
 * Supprime l'assignation d'un élève
 *
 * @param studentId - ID de l'élève
 * @returns Assignation supprimée
 */
export async function removeStudentAssignment(
  studentId: number
): Promise<RoomAssignment> {
  const prisma = getPrismaClient();
  return prisma.roomAssignment.delete({
    where: { studentId },
  });
}

/**
 * Supprime toutes les assignations d'un examen
 *
 * @param examId - ID de l'examen
 * @returns Nombre d'assignations supprimées
 */
export async function clearAllAssignments(examId: number): Promise<number> {
  const prisma = getPrismaClient();

  // Récupérer les IDs des salles de l'examen
  const rooms = await prisma.room.findMany({
    where: { examId },
    select: { id: true },
  });

  const roomIds = rooms.map((r) => r.id);

  const result = await prisma.roomAssignment.deleteMany({
    where: {
      roomId: { in: roomIds },
    },
  });

  return result.count;
}

/**
 * Récupère l'assignation d'un élève
 *
 * @param studentId - ID de l'élève
 * @returns Assignation avec infos de la salle ou null
 */
export async function getStudentAssignment(studentId: number) {
  const prisma = getPrismaClient();
  return prisma.roomAssignment.findUnique({
    where: { studentId },
    include: {
      room: true,
    },
  });
}

/**
 * Compte le nombre d'élèves assignés vs non assignés
 *
 * @param examId - ID de l'examen
 * @returns Statistiques d'assignation
 */
export async function getAssignmentStats(examId: number) {
  const prisma = getPrismaClient();

  const totalStudents = await prisma.student.count({
    where: { examId },
  });

  const assignedStudents = await prisma.roomAssignment.count({
    where: {
      student: { examId },
    },
  });

  return {
    total: totalStudents,
    assigned: assignedStudents,
    unassigned: totalStudents - assignedStudents,
  };
}

/**
 * Récupère les élèves non assignés à une salle
 *
 * @param examId - ID de l'examen
 * @returns Liste des élèves sans salle
 */
export async function getUnassignedStudents(examId: number) {
  const prisma = getPrismaClient();
  return prisma.student.findMany({
    where: {
      examId,
      roomAssignment: null,
    },
    include: {
      school: true,
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });
}
