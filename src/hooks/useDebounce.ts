import { useState, useEffect } from 'react';

/**
 * useDebounce - Retarde la mise à jour d'une valeur
 * Utile pour les champs de recherche afin d'éviter les re-renders excessifs
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
