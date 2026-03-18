/**
 * Service de gestion des élèves
 *
 * CRUD et opérations métier pour l'entité Student
 */

import { getPrismaClient } from './client';
import type { Student } from './client';

// ============================================
// TYPES
// ============================================

/**
 * Données pour créer un élève
 */
export interface CreateStudentInput {
  firstName: string;
  lastName: string;
  examId: number;
  schoolId: number;
  gender?: string; // M ou F
  birthDate?: Date;
}

/**
 * Données pour mettre à jour un élève
 */
export interface UpdateStudentInput {
  firstName?: string;
  lastName?: string;
  schoolId?: number;
  gender?: string;
  birthDate?: Date;
  isAbsent?: boolean; // Absent = true, Présent = false (défaut)
}

/**
 * Données d'import Excel pour un élève
 */
export interface ImportStudentData {
  firstName: string;
  lastName: string;
  schoolName: string; // Sera converti en schoolId
  gender?: string;
  birthDate?: Date;
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Génère un numéro de candidat unique
 * Format: YYYY-XXXXX (année + numéro séquentiel)
 *
 * @param examYear - Année de l'examen
 * @param sequence - Numéro séquentiel
 * @returns Numéro de candidat formaté
 */
function generateCandidateNumber(examYear: number, sequence: number): string {
  return `${examYear}-${String(sequence).padStart(5, '0')}`;
}

// ============================================
// FONCTIONS CRUD
// ============================================

/**
 * Récupère tous les élèves d'un examen
 *
 * @param examId - ID de l'examen
 * @returns Liste des élèves triés alphabétiquement
 */
export async function getStudentsByExam(examId: number): Promise<Student[]> {
  const prisma = getPrismaClient();
  return prisma.student.findMany({
    where: { examId },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });
}

/**
 * Récupère tous les élèves d'un examen avec leur établissement
 *
 * @param examId - ID de l'examen
 * @returns Liste des élèves avec leur établissement
 */
export async function getStudentsWithSchool(examId: number) {
  const prisma = getPrismaClient();
  return prisma.student.findMany({
    where: { examId },
    include: { school: true },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });
}

/**
 * Récupère un élève par son ID
 *
 * @param id - ID de l'élève
 * @returns Élève trouvé ou null
 */
export async function getStudentById(id: number): Promise<Student | null> {
  const prisma = getPrismaClient();
  return prisma.student.findUnique({
    where: { id },
  });
}

/**
 * Récupère un élève par son numéro de candidat
 *
 * @param candidateNumber - Numéro de candidat
 * @returns Élève trouvé ou null
 */
export async function getStudentByCandidateNumber(
  candidateNumber: string
): Promise<Student | null> {
  const prisma = getPrismaClient();
  return prisma.student.findUnique({
    where: { candidateNumber },
  });
}

/**
 * Recherche des élèves par nom/prénom
 *
 * @param examId - ID de l'examen
 * @param query - Terme de recherche
 * @returns Liste des élèves correspondants
 */
export async function searchStudents(examId: number, query: string) {
  const prisma = getPrismaClient();
  return prisma.student.findMany({
    where: {
      examId,
      OR: [
        { firstName: { contains: query } },
        { lastName: { contains: query } },
        { candidateNumber: { contains: query } },
      ],
    },
    include: { school: true },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });
}

/**
 * Crée un nouvel élève avec génération automatique du numéro de candidat
 *
 * @param data - Données de l'élève
 * @returns Élève créé
 */
export async function createStudent(data: CreateStudentInput): Promise<Student> {
  const prisma = getPrismaClient();

  // Récupérer l'année de l'examen pour le numéro de candidat
  const exam = await prisma.exam.findUnique({
    where: { id: data.examId },
  });

  if (!exam) {
    throw new Error('Examen non trouvé');
  }

  // Compter les élèves existants pour générer le numéro séquentiel
  const count = await prisma.student.count({
    where: { examId: data.examId },
  });

  const candidateNumber = generateCandidateNumber(exam.year, count + 1);

  return prisma.student.create({
    data: {
      candidateNumber,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      gender: data.gender,
      birthDate: data.birthDate,
      examId: data.examId,
      schoolId: data.schoolId,
    },
  });
}

/**
 * Crée plusieurs élèves en une seule opération (import)
 *
 * @param examId - ID de l'examen
 * @param students - Liste des élèves à créer
 * @returns Nombre d'élèves créés
 */
export async function createManyStudents(
  examId: number,
  students: Array<Omit<CreateStudentInput, 'examId'>>
): Promise<number> {
  const prisma = getPrismaClient();

  // Récupérer l'année de l'examen
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
  });

  if (!exam) {
    throw new Error('Examen non trouvé');
  }

  // Compter les élèves existants
  const startCount = await prisma.student.count({
    where: { examId },
  });

  // Préparer les données avec numéros de candidat
  const studentsWithNumbers = students.map((student, index) => ({
    candidateNumber: generateCandidateNumber(exam.year, startCount + index + 1),
    firstName: student.firstName.trim(),
    lastName: student.lastName.trim(),
    gender: student.gender,
    birthDate: student.birthDate,
    examId,
    schoolId: student.schoolId,
  }));

  const result = await prisma.student.createMany({
    data: studentsWithNumbers,
  });

  return result.count;
}

/**
 * Met à jour un élève
 *
 * @param id - ID de l'élève
 * @param data - Données à mettre à jour
 * @returns Élève mis à jour
 */
export async function updateStudent(
  id: number,
  data: UpdateStudentInput
): Promise<Student> {
  const prisma = getPrismaClient();

  // Vérifier si l'examen n'est pas verrouillé
  const student = await prisma.student.findUnique({
    where: { id },
    include: { exam: true },
  });

  if (student?.exam.isLocked) {
    throw new Error('Impossible de modifier un élève: examen verrouillé');
  }

  return prisma.student.update({
    where: { id },
    data: {
      firstName: data.firstName?.trim(),
      lastName: data.lastName?.trim(),
      gender: data.gender,
      birthDate: data.birthDate,
      schoolId: data.schoolId,
      isAbsent: data.isAbsent,
    },
  });
}

/**
 * Supprime un élève
 *
 * @param id - ID de l'élève
 * @returns Élève supprimé
 */
export async function deleteStudent(id: number): Promise<Student> {
  const prisma = getPrismaClient();

  // Vérifier si l'examen n'est pas verrouillé
  const student = await prisma.student.findUnique({
    where: { id },
    include: { exam: true },
  });

  if (student?.exam.isLocked) {
    throw new Error('Impossible de supprimer un élève: examen verrouillé');
  }

  return prisma.student.delete({
    where: { id },
  });
}

/**
 * Récupère un élève avec toutes ses notes
 *
 * @param id - ID de l'élève
 * @returns Élève avec ses notes et matières
 */
export async function getStudentWithScores(id: number) {
  const prisma = getPrismaClient();
  return prisma.student.findUnique({
    where: { id },
    include: {
      school: true,
      scores: {
        include: {
          subject: true,
        },
      },
      roomAssignment: {
        include: {
          room: true,
        },
      },
    },
  });
}

/**
 * Compte les élèves par établissement pour un examen
 *
 * @param examId - ID de l'examen
 * @returns Liste des établissements avec leur nombre d'élèves
 */
export async function countStudentsBySchool(examId: number) {
  const prisma = getPrismaClient();
  return prisma.student.groupBy({
    by: ['schoolId'],
    where: { examId },
    _count: {
      id: true,
    },
  });
}
