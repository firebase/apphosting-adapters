'use client';

import React, { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

// This component is a client-side component that listens for Firebase permission errors
// and displays them in a toast notification. This is useful for debugging security rules.
// It should be placed in your root layout or a high-level provider.
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: any) => {
      // Use property checking instead of instanceof for robustness in dev environments
      if (error && error.name === 'FirestorePermissionError' && error.context) {
        const errorContext = {
            message: error.message,
            context: error.context,
        };
        // Use JSON.stringify to ensure the object is fully logged in the console
        console.error('Firestore Permission Error:', JSON.stringify(errorContext, null, 2));

        // In a real app, you might want to log this to a service like Sentry or Bugsnag.
        // For this starter, we'll show a toast in development.
        if (process.env.NODE_ENV === 'development') {
          toast({
            variant: 'destructive',
            title: 'Firestore Permission Denied',
            description: (
              <pre className="mt-2 w-full rounded-md bg-slate-950 p-4">
                <code className="text-white">
                  {JSON.stringify(errorContext, null, 2)}
                </code>
              </pre>
            ),
            duration: 20000,
          });
        }
      } else {
        // Log a generic error if the emitted object is not what we expect
        console.error('An unknown permission error occurred:', error);
        if (process.env.NODE_ENV === 'development') {
          toast({
            variant: 'destructive',
            title: 'Unknown Permission Error',
            description: 'Check the browser console for more details.',
            duration: 20000,
          });
        }
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null; // This component doesn't render anything
}
