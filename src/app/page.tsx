
"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
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
  Play,
  AlertTriangle,
  ArrowUpRight,
  Rocket,
  TrendingUp,
  DollarSign
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
import { GoalScorecard } from "@/components/dashboard/goal-scorecard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { useUser, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { useContacts, useTasks } from "@/hooks/useFirestoreData";
import { StatsSkeleton, TasksSkeleton, QuotaSkeleton } from "@/components/dashboard/dashboard-skeletons";
import { useToast } from "@/hooks/use-toast";
import { collection, query, limit, onSnapshot, getCountFromServer, where, collectionGroup } from "firebase/firestore";
import { useFirestore } from "@/firebase";

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { data: allContacts, isLoading: contactsLoading } = useContacts();
  const { data: allTasks, isLoading: tasksLoading } = useTasks('pending');
  const [runningNurture, setRunningNurture] = useState(false);
  const [settings, setSettings] = useState<Record<string, any>>({});

  // Live Stats State
  const [liveStats, setLiveStats] = useState({
    activeLeads: 0,
    hotLeads: 0,
    dueToday: 0,
    callsThisWeek: 0,
    totalPipelineValue: 0,
    loading: true
  });

  const fetchLiveStats = useCallback(async () => {
    if (!user || !firestore) return;
    try {
      const contactsRef = collection(firestore, "users", user.uid, "contacts");
      const today = new Date().toISOString().split("T")[0];
      
      // Calls this week (from last Sunday)
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const [activeSnap, hotSnap, dueSnap] = await Promise.all([
        getCountFromServer(query(contactsRef, where("pipeline_stage", "not-in", ["closed", "dnc"]))),
        getCountFromServer(query(contactsRef, where("icpScore", ">=", 80))),
        getCountFromServer(query(contactsRef, where("nextFollowUpDate", "<=", today)))
      ]);

      const callsRef = collectionGroup(firestore, "activityLogs");
      const callsSnap = await getCountFromServer(
        query(callsRef, 
          where("ownerId", "==", user.uid),
          where("type", "==", "call"),
          where("date", ">=", weekStart.toISOString())
        )
      );

      const activeContacts = (allContacts || []).filter(c => !['closed', 'dead', 'dnc'].includes(c.pipeline_stage));
      const totalPipelineValue = activeContacts.reduce((sum, c) => sum + (c.estimated_commission || 0), 0);

      setLiveStats({
        activeLeads: activeSnap.data().count,
        hotLeads: hotSnap.data().count,
        dueToday: dueSnap.data().count,
        callsThisWeek: callsSnap.data().count,
        totalPipelineValue,
        loading: false
      });
    } catch (err) {
      console.error("Failed to fetch live stats:", err);
    }
  }, [user, firestore, allContacts]);

  useEffect(() => {
    if (user && firestore) {
      fetchLiveStats();
      const interval = setInterval(fetchLiveStats, 5 * 60 * 1000); // 5 minutes
      return () => clearInterval(interval);
    }
  }, [user, firestore, fetchLiveStats]);

  useEffect(() => {
    if (user && firestore) {
      const q = query(collection(firestore, "users", user.uid, "settings"));
      const unsub = onSnapshot(q, (snapshot) => {
        const data: Record<string, any> = {};
        snapshot.docs.forEach(doc => data[doc.id] = doc.data());
        setSettings(data);
      });
      return () => unsub();
    }
  }, [user, firestore]);

  const isEmpty = useMemo(() => {
    return !contactsLoading && (!allContacts || allContacts.length === 0);
  }, [allContacts, contactsLoading]);

  const requiredSteps = useMemo(() => {
    const steps = [
      { completed: !!settings.outreach_gmail?.connected },
      { completed: !!(settings.dialer_v7?.username && settings.dialer_v7?.password) },
      { completed: !isEmpty }
    ];
    const completedCount = steps.filter(s => s.completed).length;
    return {
      completedCount,
      total: steps.length,
      progress: (completedCount / steps.length) * 100
    };
  }, [settings, isEmpty]);

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
                disabled={runningNurture || isEmpty} 
                className="hidden sm:flex gap-2 bg-accent hover:bg-accent/90 text-primary font-bold shadow-md h-9 px-4"
              >
                {runningNurture ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Run Nurture
              </Button>
            </div>
          </header>

          <main className="flex-1 space-y-6 md:space-y-8 p-4 md:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8">
            
            {isEmpty ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-top-4">
                <Card className="border-none shadow-2xl bg-gradient-to-br from-primary via-primary to-slate-900 text-white overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Rocket className="h-48 w-48" />
                  </div>
                  <CardContent className="p-8 sm:p-12 relative z-10 space-y-8">
                    <div className="space-y-2">
                      <Badge className="bg-accent text-primary font-black px-3 py-1">GETTING STARTED</Badge>
                      <h2 className="text-3xl sm:text-5xl font-black font-headline">Welcome, Monica!</h2>
                      <p className="text-lg text-primary-foreground/70 max-w-xl">
                        Your intelligent real estate ecosystem is ready. Let's get your pipeline started by importing your first set of leads.
                      </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-xs font-black uppercase tracking-[0.2em] opacity-70">
                          <span>Setup Progress</span>
                          <span>{requiredSteps.completedCount} OF {requiredSteps.total} REQUIRED STEPS</span>
                        </div>
                        <Progress value={requiredSteps.progress} className="h-3 bg-white/10" />
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <Button asChild size="lg" className="flex-1 bg-accent hover:bg-accent/90 text-primary font-black text-lg h-16 rounded-2xl shadow-xl shadow-accent/20">
                          <Link href="/contacts">
                            Import My First Leads <ArrowRight className="ml-2 h-6 w-6" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <>
                <section className="grid gap-6 lg:grid-cols-3">
                  <Card className="lg:col-span-2 border-none shadow-xl bg-white overflow-hidden relative group cursor-pointer hover:shadow-2xl transition-all">
                    <Link href="/analytics" className="absolute inset-0 z-10" />
                    <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                      <DollarSign className="h-32 w-32" />
                    </div>
                    <CardHeader className="pb-2">
                      <Badge className="w-fit bg-accent/10 text-accent border-accent/20 font-black px-2 h-5 mb-2">ACTIVE PIPELINE</Badge>
                      <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Total Potential Commission</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end gap-3">
                        <div className="text-5xl sm:text-7xl font-black text-accent tracking-tighter">
                          {liveStats.loading ? "..." : `$${liveStats.totalPipelineValue.toLocaleString()}`}
                        </div>
                        <div className="mb-2 flex items-center gap-1 text-green-600 font-bold text-xs">
                          <TrendingUp className="h-4 w-4" />
                          +14% this month
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-4 flex items-center gap-2">
                        Click to view detailed revenue intelligence <ArrowUpRight className="h-3 w-3" />
                      </p>
                    </CardContent>
                  </Card>
                  
                  <MorningBriefingCard />
                </section>

                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="grid gap-4 md:gap-6 grid-cols-2">
                      <Card className="border-none shadow-md">
                        <CardHeader className="pb-2 p-4">
                          <CardTitle className="text-[10px] uppercase tracking-widest text-slate-400">Active Leads</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="text-3xl font-bold text-primary">{liveStats.activeLeads}</div>
                        </CardContent>
                      </Card>
                      <Card className="border-none shadow-md">
                        <CardHeader className="pb-2 p-4">
                          <CardTitle className="text-[10px] uppercase tracking-widest text-slate-400">ICP Hot</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 text-accent">
                          <div className="text-3xl font-bold">{liveStats.hotLeads}</div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <Card className="shadow-md border-none bg-white">
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
                            <p className="text-[10px] font-black text-muted-foreground uppercase mb-2 tracking-widest">Best Call Window</p>
                            <div className="flex items-center gap-3">
                              <Clock className="h-5 w-5 text-primary" />
                              <div>
                                <p className="text-sm font-bold">Now - 11:30 AM</p>
                                <p className="text-[10px] text-muted-foreground">34% Predict Answer</p>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                            <p className="text-[10px] font-black text-orange-600 uppercase mb-2 tracking-widest">High Intensity</p>
                            <div className="flex items-center gap-3">
                              <Smartphone className="h-5 w-5 text-orange-600" />
                              <div>
                                <p className="text-sm font-bold">{allContacts?.filter((c) => c.ai_urgency === "hot").length || 0} Hot Leads</p>
                                <p className="text-[10px] text-orange-700">Immediate action</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <GoalScorecard />
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
                              <div className={`h-2 w-2 rounded-full shrink-0 ${task.priority === "urgent" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-blue-400"}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate text-primary">{task.title}</p>
                                <p className="text-[10px] text-muted-foreground">{task.contact_name}</p>
                              </div>
                              <Link href={`/contacts/${task.contactId}`}>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-300 group-hover:text-primary transition-colors">
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
                        <Button className="w-full bg-primary mt-2 font-bold h-11 md:h-10 shadow-lg" variant="default">Open Task Manager</Button>
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
                            <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 10, fontWeight: 600 }} />
                            <YAxis hide />
                            <ChartTooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }} />
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
              </>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
