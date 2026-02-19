'use client';

import { 
  addDoc, 
  updateDoc, 
  setDoc, 
  deleteDoc, 
  DocumentReference, 
  CollectionReference,
  UpdateData,
  WithFieldValue,
  DocumentData
} from 'firebase/firestore';

/**
 * Initiates a non-blocking Firestore add operation.
 */
export function addDocumentNonBlocking<T = DocumentData>(ref: CollectionReference<T>, data: WithFieldValue<T>) {
  addDoc(ref, data).catch(err => console.error("Non-blocking add failed:", err));
}

/**
 * Initiates a non-blocking Firestore update operation.
 */
export function updateDocumentNonBlocking<T = DocumentData>(ref: DocumentReference<T>, data: UpdateData<T>) {
  updateDoc(ref, data).catch(err => console.error("Non-blocking update failed:", err));
}

/**
 * Initiates a non-blocking Firestore set operation.
 */
export function setDocumentNonBlocking<T = DocumentData>(ref: DocumentReference<T>, data: WithFieldValue<T>) {
  setDoc(ref, data).catch(err => console.error("Non-blocking set failed:", err));
}

/**
 * Initiates a non-blocking Firestore delete operation.
 */
export function deleteDocumentNonBlocking(ref: DocumentReference) {
  deleteDoc(ref).catch(err => console.error("Non-blocking delete failed:", err));
}
