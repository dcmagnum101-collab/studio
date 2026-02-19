'use client';

import { useRef } from 'react';

/**
 * A specialized useMemo for Firebase objects (Query, DocumentReference).
 * It prevents unnecessary re-renders when the dependency array values haven't changed,
 * even if the factory function returns a new object instance (which Firebase SDK often does).
 */
export function useMemoFirebase<T>(factory: () => T, deps: any[]): T {
  const ref = useRef<T | null>(null);
  const prevDeps = useRef<any[]>([]);

  const changed = deps.length !== prevDeps.current.length || deps.some((dep, i) => dep !== prevDeps.current[i]);

  if (changed || ref.current === null) {
    ref.current = factory();
    prevDeps.current = deps;
  }

  return ref.current as T;
}
