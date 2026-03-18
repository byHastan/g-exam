import { useEffect } from 'react';
import { useNavigationStore } from '@/stores/navigationStore';
import type { PageId } from '@/types/navigation';

/**
 * useKeyboardShortcuts - Raccourcis clavier globaux
 * 
 * Ctrl+1..9 : Navigation rapide entre les pages
 * Ctrl+K   : (réservé pour future command palette)
 */

const PAGE_SHORTCUTS: Record<string, PageId> = {
  '1': 'dashboard',
  '2': 'exam-setup',
  '3': 'schools',
  '4': 'students',
  '5': 'subjects',
  '6': 'scores',
  '7': 'rankings',
  '8': 'statistics',
  '9': 'exports',
};

export function useKeyboardShortcuts() {
  const { navigateTo } = useNavigationStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignorer si on est dans un input/textarea/select
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      // Ctrl+chiffre → navigation
      if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        const page = PAGE_SHORTCUTS[e.key];
        if (page) {
          e.preventDefault();
          navigateTo(page);
        }
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [navigateTo]);
}
