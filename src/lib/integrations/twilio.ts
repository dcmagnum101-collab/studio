import twilio from 'twilio'

function getClient() {
  return twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)
}

export async function sendSMSAlert(to: string, message: string): Promise<void> {
  const client = getClient()
  await client.messages.create({
    body: `[PADDA LEGAL ALERT]\n${message}`,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to,
  })
}

export async function sendCriticalVoiceAlert(to: string, message: string): Promise<void> {
  const client = getClient()
  await client.calls.create({
    twiml: `<Response><Say voice="alice">${message}</Say></Response>`,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to,
  })
}

export async function sendMorningBriefingSMS(to: string, summary: string): Promise<void> {
  const client = getClient()
  await client.messages.create({
    body: `[PPL MORNING BRIEFING]\n${summary}`,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to,
  })
}
