# **App Name**: Monica AI Hub

## Core Features:

- Contact Scoring: Automatically score seller contacts based on multiple factors to prioritize outreach efforts.
- Smart List Building: Automatically builds call list based on ICP score, excluding DNC and recently contacted leads.
- AI Email Generation: Generates personalized outreach emails using OpenAI based on contact details and seller motivation. Tool decides when to insert these details
- AI SMS Generation: Generates personalized SMS messages using OpenAI to potential sellers including address of potential property and information about free estimate. Tool decides when to insert these details
- Vapi AI Voice Integration: Integrate Vapi.ai for AI-powered voice calls with automated voicemail drops and call logging.
- Post-Call Logging: Automatically logs call details including outcome, next action, and call summary using Vapi and updates contact information.
- Dashboard Analytics: Display key performance indicators (KPIs) and charts to track outreach effectiveness and lead engagement.
- ArchAgent Integration: Receives lead data from ArchAgent via webhook and maps it into Firestore contacts collection, handling duplicates and triggering ICP scoring.
- Vulcan7 Integration: Integrates with Vulcan7 using Zapier or CSV import, mapping lead data to Firestore, handling DNC lists, and adjusting ICP scores based on lead type.
- Lead Sources Dashboard: Displays a card on the dashboard showing lead counts, average scores, and last sync times for each lead source (ArchAgent, Vulcan7, Manual Entry, CSV Import).
- Lead Sources Settings Tab: Adds a 'Lead Sources' tab to the Settings page for configuring ArchAgent (webhook URL, test connection, auto-import) and Vulcan7 (Zapier/CSV selection, DNC sync) integrations.

## Style Guidelines:

- Primary color: Midnight Blue (#1E3A8A) for a professional and trustworthy feel.
- Background color: Light Gray (#F9FAFB), providing a clean and modern backdrop.
- Accent color: Gold (#A88A2A) for highlights and calls to action, emphasizing upscale and luxury.
- Body and headline font: 'Inter', a sans-serif font, offering a modern and readable experience.
- Use clean, minimalist icons to represent different actions and categories.
- Fixed left sidebar navigation with a clean, organized layout.
- Subtle transitions and loading animations for a smooth user experience.