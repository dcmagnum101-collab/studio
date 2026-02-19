import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useDocument(collectionName: string, docId: string) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!docId || !collectionName) return;
    const ref = doc(db, collectionName, docId);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        setData(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore useDocument Error:", err);
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [collectionName, docId]);

  return { data, loading, error };
}
