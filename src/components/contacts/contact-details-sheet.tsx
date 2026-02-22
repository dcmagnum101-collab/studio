"use client"

import React, { useState, useEffect, useMemo } from "react"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
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
  Clock, 
  Building2, 
  AlertCircle, 
  Sparkles, 
  MessageSquare, 
  PhoneCall, 
  MapPin, 
  User, 
  MoreVertical, 
  CheckCircle2, 
  Send, 
  RefreshCw, 
  ArrowRight, 
  ShieldCheck, 
  MailX,
  Plus,
  ExternalLink,
  Copy,
  Save,
  X,
  Zap,
  Globe,
  Facebook,
  Linkedin,
  Instagram,
  Youtube,
  Search,
  Scale,
  Camera,
  Printer,
  FileBadge
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  useUser, 
  useFirestore, 
  useDoc, 
  updateDocumentNonBlocking, 
  addDocumentNonBlocking 
} from "@/firebase"
import { useConversationHistory, useTasks, useAppointments } from "@/hooks/useFirestoreData"
import { generateNurtureEmail, generateConversationCoaching } from "@/app/actions/nurture-ai"
import { sendNurtureEmail } from "@/app/actions/gmail"
import { logVulcan7CallResult } from "@/app/actions/vulcan7"
import { refreshListingDetailAction } from "@/app/actions/lvr-mls"
import { generateAppointmentBrief, type AppointmentBrief } from "@/app/actions/appointment-brief"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { collection, doc } from "firebase/firestore"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ComplianceGuard } from "@/components/compliance/ComplianceGuard"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface ContactDetailsSheetProps {
  contact: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactDetailsSheet({ contact: initialContact, open, onOpenChange }: ContactDetailsSheetProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [isRefreshingMLS, setIsRefreshingMLS] = useState(false);
  
  // Briefing state
  const [brief, setBrief] = useState<AppointmentBrief | null>(null);
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [generatingBrief, setBriefingLoading] = useState(false);
  
  const contactId = initialContact?.id;
  const contactPath = useMemo(() => user && contactId ? `users/${user.uid}/contacts/${contactId}` : null, [user, contactId]);
  const { data: contact, isLoading: contactLoading } = useDoc(contactPath);
  const { data: history, isLoading: historyLoading } = useConversationHistory(contactId || "");
  const { data: appointments } = useAppointments();

  const hasAppointment = useMemo(() => {
    return appointments?.some(a => a.contactId === contactId);
  }, [appointments, contactId]);

  const canGenerateBrief = useMemo(() => {
    return contact?.pipeline_stage === 'appointment_set' || contact?.pipeline_stage === 'active' || hasAppointment;
  }, [contact, hasAppointment]);

  const handleRefreshMLS = async () => {
    if (!user || !contact?.mlsNumber) return;
    setIsRefreshingMLS(true);
    try {
      const freshData = await refreshListingDetailAction(user.uid, contact.mlsNumber);
      const ref = doc(firestore, `users/${user.uid}/contacts/${contactId}`);
      updateDocumentNonBlocking(ref, {
        ...freshData,
        updated_at: new Date().toISOString()
      });
      toast({ title: "MLS Data Refreshed", description: "Successfully pulled latest LVR listing details." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Refresh Failed", description: err.message });
    } finally {
      setIsRefreshingMLS(false);
    }
  };

  const handleGenerateBrief = async () => {
    if (!user || !contactId) return;
    setBriefingLoading(true);
    try {
      const result = await generateAppointmentBrief(user.uid, contactId);
      setBrief(result);
      setBriefingOpen(true);
      toast({ title: "Strategy Brief Ready", description: "Monica has prepared your listing battle plan." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Briefing Failed", description: err.message });
    } finally {
      setBriefingLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!contactId || contactLoading) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-2xl w-full p-0 flex flex-col shadow-2xl border-l border-slate-200">
          <SheetHeader className="p-6 bg-slate-50 border-b relative">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary text-[10px] font-black uppercase tracking-widest">
                    {contact.archagent_source?.replace('_', ' ') || 'CRM LEAD'}
                  </Badge>
                  {contact.mlsNumber && (
                    <Badge className="bg-blue-600 text-[10px] font-black uppercase tracking-widest">LVR MLS: {contact.mlsNumber}</Badge>
                  )}
                </div>
                <SheetTitle className="text-3xl font-black font-headline text-primary mt-2">
                  {contact.name}
                </SheetTitle>
                <p className="text-xs font-bold text-muted-foreground">{contact.propertyAddress}</p>
              </div>
              <div className="text-center p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">ICP Score</p>
                <p className="text-3xl font-black text-primary leading-none">{contact.icpScore}</p>
                <p className="text-[10px] font-bold text-muted-foreground">/ 99</p>
              </div>
            </div>
          </SheetHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 border-b bg-white">
              <TabsList className="w-full justify-start gap-6 h-12 bg-transparent p-0 rounded-none overflow-x-auto no-scrollbar">
                <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-bold text-xs uppercase tracking-widest">Overview</TabsTrigger>
                <TabsTrigger value="ai-steps" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-bold text-xs uppercase tracking-widest gap-2">
                  <Sparkles className="h-3 w-3 text-accent" /> AI Steps
                </TabsTrigger>
                <TabsTrigger value="property" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-bold text-xs uppercase tracking-widest">Property Intel</TabsTrigger>
                <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-bold text-xs uppercase tracking-widest">History</TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1 bg-slate-50/30">
              <div className="p-6">
                
                <TabsContent value="overview" className="m-0 space-y-6">
                  <section className="grid grid-cols-1 gap-4">
                    {canGenerateBrief && (
                      <Button 
                        onClick={handleGenerateBrief} 
                        disabled={generatingBrief}
                        className="w-full h-12 bg-accent hover:bg-accent/90 text-primary font-black uppercase tracking-widest shadow-lg gap-2"
                      >
                        {generatingBrief ? <RefreshCw className="h-5 w-5 animate-spin" /> : <FileBadge className="h-5 w-5" />}
                        Generate Appointment Brief
                      </Button>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline" className="h-11 font-bold gap-2"><Phone className="h-4 w-4" /> Call</Button>
                      <Button variant="outline" className="h-11 font-bold gap-2"><Mail className="h-4 w-4" /> Email</Button>
                    </div>
                  </section>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Beds', value: contact.beds, icon: Home },
                      { label: 'Baths', value: contact.baths, icon: Home },
                      { label: 'SqFt', value: contact.sqft, icon: Scale },
                      { label: 'Built', value: contact.yearBuilt, icon: Calendar }
                    ].map((item, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                        <p className="text-sm font-bold text-slate-700">{item.value || 'N/A'}</p>
                      </div>
                    ))}
                  </div>

                  <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center">
                      <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Lead Motivation</h4>
                      <Badge variant="secondary" className="capitalize">{contact.ai_urgency || 'Normal'}</Badge>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-slate-600 leading-relaxed italic">"{contact.motivation || 'Standard buyer/seller profile — monitoring for specific signals.'}"</p>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="property" className="m-0 space-y-8">
                  {contact.photos?.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                        <Camera className="h-3 w-3 text-accent" /> Listing Media
                      </h4>
                      <Carousel className="w-full max-w-xl mx-auto">
                        <CarouselContent>
                          {contact.photos.map((url: string, i: number) => (
                            <CarouselItem key={i}>
                              <div className="aspect-video rounded-2xl overflow-hidden bg-slate-200">
                                <img src={url} className="w-full h-full object-cover" alt={`Property photo ${i+1}`} />
                              </div>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        <CarouselPrevious className="left-2" />
                        <CarouselNext className="right-2" />
                      </Carousel>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border-none shadow-sm bg-white p-4 space-y-1">
                      <p className="text-[8px] font-black uppercase text-slate-400">List Price</p>
                      <p className="text-lg font-black text-primary">${contact.listPrice?.toLocaleString() || 'N/A'}</p>
                    </Card>
                    <Card className="border-none shadow-sm bg-white p-4 space-y-1">
                      <p className="text-[8px] font-black uppercase text-slate-400">Days on Market</p>
                      <p className="text-lg font-black text-slate-700">{contact.daysOnMarket || '0'} Days</p>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">LVR MLS Details</h4>
                      {contact.mlsNumber && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 text-[10px] font-black gap-2 border-blue-200 text-blue-600 bg-blue-50"
                          onClick={handleRefreshMLS}
                          disabled={isRefreshingMLS}
                        >
                          {isRefreshingMLS ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                          Refresh LVR Data
                        </Button>
                      )}
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 divide-y">
                      <div className="p-4 flex justify-between">
                        <span className="text-xs text-slate-500">Listing Agent</span>
                        <span className="text-xs font-bold text-slate-700">{contact.listingAgent || 'Unknown'}</span>
                      </div>
                      <div className="p-4 flex justify-between">
                        <span className="text-xs text-slate-500">Brokerage</span>
                        <span className="text-xs font-bold text-slate-700">{contact.brokerage || 'Unknown'}</span>
                      </div>
                      <div className="p-4 flex justify-between">
                        <span className="text-xs text-slate-500">Status</span>
                        <Badge variant="outline" className="text-[10px] font-bold uppercase">{contact.listing_status || 'Offline'}</Badge>
                      </div>
                      {contact.remarks && (
                        <div className="p-4 space-y-2">
                          <span className="text-xs text-slate-500">Public Remarks</span>
                          <p className="text-xs leading-relaxed text-slate-600 italic">"{contact.remarks}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* ... AI Steps and History tabs logic ... */}
                
              </div>
            </ScrollArea>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Appointment Briefing Modal */}
      <Dialog open={briefingOpen} onOpenChange={setBriefingOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
          <div className="print:block" id="appointment-brief">
            <header className="bg-primary text-white p-8 space-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <FileBadge className="h-24 w-24" />
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-accent text-primary font-black px-2">CONFIDENTIAL</Badge>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Pre-Appointment Intelligence Brief</span>
              </div>
              <DialogTitle className="text-3xl font-black font-headline">Listing Strategy: {contact.name}</DialogTitle>
              <DialogDescription className="text-primary-foreground/70 flex items-center gap-2">
                <MapPin className="h-4 w-4" /> {contact.propertyAddress}
              </DialogDescription>
            </header>

            <div className="p-8 space-y-8 bg-white">
              {brief ? (
                <div className="grid gap-8">
                  <section className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2 border-b pb-2">
                        <Home className="h-4 w-4" /> Property & Pricing
                      </h3>
                      <p className="text-sm text-slate-700 leading-relaxed font-medium">{brief.property_summary}</p>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Pricing Approach</p>
                        <p className="text-sm text-slate-800 font-bold">{brief.pricing_approach}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2 border-b pb-2">
                        <Zap className="h-4 w-4 text-accent" /> Seller Motivation
                      </h3>
                      <p className="text-sm text-slate-700 leading-relaxed">{brief.seller_motivation}</p>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Conversation Starters</p>
                        {brief.conversation_starters.map((s, i) => (
                          <div key={i} className="flex gap-2 items-start text-xs italic text-slate-600">
                            <span className="text-accent font-bold">•</span> {s}
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  <section className="bg-primary/5 p-6 rounded-2xl border border-primary/10 space-y-4">
                    <h3 className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" /> Objection Handling Dashboard
                    </h3>
                    <div className="grid gap-4">
                      {brief.likely_objections.map((obj, i) => (
                        <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                          <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                            <p className="text-[10px] font-black text-red-400 uppercase mb-1">Likely Objection</p>
                            <p className="text-xs font-bold text-red-900">"{obj}"</p>
                          </div>
                          <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                            <p className="text-[10px] font-black text-green-400 uppercase mb-1">Monica's Rebuttal</p>
                            <p className="text-xs font-medium text-green-900">{brief.objection_responses[i]}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                      <h3 className="text-sm font-black text-primary uppercase tracking-widest border-b pb-2">Strategic Closing</h3>
                      <p className="text-sm font-bold bg-accent/10 text-primary p-4 rounded-xl border border-accent/20 italic">
                        "{brief.close_strategy}"
                      </p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-sm font-black text-red-600 uppercase tracking-widest border-b pb-2">Avoid</h3>
                      <ul className="space-y-2">
                        {brief.things_to_avoid.map((a, i) => (
                          <li key={i} className="text-xs text-red-700 flex gap-2">
                            <X className="h-3 w-3 mt-0.5 shrink-0" /> {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>

                  <section className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-black text-accent uppercase tracking-widest">
                      <Landmark className="h-3 w-3" /> Nevada-Specific Intelligence
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{brief.nevada_specific_notes}</p>
                  </section>
                </div>
              ) : (
                <div className="py-20 text-center animate-pulse text-slate-400 italic">Synthesizing intelligence...</div>
              )}
            </div>

            <footer className="p-6 bg-slate-50 border-t flex justify-end gap-3 print:hidden">
              <Button variant="outline" onClick={() => setBriefingOpen(false)}>Close Intelligence</Button>
              <Button onClick={handlePrint} className="gap-2 bg-primary">
                <Printer className="h-4 w-4" /> Print Listing Brief
              </Button>
            </footer>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
