
"use client"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { KPI_STATS, LEAD_SOURCES_STATS } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Users, 
  Target, 
  Phone, 
  TrendingUp, 
  Clock, 
  Activity, 
  Database
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

const iconMap: Record<string, any> = {
  Users,
  Target,
  Phone,
  TrendingUp
};

const chartData = [
  { name: "Mon", calls: 45, emails: 32, sms: 12 },
  { name: "Tue", calls: 52, emails: 41, sms: 18 },
  { name: "Wed", calls: 38, emails: 28, sms: 15 },
  { name: "Thu", calls: 65, emails: 55, sms: 25 },
  { name: "Fri", calls: 48, emails: 42, sms: 20 },
  { name: "Sat", calls: 12, emails: 10, sms: 5 },
  { name: "Sun", calls: 8, emails: 5, sms: 2 },
];

export default function DashboardPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-xl font-bold font-headline text-primary">Overview Dashboard</h1>
          </header>
          
          <main className="flex-1 space-y-8 p-8 max-w-7xl mx-auto w-full">
            {/* Morning Briefing Hero */}
            <MorningBriefingCard />

            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {KPI_STATS.map((stat) => {
                const Icon = iconMap[stat.icon];
                return (
                  <Card key={stat.label} className="border-none shadow-md overflow-hidden hover:scale-[1.02] transition-transform">
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
                        {stat.change} from last month
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
              {/* Engagement Chart */}
              <Card className="lg:col-span-4 shadow-md">
                <CardHeader>
                  <CardTitle>Weekly Outreach Engagement</CardTitle>
                  <CardDescription>Activity breakdown by channel across the last 7 days.</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#6B7280', fontSize: 12}}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#6B7280', fontSize: 12}}
                      />
                      <ChartTooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="calls" name="Calls" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="emails" name="Emails" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="sms" name="SMS" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Lead Sources Dashboard Widget */}
              <Card className="lg:col-span-3 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>ArchAgent Lead Stream</CardTitle>
                    <CardDescription>Performance by data source.</CardDescription>
                  </div>
                  <Database className="h-5 w-5 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {[
                      { name: 'Expired Listings', count: 145, avgScore: 84, lastSync: '2 hours ago' },
                      { name: 'FSBO Leads', count: 89, avgScore: 72, lastSync: '5 hours ago' },
                      { name: 'Preforeclosures', count: 12, avgScore: 92, lastSync: '10 mins ago' },
                      { name: 'FRBO / Landlords', count: 230, avgScore: 45, lastSync: '2 days ago' },
                    ].map((source) => (
                      <div key={source.name} className="flex items-center">
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-semibold leading-none">{source.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>Synced {source.lastSync}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold">{source.count} Leads</div>
                          <Badge variant={source.avgScore > 70 ? "default" : "secondary"} className="mt-1 text-[10px] h-5">
                            Avg Score: {source.avgScore}
                          </Badge>
                        </div>
                      </div>
                    ))}
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
