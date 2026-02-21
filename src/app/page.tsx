
"use client"

import React, { useState, useEffect, useMemo } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { KPI_STATS } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Users, 
  Target, 
  Phone, 
  TrendingUp, 
  Clock, 
  Activity, 
  CheckCircle,
  Sparkles,
  ArrowRight,
  Smartphone,
  ShieldCheck,
  Zap,
  Trello,
  Mail
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { MorningBriefingCard } from "@/components/morning-briefing/morning-briefing-card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, limit, orderBy } from "firebase/firestore";

const iconMap: Record<string, any> = {
  Users,
  Target,
  Phone,
  TrendingUp,
  CheckCircle
};

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const tasksQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'tasks'),
      orderBy('due_date', 'asc'),
      limit(20)
    );
  }, [firestore, user]);

  const { data: allTasks, isLoading: tasksLoading } = useCollection(tasksQuery);

  const liveTasks = useMemo(() => {
    if (!allTasks) return [];
    return allTasks.filter(t => t.status === 'pending').slice(0, 5);
  }, [allTasks]);

  // Daily Email Quota Fetch - Scoped to User
  const today = new Date().toISOString().split('T')[0];
  const quotaRef = useMemoFirebase(() => {
    if (!user) return null;
    return `users/${user.uid}/email_quota/${today}`;
  }, [user, today]);
  const { data: emailQuota } = useDoc(quotaRef);
  
  const emailSentToday = emailQuota?.count || 0;
  const quotaPercentage = Math.min(100, (emailSentToday / 500) * 100);

  if (!mounted) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-xl font-bold font-headline text-primary">Monica Executive Dashboard</h1>
          </header>
          
          <main className="flex-1 space-y-8 p-8 max-w-7xl mx-auto w-full">
            <MorningBriefingCard />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {KPI_STATS.map((stat) => {
                const Icon = iconMap[stat.icon];
                return (
                  <Card key={stat.label} className="border-none shadow-md hover:scale-[1.02] transition-transform">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {stat.label}
                      </CardTitle>
                      <div className="p-2 bg-secondary rounded-lg">
                        {Icon && <Icon className="h-4 w-4 text-primary" />}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-primary">{stat.value}</div>
                      <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <Activity className="h-3 w-3" />
                        {stat.change} 
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2 shadow-md border-none bg-white">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Prospecting Intelligence</CardTitle>
                      <CardDescription>AI-detected lead signals & heatmap patterns</CardDescription>
                    </div>
                    <Zap className="h-5 w-5 text-accent animate-pulse" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                      <p className="text-[10px] font-black text-muted-foreground uppercase mb-2">Best Call Window</p>
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-bold">Now - 11:30 AM</p>
                          <p className="text-[10px] text-muted-foreground">34% Predict Answer Rate</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                      <p className="text-[10px] font-black text-orange-600 uppercase mb-2">Almost Leads Detected</p>
                      <div className="flex items-center gap-3">
                        <Smartphone className="h-5 w-5 text-orange-600" />
                        <div>
                          <p className="text-sm font-bold">4 Follow-ups Ready</p>
                          <p className="text-[10px] text-orange-700">Implied timeline reached</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-primary" />
                        <span className="text-xs font-bold uppercase text-slate-700">Daily Email Outreach Quota</span>
                      </div>
                      <Badge variant="outline" className="bg-white">{emailSentToday} / 500</Badge>
                    </div>
                    <Progress value={quotaPercentage} className={`h-2 ${quotaPercentage > 90 ? 'bg-red-100' : quotaPercentage > 80 ? 'bg-yellow-100' : 'bg-slate-200'}`} />
                    <p className="text-[10px] text-muted-foreground mt-2 italic">Monica uses Gmail bulk sending with artificial delay to ensure high deliverability.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md border-none bg-slate-50/50">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-accent" />
                    Compliance & Safety
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">DNC Registries Matched</span>
                    <span className="font-bold">4,281</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Safe Call Windows</span>
                    <span className="font-bold">8am - 8pm</span>
                  </div>
                  <div className="h-px bg-slate-200 w-full" />
                  <div className="space-y-2">
                    <p className="text-[10px] text-muted-foreground font-medium">Automatic DNC scrubbing and Email Unsubscribe tracking are active.</p>
                    <Button variant="outline" className="w-full text-xs h-8">View Compliance Logs</Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
              <Card className="lg:col-span-3 shadow-md border-none bg-slate-50/50">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg">Today's Game Plan</CardTitle>
                      <CardDescription>Monica's Top Priorities</CardDescription>
                    </div>
                    <Badge className="bg-primary">{liveTasks.length} Actions</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>Progress</span>
                      <span>25% Complete</span>
                    </div>
                    <Progress value={25} className="h-2 bg-slate-200" />
                  </div>
                  
                  <div className="space-y-3">
                    {tasksLoading ? (
                      <p className="text-center text-xs py-10 text-muted-foreground">Loading actions...</p>
                    ) : liveTasks.length > 0 ? (
                      liveTasks.map(task => (
                        <div key={task.id} className="bg-white p-3 rounded-xl border flex items-center gap-3 shadow-sm">
                          <div className={`h-2 w-2 rounded-full shrink-0 ${task.priority === 'urgent' ? 'bg-red-500' : 'bg-blue-400'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate text-primary">{task.title}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {task.contact_name} • {task.due_date ? format(new Date(task.due_date), 'h:mm a') : ''}
                            </p>
                          </div>
                          <Link href={`/contacts/${task.contactId}`}>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400">
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 border border-dashed rounded-xl">
                        <p className="text-xs text-muted-foreground">No tasks for today. Power Hour complete! 🎉</p>
                      </div>
                    )}
                  </div>
                  <Link href="/tasks">
                    <Button className="w-full bg-primary mt-4" variant="outline">View All Tasks</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="lg:col-span-4 shadow-md">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Pipeline Performance</CardTitle>
                      <CardDescription>Conversion through the funnel</CardDescription>
                    </div>
                    <Trello className="h-5 w-5 text-accent" />
                  </div>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { stage: 'New', count: 42, value: 0 },
                      { stage: 'Attempted', count: 28, value: 0 },
                      { stage: 'Talked', count: 18, value: 240000 },
                      { stage: 'Appt Set', count: 8, value: 580000 },
                      { stage: 'Listed', count: 3, value: 1200000 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="stage" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#6B7280', fontSize: 10}}
                      />
                      <YAxis hide />
                      <ChartTooltip 
                         contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="count" name="Leads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
