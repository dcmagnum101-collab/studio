
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
  Sparkles,
  Play
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
    { label: "Pipeline", value: `$${(pipelineValue / 1000).toFixed(1)}k`, icon: Target, color: "text-primary" },
    { label: "Leads", value: allContacts?.length || 0, icon: Users, color: "text-blue-600" },
    { label: "Tasks", value: (allTasks || []).length, icon: CheckCircle, color: "text-green-600" },
    { label: "ICP Hot", value: allContacts?.filter((c) => (c.icpScore || 0) >= 80).length || 0, icon: Zap, color: "text-accent" },
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
        description: `Processed ${data.processed} contacts: ${data.emailsSent} emails sent.`
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
            <h1 className="text-base md:text-xl font-bold font-headline text-primary truncate">Monica Dashboard</h1>
            <div className="ml-auto flex items-center gap-2">
              <Button 
                size="sm" 
                onClick={handleRunNurture} 
                disabled={runningNurture} 
                className="hidden sm:flex gap-2 bg-accent hover:bg-accent/90 text-primary font-bold shadow-md h-9 px-4"
              >
                {runningNurture ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Run Nurture
              </Button>
            </div>
          </header>

          <main className="flex-1 space-y-6 md:space-y-8 p-4 md:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8">
            <MorningBriefingCard />

            {isUserLoading || contactsLoading ? (
              <StatsSkeleton />
            ) : (
              <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                  <Card key={stat.label} className="border-none shadow-md hover:scale-[1.01] transition-transform">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 space-y-0 p-3 md:p-6">
                      <CardTitle className="text-[10px] md:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        {stat.label}
                      </CardTitle>
                      <div className="p-1.5 md:p-2 bg-secondary rounded-lg">
                        <stat.icon className={`h-3 w-3 md:h-4 md:w-4 ${stat.color}`} />
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 md:p-6 pt-0">
                      <div className="text-lg md:text-3xl font-bold text-primary">{stat.value}</div>
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
                      <CardDescription className="text-xs">AI-detected lead signals</CardDescription>
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
                          <p className="text-[10px] text-muted-foreground">34% Predict Answer</p>
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
                          <p className="text-[10px] text-orange-700">Immediate action</p>
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
                          <span className="text-xs font-bold uppercase text-slate-700">Outreach Quota</span>
                        </div>
                        <Badge variant="outline" className="bg-white text-[10px] font-black">
                          {emailSentToday} / 500
                        </Badge>
                      </div>
                      <Progress
                        value={quotaPercentage}
                        className={`h-2 ${quotaPercentage > 90 ? "bg-red-100" : quotaPercentage > 80 ? "bg-yellow-100" : "bg-slate-200"}`}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-md border-none bg-slate-50/50 hidden lg:block">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-slate-600">
                    <ShieldCheck className="h-4 w-4 text-accent" />
                    Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Safe Windows</span>
                    <span className="font-bold">8am - 8pm</span>
                  </div>
                  <div className="h-px bg-slate-200 w-full" />
                  <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                    Automatic DNC scrubbing and Email Unsubscribe tracking are active.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
              <Card className="lg:col-span-3 shadow-md border-none bg-slate-50/50">
                <CardHeader className="p-4 md:p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg">Today's Queue</CardTitle>
                      <CardDescription className="text-xs">Monica's Top Priorities</CardDescription>
                    </div>
                    <Badge className="bg-primary text-[10px] h-5">{(allTasks || []).length} Actions</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-4 md:p-6 md:pt-0">
                  {tasksLoading ? (
                    <TasksSkeleton />
                  ) : allTasks && allTasks.length > 0 ? (
                    <div className="space-y-3">
                      {allTasks.slice(0, 5).map((task) => (
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
                      <p className="text-xs text-muted-foreground">Queue clear! 🎉</p>
                    </div>
                  )}
                  <Link href="/tasks" className="block">
                    <Button className="w-full bg-primary mt-2 font-bold h-11 md:h-10 shadow-lg" variant="default">
                      Open Task Manager
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="lg:col-span-4 shadow-md bg-white hidden md:flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg">Pipeline Distribution</CardTitle>
                      <CardDescription className="text-xs">Active funnel stages</CardDescription>
                    </div>
                    <Trello className="h-5 w-5 text-accent" />
                  </div>
                </CardHeader>
                <CardContent className="flex-1 min-h-[300px]">
                  {!contactsLoading ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { stage: "New", count: allContacts?.filter((c) => c.pipeline_stage === "new_lead").length || 0 },
                          { stage: "Working", count: allContacts?.filter((c) => ["attempted_contact", "conversation_had"].includes(c.pipeline_stage)).length || 0 },
                          { stage: "Set", count: allContacts?.filter((c) => c.pipeline_stage === "appointment_set").length || 0 },
                          { stage: "Listed", count: allContacts?.filter((c) => c.pipeline_stage === "listed").length || 0 },
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
                          contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}
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

          {/* Sticky Mobile Action Bar */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t border-slate-200 z-50 flex gap-3 pb-safe">
            <Button 
              className="flex-1 h-12 rounded-xl bg-primary text-white font-black shadow-lg shadow-primary/20 gap-2"
              onClick={handleRunNurture}
              disabled={runningNurture}
            >
              {runningNurture ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
              Start Power Hour
            </Button>
            <Link href="/contacts" className="contents">
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-slate-200 bg-white">
                <Plus className="h-6 w-6 text-primary" />
              </Button>
            </Link>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
