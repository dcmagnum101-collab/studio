'use server';
/**
 * @fileOverview Comprehensive lead management service.
 * Handles all Firestore operations for leads including CRUD,
 * follow-up scheduling, status updates, and batch imports.
 */

import { db } from '@/firebase/init';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  deleteDoc, query, where, orderBy, limit, Timestamp,
  writeBatch, serverTimestamp, onSnapshot, addDoc,
  QueryConstraint, startAfter, DocumentSnapshot,
} from 'firebase/firestore';
import type {
  Lead, LeadStatus, LeadPriority, LeadSource
} from '@/lib/lead-types';
import {
  calculateLeadPriority, calculateAIScore,
  getNextFollowUpDate, getNextFollowUpMethod,
} from '@/lib/lead-types';

const LEADS_COLLECTION = 'leads';
const CONTACTS_COLLECTION = 'contacts';
const TASKS_COLLECTION = 'tasks';
const ACTIVITIES_COLLECTION = 'activities';

// ─── Type Helpers ────────────────────────────────────────────────────────────

function toFirestoreDate(date: Date | string | undefined): Timestamp | null {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  return isNaN(d.getTime()) ? null : Timestamp.fromDate(d);
}

function fromFirestore(data: Record<string, unknown>): Lead {
  const result: Record<string, unknown> = { ...data };
  // Convert Timestamps to ISO strings
  for (const key of ['createdAt', 'updatedAt', 'lastContactDate', 'nextFollowUpDate',
    'listingExpiredDate', 'foreclosureFilingDate', 'auctionDate', 'lastSaleDate']) {
    if (result[key] instanceof Timestamp) {
      result[key] = (result[key] as Timestamp).toDate().toISOString();
    }
  }
  return result as unknown as Lead;
}

// ─── Create Lead ─────────────────────────────────────────────────────────────

