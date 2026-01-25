/**
 * Store Zustand pour l'examen actif
 * Gère les informations de l'examen en cours
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Statut de l'examen
export type ExamStatus = 'draft' | 'locked';

interface ExamState {
  // Informations de l'examen actif
  examId: number | null;
  examName: string | null;
  examYear: number | null;
  status: ExamStatus;
  passingGrade: number; // Seuil de réussite (ex: 10/20)

  // Compteurs pour le dashboard
  candidatesCount: number;
  subjectsCount: number;
  passedCount: number;
  failedCount: number;

  // Actions
  setExam: (id: number, name: string, year: number, passingGrade?: number) => void;
  setStatus: (status: ExamStatus) => void;
  setPassingGrade: (grade: number) => void;
  updateCounts: (counts: {
    candidates?: number;
    subjects?: number;
    passed?: number;
    failed?: number;
  }) => void;
  clearExam: () => void;
}

export const useExamStore = create<ExamState>()(
  persist(
    (set) => ({
      // Valeurs par défaut (pas d'examen actif)
      examId: null,
      examName: null,
      examYear: null,
      status: 'draft',
      passingGrade: 10,

      candidatesCount: 0,
      subjectsCount: 0,
      passedCount: 0,
      failedCount: 0,

      setExam: (id: number, name: string, year: number, passingGrade?: number) => {
        set({
          examId: id,
          examName: name,
          examYear: year,
          status: 'draft',
          passingGrade: passingGrade ?? 10,
        });
      },

      setStatus: (status: ExamStatus) => {
        set({ status });
      },

      setPassingGrade: (grade: number) => {
        set({ passingGrade: grade });
      },

      updateCounts: (counts) => {
        set((state) => ({
          candidatesCount: counts.candidates ?? state.candidatesCount,
          subjectsCount: counts.subjects ?? state.subjectsCount,
          passedCount: counts.passed ?? state.passedCount,
          failedCount: counts.failed ?? state.failedCount,
        }));
      },

      clearExam: () => {
        set({
          examId: null,
          examName: null,
          examYear: null,
          status: 'draft',
          passingGrade: 10,
          candidatesCount: 0,
          subjectsCount: 0,
          passedCount: 0,
          failedCount: 0,
        });
      },
    }),
    {
      name: 'exam-storage',
    }
  )
);
