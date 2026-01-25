/**
 * Service de gestion des épreuves (matières)
 *
 * CRUD et opérations métier pour l'entité Subject
 */

import { getPrismaClient } from './client';
import type { Subject } from './client';

// ============================================
// TYPES
// ============================================

/**
 * Données pour créer une épreuve
 */
export interface CreateSubjectInput {
  name: string;
  examId: number;
  coefficient?: number; // Optionnel
  maxScore?: number; // Défaut: 20
}

/**
 * Données pour mettre à jour une épreuve
 */
export interface UpdateSubjectInput {
  name?: string;
  coefficient?: number | null; // null pour supprimer le coefficient
  maxScore?: number;
}

// ============================================
// FONCTIONS CRUD
// ============================================

/**
 * Récupère toutes les épreuves d'un examen
 *
 * @param examId - ID de l'examen
 * @returns Liste des épreuves triées par nom
 */
export async function getSubjectsByExam(examId: number): Promise<Subject[]> {
  const prisma = getPrismaClient();
  return prisma.subject.findMany({
    where: { examId },
    orderBy: { name: 'asc' },
  });
}

/**
 * Récupère une épreuve par son ID
 *
 * @param id - ID de l'épreuve
 * @returns Épreuve trouvée ou null
 */
export async function getSubjectById(id: number): Promise<Subject | null> {
  const prisma = getPrismaClient();
  return prisma.subject.findUnique({
    where: { id },
  });
}

/**
 * Crée une nouvelle épreuve
 *
 * @param data - Données de l'épreuve
 * @returns Épreuve créée
 */
export async function createSubject(data: CreateSubjectInput): Promise<Subject> {
  const prisma = getPrismaClient();

  // Vérifier que l'examen n'est pas verrouillé
  const exam = await prisma.exam.findUnique({
    where: { id: data.examId },
  });

  if (exam?.isLocked) {
    throw new Error("Impossible d'ajouter une épreuve: examen verrouillé");
  }

  return prisma.subject.create({
    data: {
      name: data.name.trim(),
      coefficient: data.coefficient,
      maxScore: data.maxScore ?? 20,
      examId: data.examId,
    },
  });
}

/**
 * Crée plusieurs épreuves en une seule opération
 *
 * @param subjects - Liste des épreuves à créer
 * @returns Nombre d'épreuves créées
 */
export async function createManySubjects(
  subjects: CreateSubjectInput[]
): Promise<number> {
  const prisma = getPrismaClient();

  // Vérifier que l'examen n'est pas verrouillé (tous doivent avoir le même examId)
  if (subjects.length > 0) {
    const exam = await prisma.exam.findUnique({
      where: { id: subjects[0].examId },
    });

    if (exam?.isLocked) {
      throw new Error("Impossible d'ajouter des épreuves: examen verrouillé");
    }
  }

  const result = await prisma.subject.createMany({
    data: subjects.map((s) => ({
      name: s.name.trim(),
      coefficient: s.coefficient,
      maxScore: s.maxScore ?? 20,
      examId: s.examId,
    })),
  });

  return result.count;
}

/**
 * Met à jour une épreuve
 *
 * @param id - ID de l'épreuve
 * @param data - Données à mettre à jour
 * @returns Épreuve mise à jour
 */
export async function updateSubject(
  id: number,
  data: UpdateSubjectInput
): Promise<Subject> {
  const prisma = getPrismaClient();

  // Vérifier que l'examen n'est pas verrouillé
  const subject = await prisma.subject.findUnique({
    where: { id },
    include: { exam: true },
  });

  if (subject?.exam.isLocked) {
    throw new Error("Impossible de modifier l'épreuve: examen verrouillé");
  }

  return prisma.subject.update({
    where: { id },
    data: {
      name: data.name?.trim(),
      coefficient: data.coefficient,
      maxScore: data.maxScore,
    },
  });
}

/**
 * Supprime une épreuve
 * Note: Échoue si des notes sont associées (cascade désactivée pour sécurité)
 *
 * @param id - ID de l'épreuve
 * @returns Épreuve supprimée
 * @throws Error si des notes sont associées ou examen verrouillé
 */
export async function deleteSubject(id: number): Promise<Subject> {
  const prisma = getPrismaClient();

  // Vérifier que l'examen n'est pas verrouillé
  const subject = await prisma.subject.findUnique({
    where: { id },
    include: { exam: true },
  });

  if (subject?.exam.isLocked) {
    throw new Error("Impossible de supprimer l'épreuve: examen verrouillé");
  }

  // Vérifier si des notes sont associées
  const scoreCount = await prisma.score.count({
    where: { subjectId: id },
  });

  if (scoreCount > 0) {
    throw new Error(
      `Impossible de supprimer l'épreuve: ${scoreCount} note(s) associée(s)`
    );
  }

  return prisma.subject.delete({
    where: { id },
  });
}

/**
 * Récupère une épreuve avec toutes ses notes
 *
 * @param id - ID de l'épreuve
 * @returns Épreuve avec ses notes
 */
export async function getSubjectWithScores(id: number) {
  const prisma = getPrismaClient();
  return prisma.subject.findUnique({
    where: { id },
    include: {
      scores: {
        include: {
          student: true,
        },
      },
    },
  });
}

/**
 * Vérifie si des coefficients sont définis pour un examen
 *
 * @param examId - ID de l'examen
 * @returns true si au moins une épreuve a un coefficient
 */
export async function hasCoefficients(examId: number): Promise<boolean> {
  const prisma = getPrismaClient();
  const count = await prisma.subject.count({
    where: {
      examId,
      coefficient: { not: null },
    },
  });
  return count > 0;
}

/**
 * Calcule la somme des coefficients pour un examen
 *
 * @param examId - ID de l'examen
 * @returns Somme des coefficients (0 si aucun coefficient)
 */
export async function getTotalCoefficients(examId: number): Promise<number> {
  const prisma = getPrismaClient();
  const result = await prisma.subject.aggregate({
    where: {
      examId,
      coefficient: { not: null },
    },
    _sum: {
      coefficient: true,
    },
  });
  return result._sum.coefficient ?? 0;
}
