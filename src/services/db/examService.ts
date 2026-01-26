/**
 * Service de gestion des examens
 *
 * CRUD et opérations métier pour l'entité Exam
 */

import { getPrismaClient } from './client';
import type { Exam } from './client';

// ============================================
// TYPES
// ============================================

/**
 * Données pour créer un examen
 */
export interface CreateExamInput {
  name: string;
  year: number;
  passingGrade?: number; // Défaut: 10
}

/**
 * Données pour mettre à jour un examen
 */
export interface UpdateExamInput {
  name?: string;
  year?: number;
  passingGrade?: number;
  isLocked?: boolean;
}

// ============================================
// FONCTIONS CRUD
// ============================================

/**
 * Récupère tous les examens
 *
 * @returns Liste de tous les examens
 */
export async function getAllExams(): Promise<Exam[]> {
  const prisma = getPrismaClient();
  return prisma.exam.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Récupère un examen par son ID
 *
 * @param id - ID de l'examen
 * @returns Examen trouvé ou null
 */
export async function getExamById(id: number): Promise<Exam | null> {
  const prisma = getPrismaClient();
  return prisma.exam.findUnique({
    where: { id },
  });
}

/**
 * Récupère l'examen actif (le plus récent non verrouillé)
 * Note: En V1, un seul examen actif à la fois
 *
 * @returns Examen actif ou null
 */
export async function getActiveExam(): Promise<Exam | null> {
  const prisma = getPrismaClient();
  return prisma.exam.findFirst({
    where: { isLocked: false },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Crée un nouvel examen
 *
 * @param data - Données de l'examen
 * @returns Examen créé
 */
export async function createExam(data: CreateExamInput): Promise<Exam> {
  const prisma = getPrismaClient();
  return prisma.exam.create({
    data: {
      name: data.name,
      year: data.year,
      passingGrade: data.passingGrade ?? 10,
    },
  });
}

/**
 * Met à jour un examen
 *
 * @param id - ID de l'examen
 * @param data - Données à mettre à jour
 * @returns Examen mis à jour
 * @throws Error si l'examen est verrouillé
 */
export async function updateExam(
  id: number,
  data: UpdateExamInput
): Promise<Exam> {
  const prisma = getPrismaClient();

  // Vérifier si l'examen est verrouillé (sauf si on veut le déverrouiller)
  if (data.isLocked === undefined) {
    const exam = await prisma.exam.findUnique({ where: { id } });
    if (exam?.isLocked) {
      throw new Error('Impossible de modifier un examen verrouillé');
    }
  }

  return prisma.exam.update({
    where: { id },
    data,
  });
}

/**
 * Supprime un examen et toutes ses données associées
 * (cascade définie dans le schéma Prisma)
 *
 * @param id - ID de l'examen
 * @returns Examen supprimé
 */
export async function deleteExam(id: number): Promise<Exam> {
  const prisma = getPrismaClient();
  return prisma.exam.delete({
    where: { id },
  });
}

/**
 * Verrouille un examen (empêche les modifications)
 *
 * @param id - ID de l'examen
 * @returns Examen verrouillé
 */
export async function lockExam(id: number): Promise<Exam> {
  const prisma = getPrismaClient();
  return prisma.exam.update({
    where: { id },
    data: { isLocked: true },
  });
}

/**
 * Déverrouille un examen
 *
 * @param id - ID de l'examen
 * @returns Examen déverrouillé
 */
export async function unlockExam(id: number): Promise<Exam> {
  const prisma = getPrismaClient();
  return prisma.exam.update({
    where: { id },
    data: { isLocked: false },
  });
}

/**
 * Récupère un examen avec toutes ses relations
 *
 * @param id - ID de l'examen
 * @returns Examen avec students, subjects et rooms
 */
export async function getExamWithRelations(id: number) {
  const prisma = getPrismaClient();
  return prisma.exam.findUnique({
    where: { id },
    include: {
      students: {
        include: {
          school: true,
          scores: true,
        },
      },
      subjects: true,
      rooms: {
        include: {
          assignments: {
            include: {
              student: true,
            },
          },
        },
      },
    },
  });
}
