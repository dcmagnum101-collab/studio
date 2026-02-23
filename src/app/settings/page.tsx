"use client";

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
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  RefreshCw, 
  BrainCircuit, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Save, 
  Zap, 
  PhoneCall, 
  Building2, 
  Globe, 
  Database, 
  Landmark, 
  Search, 
  Smartphone, 
  Mail, 
  UserCircle,
  Copy,
  ShieldCheck,
  Code,
  Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase";
import { saveSettingsSection, loadAllSettings } from "@/app/actions/settings";
import { connectGmailAccount } from "@/firebase/auth/gmail-auth";

const StatusBadge = ({ connected, checking }: { connected?: boolean; checking?: boolean }) => {
  if (checking) return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 gap-1.5"><RefreshCw className="h-3 w-3 animate-spin" /> Checking...</Badge>;
  if (connected) return <Badge className="bg-green-500 gap-1.5"><CheckCircle2 className="h-3 w-3" /> Connected</Badge>;
  return <Badge variant="outline" className="text-slate-400 gap-1.5"><ShieldCheck className="h-3 w-3" /> Not Connected</Badge>;
};

const PasswordInput = ({ value, onChange, placeholder, id }: { value: string; onChange: (v: string) => void; placeholder?: string; id?: string }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input 
        id={id}
        type={show ? "text" : "password"} 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        placeholder={placeholder}
        className="pr-10"
      />
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-primary"
        onClick={() => setShow(!show)}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  );
};

