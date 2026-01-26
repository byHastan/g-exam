/**
 * Store Zustand pour la sécurité et l'authentification admin
 *
 * Gère l'état d'authentification de l'administrateur
 * pour les opérations sensibles sur la base de données.
 * Gère également le verrouillage de l'application au démarrage.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { verifyAdminPassword } from '@/services/db/admin';

interface SecurityState {
  // État de verrouillage de l'application
  isAppUnlocked: boolean;

  // État d'authentification admin (pour les opérations sensibles)
  isAdminAuthenticated: boolean;

  // Timestamp de la dernière authentification (pour timeout éventuel)
  lastAuthTime: number | null;

  // Actions
  unlockApp: (password: string) => Promise<boolean>;
  lockApp: () => void;
  authenticateAdmin: (password: string) => Promise<boolean>;
  logout: () => void;
  isSessionValid: () => boolean;
}

// Durée de validité de la session admin (30 minutes)
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

export const useSecurityStore = create<SecurityState>()(
  persist(
    (set, get) => ({
      // Valeurs par défaut (application verrouillée au démarrage)
      isAppUnlocked: false,
      isAdminAuthenticated: false,
      lastAuthTime: null,

      /**
       * Déverrouille l'application avec le mot de passe admin
       *
       * @param password - Mot de passe admin à vérifier
       * @returns true si le déverrouillage a réussi
       */
      unlockApp: async (password: string) => {
        const isValid = await verifyAdminPassword(password);

        if (isValid) {
          set({
            isAppUnlocked: true,
          });
        }

        return isValid;
      },

      /**
       * Verrouille l'application
       */
      lockApp: () => {
        set({
          isAppUnlocked: false,
          isAdminAuthenticated: false,
          lastAuthTime: null,
        });
      },

      /**
       * Authentifie l'administrateur avec le mot de passe
       * (pour les opérations sensibles, nécessite que l'app soit déjà déverrouillée)
       *
       * @param password - Mot de passe admin à vérifier
       * @returns true si l'authentification a réussi
       */
      authenticateAdmin: async (password: string) => {
        const isValid = await verifyAdminPassword(password);

        if (isValid) {
          set({
            isAdminAuthenticated: true,
            lastAuthTime: Date.now(),
          });
        }

        return isValid;
      },

      /**
       * Déconnecte l'administrateur (mais ne verrouille pas l'app)
       */
      logout: () => {
        set({
          isAdminAuthenticated: false,
          lastAuthTime: null,
        });
      },

      /**
       * Vérifie si la session admin est encore valide
       * (non expirée selon le timeout)
       *
       * @returns true si la session est valide
       */
      isSessionValid: () => {
        const state = get();

        if (!state.isAdminAuthenticated || !state.lastAuthTime) {
          return false;
        }

        const elapsed = Date.now() - state.lastAuthTime;
        const isValid = elapsed < SESSION_TIMEOUT_MS;

        // Si la session a expiré, déconnecter automatiquement
        if (!isValid) {
          set({
            isAdminAuthenticated: false,
            lastAuthTime: null,
          });
        }

        return isValid;
      },
    }),
    {
      name: 'security-storage',
      // Ne persister que l'état de déverrouillage, pas les autres états sensibles
      partialize: (state) => ({
        isAppUnlocked: state.isAppUnlocked,
      }),
    }
  )
);
