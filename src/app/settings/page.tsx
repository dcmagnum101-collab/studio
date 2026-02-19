
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
import { Progress } from "@/components/ui/progress";
import { 
  Database, 
  Building, 
  Mail, 
  RefreshCw, 
  Zap,
  Key,
  Sparkles,
  Smartphone,
  Globe,
  Home
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useDoc, useMemoFirebase } from "@/firebase";

export default function SettingsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  // Quota Data
  const month = new Date().toISOString().slice(0, 7);
  const quotaRef = useMemoFirebase(() => user ? `users/${user.uid}/rapidapi_quota/${month}` : null, [user, month]);
  const { data: quota } = useDoc(quotaRef);

  const handleSaveSettings = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast({ title: "Settings Saved", description: "System configuration updated." });
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
            <Tabs defaultValue="apis">
              <TabsList className="mb-8 w-full justify-start gap-4 h-auto p-0 bg-transparent overflow-x-auto no-scrollbar">
                <TabsTrigger value="general" className="data-[state=active]:bg-secondary rounded-lg px-4 py-2">Business</TabsTrigger>
                <TabsTrigger value="apis" className="data-[state=active]:bg-secondary rounded-lg px-4 py-2 flex gap-2">
                  <Database className="h-4 w-4" /> Data Pipelines
                </TabsTrigger>
                <TabsTrigger value="free-sources" className="data-[state=active]:bg-secondary rounded-lg px-4 py-2">Quick Capture</TabsTrigger>
                <TabsTrigger value="outreach" className="data-[state=active]:bg-secondary rounded-lg px-4 py-2">Gmail API</TabsTrigger>
              </TabsList>

              <TabsContent value="apis" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Trulia API Card */}
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
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                        <RefreshCw className="h-3 w-3" />
                        Last sync: {quota?.updated_at ? new Date(quota.updated_at.toDate()).toLocaleString() : 'Never'}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Realtor API Card */}
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
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                        <RefreshCw className="h-3 w-3" />
                        Last sync: {quota?.updated_at ? new Date(quota.updated_at.toDate()).toLocaleString() : 'Never'}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-none shadow-md mt-6">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      API Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase">Trulia RapidAPI Key</Label>
                        <Input type="password" value="••••••••••••••••" readOnly className="bg-slate-100" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase">Realtor RapidAPI Key</Label>
                        <Input type="password" value="••••••••••••••••" readOnly className="bg-slate-100" />
                      </div>
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
                      </div>
                    </div>
                    <Button variant="secondary" className="w-full gap-2 font-bold py-6">
                      <RefreshCw className="h-4 w-4" /> Verify Connection
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
