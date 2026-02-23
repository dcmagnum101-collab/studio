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
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

/**
 * Initiates a non-blocking Firestore add operation.
 */
export function addDocumentNonBlocking<T = DocumentData>(ref: CollectionReference<T>, data: WithFieldValue<T>) {
  addDoc(ref, data).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: ref.path,
      operation: 'create',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

/**
 * Initiates a non-blocking Firestore update operation.
 */
export function updateDocumentNonBlocking<T = DocumentData>(ref: DocumentReference<T>, data: UpdateData<T>) {
  updateDoc(ref, data).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: ref.path,
      operation: 'update',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

/**
 * Initiates a non-blocking Firestore set operation with merge.
 */
export function setDocumentNonBlocking<T = DocumentData>(ref: DocumentReference<T>, data: WithFieldValue<T>) {
  setDoc(ref, data, { merge: true }).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: ref.path,
      operation: 'write',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

/**
 * Initiates a non-blocking Firestore delete operation.
 */
export function deleteDocumentNonBlocking(ref: DocumentReference) {
  deleteDoc(ref).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: ref.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}
