import * as React from 'react'
import {
  Html, Head, Body, Container, Section, Row, Column,
  Text, Link, Hr, Font, Preview,
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

export interface SolWarningCase {
  caseId: string
  caseNumber: string
  title: string
  clientName: string
  daysLeft: number
  solDate: string
  stage: string
  estimatedValue?: number
}

export interface SolWarningEmailProps {
  cases: SolWarningCase[]
  generatedAt: string
}

function DaysChip({ daysLeft }: { daysLeft: number }) {
  const color = daysLeft <= 3 ? DANGER : daysLeft <= 7 ? '#EF4444' : WARNING
  const bg = daysLeft <= 3 ? '#450A0A' : daysLeft <= 7 ? '#450A0A' : '#431407'
  return (
    <div style={{ textAlign: 'center', backgroundColor: bg, border: `2px solid ${color}40`, borderRadius: 8, padding: '10px 16px', minWidth: 80 }}>
      <Text style={{ fontSize: 28, fontWeight: 900, color, margin: 0, fontFamily: 'DM Mono, monospace', lineHeight: 1 }}>
        {daysLeft}
      </Text>
      <Text style={{ fontSize: 10, color, margin: '3px 0 0 0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        DAYS
      </Text>
    </div>
  )
}

export default function SolWarningEmail({ cases = [], generatedAt }: SolWarningEmailProps) {
  const critical = cases.filter(c => c.daysLeft <= 7)
  const urgent = cases.filter(c => c.daysLeft > 7 && c.daysLeft <= 14)
  const warning = cases.filter(c => c.daysLeft > 14)

  return (
    <Html lang="en">
      <Head>
        <Font fontFamily="Inter" fallbackFontFamily="Arial" webFont={{ url: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2', format: 'woff2' }} fontWeight={400} fontStyle="normal" />
      </Head>
      <Preview>
        ⚠️ SOL Alert: {cases.length} case{cases.length > 1 ? 's' : ''} require immediate attention
        {critical.length > 0 ? ` — ${critical.length} CRITICAL` : ''}
      </Preview>

      <Body style={{ backgroundColor: '#0D1421', fontFamily: 'Inter, Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 580, margin: '0 auto', padding: '24px 0 40px' }}>

          {/* Header */}
          <div style={{ backgroundColor: '#450A0A', border: `1px solid ${DANGER}40`, borderLeft: `4px solid ${DANGER}`, borderRadius: '8px 8px 0 0', padding: '16px 20px' }}>
            <Row>
              <Column style={{ width: 44 }}>
                <div style={{ width: 36, height: 36, backgroundColor: GOLD, borderRadius: 6, fontSize: 12, fontWeight: 900, color: NAVY, textAlign: 'center', lineHeight: '36px', fontFamily: 'Inter, sans-serif' }}>
                  PPL
                </div>
              </Column>
              <Column>
                <Text style={{ fontSize: 11, fontWeight: 700, color: DANGER, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 2px 0' }}>
                  ⚠️ STATUTE OF LIMITATIONS ALERT
                </Text>
                <Text style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY, margin: 0 }}>
                  {cases.length} Active Case{cases.length > 1 ? 's' : ''} Near Deadline
                </Text>
              </Column>
            </Row>
          </div>

          <div style={{ backgroundColor: '#0D1421', padding: '16px 0 0' }}>
            {[
              { group: critical, borderColor: DANGER, label: '🔴 CRITICAL — 7 Days or Less' },
              { group: urgent, borderColor: WARNING, label: '🟠 URGENT — 8–14 Days' },
              { group: warning, borderColor: '#CA8A04', label: '🟡 WARNING — 15–30 Days' },
            ]
              .filter(g => g.group.length > 0)
              .map(({ group, borderColor, label }) => (
                <div key={label} style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${borderColor}`, borderRadius: 6, padding: '14px 16px', marginBottom: 12 }}>
                  <Text style={{ fontSize: 11, fontWeight: 700, color: borderColor, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px 0' }}>
                    {label}
                  </Text>
                  {group.map((c, i) => (
                    <div
                      key={c.caseId}
                      style={{
                        padding: '10px 0',
                        borderBottom: i < group.length - 1 ? `1px solid ${BORDER}` : 'none',
                      }}
                    >
                      <Row>
                        <Column>
                          <Text style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, margin: '0 0 2px 0' }}>
                            <Link href={`${APP_URL}/cases/${c.caseId}`} style={{ color: GOLD, textDecoration: 'none' }}>
                              {c.caseNumber}
                            </Link>
                            {' '}— {c.title}
                          </Text>
                          <Text style={{ fontSize: 11, color: TEXT_MUTED, margin: '0 0 2px 0' }}>
                            Client: {c.clientName} · Stage: {c.stage}
                          </Text>
                          <Text style={{ fontSize: 11, color: TEXT_MUTED, margin: 0, fontFamily: 'DM Mono, monospace' }}>
                            SOL: {c.solDate}
                            {c.estimatedValue && (
                              <span style={{ marginLeft: 12, color: GOLD }}>
                                Est. ${c.estimatedValue.toLocaleString()}
                              </span>
                            )}
                          </Text>
                        </Column>
                        <Column style={{ width: 96, textAlign: 'right' }}>
                          <DaysChip daysLeft={c.daysLeft} />
                        </Column>
                      </Row>
                    </div>
                  ))}
                </div>
              ))}

            <div style={{ textAlign: 'center', marginBottom: 16, marginTop: 4 }}>
              <Link
                href={`${APP_URL}/cases?filter=sol`}
                style={{ display: 'inline-block', backgroundColor: DANGER, color: '#fff', fontWeight: 700, fontSize: 13, padding: '10px 28px', borderRadius: 6, textDecoration: 'none' }}
              >
                View All SOL Cases →
              </Link>
            </div>

            <Hr style={{ borderColor: BORDER, margin: '0 0 12px' }} />
            <Text style={{ fontSize: 10, color: '#4B5563', textAlign: 'center', margin: 0 }}>
              Generated: {generatedAt} · Paul Padda Law · Padda Legal Intelligence
            </Text>
          </div>

        </Container>
      </Body>
    </Html>
  )
}
