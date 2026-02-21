
"use client"

import React, { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Database, 
  Building, 
  Mail, 
  RefreshCw, 
  Zap,
  Key,
  Smartphone,
  Globe,
  Home,
  BrainCircuit,
  PieChart
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useDoc, useMemoFirebase, useCollection, useFirestore } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";

export default function SettingsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Quota Data for APIs
  const month = new Date().toISOString().slice(0, 7);
  const quotaRef = useMemoFirebase(() => user ? `users/${user.uid}/rapidapi_quota/${month}` : null, [user, month]);
  const { data: quota } = useDoc(quotaRef);

  // AI Usage Data
  const aiUsageQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'ai_usage'), orderBy('called_at', 'desc'), limit(50));
  }, [firestore]);
  const { data: aiUsage } = useCollection(aiUsageQuery);

  const totalTokens = (aiUsage || []).reduce((acc, curr) => acc + (curr.total_tokens || 0), 0);
  const totalCalls = (aiUsage || []).length;

  const handleSaveSettings = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast({ title: "Settings Saved", description: "System configuration updated." });
    }, 800);
  }

  const bookmarkletCode = "javascript:(function(){var text=window.getSelection().toString()||document.body.innerText.substring(0,500);var url=window.location.href;window.open('https://monica-ai-hub.vercel.app/quick-capture?url='+encodeURIComponent(url)+'&text='+encodeURIComponent(text),'_blank','width=500,height=600');})();";

  if (!mounted) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-xl font-bold font-headline text-primary">System Settings</h1>
            <Button size="sm" className="ml-auto bg-primary" onClick={handleSaveSettings} disabled={saving}>
              {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </header>
          
          <main className="p-8 max-w-4xl mx-auto w-full">
            <Tabs defaultValue="ai">
              <TabsList className="mb-8 w-full justify-start gap-4 h-auto p-0 bg-transparent overflow-x-auto no-scrollbar">
                <TabsTrigger value="general" className="data-[state=active]:bg-secondary rounded-lg px-4 py-2">Business</TabsTrigger>
                <TabsTrigger value="ai" className="data-[state=active]:bg-secondary rounded-lg px-4 py-2 flex gap-2">
                  <BrainCircuit className="h-4 w-4" /> Grok AI Hub
                </TabsTrigger>
                <TabsTrigger value="apis" className="data-[state=active]:bg-secondary rounded-lg px-4 py-2 flex gap-2">
                  <Database className="h-4 w-4" /> Data Pipelines
                </TabsTrigger>
                <TabsTrigger value="free-sources" className="data-[state=active]:bg-secondary rounded-lg px-4 py-2">Quick Capture</TabsTrigger>
                <TabsTrigger value="outreach" className="data-[state=active]:bg-secondary rounded-lg px-4 py-2">Gmail API</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-6">
                <Card className="border-none shadow-md">
                  <CardHeader>
                    <CardTitle>Business Identity</CardTitle>
                    <CardDescription>Branding and contact details for automated outreach.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Agent Name</Label>
                        <Input defaultValue="Monica Selvaggio" />
                      </div>
                      <div className="space-y-2">
                        <Label>Brokerage Name</Label>
                        <Input defaultValue="Selvaggio Global Real Estate" />
                      </div>
                      <div className="space-y-2">
                        <Label>Business Phone</Label>
                        <Input defaultValue="(702) 555-0199" />
                      </div>
                      <div className="space-y-2">
                        <Label>Support Email</Label>
                        <Input defaultValue="monica@gmail.com" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ai" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="border-none shadow-md bg-gradient-to-br from-primary to-primary/90 text-white">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                          <Zap className="h-5 w-5 text-accent" />
                        </div>
                        <Badge className="bg-accent text-white border-none">Active</Badge>
                      </div>
                      <CardTitle className="text-lg mt-4">Grok-4 Latest</CardTitle>
                      <CardDescription className="text-white/70 text-xs">xAI OpenAI-Compatible Engine</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-end">
                        <span className="text-xs text-white/60">Calls this month</span>
                        <span className="text-2xl font-black">{totalCalls}</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-xs text-white/60">Tokens used</span>
                        <span className="text-2xl font-black">{totalTokens.toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-md">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <PieChart className="h-4 w-4 text-primary" />
                        Usage Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500">
                          <span>Monthly Budget</span>
                          <span>42%</span>
                        </div>
                        <Progress value={42} className="h-1.5" />
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-dashed text-[10px] text-slate-600 leading-relaxed italic">
                        "Your most used AI feature this week is **Email Drafting**, accounting for 64% of completion tokens."
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-none shadow-md">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      xAI Credentials
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase">Grok API Key</Label>
                      <Input type="password" value="••••••••••••••••" readOnly className="bg-slate-100" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase">Model</Label>
                      <Input value="grok-4-latest" readOnly className="bg-slate-100" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="apis" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="border-none shadow-md">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="p-2 bg-primary text-white rounded-lg shadow-sm">
                          <Globe className="h-5 w-5" />
                        </div>
                        <Badge className="bg-green-500">Connected</Badge>
                      </div>
                      <CardTitle className="text-lg mt-4">Trulia API</CardTitle>
                      <CardDescription className="text-xs">trulia5.p.rapidapi.com</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 bg-slate-50 rounded-xl border">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-700 mb-1.5 uppercase">
                          <span>Calls this month</span>
                          <span>{quota?.trulia_calls || 0}</span>
                        </div>
                        <Progress value={((quota?.trulia_calls || 0) / 500) * 100} className="h-1" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-md">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="p-2 bg-accent text-white rounded-lg shadow-sm">
                          <Home className="h-5 w-5" />
                        </div>
                        <Badge className="bg-green-500">Connected</Badge>
                      </div>
                      <CardTitle className="text-lg mt-4">Realtor.com API</CardTitle>
                      <CardDescription className="text-xs">realtor-stable.p.rapidapi.com</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 bg-slate-50 rounded-xl border">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-700 mb-1.5 uppercase">
                          <span>Calls this month</span>
                          <span>{quota?.realtor_calls || 0}</span>
                        </div>
                        <Progress value={((quota?.realtor_calls || 0) / 500) * 100} className="h-1" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="free-sources" className="space-y-6">
                <Card className="border-none shadow-md">
                  <CardHeader>
                    <CardTitle>Quick Capture Tool</CardTitle>
                    <CardDescription>Install the Monica bookmarklet to capture leads from any website.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                      <div className="h-12 w-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Zap className="h-6 w-6" />
                      </div>
                      <h3 className="font-bold text-primary mb-2">Install Bookmarklet</h3>
                      <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                        Drag this button to your bookmarks bar. Click it while on Nextdoor, Facebook, or any site to extract leads.
                      </p>
                      <a 
                        href={bookmarkletCode}
                        className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-bold shadow-md hover:scale-105 transition-transform"
                        onClick={(e) => e.preventDefault()}
                      >
                        <Smartphone className="h-4 w-4" />
                        Monica Quick Capture
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="outreach" className="space-y-6">
                <Card className="border-none shadow-md">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-primary text-white rounded-lg">
                        <Mail className="h-5 w-5" />
                      </div>
                      <Badge className="bg-green-500">Connected</Badge>
                    </div>
                    <CardTitle className="mt-4">Gmail API Integration</CardTitle>
                    <CardDescription>Powering your automated and manual email outreach.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Connected Gmail Account</Label>
                      <Input value="monica@gmail.com" readOnly className="bg-slate-100" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-dashed">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold">Artificial Delay</p>
                        <p className="text-xs text-muted-foreground">Randomized delay (2-5 mins) to mimic human behavior.</p>
                      </div>
                      <Switch checked />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
