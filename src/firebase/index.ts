'use client';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

import {
  useFirebaseApp,
  useFirestore,
  useAuth,
  FirebaseProvider,
} from './provider';
import { FirebaseClientProvider, useLanguage } from './client-provider';
import { useUser } from './auth/use-user';
import { useCollection } from './firestore/use-collection';
import { useDoc } from './firestore/use-doc';

function initializeFirebase() {
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('YOUR_API_KEY')) {
    // Return null instead of throwing an error to prevent app crash
    return null;
  }
  const apps = getApps();
  const app = apps.length ? apps[0] : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  return { app, auth, firestore };
}

export {
  initializeFirebase,
  // Providers
  FirebaseProvider,
  FirebaseClientProvider,
  // Hooks
  useFirebaseApp,
  useFirestore,
  useAuth,
  useUser,
  useCollection,
  useDoc,
  useLanguage,
};
