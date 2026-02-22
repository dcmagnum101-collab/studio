
"use client";

import React, { useMemo, useState } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Users,
  Target,
  CheckCircle,
  Zap,
  Trello,
  Mail,
  Smartphone,
  ShieldCheck,
  ArrowRight,
  Plus,
  RefreshCw,
  Activity,
  Clock,
  Sparkles
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { MorningBriefingCard } from "@/components/morning-briefing/morning-briefing-card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { useUser, useDoc, useMemoFirebase } from "@/firebase";
import { useContacts, useTasks } from "@/hooks/useFirestoreData";
import { StatsSkeleton, TasksSkeleton, QuotaSkeleton } from "@/components/dashboard/dashboard-skeletons";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const { data: allContacts, isLoading: contactsLoading } = useContacts();
  const { data: allTasks, isLoading: tasksLoading } = useTasks('pending');
  const [runningNurture, setRunningNurture] = useState(false);

  const pipelineValue = useMemo(() => {
    if (!allContacts) return 0;
    return allContacts.reduce((sum, c) => sum + (c.estimated_commission || 0), 0);
  }, [allContacts]);

  const stats = [
    { label: "Active Pipeline", value: `$${(pipelineValue / 1000).toFixed(1)}k`, icon: Target, color: "text-primary" },
    { label: "Total Leads", value: allContacts?.length || 0, icon: Users, color: "text-blue-600" },
    { label: "Tasks Due", value: (allTasks || []).length, icon: CheckCircle, color: "text-green-600" },
    { label: "ICP Hot Leads", value: allContacts?.filter((c) => (c.icpScore || 0) >= 80).length || 0, icon: Zap, color: "text-accent" },
  ];

  const today = new Date().toISOString().split("T")[0];
  const quotaRef = useMemoFirebase(() => {
    if (!user) return null;
    return `users/${user.uid}/email_quota/${today}`;
  }, [user, today]);
  const { data: emailQuota, isLoading: quotaLoading } = useDoc(quotaRef);

  const emailSentToday = emailQuota?.count || 0;
  const quotaPercentage = Math.min(100, (emailSentToday / 500) * 100);

  const handleRunNurture = async () => {
    if (!user) return;
    setRunningNurture(true);
    try {
      const res = await fetch('/api/run-nurture-sequence', {
        method: 'POST',
        body: JSON.stringify({ userId: user.uid }),
      });
      const data = await res.json();
      toast({
        title: "Nurture Run Complete",
        description: `Processed ${data.processed} contacts: ${data.emailsSent} emails sent, ${data.tasksCreated} tasks created.`
      });
    } catch (err) {
      toast({ variant: "destructive", title: "Run Failed", description: "Could not process nurture sequence." });
    } finally {
      setRunningNurture(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 md:px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-base md:text-xl font-bold font-headline text-primary truncate">Monica Executive Dashboard</h1>
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" onClick={handleRunNurture} disabled={runningNurture} className="gap-2 bg-accent hover:bg-accent/90 text-primary font-bold shadow-md h-9 px-4">
                {runningNurture ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Run Nurture Sequence
              </Button>
            </div>
          </header>

          <main className="flex-1 space-y-6 md:space-y-8 p-4 md:p-8 max-w-7xl mx-auto w-full">
            <MorningBriefingCard />

            {isUserLoading || contactsLoading ? (
              <StatsSkeleton />
            ) : (
              <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                  <Card key={stat.label} className="border-none shadow-md hover:scale-[1.01] transition-transform">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        {stat.label}
                      </CardTitle>
                      <div className="p-2 bg-secondary rounded-lg">
                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</div>
                      <p className="text-xs text-green-600 flex items-center gap-1 mt-1 font-medium">
                        <Activity className="h-3 w-3" />
                        Live Status
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
              <Card className="lg:col-span-2 shadow-md border-none bg-white">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg">Prospecting Intelligence</CardTitle>
                      <CardDescription className="text-xs">AI-detected lead signals & patterns</CardDescription>
                    </div>
                    <Zap className="h-5 w-5 text-accent animate-pulse" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                      <p className="text-[10px] font-black text-muted-foreground uppercase mb-2 tracking-widest">
                        Best Call Window
                      </p>
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-bold">Now - 11:30 AM</p>
                          <p className="text-[10px] text-muted-foreground">34% Predict Answer Rate</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                      <p className="text-[10px] font-black text-orange-600 uppercase mb-2 tracking-widest">
                        High Intensity
                      </p>
                      <div className="flex items-center gap-3">
                        <Smartphone className="h-5 w-5 text-orange-600" />
                        <div>
                          <p className="text-sm font-bold">
                            {allContacts?.filter((c) => c.ai_urgency === "hot").length || 0} Hot Leads
                          </p>
                          <p className="text-[10px] text-orange-700">Immediate action advised</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {quotaLoading ? (
                    <QuotaSkeleton />
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-primary" />
                          <span className="text-xs font-bold uppercase text-slate-700">Daily Outreach Quota</span>
                        </div>
                        <Badge variant="outline" className="bg-white text-[10px] font-black">
                          {emailSentToday} / 500
                        </Badge>
                      </div>
                      <Progress
                        value={quotaPercentage}
                        className={`h-2 ${quotaPercentage > 90 ? "bg-red-100" : quotaPercentage > 80 ? "bg-yellow-100" : "bg-slate-200"}`}
                      />
                      <p className="text-[10px] text-muted-foreground mt-2 italic leading-relaxed">
                        Monica ensures maximum deliverability with artificial delay between messages.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-md border-none bg-slate-50/50">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-slate-600">
                    <ShieldCheck className="h-4 w-4 text-accent" />
                    Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Unsubscribes</span>
                    <span className="font-bold">Active Tracking</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Safe Windows</span>
                    <span className="font-bold">8am - 8pm</span>
                  </div>
                  <div className="h-px bg-slate-200 w-full" />
                  <div className="space-y-3">
                    <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                      Automatic DNC scrubbing and Email Unsubscribe tracking are active for all outreach sequences.
                    </p>
                    <Button variant="outline" className="w-full text-xs h-9 font-bold shadow-sm">
                      View Compliance Logs
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
              <Card className="lg:col-span-3 shadow-md border-none bg-slate-50/50">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg">Today's Game Plan</CardTitle>
                      <CardDescription className="text-xs">Monica's Top Priorities</CardDescription>
                    </div>
                    <Badge className="bg-primary text-[10px] h-5">{(allTasks || []).length} Actions</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tasksLoading ? (
                    <TasksSkeleton />
                  ) : allTasks && allTasks.length > 0 ? (
                    <div className="space-y-3">
                      {allTasks.map((task) => (
                        <div
                          key={task.id}
                          className="bg-white p-3 rounded-xl border flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow group"
                        >
                          <div
                            className={`h-2 w-2 rounded-full shrink-0 ${task.priority === "urgent" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-blue-400"}`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate text-primary">{task.title}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {task.contact_name}
                            </p>
                          </div>
                          <Link href={`/contacts/${task.contactId}`}>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-slate-300 group-hover:text-primary transition-colors"
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl bg-white/50">
                      <p className="text-xs text-muted-foreground">No tasks for today. Power Hour complete! 🎉</p>
                    </div>
                  )}
                  <Link href="/tasks" className="block">
                    <Button className="w-full bg-primary mt-4 font-bold h-10 shadow-lg" variant="default">
                      Open Task Manager
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="lg:col-span-4 shadow-md bg-white">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg">Pipeline Distribution</CardTitle>
                      <CardDescription className="text-xs">Active leads across funnel stages</CardDescription>
                    </div>
                    <Trello className="h-5 w-5 text-accent" />
                  </div>
                </CardHeader>
                <CardContent className="h-[300px] md:h-[350px]">
                  {!contactsLoading ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          {
                            stage: "New",
                            count: allContacts?.filter((c) => c.pipeline_stage === "new_lead").length || 0,
                          },
                          {
                            stage: "Working",
                            count:
                              allContacts?.filter((c) =>
                                ["attempted_contact", "conversation_had"].includes(c.pipeline_stage)
                              ).length || 0,
                          },
                          {
                            stage: "Set",
                            count: allContacts?.filter((c) => c.pipeline_stage === "appointment_set").length || 0,
                          },
                          {
                            stage: "Listed",
                            count: allContacts?.filter((c) => c.pipeline_stage === "listed").length || 0,
                          },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis
                          dataKey="stage"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#94A3B8", fontSize: 10, fontWeight: 600 }}
                        />
                        <YAxis hide />
                        <ChartTooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "none",
                            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                          }}
                        />
                        <Bar dataKey="count" name="Leads" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <RefreshCw className="h-8 w-8 animate-spin text-slate-200" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
