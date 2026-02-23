'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 * Now shows a toast instead of throwing to the error boundary to prevent UI crashes.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      console.error('Firestore permission error:', error.context);
      
      // Use toast instead of state throw to avoid Next.js white-screen
      toast({
        variant: 'destructive',
        title: 'Permission Error',
        description: `Could not load ${error.context?.path || 'data'}. Please refresh or sign in again.`,
        duration: 5000,
      });
    };

    errorEmitter.on('permission-error', handleError);

    // Unsubscribe on unmount to prevent memory leaks.
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null;
}
