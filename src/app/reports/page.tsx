"use client"
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { KPI_STATS, MONTHLY_TRENDS } from "@/lib/mock-data"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts"
import { TrendingUp, Target, Phone, Sparkles, Download, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"

const COLORS = ['#1E3A8A', '#A88A2A', '#64748B', '#CBD5E1', '#F43F5E']

const funnelData = [
  { stage: 'New Lead', value: 420 },
  { stage: 'Attempted', value: 310 },
  { stage: 'Talked', value: 180 },
  { stage: 'Appt Set', value: 85 },
  { stage: 'Listed', value: 32 },
  { stage: 'Closed', value: 14 },
]

const conversionData = [
  { name: 'Expired', value: 35 },
  { name: 'FSBO', value: 25 },
  { name: 'Probate', value: 15 },
  { name: 'FRBO', value: 15 },
  { name: 'Other', value: 10 },
]

export default function ReportsPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-xl font-bold font-headline text-primary">Performance Reports</h1>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Calendar className="h-4 w-4" /> Last 30 Days
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" /> Export
              </Button>
            </div>
          </header>
          
          <main className="p-8 max-w-7xl mx-auto w-full space-y-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {KPI_STATS.map((stat) => (
                <Card key={stat.label} className="border-none shadow-md">
                  <CardHeader className="pb-2">
                    <CardDescription>{stat.label}</CardDescription>
                    <CardTitle className="text-2xl">{stat.value}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-green-600 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {stat.change} growth
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Tabs defaultValue="overview" className="space-y-8">
              <TabsList className="bg-slate-100 p-1 rounded-xl">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
                <TabsTrigger value="prospecting">Prospecting</TabsTrigger>
                <TabsTrigger value="commissions">Commissions</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-8">
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card className="shadow-md border-none">
                    <CardHeader>
                      <CardTitle>Lead Growth Trend</CardTitle>
                      <CardDescription>Monthly lead acquisition performance.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={MONTHLY_TRENDS}>
                          <defs>
                            <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} />
                          <YAxis axisLine={false} tickLine={false} />
                          <Tooltip />
                          <Area type="monotone" dataKey="leads" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorLeads)" strokeWidth={3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="shadow-md border-none">
                    <CardHeader>
                      <CardTitle>Conversion by Source</CardTitle>
                      <CardDescription>Which lead engines are closing deals?</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={conversionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {conversionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-none shadow-md bg-gradient-to-br from-primary to-primary/90 text-white">
                  <CardContent className="p-8 flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-accent" />
                        <h3 className="text-xl font-bold">Monica's AI Performance Insight</h3>
                      </div>
                      <p className="max-w-2xl text-primary-foreground/80 text-sm">
                        "Monica, your connect rate is highest on Tuesdays between 9 AM and 11 AM. 
                        Your conversion from Expired leads has increased by 14% since you started 
                        using the Empathy Script. Focus on these windows to maximize your ROI."
                      </p>
                    </div>
                    <Button variant="outline" className="text-white border-white/20 hover:bg-white/10">
                      View Call Analysis
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pipeline" className="space-y-8">
                <Card className="shadow-md border-none">
                  <CardHeader>
                    <CardTitle>Pipeline Funnel</CardTitle>
                    <CardDescription>Volume and drop-off rate across stages.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={funnelData} margin={{ left: 50 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="stage" type="category" axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
