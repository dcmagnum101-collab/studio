"use client";
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  RefreshCw,
  CheckCircle2,
  Eye,
  EyeOff,
  Save,
  Mail,
  Phone,
  BrainCircuit,
  UserCircle,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase";
import { saveSettingsSection, loadAllSettings } from "@/app/actions/settings";
import { connectGmailAccount } from "@/firebase/auth/gmail-auth";

const MARKETS = [
  { id: "las_vegas", label: "Las Vegas" },
  { id: "henderson", label: "Henderson" },
  { id: "north_las_vegas", label: "North Las Vegas" },
  { id: "boulder_city", label: "Boulder City" },
  { id: "pahrump", label: "Pahrump" },
];

const PasswordInput = ({ value, onChange, placeholder, id }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  id?: string;
}) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10 h-11"
      />
      <Button
        type="button"
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

const StatusBadge = ({ connected, checking }: { connected?: boolean; checking?: boolean }) => {
  if (checking) return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 gap-1.5"><RefreshCw className="h-3 w-3 animate-spin" /> Checking...</Badge>;
  if (connected) return <Badge className="bg-green-500 gap-1.5 text-white"><CheckCircle2 className="h-3 w-3" /> Connected</Badge>;
  return <Badge variant="outline" className="text-slate-400 gap-1.5">Not Connected</Badge>;
};

