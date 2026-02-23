'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      const path = error?.context?.path ?? 'unknown';
      const operation = error?.context?.operation ?? 'unknown';
      
      console.warn('Firestore permission error suppressed:', path, operation);

      toast({
        variant: 'destructive',
        title: 'Data Access Error',
        description: `Could not load ${path}. Please refresh.`,
        duration: 4000,
      });
    };

    errorEmitter.on('permission-error', handleError);
    return () => errorEmitter.off('permission-error', handleError);
  }, [toast]);

  // Never throw — never set state — just listen and toast
  return null;
}
