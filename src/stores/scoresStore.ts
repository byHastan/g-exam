/**
 * Store Zustand pour les notes
 * Gère l'état local des notes avec persistance
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateStudentAverage } from '@/core/calculations/average';
import type { StudentScore } from '@/core/calculations/average';

// ============================================
// TYPES
// ============================================

export interface Score {
  id: number;
  studentId: number;
  subjectId: number;
  value: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentWithAverage {
  studentId: number;
  average: number | null;
  scoresCount: number;
}

interface ScoresState {
  // Données
  scores: Score[];
  isLoading: boolean;
  error: string | null;

  // Actions CRUD
  upsertScore: (studentId: number, subjectId: number, value: number) => Score;
  deleteScore: (studentId: number, subjectId: number) => boolean;
  deleteScoresByStudent: (studentId: number) => number;

  // Getters
  getScore: (studentId: number, subjectId: number) => Score | undefined;
  getScoresByStudent: (studentId: number) => Score[];
  getScoresBySubject: (subjectId: number) => Score[];

  // Calculs
  calculateAverage: (
    studentId: number,
    subjects: Array<{ id: number; coefficient: number | null }>
  ) => number | null;
  getStudentsWithAverages: (
    studentIds: number[],
    subjects: Array<{ id: number; coefficient: number | null }>
  ) => StudentWithAverage[];

  // Utilitaires
  clearAll: () => void;
  setError: (error: string | null) => void;
}

// Compteur pour générer des IDs uniques
let nextId = 1;

// ============================================
// STORE
// ============================================

export const useScoresStore = create<ScoresState>()(
  persist(
    (set, get) => ({
      scores: [],
      isLoading: false,
      error: null,

      upsertScore: (studentId: number, subjectId: number, value: number) => {
        const { scores } = get();
        const existingIndex = scores.findIndex(
          (s) => s.studentId === studentId && s.subjectId === subjectId
        );

        const now = new Date();

        if (existingIndex >= 0) {
          // Update
          const updatedScore = {
            ...scores[existingIndex],
            value,
            updatedAt: now,
          };

          set((state) => ({
            scores: state.scores.map((s, i) =>
              i === existingIndex ? updatedScore : s
            ),
            error: null,
          }));

          return updatedScore;
        } else {
          // Create
          const newScore: Score = {
            id: nextId++,
            studentId,
            subjectId,
            value,
            createdAt: now,
            updatedAt: now,
          };

          set((state) => ({
            scores: [...state.scores, newScore],
            error: null,
          }));

          return newScore;
        }
      },

      deleteScore: (studentId: number, subjectId: number) => {
        const { scores } = get();
        const exists = scores.some(
          (s) => s.studentId === studentId && s.subjectId === subjectId
        );

        if (!exists) {
          return false;
        }

        set((state) => ({
          scores: state.scores.filter(
            (s) => !(s.studentId === studentId && s.subjectId === subjectId)
          ),
          error: null,
        }));

        return true;
      },

      deleteScoresByStudent: (studentId: number) => {
        const { scores } = get();
        const toDelete = scores.filter((s) => s.studentId === studentId);

        set((state) => ({
          scores: state.scores.filter((s) => s.studentId !== studentId),
          error: null,
        }));

        return toDelete.length;
      },

      getScore: (studentId: number, subjectId: number) => {
        return get().scores.find(
          (s) => s.studentId === studentId && s.subjectId === subjectId
        );
      },

      getScoresByStudent: (studentId: number) => {
        return get().scores.filter((s) => s.studentId === studentId);
      },

      getScoresBySubject: (subjectId: number) => {
        return get().scores.filter((s) => s.subjectId === subjectId);
      },

      calculateAverage: (
        studentId: number,
        subjects: Array<{ id: number; coefficient: number | null }>
      ) => {
        const { scores } = get();
        const studentScores = scores.filter((s) => s.studentId === studentId);

        if (studentScores.length === 0) {
          return null;
        }

        // Convertir en format attendu par calculateStudentAverage
        const scoresForCalc: StudentScore[] = studentScores.map((score) => {
          const subject = subjects.find((s) => s.id === score.subjectId);
          return {
            subjectId: String(score.subjectId),
            score: score.value,
            coefficient: subject?.coefficient ?? undefined,
          };
        });

        return calculateStudentAverage(scoresForCalc);
      },

      getStudentsWithAverages: (
        studentIds: number[],
        subjects: Array<{ id: number; coefficient: number | null }>
      ) => {
        const { scores, calculateAverage } = get();

        return studentIds.map((studentId) => {
          const studentScores = scores.filter((s) => s.studentId === studentId);
          return {
            studentId,
            average: calculateAverage(studentId, subjects),
            scoresCount: studentScores.length,
          };
        });
      },

      clearAll: () => {
        set({ scores: [], error: null });
      },

      setError: (error: string | null) => {
        set({ error });
      },
    }),
    {
      name: 'scores-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          const maxId = Math.max(0, ...state.scores.map((s) => s.id));
          nextId = maxId + 1;
          state.scores = state.scores.map((s) => ({
            ...s,
            createdAt: new Date(s.createdAt),
            updatedAt: new Date(s.updatedAt),
          }));
        }
      },
    }
  )
);
