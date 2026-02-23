'use client';

export interface SecurityRuleContext {
  path: string;
  operation: string;
  requestResourceData?: any;
}

export class FirestorePermissionError extends Error {
  context: SecurityRuleContext;
  
  constructor(context: SecurityRuleContext) {
    const message = `FirestorePermissionError: Missing or insufficient permissions at [${context.path}] during [${context.operation}] operation.`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context; // Assigned explicitly to ensure diagnostic data is available
  }
}