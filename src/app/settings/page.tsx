
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
  Mail, 
  RefreshCw, 
  Zap,
  BrainCircuit,
  PieChart,
  CheckCircle2,
  PhoneCall,
  Download,
  Upload,
  FileSpreadsheet,
  Globe,
  Home
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useDoc, useMemoFirebase, useCollection, useFirestore } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { syncVulcan7Leads, getContactsForVulcan7Export, pushToVulcan7DialQueue } from "@/app/actions/vulcan7";
import { connectGmailAccount } from "@/firebase/auth/gmail-auth";

export default function SettingsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [syncingVulcan, setSyncingVulcan] = useState(false);
  const [exportingQueue, setExportingQueue] = useState(false);
  const [connectingGmail, setConnectingGmail] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const handleConnectGmail = async () => {
    if (!user) return;
    setConnectingGmail(true);
    try {
      await connectGmailAccount(user.uid);
      toast({ title: "Gmail Connected", description: "Successfully linked your Google account." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Connection Failed", description: err.message });
    } finally {
      setConnectingGmail(false);
    }
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
        toast({ title: "Queue Empty", description: "No leads meet dialing criteria." });
        return;
      }
      const csv = await pushToVulcan7DialQueue(user.uid, contactIds);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `monica_dial_queue.csv`;
      document.body.appendChild(a);
      a.click();
      toast({ title: "Export Ready", description: "Dial queue prepared." });
    } catch (err) {
      toast({ variant: "destructive", title: "Export Failed", description: "Error generating CSV." });
    } finally {
      setExportingQueue(false);
    }
  };

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
                        <Badge variant="outline" className="text-slate-400">Disconnected</Badge>
                      )}
                    </div>
                    <CardTitle className="mt-4">Gmail API Connection</CardTitle>
                    <CardDescription>Grant Monica permission to handle your seller outreach directly through your business account.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {!gmailConfig ? (
                      <div className="p-8 border-2 border-dashed rounded-2xl bg-slate-50 text-center space-y-4">
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto italic">Monica uses secure Google OAuth to sync threads and send authenticated follow-ups.</p>
                        <Button onClick={handleConnectGmail} disabled={connectingGmail} className="bg-primary px-8">
                          {connectingGmail ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Globe className="h-4 w-4 mr-2" />}
                          Connect Business Gmail
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-xl border flex justify-between items-center">
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase text-slate-500">Linked Account</Label>
                            <p className="text-sm font-bold text-primary">{gmailConfig.connectedEmail}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={handleConnectGmail} className="text-xs">Re-link</Button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold">Artificial Send Delay</p>
                            <p className="text-xs text-muted-foreground">Randomly wait 2-5 mins between automated emails to look human.</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="vulcan7" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="border-none shadow-md">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Upload className="h-4 w-4 text-primary" />
                        Lead Sync
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-8 border-2 border-dashed rounded-2xl bg-slate-50 text-center space-y-4 relative">
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
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Upload Vulcan7 Session CSV</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-md">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Download className="h-4 w-4 text-primary" />
                        Dial Queue
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={handleExportDialQueue} 
                        disabled={exportingQueue} 
                        className="w-full bg-accent hover:bg-accent/90 text-primary font-bold h-12"
                      >
                        Export Hot Leads (CSV)
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* ... other tabs ... */}
            </Tabs>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
