'use server';
/**
 * @fileOverview Comprehensive lead management service.
 * Handles all Firestore operations for leads including CRUD,
 * follow-up scheduling, status updates, and batch imports.
 * All operations scoped to users/{userId}/contacts for data isolation.
 */

import { db } from '@/firebase/init';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  deleteDoc, query, where, orderBy, limit, Timestamp,
  writeBatch, serverTimestamp, addDoc,
  QueryConstraint, DocumentSnapshot,
} from 'firebase/firestore';
import type {
  Lead, LeadStatus, LeadPriority, LeadSource
} from '@/lib/lead-types';
import {
  calculateLeadPriority, calculateAIScore,
  getNextFollowUpDate, getNextFollowUpMethod,
} from '@/lib/lead-types';

// Path helpers — all data lives under users/{userId}/contacts
function contactsPath(userId: string) {
  return collection(db, 'users', userId, 'contacts');
}
function contactDocPath(userId: string, id: string) {
  return doc(db, 'users', userId, 'contacts', id);
}
function activitiesPath(userId: string, contactId: string) {
  return collection(db, 'users', userId, 'contacts', contactId, 'activityLogs');
}

// ─── Type Helpers ────────────────────────────────────────────────────────────

function toFirestoreDate(date: Date | string | undefined): Timestamp | null {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  return isNaN(d.getTime()) ? null : Timestamp.fromDate(d);
}

function fromFirestore(data: Record<string, unknown>): Lead {
  const result: Record<string, unknown> = { ...data };
  for (const key of ['createdAt', 'updatedAt', 'lastContactDate', 'nextFollowUpDate',
    'listingExpiredDate', 'foreclosureFilingDate', 'auctionDate', 'lastSaleDate',
    'created_at', 'updated_at']) {
    if (result[key] instanceof Timestamp) {
      result[key] = (result[key] as Timestamp).toDate().toISOString();
    }
  }
  return result as unknown as Lead;
}

// ─── Create Lead ─────────────────────────────────────────────────────────────

