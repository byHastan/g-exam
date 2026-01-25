/**
 * Store Zustand pour l'examen actif
 * Gère les informations de l'examen en cours
 */

import { create } from 'zustand';

// Statut de l'examen
export type ExamStatus = 'draft' | 'locked';

interface ExamState {
  // Informations de l'examen actif
  examName: string | null;
  examYear: number | null;
  status: ExamStatus;
  passingGrade: number; // Seuil de réussite (ex: 10/20)
  
  // Compteurs pour le dashboard (seront connectés à la DB plus tard)
  candidatesCount: number;
  subjectsCount: number;
  passedCount: number;
  failedCount: number;
  
  // Actions
  setExam: (name: string, year: number) => void;
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

export const useExamStore = create<ExamState>((set) => ({
  // Valeurs par défaut (pas d'examen actif)
  examName: null,
  examYear: null,
  status: 'draft',
  passingGrade: 10,
  
  candidatesCount: 0,
  subjectsCount: 0,
  passedCount: 0,
  failedCount: 0,

  setExam: (name: string, year: number) => {
    set({
      examName: name,
      examYear: year,
      status: 'draft',
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
      examName: null,
      examYear: null,
      status: 'draft',
      candidatesCount: 0,
      subjectsCount: 0,
      passedCount: 0,
      failedCount: 0,
    });
  },
}));
