"use client";
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, Phone, Mail, Users, Calendar, Save, RefreshCw, Trophy, Rocket } from "lucide-react";
import { useUser } from "@/firebase";
import { getGoals, saveGoals } from "@/app/actions/goals";
import { DEFAULT_GOALS, type Goals } from "@/lib/goals-constants";
import { useToast } from "@/hooks/use-toast";

export default function GoalsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      getGoals(user.uid).then(res => {
        setGoals(res);
        setLoading(false);
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await saveGoals(user.uid, goals);
      toast({ title: "Goals Updated", description: "Your accountability engine is recalibrated." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update Failed", description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const updateGoal = (field: keyof Goals, val: string) => {
    setGoals(prev => ({ ...prev, [field]: parseInt(val) || 0 }));
  };

  if (loading) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-xl font-bold font-headline text-primary">Goal Intelligence</h1>
          </header>

          <main className="p-4 md:p-8 max-w-4xl mx-auto w-full space-y-8">
            <Card className="border-none shadow-xl bg-slate-900 text-white overflow-hidden relative rounded-[2rem]">
              <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                <Target className="h-48 w-48 text-accent" />
              </div>
              <CardContent className="p-8 md:p-12 relative z-10 space-y-6">
                <Badge className="bg-accent text-primary font-black uppercase tracking-widest px-3 h-6">Performance Accountability</Badge>
                <div className="space-y-2">
                  <h2 className="text-3xl sm:text-5xl font-black font-headline tracking-tighter leading-tight">
                    Set Your Pace, <span className="text-accent">Own the Market.</span>
                  </h2>
                  <p className="text-lg text-slate-400 font-medium max-w-md">
                    Monica, consistent daily activity is the only predictor of listing volume. Define your non-negotiables below.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-8 md:grid-cols-2">
              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-accent" />
                    Activity Targets
                  </CardTitle>
                  <CardDescription>Daily and weekly output goals.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Calls per Day</Label>
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Phone className="h-5 w-5" /></div>
                        <Input 
                          type="number" 
                          value={goals.callsPerDay} 
                          onChange={e => updateGoal('callsPerDay', e.target.value)}
                          className="text-lg font-bold h-12"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Emails per Day</Label>
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl"><Mail className="h-5 w-5" /></div>
                        <Input 
                          type="number" 
                          value={goals.emailsPerDay} 
                          onChange={e => updateGoal('emailsPerDay', e.target.value)}
                          className="text-lg font-bold h-12"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-accent" />
                    Conversion Targets
                  </CardTitle>
                  <CardDescription>High-value pipeline goals.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-500">New Contacts per Week</Label>
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Users className="h-5 w-5" /></div>
                        <Input 
                          type="number" 
                          value={goals.contactsPerWeek} 
                          onChange={e => updateGoal('contactsPerWeek', e.target.value)}
                          className="text-lg font-bold h-12"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Appointments per Week</Label>
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><Calendar className="h-5 w-5" /></div>
                        <Input 
                          type="number" 
                          value={goals.appointmentsPerWeek} 
                          onChange={e => updateGoal('appointmentsPerWeek', e.target.value)}
                          className="text-lg font-bold h-12"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="bg-primary text-white font-black px-12 h-14 rounded-2xl gap-2 shadow-xl shadow-primary/20 text-lg"
              >
                {saving ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                Save My Strategy
              </Button>
            </div>

            <Card className="border-none shadow-md bg-accent/5 border-2 border-accent/20 rounded-3xl">
              <CardContent className="p-8 flex items-start gap-6">
                <div className="p-4 bg-accent text-primary rounded-2xl shadow-lg"><Rocket className="h-8 w-8" /></div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-primary">Automated Accountability</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Monica, if you miss your daily call or email targets, the system will automatically send you a tactical audit at 6 PM. It will pre-select your top 5 leads for the next morning so you can start with momentum.
                  </p>
                </div>
              </CardContent>
            </Card>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