export async function createLead(
  userId: string,
  leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const priority = calculateLeadPriority(leadData);
  const aiScore = calculateAIScore(leadData);
  const followUpStage = 0;
  const nextFollowUpDate = getNextFollowUpDate(leadData.status, followUpStage);
  const nextFollowUpMethod = getNextFollowUpMethod(leadData.status, followUpStage);

  const docRef = await addDoc(contactsPath(userId), {
    ...leadData,
    ownerId: userId,
    priority,
    aiScore,
    icpScore: aiScore,
    pipeline_stage: leadData.pipeline_stage || 'new_lead',
    followUpStage,
    followUpCount: 0,
    touchCount: 0,
    nextFollowUpDate: Timestamp.fromDate(nextFollowUpDate),
    nextFollowUpMethod,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return docRef.id;
}

// ─── Get Lead ────────────────────────────────────────────────────────────────

export async function getLead(userId: string, id: string): Promise<Lead | null> {
  const snap = await getDoc(contactDocPath(userId, id));
  if (!snap.exists()) return null;
  return fromFirestore({ id: snap.id, ...snap.data() });
}

// ─── Update Lead ─────────────────────────────────────────────────────────────

export async function updateLead(userId: string, id: string, updates: Partial<Lead>): Promise<void> {
  const ref = contactDocPath(userId, id);
  if (updates.status) {
    const current = await getLead(userId, id);
    const merged = { ...current, ...updates } as Lead;
    updates.priority = calculateLeadPriority(merged);
    updates.aiScore = calculateAIScore(merged);
    updates.icpScore = updates.aiScore;
  }
  await updateDoc(ref, {
    ...updates,
    updated_at: serverTimestamp(),
  });
}

// ─── Delete Lead ─────────────────────────────────────────────────────────────

export async function deleteLead(userId: string, id: string): Promise<void> {
  await deleteDoc(contactDocPath(userId, id));
}

// ─── Get Leads by Status ─────────────────────────────────────────────────────

export async function getLeadsByStatus(
  userId: string,
  status: LeadStatus,
  maxResults = 100
): Promise<Lead[]> {
  const q = query(
    contactsPath(userId),
    where('status', '==', status),
    orderBy('aiScore', 'desc'),
    limit(maxResults)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => fromFirestore({ id: d.id, ...d.data() }));
}

// ─── Get All Leads ───────────────────────────────────────────────────────────

export async function getAllLeads(userId: string, maxResults = 500): Promise<Lead[]> {
  const q = query(
    contactsPath(userId),
    orderBy('icpScore', 'desc'),
    limit(maxResults)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => fromFirestore({ id: d.id, ...d.data() }));
}

// ─── Get Hot Leads (Due for Follow-Up) ──────────────────────────────────────

export async function getLeadsDueForFollowUp(userId: string, maxResults = 50): Promise<Lead[]> {
  const now = Timestamp.now();
  const q = query(
    contactsPath(userId),
    where('nextFollowUpDate', '<=', now),
    where('pipeline_stage', 'not-in', ['closed', 'dnc']),
    orderBy('nextFollowUpDate', 'asc'),
    limit(maxResults)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => fromFirestore({ id: d.id, ...d.data() }));
}

// ─── Get Hot Leads ───────────────────────────────────────────────────────────

export async function getHotLeads(userId: string, maxResults = 50): Promise<Lead[]> {
  const q = query(
    contactsPath(userId),
    where('icpScore', '>=', 80),
    where('pipeline_stage', 'not-in', ['closed', 'dnc']),
    orderBy('icpScore', 'desc'),
    limit(maxResults)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => fromFirestore({ id: d.id, ...d.data() }));
}

// ─── Pipeline Summary ─────────────────────────────────────────────────────────

export async function getPipelineSummary(userId: string): Promise<Record<string, number>> {
  const snap = await getDocs(contactsPath(userId));
  const counts: Record<string, number> = {};
  snap.docs.forEach(d => {
    const stage = d.data().pipeline_stage as string || 'new_lead';
    counts[stage] = (counts[stage] || 0) + 1;
  });
  return counts;
}

// ─── Log Activity ─────────────────────────────────────────────────────────────

export interface LeadActivity {
  contactId: string;
  type: 'call' | 'sms' | 'email' | 'note' | 'door-knock' | 'meeting' | 'status-change';
  notes: string;
  outcome?: 'connected' | 'voicemail' | 'no-answer' | 'callback-requested' | 'not-interested' | 'interested' | 'appointment-set';
  duration?: number;
  agentId?: string;
  createdAt?: string;
}

export async function logLeadActivity(
  userId: string,
  activity: Omit<LeadActivity, 'createdAt'>
): Promise<string> {
  const ref = await addDoc(activitiesPath(userId, activity.contactId), {
    ...activity,
    ownerId: userId,
    date: new Date().toISOString(),
    created_at: serverTimestamp(),
  });

  await updateDoc(contactDocPath(userId, activity.contactId), {
    lastContactDate: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  return ref.id;
}

// ─── Search Leads ─────────────────────────────────────────────────────────────

export async function searchLeads(userId: string, searchQuery: string, maxResults = 50): Promise<Lead[]> {
  const q = query(
    contactsPath(userId),
    where('name', '>=', searchQuery),
    where('name', '<=', searchQuery + '\uf8ff'),
    limit(maxResults)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => fromFirestore({ id: d.id, ...d.data() }));
}

// ─── Batch Import Leads ───────────────────────────────────────────────────────

export async function batchImportLeads(
  userId: string,
  leads: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>[]
): Promise<number> {
  let batch = writeBatch(db);
  let count = 0;
  let batchCount = 0;

  for (const leadData of leads) {
    const priority = calculateLeadPriority(leadData);
    const aiScore = calculateAIScore(leadData);
    const followUpStage = 0;
    const nextFollowUpDate = getNextFollowUpDate(leadData.status, followUpStage);
    const nextFollowUpMethod = getNextFollowUpMethod(leadData.status, followUpStage);

    const ref = doc(contactsPath(userId));
    batch.set(ref, {
      ...leadData,
      ownerId: userId,
      priority,
      aiScore,
      icpScore: aiScore,
      pipeline_stage: leadData.pipeline_stage || 'new_lead',
      followUpStage,
      followUpCount: 0,
      touchCount: 0,
      nextFollowUpDate: Timestamp.fromDate(nextFollowUpDate),
      nextFollowUpMethod,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    count++;
    batchCount++;

    if (batchCount >= 499) {
      await batch.commit();
      batch = writeBatch(db);
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }
  return count;
}

// ─── Find Lead by Field ───────────────────────────────────────────────────────

export async function findLeadByField(
  userId: string,
  field: string,
  value: string
): Promise<Lead | null> {
  if (!value) return null;
  const q = query(contactsPath(userId), where(field, '==', value), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return fromFirestore({ id: d.id, ...d.data() });
}

// ─── Upsert Lead ──────────────────────────────────────────────────────────────

export async function upsertLead(
  userId: string,
  lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>,
  dedupeKey: 'address' | 'phone' = 'phone'
): Promise<{ id: string; created: boolean }> {
  const value = lead[dedupeKey] as string;
  const existing = value ? await findLeadByField(userId, dedupeKey, value) : null;

  if (existing) {
    await updateDoc(contactDocPath(userId, existing.id!), {
      ...lead,
      notes: existing.notes,
      aiScore: calculateAIScore({ ...existing, ...lead }),
      icpScore: calculateAIScore({ ...existing, ...lead }),
      updated_at: serverTimestamp(),
    });
    return { id: existing.id!, created: false };
  }

  const id = await createLead(userId, lead);
  return { id, created: true };
}

// ─── Get Lead Stats ────────────────────────────────────────────────────────────

export async function getLeadStats(userId: string): Promise<{
  total: number;
  hot: number;
  dueToday: number;
  byStage: Record<string, number>;
  recentlyAdded: number;
}> {
  const snap = await getDocs(contactsPath(userId));
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const stats = {
    total: 0,
    hot: 0,
    dueToday: 0,
    byStage: {} as Record<string, number>,
    recentlyAdded: 0,
  };

  snap.docs.forEach(d => {
    const data = d.data();
    stats.total++;
    if ((data.icpScore || data.aiScore || 0) >= 80) stats.hot++;
    if (data.nextFollowUpDate) {
      const followUpDate = (data.nextFollowUpDate as Timestamp).toDate();
      if (followUpDate <= todayEnd) stats.dueToday++;
    }
    const stage = data.pipeline_stage || 'new_lead';
    stats.byStage[stage] = (stats.byStage[stage] || 0) + 1;
    if (data.created_at) {
      const createdDate = (data.created_at as Timestamp).toDate();
      if (createdDate >= weekAgo) stats.recentlyAdded++;
    }
  });

  return stats;
}
