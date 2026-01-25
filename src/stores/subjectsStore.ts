/**
 * Store Zustand pour les épreuves/matières
 * Gère l'état local des épreuves avec persistance
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// TYPES
// ============================================

export interface Subject {
  id: number;
  name: string;
  coefficient: number | null;
  maxScore: number;
  createdAt: Date;
}

export interface CreateSubjectInput {
  name: string;
  coefficient?: number;
  maxScore?: number;
}

interface SubjectsState {
  // Données
  subjects: Subject[];
  isLoading: boolean;
  error: string | null;

  // Actions CRUD
  addSubject: (data: CreateSubjectInput) => Subject;
  updateSubject: (id: number, data: Partial<CreateSubjectInput>) => void;
  deleteSubject: (id: number) => boolean;

  // Getters
  getSubjectById: (id: number) => Subject | undefined;
  hasCoefficients: () => boolean;
  getTotalCoefficients: () => number;

  // Utilitaires
  clearAll: () => void;
  setError: (error: string | null) => void;
}

// Compteur pour générer des IDs uniques
let nextId = 1;

// ============================================
// STORE
// ============================================

export const useSubjectsStore = create<SubjectsState>()(
  persist(
    (set, get) => ({
      subjects: [],
      isLoading: false,
      error: null,

      addSubject: (data: CreateSubjectInput) => {
        const newSubject: Subject = {
          id: nextId++,
          name: data.name.trim(),
          coefficient: data.coefficient ?? null,
          maxScore: data.maxScore ?? 20,
          createdAt: new Date(),
        };

        set((state) => ({
          subjects: [...state.subjects, newSubject].sort((a, b) =>
            a.name.localeCompare(b.name)
          ),
          error: null,
        }));

        return newSubject;
      },

      updateSubject: (id: number, data: Partial<CreateSubjectInput>) => {
        set((state) => ({
          subjects: state.subjects
            .map((subject) =>
              subject.id === id
                ? {
                    ...subject,
                    name: data.name?.trim() ?? subject.name,
                    coefficient:
                      data.coefficient !== undefined
                        ? data.coefficient
                        : subject.coefficient,
                    maxScore: data.maxScore ?? subject.maxScore,
                  }
                : subject
            )
            .sort((a, b) => a.name.localeCompare(b.name)),
          error: null,
        }));
      },

      deleteSubject: (id: number) => {
        const { subjects } = get();
        const subject = subjects.find((s) => s.id === id);

        if (!subject) {
          set({ error: 'Épreuve non trouvée' });
          return false;
        }

        // TODO: Vérifier si des notes sont associées

        set((state) => ({
          subjects: state.subjects.filter((s) => s.id !== id),
          error: null,
        }));

        return true;
      },

      getSubjectById: (id: number) => {
        return get().subjects.find((s) => s.id === id);
      },

      hasCoefficients: () => {
        return get().subjects.some(
          (s) => s.coefficient !== null && s.coefficient > 0
        );
      },

      getTotalCoefficients: () => {
        return get().subjects.reduce(
          (sum, s) => sum + (s.coefficient ?? 0),
          0
        );
      },

      clearAll: () => {
        set({ subjects: [], error: null });
      },

      setError: (error: string | null) => {
        set({ error });
      },
    }),
    {
      name: 'subjects-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          const maxId = Math.max(0, ...state.subjects.map((s) => s.id));
          nextId = maxId + 1;
          state.subjects = state.subjects.map((s) => ({
            ...s,
            createdAt: new Date(s.createdAt),
          }));
        }
      },
    }
  )
);
