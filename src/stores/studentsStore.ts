/**
 * Store Zustand pour les élèves/candidats
 * Gère l'état local des élèves avec persistance
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// TYPES
// ============================================

export interface Student {
  id: number;
  candidateNumber: string;
  firstName: string;
  lastName: string;
  gender: string | null;
  birthDate: Date | null;
  schoolId: number;
  createdAt: Date;
}

export interface CreateStudentInput {
  firstName: string;
  lastName: string;
  schoolId: number;
  gender?: string;
  birthDate?: Date;
}

interface StudentsState {
  // Données
  students: Student[];
  isLoading: boolean;
  error: string | null;
  examYear: number;

  // Actions CRUD
  addStudent: (data: CreateStudentInput) => Student;
  addManyStudents: (students: CreateStudentInput[]) => number;
  updateStudent: (id: number, data: Partial<CreateStudentInput>) => void;
  deleteStudent: (id: number) => boolean;

  // Getters
  getStudentById: (id: number) => Student | undefined;
  getStudentsBySchool: (schoolId: number) => Student[];
  searchStudents: (query: string) => Student[];

  // Utilitaires
  setExamYear: (year: number) => void;
  clearAll: () => void;
  setError: (error: string | null) => void;
}

// Compteur pour générer des IDs uniques
let nextId = 1;
let candidateSequence = 1;

/**
 * Génère un numéro de candidat unique
 */
function generateCandidateNumber(year: number): string {
  return `${year}-${String(candidateSequence++).padStart(5, '0')}`;
}

// ============================================
// STORE
// ============================================

export const useStudentsStore = create<StudentsState>()(
  persist(
    (set, get) => ({
      students: [],
      isLoading: false,
      error: null,
      examYear: new Date().getFullYear(),

      addStudent: (data: CreateStudentInput) => {
        const { examYear } = get();
        const newStudent: Student = {
          id: nextId++,
          candidateNumber: generateCandidateNumber(examYear),
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          gender: data.gender || null,
          birthDate: data.birthDate || null,
          schoolId: data.schoolId,
          createdAt: new Date(),
        };

        set((state) => ({
          students: [...state.students, newStudent].sort((a, b) =>
            a.lastName.localeCompare(b.lastName) ||
            a.firstName.localeCompare(b.firstName)
          ),
          error: null,
        }));

        return newStudent;
      },

      addManyStudents: (studentsData: CreateStudentInput[]) => {
        const { examYear } = get();
        const newStudents: Student[] = studentsData.map((data) => ({
          id: nextId++,
          candidateNumber: generateCandidateNumber(examYear),
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          gender: data.gender || null,
          birthDate: data.birthDate || null,
          schoolId: data.schoolId,
          createdAt: new Date(),
        }));

        set((state) => ({
          students: [...state.students, ...newStudents].sort((a, b) =>
            a.lastName.localeCompare(b.lastName) ||
            a.firstName.localeCompare(b.firstName)
          ),
          error: null,
        }));

        return newStudents.length;
      },

      updateStudent: (id: number, data: Partial<CreateStudentInput>) => {
        set((state) => ({
          students: state.students
            .map((student) =>
              student.id === id
                ? {
                    ...student,
                    firstName: data.firstName?.trim() ?? student.firstName,
                    lastName: data.lastName?.trim() ?? student.lastName,
                    gender: data.gender ?? student.gender,
                    birthDate: data.birthDate ?? student.birthDate,
                    schoolId: data.schoolId ?? student.schoolId,
                  }
                : student
            )
            .sort((a, b) =>
              a.lastName.localeCompare(b.lastName) ||
              a.firstName.localeCompare(b.firstName)
            ),
          error: null,
        }));
      },

      deleteStudent: (id: number) => {
        const { students } = get();
        const student = students.find((s) => s.id === id);

        if (!student) {
          set({ error: 'Élève non trouvé' });
          return false;
        }

        set((state) => ({
          students: state.students.filter((s) => s.id !== id),
          error: null,
        }));

        return true;
      },

      getStudentById: (id: number) => {
        return get().students.find((s) => s.id === id);
      },

      getStudentsBySchool: (schoolId: number) => {
        return get().students.filter((s) => s.schoolId === schoolId);
      },

      searchStudents: (query: string) => {
        const lowerQuery = query.toLowerCase();
        return get().students.filter(
          (s) =>
            s.firstName.toLowerCase().includes(lowerQuery) ||
            s.lastName.toLowerCase().includes(lowerQuery) ||
            s.candidateNumber.toLowerCase().includes(lowerQuery)
        );
      },

      setExamYear: (year: number) => {
        set({ examYear: year });
      },

      clearAll: () => {
        candidateSequence = 1;
        set({ students: [], error: null });
      },

      setError: (error: string | null) => {
        set({ error });
      },
    }),
    {
      name: 'students-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Mettre à jour les compteurs
          const maxId = Math.max(0, ...state.students.map((s) => s.id));
          nextId = maxId + 1;
          
          // Trouver le plus grand numéro de séquence
          const sequences = state.students.map((s) => {
            const match = s.candidateNumber.match(/-(\d+)$/);
            return match ? parseInt(match[1], 10) : 0;
          });
          candidateSequence = Math.max(1, ...sequences) + 1;
          
          // Convertir les dates
          state.students = state.students.map((s) => ({
            ...s,
            createdAt: new Date(s.createdAt),
            birthDate: s.birthDate ? new Date(s.birthDate) : null,
          }));
        }
      },
    }
  )
);
