
'use client';

import { useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAt, 
  endAt,
  Timestamp 
} from 'firebase/firestore';
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  usePaginatedCollection, 
  useMemoFirebase 
} from '@/firebase';

/**
 * Hook for paginated and filtered contact list
 */
export function useContacts(filters?: { 
  status?: string; 
  minScore?: number; 
  source?: string; 
  searchQuery?: string;
}) {
  const { user } = useUser();
  const firestore = useFirestore();

  const contactsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    const baseRef = collection(firestore, 'users', user.uid, 'contacts');
    let q = query(baseRef);

    if (filters?.status && filters.status !== 'all') {
      q = query(q, where('pipeline_stage', '==', filters.status));
    }
    
    if (filters?.source && filters.source !== 'all') {
      q = query(q, where('archagent_source', '==', filters.source));
    }

    if (filters?.minScore) {
      q = query(q, where('icpScore', '>=', filters.minScore));
    }

    if (filters?.searchQuery) {
      const search = filters.searchQuery.toUpperCase();
      q = query(q, orderBy('name'), startAt(search), endAt(search + '\uf8ff'));
    } else {
      q = query(q, orderBy('name', 'asc'));
    }

    return q;
  }, [user, firestore, filters?.status, filters?.source, filters?.minScore, filters?.searchQuery]);

  return usePaginatedCollection(contactsQuery, 25);
}

/**
 * Hook for user tasks
 */
export function useTasks(status?: 'pending' | 'completed') {
  const { user } = useUser();
  const firestore = useFirestore();

  const tasksQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    const baseRef = collection(firestore, 'users', user.uid, 'tasks');
    
    if (status) {
      return query(baseRef, where('status', '==', status), orderBy('due_date', 'asc'));
    }
    
    return query(baseRef, orderBy('due_date', 'asc'));
  }, [user, firestore, status]);

  return useCollection(tasksQuery);
}

/**
 * Hook for a specific contact's activity logs
 */
export function useCallLogs(contactId: string) {
  const { user } = useUser();
  const firestore = useFirestore();

  const logsQuery = useMemoFirebase(() => {
    if (!user || !firestore || !contactId) return null;
    return query(
      collection(firestore, 'users', user.uid, 'contacts', contactId, 'activityLogs'),
      orderBy('date', 'desc')
    );
  }, [user, firestore, contactId]);

  return useCollection(logsQuery);
}

/**
 * Hook for upcoming appointments
 */
export function useAppointments() {
  const { user } = useUser();
  const firestore = useFirestore();

  const apptsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    const today = new Date().toISOString();
    return query(
      collection(firestore, 'users', user.uid, 'appointments'),
      where('date', '>=', today),
      orderBy('date', 'asc')
    );
  }, [user, firestore]);

  return useCollection(apptsQuery);
}

/**
 * Unified hook for conversation history (merges activityLogs and Gmail messages)
 */
export function useConversationHistory(contactId: string) {
  const { user } = useUser();
  const firestore = useFirestore();

  // Fetch Activity Logs
  const { data: activityLogs, isLoading: logsLoading } = useCallLogs(contactId);

  // Fetch Sync'd Messages
  const messagesQuery = useMemoFirebase(() => {
    if (!user || !firestore || !contactId) return null;
    return query(
      collection(firestore, 'users', user.uid, 'messages'),
      where('leadId', '==', contactId),
      orderBy('created_at', 'desc')
    );
  }, [user, firestore, contactId]);

  const { data: messages, isLoading: msgsLoading } = useCollection(messagesQuery);

  const history = useMemo(() => {
    if (!activityLogs && !messages) return [];
    
    const combined = [
      ...(activityLogs || []).map(log => ({
        id: log.id,
        date: log.date,
        type: log.type,
        content: log.summary,
        outcome: log.outcome,
        sentiment: log.sentiment,
        source: 'crm'
      })),
      ...(messages || []).map(msg => ({
        id: msg.id,
        date: msg.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        type: 'email',
        content: msg.body,
        subject: msg.subject,
        outcome: 'delivered',
        sentiment: 'neutral',
        source: 'gmail'
      }))
    ];

    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activityLogs, messages]);

  return {
    data: history,
    isLoading: logsLoading || msgsLoading,
    error: null
  };
}