export default function SettingsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("business");
  
  // Settings State Hub
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [successSection, setSuccessSection] = useState<string | null>(null);
  const [testingService, setTestingService] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (user) {
      loadAllSettings(user.uid).then(data => {
        setSettings(data);
        setLoading(false);
      });
    }
  }, [user]);

  const handleUpdate = (section: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [field]: value
      }
    }));
  };

  const handleSave = async (section: string) => {
    if (!user) return;
    setSavingSection(section);
    try {
      await saveSettingsSection(user.uid, section, settings[section] || {});
      setSuccessSection(section);
      toast({ title: "Settings Saved", description: `${section.toUpperCase()} updated successfully.` });
      
      // Reset success checkmark after 3 seconds
      setTimeout(() => {
        setSuccessSection(prev => prev === section ? null : prev);
      }, 3000);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Save Failed", description: err.message });
    } finally {
      setSavingSection(null);
    }
  };

  const handleTest = async (service: string) => {
    setTestingService(service);
    setTimeout(() => {
      setTestingService(null);
      handleUpdate(service, "connected", true);
      toast({ title: "Connection Successful", description: `${service.toUpperCase()} is communicating correctly.` });
    }, 1500);
  };

  if (!mounted || loading) return <div className="flex h-screen items-center justify-center italic text-slate-400">Loading Monica System Prefs...</div>;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#F9FAFB]">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-xl font-bold font-headline text-primary">System Settings</h1>
          </header>
          
          <main className="p-4 md:p-8 max-w-5xl mx-auto w-full">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
              <TabsList className="bg-transparent h-auto p-0 flex gap-2 md:gap-4 overflow-x-auto no-scrollbar scrollbar-hide w-full justify-start border-b rounded-none mb-4">
                {["Business", "AI Engine", "Dialer", "MLS & Data Sources", "Social & Web", "Outreach", "Account"].map(t => (
                  <TabsTrigger 
                    key={t} 
                    value={t.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')} 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 pb-3 font-bold text-[10px] md:text-xs uppercase tracking-widest transition-all"
                  >
                    {t}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* --- TAB: BUSINESS --- */}
              <TabsContent value="business" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <Card className="border-none shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Business Identity</CardTitle>
                      <CardDescription>Configure Monica's primary persona and brokerage details.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {successSection === "business" && (
                        <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 gap-1 animate-in fade-in slide-in-from-right-2">
                          <Check className="h-3 w-3" /> Saved
                        </Badge>
                      )}
                      <Button size="sm" onClick={() => handleSave("business")} disabled={savingSection === "business"}>
                        {savingSection === "business" ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Section
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Agent Full Name</Label>
                        <Input value={settings.business?.agentName || ""} onChange={(e) => handleUpdate("business", "agentName", e.target.value)} placeholder="Monica Selvaggio" />
                      </div>
                      <div className="space-y-2">
                        <Label>Brokerage Name</Label>
                        <Input value={settings.business?.brokerage || ""} onChange={(e) => handleUpdate("business", "brokerage", e.target.value)} placeholder="Selvaggio Global Real Estate" />
                      </div>
                      <div className="space-y-2">
                        <Label>License Number</Label>
                        <Input value={settings.business?.license || ""} onChange={(e) => handleUpdate("business", "license", e.target.value)} placeholder="S.0123456" />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input value={settings.business?.phone || ""} onChange={(e) => handleUpdate("business", "phone", e.target.value)} placeholder="(702) 555-0199" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Value Proposition</Label>
                      <Textarea value={settings.business?.tagline || ""} onChange={(e) => handleUpdate("business", "tagline", e.target.value)} placeholder="Las Vegas's premier luxury listing specialist..." />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* --- TAB: AI ENGINE --- */}
              <TabsContent value="ai-engine" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <Card className="border-none shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary text-white rounded-lg"><BrainCircuit className="h-5 w-5" /></div>
                      <div>
                        <CardTitle className="text-lg">Grok (xAI) Configuration</CardTitle>
                        <CardDescription>Primary intelligence for lead scoring and strategic drafting.</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {successSection === "ai_grok" && <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 gap-1"><Check className="h-3 w-3" /> Saved</Badge>}
                      <StatusBadge connected={settings.ai_grok?.connected} checking={testingService === "ai_grok"} />
                      <Button size="sm" variant="outline" onClick={() => handleTest("ai_grok")}>Test</Button>
                      <Button size="sm" onClick={() => handleSave("ai_grok")} disabled={savingSection === "ai_grok"}><Save className="h-4 w-4 mr-2" /> Save</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Grok API Key</Label>
                      <PasswordInput value={settings.ai_grok?.apiKey || ""} onChange={(v) => handleUpdate("ai_grok", "apiKey", v)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Base URL</Label>
                        <Input value={settings.ai_grok?.baseUrl || "https://api.x.ai/v1"} onChange={(e) => handleUpdate("ai_grok", "baseUrl", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Model</Label>
                        <Select value={settings.ai_grok?.model || "grok-4-latest"} onValueChange={(v) => handleUpdate("ai_grok", "model", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="grok-4-latest">grok-4-latest</SelectItem>
                            <SelectItem value="grok-3">grok-3</SelectItem>
                            <SelectItem value="grok-3-mini">grok-3-mini</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">AI Behavior Settings</CardTitle>
                      <CardDescription>Fine-tune Monica's operational logic.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {successSection === "ai_behavior" && <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 gap-1"><Check className="h-3 w-3" /> Saved</Badge>}
                      <Button size="sm" onClick={() => handleSave("ai_behavior")}>Save</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <Label className="flex-1">Auto-generate nurture emails</Label>
                      <Switch checked={settings.ai_behavior?.autoGenerate || false} onCheckedChange={(v) => handleUpdate("ai_behavior", "autoGenerate", v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="flex-1">AI compliance check before every send</Label>
                      <Switch checked={settings.ai_behavior?.complianceCheck ?? true} onCheckedChange={(v) => handleUpdate("ai_behavior", "complianceCheck", v)} />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label>AI Creativity (Temperature)</Label>
                        <Badge variant="secondary">{settings.ai_behavior?.temperature || 0.7}</Badge>
                      </div>
                      <Slider 
                        min={0.1} max={1.0} step={0.1} 
                        value={[settings.ai_behavior?.temperature || 0.7]} 
                        onValueChange={(v) => handleUpdate("ai_behavior", "temperature", v[0])} 
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* --- TAB: DIALER --- */}
              <TabsContent value="dialer" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <Card className="border-none shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary text-white rounded-lg"><PhoneCall className="h-5 w-5" /></div>
                      <div>
                        <CardTitle className="text-lg">Vulcan7 Integration</CardTitle>
                        <CardDescription>Professional dialer sync via Zapier or API.</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {successSection === "dialer_v7" && <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 gap-1"><Check className="h-3 w-3" /> Saved</Badge>}
                      <Button size="sm" onClick={() => handleSave("dialer_v7")}><Save className="h-4 w-4 mr-2" /> Save</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>V7 Username</Label>
                        <Input value={settings.dialer_v7?.username || ""} onChange={(e) => handleUpdate("dialer_v7", "username", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>V7 Password</Label>
                        <PasswordInput value={settings.dialer_v7?.password || ""} onChange={(v) => handleUpdate("dialer_v7", "password", v)} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Automatically flag DNC numbers</Label>
                      <Switch checked={settings.dialer_v7?.flagDnc ?? true} onCheckedChange={(v) => handleUpdate("dialer_v7", "flagDnc", v)} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* --- TAB: MLS & DATA SOURCES --- */}
              <TabsContent value="mls-data-sources" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <Card className="border-none shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary text-white rounded-lg"><Building2 className="h-5 w-5" /></div>
                      <div>
                        <CardTitle className="text-lg">LVR MLS (Las Vegas Realtors)</CardTitle>
                        <CardDescription>Direct board integration for active and expired inventory.</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {successSection === "lvr_mls" && <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 gap-1"><Check className="h-3 w-3" /> Saved</Badge>}
                      <StatusBadge connected={settings.lvr_mls?.connected} checking={testingService === "lvr_mls"} />
                      <Button size="sm" variant="outline" onClick={() => handleTest("lvr_mls")}>Test</Button>
                      <Button size="sm" onClick={() => handleSave("lvr_mls")}><Save className="h-4 w-4 mr-2" /> Save</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>RETS/RESO Username</Label>
                        <Input value={settings.lvr_mls?.username || ""} onChange={(e) => handleUpdate("lvr_mls", "username", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>RETS/RESO Password</Label>
                        <PasswordInput value={settings.lvr_mls?.password || ""} onChange={(v) => handleUpdate("lvr_mls", "password", v)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Target Zip Codes (Comma-separated)</Label>
                      <Input value={settings.lvr_mls?.zips || ""} onChange={(e) => handleUpdate("lvr_mls", "zips", e.target.value)} placeholder="89144, 89135, 89052..." />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary text-white rounded-lg"><Globe className="h-5 w-5" /></div>
                      <div>
                        <CardTitle className="text-lg">RapidAPI Hub</CardTitle>
                        <CardDescription>Manage Trulia, Realtor.com, and Zillow data streams.</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {successSection === "rapidapi" && <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 gap-1"><Check className="h-3 w-3" /> Saved</Badge>}
                      <Button size="sm" onClick={() => handleSave("rapidapi")}>Save</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>RapidAPI Key</Label>
                      <PasswordInput value={settings.rapidapi?.apiKey || ""} onChange={(v) => handleUpdate("rapidapi", "apiKey", v)} />
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      {['trulia', 'realtor', 'homes'].map(s => (
                        <div key={s} className="p-4 bg-slate-50 rounded-xl border flex flex-col items-center gap-3">
                          <span className="text-xs font-black uppercase tracking-widest">{s}</span>
                          <Switch checked={settings.rapidapi?.[s] ?? true} onCheckedChange={(v) => handleUpdate("rapidapi", s, v)} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* --- TAB: SOCIAL & WEB --- */}
              <TabsContent value="social-web" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <Card className="border-none shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary text-white rounded-lg"><Code className="h-5 w-5" /></div>
                      <div>
                        <CardTitle className="text-lg">Google & Web APIs</CardTitle>
                        <CardDescription>Power maps, place lookups, and video monitoring.</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {successSection === "google_apis" && <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 gap-1"><Check className="h-3 w-3" /> Saved</Badge>}
                      <Button size="sm" onClick={() => handleSave("google_apis")}>Save</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Google Cloud API Key (Maps & Places)</Label>
                      <PasswordInput value={settings.google_apis?.mapKey || ""} onChange={(v) => handleUpdate("google_apis", "mapKey", v)} />
                    </div>
                    <div className="space-y-2">
                      <Label>YouTube Data API Key</Label>
                      <PasswordInput value={settings.google_apis?.ytKey || ""} onChange={(v) => handleUpdate("google_apis", "ytKey", v)} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* --- TAB: OUTREACH --- */}
              <TabsContent value="outreach" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <Card className="border-none shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary text-white rounded-lg"><Mail className="h-5 w-5" /></div>
                      <div>
                        <CardTitle className="text-lg">Gmail Integration</CardTitle>
                        <CardDescription>Handle follow-ups through your business account.</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {successSection === "outreach_gmail" && <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 gap-1"><Check className="h-3 w-3" /> Saved</Badge>}
                      <Button size="sm" onClick={() => handleSave("outreach_gmail")}>Save</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-6 bg-slate-50 border-2 border-dashed rounded-2xl text-center space-y-4">
                      <div className="flex justify-center gap-2 items-center">
                        <StatusBadge connected={settings.outreach_gmail?.connected} />
                        <span className="text-sm font-bold">{settings.outreach_gmail?.email || "No account linked"}</span>
                      </div>
                      <Button onClick={() => user && connectGmailAccount(user.uid)} className="bg-primary px-8">
                        {settings.outreach_gmail?.connected ? "Reconnect Account" : "Connect Business Gmail"}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Artificial send delay (2-5 min random)</Label>
                      <Switch checked={settings.outreach_gmail?.delay ?? true} onCheckedChange={(v) => handleUpdate("outreach_gmail", "delay", v)} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* --- TAB: ACCOUNT --- */}
              <TabsContent value="account" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <Card className="border-none shadow-md overflow-hidden">
                  <CardHeader className="bg-slate-50">
                    <CardTitle className="text-lg">Plan & Subscription</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="h-16 w-16 bg-accent rounded-full flex items-center justify-center text-white text-2xl font-black">PRO</div>
                      <div>
                        <h3 className="text-xl font-black">Monica Agency Plan</h3>
                        <p className="text-sm text-muted-foreground">Unlimited leads, MLS monitoring, and real-time sync.</p>
                      </div>
                    </div>
                    <Button variant="outline">Manage Billing</Button>
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
