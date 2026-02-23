"use client"

import React, { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  Inbox,
  Clock,
  ClipboardList,
  RefreshCw
} from "lucide-react"
import Link from "next/link"
import { useUser, useFirestore, useDoc, useMemoFirebase, addDocumentNonBlocking } from "@/firebase"
import { collection } from "firebase/firestore"
import { format } from "date-fns"
import { LeadNurtureEngine } from "@/components/contacts/nurture-engine"
import { useConversationHistory } from "@/hooks/useFirestoreData"

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
  const { data: history, isLoading: historyLoading } = useConversationHistory(params.id as string);

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

  if (contactLoading) return <div className="p-8 text-center text-slate-400 italic">Syncing Lead Intelligence...</div>;
  if (!contact) return <div className="p-8 text-center">Lead not found in database.</div>;

  const sentimentColors: Record<string, string> = {
    positive: 'bg-green-500',
    neutral: 'bg-slate-400',
    negative: 'bg-red-500'
  };

  const urgencyColors: Record<string, string> = {
    hot: 'text-red-600 bg-red-50 border-red-100',
    warm: 'text-orange-600 bg-orange-50 border-orange-100',
    cold: 'text-blue-600 bg-blue-50 border-blue-100',
    nurture: 'text-purple-600 bg-purple-50 border-purple-100'
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 md:px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <Link href="/contacts" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm md:text-lg font-bold font-headline text-primary truncate">{contact.name}</h1>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <Button size="sm" variant="outline" className="hidden sm:flex gap-2 font-bold h-9 rounded-xl"><User className="h-4 w-4" /> Edit</Button>
              <Button size="icon" variant="ghost" className="h-9 w-9 text-slate-400"><MoreVertical className="h-4 w-4" /></Button>
            </div>
          </header>
          
          <main className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden">
            <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r bg-slate-50/50 p-4 md:p-6 flex flex-col gap-6 md:gap-8 overflow-y-auto no-scrollbar">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="h-20 w-20 md:h-24 md:w-24 rounded-3xl bg-primary flex items-center justify-center text-white text-3xl font-black relative shadow-2xl">
                  {contact.name?.split(' ').map((n: string) => n[0]).join('')}
                  <div className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-4 border-white ${sentimentColors[contact.ai_sentiment] || 'bg-slate-400'}`} />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-black text-primary">{contact.name}</h2>
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-widest px-2 ${urgencyColors[contact.ai_urgency] || 'text-slate-500 bg-slate-50'}`}>
                      {contact.ai_urgency || 'NURTURE'}
                    </Badge>
                    <Badge className="bg-accent text-white font-black h-5 px-2 text-[10px]">{contact.icpScore}/99 ICP</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                <a href={`tel:${contact.phone?.replace(/\D/g, '')}`} className="w-full">
                  <Button className="gap-2 bg-primary w-full h-11 rounded-xl shadow-lg shadow-primary/10 font-bold" onClick={() => handleLogActivity('call')}><Phone className="h-4 w-4" /> Call</Button>
                </a>
                <Button variant="outline" className="gap-2 w-full h-11 rounded-xl bg-white font-bold border-slate-200" onClick={() => handleLogActivity('sms')}><MessageSquare className="h-4 w-4 text-primary" /> SMS</Button>
                <Button variant="outline" className="hidden lg:flex w-full h-11 gap-2 border-slate-200 bg-white font-bold rounded-xl" onClick={() => handleLogActivity('email')}><Mail className="h-4 w-4 text-primary" /> Email</Button>
                <Button variant="secondary" className="hidden lg:flex w-full h-11 gap-2 font-bold rounded-xl"><Calendar className="h-4 w-4 text-primary" /> Schedule</Button>
              </div>

              <div className="space-y-6 pt-4 border-t border-slate-200">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <ClipboardList className="h-3 w-3" /> Lead Context
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-black uppercase text-slate-400 leading-none">Property Address</p>
                        <span className="text-xs font-bold text-slate-700 leading-tight block">{contact.propertyAddress}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-primary shrink-0" />
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-black uppercase text-slate-400 leading-none">Primary Phone</p>
                        <a href={`tel:${contact.phone?.replace(/\D/g, '')}`} className="text-xs font-bold text-slate-700 hover:text-primary transition-colors leading-tight block">
                          {contact.phone || 'No phone recorded'}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-primary shrink-0" />
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-black uppercase text-slate-400 leading-none">Email Identity</p>
                        <span className="text-xs font-bold text-slate-700 leading-tight block truncate w-48">{contact.email || 'No email recorded'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            <div className="flex-1 flex flex-col bg-white overflow-hidden">
              <ScrollArea className="flex-1">
                <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-10">
                  <LeadNurtureEngine 
                    contactId={params.id as string} 
                    contactName={contact.name} 
                  />

                  <section className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base md:text-lg font-black flex items-center gap-2 text-primary">
                        <Inbox className="h-5 w-5 text-primary" />
                        Conversation History
                      </h2>
                      <Badge variant="outline" className="bg-primary/5 text-primary text-[9px] font-bold h-5 border-primary/10 uppercase tracking-widest">Unified Sync</Badge>
                    </div>
                    
                    <div className="space-y-4">
                      {historyLoading ? (
                        <div className="text-center py-12"><RefreshCw className="h-6 w-6 animate-spin mx-auto text-slate-300" /></div>
                      ) : history && history.length > 0 ? (
                        history.map((item) => (
                          <div key={item.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/30 space-y-2 hover:border-primary/20 transition-colors group">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <div className={`h-6 w-6 rounded-lg flex items-center justify-center ${item.type === 'email' ? 'bg-blue-100 text-blue-600' : item.type === 'call' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'}`}>
                                  {item.type === 'email' ? <Mail className="h-3 w-3" /> : item.type === 'call' ? <Phone className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                                </div>
                                <span className="text-xs font-black text-primary group-hover:text-accent transition-colors">
                                  {item.subject || item.outcome || 'Interaction Logged'}
                                </span>
                              </div>
                              <span className="text-[9px] font-bold text-muted-foreground uppercase">{format(new Date(item.date), 'MMM d, h:mm a')}</span>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{item.content}</p>
                            <div className="flex items-center justify-between pt-1">
                              <Badge className={`${sentimentColors[item.sentiment] || 'bg-slate-400'} text-[8px] h-4 font-black uppercase`}>{item.source}</Badge>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                          <p className="text-xs text-muted-foreground italic">No communication history found for this contact.</p>
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="grid gap-6 grid-cols-1 md:grid-cols-2">
                    <Card className="border-none shadow-md bg-gradient-to-br from-slate-50 to-white">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black flex items-center gap-2 text-primary uppercase tracking-widest">
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
                        <CardTitle className="text-xs font-black flex items-center gap-2 uppercase tracking-widest text-accent">
                          <TrendingUp className="h-4 w-4 text-accent" />
                          Strategic Next Step
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm font-bold leading-relaxed">{contact.ai_next_best_action || "Initiate initial discovery call to gauge timeline."}</p>
                      </CardContent>
                    </Card>
                  </section>
                </div>
              </ScrollArea>
            </div>
          </main>

          <footer className="p-4 bg-white border-t flex flex-col md:flex-row justify-between items-center gap-4 opacity-60">
            <div className="space-y-1 text-center md:text-left">
              <p className="text-sm font-black text-primary">Monica Selvaggio</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Licensed Real Estate Professional</p>
            </div>
            <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <span className="flex items-center gap-2"><Phone className="h-3 w-3" /> (702) 555-0199</span>
              <span className="flex items-center gap-2"><Mail className="h-3 w-3" /> monicaselvaggio@gmail.com</span>
            </div>
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
