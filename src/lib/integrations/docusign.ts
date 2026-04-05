const DS_BASE_URL = 'https://na4.docusign.net/restapi/v2.1'

function getHeaders() {
  return {
    Authorization: `Bearer ${process.env.DOCUSIGN_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  }
}

export interface Signer {
  name: string
  email: string
  recipientId: string
}

export async function sendForSignature(
  documentUrl: string,
  documentName: string,
  signers: Signer[],
  emailSubject: string
): Promise<{ envelopeId: string; signingUrl?: string } | null> {
  try {
    // Fetch document
    const docRes = await fetch(documentUrl)
    const docBuffer = await docRes.arrayBuffer()
    const docBase64 = Buffer.from(docBuffer).toString('base64')

    const envelope = {
      emailSubject,
      status: 'sent',
      documents: [
        {
          documentBase64: docBase64,
          name: documentName,
          fileExtension: documentName.split('.').pop() ?? 'pdf',
          documentId: '1',
        },
      ],
      recipients: {
        signers: signers.map(s => ({
          email: s.email,
          name: s.name,
          recipientId: s.recipientId,
          tabs: {
            signHereTabs: [
              {
                anchorString: '/sig/',
                anchorUnits: 'pixels',
                anchorYOffset: '10',
              },
            ],
          },
        })),
      },
    }

    const res = await fetch(
      `${DS_BASE_URL}/accounts/${process.env.DOCUSIGN_ACCOUNT_ID}/envelopes`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(envelope),
      }
    )

    if (!res.ok) throw new Error(`DocuSign error: ${res.status}`)
    const data = (await res.json()) as { envelopeId: string }
    return { envelopeId: data.envelopeId }
  } catch (err) {
    console.error('DocuSign send failed:', err)
    return null
  }
}

export async function getEnvelopeStatus(envelopeId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${DS_BASE_URL}/accounts/${process.env.DOCUSIGN_ACCOUNT_ID}/envelopes/${envelopeId}`,
      { headers: getHeaders() }
    )
    if (!res.ok) return null
    const data = (await res.json()) as { status: string }
    return data.status
  } catch {
    return null
  }
}

export async function getTemplates(): Promise<Array<{ templateId: string; name: string }>> {
  try {
    const res = await fetch(
      `${DS_BASE_URL}/accounts/${process.env.DOCUSIGN_ACCOUNT_ID}/templates`,
      { headers: getHeaders() }
    )
    if (!res.ok) return []
    const data = (await res.json()) as {
      envelopeTemplates: Array<{ templateId: string; name: string }>
    }
    return data.envelopeTemplates ?? []
  } catch {
    return []
  }
}
