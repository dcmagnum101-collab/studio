import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY ?? 'placeholder_key_not_set')

export interface EmailResult {
  success: boolean
  id?: string
  error?: string
}

export async function sendEmail({
  to,
  subject,
  react,
  from,
}: {
  to: string | string[]
  subject: string
  react: React.ReactElement
  from?: string
}): Promise<EmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: from ?? process.env.RESEND_FROM_EMAIL ?? 'briefings@paddalaw.ai',
      to: Array.isArray(to) ? to : [to],
      subject,
      react,
    })

    if (error) return { success: false, error: error.message }
    return { success: true, id: data?.id }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function sendAlertEmail({
  to,
  subject,
  react,
}: {
  to: string | string[]
  subject: string
  react: React.ReactElement
}): Promise<EmailResult> {
  return sendEmail({
    to,
    subject,
    react,
    from: process.env.RESEND_ALERT_EMAIL ?? 'alerts@paddalaw.ai',
  })
}

// Import needed for JSX in this file
import React from 'react'
