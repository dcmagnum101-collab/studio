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
  Tailwind,
} from '@react-email/components'
import type { NightlyReportData } from '../src/lib/communications/nightly-report'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://padda-legal.vercel.app'

const NAVY = '#0A1628'
const GOLD = '#C9A84C'
const SURFACE = '#111827'
const BORDER = '#1F2937'
const TEXT_PRIMARY = '#F9FAFB'
const TEXT_MUTED = '#9CA3AF'
const DANGER = '#DC2626'
const SUCCESS = '#16A34A'
const WARNING = '#D97706'
const INFO = '#2563EB'
const PURPLE = '#7C3AED'

function SectionCard({
  title,
  borderColor,
  children,
  count,
}: {
  title: string
  borderColor: string
  children: React.ReactNode
  count?: number
}) {
  return (
    <div
      style={{
        backgroundColor: SURFACE,
        border: `1px solid ${BORDER}`,
        borderLeft: `3px solid ${borderColor}`,
        borderRadius: 6,
        padding: '14px 16px',
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Text
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: borderColor,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            margin: 0,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {title}
        </Text>
        {count !== undefined && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: borderColor,
              backgroundColor: `${borderColor}18`,
              borderRadius: 10,
              padding: '1px 7px',
              fontFamily: 'DM Mono, monospace',
            }}
          >
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

function StatCell({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <Column style={{ textAlign: 'center', padding: '0 6px' }}>
      <Text
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: color ?? GOLD,
          margin: '0 0 3px 0',
          fontFamily: 'DM Mono, monospace',
        }}
      >
        {value}
      </Text>
      <Text style={{ fontSize: 10, color: TEXT_MUTED, margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </Text>
    </Column>
  )
}

function StageArrow({ from, to }: { from: string; to: string }) {
  const STAGE_LABEL: Record<string, string> = {
    INTAKE: 'Intake',
    INVESTIGATION: 'Investigation',
    DEMAND: 'Demand',
    NEGOTIATION: 'Negotiation',
    LITIGATION: 'Litigation',
    TRIAL: 'Trial',
    SETTLEMENT: 'Settlement',
    CLOSED: 'Closed',
  }
  return (
    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: TEXT_MUTED }}>
      <span style={{ color: '#6B7280' }}>{STAGE_LABEL[from] ?? from}</span>
      <span style={{ color: '#4B5563', margin: '0 4px' }}>→</span>
      <span style={{ color: SUCCESS }}>{STAGE_LABEL[to] ?? to}</span>
    </span>
  )
}

export interface NightlyReportEmailProps {
  data: NightlyReportData
  narrative: string
}

export default function NightlyReportEmail({ data, narrative }: NightlyReportEmailProps) {
  const hasActivity =
    data.completedTasks.length > 0 ||
    data.stageChanges.length > 0 ||
    data.newDocuments.length > 0 ||
    data.timeEntries.count > 0

  return (
    <Html lang="en">
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Arial"
          webFont={{
            url: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>
        Nightly Report — {data.date} · {data.completedTasks.length} tasks completed
        {data.timeEntries.dailyRevenue > 0
          ? ` · $${Math.round(data.timeEntries.dailyRevenue / 1000)}k billed`
          : ''}
        {data.solWarnings.length > 0 ? ` · ⚠️ ${data.solWarnings.length} SOL` : ''}
      </Preview>

      <Tailwind>
        <Body style={{ backgroundColor: '#0D1421', fontFamily: 'Inter, Arial, sans-serif', margin: 0, padding: 0 }}>
          <Container style={{ maxWidth: 600, margin: '0 auto', padding: '20px 0 40px' }}>

            {/* Header */}
            <Section
              style={{
                backgroundColor: NAVY,
                borderRadius: '8px 8px 0 0',
                padding: '20px 24px 16px',
                borderBottom: `2px solid ${GOLD}`,
              }}
            >
              <Row>
                <Column style={{ width: 44 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      backgroundColor: GOLD,
                      borderRadius: 6,
                      fontSize: 14,
                      fontWeight: 900,
                      color: NAVY,
                      fontFamily: 'Inter, sans-serif',
                      textAlign: 'center',
                      lineHeight: '36px',
                    }}
                  >
                    PPL
                  </div>
                </Column>
                <Column>
                  <Text style={{ fontSize: 13, fontWeight: 700, color: GOLD, margin: 0, letterSpacing: '0.05em' }}>
                    PAUL PADDA LAW
                  </Text>
                  <Text style={{ fontSize: 11, color: TEXT_MUTED, margin: '2px 0 0 0' }}>
                    Nightly Intelligence Report
                  </Text>
                </Column>
                <Column style={{ textAlign: 'right' }}>
                  <Text style={{ fontSize: 11, color: '#4B5563', margin: 0, fontFamily: 'DM Mono, monospace' }}>
                    END OF DAY
                  </Text>
                  <Text style={{ fontSize: 11, color: TEXT_MUTED, margin: '2px 0 0 0', fontFamily: 'DM Mono, monospace' }}>
                    {data.date.split(',')[0]}
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* Greeting */}
            <Section style={{ backgroundColor: NAVY, padding: '16px 24px 14px' }}>
              <Text style={{ fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY, margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
                End of Day Summary
              </Text>
              <Text style={{ fontSize: 12, color: TEXT_MUTED, margin: 0, fontFamily: 'DM Mono, monospace' }}>
                {data.date}
              </Text>
            </Section>

            {/* Narrative */}
            {narrative && (
              <Section style={{ backgroundColor: SURFACE, borderLeft: `3px solid ${GOLD}30`, padding: '14px 20px' }}>
                <Text style={{ fontSize: 13, lineHeight: '1.65', color: '#D1D5DB', margin: 0, whiteSpace: 'pre-line' }}>
                  {narrative}
                </Text>
              </Section>
            )}

            <Section style={{ backgroundColor: '#0D1421', padding: '16px 12px 0' }}>

              {/* Today's Stats */}
              <SectionCard title="📊 Today's Activity" borderColor={GOLD}>
                <Row>
                  <StatCell label="Tasks Done" value={data.completedTasks.length} color={SUCCESS} />
                  <StatCell label="Hrs Billed" value={data.timeEntries.billableHours.toFixed(1)} />
                  <StatCell
                    label="Revenue"
                    value={`$${Math.round(data.timeEntries.dailyRevenue / 1000)}k`}
                    color={GOLD}
                  />
                  <StatCell label="New Docs" value={data.newDocuments.length} color={INFO} />
                  <StatCell label="Stage Moves" value={data.stageChanges.length} color={PURPLE} />
                </Row>
              </SectionCard>

              {/* Stage Changes */}
              {data.stageChanges.length > 0 && (
                <SectionCard title="🔄 Pipeline Movement" borderColor={PURPLE} count={data.stageChanges.length}>
                  {data.stageChanges.map((s, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '6px 0',
                        borderBottom: i < data.stageChanges.length - 1 ? `1px solid ${BORDER}` : 'none',
                      }}
                    >
                      <Text style={{ fontSize: 12, color: TEXT_PRIMARY, margin: '0 0 2px 0' }}>
                        <Link href={`${APP_URL}/cases/${s.caseId}`} style={{ color: TEXT_PRIMARY, textDecoration: 'none' }}>
                          {s.caseNumber} — {s.title}
                        </Link>
                      </Text>
                      <StageArrow from={s.fromStage} to={s.toStage} />
                    </div>
                  ))}
                </SectionCard>
              )}

              {/* Completed Tasks */}
              {data.completedTasks.length > 0 && (
                <SectionCard title="✅ Completed Tasks" borderColor={SUCCESS} count={data.completedTasks.length}>
                  {data.completedTasks.slice(0, 8).map((t, i) => (
                    <Text key={i} style={{ fontSize: 12, color: TEXT_PRIMARY, margin: '0 0 5px 0' }}>
                      <span style={{ color: SUCCESS, marginRight: 6 }}>✓</span>
                      {t.caseId ? (
                        <Link href={`${APP_URL}/cases/${t.caseId}`} style={{ color: TEXT_PRIMARY, textDecoration: 'none' }}>
                          {t.title}
                        </Link>
                      ) : t.title}
                      {t.caseNumber && (
                        <span style={{ color: TEXT_MUTED, fontSize: 10, marginLeft: 6 }}>{t.caseNumber}</span>
                      )}
                    </Text>
                  ))}
                  {data.completedTasks.length > 8 && (
                    <Text style={{ fontSize: 11, color: TEXT_MUTED, margin: '4px 0 0 0' }}>
                      +{data.completedTasks.length - 8} more completed
                    </Text>
                  )}
                </SectionCard>
              )}

              {/* Time by Case */}
              {data.timeEntries.byCase.length > 0 && (
                <SectionCard title="⏱ Billable Time by Case" borderColor={GOLD}>
                  {data.timeEntries.byCase.map((entry, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '5px 0',
                        borderBottom: i < data.timeEntries.byCase.length - 1 ? `1px solid ${BORDER}` : 'none',
                      }}
                    >
                      <Text style={{ fontSize: 12, color: TEXT_MUTED, margin: 0, fontFamily: 'DM Mono, monospace' }}>
                        {entry.caseNumber}
                      </Text>
                      <Text style={{ fontSize: 12, color: GOLD, margin: 0, fontFamily: 'DM Mono, monospace' }}>
                        {entry.hours.toFixed(1)}h · ${Math.round(entry.amount).toLocaleString()}
                      </Text>
                    </div>
                  ))}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      paddingTop: 8,
                      marginTop: 4,
                      borderTop: `1px solid ${BORDER}`,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: 700, color: TEXT_PRIMARY, margin: 0 }}>
                      Daily Total
                    </Text>
                    <Text style={{ fontSize: 12, fontWeight: 700, color: GOLD, margin: 0, fontFamily: 'DM Mono, monospace' }}>
                      {data.timeEntries.billableHours.toFixed(1)}h · ${Math.round(data.timeEntries.dailyRevenue).toLocaleString()}
                    </Text>
                  </div>
                </SectionCard>
              )}

              {/* Audit Activity */}
              <SectionCard title="🔍 Audit Activity" borderColor={data.auditActivity.criticalOpen > 0 ? DANGER : INFO}>
                <Row>
                  <StatCell label="Resolved" value={data.auditActivity.resolved} color={SUCCESS} />
                  <StatCell label="New Flags" value={data.auditActivity.newFlags} color={WARNING} />
                  <StatCell
                    label="Critical Open"
                    value={data.auditActivity.criticalOpen}
                    color={data.auditActivity.criticalOpen > 0 ? DANGER : TEXT_MUTED}
                  />
                </Row>
              </SectionCard>

              {/* Tomorrow's Deadlines */}
              {data.tomorrowDeadlines.length > 0 && (
                <SectionCard title="📅 Tomorrow's Deadlines" borderColor={INFO} count={data.tomorrowDeadlines.length}>
                  {data.tomorrowDeadlines.map((t, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '5px 0',
                        borderBottom: i < data.tomorrowDeadlines.length - 1 ? `1px solid ${BORDER}` : 'none',
                      }}
                    >
                      <div>
                        <Text style={{ fontSize: 12, color: TEXT_PRIMARY, margin: '0 0 1px 0' }}>
                          {t.caseId ? (
                            <Link href={`${APP_URL}/cases/${t.caseId}`} style={{ color: TEXT_PRIMARY, textDecoration: 'none' }}>
                              {t.title}
                            </Link>
                          ) : t.title}
                        </Text>
                        {t.caseNumber && (
                          <Text style={{ fontSize: 10, color: TEXT_MUTED, margin: 0 }}>{t.caseNumber}</Text>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color:
                            t.priority === 'CRITICAL'
                              ? DANGER
                              : t.priority === 'HIGH'
                              ? WARNING
                              : INFO,
                          backgroundColor:
                            t.priority === 'CRITICAL'
                              ? '#450A0A'
                              : t.priority === 'HIGH'
                              ? '#431407'
                              : '#1E3A5F',
                          padding: '2px 7px',
                          borderRadius: 4,
                          fontFamily: 'DM Mono, monospace',
                        }}
                      >
                        {t.priority}
                      </span>
                    </div>
                  ))}
                </SectionCard>
              )}

              {/* SOL Warnings */}
              {data.solWarnings.length > 0 && (
                <SectionCard title="⚠️ SOL Critical (<7 days)" borderColor={DANGER}>
                  {data.solWarnings.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '5px 0',
                        borderBottom: i < data.solWarnings.length - 1 ? `1px solid ${BORDER}` : 'none',
                      }}
                    >
                      <Text style={{ fontSize: 12, color: TEXT_PRIMARY, margin: 0 }}>
                        <Link href={`${APP_URL}/cases/${c.caseId}`} style={{ color: TEXT_PRIMARY, textDecoration: 'none' }}>
                          {c.caseNumber} — {c.title}
                        </Link>
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: DANGER,
                          margin: 0,
                          fontFamily: 'DM Mono, monospace',
                        }}
                      >
                        {c.daysLeft}d
                      </Text>
                    </div>
                  ))}
                </SectionCard>
              )}

            </Section>

            {/* Footer CTA */}
            <Section style={{ backgroundColor: '#0D1421', padding: '12px 12px 0' }}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <Link
                  href={`${APP_URL}/dashboard`}
                  style={{
                    display: 'inline-block',
                    backgroundColor: GOLD,
                    color: NAVY,
                    fontWeight: 700,
                    fontSize: 13,
                    padding: '10px 28px',
                    borderRadius: 6,
                    textDecoration: 'none',
                    letterSpacing: '0.02em',
                  }}
                >
                  View Full Dashboard →
                </Link>
              </div>
              <Hr style={{ borderColor: BORDER, margin: '0 0 12px' }} />
              <Text style={{ fontSize: 10, color: '#4B5563', textAlign: 'center', margin: 0 }}>
                Paul Padda Law · Las Vegas, NV · Padda Legal Intelligence
                <br />
                <Link href={`${APP_URL}/settings`} style={{ color: '#4B5563', textDecoration: 'underline' }}>
                  Manage notification preferences
                </Link>
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
