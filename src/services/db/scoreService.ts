/**
 * Service de gestion des notes
 *
 * CRUD et opérations métier pour l'entité Score
 */

import { getPrismaClient } from './client';
import type { Score } from './client';

// ============================================
// TYPES
// ============================================

/**
 * Données pour créer/mettre à jour une note
 */
export interface UpsertScoreInput {
  studentId: number;
  subjectId: number;
  value: number;
}

/**
 * Note avec les informations liées
 */
export interface ScoreWithDetails {
  id: number;
  value: number;
  studentId: number;
  subjectId: number;
  studentName: string;
  subjectName: string;
  maxScore: number;
}

// ============================================
// FONCTIONS CRUD
// ============================================

/**
 * Récupère toutes les notes d'un élève
 *
 * @param studentId - ID de l'élève
 * @returns Liste des notes avec les matières
 */
export async function getScoresByStudent(studentId: number) {
  const prisma = getPrismaClient();
  return prisma.score.findMany({
    where: { studentId },
    include: {
      subject: true,
    },
    orderBy: {
      subject: { name: 'asc' },
    },
  });
}

/**
 * Récupère toutes les notes d'une épreuve
 *
 * @param subjectId - ID de l'épreuve
 * @returns Liste des notes avec les élèves
 */
export async function getScoresBySubject(subjectId: number) {
  const prisma = getPrismaClient();
  return prisma.score.findMany({
    where: { subjectId },
    include: {
      student: true,
    },
    orderBy: [
      { student: { lastName: 'asc' } },
      { student: { firstName: 'asc' } },
    ],
  });
}

/**
 * Récupère toutes les notes d'un examen
 *
 * @param examId - ID de l'examen
 * @returns Liste des notes avec élèves et matières
 */
export async function getScoresByExam(examId: number) {
  const prisma = getPrismaClient();
  return prisma.score.findMany({
    where: {
      student: { examId },
    },
    include: {
      student: true,
      subject: true,
    },
  });
}

/**
 * Récupère une note spécifique
 *
 * @param studentId - ID de l'élève
 * @param subjectId - ID de l'épreuve
 * @returns Note trouvée ou null
 */
export async function getScore(
  studentId: number,
  subjectId: number
): Promise<Score | null> {
  const prisma = getPrismaClient();
  return prisma.score.findUnique({
    where: {
      studentId_subjectId: {
        studentId,
        subjectId,
      },
    },
  });
}

/**
 * Crée ou met à jour une note (upsert)
 *
 * @param data - Données de la note
 * @returns Note créée ou mise à jour
 * @throws Error si l'examen est verrouillé ou la note invalide
 */
export async function upsertScore(data: UpsertScoreInput): Promise<Score> {
  const prisma = getPrismaClient();

  // Vérifier que l'examen n'est pas verrouillé
  const student = await prisma.student.findUnique({
    where: { id: data.studentId },
    include: { exam: true },
  });

  if (student?.exam.isLocked) {
    throw new Error('Impossible de saisir une note: examen verrouillé');
  }

  // Vérifier que la note est valide (entre 0 et maxScore)
  const subject = await prisma.subject.findUnique({
    where: { id: data.subjectId },
  });

  if (!subject) {
    throw new Error('Épreuve non trouvée');
  }

  if (data.value < 0 || data.value > subject.maxScore) {
    throw new Error(
      `La note doit être comprise entre 0 et ${subject.maxScore}`
    );
  }

  return prisma.score.upsert({
    where: {
      studentId_subjectId: {
        studentId: data.studentId,
        subjectId: data.subjectId,
      },
    },
    update: {
      value: data.value,
    },
    create: {
      studentId: data.studentId,
      subjectId: data.subjectId,
      value: data.value,
    },
  });
}

/**
 * Saisie en masse des notes pour une épreuve
 *
 * @param scores - Liste des notes à créer/mettre à jour
 * @returns Nombre de notes traitées
 */
export async function upsertManyScores(
  scores: UpsertScoreInput[]
): Promise<number> {
  const prisma = getPrismaClient();

  // Utiliser une transaction pour garantir l'intégrité
  const results = await prisma.$transaction(
    scores.map((score) =>
      prisma.score.upsert({
        where: {
          studentId_subjectId: {
            studentId: score.studentId,
            subjectId: score.subjectId,
          },
        },
        update: {
          value: score.value,
        },
        create: {
          studentId: score.studentId,
          subjectId: score.subjectId,
          value: score.value,
        },
      })
    )
  );

  return results.length;
}

/**
 * Supprime une note
 *
 * @param studentId - ID de l'élève
 * @param subjectId - ID de l'épreuve
 * @returns Note supprimée
 */
export async function deleteScore(
  studentId: number,
  subjectId: number
): Promise<Score> {
  const prisma = getPrismaClient();

  // Vérifier que l'examen n'est pas verrouillé
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { exam: true },
  });

  if (student?.exam.isLocked) {
    throw new Error('Impossible de supprimer une note: examen verrouillé');
  }

  return prisma.score.delete({
    where: {
      studentId_subjectId: {
        studentId,
        subjectId,
      },
    },
  });
}

/**
 * Supprime toutes les notes d'un élève
 *
 * @param studentId - ID de l'élève
 * @returns Nombre de notes supprimées
 */
export async function deleteScoresByStudent(studentId: number): Promise<number> {
  const prisma = getPrismaClient();

  const result = await prisma.score.deleteMany({
    where: { studentId },
  });

  return result.count;
}

/**
 * Vérifie si un élève a toutes ses notes
 *
 * @param studentId - ID de l'élève
 * @param examId - ID de l'examen
 * @returns true si l'élève a une note pour chaque épreuve
 */
export async function hasAllScores(
  studentId: number,
  examId: number
): Promise<boolean> {
  const prisma = getPrismaClient();

  const subjectCount = await prisma.subject.count({
    where: { examId },
  });

  const scoreCount = await prisma.score.count({
    where: { studentId },
  });

  return scoreCount >= subjectCount;
}

/**
 * Récupère le nombre de notes saisies par épreuve
 *
 * @param examId - ID de l'examen
 * @returns Liste des épreuves avec leur nombre de notes
 */
export async function getScoreCountBySubject(examId: number) {
  const prisma = getPrismaClient();

  const subjects = await prisma.subject.findMany({
    where: { examId },
    include: {
      _count: {
        select: { scores: true },
      },
    },
  });

  return subjects.map((s) => ({
    subjectId: s.id,
    subjectName: s.name,
    scoreCount: s._count.scores,
  }));
}

/**
 * Récupère les élèves sans notes pour un examen
 *
 * @param examId - ID de l'examen
 * @returns Liste des élèves sans aucune note
 */
export async function getStudentsWithoutScores(examId: number) {
  const prisma = getPrismaClient();
  return prisma.student.findMany({
    where: {
      examId,
      scores: {
        none: {},
      },
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });
}
