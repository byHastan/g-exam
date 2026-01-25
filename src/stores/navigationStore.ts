/**
 * Store Zustand pour la navigation
 * Gère la page active et l'état de navigation
 */

import { create } from 'zustand';
import type { PageId } from '@/types/navigation';

interface NavigationState {
  // Page actuellement affichée
  currentPage: PageId;
  
  // Historique de navigation (pour un éventuel bouton retour)
  history: PageId[];
  
  // Actions
  navigateTo: (page: PageId) => void;
  goBack: () => void;
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  currentPage: 'dashboard',
  history: [],

  navigateTo: (page: PageId) => {
    const { currentPage, history } = get();
    
    // Ne rien faire si on navigue vers la même page
    if (page === currentPage) return;
    
    set({
      currentPage: page,
      history: [...history, currentPage],
    });
  },

  goBack: () => {
    const { history } = get();
    
    if (history.length === 0) return;
    
    const newHistory = [...history];
    const previousPage = newHistory.pop();
    
    if (previousPage) {
      set({
        currentPage: previousPage,
        history: newHistory,
      });
    }
  },
}));
