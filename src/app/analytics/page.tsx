"use client";

import React, { useState, useEffect } from "react";
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
  Clock
} from "lucide-react";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query } from "firebase/firestore";
import { generateWeeklyReport, sendReportToUser, type WeeklyReport } from "@/app/actions/weekly-report";
import { startOfWeek, format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ["#1E3A8A", "#A88A2A", "#64748B", "#CBD5E1"];

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
    setReportLoading(true);
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

  const stats = [
    {
      label: "Total Leads",
      value: contactsLoading ? "..." : (contacts || []).length.toString(),
      change: "+12%",
      icon: Users,
    },
    {
      label: "Active Deals",
      value: contactsLoading ? "..." : (contacts || []).filter((c) => !['closed', 'dead'].includes(c.pipeline_stage)).length.toString(),
      change: "+5%",
      icon: Target,
    },
    {
      label: "Pipeline Value",
      value: contactsLoading
        ? "..."
        : `$${((contacts || []).reduce((acc, c) => acc + (c.estimated_commission || 0), 0) / 1000).toFixed(1)}k`,
      change: "+18%",
      icon: TrendingUp,
    },
    {
      label: "Open Tasks",
      value: tasksLoading ? "..." : (tasks || []).filter((t) => t.status === "pending").length.toString(),
      change: "Today",
      icon: Target,
    },
  ];

  const sourceData = React.useMemo(() => {
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
            <h1 className="text-xl font-bold font-headline text-primary">Intelligence & Analytics</h1>
            {(contactsLoading || tasksLoading) && (
              <RefreshCw className="ml-auto h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </header>

          <main className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
            {/* WEEKLY REPORT SECTION */}
            <Card className="border-none shadow-xl bg-gradient-to-br from-primary to-primary/90 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Sparkles className="h-32 w-32" />
              </div>
              <CardHeader className="relative z-10 border-b border-white/10 pb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-accent text-primary font-black px-2 h-5">WEEKLY STRATEGY</Badge>
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Week starting ${weekStart}</span>
                    </div>
                    <CardTitle className="text-2xl font-black">{report?.headline || "Performance Intelligence"}</CardTitle>
                    <CardDescription className="text-primary-foreground/70">
                      Monica's Grok-powered analysis of your sales funnel.
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {report && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleEmailReport} 
                        disabled={sendingEmail}
                        className="text-white hover:bg-white/10 border border-white/10 gap-2"
                      >
                        {sendingEmail ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Email Me
                      </Button>
                    )}
                    <Button 
                      onClick={handleGenerateReport} 
                      disabled={reportLoading}
                      className="bg-accent hover:bg-accent/90 text-primary font-black gap-2"
                    >
                      {reportLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                      {report ? "Regenerate Audit" : "Generate This Week's Report"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative z-10 p-6 md:p-8">
                {reportLoading ? (
                  <div className="space-y-4 py-8">
                    <Skeleton className="h-4 w-full bg-white/10" />
                    <Skeleton className="h-4 w-3/4 bg-white/10" />
                    <Skeleton className="h-4 w-5/6 bg-white/10" />
                  </div>
                ) : report ? (
                  <div className="space-y-8">
                    <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm border border-white/5">
                      <p className="text-sm leading-relaxed italic text-blue-50 font-medium">"{report.next_week_focus}"</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      {[
                        { label: 'New Leads', val: report.stats.new_leads, icon: Users },
                        { label: 'Calls', val: report.stats.calls, icon: Target },
                        { label: 'Emails', val: report.stats.emails, icon: TrendingUp },
                        { label: 'Appts Set', val: report.stats.appointments, icon: Sparkles },
                        { label: 'Progress', val: report.stats.warm_moves, icon: CheckCircle2 },
                        { label: 'Lost', val: report.stats.dead_leads, icon: AlertCircle },
                      ].map((s, i) => (
                        <div key={i} className="text-center p-3 bg-white/5 rounded-xl border border-white/5">
                          <p className="text-[8px] font-black uppercase opacity-60 mb-1">{s.label}</p>
                          <p className="text-xl font-black">{s.val}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-accent">What Worked This Week</h4>
                        <ul className="space-y-2">
                          {report.what_worked.map((w, i) => (
                            <li key={i} className="text-xs flex gap-2 items-start">
                              <CheckCircle2 className="h-3 w-3 text-green-400 mt-0.5 shrink-0" /> {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-red-400">Tactical Improvements</h4>
                        <ul className="space-y-2">
                          {report.what_to_improve.map((w, i) => (
                            <li key={i} className="text-xs flex gap-2 items-start">
                              <AlertCircle className="h-3 w-3 text-red-400 mt-0.5 shrink-0" /> {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center space-y-4">
                    <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
                      <Clock className="h-8 w-8 text-white/30" />
                    </div>
                    <p className="text-sm text-primary-foreground/60 italic max-w-sm mx-auto">
                      Click the button above to have Monica analyze your recent activity and identify high-leverage growth patterns.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* QUICK STATS GRID */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <Card key={stat.label} className="border-none shadow-sm card-hover">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-[10px] font-black uppercase tracking-widest">{stat.label}</CardDescription>
                    <CardTitle className="text-2xl font-black text-primary">{stat.value}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-green-600 flex items-center gap-1 font-bold">
                      <TrendingUp className="h-3 w-3" />
                      {stat.change} growth
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* CHARTS GRID */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="shadow-md border-none rounded-2xl overflow-hidden">
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

              <Card className="shadow-md border-none rounded-2xl overflow-hidden">
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
