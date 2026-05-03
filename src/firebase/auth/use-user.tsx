'use client';
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, setDoc, getFirestore } from 'firebase/firestore';
import { useFirebaseApp } from '@/firebase/provider';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
}

export const useUser = (): AuthState => {
  const app = useFirebaseApp();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!app) {
      setLoading(false);
      return;
    }
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUser(user);
        setLoading(false);

        if (user) {
          // Sync user profile to Firestore
          const firestore = getFirestore(app);
          const userRef = doc(firestore, 'users', user.uid);
          setDoc(
            userRef,
            {
              displayName: user.displayName,
              email: user.email,
              photoURL: user.photoURL,
            },
            { merge: true }
          );
        }
      },
      (error) => {
        setError(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [app]);

  const signOut = async () => {
    if (app) {
      const auth = getAuth(app);
      await firebaseSignOut(auth);
    }
  };

  return { user, loading, error, signOut };
};
