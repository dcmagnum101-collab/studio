'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // Safely extract context — may be undefined at runtime
      const path = error?.context?.path ?? error?.message ?? 'unknown path';
      const operation = error?.context?.operation ?? 'unknown operation';
      
      console.error('Firestore permission error:', { path, operation, error });

      toast({
        variant: 'destructive',
        title: 'Permission Error',
        description: `Could not load data (${path}). Please refresh or sign in again.`,
        duration: 5000,
      });
    };

    errorEmitter.on('permission-error', handleError);
    return () => errorEmitter.off('permission-error', handleError);
  }, [toast]);

  return null;
}
