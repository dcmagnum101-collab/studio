import { google } from 'googleapis'
import { addHours } from 'date-fns'

const PRIORITY_COLOR_MAP: Record<string, string> = {
  CRITICAL: '11', // red
  HIGH: '6',      // tangerine/orange
  MEDIUM: '1',    // lavender/blue
  LOW: '8',       // graphite
}

function getCalendarClient() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET
  )
  auth.setCredentials({ refresh_token: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN })
  return google.calendar({ version: 'v3', auth })
}

export function buildCalendarEvent(
  title: string,
  dueDate: Date,
  priority: string,
  caseNumber: string,
  clientName: string,
  caseId: string,
  description?: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://padda-legal.vercel.app'
  return {
    summary: `[PPL] ${title} — ${caseNumber}`,
    description: `Case: ${caseNumber}\nClient: ${clientName}\nPriority: ${priority}${description ? '\n\n' + description : ''}\n\nView case: ${appUrl}/cases/${caseId}`,
    start: {
      dateTime: dueDate.toISOString(),
      timeZone: 'America/Los_Angeles',
    },
    end: {
      dateTime: addHours(dueDate, 1).toISOString(),
      timeZone: 'America/Los_Angeles',
    },
    colorId: PRIORITY_COLOR_MAP[priority] ?? '1',
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 1440 },
        { method: 'popup', minutes: 60 },
      ],
    },
  }
}

export async function createCalendarEvent(event: ReturnType<typeof buildCalendarEvent>): Promise<string | null> {
  try {
    const calendar = getCalendarClient()
    const result = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    })
    return result.data.id ?? null
  } catch (err) {
    console.error('Google Calendar event creation failed:', err)
    return null
  }
}

export async function updateCalendarEvent(eventId: string, event: Partial<ReturnType<typeof buildCalendarEvent>>): Promise<boolean> {
  try {
    const calendar = getCalendarClient()
    await calendar.events.patch({
      calendarId: 'primary',
      eventId,
      requestBody: event,
    })
    return true
  } catch {
    return false
  }
}

export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  try {
    const calendar = getCalendarClient()
    await calendar.events.delete({ calendarId: 'primary', eventId })
    return true
  } catch {
    return false
  }
}

export async function healthCheck(): Promise<boolean> {
  try {
    const calendar = getCalendarClient()
    await calendar.calendarList.list({ maxResults: 1 })
    return true
  } catch {
    return false
  }
}
