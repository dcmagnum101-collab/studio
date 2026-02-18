
"use client"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Database, Link2, Globe, FileUp, ShieldCheck, Sparkles, Clock, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { toast } = useToast()

  const handleTestConnection = () => {
    toast({
      title: "ArchAgent Connection Successful",
      description: "Data stream is active. 47 new leads received today."
    })
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-xl font-bold font-headline text-primary">System Settings</h1>
          </header>
          
          <main className="p-8 max-w-4xl mx-auto w-full">
            <Tabs defaultValue="archagent">
              <TabsList className="mb-8 w-full justify-start gap-4 h-auto p-0 bg-transparent">
                <TabsTrigger value="general" className="data-[state=active]:bg-secondary rounded-lg px-4 py-2">General</TabsTrigger>
                <TabsTrigger value="archagent" className="data-[state=active]:bg-secondary rounded-lg px-4 py-2">ArchAgent Data</TabsTrigger>
                <TabsTrigger value="outreach" className="data-[state=active]:bg-secondary rounded-lg px-4 py-2">Outreach Config</TabsTrigger>
                <TabsTrigger value="notifications" className="data-[state=active]:bg-secondary rounded-lg px-4 py-2">Briefings</TabsTrigger>
              </TabsList>

              <TabsContent value="archagent" className="space-y-6">
                <Card className="border-none shadow-md">
                  <CardHeader className="bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary text-white rounded-lg shadow-sm">
                          <Globe className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle>ArchAgent Live Integration</CardTitle>
                          <CardDescription>Configure lead data sync via Webhook.</CardDescription>
                        </div>
                      </div>
                      <Badge className="bg-green-500 font-bold">Live & Connected</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="grid gap-2">
                      <Label htmlFor="webhook" className="font-bold">Webhook Endpoint</Label>
                      <div className="flex gap-2">
                        <Input id="webhook" value="https://monica-ai.com/api/webhooks/archagent/a88a2a" readOnly className="bg-slate-50 font-mono text-xs" />
                        <Button variant="outline" size="sm" onClick={() => {
                          navigator.clipboard.writeText("https://monica-ai.com/api/webhooks/archagent/a88a2a")
                          toast({ title: "Copied", description: "URL copied to clipboard" })
                        }}>Copy</Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Active Data Streams</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: 'FSBO Data', active: true },
                          { label: 'Expired Listings', active: true },
                          { label: 'FRBO Data', active: true },
                          { label: 'Preforeclosure Data', active: true },
                          { label: 'Neighborhood Data', active: true },
                          { label: 'Likely to List AI', active: true },
                        ].map((stream) => (
                          <div key={stream.label} className="flex items-center justify-between p-3 rounded-xl border bg-slate-50/30">
                            <span className="text-sm font-medium">{stream.label}</span>
                            <Switch defaultChecked={stream.active} />
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button className="w-full gap-2 font-bold py-6" variant="secondary" onClick={handleTestConnection}>
                      <RefreshCw className="h-4 w-4" /> Test Real-time Sync
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-accent text-white rounded-lg shadow-sm">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle>DNC Compliance Engine</CardTitle>
                        <CardDescription>Automatic filtering against national registries.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between py-2">
                      <div className="space-y-0.5">
                        <Label className="font-bold">Auto-Flag DNC Leads</Label>
                        <p className="text-xs text-muted-foreground">Automatically move DNC-flagged leads to restricted status.</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Database className="h-5 w-5 text-slate-400" />
                        <div>
                          <div className="text-xs font-bold text-slate-700">Protected Registry</div>
                          <div className="text-sm font-medium">4,281 Restricted Numbers</div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs font-bold">Update List</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6">
                <Card className="border-none shadow-md">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle>Morning Pipeline Briefing</CardTitle>
                        <CardDescription>Daily summary of fresh leads and top priorities.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="font-bold">Send Daily Briefing</Label>
                        <p className="text-xs text-muted-foreground">Receive a summary at the start of your business day.</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase">Briefing Time (PST)</Label>
                        <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                          <option>07:00 AM</option>
                          <option selected>08:00 AM</option>
                          <option>09:00 AM</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase">Notification Channel</Label>
                        <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                          <option>Email Only</option>
                          <option>SMS Only</option>
                          <option selected>Email & Dashboard</option>
                        </select>
                      </div>
                    </div>

                    <Button className="w-full gap-2 font-bold" variant="outline">
                      <Sparkles className="h-4 w-4" /> Preview Tomorrow's Briefing
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="outreach" className="space-y-6">
                <Card className="border-none shadow-md">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-600 text-white rounded-lg shadow-sm">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle>Sequence Auto-Assignment</CardTitle>
                        <CardDescription>Map lead sources to multi-touch outreach plans.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { source: 'Expired Listings', sequence: 'expired_urgent' },
                      { source: 'FSBO Leads', sequence: 'fsbo_3touch' },
                      { source: 'Preforeclosures', sequence: 'preforeclosure_empathy' },
                      { source: 'FRBO / Landlords', sequence: 'landlord_nurture' },
                      { source: 'Circle Prospects', sequence: 'circle_prospect' },
                      { source: 'Recommended', sequence: 'recommended_daily' },
                    ].map((item) => (
                      <div key={item.source} className="flex items-center justify-between p-4 rounded-xl border bg-slate-50/30">
                        <span className="text-sm font-bold">{item.source}</span>
                        <Badge variant="outline" className="bg-white font-mono text-[10px]">{item.sequence}</Badge>
                      </div>
                    ))}
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
