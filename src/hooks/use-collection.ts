import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, Query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useCollection(target: string | Query) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!target) return;
    
    const q = typeof target === 'string' ? query(collection(db, target)) : target;
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Firestore useCollection Error:", err);
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [target]);

  return { data, loading, error };
}
