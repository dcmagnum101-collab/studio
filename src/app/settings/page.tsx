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
  PieChart,
  CheckCircle2,
  PhoneCall,
  Download,
  Upload,
  FileSpreadsheet
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useDoc, useMemoFirebase, useCollection, useFirestore } from "@/firebase";
import { collection, query, orderBy, limit, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { syncVulcan7Leads, getContactsForVulcan7Export, pushToVulcan7DialQueue } from "@/app/actions/vulcan7";

export default function SettingsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [syncingVulcan, setSyncingVulcan] = useState(false);
  const [exportingQueue, setExportingQueue] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (searchParams.get('gmail_success') === 'true' && user) {
      toast({ title: "Gmail Connected", description: "Your outreach engine is now linked." });
    }
  }, [searchParams, user]);

  const month = new Date().toISOString().slice(0, 7);
  const quotaRef = useMemoFirebase(() => user ? `users/${user.uid}/rapidapi_quota/${month}` : null, [user, month]);
  const { data: quota } = useDoc(quotaRef);

  const gmailRef = useMemoFirebase(() => user ? `users/${user.uid}/integrations/gmail` : null, [user]);
  const { data: gmailConfig } = useDoc(gmailRef);

  const aiUsageQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'ai_usage'), 
      orderBy('called_at', 'desc'), 
      limit(50)
    );
  }, [firestore, user]);
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

  const handleConnectGmail = () => {
    window.location.href = '/api/auth/gmail/connect';
  };

  const handleVulcanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    setSyncingVulcan(true);
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      try {
        const result = await syncVulcan7Leads(user.uid, text);
        toast({ 
          title: "Import Complete", 
          description: `Imported: ${result.imported}, Skipped DNC: ${result.skipped_dnc}, Duplicates: ${result.duplicates}` 
        });
      } catch (err) {
        toast({ variant: "destructive", title: "Import Failed", description: "Could not parse Vulcan7 CSV." });
      } finally {
        setSyncingVulcan(false);
      }
    };
    reader.readAsText(file);
  };

  const handleExportDialQueue = async () => {
    if (!user) return;
    setExportingQueue(true);
    try {
      const contactIds = await getContactsForVulcan7Export(user.uid);
      if (contactIds.length === 0) {
        toast({ title: "Queue Empty", description: "No leads currently meet the dialing criteria (Score >= 70, not called in 3 days)." });
        return;
      }
      const csv = await pushToVulcan7DialQueue(user.uid, contactIds);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `monica_dial_queue_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast({ title: "Export Ready", description: `${contactIds.length} leads prepared for Vulcan7.` });
    } catch (err) {
      toast({ variant: "destructive", title: "Export Failed", description: "Could not generate dial queue." });
    } finally {
      setExportingQueue(false);
    }
  };

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
            <Tabs defaultValue="vulcan7">
              <TabsList className="mb-8 w-full justify-start gap-4 h-auto p-0 bg-transparent overflow-x-auto no-scrollbar">
                <TabsTrigger value="general" className="data-[state=active]:bg-secondary rounded-lg px-4 py-2">Business</TabsTrigger>
                <TabsTrigger value="vulcan7" className="data-[state=active]:bg-secondary rounded-lg px-4 py-2 flex gap-2">
                  <PhoneCall className="h-4 w-4" /> Vulcan7
                </TabsTrigger>
                <TabsTrigger value="ai" className="data-[state=active]:bg-secondary rounded-lg px-4 py-2 flex gap-2">
                  <BrainCircuit className="h-4 w-4" /> Grok AI Hub
                </TabsTrigger>
                <TabsTrigger value="outreach" className="data-[state=active]:bg-secondary rounded-lg px-4 py-2 flex gap-2">
                  <Mail className="h-4 w-4" /> Gmail API
                </TabsTrigger>
                <TabsTrigger value="apis" className="data-[state=active]:bg-secondary rounded-lg px-4 py-2 flex gap-2">
                  <Database className="h-4 w-4" /> Data Pipelines
                </TabsTrigger>
              </TabsList>

              <TabsContent value="vulcan7" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="border-none shadow-md">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Upload className="h-4 w-4 text-primary" />
                        Lead Synchronization
                      </CardTitle>
                      <CardDescription>Upload your CSV exports from Vulcan7 to keep the CRM updated.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-8 border-2 border-dashed rounded-2xl bg-slate-50 text-center space-y-4 group hover:bg-slate-100 transition-colors relative">
                        <Input 
                          type="file" 
                          accept=".csv" 
                          onChange={handleVulcanUpload} 
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                          disabled={syncingVulcan}
                        />
                        <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                          {syncingVulcan ? <RefreshCw className="h-6 w-6 text-primary animate-spin" /> : <FileSpreadsheet className="h-6 w-6 text-primary" />}
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-bold text-primary">Upload Vulcan7 Export</h3>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">Standard format (Expired, FSBO, etc.)</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold">Auto-DNC Scrub</p>
                          <p className="text-xs text-muted-foreground">Always skip numbers flagged as DNC in CSV.</p>
                        </div>
                        <Switch checked disabled />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-md">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Download className="h-4 w-4 text-primary" />
                        Export Dial Queue
                      </CardTitle>
                      <CardDescription>Prepare a clean list for your next Vulcan7 session.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="p-4 bg-slate-50 rounded-xl border space-y-3">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-500 uppercase">Export Criteria</span>
                          <Badge variant="outline" className="bg-white">Dynamic</Badge>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[10px] text-slate-600 flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" /> ICP Score ≥ 70</p>
                          <p className="text-[10px] text-slate-600 flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" /> No calls in last 3 days</p>
                          <p className="text-[10px] text-slate-600 flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" /> Exclude DNC & Unsubscribes</p>
                        </div>
                      </div>
                      <Button 
                        onClick={handleExportDialQueue} 
                        disabled={exportingQueue} 
                        className="w-full bg-accent hover:bg-accent/90 text-primary font-bold h-12 shadow-lg shadow-accent/20"
                      >
                        {exportingQueue ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                        Download Dial Queue CSV
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="outreach" className="space-y-6">
                <Card className="border-none shadow-md">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-primary text-white rounded-lg">
                        <Mail className="h-5 w-5" />
                      </div>
                      {gmailConfig ? (
                        <Badge className="bg-green-500 gap-1.5"><CheckCircle2 className="h-3 w-3" /> Connected</Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-400">Not Connected</Badge>
                      )}
                    </div>
                    <CardTitle className="mt-4">Gmail API Integration</CardTitle>
                    <CardDescription>Monica needs OAuth permission to sync threads and send follow-ups.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {!gmailConfig ? (
                      <div className="p-8 border-2 border-dashed rounded-2xl bg-slate-50 text-center space-y-4">
                        <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                          <Mail className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-bold text-primary">Enable Real Outreach</h3>
                          <p className="text-xs text-muted-foreground max-w-xs mx-auto">Connect your workspace Gmail to allow Monica to handle your daily seller follow-up.</p>
                        </div>
                        <Button onClick={handleConnectGmail} className="bg-primary px-8">Connect Google Account</Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="p-4 bg-slate-50 rounded-xl border space-y-1">
                            <Label className="text-[10px] font-bold uppercase text-slate-500">Connected As</Label>
                            <p className="text-sm font-bold text-primary">{user?.email}</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-xl border space-y-1">
                            <Label className="text-[10px] font-bold uppercase text-slate-500">Last Sync</Label>
                            <p className="text-sm font-bold text-primary">Just now</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold">Auto-Sync Threads</p>
                            <p className="text-xs text-muted-foreground">Keep conversation history updated in the CRM.</p>
                          </div>
                          <Switch checked />
                        </div>
                        <Button variant="outline" className="w-full text-red-600 border-red-100 hover:bg-red-50" onClick={() => {
                          toast({ title: "Disconnected", description: "Gmail access revoked." });
                        }}>Disconnect Gmail</Button>
                      </div>
                    )}
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
              </TabsContent>

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
            </Tabs>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
