/**
 * Store Zustand pour les établissements
 * Gère l'état local des établissements avec persistance
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// TYPES
// ============================================

export interface School {
  id: number;
  name: string;
  code: string | null;
  createdAt: Date;
}

interface SchoolsState {
  // Données
  schools: School[];
  isLoading: boolean;
  error: string | null;

  // Actions CRUD
  addSchool: (name: string, code?: string) => School;
  updateSchool: (id: number, data: { name?: string; code?: string }) => void;
  deleteSchool: (id: number) => boolean;
  
  // Getters
  getSchoolById: (id: number) => School | undefined;
  searchSchools: (query: string) => School[];
  
  // Utilitaires
  clearAll: () => void;
  setError: (error: string | null) => void;
}

// Compteur pour générer des IDs uniques
let nextId = 1;

// ============================================
// STORE
// ============================================

export const useSchoolsStore = create<SchoolsState>()(
  persist(
    (set, get) => ({
      schools: [],
      isLoading: false,
      error: null,

      addSchool: (name: string, code?: string) => {
        const newSchool: School = {
          id: nextId++,
          name: name.trim(),
          code: code?.trim() || null,
          createdAt: new Date(),
        };

        set((state) => ({
          schools: [...state.schools, newSchool].sort((a, b) =>
            a.name.localeCompare(b.name)
          ),
          error: null,
        }));

        return newSchool;
      },

      updateSchool: (id: number, data: { name?: string; code?: string }) => {
        set((state) => ({
          schools: state.schools
            .map((school) =>
              school.id === id
                ? {
                    ...school,
                    name: data.name?.trim() ?? school.name,
                    code: data.code?.trim() ?? school.code,
                  }
                : school
            )
            .sort((a, b) => a.name.localeCompare(b.name)),
          error: null,
        }));
      },

      deleteSchool: (id: number) => {
        const { schools } = get();
        const school = schools.find((s) => s.id === id);
        
        if (!school) {
          set({ error: 'Établissement non trouvé' });
          return false;
        }

        // TODO: Vérifier si des élèves sont associés
        set((state) => ({
          schools: state.schools.filter((s) => s.id !== id),
          error: null,
        }));

        return true;
      },

      getSchoolById: (id: number) => {
        return get().schools.find((s) => s.id === id);
      },

      searchSchools: (query: string) => {
        const lowerQuery = query.toLowerCase();
        return get().schools.filter(
          (s) =>
            s.name.toLowerCase().includes(lowerQuery) ||
            s.code?.toLowerCase().includes(lowerQuery)
        );
      },

      clearAll: () => {
        set({ schools: [], error: null });
      },

      setError: (error: string | null) => {
        set({ error });
      },
    }),
    {
      name: 'schools-storage',
      // Restaurer les dates lors du chargement
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Mettre à jour nextId pour éviter les conflits
          const maxId = Math.max(0, ...state.schools.map((s) => s.id));
          nextId = maxId + 1;
          // Convertir les dates string en Date objects
          state.schools = state.schools.map((s) => ({
            ...s,
            createdAt: new Date(s.createdAt),
          }));
        }
      },
    }
  )
);
