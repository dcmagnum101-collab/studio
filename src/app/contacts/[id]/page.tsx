
"use client"

import React from "react"
import { useParams } from "next/navigation"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { MOCK_CONTACTS, Contact } from "@/lib/mock-data"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  MapPin, 
  Sparkles, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Clock, 
  BrainCircuit,
  History,
  FileText,
  Activity,
  ArrowLeft,
  Flame,
  User,
  MoreVertical
} from "lucide-react"
import Link from "next/link"

export default function ContactProfilePage() {
  const params = useParams();
  const contact = MOCK_CONTACTS.find(c => c.id === params.id) as Contact;

  if (!contact) return <div className="p-8">Contact not found</div>;

  const sentimentColors = {
    positive: 'bg-green-500',
    neutral: 'bg-slate-400',
    negative: 'bg-red-500'
  };

  const urgencyColors = {
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
            <Badge className="ml-2 bg-slate-100 text-slate-600 capitalize">{contact.pipeline_stage.replace('_', ' ')}</Badge>
            <div className="ml-auto flex gap-2">
              <Button size="sm" variant="outline" className="gap-2"><User className="h-4 w-4" /> Edit Profile</Button>
              <Button size="sm" variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
            </div>
          </header>
          
          <main className="flex h-[calc(100vh-64px)] overflow-hidden">
            {/* Left Sidebar - Summary */}
            <aside className="w-80 border-r bg-slate-50/50 p-6 flex flex-col gap-8 overflow-y-auto">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="h-24 w-24 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold relative shadow-xl">
                  {contact.name.split(' ').map(n => n[0]).join('')}
                  <div className={`absolute bottom-0 right-0 h-6 w-6 rounded-full border-4 border-white ${sentimentColors[contact.ai_sentiment]}`} />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-black text-primary">{contact.name}</h2>
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant="outline" className={`text-[10px] font-bold ${urgencyColors[contact.ai_urgency]}`}>
                      {contact.ai_urgency.toUpperCase()}
                    </Badge>
                    <Badge className="bg-accent text-white font-bold h-5 px-1.5">{contact.icpScore}/99</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button className="gap-2 bg-primary w-full h-11"><Phone className="h-4 w-4" /> Call</Button>
                  <Button variant="outline" className="gap-2 w-full h-11"><MessageSquare className="h-4 w-4" /> SMS</Button>
                </div>
                <Button variant="outline" className="w-full gap-2 border-slate-200"><Mail className="h-4 w-4" /> Email</Button>
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

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Lead Source</p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="bg-primary/5 text-primary text-[10px]">{contact.archagent_source}</Badge>
                    {contact.archagent_tags.map(tag => (
                      <Badge key={tag} className="bg-slate-100 text-slate-600 text-[10px]">{tag.replace('_', ' ')}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Center Area - Timeline & Intelligence */}
            <div className="flex-1 flex flex-col bg-white">
              <ScrollArea className="flex-1">
                <div className="p-8 max-w-4xl mx-auto space-y-10">
                  {/* AI Intel Panel */}
                  <section className="grid gap-6 md:grid-cols-2">
                    <Card className="border-none shadow-md bg-gradient-to-br from-slate-50 to-white">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                          <Sparkles className="h-4 w-4 text-accent" />
                          Monica AI Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs leading-relaxed text-slate-600 italic">"{contact.ai_summary}"</p>
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
                        <p className="text-sm font-bold leading-relaxed">{contact.ai_next_best_action}</p>
                      </CardContent>
                    </Card>
                  </section>

                  {/* Activity History */}
                  <section className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold flex items-center gap-2">
                        <History className="h-5 w-5 text-accent" />
                        Activity History
                      </h2>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="text-xs">All</Button>
                        <Button variant="ghost" size="sm" className="text-xs">Calls</Button>
                        <Button variant="ghost" size="sm" className="text-xs">Notes</Button>
                      </div>
                    </div>

                    <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                      {contact.activityLogs.map((log) => (
                        <div key={log.id} className="relative pl-12">
                          <div className={`absolute left-0 h-10 w-10 rounded-full border-4 border-white flex items-center justify-center shadow-sm z-10 ${log.type === 'call' ? 'bg-blue-100 text-blue-600' : log.type === 'ai_note' ? 'bg-accent/10 text-accent' : 'bg-slate-100'}`}>
                            {log.type === 'call' ? <Phone className="h-4 w-4" /> : <BrainCircuit className="h-4 w-4" />}
                          </div>
                          <div className="space-y-1 pt-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{new Date(log.date).toLocaleDateString()} at {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {log.sentiment && <Badge className={`h-4 text-[8px] ${sentimentColors[log.sentiment]}`}>{log.sentiment.toUpperCase()}</Badge>}
                            </div>
                            <h4 className="font-bold text-slate-800">{log.outcome}</h4>
                            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100">{log.summary}</p>
                            {log.nextAction && (
                              <div className="flex items-center gap-2 text-xs text-primary font-bold mt-2">
                                <ArrowRight className="h-3 w-3" /> Next Action: {log.nextAction}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </ScrollArea>
            </div>

            {/* Right Sidebar - Intel */}
            <aside className="w-80 border-l bg-slate-50/50 p-6 space-y-8 overflow-y-auto">
              <section className="space-y-4">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Deal Snapshot</h3>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] text-muted-foreground uppercase">Est. Commission</span>
                    <span className="text-lg font-black text-primary">${contact.estimated_commission?.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span>Probability</span>
                      <span className="text-accent">72%</span>
                    </div>
                    <Progress value={72} className="h-2" />
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" /> Expected Close: June 2024
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Property Intel</h3>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[9px] text-muted-foreground uppercase">Value Est.</span>
                      <div className="text-xs font-bold">$485k</div>
                    </div>
                    <div className="space-y-1 text-right">
                      <span className="text-[9px] text-muted-foreground uppercase">Equity</span>
                      <div className="text-xs font-bold">High (55%)</div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-muted-foreground uppercase">Days on Market</span>
                    <div className="text-xs font-bold">42 (FSBO)</div>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Upcoming Tasks</h3>
                <div className="space-y-2">
                  <div className="p-3 bg-white rounded-xl border border-slate-100 flex items-center gap-3 shadow-sm">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-bold truncate">Call: Divorce discussion</p>
                      <p className="text-[9px] text-muted-foreground">Today at 10:00 AM</p>
                    </div>
                  </div>
                </div>
              </section>
            </aside>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
