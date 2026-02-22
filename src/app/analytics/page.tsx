"use client";

import React from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
} from "recharts";
import { TrendingUp, Users, Target, RefreshCw } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query } from "firebase/firestore";

const COLORS = ["#1E3A8A", "#A88A2A", "#64748B", "#CBD5E1"];

export default function AnalyticsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

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

  const stats = [
    {
      label: "Total Leads",
      value: contactsLoading ? "..." : (contacts || []).length.toString(),
      change: "+12%",
      icon: Users,
    },
    {
      label: "Active Deals",
      value: contactsLoading ? "..." : (contacts || []).filter((c) => c.pipeline_stage !== "closed").length.toString(),
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

  // Derived Source Data
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
            <h1 className="text-xl font-bold font-headline text-primary">Performance Analytics</h1>
            {(contactsLoading || tasksLoading) && (
              <RefreshCw className="ml-auto h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </header>

          <main className="p-8 max-w-7xl mx-auto w-full space-y-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <Card key={stat.label} className="border-none shadow-sm">
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

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="shadow-md border-none">
                <CardHeader>
                  <CardTitle>Pipeline Snapshot</CardTitle>
                  <CardDescription>Current distribution of active listings.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
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
                      <XAxis dataKey="stage" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                      />
                      <Bar dataKey="val" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="shadow-md border-none">
                <CardHeader>
                  <CardTitle>Lead Sources</CardTitle>
                  <CardDescription>Distribution of successful acquisitions by method.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  {sourceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sourceData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {sourceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center text-xs text-muted-foreground italic">No source data available</div>
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
