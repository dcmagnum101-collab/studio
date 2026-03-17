"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  CheckCircle2,
  UploadCloud,
  Mail,
  Sparkles,
  Users,
  Phone,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import { useUser, useFirestore } from "@/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { saveSettingsSection } from "@/app/actions/save-settings";
import { connectGmailAccount } from "@/firebase/auth/gmail-auth";
import { syncVulcan7Leads } from "@/app/actions/vulcan7";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

const TOTAL_STEPS = 5;

const MARKETS = [
  { id: "las_vegas", label: "Las Vegas" },
  { id: "henderson", label: "Henderson" },
  { id: "north_las_vegas", label: "North Las Vegas" },
  { id: "boulder_city", label: "Boulder City" },
  { id: "pahrump", label: "Pahrump" },
];

function StepIndicator({ step, current }: { step: number; current: number }) {
  const done = step < current;
  const active = step === current;
  return (
    <div className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-bold border-2 transition-all
      ${done ? "bg-green-500 border-green-500 text-white" : active ? "bg-primary border-primary text-white" : "bg-white border-slate-200 text-slate-400"}`}>
      {done ? <CheckCircle2 className="h-4 w-4" /> : step}
    </div>
  );
}

export default function SetupGuidePage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 2 state
  const [profile, setProfile] = useState({
    name: "Monica Selvaggio",
    license: "S.0190894",
    brokerage: "Century21 Americana",
    phone: "",
    email: "",
  });
  const [markets, setMarkets] = useState<string[]>(["las_vegas", "henderson", "north_las_vegas", "boulder_city", "pahrump"]);

  // Step 3 state
  const [importResults, setImportResults] = useState<{ source: string; imported: number; skipped: number; duplicates: number } | null>(null);
  const [importing, setImporting] = useState(false);
  const [showV7Instructions, setShowV7Instructions] = useState(false);
  const [showAAInstructions, setShowAAInstructions] = useState(false);
  const [showRedXInstructions, setShowRedXInstructions] = useState(false);

  // Step 4 state
  const [gmailConnected, setGmailConnected] = useState(false);

  // Check if already completed
  useEffect(() => {
    if (!user || !firestore) return;
    getDoc(doc(firestore, "users", user.uid)).then(snap => {
      if (snap.exists() && snap.data()?.setup_complete) {
        router.replace("/");
      }
    });
  }, [user, firestore, router]);

  const markComplete = useCallback(async () => {
    if (!user || !firestore) return;
    await setDoc(doc(firestore, "users", user.uid), { setup_complete: true }, { merge: true });
  }, [user, firestore]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await saveSettingsSection({
        uid: user.uid,
        section: "business",
        data: {
          agentName: profile.name,
          license: profile.license,
          brokerage: profile.brokerage,
          phone: profile.phone,
          email: profile.email,
          markets,
        },
      });
      setStep(3);
    } catch {
      toast({ variant: "destructive", title: "Couldn't save", description: "Check your connection and try again." });
    } finally {
      setSaving(false);
    }
  };

  const handleCSVImport = async (file: File, source: "vulcan7" | "archagent" | "redx") => {
    if (!user) return;
    setImporting(true);
    try {
      const text = await file.text();
      let result;
      if (source === "vulcan7") {
        result = await syncVulcan7Leads(user.uid, text);
      } else {
        // For ArchAgent and RedX, use the same import pipeline for now
        // (Sources Hub has full per-dialer mapping)
        result = await syncVulcan7Leads(user.uid, text);
      }
      setImportResults({ source, ...result });
      toast({ title: "Import complete!", description: `Added ${result.imported} leads to your pipeline.` });
    } catch {
      toast({ variant: "destructive", title: "Import failed", description: "Try again or check your CSV file." });
    } finally {
      setImporting(false);
    }
  };

  const handleConnectGmail = async () => {
    if (!user) return;
    await connectGmailAccount(user.uid);
    setGmailConnected(true);
  };

  const handleFinish = async () => {
    await markComplete();
    router.push("/");
  };

  const progress = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#F9FAFB]">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 md:px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-xl font-bold font-headline text-primary">Getting Started</h1>
            <div className="ml-auto flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
                Step {step} of {TOTAL_STEPS}
              </div>
              <div className="w-32 hidden sm:block">
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          </header>

          <main className="p-4 md:p-8 max-w-2xl mx-auto w-full">
            {/* Step indicators */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s, idx) => (
                <React.Fragment key={s}>
                  <StepIndicator step={s} current={step} />
                  {idx < TOTAL_STEPS - 1 && (
                    <div className={`h-0.5 w-8 sm:w-12 transition-all ${s < step ? "bg-green-500" : "bg-slate-200"}`} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* ── STEP 1: Welcome ── */}
            {step === 1 && (
              <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="space-y-4">
                  <div className="mx-auto w-20 h-20 bg-primary rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/30">
                    <Sparkles className="h-10 w-10 text-accent" />
                  </div>
                  <h1 className="text-4xl font-black text-primary font-headline">Welcome to Your AI Hub, Monica!</h1>
                  <p className="text-lg text-slate-600 max-w-md mx-auto">
                    Let's get you set up in 5 minutes. We'll walk you through everything step by step.
                  </p>
                </div>

                <Card className="text-left border-none shadow-md bg-white max-w-sm mx-auto">
                  <CardContent className="p-5 space-y-3">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Your License Info</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Agent</span>
                        <span className="font-bold text-primary">Monica Selvaggio</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">License</span>
                        <span className="font-bold text-primary">S.0190894</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Brokerage</span>
                        <span className="font-bold text-primary">Century21 Americana</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">State</span>
                        <span className="font-bold text-primary">Nevada</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  onClick={() => setStep(2)}
                  size="lg"
                  className="h-14 px-10 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-2xl shadow-xl shadow-primary/20 gap-3"
                >
                  Let's Get Started <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            )}

            {/* ── STEP 2: Business Profile ── */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-black text-primary">Your Business Profile</h2>
                  <p className="text-slate-500">We've pre-filled what we know. Just confirm or make changes.</p>
                </div>

                <Card className="border-none shadow-md bg-white">
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 space-y-2">
                        <Label>Full Name</Label>
                        <Input
                          value={profile.name}
                          onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>License #</Label>
                        <Input
                          value={profile.license}
                          onChange={e => setProfile(p => ({ ...p, license: e.target.value }))}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Brokerage</Label>
                        <Input
                          value={profile.brokerage}
                          onChange={e => setProfile(p => ({ ...p, brokerage: e.target.value }))}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input
                          placeholder="(702) 555-0100"
                          value={profile.phone}
                          onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          placeholder="monica@c21americana.com"
                          value={profile.email}
                          onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                          className="h-11"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <Label className="text-sm font-bold">Markets I serve</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {MARKETS.map(m => (
                          <label key={m.id} className="flex items-center gap-2.5 cursor-pointer group">
                            <Checkbox
                              checked={markets.includes(m.id)}
                              onCheckedChange={v => {
                                if (v) setMarkets(prev => [...prev, m.id]);
                                else setMarkets(prev => prev.filter(x => x !== m.id));
                              }}
                            />
                            <span className="text-sm text-slate-700 group-hover:text-primary transition-colors">{m.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  size="lg"
                  className="w-full h-13 bg-primary hover:bg-primary/90 text-white font-bold text-base rounded-xl shadow-lg gap-2"
                >
                  {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
                  {saving ? "Saving..." : <>Save & Continue <ArrowRight className="h-4 w-4" /></>}
                </Button>
              </div>
            )}

            {/* ── STEP 3: Import Leads ── */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-black text-primary">Drop In Your Leads</h2>
                  <p className="text-slate-500">Import from your dialer to start your pipeline right now.</p>
                </div>

                {importing && (
                  <Card className="border-none shadow-md bg-white">
                    <CardContent className="p-6 text-center space-y-3">
                      <RefreshCw className="h-10 w-10 text-primary mx-auto animate-spin" />
                      <p className="font-bold text-primary">Reading your leads...</p>
                      <p className="text-sm text-slate-500">Checking for duplicates and scoring each contact.</p>
                    </CardContent>
                  </Card>
                )}

                {importResults && !importing && (
                  <Card className="border-none shadow-md bg-green-50 border-green-200">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-8 w-8 text-green-600 shrink-0" />
                        <div>
                          <p className="font-bold text-green-800 text-lg">
                            🎉 {importResults.imported} leads imported!
                          </p>
                          <p className="text-sm text-green-700">
                            {importResults.duplicates} duplicates skipped · {importResults.skipped} DNC removed
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!importing && (
                  <div className="grid gap-4 sm:grid-cols-3">
                    {/* Vulcan7 */}
                    <div className="space-y-3">
                      <div className="relative p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-white hover:border-primary hover:bg-primary/5 transition-all cursor-pointer text-center group">
                        <UploadCloud className="h-8 w-8 text-slate-300 group-hover:text-primary mx-auto mb-2 transition-colors" />
                        <p className="font-bold text-sm text-slate-700">Vulcan7</p>
                        <p className="text-xs text-slate-400 mt-1">Drag CSV here or click</p>
                        <input
                          type="file"
                          accept=".csv"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleCSVImport(file, "vulcan7");
                          }}
                        />
                      </div>
                      <button
                        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary w-full"
                        onClick={() => setShowV7Instructions(!showV7Instructions)}
                      >
                        {showV7Instructions ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        How do I export from Vulcan7?
                      </button>
                      {showV7Instructions && (
                        <div className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3 space-y-1.5 border">
                          <p className="font-bold">Export from Vulcan7:</p>
                          <ol className="list-decimal ml-4 space-y-1">
                            <li>Log in to Vulcan7</li>
                            <li>Go to Settings → Export</li>
                            <li>Select "Call List"</li>
                            <li>Choose CSV format and download</li>
                          </ol>
                        </div>
                      )}
                    </div>

                    {/* ArchAgent */}
                    <div className="space-y-3">
                      <div className="relative p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-white hover:border-primary hover:bg-primary/5 transition-all cursor-pointer text-center group">
                        <UploadCloud className="h-8 w-8 text-slate-300 group-hover:text-primary mx-auto mb-2 transition-colors" />
                        <p className="font-bold text-sm text-slate-700">ArchAgent</p>
                        <p className="text-xs text-slate-400 mt-1">Drag CSV here or click</p>
                        <input
                          type="file"
                          accept=".csv"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleCSVImport(file, "archagent");
                          }}
                        />
                      </div>
                      <button
                        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary w-full"
                        onClick={() => setShowAAInstructions(!showAAInstructions)}
                      >
                        {showAAInstructions ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        How do I export from ArchAgent?
                      </button>
                      {showAAInstructions && (
                        <div className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3 space-y-1.5 border">
                          <p className="font-bold">Export from ArchAgent:</p>
                          <ol className="list-decimal ml-4 space-y-1">
                            <li>Log in to ArchAgent</li>
                            <li>Go to Reports → Export Leads</li>
                            <li>Select your date range</li>
                            <li>Click "Export CSV"</li>
                          </ol>
                        </div>
                      )}
                    </div>

                    {/* RedX */}
                    <div className="space-y-3">
                      <div className="relative p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-white hover:border-primary hover:bg-primary/5 transition-all cursor-pointer text-center group">
                        <UploadCloud className="h-8 w-8 text-slate-300 group-hover:text-primary mx-auto mb-2 transition-colors" />
                        <p className="font-bold text-sm text-slate-700">RedX</p>
                        <p className="text-xs text-slate-400 mt-1">Drag CSV here or click</p>
                        <input
                          type="file"
                          accept=".csv"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleCSVImport(file, "redx");
                          }}
                        />
                      </div>
                      <button
                        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary w-full"
                        onClick={() => setShowRedXInstructions(!showRedXInstructions)}
                      >
                        {showRedXInstructions ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        How do I export from RedX?
                      </button>
                      {showRedXInstructions && (
                        <div className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3 space-y-1.5 border">
                          <p className="font-bold">Export from RedX:</p>
                          <ol className="list-decimal ml-4 space-y-1">
                            <li>Log in to RedX</li>
                            <li>Go to Dashboard → My Leads</li>
                            <li>Click Export</li>
                            <li>Select CSV and download</li>
                          </ol>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(4)}
                    className="flex-1 h-11 text-slate-500"
                  >
                    Skip for now
                  </Button>
                  <Button
                    onClick={() => setStep(4)}
                    className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white font-bold gap-2"
                  >
                    Continue <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── STEP 4: Connect Gmail ── */}
            {step === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-black text-primary">Connect Your Email</h2>
                  <p className="text-slate-500">
                    Connect Gmail so we can send personalized outreach for you.
                  </p>
                </div>

                <Card className="border-none shadow-md bg-white">
                  <CardContent className="p-8 space-y-6">
                    {gmailConnected ? (
                      <div className="text-center space-y-3">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                        <p className="font-bold text-green-800 text-lg">Gmail Connected!</p>
                      </div>
                    ) : (
                      <>
                        <Button
                          onClick={handleConnectGmail}
                          size="lg"
                          className="w-full h-14 bg-white border-2 border-slate-200 hover:border-primary text-primary font-bold text-base rounded-xl gap-3 shadow-sm hover:shadow-md transition-all"
                        >
                          <Mail className="h-5 w-5 text-red-500" />
                          Connect Gmail Account
                        </Button>
                        <p className="text-center text-xs text-slate-400">
                          We only send emails YOU approve. We never read your inbox.
                        </p>
                      </>
                    )}

                    <div className="grid grid-cols-3 gap-3 pt-2">
                      {[
                        { icon: <Sparkles className="h-4 w-4 text-primary" />, text: "AI-written emails" },
                        { icon: <ArrowRight className="h-4 w-4 text-primary" />, text: "Automatic follow-ups" },
                        { icon: <Mail className="h-4 w-4 text-primary" />, text: "Gmail logging" },
                      ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-xl text-center">
                          {item.icon}
                          <span className="text-xs text-slate-600 font-medium">{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(5)}
                    className="flex-1 h-11 text-slate-500"
                  >
                    Connect this later in Settings
                  </Button>
                  <Button
                    onClick={() => setStep(5)}
                    className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white font-bold gap-2"
                  >
                    Continue <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── STEP 5: You're Ready ── */}
            {step === 5 && (
              <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="space-y-4">
                  <div className="mx-auto w-20 h-20 bg-green-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-green-500/30">
                    <CheckCircle2 className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-4xl font-black text-primary font-headline">You're all set, Monica!</h2>
                  {importResults && (
                    <p className="text-lg text-slate-600">
                      You have <span className="font-bold text-primary">{importResults.imported} leads</span> ready to contact right now.
                    </p>
                  )}
                  {!importResults && (
                    <p className="text-lg text-slate-600">Your AI Hub is ready. Let's get to work!</p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Link href="/contacts">
                    <Card className="border-2 border-slate-100 hover:border-primary hover:shadow-lg transition-all cursor-pointer h-full">
                      <CardContent className="p-5 text-center space-y-3">
                        <Users className="h-8 w-8 text-primary mx-auto" />
                        <p className="font-bold text-primary">See My Leads</p>
                        <p className="text-xs text-slate-500">View all your contacts</p>
                      </CardContent>
                    </Card>
                  </Link>
                  <Link href="/?briefing=1">
                    <Card className="border-2 border-slate-100 hover:border-primary hover:shadow-lg transition-all cursor-pointer h-full">
                      <CardContent className="p-5 text-center space-y-3">
                        <Sparkles className="h-8 w-8 text-accent mx-auto" />
                        <p className="font-bold text-primary">Morning Briefing</p>
                        <p className="text-xs text-slate-500">Get your daily game plan</p>
                      </CardContent>
                    </Card>
                  </Link>
                  <Link href="/contacts?filter=hot">
                    <Card className="border-2 border-slate-100 hover:border-primary hover:shadow-lg transition-all cursor-pointer h-full">
                      <CardContent className="p-5 text-center space-y-3">
                        <Phone className="h-8 w-8 text-orange-500 mx-auto" />
                        <p className="font-bold text-primary">Start Calling</p>
                        <p className="text-xs text-slate-500">Your hottest leads first</p>
                      </CardContent>
                    </Card>
                  </Link>
                </div>

                <Button
                  onClick={handleFinish}
                  size="lg"
                  className="h-14 px-10 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-2xl shadow-xl shadow-primary/20 gap-3"
                >
                  Go to Dashboard <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
