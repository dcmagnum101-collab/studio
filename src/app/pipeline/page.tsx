"use client"

import React from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { MOCK_CONTACTS, Contact, PipelineStage } from "@/lib/mock-data"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Trello, 
  MoreHorizontal, 
  Phone, 
  Mail, 
  MessageSquare, 
  Flame, 
  Clock,
  TrendingUp,
  DollarSign
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

const STAGES: { id: PipelineStage; label: string; color: string }[] = [
  { id: 'new_lead', label: 'New Lead', color: 'bg-blue-500' },
  { id: 'attempted_contact', label: 'Attempted', color: 'bg-slate-400' },
  { id: 'conversation_had', label: 'Conversation', color: 'bg-orange-400' },
  { id: 'follow_up_scheduled', label: 'Follow Up', color: 'bg-yellow-500' },
  { id: 'appointment_set', label: 'Appt Set', color: 'bg-purple-500' },
  { id: 'closed', label: 'Closed', color: 'bg-green-600' },
];

export default function PipelinePage() {
  const getContactsInStage = (stageId: PipelineStage) => {
    return MOCK_CONTACTS.filter(c => c.pipeline_stage === stageId);
  };

  const getStageValue = (stageId: PipelineStage) => {
    const contacts = getContactsInStage(stageId);
    return contacts.reduce((sum, c) => sum + (c.estimated_commission || 0), 0);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-xl font-bold font-headline text-primary">Deal Pipeline</h1>
            <div className="ml-auto flex items-center gap-4">
              <div className="text-right">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Value</div>
                <div className="text-sm font-bold text-primary">$1,482,000</div>
              </div>
              <Button size="sm" className="bg-accent hover:bg-accent/90">Add Deal</Button>
            </div>
          </header>
          
          <main className="p-6 h-[calc(100vh-64px)] bg-slate-50/50">
            <div className="flex gap-6 h-full overflow-x-auto pb-4 custom-scrollbar">
              {STAGES.map((stage) => {
                const contacts = getContactsInStage(stage.id);
                const value = getStageValue(stage.id);
                
                return (
                  <div key={stage.id} className="flex-shrink-0 w-80 flex flex-col gap-4">
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${stage.color}`} />
                        <h3 className="font-bold text-slate-700">{stage.label}</h3>
                        <Badge variant="secondary" className="bg-slate-200 text-slate-600 h-5 px-1.5">{contacts.length}</Badge>
                      </div>
                      <div className="text-xs font-bold text-muted-foreground">
                        ${value.toLocaleString()}
                      </div>
                    </div>

                    <ScrollArea className="flex-1 rounded-xl bg-slate-100/50 p-2 border border-slate-200/50">
                      <div className="space-y-3">
                        {contacts.map((contact) => (
                          <Card key={contact.id} className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer group">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex justify-between items-start">
                                <div className="space-y-0.5">
                                  <div className="font-bold text-sm flex items-center gap-1 text-primary">
                                    {contact.name}
                                    {contact.ai_urgency === 'hot' && <Flame className="h-3 w-3 text-red-500 fill-red-500" />}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground truncate w-56">{contact.propertyAddress}</div>
                                </div>
                                <Badge className="bg-slate-100 text-slate-600 text-[10px] h-5 px-1 font-bold">{contact.icpScore}</Badge>
                              </div>

                              <div className="flex flex-wrap gap-1">
                                <Badge variant="outline" className="text-[9px] h-4 py-0 bg-white capitalize">{contact.archagent_source}</Badge>
                                <Badge variant="outline" className="text-[9px] h-4 py-0 bg-white">${contact.estimated_commission?.toLocaleString()}</Badge>
                              </div>

                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="flex -space-x-1">
                                    <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full bg-slate-50 border border-slate-100">
                                      <Phone className="h-3 w-3 text-slate-600" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full bg-slate-50 border border-slate-100">
                                      <MessageSquare className="h-3 w-3 text-slate-600" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="text-[9px] text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> 2d ago
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        {contacts.length === 0 && (
                          <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-xs text-muted-foreground">
                            No deals in this stage
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )
              })}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
