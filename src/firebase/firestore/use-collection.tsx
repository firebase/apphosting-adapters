'use client';
import { useState, useEffect } from 'react';
import {
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAt,
  startAfter,
  endAt,
  endBefore,
  doc,
  getDoc,
  getDocs,
  Query,
  DocumentData,
  CollectionReference,
  FirestoreError,
} from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export interface UseCollectionOptions {
  // Define any options here, e.g., for pagination, filtering
}

export const useCollection = <T extends DocumentData>(
  query: Query<T> | CollectionReference<T> | null,
  options: UseCollectionOptions = {}
) => {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (query === null) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);

    const unsubscribe = onSnapshot(
      query,
      (querySnapshot) => {
        const result: T[] = [];
        querySnapshot.forEach((doc) => {
          result.push({ id: doc.id, ...doc.data() } as T);
        });
        setData(result);
        setLoading(false);
      },
      (err: FirestoreError) => {
        setError(err);
        setLoading(false);
        
        let path: string | undefined = undefined;
        if (query) {
          // For a simple CollectionReference, the path is directly available.
          if ('path' in query && typeof (query as any).path === 'string') {
            path = (query as any).path;
          } 
          // For complex queries (with where, orderBy), we access an internal property.
          // This is not ideal but necessary for good debugging, as Firestore
          // does not expose the path on the public Query API.
          else if ((query as any)._query?.path) {
            path = (query as any)._query.path.toString();
          }
        }

        const permissionError = new FirestorePermissionError({
            path: path,
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [query]);

  return { data, loading, error };
};
