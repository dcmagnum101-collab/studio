
"use client"

import { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { KPI_STATS, MOCK_TASKS, MOCK_APPOINTMENTS, MOCK_CONTACTS } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Users, 
  Target, 
  Phone, 
  TrendingUp, 
  Clock, 
  Activity, 
  CheckCircle,
  Calendar,
  Sparkles,
  ArrowRight,
  Flame,
  Trello
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

const iconMap: Record<string, any> = {
  Users,
  Target,
  Phone,
  TrendingUp,
  CheckCircle
};

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-xl font-bold font-headline text-primary">CRM Overview</h1>
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
                        <Icon className="h-4 w-4 text-primary" />
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

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
              <Card className="lg:col-span-3 shadow-md border-none bg-slate-50/50">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg">Today's Game Plan</CardTitle>
                      <CardDescription>Monica's Top Priorities</CardDescription>
                    </div>
                    <Badge className="bg-primary">{MOCK_TASKS.length} Actions</Badge>
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
                    {MOCK_TASKS.map(task => (
                      <div key={task.id} className="bg-white p-3 rounded-xl border flex items-center gap-3 shadow-sm">
                        <div className={`h-2 w-2 rounded-full shrink-0 ${task.priority === 'urgent' ? 'bg-red-500' : 'bg-blue-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate text-primary">{task.title}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {task.contact_name} • {mounted ? format(new Date(task.due_date), 'h:mm a') : '...'}
                          </p>
                        </div>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
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

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-accent" />
                    Upcoming Appointments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {MOCK_APPOINTMENTS.map(appt => (
                    <div key={appt.id} className="p-3 border rounded-xl space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="font-bold text-xs">{appt.title}</div>
                        <Badge variant="outline" className="text-[9px] h-4">{appt.status}</Badge>
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" /> {appt.contact_name}
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {mounted ? format(new Date(appt.date), 'MMM d, h:mm a') : '...'}
                      </div>
                      <Button size="sm" className="w-full h-7 text-[10px] bg-slate-50 text-primary border-slate-200" variant="outline">View Prep Brief</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Flame className="h-4 w-4 text-red-500" />
                    Hot Pipeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {MOCK_CONTACTS.filter(c => c.ai_urgency === 'hot').map(contact => (
                    <div key={contact.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-xs">
                          {contact.name[0]}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-primary">{contact.name}</div>
                          <div className="text-[9px] text-muted-foreground">{contact.pipeline_stage.replace('_', ' ')}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-bold">${(contact.estimated_commission / 1000).toFixed(1)}k</div>
                        <Badge className="bg-accent text-white h-4 text-[8px]">{contact.icpScore}</Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="shadow-md bg-accent text-white">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    AI Intelligence
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white/10 p-3 rounded-xl border border-white/10 text-xs italic">
                    "Monica, your connect rate is 18% higher when calling Expired leads on Tuesday mornings between 9am and 11am. Adjust your block time for better ROI."
                  </div>
                  <div className="bg-white/10 p-3 rounded-xl border border-white/10 text-xs italic">
                    "Sarah Johnson's sentiment score increased by 40% after the latest SMS. She is ready for a listing presentation ask."
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
