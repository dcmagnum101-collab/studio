# Monica AI Hub

This is a NextJS real estate automation platform built in Firebase Studio.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **AI**: Grok (xAI) via `grok-4-latest`
- **Database**: Firestore
- **Styling**: Tailwind CSS + ShadCN UI
- **Data Sources**: Trulia, Realtor.com (RapidAPI), US Census

## 🚀 E2E Sanity Flow Checklist
Follow these steps to validate the core functional chain:
1. [ ] **Sign In**: Open the app and verify you are automatically signed in anonymously (check Firebase Console Users).
2. [ ] **Create Lead**: Use the "Add Lead" button or URL Enrichment tool to create a contact.
3. [ ] **Connect Gmail**: Go to Settings -> Gmail API and click "Connect Google Account". Complete OAuth.
4. [ ] **Generate Intelligence**: Open a Lead Profile and click "Run Analysis" in the AI Nurture Engine.
5. [ ] **Draft Outreach**: Go to Outreach Builder, select your lead, and click "Generate with Grok".
6. [ ] **Send Email**: Click "Send Now" (ensure lead is not unsubscribed).
7. [ ] **Verify Log**: Check the "Gmail Correspondence" section on the Lead Profile to confirm the message was logged.

## Firestore Data Structure
All data is strictly isolated per user following this hierarchy:

- `/users/{userId}`: Root user document
  - `/contacts/{contactId}`: Lead records
    - `/activityLogs/{logId}`: Interaction history
    - `/ai_runs/{runId}`: Auditable AI decision history
  - `/tasks/{taskId}`: Follow-up reminders
  - `/email_quota/{yyyy-mm-dd}`: Daily outreach tracking
  - `/messages/{msgId}`: History of sent communications (Sync Log)
  - `/prospecting_jobs/{id}`: Background enrichment tracking
  - `/trulia_cache/{hash}`: Market data cache

## Security
Firestore rules ensure that users can only access data where the document path matches their `auth.uid`. Critical audit logs (AI runs, Outreach logs) are set to append-only to prevent tampering.
