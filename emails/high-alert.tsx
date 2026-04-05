import * as React from 'react'
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Text,
  Link,
  Hr,
  Font,
  Preview,
} from '@react-email/components'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://padda-legal.vercel.app'
const NAVY = '#0A1628'
const GOLD = '#C9A84C'
const SURFACE = '#111827'
const BORDER = '#1F2937'
const TEXT_PRIMARY = '#F9FAFB'
const TEXT_MUTED = '#9CA3AF'
const DANGER = '#DC2626'
const WARNING = '#D97706'

const SEVERITY_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  CRITICAL: { color: DANGER, bg: '#450A0A', label: 'CRITICAL' },
  HIGH: { color: WARNING, bg: '#431407', label: 'HIGH' },
  MEDIUM: { color: '#CA8A04', bg: '#1C1917', label: 'MEDIUM' },
  LOW: { color: '#6B7280', bg: '#111827', label: 'LOW' },
}

export interface HighAlertEmailProps {
  caseNumber: string
  caseTitle: string
  caseId: string
  clientName: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  flagType: string
  title: string
  description: string
  recommendation: string
  urgency: 'IMMEDIATE' | 'THIS_WEEK' | 'THIS_MONTH'
  triggeredAt: string
}

export default function HighAlertEmail({
  caseNumber,
  caseTitle,
  caseId,
  clientName,
  severity = 'HIGH',
  flagType,
  title,
  description,
  recommendation,
  urgency,
  triggeredAt,
}: HighAlertEmailProps) {
  const style = SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.HIGH

  return (
    <Html lang="en">
      <Head>
        <Font fontFamily="Inter" fallbackFontFamily="Arial" webFont={{ url: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2', format: 'woff2' }} fontWeight={400} fontStyle="normal" />
      </Head>
      <Preview>
        [{severity}] {title} — {caseNumber}
      </Preview>

      <Body style={{ backgroundColor: '#0D1421', fontFamily: 'Inter, Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 560, margin: '0 auto', padding: '24px 0 40px' }}>

          {/* Alert Banner */}
          <div
            style={{
              backgroundColor: style.bg,
              border: `1px solid ${style.color}40`,
              borderLeft: `4px solid ${style.color}`,
              borderRadius: '8px 8px 0 0',
              padding: '14px 20px',
            }}
          >
            <Row>
              <Column>
                <Text style={{ fontSize: 10, fontWeight: 700, color: style.color, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px 0' }}>
                  ⚡ {severity} ALERT — PADDA LEGAL INTELLIGENCE
                </Text>
                <Text style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY, margin: 0, lineHeight: '1.3' }}>
                  {title}
                </Text>
              </Column>
              <Column style={{ textAlign: 'right', width: 80 }}>
                <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, color: style.color, backgroundColor: `${style.color}18`, border: `1px solid ${style.color}40`, borderRadius: 4, padding: '4px 10px', fontFamily: 'DM Mono, monospace' }}>
                  {urgency.replace('_', ' ')}
                </span>
              </Column>
            </Row>
          </div>

          {/* Case Info */}
          <div style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderTop: 'none', padding: '14px 20px' }}>
            <Row>
              <Column>
                <Text style={{ fontSize: 11, color: TEXT_MUTED, margin: '0 0 2px 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Case</Text>
                <Text style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, margin: 0 }}>
                  <Link href={`${APP_URL}/cases/${caseId}`} style={{ color: GOLD, textDecoration: 'none' }}>
                    {caseNumber}
                  </Link>
                  {' '}— {caseTitle}
                </Text>
              </Column>
              <Column style={{ width: 140 }}>
                <Text style={{ fontSize: 11, color: TEXT_MUTED, margin: '0 0 2px 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Client</Text>
                <Text style={{ fontSize: 13, color: TEXT_PRIMARY, margin: 0 }}>{clientName}</Text>
              </Column>
            </Row>
          </div>

          {/* Flag Details */}
          <div style={{ backgroundColor: '#0D1421', padding: '12px 0 0' }}>

            <div style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${style.color}`, borderRadius: 6, padding: '14px 16px', marginBottom: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: 700, color: style.color, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px 0' }}>
                Issue
              </Text>
              <Text style={{ fontSize: 13, color: '#D1D5DB', lineHeight: '1.6', margin: 0 }}>
                {description}
              </Text>
            </div>

            <div style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderLeft: '3px solid #16A34A', borderRadius: 6, padding: '14px 16px', marginBottom: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px 0' }}>
                Recommended Action
              </Text>
              <Text style={{ fontSize: 13, color: '#D1D5DB', lineHeight: '1.6', margin: 0 }}>
                {recommendation}
              </Text>
            </div>

            <div style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '12px 16px', marginBottom: 16 }}>
              <Row>
                <Column>
                  <Text style={{ fontSize: 11, color: TEXT_MUTED, margin: '0 0 1px 0' }}>Flag Type</Text>
                  <Text style={{ fontSize: 12, color: TEXT_PRIMARY, margin: 0, fontFamily: 'DM Mono, monospace' }}>{flagType.replace('_', ' ')}</Text>
                </Column>
                <Column>
                  <Text style={{ fontSize: 11, color: TEXT_MUTED, margin: '0 0 1px 0' }}>Triggered</Text>
                  <Text style={{ fontSize: 12, color: TEXT_PRIMARY, margin: 0, fontFamily: 'DM Mono, monospace' }}>{triggeredAt}</Text>
                </Column>
              </Row>
            </div>

            {/* CTA */}
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Link
                href={`${APP_URL}/cases/${caseId}`}
                style={{ display: 'inline-block', backgroundColor: style.color, color: '#fff', fontWeight: 700, fontSize: 13, padding: '10px 28px', borderRadius: 6, textDecoration: 'none' }}
              >
                Open Case → {caseNumber}
              </Link>
            </div>

            <Hr style={{ borderColor: BORDER, margin: '0 0 12px' }} />
            <Text style={{ fontSize: 10, color: '#4B5563', textAlign: 'center', margin: 0 }}>
              Paul Padda Law · Las Vegas, NV · Padda Legal Intelligence
              <br />
              <Link href={`${APP_URL}/settings`} style={{ color: '#4B5563', textDecoration: 'underline' }}>Manage alerts</Link>
            </Text>
          </div>

        </Container>
      </Body>
    </Html>
  )
}