export default function SettingsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);

  // Local form state
  const [profile, setProfile] = useState({
    agentName: "Monica Selvaggio",
    license: "S.0190894",
    brokerage: "Century21 Americana",
    phone: "",
    email: "",
    markets: ["las_vegas", "henderson", "north_las_vegas", "boulder_city", "pahrump"],
  });
  const [grokKey, setGrokKey] = useState("");
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioToken, setTwilioToken] = useState("");

  useEffect(() => {
    if (user) {
      loadAllSettings(user.uid).then(data => {
        setSettings(data);
        if (data.business) {
          setProfile(prev => ({
            ...prev,
            agentName: data.business.agentName || prev.agentName,
            license: data.business.license || prev.license,
            brokerage: data.business.brokerage || prev.brokerage,
            phone: data.business.phone || "",
            email: data.business.email || "",
            markets: data.business.markets || prev.markets,
          }));
        }
        if (data.ai_grok) setGrokKey(data.ai_grok.apiKey || "");
        if (data.twilio) {
          setTwilioSid(data.twilio.accountSid || "");
          setTwilioToken(data.twilio.authToken || "");
        }
        setLoading(false);
      });
    }
  }, [user]);

  const save = async (section: string, data: any) => {
    if (!user) return;
    setSaving(section);
    try {
      await saveSettingsSection(user.uid, section, data);
      toast({ title: "Saved!", description: "Your settings have been updated." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Couldn't save", description: "Check your connection and try again." });
    } finally {
      setSaving(null);
    }
  };

  // Real health checks
  const testGrok = async () => {
    if (!grokKey) {
      toast({ variant: "destructive", title: "Enter your API key first" });
      return;
    }
    setTesting("grok");
    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${grokKey}` },
        body: JSON.stringify({ model: "grok-3-mini", messages: [{ role: "user", content: "ping" }], max_tokens: 5 }),
      });
      if (res.ok || res.status === 400) {
        // 400 means authenticated but bad request — key is valid
        await save("ai_grok", { apiKey: grokKey, connected: true });
        setSettings(prev => ({ ...prev, ai_grok: { ...prev.ai_grok, connected: true } }));
        toast({ title: "Grok connected!", description: "AI is active and ready." });
      } else {
        toast({ variant: "destructive", title: "Invalid API key", description: "Check your key at console.x.ai" });
      }
    } catch {
      toast({ variant: "destructive", title: "Connection failed", description: "Make sure your key is correct." });
    } finally {
      setTesting(null);
    }
  };

  const testTwilio = async () => {
    if (!twilioSid || !twilioToken) {
      toast({ variant: "destructive", title: "Enter your Account SID and Auth Token first" });
      return;
    }
    setTesting("twilio");
    try {
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}.json`, {
        headers: { Authorization: `Basic ${btoa(`${twilioSid}:${twilioToken}`)}` },
      });
      if (res.ok) {
        const data = await res.json();
        await save("twilio", { accountSid: twilioSid, authToken: twilioToken, connected: true, friendlyName: data.friendly_name });
        setSettings(prev => ({ ...prev, twilio: { ...prev.twilio, connected: true } }));
        toast({ title: "Twilio connected!", description: "SMS is ready to send." });
      } else {
        toast({ variant: "destructive", title: "Couldn't connect to Twilio", description: "Check your Account SID and Auth Token at twilio.com/console" });
      }
    } catch {
      toast({ variant: "destructive", title: "Connection failed", description: "Check your credentials." });
    } finally {
      setTesting(null);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center text-slate-400 italic">
      Loading settings...
    </div>
  );

  const gmailConnected = !!settings.outreach_gmail?.connected;
  const grokConnected = !!settings.ai_grok?.connected;
  const twilioConnected = !!settings.twilio?.connected;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#F9FAFB]">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 md:px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-xl font-bold font-headline text-primary">Settings</h1>
          </header>

          <main className="p-4 md:p-8 max-w-2xl mx-auto w-full space-y-6">

            {/* ── MY PROFILE ── */}
            <Card className="border-none shadow-md bg-white">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <UserCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>My Profile</CardTitle>
                    <CardDescription>Your name, license, and markets you serve.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={profile.agentName}
                      onChange={e => setProfile(p => ({ ...p, agentName: e.target.value }))}
                      className="h-11"
                      placeholder="Monica Selvaggio"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>License #</Label>
                    <Input
                      value={profile.license}
                      onChange={e => setProfile(p => ({ ...p, license: e.target.value }))}
                      className="h-11"
                      placeholder="S.0190894"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Brokerage</Label>
                    <Input
                      value={profile.brokerage}
                      onChange={e => setProfile(p => ({ ...p, brokerage: e.target.value }))}
                      className="h-11"
                      placeholder="Century21 Americana"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={profile.phone}
                      onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                      className="h-11"
                      placeholder="(702) 555-0100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={profile.email}
                      onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                      className="h-11"
                      placeholder="monica@c21americana.com"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Markets I serve</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {MARKETS.map(m => (
                      <label key={m.id} className="flex items-center gap-2.5 cursor-pointer">
                        <Checkbox
                          checked={profile.markets.includes(m.id)}
                          onCheckedChange={v => {
                            if (v) setProfile(p => ({ ...p, markets: [...p.markets, m.id] }));
                            else setProfile(p => ({ ...p, markets: p.markets.filter(x => x !== m.id) }));
                          }}
                        />
                        <span className="text-sm text-slate-700">{m.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={() => save("business", profile)}
                  disabled={saving === "business"}
                  className="w-full h-11 bg-primary text-white font-bold gap-2"
                >
                  {saving === "business" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Profile
                </Button>
              </CardContent>
            </Card>

            {/* ── MY EMAIL (GMAIL) ── */}
            <Card className="border-none shadow-md bg-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-xl">
                      <Mail className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <CardTitle>My Email (Gmail)</CardTitle>
                      <CardDescription>For sending AI-written outreach emails.</CardDescription>
                    </div>
                  </div>
                  <StatusBadge connected={gmailConnected} />
                </div>
              </CardHeader>
              <CardContent>
                {gmailConnected ? (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600">
                      Connected as: <span className="font-bold text-primary">{settings.outreach_gmail?.email || "Your Gmail account"}</span>
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 text-xs"
                      onClick={() => {
                        save("outreach_gmail", { connected: false, email: null });
                        setSettings(prev => ({ ...prev, outreach_gmail: { connected: false } }));
                      }}
                    >
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button
                      onClick={() => user && connectGmailAccount(user.uid)}
                      className="w-full h-12 bg-white border-2 border-slate-200 hover:border-primary text-primary font-bold text-base rounded-xl gap-3 shadow-sm hover:shadow-md transition-all"
                      variant="outline"
                    >
                      <Mail className="h-5 w-5 text-red-500" />
                      Connect Gmail Account
                    </Button>
                    <p className="text-xs text-slate-400 text-center">
                      We only send emails YOU approve. We never read your inbox.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── MY PHONE (TWILIO SMS) ── */}
            <Card className="border-none shadow-md bg-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <Phone className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>My Phone (Twilio SMS)</CardTitle>
                      <CardDescription>For sending text messages to leads.</CardDescription>
                    </div>
                  </div>
                  <StatusBadge connected={twilioConnected} checking={testing === "twilio"} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {twilioConnected ? (
                  <div className="space-y-3">
                    <p className="text-sm text-green-700 font-medium">SMS is active and ready to send.</p>
                    <p className="text-xs text-slate-500">Connected number: {settings.twilio?.phone || "Twilio number"}</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="twilio-sid">Account SID</Label>
                      <Input
                        id="twilio-sid"
                        value={twilioSid}
                        onChange={e => setTwilioSid(e.target.value)}
                        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        className="h-11 font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twilio-token">Auth Token</Label>
                      <PasswordInput
                        id="twilio-token"
                        value={twilioToken}
                        onChange={setTwilioToken}
                        placeholder="Your Twilio Auth Token"
                      />
                    </div>
                    <a
                      href="https://console.twilio.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      Get these at twilio.com/console <ExternalLink className="h-3 w-3" />
                    </a>
                    <Button
                      onClick={testTwilio}
                      disabled={testing === "twilio"}
                      className="w-full h-11 bg-primary text-white font-bold gap-2"
                    >
                      {testing === "twilio" ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
                      Connect Twilio SMS
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* ── AI ENGINE (GROK) ── */}
            <Card className="border-none shadow-md bg-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl">
                      <BrainCircuit className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>AI Engine (Grok)</CardTitle>
                      <CardDescription>Powers email drafting, lead scoring, and briefings.</CardDescription>
                    </div>
                  </div>
                  <StatusBadge connected={grokConnected} checking={testing === "grok"} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {grokConnected ? (
                  <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <p className="font-bold text-green-800 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> AI is active
                    </p>
                    <p className="text-xs text-green-700 mt-1">Using model: grok-4-latest</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="grok-key">API Key</Label>
                      <PasswordInput
                        id="grok-key"
                        value={grokKey}
                        onChange={setGrokKey}
                        placeholder="xai-xxxxxxxxxxxxxxxxxxxx"
                      />
                    </div>
                    <a
                      href="https://console.x.ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      Get your key at console.x.ai <ExternalLink className="h-3 w-3" />
                    </a>
                    <Button
                      onClick={testGrok}
                      disabled={testing === "grok"}
                      className="w-full h-11 bg-primary text-white font-bold gap-2"
                    >
                      {testing === "grok" ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
                      Connect AI
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
