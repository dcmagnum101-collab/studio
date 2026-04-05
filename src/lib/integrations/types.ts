export interface Integration {
  name: string
  sync(): Promise<SyncResult>
  healthCheck(): Promise<boolean>
}

export interface SyncResult {
  success: boolean
  recordsSynced: number
  errors: string[]
  timestamp: Date
}
