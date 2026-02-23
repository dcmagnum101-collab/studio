'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // Safely extract context — may be undefined at runtime if not initialized correctly
      const path = error?.context?.path || error?.message || 'unknown path';
      const operation = error?.context?.operation || 'unknown operation';
      
      // Log with explicit string to avoid {} being shown in some console environments
      console.error(`[Firestore Error] Permission denied at [${path}] during [${operation}]`, error);

      toast({
        variant: 'destructive',
        title: 'Security Restriction',
        description: `Could not access ${path}. Please ensure you are signed in correctly.`,
        duration: 6000,
      });
    };

    errorEmitter.on('permission-error', handleError);
    return () => errorEmitter.off('permission-error', handleError);
  }, [toast]);

  return null;
}