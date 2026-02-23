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
  Scale,
  Camera,
  Printer,
  FileBadge,
  Wand2,
  FileBarChart
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  useUser, 
  useFirestore, 
  useDoc, 
  updateDocumentNonBlocking 
} from "@/firebase"
import { useConversationHistory, useAppointments } from "@/hooks/useFirestoreData"
import { sendNurtureEmail, getGmailConnectionStatus } from "@/app/actions/gmail"
import { refreshListingDetailAction } from "@/app/actions/lvr-mls"
import { generateAppointmentBrief, type AppointmentBrief } from "@/app/actions/appointment-brief"
import { emailTemplates } from "@/services/email-templates"
import { useToast } from "@/hooks/use-toast"
import { doc } from "firebase/firestore"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { connectGmailAccount } from "@/firebase/auth/gmail-auth"
import Link from "next/link"
import { ObjectionCoachContent } from "@/components/objection-coach/objection-coach-content"

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
  const [isRefreshingMLS, setIsRefreshingMLS] = useState(false);
  
  // Compose Email State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Briefing state
  const [brief, setBrief] = useState<AppointmentBrief | null>(null);
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [generatingBrief, setBriefingLoading] = useState(false);
  
  const contactId = initialContact?.id;
  const contactPath = useMemo(() => user && contactId ? `users/${user.uid}/contacts/${contactId}` : null, [user, contactId]);
  const { data: contact, isLoading: contactLoading } = useDoc(contactPath);
  const { data: history } = useConversationHistory(contactId || "");

  const handleOpenCompose = async () => {
    if (!user || !contact) return;

    const isConnected = await getGmailConnectionStatus(user.uid);
    if (!isConnected) {
      toast({
        title: "Gmail Not Connected",
        description: "Connect your Google account to send emails from Monica.",
        action: (
          <Button size="sm" onClick={() => connectGmailAccount(user.uid)}>Connect Now</Button>
        )
      });
      return;
    }

    let template = "";
    let subject = "Quick question regarding your property";
    
    const status = contact.archagent_source || 'expired';
    if (status.includes('expired')) {
      template = emailTemplates.expired(contact, { active_listings: 12, avg_dom: 45 });
      subject = `Strategic Update: ${contact.propertyAddress}`;
    } else if (status.includes('fsbo')) {
      template = emailTemplates.fsbo(contact);
      subject = `Question about your listing at ${contact.propertyAddress}`;
    } else if (status.includes('preforeclosure')) {
      template = emailTemplates.preforeclosure(contact);
      subject = `Private: Confidential Options for ${contact.propertyAddress}`;
    } else {
      template = `<p>Hi ${contact.name.split(' ')[0]},</p><p>I'm reaching out to share a quick update on recent activity near ${contact.propertyAddress}.</p>`;
    }

    setEmailSubject(subject);
    setEmailBody(template);
    setIsComposeOpen(true);
  };

  const handleSendEmail = async () => {
    if (!user || !contactId || !contact?.email) return;
    
    setIsSendingEmail(true);
    try {
      await sendNurtureEmail({
        userId: user.uid,
        contactId,
        to: contact.email,
        subject: emailSubject,
        body: emailBody
      });
      toast({ title: "Email Sent", description: `Delivered to ${contact.name}.` });
      setIsComposeOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Send Failed", description: err.message });
    } finally {
      setIsSendingEmail(false);
    }
  };

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
    } catch (err: any) {
      toast({ variant: "destructive", title: "Briefing Failed", description: err.message });
    } finally {
      setBriefingLoading(false);
    }
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
                  <Sparkles className="h-3 w-3 text-accent" /> AI Strategy
                </TabsTrigger>
                <TabsTrigger value="objection" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-bold text-[10px] sm:text-xs uppercase tracking-widest gap-2 whitespace-nowrap">
                  <BrainCircuit className="h-3 w-3 text-accent" /> Objections
                </TabsTrigger>
                <TabsTrigger value="property" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-bold text-[10px] sm:text-xs uppercase tracking-widest whitespace-nowrap">Property</TabsTrigger>
                <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-bold text-[10px] sm:text-xs uppercase tracking-widest whitespace-nowrap">History</TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1 bg-slate-50/30">
              <div className="p-4 sm:p-6 pb-24 sm:pb-6">
                
                <TabsContent value="overview" className="m-0 space-y-6">
                  <section className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Button 
                        onClick={handleGenerateBrief} 
                        disabled={generatingBrief}
                        variant="secondary"
                        className="h-14 font-black uppercase text-[10px] tracking-widest gap-2 rounded-xl border border-slate-200"
                      >
                        {generatingBrief ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileBadge className="h-4 w-4 text-primary" />}
                        Listing Brief
                      </Button>
                      
                      <Link href={`/cma/${contactId}`} className="contents">
                        <Button 
                          className="h-14 bg-accent hover:bg-accent/90 text-primary font-black uppercase text-[10px] tracking-widest shadow-lg gap-2 rounded-xl"
                        >
                          <FileBarChart className="h-4 w-4" />
                          Generate CMA
                        </Button>
                      </Link>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {contact.phone && (
                        <a href={`tel:${contact.phone.replace(/\D/g, '')}`} className="w-full">
                          <Button variant="outline" className="w-full h-12 rounded-xl font-bold gap-2"><Phone className="h-4 w-4" /> Call Lead</Button>
                        </a>
                      )}
                      <Button 
                        variant="outline" 
                        className="h-12 rounded-xl font-bold gap-2"
                        onClick={handleOpenCompose}
                      >
                        <Mail className="h-4 w-4" /> Send Email
                      </Button>
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

                <TabsContent value="objection" className="m-0 space-y-6">
                  <ObjectionCoachContent />
                </TabsContent>

                <TabsContent value="property" className="m-0 space-y-8">
                  {contact.photos?.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                        <Camera className="h-3 w-3 text-accent" /> Property Media
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
                      <p className="text-[8px] font-black uppercase text-slate-400">Days on Market</p>
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
                          Refresh from LVR
                        </Button>
                      )}
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 divide-y overflow-hidden shadow-sm">
                      <div className="p-4 flex justify-between">
                        <span className="text-xs text-slate-500">Listing Agent</span>
                        <span className="text-xs font-bold text-slate-700">{contact.listingAgent || 'Unknown'}</span>
                      </div>
                      <div className="p-4 flex justify-between">
                        <span className="text-xs text-slate-500">Current Status</span>
                        <Badge variant="outline" className="text-[10px] font-bold uppercase">{contact.listing_status || 'Offline'}</Badge>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Gmail Compose Dialog */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
          <DialogHeader className="bg-primary text-white p-6 pb-8">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-5 w-5 text-accent" />
              <DialogTitle className="text-xl font-black">Compose Nurture Email</DialogTitle>
            </div>
            <DialogDescription className="text-primary-foreground/70">
              Sending to: <span className="text-white font-bold">{contact?.email}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 space-y-4 bg-white">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400">Subject Line</Label>
              <Input 
                value={emailSubject} 
                onChange={(e) => setEmailSubject(e.target.value)}
                className="font-bold border-slate-200 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-[10px] font-black uppercase text-slate-400">Email Body (HTML Supported)</Label>
                <Badge variant="outline" className="text-[8px] font-black text-primary border-primary/20 bg-primary/5">
                  <Sparkles className="h-2 w-2 mr-1" /> Branded Template
                </Badge>
              </div>
              <Textarea 
                value={emailBody} 
                onChange={(e) => setEmailBody(e.target.value)}
                className="min-h-[300px] font-mono text-xs leading-relaxed border-slate-200 focus:ring-primary"
              />
            </div>
          </div>

          <DialogFooter className="bg-slate-50 p-4 border-t gap-3">
            <Button variant="ghost" onClick={() => setIsComposeOpen(false)} className="font-bold">Cancel</Button>
            <Button 
              onClick={handleSendEmail} 
              disabled={isSendingEmail}
              className="bg-primary text-white font-black px-8 h-11 gap-2 shadow-lg"
            >
              {isSendingEmail ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send via Gmail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Briefing Modal */}
      <Dialog open={briefingOpen} onOpenChange={setBriefingOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0 border-none shadow-2xl rounded-2xl">
          <header className="bg-primary text-white p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10"><FileBadge className="h-24 w-24" /></div>
            <DialogTitle className="text-3xl font-black font-headline">Strategy Brief: {contact?.name}</DialogTitle>
            <DialogDescription className="text-primary-foreground/70 flex items-center gap-2 mt-2">
              <MapPin className="h-4 w-4" /> {contact?.propertyAddress}
            </DialogDescription>
          </header>
          <div className="p-8 bg-white space-y-8">
            {brief ? (
              <div className="grid gap-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-primary uppercase tracking-widest border-b pb-2">Market Analysis</h3>
                    <p className="text-sm text-slate-700 leading-relaxed">{brief.property_summary}</p>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-primary uppercase tracking-widest border-b pb-2">Seller Context</h3>
                    <p className="text-sm text-slate-700 leading-relaxed">{brief.seller_motivation}</p>
                  </div>
                </div>
                <div className="p-6 bg-slate-900 text-white rounded-2xl">
                  <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-2">NV Compliance Note</p>
                  <p className="text-xs text-slate-300 italic">"{brief.nevada_specific_notes}"</p>
                </div>
              </div>
            ) : <div className="py-20 text-center italic text-slate-400">Loading brief...</div>}
          </div>
          <footer className="p-6 bg-slate-50 border-t flex justify-end">
            <Button onClick={() => setBriefingOpen(false)} className="bg-primary">Close Briefing</Button>
          </footer>
        </DialogContent>
      </Dialog>
    </>
  );
}
