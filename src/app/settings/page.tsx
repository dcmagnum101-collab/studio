"use client"

import React, { useState } from "react";
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
  Globe, 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  Mail, 
  RefreshCw, 
  Search,
  Zap,
  Youtube,
  Key,
  Smartphone,
  Building
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false);

  const handleSaveSettings = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast({
        title: "Settings Saved",
        description: "Your Gmail and business configuration has been updated."
      })
    }, 800);
  }

  const bookmarkletCode = "javascript:(function(){var text=window.getSelection().toString()||document.body.innerText.substring(0,500);var url=window.location.href;window.open('https://monica-ai-hub.vercel.app/quick-capture?url='+encodeURIComponent(url)+'&text='+encodeURIComponent(text),'_blank','width=500,height=600');})();";

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
            <Tabs defaultValue="archagent">
              <TabsList className="mb-8 w-full justify-start gap-4 h-auto p-0 bg-transparent overflow-x-auto no-scrollbar">
                <TabsTrigger value="general" className="data-[state=active]:bg-secondary rounded-lg px-4 py-2">Business</TabsTrigger>
                <TabsTrigger value="archagent" className="data-[state=active]:bg-secondary rounded-lg px-4 py-2">ArchAgent</TabsTrigger>
                <TabsTrigger value="free-sources" className="data-[state=active]:bg-secondary rounded-lg px-4 py-2 flex gap-2">
                  <Database className="h-4 w-4" /> Free Sources
                </TabsTrigger>
                <TabsTrigger value="outreach" className="data-[state=active]:bg-secondary rounded-lg px-4 py-2">Gmail API</TabsTrigger>
                <TabsTrigger value="notifications" className="data-[state=active]:bg-secondary rounded-lg px-4 py-2">Briefings</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-6">
                <Card className="border-none shadow-md">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary text-white rounded-lg shadow-sm">
                        <Building className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle>Brokerage & Brand</CardTitle>
                        <CardDescription>Configuration for branded email templates and signatures.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase">Business Phone</Label>
                        <Input placeholder="(702) 555-0199" className="bg-slate-50" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase">Brokerage Name</Label>
                        <Input placeholder="Selvaggio Global Real Estate" className="bg-slate-50" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase">Public Calendar Link</Label>
                      <Input placeholder="https://calendly.com/monica-selvaggio" className="bg-slate-50" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="free-sources" className="space-y-6">
                <Card className="border-none shadow-md">
                  <CardHeader className="bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-accent text-white rounded-lg shadow-sm">
                        <Zap className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle>Quick Capture Bookmarklet</CardTitle>
                        <CardDescription>Install the bookmarklet to capture leads directly from social media.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300 flex flex-col items-center gap-4 text-center">
                      <p className="text-xs text-muted-foreground max-w-sm">Drag the button below to your browser's bookmarks bar. Click it while on Facebook, Nextdoor, or LinkedIn to instantly send leads to Monica.</p>
                      <a 
                        href={bookmarkletCode} 
                        className="px-6 py-3 bg-primary text-white rounded-full font-bold text-sm shadow-lg hover:scale-105 transition-transform inline-flex items-center gap-2"
                        onClick={(e) => e.preventDefault()}
                      >
                        <Sparkles className="h-4 w-4" /> Monica Quick Capture
                      </a>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary text-white rounded-lg">
                        <Database className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle>Public Data Pipelines</CardTitle>
                        <CardDescription>Manage automated free data source integrations (Non-SendGrid).</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      {[
                        { label: 'HUD Foreclosures (Direct)', active: true },
                        { label: 'Fannie Mae REO (Feed)', active: true },
                        { label: 'Clark County Divorce (Public)', active: true },
                        { label: 'NV Business Closures', active: false },
                        { label: 'USPS Vacancy Tracking', active: true },
                        { label: 'YouTube Comment Intel', active: true },
                        { label: 'Realtor Open Houses', active: true },
                        { label: 'Wayback Machine Sync', active: true },
                      ].map((source) => (
                        <div key={source.label} className="flex items-center justify-between p-3 rounded-xl border bg-slate-50/30">
                          <span className="text-sm font-medium">{source.label}</span>
                          <Switch defaultChecked={source.active} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="outreach" className="space-y-6">
                <Card className="border-none shadow-md">
                  <CardHeader className="bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary text-white rounded-lg shadow-sm">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle>Gmail Integration (Nodemailer)</CardTitle>
                        <CardDescription>Configure your Gmail account for AI-powered outreach.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label className="font-bold flex items-center gap-2"><Mail className="h-3 w-3" /> Gmail User Address</Label>
                        <Input placeholder="monica@gmail.com" className="bg-slate-50" />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold flex items-center gap-2"><Key className="h-3 w-3" /> App Password</Label>
                        <Input type="password" placeholder="xxxx xxxx xxxx xxxx" className="bg-slate-50" />
                        <p className="text-[10px] text-muted-foreground">Generate this in your Google Account security settings under "App Passwords".</p>
                      </div>
                    </div>
                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                      <div className="flex justify-between items-center text-xs font-bold text-primary mb-2">
                        <span>Daily Outreach Quota</span>
                        <span>0 / 500 Used</span>
                      </div>
                      <Progress value={0} className="h-1.5" />
                    </div>
                    <Button variant="secondary" className="w-full gap-2 font-bold py-6">
                      <RefreshCw className="h-4 w-4" /> Verify Connection
                    </Button>
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
                        <CardDescription>Daily summary of fresh leads and top priorities sent to Monica's Gmail.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="font-bold">Send Daily Briefing</Label>
                        <p className="text-xs text-muted-foreground">Receive a summary at the start of your business day via Gmail.</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase">Briefing Time (PST)</Label>
                        <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                          <option>07:00 AM</option>
                          <option value="08:00 AM">08:00 AM</option>
                          <option>09:00 AM</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase">Notification Channel</Label>
                        <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                          <option value="Email & Dashboard">Gmail & Dashboard</option>
                          <option>Email Only</option>
                          <option>Dashboard Only</option>
                        </select>
                      </div>
                    </div>

                    <Button className="w-full gap-2 font-bold" variant="outline">
                      <Sparkles className="h-4 w-4" /> Preview Tomorrow's Gmail Briefing
                    </Button>
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
