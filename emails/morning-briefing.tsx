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

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://padda-legal.vercel.app'

// ─── Types ────────────────────────────────────────────────────

interface SolCase {
  caseNumber: string
  title: string
  clientName: string
  daysLeft: number
  caseId: string
}

interface TaskItem {
  title: string
  caseNumber?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  caseId?: string
}

interface StalledCase {
  caseNumber: string
  title: string
  daysStalled: number
  stage: string
  caseId: string
}

interface PipelineHealth {
  activeCases: number
  pipelineValue: string
  settledThisMonth: number
  newCasesThisWeek: number
  overdueTaskCount: number
}

export interface MorningBriefingEmailProps {
  recipientName: string
  date: string
  narrative: string
  priorityActions: TaskItem[]
  solWatchlist: SolCase[]
  pipeline: PipelineHealth
  stalledCases: StalledCase[]
  todaysTasks: TaskItem[]
  strategicInsight?: string
}

// ─── Color constants ─────────────────────────────────────────

const NAVY = '#0A1628'
const GOLD = '#C9A84C'
const SURFACE = '#111827'
const SURFACE2 = '#1F2937'
const BORDER = '#1F2937'
const TEXT_PRIMARY = '#F9FAFB'
const TEXT_MUTED = '#9CA3AF'
const DANGER = '#DC2626'
const SUCCESS = '#16A34A'
const WARNING = '#D97706'
const INFO = '#2563EB'

// ─── Helpers ─────────────────────────────────────────────────

function SolChip({ daysLeft }: { daysLeft: number }) {
  const color = daysLeft <= 7 ? DANGER : daysLeft <= 14 ? WARNING : '#CA8A04'
  const bg = daysLeft <= 7 ? '#450A0A' : daysLeft <= 14 ? '#431407' : '#1C1917'
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 700,
        backgroundColor: bg,
        color,
        border: `1px solid ${color}40`,
        marginLeft: 8,
        fontFamily: 'DM Mono, monospace',
      }}
    >
      {daysLeft}d
    </span>
  )
}

function PriorityDot({ priority }: { priority: string }) {
  const color =
    priority === 'CRITICAL'
      ? DANGER
      : priority === 'HIGH'
      ? WARNING
      : priority === 'MEDIUM'
      ? INFO
      : '#6B7280'
  return (
    <span
      style={{
        display: 'inline-block',
        width: 6,
        height: 6,
        borderRadius: '50%',
        backgroundColor: color,
        marginRight: 6,
        verticalAlign: 'middle',
      }}
    />
  )
}

function SectionCard({
  title,
  borderColor,
  children,
}: {
  title: string
  borderColor: string
  children: React.ReactNode
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
      <Text
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: borderColor,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          margin: '0 0 10px 0',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {title}
      </Text>
      {children}
    </div>
  )
}

// ─── Main template ────────────────────────────────────────────

