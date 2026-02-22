
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
import { 
  Database, 
  Mail, 
  RefreshCw, 
  Zap,
  BrainCircuit,
  CheckCircle2,
  PhoneCall,
  Download,
  Upload,
  FileSpreadsheet,
  Globe,
  Clock,
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useDoc, useMemoFirebase, useCollection, useFirestore } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { syncVulcan7Leads, getContactsForVulcan7Export, pushToVulcan7DialQueue } from "@/app/actions/vulcan7";
import { connectGmailAccount } from "@/firebase/auth/gmail-auth";

export default function SettingsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [syncingVulcan, setSyncingVulcan] = useState(false);
  const [exportingQueue, setExportingQueue] = useState(false);
  const [connectingGmail, setConnectingGmail] = useState(false);
  const [runningCadence, setRunningCadence] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const gmailRef = useMemoFirebase(() => user ? `users/${user.uid}/integrations/gmail` : null, [user]);
  const { data: gmailConfig } = useDoc(gmailRef);

  const handleSaveSettings = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast({ title: "Settings Saved", description: "System configuration updated." });
    }, 800);
  }

  const handleRunCadenceManually = async () => {
    if (!user) return;
    setRunningCadence(true);
    try {
      const res = await fetch('/api/run-cadence', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'dev-secret'}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user.uid })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast({ 
        title: "Automation Complete", 
        description: `Successfully processed cadences. Created ${data.tasksCreated} new follow-up tasks.` 
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Automation Failed", description: err.message });
    } finally {
      setRunningCadence(false);
    }
  };

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
            <Tabs defaultValue="automation">
              <TabsList className="mb-8 w-full justify-start gap-4 h-auto p-0 bg-transparent overflow-x-auto no-scrollbar">
                <TabsTrigger value="automation" className="data-[state=active]:bg-secondary rounded-lg px-4 py-2 flex gap-2">
                  <Zap className="h-4 w-4" /> Automation
                </TabsTrigger>
                <TabsTrigger value="vulcan7" className="data-[state=active]:bg-secondary rounded-lg px-4 py-2 flex gap-2">
                  <PhoneCall className="h-4 w-4" /> Vulcan7
                </TabsTrigger>
                <TabsTrigger value="outreach" className="data-[state=active]:bg-secondary rounded-lg px-4 py-2 flex gap-2">
                  <Mail className="h-4 w-4" /> Gmail API
                </TabsTrigger>
                <TabsTrigger value="ai" className="data-[state=active]:bg-secondary rounded-lg px-4 py-2 flex gap-2">
                  <BrainCircuit className="h-4 w-4" /> Grok AI Hub
                </TabsTrigger>
              </TabsList>

              <TabsContent value="automation" className="space-y-6">
                <Card className="border-none shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-accent" />
                      Follow-up Cadence Engine
                    </CardTitle>
                    <CardDescription>Monica automatically scans your contacts every morning to advance follow-up stages.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-6 bg-slate-50 rounded-2xl border space-y-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Webhook Configuration</Label>
                        <div className="flex items-center gap-2 bg-white p-3 rounded-xl border">
                          <code className="text-xs font-mono text-primary flex-1">https://monica-hub.ai/api/run-cadence</code>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="h-4 w-4" /></Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        To automate this, set up a **Make.com** or **Zapier** scenario to send a POST request to this URL every morning at 7:00 AM. Ensure you include the user ID in the body and your secret token in the headers.
                      </p>
                      <Button 
                        onClick={handleRunCadenceManually} 
                        disabled={runningCadence}
                        className="w-full bg-accent hover:bg-accent/90 text-primary font-bold shadow-lg shadow-accent/10"
                      >
                        {runningCadence ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                        Run Cadence Logic Now
                      </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="font-bold">Auto-Nurture Emails</Label>
                          <Switch defaultChecked />
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed">Automatically send cadence emails when they are due (requires Gmail connection).</p>
                      </div>
                      <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="font-bold">Quarterly Nurture</Label>
                          <Switch defaultChecked />
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed">Move leads to long-term quarterly follow-up after cadence completion.</p>
                      </div>
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
            </Tabs>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
