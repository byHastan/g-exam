/**
 * Service de gestion des établissements
 *
 * CRUD et opérations métier pour l'entité School
 */

import type { School } from './client';
import { getPrismaClient } from './client';

// ============================================
// TYPES
// ============================================

/**
 * Données pour créer un établissement
 */
export interface CreateSchoolInput {
  name: string;
  code?: string; // Code établissement (optionnel)
}

/**
 * Données pour mettre à jour un établissement
 */
export interface UpdateSchoolInput {
  name?: string;
  code?: string;
}

// ============================================
// FONCTIONS CRUD
// ============================================

/**
 * Récupère tous les établissements
 *
 * @returns Liste de tous les établissements triés par nom
 */
export async function getAllSchools(): Promise<School[]> {
  const prisma = getPrismaClient();
  return prisma.school.findMany({
    orderBy: { name: 'asc' },
  });
}

/**
 * Récupère un établissement par son ID
 *
 * @param id - ID de l'établissement
 * @returns Établissement trouvé ou null
 */
export async function getSchoolById(id: number): Promise<School | null> {
  const prisma = getPrismaClient();
  return prisma.school.findUnique({
    where: { id },
  });
}

/**
 * Recherche des établissements par nom
 *
 * @param query - Terme de recherche
 * @returns Liste des établissements correspondants
 */
export async function searchSchools(query: string): Promise<School[]> {
  const prisma = getPrismaClient();
  return prisma.school.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { code: { contains: query } },
      ],
    },
    orderBy: { name: 'asc' },
  });
}

/**
 * Crée un nouvel établissement
 *
 * @param data - Données de l'établissement
 * @returns Établissement créé
 */
export async function createSchool(data: CreateSchoolInput): Promise<School> {
  const prisma = getPrismaClient();
  return prisma.school.create({
    data: {
      name: data.name,
      code: data.code,
    },
  });
}

/**
 * Crée plusieurs établissements en une seule opération
 *
 * @param schools - Liste des établissements à créer
 * @returns Nombre d'établissements créés
 */
export async function createManySchools(
  schools: CreateSchoolInput[]
): Promise<number> {
  const prisma = getPrismaClient();
  const result = await prisma.school.createMany({
    data: schools.map((s) => ({
      name: s.name,
      code: s.code,
    })),
  });
  return result.count;
}

/**
 * Met à jour un établissement
 *
 * @param id - ID de l'établissement
 * @param data - Données à mettre à jour
 * @returns Établissement mis à jour
 */
export async function updateSchool(
  id: number,
  data: UpdateSchoolInput
): Promise<School> {
  const prisma = getPrismaClient();
  return prisma.school.update({
    where: { id },
    data,
  });
}

/**
 * Supprime un établissement
 * Note: Échoue si des élèves sont associés (contrainte FK)
 *
 * @param id - ID de l'établissement
 * @returns Établissement supprimé
 * @throws Error si des élèves sont associés
 */
export async function deleteSchool(id: number): Promise<School> {
  const prisma = getPrismaClient();

  // Vérifier si des élèves sont associés
  const studentCount = await prisma.student.count({
    where: { schoolId: id },
  });

  if (studentCount > 0) {
    throw new Error(
      `Impossible de supprimer l'établissement: ${studentCount} élève(s) associé(s)`
    );
  }

  return prisma.school.delete({
    where: { id },
  });
}

/**
 * Récupère un établissement avec ses élèves
 *
 * @param id - ID de l'établissement
 * @returns Établissement avec la liste de ses élèves
 */
export async function getSchoolWithStudents(id: number) {
  const prisma = getPrismaClient();
  return prisma.school.findUnique({
    where: { id },
    include: {
      students: {
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      },
    },
  });
}

/**
 * Récupère les statistiques d'un établissement pour un examen
 *
 * @param schoolId - ID de l'établissement
 * @param examId - ID de l'examen
 * @returns Statistiques (nombre d'élèves, etc.)
 */
export async function getSchoolStats(schoolId: number, examId: number) {
  const prisma = getPrismaClient();

  const students = await prisma.student.findMany({
    where: {
      schoolId,
      examId,
    },
    include: {
      scores: true,
    },
  });

  return {
    schoolId,
    examId,
    totalStudents: students.length,
    studentsWithScores: students.filter((s) => s.scores.length > 0).length,
  };
}
