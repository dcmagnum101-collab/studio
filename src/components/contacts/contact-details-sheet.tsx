
"use client"

import React, { useState, useEffect } from "react"
import { Contact } from "@/lib/mock-data"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Phone, 
  Mail, 
  History, 
  Calendar, 
  FileText, 
  Home, 
  TrendingUp,
  BrainCircuit,
  Timer,
  Info,
  Clock
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"

interface ContactDetailsSheetProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactDetailsSheet({ contact, open, onOpenChange }: ContactDetailsSheetProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!contact) return null;

  const getUrgencyMessage = () => {
    if (contact.archagent_source === 'preforeclosure' && contact.auction_date) {
      const days = Math.ceil((new Date(contact.auction_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return { text: `Auction in ${days} days`, color: 'text-red-600 bg-red-50' };
    }
    if (contact.archagent_source === 'expired' && contact.days_since_expired) {
      return { text: `Expired ${contact.days_since_expired} days ago`, color: 'text-orange-600 bg-orange-50' };
    }
    if (contact.archagent_source === 'fsbo' && contact.days_on_market) {
      return { text: `On Market ${contact.days_on_market} days`, color: 'text-blue-600 bg-blue-50' };
    }
    return null;
  };

  const urgency = getUrgencyMessage();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full p-0 flex flex-col">
        <SheetHeader className="p-6 bg-slate-50/50 border-b">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest text-primary border-primary">
                  {contact.archagent_source.replace('_', ' ')}
                </Badge>
                {urgency && (
                  <Badge variant="outline" className={`text-[10px] font-bold ${urgency.color}`}>
                    {urgency.text}
                  </Badge>
                )}
              </div>
              <SheetTitle className="text-3xl font-bold font-headline text-primary">{contact.name}</SheetTitle>
              <div className="flex flex-wrap gap-1 mt-2">
                {contact.archagent_tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="bg-primary/5 text-primary text-[10px] py-0 px-2">
                    {tag.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center p-3 bg-white rounded-xl shadow-sm border border-slate-100">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">ICP Score</span>
              <span className="text-3xl font-black text-primary">{contact.icpScore}</span>
              <span className="text-[10px] text-muted-foreground">/ 99</span>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button size="sm" className="flex-1 gap-2 font-bold shadow-md"><Phone className="h-4 w-4" /> Call Lead</Button>
            <Button size="sm" variant="outline" className="flex-1 gap-2 border-slate-200"><Mail className="h-4 w-4" /> Email</Button>
            <Button size="sm" variant="outline" className="flex-1 gap-2 border-slate-200"><BrainCircuit className="h-4 w-4" /> AI Research</Button>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-8 space-y-10">
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-widest">
                <Home className="h-4 w-4" /> Property Intelligence
              </div>
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="space-y-1">
                  <div className="text-[10px] text-muted-foreground uppercase">Address</div>
                  <div className="text-sm font-semibold">{contact.propertyAddress}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-muted-foreground uppercase">Property Type</div>
                  <div className="text-sm font-semibold capitalize">{contact.property_type.replace('_', ' ')}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-muted-foreground uppercase">Equity Status (LTV)</div>
                  <div className="space-y-2">
                    <Progress value={contact.loan_to_value} className="h-2" />
                    <div className="text-xs font-bold text-primary">{contact.loan_to_value}% LTV — {contact.loan_to_value! < 50 ? 'High Equity' : 'Standard'}</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-muted-foreground uppercase">Est. Value</div>
                  <div className="text-sm font-bold text-accent">$485,000</div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-widest">
                <BrainCircuit className="h-4 w-4" /> AI Predictive Insights
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-green-500" /> Likely to List</span>
                    <span>{contact.likely_to_list_score || 0}% Confidence</span>
                  </div>
                  <Progress value={contact.likely_to_list_score || 0} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="flex items-center gap-1"><BrainCircuit className="h-3 w-3 text-blue-500" /> Likely to Lead</span>
                    <span>{contact.likely_to_lead_score || 0}% Confidence</span>
                  </div>
                  <Progress value={contact.likely_to_lead_score || 0} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-purple-500" /> Likely to Contact</span>
                    <span>{contact.likely_to_contact_score || 0}% Confidence</span>
                  </div>
                  <Progress value={contact.likely_to_contact_score || 0} className="h-2" />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-widest">
                  <Timer className="h-4 w-4" /> Outreach Sequence
                </div>
                <Button variant="link" size="sm" className="text-xs font-bold">Manage Sequence</Button>
              </div>
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <div className="text-xs font-bold text-primary">Active Sequence</div>
                    <div className="text-sm font-bold">{contact.archagent_source}_urgent_sequence</div>
                  </div>
                  <Badge className="bg-primary text-[10px]">Step {contact.sequence_step + 1} of 4</Badge>
                </div>
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 flex-1 rounded-full ${i <= contact.sequence_step + 1 ? 'bg-primary' : 'bg-primary/20'}`} 
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> Next Touch: Scheduled for tomorrow morning (7:30 AM)
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-widest">
                <Info className="h-4 w-4" /> Seller Motivation Intelligence
              </div>
              <div className="p-4 bg-orange-50 rounded-xl text-sm italic border border-orange-100 text-orange-900 leading-relaxed shadow-sm">
                "{contact.motivation}"
              </div>
            </section>

            <section className="space-y-4 pb-12">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-widest">
                <History className="h-4 w-4" /> Interaction History
              </div>
              <div className="space-y-6">
                {contact.activityLogs.length > 0 ? (
                  contact.activityLogs.map((log) => (
                    <div key={log.id} className="relative pl-8 pb-6 border-l-2 border-slate-100 last:border-0 last:pb-0">
                      <div className="absolute -left-2.5 top-1 h-5 w-5 rounded-full bg-white border-2 border-primary flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-primary flex items-center gap-1 uppercase tracking-tighter">
                            {log.type}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {mounted ? new Date(log.date).toLocaleDateString() : '...'}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-slate-800">{log.outcome}</p>
                        <p className="text-xs text-muted-foreground italic leading-relaxed">"{log.summary}"</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Intelligence gathering in progress...</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