export default function MorningBriefingEmail({
  recipientName = 'Paul',
  date = 'Monday, April 7, 2026',
  narrative = '',
  priorityActions = [],
  solWatchlist = [],
  pipeline = {
    activeCases: 0,
    pipelineValue: '$0',
    settledThisMonth: 0,
    newCasesThisWeek: 0,
    overdueTaskCount: 0,
  },
  stalledCases = [],
  todaysTasks = [],
  strategicInsight,
}: MorningBriefingEmailProps) {
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
        Morning Briefing — {date} · {pipeline.activeCases} active cases
        {solWatchlist.length > 0 ? ` · ⚠️ ${solWatchlist.length} SOL warning${solWatchlist.length > 1 ? 's' : ''}` : ''}
      </Preview>
      <Tailwind>
        <Body style={{ backgroundColor: '#0D1421', fontFamily: 'Inter, Arial, sans-serif', margin: 0, padding: 0 }}>
          <Container style={{ maxWidth: 600, margin: '0 auto', padding: '20px 0 40px' }}>

            {/* ── Header ── */}
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
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
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
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: GOLD,
                      margin: 0,
                      letterSpacing: '0.05em',
                    }}
                  >
                    PAUL PADDA LAW
                  </Text>
                  <Text style={{ fontSize: 11, color: TEXT_MUTED, margin: '2px 0 0 0' }}>
                    Legal Intelligence Platform · Las Vegas, NV
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* ── Greeting ── */}
            <Section
              style={{
                backgroundColor: NAVY,
                padding: '18px 24px 14px',
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: TEXT_PRIMARY,
                  margin: '0 0 4px 0',
                  letterSpacing: '-0.02em',
                }}
              >
                Good morning, {recipientName}.
              </Text>
              <Text style={{ fontSize: 12, color: TEXT_MUTED, margin: 0, fontFamily: 'DM Mono, monospace' }}>
                {date}
              </Text>
            </Section>

            {/* ── Narrative ── */}
            {narrative && (
              <Section
                style={{
                  backgroundColor: SURFACE,
                  borderLeft: `3px solid ${GOLD}30`,
                  padding: '14px 20px',
                  margin: '0 0 0 0',
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    lineHeight: '1.65',
                    color: '#D1D5DB',
                    margin: 0,
                    whiteSpace: 'pre-line',
                  }}
                >
                  {narrative}
                </Text>
              </Section>
            )}

            {/* ── Main content ── */}
            <Section style={{ backgroundColor: '#0D1421', padding: '16px 12px 0' }}>

              {/* Pipeline Health */}
              <SectionCard title="📊 Pipeline Health" borderColor={SUCCESS}>
                <Row>
                  {[
                    { label: 'Active Cases', value: pipeline.activeCases },
                    { label: 'Pipeline Value', value: pipeline.pipelineValue },
                    { label: 'Settled/Mo', value: pipeline.settledThisMonth },
                    { label: 'New/Week', value: pipeline.newCasesThisWeek },
                  ].map(stat => (
                    <Column key={stat.label} style={{ textAlign: 'center', padding: '0 4px' }}>
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: GOLD,
                          margin: '0 0 2px 0',
                          fontFamily: 'DM Mono, monospace',
                        }}
                      >
                        {stat.value}
                      </Text>
                      <Text style={{ fontSize: 10, color: TEXT_MUTED, margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {stat.label}
                      </Text>
                    </Column>
                  ))}
                </Row>
                {pipeline.overdueTaskCount > 0 && (
                  <Text
                    style={{
                      fontSize: 11,
                      color: WARNING,
                      backgroundColor: '#431407',
                      border: `1px solid ${WARNING}40`,
                      borderRadius: 4,
                      padding: '4px 8px',
                      margin: '10px 0 0 0',
                    }}
                  >
                    ⚠️ {pipeline.overdueTaskCount} overdue task{pipeline.overdueTaskCount > 1 ? 's' : ''} require attention
                  </Text>
                )}
              </SectionCard>

              {/* Priority Actions */}
              {priorityActions.length > 0 && (
                <SectionCard title="🎯 Priority Actions" borderColor={GOLD}>
                  {priorityActions.map((task, i) => (
                    <div key={i} style={{ marginBottom: i < priorityActions.length - 1 ? 8 : 0 }}>
                      <Text style={{ fontSize: 12, color: TEXT_PRIMARY, margin: '0 0 2px 0' }}>
                        <PriorityDot priority={task.priority} />
                        {task.caseId ? (
                          <Link href={`${APP_URL}/cases/${task.caseId}`} style={{ color: TEXT_PRIMARY, textDecoration: 'none' }}>
                            {task.title}
                          </Link>
                        ) : (
                          task.title
                        )}
                      </Text>
                      {task.caseNumber && (
                        <Text style={{ fontSize: 10, color: TEXT_MUTED, margin: '0 0 0 12px' }}>
                          {task.caseNumber}
                        </Text>
                      )}
                    </div>
                  ))}
                </SectionCard>
              )}

              {/* SOL Watchlist */}
              {solWatchlist.length > 0 && (
                <SectionCard title="⚠️ SOL Watchlist" borderColor={DANGER}>
                  {solWatchlist.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 0',
                        borderBottom: i < solWatchlist.length - 1 ? `1px solid ${BORDER}` : 'none',
                      }}
                    >
                      <div>
                        <Text style={{ fontSize: 12, color: TEXT_PRIMARY, margin: '0 0 1px 0' }}>
                          <Link
                            href={`${APP_URL}/cases/${c.caseId}`}
                            style={{ color: TEXT_PRIMARY, textDecoration: 'none' }}
                          >
                            {c.caseNumber} — {c.title}
                          </Link>
                        </Text>
                        <Text style={{ fontSize: 10, color: TEXT_MUTED, margin: 0 }}>
                          {c.clientName}
                        </Text>
                      </div>
                      <SolChip daysLeft={c.daysLeft} />
                    </div>
                  ))}
                </SectionCard>
              )}

              {/* Today's Schedule */}
              {todaysTasks.length > 0 && (
                <SectionCard title="📅 Today's Schedule" borderColor={INFO}>
                  {todaysTasks.map((task, i) => (
                    <div key={i} style={{ marginBottom: i < todaysTasks.length - 1 ? 6 : 0 }}>
                      <Text style={{ fontSize: 12, color: TEXT_PRIMARY, margin: 0 }}>
                        <PriorityDot priority={task.priority} />
                        {task.caseId ? (
                          <Link href={`${APP_URL}/cases/${task.caseId}`} style={{ color: TEXT_PRIMARY, textDecoration: 'none' }}>
                            {task.title}
                          </Link>
                        ) : (
                          task.title
                        )}
                        {task.caseNumber && (
                          <span style={{ color: TEXT_MUTED, fontSize: 10, marginLeft: 6 }}>
                            {task.caseNumber}
                          </span>
                        )}
                      </Text>
                    </div>
                  ))}
                </SectionCard>
              )}

              {/* Stalled Cases */}
              {stalledCases.length > 0 && (
                <SectionCard title="🔴 Stalled Cases" borderColor={WARNING}>
                  {stalledCases.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '5px 0',
                        borderBottom: i < stalledCases.length - 1 ? `1px solid ${BORDER}` : 'none',
                      }}
                    >
                      <div>
                        <Text style={{ fontSize: 12, color: TEXT_PRIMARY, margin: '0 0 1px 0' }}>
                          <Link
                            href={`${APP_URL}/cases/${c.caseId}`}
                            style={{ color: TEXT_PRIMARY, textDecoration: 'none' }}
                          >
                            {c.caseNumber} — {c.title}
                          </Link>
                        </Text>
                        <Text style={{ fontSize: 10, color: TEXT_MUTED, margin: 0 }}>
                          Stage: {c.stage}
                        </Text>
                      </div>
                      <Text
                        style={{
                          fontSize: 11,
                          color: WARNING,
                          fontFamily: 'DM Mono, monospace',
                          margin: 0,
                        }}
                      >
                        {c.daysStalled}d
                      </Text>
                    </div>
                  ))}
                </SectionCard>
              )}

              {/* Strategic Insight */}
              {strategicInsight && (
                <SectionCard title="💡 Strategic Insight" borderColor="#7C3AED">
                  <Text
                    style={{
                      fontSize: 13,
                      color: '#C4B5FD',
                      lineHeight: '1.6',
                      margin: 0,
                      fontStyle: 'italic',
                    }}
                  >
                    {strategicInsight}
                  </Text>
                </SectionCard>
              )}

            </Section>

            {/* ── Footer CTA ── */}
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
              <Text
                style={{
                  fontSize: 10,
                  color: '#4B5563',
                  textAlign: 'center',
                  margin: 0,
                }}
              >
                Paul Padda Law · Las Vegas, NV · Padda Legal Intelligence
                <br />
                <Link
                  href={`${APP_URL}/settings`}
                  style={{ color: '#4B5563', textDecoration: 'underline' }}
                >
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
