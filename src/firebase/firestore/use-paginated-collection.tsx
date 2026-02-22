'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  getDocs, 
  Query, 
  limit, 
  startAfter, 
  QueryDocumentSnapshot, 
  DocumentData,
  query
} from 'firebase/firestore';

/**
 * A hook for paginated Firestore fetches.
 * Uses one-shot getDocs to reduce cost and improve performance for large lists.
 */
export function usePaginatedCollection<T = DocumentData>(
  baseQuery: Query<T> | null | undefined,
  pageSize: number = 20
) {
  const [data, setData] = useState<T[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<T> | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadMore = useCallback(async (isInitial = false) => {
    if (!baseQuery || (loading && !isInitial)) return;
    if (!isInitial && !hasMore) return;

    setLoading(true);
    try {
      const q = isInitial 
        ? query(baseQuery, limit(pageSize))
        : query(baseQuery, startAfter(lastDoc), limit(pageSize));

      const snapshot = await getDocs(q);
      const newDocs = snapshot.docs.map(doc => ({ ...doc.data() as T, id: doc.id }));
      
      if (isInitial) {
        setData(newDocs);
      } else {
        setData(prev => [...prev, ...newDocs]);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === pageSize);
    } catch (err: any) {
      console.error("Firestore Pagination Error:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [baseQuery, lastDoc, hasMore, pageSize]);

  useEffect(() => {
    // Reset when the base query changes (e.g. filters/sorting changed)
    setLastDoc(null);
    setHasMore(true);
    loadMore(true);
  }, [baseQuery]);

  return { 
    data, 
    loading, 
    hasMore, 
    loadMore: () => loadMore(false), 
    refresh: () => loadMore(true),
    error 
  };
}
