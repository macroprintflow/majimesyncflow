"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, Query } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

export function useCollection<T>(collectionPath: string, q?: Query<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const ref = q || query(collection(db, collectionPath));
    
    const unsubscribe = onSnapshot(
      ref, 
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
        setData(docs);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionPath]);

  return { data, loading, error };
}
