"use client";
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { PipelineStage } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trello, Phone, MessageSquare, Flame, ArrowRight, RefreshCw, Layers } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { collection, query, doc } from "firebase/firestore";
import Link from "next/link";

const STAGES: { id: PipelineStage; label: string; color: string }[] = [
  { id: "new_lead", label: "New Lead", color: "bg-blue-500" },
  { id: "attempted_contact", label: "Attempted", color: "bg-slate-400" },
  { id: "conversation_had", label: "Conversation", color: "bg-orange-400" },
  { id: "follow_up_scheduled", label: "Follow Up", color: "bg-yellow-500" },
  { id: "appointment_set", label: "Appt Set", color: "bg-purple-500" },
  { id: "closed", label: "Closed", color: "bg-green-600" },
];

export default function PipelinePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const contactsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, "users", user.uid, "contacts"));
  }, [user, firestore]);

  const { data: contacts, isLoading } = useCollection(contactsQuery);

  const getContactsInStage = (stageId: PipelineStage) => {
    return (contacts || []).filter((c) => c.pipeline_stage === stageId);
  };

  const getStageValue = (stageId: PipelineStage) => {
    const stageContacts = getContactsInStage(stageId);
    return stageContacts.reduce((sum, c) => sum + (c.estimated_commission || 0), 0);
  };

  const handleMoveStage = (contactId: string, nextStage: PipelineStage) => {
    if (!user || !firestore) return;
    const contactRef = doc(firestore, "users", user.uid, "contacts", contactId);
    updateDocumentNonBlocking(contactRef, {
      pipeline_stage: nextStage,
      updated_at: new Date().toISOString(),
    });
  };

  if (!mounted) return null;

  const totalValue = STAGES.reduce((sum, s) => sum + getStageValue(s.id), 0);
  const totalContacts = contacts?.length || 0;

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
                <div className="text-sm font-bold text-primary">${totalValue.toLocaleString()}</div>
              </div>
              <Button size="sm" className="bg-accent hover:bg-accent/90">
                Add Deal
              </Button>
            </div>
          </header>

          <main className="p-6 h-[calc(100vh-64px)] bg-slate-50/50">
            {!isLoading && totalContacts === 0 ? (
              <div className="h-full flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="h-24 w-24 bg-primary/5 rounded-full flex items-center justify-center">
                  <Layers className="h-12 w-12 text-primary opacity-20" />
                </div>
                <div className="text-center space-y-3">
                  <h2 className="text-3xl font-black text-primary">Your pipeline is empty</h2>
                  <p className="text-slate-500 max-sm mx-auto text-sm leading-relaxed">
                    Leads move through these stages automatically as you work them. Import contacts to begin visualizing your deal flow.
                  </p>
                </div>
                <Button asChild size="lg" className="bg-primary h-14 px-12 rounded-2xl font-black shadow-2xl shadow-primary/10 gap-2">
                  <Link href="/contacts">
                    Import Leads <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex gap-6 h-full overflow-x-auto pb-4 custom-scrollbar">
                {STAGES.map((stage, index) => {
                  const stageContacts = getContactsInStage(stage.id);
                  const value = getStageValue(stage.id);
                  const nextStage = STAGES[index + 1]?.id;

                  return (
                    <div key={stage.id} className="flex-shrink-0 w-80 flex flex-col gap-4">
                      <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${stage.color}`} />
                          <h3 className="font-bold text-slate-700">{stage.label}</h3>
                          <Badge variant="secondary" className="bg-slate-200 text-slate-600 h-5 px-1.5">
                            {isLoading ? "..." : stageContacts.length}
                          </Badge>
                        </div>
                        <div className="text-xs font-bold text-muted-foreground">${value.toLocaleString()}</div>
                      </div>

                      <ScrollArea className="flex-1 rounded-xl bg-slate-100/50 p-2 border border-slate-200/50">
                        <div className="space-y-3">
                          {isLoading ? (
                            <div className="p-12 flex justify-center">
                              <RefreshCw className="h-6 w-6 animate-spin text-slate-300" />
                            </div>
                          ) : stageContacts.length > 0 ? (
                            stageContacts.map((contact) => (
                              <Card
                                key={contact.id}
                                className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer group"
                              >
                                <CardContent className="p-4 space-y-3">
                                  <Link href={`/contacts/${contact.id}`}>
                                    <div className="flex justify-between items-start mb-2">
                                      <div className="space-y-0.5">
                                        <div className="font-bold text-sm flex items-center gap-1 text-primary">
                                          {contact.name}
                                          {contact.ai_urgency === "hot" && (
                                            <Flame className="h-3 w-3 text-red-500 fill-red-500" />
                                          )}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground truncate w-56">
                                          {contact.propertyAddress}
                                        </div>
                                      </div>
                                      <Badge className="bg-slate-100 text-slate-600 text-[10px] h-5 px-1 font-bold">
                                        {contact.icpScore}
                                      </Badge>
                                    </div>
                                  </Link>

                                  <div className="flex flex-wrap gap-1">
                                    <Badge variant="outline" className="text-[9px] h-4 py-0 bg-white capitalize">
                                      {contact.archagent_source?.replace("_", " ")}
                                    </Badge>
                                    <Badge variant="outline" className="text-[9px] h-4 py-0 bg-white">
                                      ${contact.estimated_commission?.toLocaleString()}
                                    </Badge>
                                  </div>

                                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="flex -space-x-1">
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-6 w-6 rounded-full bg-slate-50 border border-slate-100"
                                        >
                                          <Phone className="h-3 w-3 text-slate-600" />
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-6 w-6 rounded-full bg-slate-50 border border-slate-100"
                                        >
                                          <MessageSquare className="h-3 w-3 text-slate-600" />
                                        </Button>
                                      </div>
                                    </div>
                                    {nextStage && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 text-[10px] gap-1 px-2"
                                        onClick={() => handleMoveStage(contact.id, nextStage)}
                                      >
                                        Move <ArrowRight className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                          ) : (
                            <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-xs text-muted-foreground">
                              No deals in this stage
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
