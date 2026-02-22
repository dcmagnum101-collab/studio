
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
import { normalizePhone } from "@/lib/utils"

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
      toast({ title: "MLS Refreshed", description: "Successfully pulled LVR data." });
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
      toast({ title: "Brief Ready", description: "Listing strategy synthesized." });
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
        <SheetContent side="bottom" className="inset-x-0 bottom-0 h-[95vh] sm:h-full sm:w-full sm:max-w-2xl sm:inset-y-0 sm:right-0 p-0 flex flex-col shadow-2xl border-t sm:border-t-0 sm:border-l border-slate-200 rounded-t-3xl sm:rounded-t-none">
          <SheetHeader className="p-6 bg-slate-50 border-b relative shrink-0">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary text-[10px] font-black uppercase tracking-widest">
                    {contact.archagent_source?.replace('_', ' ') || 'LEAD'}
                  </Badge>
                  {contact.mlsNumber && (
                    <Badge className="bg-blue-600 text-[10px] font-black uppercase tracking-widest">LVR: {contact.mlsNumber}</Badge>
                  )}
                </div>
                <SheetTitle className="text-2xl sm:text-3xl font-black font-headline text-primary mt-2">
                  {contact.name}
                </SheetTitle>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-muted-foreground truncate w-40 sm:w-auto">{contact.propertyAddress}</p>
                  {contact.phone && (
                    <a href={`tel:${contact.phone.replace(/\D/g, '')}`} className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                      <PhoneCall className="h-3 w-3" /> {contact.phone}
                    </a>
                  )}
                </div>
              </div>
              <div className="text-center p-2 sm:p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">ICP</p>
                <p className="text-xl sm:text-3xl font-black text-primary leading-none">{contact.icpScore}</p>
              </div>
            </div>
          </SheetHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 border-b bg-white shrink-0">
              <TabsList className="w-full justify-start gap-4 sm:gap-6 h-12 bg-transparent p-0 rounded-none overflow-x-auto no-scrollbar scrollbar-hide">
                <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-bold text-[10px] sm:text-xs uppercase tracking-widest whitespace-nowrap">Overview</TabsTrigger>
                <TabsTrigger value="ai-steps" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-bold text-[10px] sm:text-xs uppercase tracking-widest gap-2 whitespace-nowrap">
                  <Sparkles className="h-3 w-3 text-accent" /> AI Steps
                </TabsTrigger>
                <TabsTrigger value="property" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-bold text-[10px] sm:text-xs uppercase tracking-widest whitespace-nowrap">Property</TabsTrigger>
                <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-bold text-[10px] sm:text-xs uppercase tracking-widest whitespace-nowrap">History</TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1 bg-slate-50/30">
              <div className="p-4 sm:p-6 pb-24 sm:pb-6">
                
                <TabsContent value="overview" className="m-0 space-y-6">
                  <section className="grid grid-cols-1 gap-4">
                    {canGenerateBrief && (
                      <Button 
                        onClick={handleGenerateBrief} 
                        disabled={generatingBrief}
                        className="w-full h-12 bg-accent hover:bg-accent/90 text-primary font-black uppercase tracking-widest shadow-lg gap-2 rounded-xl"
                      >
                        {generatingBrief ? <RefreshCw className="h-5 w-5 animate-spin" /> : <FileBadge className="h-5 w-5" />}
                        Listing Brief
                      </Button>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      {contact.phone && (
                        <a href={`tel:${contact.phone.replace(/\D/g, '')}`} className="w-full">
                          <Button variant="outline" className="w-full h-12 rounded-xl font-bold gap-2"><Phone className="h-4 w-4" /> Call</Button>
                        </a>
                      )}
                      <Button variant="outline" className="h-12 rounded-xl font-bold gap-2"><Mail className="h-4 w-4" /> Email</Button>
                    </div>
                  </section>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

                  <Card className="border-none shadow-sm bg-white overflow-hidden rounded-2xl">
                    <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center">
                      <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Lead Motivation</h4>
                      <Badge variant="secondary" className="capitalize text-[10px]">{contact.ai_urgency || 'Normal'}</Badge>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-slate-600 leading-relaxed italic">"{contact.motivation || 'Standard profile — monitoring for specific signals.'}"</p>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="property" className="m-0 space-y-8">
                  {contact.photos?.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                        <Camera className="h-3 w-3 text-accent" /> Media
                      </h4>
                      <div className="w-full overflow-hidden rounded-2xl">
                        <Carousel className="w-full">
                          <CarouselContent>
                            {contact.photos.map((url: string, i: number) => (
                              <CarouselItem key={i}>
                                <div className="aspect-video bg-slate-200">
                                  <img src={url} className="w-full h-full object-cover" alt="Property" />
                                </div>
                              </CarouselItem>
                            ))}
                          </CarouselContent>
                          <CarouselPrevious className="left-2" />
                          <CarouselNext className="right-2" />
                        </Carousel>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border-none shadow-sm bg-white p-4 space-y-1 rounded-2xl">
                      <p className="text-[8px] font-black uppercase text-slate-400">List Price</p>
                      <p className="text-lg font-black text-primary">${contact.listPrice?.toLocaleString() || 'N/A'}</p>
                    </Card>
                    <Card className="border-none shadow-sm bg-white p-4 space-y-1 rounded-2xl">
                      <p className="text-[8px] font-black uppercase text-slate-400">DOM</p>
                      <p className="text-lg font-black text-slate-700">{contact.daysOnMarket || '0'} Days</p>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">MLS Details</h4>
                      {contact.mlsNumber && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 text-[10px] font-black gap-2 border-blue-200 text-blue-600 bg-blue-50 rounded-lg"
                          onClick={handleRefreshMLS}
                          disabled={isRefreshingMLS}
                        >
                          {isRefreshingMLS ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                          Refresh
                        </Button>
                      )}
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 divide-y overflow-hidden shadow-sm">
                      <div className="p-4 flex justify-between">
                        <span className="text-xs text-slate-500">Agent</span>
                        <span className="text-xs font-bold text-slate-700">{contact.listingAgent || 'Unknown'}</span>
                      </div>
                      <div className="p-4 flex justify-between">
                        <span className="text-xs text-slate-500">Status</span>
                        <Badge variant="outline" className="text-[10px] font-bold uppercase">{contact.listing_status || 'Offline'}</Badge>
                      </div>
                      {contact.remarks && (
                        <div className="p-4 space-y-2">
                          <p className="text-xs leading-relaxed text-slate-600 italic">"{contact.remarks}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Appointment Briefing Modal */}
      <Dialog open={briefingOpen} onOpenChange={setBriefingOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0 border-none shadow-2xl rounded-t-3xl sm:rounded-2xl">
          <div className="print:block" id="appointment-brief">
            <header className="bg-primary text-white p-6 sm:p-8 space-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <FileBadge className="h-24 w-24" />
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-accent text-primary font-black px-2 text-[10px]">CONFIDENTIAL</Badge>
              </div>
              <DialogTitle className="text-2xl sm:text-3xl font-black font-headline">Strategy: {contact.name}</DialogTitle>
              <DialogDescription className="text-primary-foreground/70 flex items-center gap-2 text-xs">
                <MapPin className="h-4 w-4 shrink-0" /> {contact.propertyAddress}
              </DialogDescription>
            </header>

            <div className="p-6 sm:p-8 space-y-8 bg-white">
              {brief ? (
                <div className="grid gap-8">
                  <section className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2 border-b pb-2">
                        <Home className="h-4 w-4" /> Pricing
                      </h3>
                      <p className="text-sm text-slate-700 leading-relaxed font-medium">{brief.property_summary}</p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2 border-b pb-2">
                        <Zap className="h-4 w-4 text-accent" /> Motivation
                      </h3>
                      <p className="text-sm text-slate-700 leading-relaxed">{brief.seller_motivation}</p>
                    </div>
                  </section>

                  <section className="bg-primary/5 p-4 sm:p-6 rounded-2xl border border-primary/10 space-y-4">
                    <h3 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" /> Rebuttals
                    </h3>
                    <div className="grid gap-4">
                      {brief.likely_objections.slice(0, 3).map((obj, i) => (
                        <div key={i} className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                          <p className="text-[10px] font-black text-red-400 uppercase mb-1">Objection</p>
                          <p className="text-xs font-bold text-red-900 mb-2">"{obj}"</p>
                          <p className="text-[10px] font-black text-green-400 uppercase mb-1">Response</p>
                          <p className="text-xs font-medium text-green-900">{brief.objection_responses[i]}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="p-4 bg-slate-900 text-white rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-black text-accent uppercase tracking-widest">
                      <Landmark className="h-3 w-3" /> NV Intelligence
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{brief.nevada_specific_notes}</p>
                  </section>
                </div>
              ) : (
                <div className="py-20 text-center animate-pulse text-slate-400 italic">Synthesizing...</div>
              )}
            </div>

            <footer className="p-6 bg-slate-50 border-t flex flex-col sm:flex-row justify-end gap-3 print:hidden">
              <Button variant="outline" className="h-12 rounded-xl" onClick={() => setBriefingOpen(false)}>Close</Button>
              <Button onClick={handlePrint} className="h-12 rounded-xl gap-2 bg-primary">
                <Printer className="h-4 w-4" /> Print Brief
              </Button>
            </footer>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
