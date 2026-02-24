"use client";
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import { 
  TrendingUp, 
  Users, 
  Target, 
  RefreshCw, 
  Sparkles, 
  FileText, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  DollarSign, 
  Briefcase, 
  Rocket, 
  ShieldCheck,
  Zap
} from "lucide-react";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query } from "firebase/firestore";
import { generateWeeklyReport, sendReportToUser } from "@/app/actions/weekly-report";
import type { WeeklyReport } from "@/lib/weekly-report-types";
import { startOfWeek, format, startOfMonth, isWithinInterval, endOfMonth } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ["#1E3A8A", "#A88A2A", "#64748B", "#CBD5E1", "#10B981", "#F59E0B"];

export default function AnalyticsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const reportRef = useMemoFirebase(() => {
    if (!user) return null;
    return `users/${user.uid}/weekly_reports/${weekStart}`;
  }, [user, weekStart]);

  const { data: cachedReport, isLoading: cacheLoading } = useDoc(reportRef);

  useEffect(() => {
    if (cachedReport) setReport(cachedReport as any);
  }, [cachedReport]);

  const contactsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, "users", user.uid, "contacts"));
  }, [user, firestore]);

  const tasksQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, "users", user.uid, "tasks"));
  }, [user, firestore]);

  const { data: contacts, isLoading: contactsLoading } = useCollection(contactsQuery);
  const { data: tasks, isLoading: tasksLoading } = useCollection(tasksQuery);

  const handleGenerateReport = async () => {
    if (!user) return;
    reportLoading ? null : setReportLoading(true);
    try {
      const res = await generateWeeklyReport(user.uid, weekStart);
      setReport(res);
      toast({ title: "Report Ready", description: "Monica has finished her performance audit." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Audit Failed", description: err.message });
    } finally {
      setReportLoading(false);
    }
  };

  const handleEmailReport = async () => {
    if (!user || !report) return;
    setSendingEmail(true);
    try {
      await sendReportToUser(user.uid, report);
      toast({ title: "Report Sent", description: "Strategic brief delivered to your inbox." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Email Failed", description: err.message });
    } finally {
      setSendingEmail(false);
    }
  };

  // --- REVENUE CALCULATIONS ---
  const revenueStats = useMemo(() => {
    if (!contacts) return null;

    const activeContacts = contacts.filter(c => !['closed', 'dead', 'dnc'].includes(c.pipeline_stage));
    const totalPipeline = activeContacts.reduce((acc, c) => acc + (c.estimated_commission || 0), 0);
    
    const stageBreakdown = {
      appointment_set: activeContacts.filter(c => c.pipeline_stage === 'appointment_set').reduce((acc, c) => acc + (c.estimated_commission || 0), 0),
      listed: activeContacts.filter(c => c.pipeline_stage === 'listed').reduce((acc, c) => acc + (c.estimated_commission || 0), 0),
      under_contract: activeContacts.filter(c => c.pipeline_stage === 'under_contract').reduce((acc, c) => acc + (c.estimated_commission || 0), 0),
    };

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const closedThisMonth = contacts.filter(c => 
      c.pipeline_stage === 'closed' && 
      c.updated_at && 
      isWithinInterval(new Date(c.updated_at), { start: monthStart, end: monthEnd })
    ).reduce((acc, c) => acc + (c.estimated_commission || 0), 0);

    const hotLeads = contacts.filter(c => c.icpScore >= 80 && !['closed', 'dead', 'dnc'].includes(c.pipeline_stage));
    const hotLeadPotential = hotLeads.reduce((acc, c) => acc + (c.estimated_commission || 0), 0);
    const conversionProjection = hotLeadPotential * 0.25; // 25% conversion target

    return {
      totalPipeline,
      stageBreakdown,
      closedThisMonth,
      conversionProjection,
      hotLeadCount: hotLeads.length
    };
  }, [contacts]);

  const stats = [
    {
      label: "Pipeline Value",
      value: contactsLoading ? "..." : `$${(revenueStats?.totalPipeline || 0).toLocaleString()}`,
      change: "+12%",
      icon: DollarSign,
      color: "text-accent"
    },
    {
      label: "MTD Closed",
      value: contactsLoading ? "..." : `$${(revenueStats?.closedThisMonth || 0).toLocaleString()}`,
      change: "+5%",
      icon: CheckCircle2,
      color: "text-green-600"
    },
    {
      label: "Active Deals",
      value: contactsLoading ? "..." : (contacts || []).filter((c) => !['closed', 'dead', 'dnc'].includes(c.pipeline_stage)).length.toString(),
      change: "Active",
      icon: Target,
      color: "text-primary"
    },
    {
      label: "Hot Prospects",
      value: contactsLoading ? "..." : (contacts || []).filter(c => (c.icpScore || 0) >= 80).length.toString(),
      change: "Ready",
      icon: Zap,
      color: "text-orange-500"
    },
  ];

  const sourceData = useMemo(() => {
    const counts: Record<string, number> = {};
    (contacts || []).forEach((c) => {
      const src = c.archagent_source || "Other";
      counts[src] = (counts[src] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [contacts]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-xl font-bold font-headline text-primary">Revenue & Performance Intelligence</h1>
            {(contactsLoading || tasksLoading) && (
              <RefreshCw className="ml-auto h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </header>

          <main className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
            {/* COMMISSION PROJECTION HERO */}
            <Card className="border-none shadow-2xl bg-slate-900 text-white overflow-hidden relative rounded-[2rem]">
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                <DollarSign className="h-64 w-64 text-accent" />
              </div>
              <CardContent className="p-8 md:p-12 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6">
                    <Badge className="bg-accent text-primary font-black uppercase tracking-[0.2em] px-3 py-1">REVENUE FORECAST</Badge>
                    <div className="space-y-2">
                      <h2 className="text-4xl sm:text-6xl font-black font-headline tracking-tighter leading-tight">
                        Pipeline Value: <span className="text-accent">${(revenueStats?.totalPipeline || 0).toLocaleString()}</span>
                      </h2>
                      <p className="text-lg text-slate-400 font-medium max-w-md leading-relaxed">
                        Monica, your active deal flow represents a significant earning opportunity in the Las Vegas market.
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">MTD Performance</p>
                        <p className="text-2xl font-black text-green-400">${(revenueStats?.closedThisMonth || 0).toLocaleString()}</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Run Rate</p>
                        <p className="text-2xl font-black text-blue-400">${((revenueStats?.closedThisMonth || 0) * 12).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-[2.5rem] border border-white/10 p-8 space-y-6 backdrop-blur-xl shadow-inner">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-accent rounded-xl text-primary"><Rocket className="h-5 w-5" /></div>
                      <h3 className="text-xl font-bold">The 25% Goal</h3>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed italic">
                      "If you convert just 25% of your <strong>{revenueStats?.hotLeadCount || 0} high-intensity leads</strong> this quarter, you would earn approximately:"
                    </p>
                    <div className="text-5xl font-black text-accent tracking-tighter">
                      ${(revenueStats?.conversionProjection || 0).toLocaleString()}
                    </div>
                    <div className="h-px bg-white/10 w-full" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-green-500" /> Monica AI Revenue Projection Algorithm Active
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* QUICK STATS GRID */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <Card key={stat.label} className="border-none shadow-sm card-hover">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardDescription className="text-[10px] font-black uppercase tracking-widest">{stat.label}</CardDescription>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-black text-primary">{stat.value}</div>
                    <div className="text-[10px] text-green-600 flex items-center gap-1 font-bold mt-1">
                      <TrendingUp className="h-3 w-3" />
                      {stat.change} growth
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* COMMISSION BY STAGE */}
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2 shadow-md border-none rounded-2xl overflow-hidden bg-white">
                <CardHeader className="bg-slate-50/50 border-b">
                  <CardTitle className="text-lg">Commission Pipeline Breakdown</CardTitle>
                  <CardDescription className="text-xs">Dollar value allocated by pipeline maturity.</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px] pt-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { stage: "Set", val: revenueStats?.stageBreakdown.appointment_set || 0 },
                        { stage: "Listed", val: revenueStats?.stageBreakdown.listed || 0 },
                        { stage: "Under Contract", val: revenueStats?.stageBreakdown.under_contract || 0 },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                      <Tooltip
                        cursor={{ fill: 'rgba(30, 58, 138, 0.05)' }}
                        formatter={(val: number) => [`$${val.toLocaleString()}`, 'Pipeline Value']}
                        contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", fontSize: '12px' }}
                      />
                      <Bar dataKey="val" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} barSize={60} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* WEEKLY REPORT SECTION INSIDE ANALYTICS */}
              <Card className="border-none shadow-xl bg-gradient-to-br from-primary to-primary/90 text-white overflow-hidden relative rounded-2xl">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Sparkles className="h-20 w-20" />
                </div>
                <CardHeader className="relative z-10 pb-4">
                  <div className="space-y-1">
                    <Badge className="bg-accent text-primary font-black px-2 h-5">WEEKLY AUDIT</Badge>
                    <CardTitle className="text-xl font-black">Strategic Intelligence</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10 space-y-6">
                  {reportLoading ? (
                    <div className="space-y-4 py-4">
                      <Skeleton className="h-4 w-full bg-white/10" />
                      <Skeleton className="h-4 w-3/4 bg-white/10" />
                    </div>
                  ) : report ? (
                    <div className="space-y-6">
                      <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/5">
                        <p className="text-xs leading-relaxed italic text-blue-50">"{report.next_week_focus}"</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-2 bg-white/5 rounded-lg border border-white/5">
                          <p className="text-[8px] font-black uppercase opacity-60">Calls</p>
                          <p className="text-lg font-black">{report.stats.calls}</p>
                        </div>
                        <div className="text-center p-2 bg-white/5 rounded-lg border border-white/5">
                          <p className="text-[8px] font-black uppercase opacity-60">Appts</p>
                          <p className="text-lg font-black">{report.stats.appointments}</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={handleGenerateReport} 
                        className="w-full bg-accent hover:bg-accent/90 text-primary font-black gap-2 h-10"
                      >
                        <RefreshCw className="h-4 w-4" /> Refresh Audit
                      </Button>
                    </div>
                  ) : (
                    <div className="py-8 text-center space-y-4">
                      <Button 
                        onClick={handleGenerateReport} 
                        className="bg-accent hover:bg-accent/90 text-primary font-black gap-2"
                      >
                        Generate Weekly Strategy
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* LEAD SOURCE DIVERSITY */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="shadow-md border-none rounded-2xl overflow-hidden bg-white">
                <CardHeader className="bg-slate-50/50">
                  <CardTitle className="text-lg">Funnel Progression</CardTitle>
                  <CardDescription className="text-xs">Volume across active pipeline stages.</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px] pt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { stage: "New", val: (contacts || []).filter((c) => c.pipeline_stage === "new_lead").length },
                        {
                          stage: "Working",
                          val: (contacts || []).filter((c) => ["attempted_contact", "conversation_had"].includes(c.pipeline_stage)).length,
                        },
                        {
                          stage: "Set",
                          val: (contacts || []).filter((c) => c.pipeline_stage === "appointment_set").length,
                        },
                        { stage: "Listed", val: (contacts || []).filter((c) => c.pipeline_stage === "listed").length },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                      <Tooltip
                        cursor={{ fill: 'rgba(30, 58, 138, 0.05)' }}
                        contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", fontSize: '12px' }}
                      />
                      <Bar dataKey="val" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} barSize={45} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="shadow-md border-none rounded-2xl overflow-hidden bg-white">
                <CardHeader className="bg-slate-50/50">
                  <CardTitle className="text-lg">Lead Source Diversity</CardTitle>
                  <CardDescription className="text-xs">Where your highest value prospects originate.</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px] flex items-center justify-center pt-6">
                  {sourceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sourceData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={110}
                          paddingAngle={8}
                          dataKey="value"
                        >
                          {sourceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center text-xs text-muted-foreground italic flex flex-col items-center gap-3">
                      <AlertCircle className="h-8 w-8 opacity-20" />
                      Monica has no source data to analyze yet.
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
