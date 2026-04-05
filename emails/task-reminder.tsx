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
const INFO = '#2563EB'

export interface TaskReminderItem {
  id: string
  title: string
  caseNumber?: string
  caseId?: string
  priority: string
  dueDate: string
  daysOverdue: number
  category: string
}

export interface TaskReminderEmailProps {
  recipientName: string
  overdueTasks: TaskReminderItem[]
  dueTodayTasks: TaskReminderItem[]
  generatedAt: string
}

const PRIORITY_COLOR: Record<string, string> = {
  CRITICAL: DANGER,
  HIGH: WARNING,
  MEDIUM: INFO,
  LOW: '#6B7280',
}

function PriorityBadge({ priority }: { priority: string }) {
  const color = PRIORITY_COLOR[priority] ?? '#6B7280'
  return (
    <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, color, backgroundColor: `${color}18`, border: `1px solid ${color}30`, borderRadius: 4, padding: '1px 6px', fontFamily: 'DM Mono, monospace' }}>
      {priority}
    </span>
  )
}

export default function TaskReminderEmail({
  recipientName,
  overdueTasks = [],
  dueTodayTasks = [],
  generatedAt,
}: TaskReminderEmailProps) {
  return (
    <Html lang="en">
      <Head>
        <Font fontFamily="Inter" fallbackFontFamily="Arial" webFont={{ url: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2', format: 'woff2' }} fontWeight={400} fontStyle="normal" />
      </Head>
      <Preview>
        Task Reminder: {overdueTasks.length} overdue, {dueTodayTasks.length} due today
      </Preview>

      <Body style={{ backgroundColor: '#0D1421', fontFamily: 'Inter, Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 560, margin: '0 auto', padding: '24px 0 40px' }}>

          <div style={{ backgroundColor: NAVY, borderRadius: '8px 8px 0 0', padding: '18px 20px 14px', borderBottom: `2px solid ${GOLD}` }}>
            <Text style={{ fontSize: 11, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 2px 0' }}>
              PPL · Task Reminder
            </Text>
            <Text style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY, margin: 0 }}>
              Hi {recipientName}, you have tasks that need attention.
            </Text>
          </div>

          <div style={{ backgroundColor: '#0D1421', padding: '14px 0 0' }}>

            {overdueTasks.length > 0 && (
              <div style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${DANGER}`, borderRadius: 6, padding: '14px 16px', marginBottom: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: 700, color: DANGER, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px 0' }}>
                  🔴 Overdue ({overdueTasks.length})
                </Text>
                {overdueTasks.map((task, i) => (
                  <div key={task.id} style={{ padding: '7px 0', borderBottom: i < overdueTasks.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                    <Row>
                      <Column>
                        <Text style={{ fontSize: 12, color: TEXT_PRIMARY, margin: '0 0 2px 0' }}>
                          {task.caseId ? (
                            <Link href={`${APP_URL}/cases/${task.caseId}`} style={{ color: TEXT_PRIMARY, textDecoration: 'none' }}>
                              {task.title}
                            </Link>
                          ) : task.title}
                          {'  '}<PriorityBadge priority={task.priority} />
                        </Text>
                        {task.caseNumber && (
                          <Text style={{ fontSize: 10, color: TEXT_MUTED, margin: 0 }}>{task.caseNumber} · {task.category}</Text>
                        )}
                      </Column>
                      <Column style={{ textAlign: 'right', width: 70 }}>
                        <Text style={{ fontSize: 11, color: DANGER, fontWeight: 700, margin: 0, fontFamily: 'DM Mono, monospace' }}>
                          +{task.daysOverdue}d
                        </Text>
                      </Column>
                    </Row>
                  </div>
                ))}
              </div>
            )}

            {dueTodayTasks.length > 0 && (
              <div style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${WARNING}`, borderRadius: 6, padding: '14px 16px', marginBottom: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: 700, color: WARNING, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px 0' }}>
                  📋 Due Today ({dueTodayTasks.length})
                </Text>
                {dueTodayTasks.map((task, i) => (
                  <div key={task.id} style={{ padding: '6px 0', borderBottom: i < dueTodayTasks.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                    <Text style={{ fontSize: 12, color: TEXT_PRIMARY, margin: '0 0 1px 0' }}>
                      {task.caseId ? (
                        <Link href={`${APP_URL}/cases/${task.caseId}`} style={{ color: TEXT_PRIMARY, textDecoration: 'none' }}>
                          {task.title}
                        </Link>
                      ) : task.title}
                      {'  '}<PriorityBadge priority={task.priority} />
                    </Text>
                    {task.caseNumber && (
                      <Text style={{ fontSize: 10, color: TEXT_MUTED, margin: 0 }}>{task.caseNumber}</Text>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ textAlign: 'center', margin: '4px 0 16px' }}>
              <Link
                href={`${APP_URL}/tasks`}
                style={{ display: 'inline-block', backgroundColor: GOLD, color: NAVY, fontWeight: 700, fontSize: 13, padding: '10px 28px', borderRadius: 6, textDecoration: 'none' }}
              >
                View All Tasks →
              </Link>
            </div>

            <Hr style={{ borderColor: BORDER, margin: '0 0 12px' }} />
            <Text style={{ fontSize: 10, color: '#4B5563', textAlign: 'center', margin: 0 }}>
              Paul Padda Law · Padda Legal Intelligence ·
              {' '}<Link href={`${APP_URL}/settings`} style={{ color: '#4B5563', textDecoration: 'underline' }}>Manage preferences</Link>
            </Text>
          </div>
        </Container>
      </Body>
    </Html>
  )
}
