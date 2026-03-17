
"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Phone,
  Flame,
  CalendarCheck,
  ArrowRight,
  Upload,
  RefreshCw,
  PhoneCall,
  Mail,
  Eye,
  Copy,
  CheckCircle2,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MorningBriefingCard } from "@/components/morning-briefing/morning-briefing-card";
import Link from "next/link";
import { useUser, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { collection, query, where, orderBy, limit, getCountFromServer, Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { format, isToday, isPast } from "date-fns";

const PIPELINE_STAGES = [
  { key: "new_lead", label: "New" },
  { key: "attempted_contact", label: "Attempted" },
  { key: "conversation_had", label: "Talked To" },
  { key: "appointment_set", label: "Appointment" },
  { key: "listed", label: "Listed" },
  { key: "closed", label: "Closed" },
];

function StatCard({ value, label, icon: Icon, color, href }: {
  value: number | string;
  label: string;
  icon: React.ElementType;
  color: string;
  href?: string;
}) {
  const content = (
    <Card className="border-none shadow-md bg-white hover:shadow-lg transition-all cursor-pointer group">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
            <p className={`text-4xl sm:text-5xl font-black ${color}`}>{value}</p>
          </div>
          <div className={`p-3 rounded-2xl ${color === "text-primary" ? "bg-primary/10" : color === "text-orange-500" ? "bg-orange-100" : "bg-green-100"}`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

function LogCallModal({ contact, onClose }: { contact: any; onClose: () => void }) {
  const { user, } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [outcome, setOutcome] = useState("vm_left");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user || !firestore) return;
    setSaving(true);
    try {
      const { addDoc, doc, updateDoc, collection: col, serverTimestamp } = await import("firebase/firestore");
      const nextDate = new Date();
      if (outcome === "answered") nextDate.setDate(nextDate.getDate() + 1);
      else if (outcome === "vm_left") nextDate.setDate(nextDate.getDate() + 2);
      else if (outcome === "callback") nextDate.setDate(nextDate.getDate() + 1);
      else if (outcome === "appointment_set") nextDate.setDate(nextDate.getDate() + 7);
      else nextDate.setDate(nextDate.getDate() + 3);

      await addDoc(col(firestore, "users", user.uid, "contacts", contact.id, "activityLogs"), {
        type: "call",
        outcome,
        notes,
        date: new Date().toISOString(),
        ownerId: user.uid,
        created_at: serverTimestamp(),
      });
      await updateDoc(doc(firestore, "users", user.uid, "contacts", contact.id), {
        lastContactDate: serverTimestamp(),
        nextFollowUpDate: nextDate.toISOString(),
        pipeline_stage: outcome === "appointment_set" ? "appointment_set" : contact.pipeline_stage || "attempted_contact",
        updated_at: serverTimestamp(),
      });
      toast({ title: "Call logged!", description: `${contact.name} — next follow-up set.` });
      onClose();
    } catch {
      toast({ variant: "destructive", title: "Couldn't save", description: "Check your connection." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div>
          <h3 className="font-bold text-lg text-primary">Log Call — {contact.name}</h3>
          <p className="text-sm text-slate-500">{contact.phone}</p>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-slate-400">How did it go?</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: "answered", l: "Answered" },
              { v: "vm_left", l: "Voicemail Left" },
              { v: "no_answer", l: "No Answer" },
              { v: "callback", l: "Callback Requested" },
              { v: "appointment_set", l: "Appointment Set 🎉" },
              { v: "not_interested", l: "Not Interested" },
            ].map(o => (
              <button
                key={o.v}
                onClick={() => setOutcome(o.v)}
                className={`p-2.5 rounded-xl text-xs font-bold border-2 transition-all text-left
                  ${outcome === o.v ? "border-primary bg-primary/10 text-primary" : "border-slate-200 text-slate-600 hover:border-primary/50"}`}
              >
                {o.l}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-slate-400">Notes (optional)</label>
          <textarea
            className="w-full border rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
            rows={2}
            placeholder="e.g. Moving in 3 months, very motivated..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 h-11">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 h-11 bg-primary text-white font-bold">
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [stats, setStats] = useState({ callsToday: 0, hotLeads: 0, appointments: 0, loading: true });
  const [logCallContact, setLogCallContact] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Today's call queue — top contacts by ICP score, follow-up due
  const callQueueQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    const today = new Date().toISOString().split("T")[0] + "T23:59:59.000Z";
    return query(
      collection(firestore, "users", user.uid, "contacts"),
      where("pipeline_stage", "not-in", ["closed", "dnc"]),
      orderBy("pipeline_stage"),
      orderBy("icpScore", "desc"),
      limit(10)
    );
  }, [user, firestore]);
  const { data: callQueue, isLoading: queueLoading } = useCollection(callQueueQuery);

  // Pipeline snapshot
  const pipelineQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, "users", user.uid, "contacts"));
  }, [user, firestore]);
  const { data: allContacts, isLoading: contactsLoading } = useCollection(pipelineQuery);

  const pipelineCounts = useMemo(() => {
    if (!allContacts) return {};
    const counts: Record<string, number> = {};
    allContacts.forEach((c: any) => {
      const s = c.pipeline_stage || "new_lead";
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [allContacts]);

  const isEmpty = !contactsLoading && (!allContacts || allContacts.length === 0);

  const fetchStats = useCallback(async () => {
    if (!user || !firestore) return;
    try {
      const contactsRef = collection(firestore, "users", user.uid, "contacts");
      const today = new Date().toISOString().split("T")[0] + "T23:59:59.000Z";

      const [hotSnap, apptSnap, dueSnap] = await Promise.all([
        getCountFromServer(query(contactsRef, where("icpScore", ">=", 80))),
        getCountFromServer(query(contactsRef, where("pipeline_stage", "==", "appointment_set"))),
        getCountFromServer(query(contactsRef,
          where("nextFollowUpDate", "<=", today),
          where("pipeline_stage", "not-in", ["closed", "dnc"])
        )),
      ]);

      setStats({
        callsToday: dueSnap.data().count,
        hotLeads: hotSnap.data().count,
        appointments: apptSnap.data().count,
        loading: false,
      });
    } catch {
      setStats((prev: typeof stats) => ({ ...prev, loading: false }));
    }
  }, [user, firestore]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const copyPhone = (phone: string, id: string) => {
    navigator.clipboard.writeText(phone).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const maxCount = Math.max(...(Object.values(pipelineCounts) as number[]), 1);

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 md:px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <div>
              <h1 className="text-base md:text-xl font-bold font-headline text-primary">
                Good morning, Monica!
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                {format(new Date(), "EEEE, MMMM d, yyyy")}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                className="hidden lg:flex items-center gap-2 text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                onClick={() => {
                  const e = new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true });
                  window.dispatchEvent(e);
                }}
              >
                <Search className="h-3 w-3" />
                Search leads...
                <kbd className="font-mono text-[10px] bg-white px-1 rounded border border-slate-200">⌘K</kbd>
              </button>
              <Link href="/sources">
                <Button size="sm" className="bg-accent hover:bg-accent/90 text-primary font-bold h-9 gap-2">
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">Import Leads</span>
                </Button>
              </Link>
            </div>
          </header>

          <main className="flex-1 space-y-6 p-4 md:p-6 max-w-7xl mx-auto w-full pb-24 md:pb-8">

            {/* ── EMPTY STATE ── */}
            {isEmpty && (
              <div className="space-y-6 animate-in fade-in">
                <Card className="border-none shadow-xl bg-gradient-to-br from-primary via-primary to-slate-900 text-white overflow-hidden">
                  <CardContent className="p-8 space-y-6">
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black font-headline">Welcome, Monica!</h2>
                      <p className="text-primary-foreground/70 text-lg max-w-md">
                        Your AI Hub is ready. Start by importing your leads from Vulcan7, ArchAgent, or RedX.
                      </p>
                    </div>
                    <Link href="/sources">
                      <Button size="lg" className="bg-accent hover:bg-accent/90 text-primary font-black h-14 px-8 rounded-2xl text-lg gap-3 shadow-xl shadow-accent/20">
                        Import My First Leads <ArrowRight className="h-5 w-5" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
                <MorningBriefingCard />
              </div>
            )}

            {/* ── MAIN DASHBOARD ── */}
            {!isEmpty && (
              <>
                {/* Stat Cards */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <StatCard
                    value={stats.loading ? "..." : stats.callsToday}
                    label="Calls to Make Today"
                    icon={Phone}
                    color="text-primary"
                    href="/contacts?filter=call_today"
                  />
                  <StatCard
                    value={stats.loading ? "..." : stats.hotLeads}
                    label="Hot Leads"
                    icon={Flame}
                    color="text-orange-500"
                    href="/contacts?filter=hot"
                  />
                  <StatCard
                    value={stats.loading ? "..." : stats.appointments}
                    label="Appointments Set"
                    icon={CalendarCheck}
                    color="text-green-600"
                    href="/pipeline"
                  />
                </div>

                {/* Morning Briefing */}
                <MorningBriefingCard />

                {/* Call Queue + Pipeline */}
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Today's Call Queue */}
                  <div className="lg:col-span-2">
                    <Card className="border-none shadow-md bg-white h-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
                            <PhoneCall className="h-5 w-5" />
                            Who to Call Right Now
                          </CardTitle>
                          <Link href="/contacts">
                            <Button variant="ghost" size="sm" className="text-xs text-slate-500 gap-1">
                              See all <ArrowRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {queueLoading ? (
                          <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                              <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
                            ))}
                          </div>
                        ) : callQueue && callQueue.length > 0 ? (
                          <div className="space-y-2">
                            {callQueue.map((contact: any) => {
                              const isDNC = contact.dnc === true || contact.pipeline_stage === "dnc";
                              const score = contact.icpScore || contact.aiScore || 0;
                              const scoreColor = score >= 80 ? "text-orange-600 bg-orange-100" : score >= 60 ? "text-yellow-700 bg-yellow-100" : "text-slate-500 bg-slate-100";
                              const tags = contact.archagent_tags || [];
                              const leadType = tags.find((t: string) => ["expired", "fsbo", "pre-foreclosure"].includes(t));

                              return (
                                <div key={contact.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-sm ${isDNC ? "bg-red-50 border-red-200" : "bg-white border-slate-100 hover:border-primary/20"}`}>
                                  {/* DNC badge */}
                                  {isDNC && (
                                    <Badge className="bg-red-600 text-white text-[10px] font-black px-2 shrink-0">DNC</Badge>
                                  )}
                                  {!isDNC && (
                                    <div className={`text-xs font-black px-2 py-1 rounded-lg shrink-0 ${scoreColor}`}>
                                      {score}
                                    </div>
                                  )}

                                  {/* Info */}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-primary truncate">{contact.name || "Unknown"}</p>
                                    <div className="flex items-center gap-2">
                                      {contact.phone && (
                                        <a
                                          href={`tel:${contact.phone}`}
                                          className="text-xs text-slate-500 hover:text-primary transition-colors"
                                          onClick={e => e.stopPropagation()}
                                        >
                                          {contact.phone}
                                        </a>
                                      )}
                                      {leadType && (
                                        <Badge variant="outline" className="text-[10px] h-4 capitalize border-slate-200">
                                          {leadType}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  {!isDNC && (
                                    <div className="flex items-center gap-1 shrink-0">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-9 w-9 text-primary hover:bg-primary/10"
                                        title="Log Call"
                                        onClick={() => setLogCallContact(contact)}
                                      >
                                        <PhoneCall className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-9 w-9 text-slate-400 hover:text-primary hover:bg-primary/10"
                                        title="Copy phone"
                                        onClick={() => copyPhone(contact.phone, contact.id)}
                                      >
                                        {copiedId === contact.id ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                      </Button>
                                      <Link href={`/contacts/${contact.id}`}>
                                        <Button size="icon" variant="ghost" className="h-9 w-9 text-slate-400 hover:text-primary hover:bg-primary/10">
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                      </Link>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
                            <PhoneCall className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                            <p className="font-bold text-slate-600">Your queue is clear!</p>
                            <p className="text-sm text-slate-400 mb-4">Time to import more leads.</p>
                            <Link href="/sources">
                              <Button className="bg-primary text-white font-bold gap-2">
                                <Upload className="h-4 w-4" /> Import Leads
                              </Button>
                            </Link>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Pipeline Snapshot */}
                  <Card className="border-none shadow-md bg-white">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-bold text-primary">Pipeline</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {PIPELINE_STAGES.map(({ key, label }) => {
                        const count = pipelineCounts[key] || 0;
                        const widthPct = Math.round((count / maxCount) * 100);
                        return (
                          <Link key={key} href={`/contacts?stage=${key}`}>
                            <div className="group flex items-center gap-3 hover:bg-slate-50 rounded-xl p-1.5 transition-all cursor-pointer">
                              <span className="text-xs font-bold text-slate-500 w-20 shrink-0">{label}</span>
                              <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all group-hover:bg-primary/80"
                                  style={{ width: `${widthPct}%` }}
                                />
                              </div>
                              <span className="text-sm font-black text-primary w-6 text-right shrink-0">{count}</span>
                            </div>
                          </Link>
                        );
                      })}
                      {contactsLoading && (
                        <div className="space-y-2">
                          {[1, 2, 3].map(i => <div key={i} className="h-8 bg-slate-100 rounded-xl animate-pulse" />)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </main>
        </SidebarInset>
      </div>

      {/* Log Call Modal */}
      {logCallContact && (
        <LogCallModal
          contact={logCallContact}
          onClose={() => setLogCallContact(null)}
        />
      )}
    </SidebarProvider>
  );
}
