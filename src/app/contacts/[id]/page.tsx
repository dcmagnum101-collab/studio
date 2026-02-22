"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  MapPin, 
  Sparkles, 
  TrendingUp, 
  Calendar, 
  BrainCircuit,
  History,
  ArrowLeft,
  User,
  MoreVertical,
  ArrowRight,
  Inbox
} from "lucide-react"
import Link from "next/link"
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, where } from "firebase/firestore"
import { format } from "date-fns"
import { LeadNurtureEngine } from "@/components/contacts/nurture-engine"

export default function ContactProfilePage() {
  const params = useParams();
  const { user } = useUser();
  const firestore = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const contactRef = useMemoFirebase(() => {
    if (!user || !firestore || !params.id) return null;
    return `users/${user.uid}/contacts/${params.id}`;
  }, [user, firestore, params.id]);

  const { data: contact, isLoading: contactLoading } = useDoc(contactRef);

  // Sync real message history from Gmail Integration
  const messagesQuery = useMemoFirebase(() => {
    if (!user || !firestore || !params.id) return null;
    return query(
      collection(firestore, 'users', user.uid, 'messages'),
      where('leadId', '==', params.id),
      orderBy('created_at', 'desc')
    );
  }, [user, firestore, params.id]);

  const { data: gmailMessages } = useCollection(messagesQuery);

  const logsQuery = useMemoFirebase(() => {
    if (!user || !firestore || !params.id) return null;
    return query(
      collection(firestore, 'users', user.uid, 'contacts', params.id as string, 'activityLogs'),
      orderBy('date', 'desc')
    );
  }, [user, firestore, params.id]);

  const { data: activityLogs } = useCollection(logsQuery);

  const handleLogActivity = (type: 'call' | 'sms' | 'email') => {
    if (!user || !firestore || !params.id) return;
    const logsRef = collection(firestore, 'users', user.uid, 'contacts', params.id as string, 'activityLogs');
    addDocumentNonBlocking(logsRef, {
      type,
      date: new Date().toISOString(),
      outcome: `${type.toUpperCase()} outreach initiated`,
      summary: `Manually initiated ${type} from CRM profile.`,
      sentiment: 'neutral',
      ownerId: user.uid
    });
  };

  if (!mounted || contactLoading) return <div className="p-8 text-center text-slate-400">Loading profile...</div>;
  if (!contact) return <div className="p-8 text-center">Contact not found.</div>;

  const sentimentColors: Record<string, string> = {
    positive: 'bg-green-500',
    neutral: 'bg-slate-400',
    negative: 'bg-red-500'
  };

  const urgencyColors: Record<string, string> = {
    hot: 'text-red-600 bg-red-50',
    warm: 'text-orange-600 bg-orange-50',
    cold: 'text-blue-600 bg-blue-50',
    nurture: 'text-purple-600 bg-purple-50'
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <Link href="/contacts" className="hover:text-primary transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-lg font-bold font-headline text-primary">{contact.name}</h1>
            <Badge className="ml-2 bg-slate-100 text-slate-600 capitalize">{contact.pipeline_stage?.replace('_', ' ')}</Badge>
            <div className="ml-auto flex gap-2">
              <Button size="sm" variant="outline" className="gap-2"><User className="h-4 w-4" /> Edit Profile</Button>
              <Button size="icon" variant="ghost" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
            </div>
          </header>
          
          <main className="flex h-[calc(100vh-64px)] overflow-hidden">
            <aside className="w-80 border-r bg-slate-50/50 p-6 flex flex-col gap-8 overflow-y-auto">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="h-24 w-24 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold relative shadow-xl">
                  {contact.name?.split(' ').map((n: string) => n[0]).join('')}
                  <div className={`absolute bottom-0 right-0 h-6 w-6 rounded-full border-4 border-white ${sentimentColors[contact.ai_sentiment] || 'bg-slate-400'}`} />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-black text-primary">{contact.name}</h2>
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant="outline" className={`text-[10px] font-bold ${urgencyColors[contact.ai_urgency]}`}>
                      {contact.ai_urgency?.toUpperCase() || 'NURTURE'}
                    </Badge>
                    <Badge className="bg-accent text-white font-bold h-5 px-1.5">{contact.icpScore}/99</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button className="gap-2 bg-primary w-full h-11" onClick={() => handleLogActivity('call')}><Phone className="h-4 w-4" /> Call</Button>
                  <Button variant="outline" className="gap-2 w-full h-11" onClick={() => handleLogActivity('sms')}><MessageSquare className="h-4 w-4" /> SMS</Button>
                </div>
                <Button variant="outline" className="w-full gap-2 border-slate-200" onClick={() => handleLogActivity('email')}><Mail className="h-4 w-4" /> Email</Button>
                <Button variant="secondary" className="w-full gap-2"><Calendar className="h-4 w-4" /> Schedule Appt</Button>
              </div>

              <div className="space-y-6 pt-4 border-t border-slate-200">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Contact Information</p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 text-xs">
                      <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="font-medium">{contact.propertyAddress}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span className="font-medium">{contact.phone}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span className="font-medium">{contact.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            <div className="flex-1 flex flex-col bg-white">
              <ScrollArea className="flex-1">
                <div className="p-8 max-w-4xl mx-auto space-y-10">
                  {/* AI Nurture Engine Integration */}
                  <LeadNurtureEngine 
                    contactId={params.id as string} 
                    contactName={contact.name} 
                  />

                  {/* Gmail Conversation History */}
                  <section className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold flex items-center gap-2">
                        <Inbox className="h-5 w-5 text-primary" />
                        Gmail History
                      </h2>
                      <Badge variant="outline" className="bg-primary/5 text-primary">Live Sync Active</Badge>
                    </div>
                    
                    <div className="space-y-4">
                      {gmailMessages && gmailMessages.length > 0 ? (
                        gmailMessages.map((msg) => (
                          <div key={msg.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-primary">{msg.subject}</span>
                              <span className="text-[10px] text-muted-foreground">{msg.created_at ? format(msg.created_at.toDate(), 'MMM d, h:mm a') : ''}</span>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{msg.body}</p>
                            <div className="flex items-center gap-2 pt-1">
                              <Badge className="bg-green-500 text-[8px] h-4">DELIVERED</Badge>
                              {msg.threadId && <span className="text-[8px] text-muted-foreground">Thread ID: {msg.threadId.slice(0, 8)}...</span>}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed">
                          <Mail className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground">No linked Gmail conversations found.</p>
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="grid gap-6 md:grid-cols-2">
                    <Card className="border-none shadow-md bg-gradient-to-br from-slate-50 to-white">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                          <Sparkles className="h-4 w-4 text-accent" />
                          Monica AI Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs leading-relaxed text-slate-600 italic">"{contact.ai_summary || "Intelligence gathering in progress..."}"</p>
                      </CardContent>
                    </Card>
                    <Card className="border-none shadow-md bg-primary text-white">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-accent" />
                          Next Best Action
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm font-bold leading-relaxed">{contact.ai_next_best_action || "Schedule initial discovery call."}</p>
                      </CardContent>
                    </Card>
                  </section>

                  <section className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold flex items-center gap-2">
                        <History className="h-5 w-5 text-accent" />
                        CRM Timeline
                      </h2>
                    </div>

                    <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                      {activityLogs && activityLogs.length > 0 ? (
                        activityLogs.map((log) => (
                          <div key={log.id} className="relative pl-12">
                            <div className={`absolute left-0 h-10 w-10 rounded-full border-4 border-white flex items-center justify-center shadow-sm z-10 ${log.type === 'call' ? 'bg-blue-100 text-blue-600' : log.type === 'ai_note' ? 'bg-accent/10 text-accent' : 'bg-slate-100'}`}>
                              {log.type === 'call' ? <Phone className="h-4 w-4" /> : <BrainCircuit className="h-4 w-4" />}
                            </div>
                            <div className="space-y-1 pt-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                  {log.date ? format(new Date(log.date), 'MMM d, yyyy h:mm a') : ''}
                                </span>
                                {log.sentiment && <Badge className={`h-4 text-[8px] ${sentimentColors[log.sentiment]}`}>{log.sentiment.toUpperCase()}</Badge>}
                              </div>
                              <h4 className="font-bold text-slate-800">{log.outcome}</h4>
                              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100">{log.summary}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed">
                          <p className="text-xs text-muted-foreground">No CRM events logged yet.</p>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </ScrollArea>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
