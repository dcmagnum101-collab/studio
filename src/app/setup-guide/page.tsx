
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Circle, 
  Mail, 
  PhoneCall, 
  UploadCloud, 
  Globe, 
  Map as MapIcon, 
  Building2, 
  MessageSquare,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  Zap,
  Smartphone,
  ShieldCheck,
  Eye,
  EyeOff
} from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, onSnapshot, getDocs, limit } from "firebase/firestore";
import { saveSettingsSection } from "@/app/actions/save-settings";
import { connectGmailAccount } from "@/firebase/auth/gmail-auth";
import { syncVulcan7Leads } from "@/app/actions/vulcan7";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function SetupGuidePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [v7LeadsCount, setV7LeadsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  
  // Visibility toggles for password fields
  const [showRapid, setShowRapid] = useState(false);
  const [showMaps, setShowMaps] = useState(false);

  useEffect(() => {
    if (user) {
      const q = query(collection(firestore, "users", user.uid, "settings"));
      const unsub = onSnapshot(q, (snapshot) => {
        const data: Record<string, any> = {};
        snapshot.docs.forEach(doc => data[doc.id] = doc.data());
        setSettings(data);
        setLoading(false);
      });

      // Check for V7 leads
      const contactsQuery = query(
        collection(firestore, "users", user.uid, "contacts"),
        limit(1)
      );
      getDocs(contactsQuery).then(snap => setV7LeadsCount(snap.size));

      return () => unsub();
    }
  }, [user, firestore]);

  const handleSave = async (section: string, data: any) => {
    if (!user) return;
    setSaving(section);
    try {
      await saveSettingsSection({ uid: user.uid, section, data });
      toast({ title: "Updated", description: `${section} settings saved.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Save Failed", description: err.message });
    } finally {
      setSaving(null);
    }
  };

  const steps = useMemo(() => [
    {
      id: "gmail",
      category: "REQUIRED",
      title: "Connect Gmail Account",
      description: "Monica sends all nurture outreach through your authenticated business account.",
      completed: !!settings.outreach_gmail?.connected,
      action: (
        <Button 
          onClick={() => user && connectGmailAccount(user.uid)} 
          className="bg-primary w-full sm:w-auto gap-2 h-11"
        >
          <Mail className="h-4 w-4" /> 
          {settings.outreach_gmail?.connected ? "Reconnect Account" : "Connect Business Gmail"}
        </Button>
      )
    },
    {
      id: "vulcan7",
      category: "REQUIRED",
      title: "Vulcan7 Credentials",
      description: "Required for lead syncing and automated DNC scrubbing.",
      completed: !!(settings.dialer_v7?.username && settings.dialer_v7?.password),
      action: (
        <div className="space-y-4 w-full max-w-md">
          <div className="grid grid-cols-2 gap-2">
            <Input 
              placeholder="V7 Username" 
              defaultValue={settings.dialer_v7?.username} 
              onBlur={(e) => handleSave("dialer_v7", { ...settings.dialer_v7, username: e.target.value })}
            />
            <Input 
              type="password" 
              placeholder="V7 Password" 
              defaultValue={settings.dialer_v7?.password}
              onBlur={(e) => handleSave("dialer_v7", { ...settings.dialer_v7, password: e.target.value })}
            />
          </div>
        </div>
      )
    },
    {
      id: "v7-import",
      category: "REQUIRED",
      title: "Import First Vulcan7 CSV",
      description: "Bootstrap your pipeline with existing leads.",
      completed: v7LeadsCount > 0,
      action: (
        <div className="w-full max-w-md p-6 border-2 border-dashed rounded-2xl bg-slate-50 text-center hover:bg-slate-100 transition-colors cursor-pointer relative group">
          <UploadCloud className="h-8 w-8 text-slate-400 mx-auto mb-2 group-hover:text-primary transition-colors" />
          <p className="text-xs font-bold text-slate-600">Drag & Drop Vulcan7 CSV here</p>
          <input 
            type="file" 
            accept=".csv" 
            className="absolute inset-0 opacity-0 cursor-pointer" 
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file && user) {
                const text = await file.text();
                const res = await syncVulcan7Leads(user.uid, text);
                toast({ title: "Import Complete", description: `Added ${res.imported} leads.` });
                setV7LeadsCount(prev => prev + res.imported);
              }
            }}
          />
        </div>
      )
    },
    {
      id: "rapidapi",
      category: "IMPORTANT",
      title: "RapidAPI Intelligence",
      description: "Powers real-time listing data from Trulia and Realtor.com.",
      completed: !!settings.rapidapi?.apiKey,
      action: (
        <div className="space-y-4 w-full max-w-md">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input 
                type={showRapid ? "text" : "password"} 
                placeholder="Enter RapidAPI Key" 
                defaultValue={settings.rapidapi?.apiKey}
                onBlur={(e) => handleSave("rapidapi", { ...settings.rapidapi, apiKey: e.target.value })}
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-0 top-0 h-full text-slate-400"
                onClick={() => setShowRapid(!showRapid)}
              >
                {showRapid ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <Button variant="outline" asChild>
              <a href="https://rapidapi.com/auth/sign-up" target="_blank">Get Key</a>
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">The free tier allows 500 calls/month — perfect for getting started.</p>
        </div>
      )
    },
    {
      id: "google-maps",
      category: "IMPORTANT",
      title: "Google Maps Activation",
      description: "Powers the Farm Zone map and neighborhood parcel lookups.",
      completed: !!settings.google_apis?.mapKey,
      action: (
        <div className="space-y-4 w-full max-w-md">
          <div className="relative">
            <Input 
              type={showMaps ? "text" : "password"} 
              placeholder="Google Maps API Key" 
              defaultValue={settings.google_apis?.mapKey}
              onBlur={(e) => handleSave("google_apis", { ...settings.google_apis, mapKey: e.target.value })}
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-0 top-0 h-full text-slate-400"
              onClick={() => setShowMaps(!showMaps)}
            >
              {showMaps ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <ol className="text-[10px] text-slate-500 space-y-1 list-decimal ml-4">
            <li>Go to <a href="https://console.cloud.google.com" className="text-primary underline">Google Cloud Console</a></li>
            <li>Enable Maps JavaScript API & Places API</li>
            <li>Create an API Key and paste it here</li>
          </ol>
        </div>
      )
    },
    {
      id: "lvr-mls",
      category: "WHEN READY",
      title: "LVR MLS RETS Access",
      description: "Direct board feed for the most accurate expired listing data.",
      completed: !!settings.lvr_mls?.username,
      action: (
        <div className="space-y-3">
          <Button variant="outline" className="gap-2 h-11" asChild>
            <a href="https://lasvegasrealtors.com" target="_blank">
              Request LVR MLS Access <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <p className="text-[10px] text-muted-foreground italic">Takes 3-7 business days. Monica uses Trulia fallback in the meantime.</p>
        </div>
      )
    }
  ], [settings, v7LeadsCount, user, showRapid, showMaps]);

  const completedCount = steps.filter(s => s.completed).length;
  const progress = (completedCount / steps.length) * 100;

  if (loading) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#F9FAFB]">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-xl font-bold font-headline text-primary">System Setup Guide</h1>
          </header>

          <main className="p-4 md:p-8 max-w-4xl mx-auto w-full space-y-8">
            <Card className="border-none shadow-xl bg-primary text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Zap className="h-32 w-32" />
              </div>
              <CardContent className="p-8 relative z-10 space-y-6">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black">Monica's Launch Checklist</h2>
                  <p className="text-primary-foreground/70">Complete these steps to unlock Monica's full deal intelligence suite.</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                    <span>Setup Progress</span>
                    <span>{completedCount} OF {steps.length} STEPS COMPLETE</span>
                  </div>
                  <Progress value={progress} className="h-3 bg-white/10" />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-12">
              {["REQUIRED", "IMPORTANT", "WHEN READY"].map(cat => (
                <section key={cat} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h3 className={`text-[10px] font-black tracking-[0.2em] px-3 py-1 rounded-full ${cat === 'REQUIRED' ? 'bg-red-500 text-white' : cat === 'IMPORTANT' ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      {cat}
                    </h3>
                    <div className="h-px bg-slate-200 flex-1" />
                  </div>

                  <div className="grid gap-4">
                    {steps.filter(s => s.category === cat).map(step => (
                      <Card key={step.id} className={`border-none shadow-sm transition-all ${step.completed ? 'bg-green-50/50 opacity-80' : 'bg-white'}`}>
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex items-start gap-4 flex-1">
                              <div className={`mt-1 h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${step.completed ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-300'}`}>
                                {step.completed ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                              </div>
                              <div className="space-y-1">
                                <h4 className={`font-bold ${step.completed ? 'text-green-900' : 'text-slate-900'}`}>{step.title}</h4>
                                <p className="text-xs text-slate-500 leading-relaxed max-w-sm">{step.description}</p>
                              </div>
                            </div>
                            <div className="md:w-1/2 flex items-center">
                              {step.action}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <div className="pt-8 border-t flex justify-center">
              <Button asChild className="bg-accent hover:bg-accent/90 text-primary font-black px-12 h-12 rounded-xl shadow-lg shadow-accent/20">
                <Link href="/">
                  Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
