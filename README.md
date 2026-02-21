# Monica AI Hub

This is a NextJS real estate automation platform built in Firebase Studio.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **AI**: Grok (xAI) via `grok-4-latest`
- **Database**: Firestore
- **Styling**: Tailwind CSS + ShadCN UI
- **Data Sources**: Trulia, Realtor.com (RapidAPI), US Census

## Firestore Data Structure
All data is strictly isolated per user following this hierarchy:

- `/users/{userId}`: Root user document
  - `/contacts/{contactId}`: Lead records
    - `/activityLogs/{logId}`: Interaction history
  - `/tasks/{taskId}`: Follow-up reminders
  - `/email_quota/{yyyy-mm-dd}`: Daily outreach tracking
  - `/rapidapi_quota/{yyyy-mm}`: Monthly API usage
  - `/ai_usage/{id}`: Grok token consumption logs (Append-only)
  - `/outreach_log/{id}`: History of sent communications (Append-only)
  - `/trulia_cache/{hash}`: Market data cache

## Security
Firestore rules ensure that users can only access data where the document path matches their `auth.uid`. Critical audit logs are set to append-only to prevent tampering.