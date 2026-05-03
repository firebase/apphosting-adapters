'use client';
import React, { useState, useEffect, createContext, useContext } from 'react';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';
import { FirebaseProvider } from './provider';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { AlertCircle } from 'lucide-react';

// I18N START
const translations = {
  en: {
    appTitle: "WP Content PRO",
    history: "History",
    adminPanel: "Admin Panel",
    logout: "Log out",
    login: "Login",
    welcome: "Welcome to Your Content Studio!",
    loginToContinue: "Please log in to generate content and view your history.",
    footerText: "Content powered by AI. Deployment attempt: Final.",
    historyTitle: "Activity History",
    historyDescription: "These are the recent actions you have taken.",
    historyErrorTitle: "Error loading history",
    historyErrorDescription: "Could not retrieve data. Please try again later.",
    historyEmpty: "No history yet.",
    historyEmptyDescription: "Create or edit a post to see it here.",
    postTypePost: "Post",
    postTypePage: "Page",
    language: "Language",
  },
  es: {
    appTitle: "Estudio de Contenido WP",
    history: "Historial",
    adminPanel: "Panel de Admin",
    logout: "Cerrar sesión",
    login: "Iniciar sesión",
    welcome: "Bienvenido a tu Estudio de Contenido",
    loginToContinue: "Inicia sesión para generar contenido y ver tu historial.",
    footerText: "Contenido impulsado por IA. Intento de despliegue: Final.",
    historyTitle: "Historial de Actividad",
    historyDescription: "Estas son las acciones recientes que has realizado.",
    historyErrorTitle: "Error al cargar el historial",
    historyErrorDescription: "No se pudieron obtener los datos. Por favor, inténtalo de nuevo más tarde.",
    historyEmpty: "Aún no hay historial.",
    historyEmptyDescription: "Crea o edita una publicación para verla aquí.",
    postTypePost: "Entrada",
    postTypePage: "Página",
    language: "Idioma",
  }
};

type Language = 'en' | 'es';
const defaultLanguage: Language = 'es';

type TranslationKey = keyof typeof translations.en;

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState<Language>(defaultLanguage);

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations[defaultLanguage][key] || key;
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
// I18N END

function initializeFirebase() {
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('YOUR_API_KEY')) {
    return null;
  }
  const apps = getApps();
  const app = apps.length ? apps[0] : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  return { app, auth, firestore };
}

interface FirebaseInstances {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

// Add 'unconfigured' to the possible states
type FirebaseState = FirebaseInstances | null | 'unconfigured';

function MissingFirebaseConfig() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl rounded-lg border border-destructive bg-card p-6 shadow-lg">
        <div className="flex flex-col items-center text-center">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-2xl font-bold text-destructive">
            Firebase Not Configured
          </h1>
          <p className="mt-2 text-muted-foreground">
            Your application is missing the required Firebase configuration. Please follow the steps below to fix this.
          </p>
          <div className="mt-6 w-full text-left">
            <h2 className="text-lg font-semibold">Action Required:</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You need to add your Firebase project's credentials to the <code className="font-mono rounded bg-muted px-1 py-0.5 text-primary">.env</code> file at the root of this project.
            </p>
            <div className="mt-4">
                <h3 className="font-semibold">How to get your credentials:</h3>
                <ol className="mt-2 list-decimal space-y-2 pl-6 text-sm text-muted-foreground">
                    <li>Go to the <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">Firebase Console</a>.</li>
                    <li>Select your project (or create a new one).</li>
                    <li>Go to <span className="font-semibold">Project settings</span> (click the ⚙️ icon).</li>
                    <li>In the <span className="font-semibold">"General"</span> tab, scroll down to <span className="font-semibold">"Your apps"</span>.</li>
                    <li>Select your web app, and under <span className="font-semibold">"Firebase SDK snippet"</span>, choose <span className="font-semibold">"Config"</span>.</li>
                    <li>Copy the configuration values and paste them into the corresponding variables in your <code className="font-mono rounded bg-muted px-1 py-0.5 text-primary">.env</code> file.</li>
                </ol>
            </div>
            <div className="mt-6 rounded-md bg-muted p-4">
                <p className="text-sm font-semibold text-foreground">After adding the keys to <code className="font-mono text-primary">.env</code>, you must <span className="font-bold text-destructive">restart the application</span> for the changes to take effect.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [firebase, setFirebase] = useState<FirebaseState>(null);

  useEffect(() => {
    // Firebase should only be initialized on the client.
    const instances = initializeFirebase();
    if (instances) {
        setFirebase(instances);
    } else {
        setFirebase('unconfigured');
    }
  }, []);

  if (firebase === 'unconfigured') {
    return <MissingFirebaseConfig />;
  }

  if (!firebase) {
    // You can show a loader here if you'd like.
    return null;
  }

  return (
    <LanguageProvider>
      <FirebaseProvider
        app={firebase.app}
        auth={firebase.auth}
        firestore={firebase.firestore}
      >
        {children}
        <FirebaseErrorListener />
      </FirebaseProvider>
    </LanguageProvider>
  );
}