export async function createLead(leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const priority = calculateLeadPriority(leadData);
  const aiScore = calculateAIScore(leadData);
  const followUpStage = 0;
  const nextFollowUpDate = getNextFollowUpDate(leadData.status, followUpStage);
  const nextFollowUpMethod = getNextFollowUpMethod(leadData.status, followUpStage);

  const docRef = await addDoc(collection(db, LEADS_COLLECTION), {
    ...leadData,
    priority,
    aiScore,
    followUpStage,
    followUpCount: 0,
    touchCount: 0,
    nextFollowUpDate: Timestamp.fromDate(nextFollowUpDate),
    nextFollowUpMethod,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

// ─── Get Lead ────────────────────────────────────────────────────────────────

export async function getLead(id: string): Promise<Lead | null> {
  const snap = await getDoc(doc(db, LEADS_COLLECTION, id));
  if (!snap.exists()) return null;
  return fromFirestore({ id: snap.id, ...snap.data() });
}

// ─── Update Lead ─────────────────────────────────────────────────────────────

export async function updateLead(id: string, updates: Partial<Lead>): Promise<void> {
  const ref = doc(db, LEADS_COLLECTION, id);
  
  // Recalculate derived fields if status changes
  if (updates.status) {
    const current = await getLead(id);
    const merged = { ...current, ...updates } as Lead;
    updates.priority = calculateLeadPriority(merged);
    updates.aiScore = calculateAIScore(merged);
  }
  
  await updateDoc(ref, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// ─── Delete Lead ─────────────────────────────────────────────────────────────

export async function deleteLead(id: string): Promise<void> {
  await deleteDoc(doc(db, LEADS_COLLECTION, id));
}

// ─── Get Leads by Status ─────────────────────────────────────────────────────

export async function getLeadsByStatus(
  status: LeadStatus,
  maxResults = 100
): Promise<Lead[]> {
  const q = query(
    collection(db, LEADS_COLLECTION),
    where('status', '==', status),
    orderBy('aiScore', 'desc'),
    limit(maxResults)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => fromFirestore({ id: d.id, ...d.data() }));
}

// ─── Get All Leads ───────────────────────────────────────────────────────────

export async function getAllLeads(maxResults = 500): Promise<Lead[]> {
  const q = query(
    collection(db, LEADS_COLLECTION),
    orderBy('aiScore', 'desc'),
    limit(maxResults)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => fromFirestore({ id: d.id, ...d.data() }));
}

// ─── Get Hot Leads (Due for Follow-Up) ──────────────────────────────────────

export async function getLeadsDueForFollowUp(maxResults = 50): Promise<Lead[]> {
  const now = Timestamp.now();
  const q = query(
    collection(db, LEADS_COLLECTION),
    where('nextFollowUpDate', '<=', now),
    where('status', 'not-in', ['closed', 'dead']),
    orderBy('nextFollowUpDate', 'asc'),
    orderBy('aiScore', 'desc'),
    limit(maxResults)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => fromFirestore({ id: d.id, ...d.data() }));
}

// ─── Get Leads by Source ─────────────────────────────────────────────────────

export async function getLeadsBySource(
  source: LeadSource,
  maxResults = 100
): Promise<Lead[]> {
  const q = query(
    collection(db, LEADS_COLLECTION),
    where('source', '==', source),
    orderBy('createdAt', 'desc'),
    limit(maxResults)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => fromFirestore({ id: d.id, ...d.data() }));
}

// ─── Get Leads by Priority ───────────────────────────────────────────────────

export async function getHotLeads(maxResults = 50): Promise<Lead[]> {
  const q = query(
    collection(db, LEADS_COLLECTION),
    where('priority', '==', 'hot'),
    where('status', 'not-in', ['closed', 'dead']),
    orderBy('aiScore', 'desc'),
    limit(maxResults)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => fromFirestore({ id: d.id, ...d.data() }));
}

// ─── Pipeline Summary ─────────────────────────────────────────────────────────

export async function getPipelineSummary(): Promise<Record<LeadStatus, number>> {
  const snap = await getDocs(collection(db, LEADS_COLLECTION));
  const counts: Record<string, number> = {};
  snap.docs.forEach(d => {
    const status = d.data().status as LeadStatus;
    counts[status] = (counts[status] || 0) + 1;
  });
  return counts as Record<LeadStatus, number>;
}

// ─── Log Activity / Contact ───────────────────────────────────────────────────

export interface LeadActivity {
  leadId: string;
  type: 'call' | 'sms' | 'email' | 'note' | 'door-knock' | 'meeting' | 'status-change';
  notes: string;
  outcome?: 'connected' | 'voicemail' | 'no-answer' | 'callback-requested' | 'not-interested' | 'interested';
  duration?: number; // seconds (for calls)
  agentId?: string;
  createdAt?: string;
}

export async function logLeadActivity(activity: Omit<LeadActivity, 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, ACTIVITIES_COLLECTION), {
    ...activity,
    createdAt: serverTimestamp(),
  });
  
  // Update lead's last contact date and increment touch count
  await updateDoc(doc(db, LEADS_COLLECTION, activity.leadId), {
    lastContactDate: serverTimestamp(),
    touchCount: await _getAndIncrement(activity.leadId, 'touchCount'),
    updatedAt: serverTimestamp(),
  });
  
  return ref.id;
}

async function _getAndIncrement(leadId: string, field: string): Promise<number> {
  const snap = await getDoc(doc(db, LEADS_COLLECTION, leadId));
  return ((snap.data()?.[field] as number) || 0) + 1;
}

// ─── Advance Follow-Up Stage ─────────────────────────────────────────────────

export async function advanceFollowUpStage(leadId: string): Promise<void> {
  const lead = await getLead(leadId);
  if (!lead) return;
  
  const currentStage = lead.followUpStage || 0;
  const newStage = currentStage + 1;
  const nextDate = getNextFollowUpDate(lead.status, newStage);
  const nextMethod = getNextFollowUpMethod(lead.status, newStage);
  
  await updateDoc(doc(db, LEADS_COLLECTION, leadId), {
    followUpStage: newStage,
    followUpCount: (lead.followUpCount || 0) + 1,
    lastContactDate: serverTimestamp(),
    nextFollowUpDate: Timestamp.fromDate(nextDate),
    nextFollowUpMethod: nextMethod,
    updatedAt: serverTimestamp(),
  });
}

// ─── Search Leads ─────────────────────────────────────────────────────────────

export async function searchLeads(searchQuery: string, maxResults = 50): Promise<Lead[]> {
  // Firestore doesn't support full-text search natively
  // We do a simple prefix search on fullName
  const q = query(
    collection(db, LEADS_COLLECTION),
    where('fullName', '>=', searchQuery),
    where('fullName', '<=', searchQuery + '\uf8ff'),
    limit(maxResults)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => fromFirestore({ id: d.id, ...d.data() }));
}

// ─── Batch Import Leads ───────────────────────────────────────────────────────

export async function batchImportLeads(leads: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<number> {
  const batch = writeBatch(db);
  let count = 0;
  
  for (const leadData of leads) {
    const priority = calculateLeadPriority(leadData);
    const aiScore = calculateAIScore(leadData);
    const followUpStage = 0;
    const nextFollowUpDate = getNextFollowUpDate(leadData.status, followUpStage);
    const nextFollowUpMethod = getNextFollowUpMethod(leadData.status, followUpStage);
    
    const ref = doc(collection(db, LEADS_COLLECTION));
    batch.set(ref, {
      ...leadData,
      priority,
      aiScore,
      followUpStage,
      followUpCount: 0,
      touchCount: 0,
      nextFollowUpDate: Timestamp.fromDate(nextFollowUpDate),
      nextFollowUpMethod,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    count++;
    
    // Firestore batch limit is 500
    if (count % 450 === 0) {
      await batch.commit();
    }
  }
  
  await batch.commit();
  return count;
}

// ─── Upsert Lead (for sync operations) ───────────────────────────────────────

export async function upsertLead(
  lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>,
  dedupeKey: 'address' | 'mlsNumber' | 'phone' = 'address'
): Promise<{ id: string; created: boolean }> {
  // Check if lead already exists
  const existing = await findLeadByField(dedupeKey, lead[dedupeKey] as string);
  
  if (existing) {
    // Update existing lead with fresh data but preserve manual overrides
    await updateDoc(doc(db, LEADS_COLLECTION, existing.id!), {
      ...lead,
      // Preserve manual data
      notes: existing.notes,
      tags: existing.tags,
      assignedTo: existing.assignedTo,
      followUpStage: existing.followUpStage,
      followUpCount: existing.followUpCount,
      touchCount: existing.touchCount,
      priority: existing.priority,
      aiScore: calculateAIScore({ ...existing, ...lead }),
      updatedAt: serverTimestamp(),
    });
    return { id: existing.id!, created: false };
  }
  
  const id = await createLead(lead);
  return { id, created: true };
}

export async function findLeadByField(field: string, value: string): Promise<Lead | null> {
  if (!value) return null;
  const q = query(
    collection(db, LEADS_COLLECTION),
    where(field, '==', value),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return fromFirestore({ id: d.id, ...d.data() });
}

// ─── Get Leads for Map ────────────────────────────────────────────────────────

export async function getLeadsForMap(statusFilter?: LeadStatus[]): Promise<Lead[]> {
  const constraints: QueryConstraint[] = [
    where('lat', '!=', null),
  ];
  
  if (statusFilter && statusFilter.length > 0) {
    constraints.push(where('status', 'in', statusFilter));
  }
  
  constraints.push(orderBy('lat'), orderBy('aiScore', 'desc'), limit(500));
  
  const q = query(collection(db, LEADS_COLLECTION), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => fromFirestore({ id: d.id, ...d.data() }));
}

// ─── Stats Helpers ────────────────────────────────────────────────────────────

export async function getLeadStats(): Promise<{
  total: number;
  hot: number;
  dueToday: number;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  recentlyAdded: number;
}> {
  const snap = await getDocs(collection(db, LEADS_COLLECTION));
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const stats = {
    total: 0,
    hot: 0,
    dueToday: 0,
    byStatus: {} as Record<string, number>,
    bySource: {} as Record<string, number>,
    recentlyAdded: 0,
  };
  
  snap.docs.forEach(d => {
    const data = d.data();
    stats.total++;
    
    if (data.priority === 'hot') stats.hot++;
    
    if (data.nextFollowUpDate) {
      const followUpDate = (data.nextFollowUpDate as Timestamp).toDate();
      if (followUpDate <= now) stats.dueToday++;
    }
    
    stats.byStatus[data.status] = (stats.byStatus[data.status] || 0) + 1;
    stats.bySource[data.source] = (stats.bySource[data.source] || 0) + 1;
    
    if (data.createdAt) {
      const createdDate = (data.createdAt as Timestamp).toDate();
      if (createdDate >= weekAgo) stats.recentlyAdded++;
    }
  });
  
  return stats;
}
