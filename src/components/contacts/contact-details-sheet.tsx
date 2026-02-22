
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
  Scale
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
import { useConversationHistory, useTasks } from "@/hooks/useFirestoreData"
import { generateNurtureEmail, generateConversationCoaching } from "@/app/actions/nurture-ai"
import { sendNurtureEmail } from "@/app/actions/gmail"
import { logVulcan7CallResult } from "@/app/actions/vulcan7"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { collection, doc } from "firebase/firestore"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface ContactDetailsSheetProps {
  contactId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactDetailsSheet({ contactId, open, onOpenChange }: ContactDetailsSheetProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoggingCall, setIsLoggingCall] = useState(false);
  
  // AI Draft States
  const [aiDraft, setAiDraft] = useState<{ subject: string; body: string } | null>(null);
  const [coaching, setCoaching] = useState<any>(null);

  // Firestore Data
  const contactPath = useMemo(() => user && contactId ? `users/${user.uid}/contacts/${contactId}` : null, [user, contactId]);
  const { data: contact, isLoading: contactLoading } = useDoc(contactPath);
  const { data: history, isLoading: historyLoading } = useConversationHistory(contactId || "");
  const { data: tasks } = useTasks('pending');

  const pendingTask = useMemo(() => 
    tasks?.find(t => t.contactId === contactId),
    [tasks, contactId]
  );

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard.` });
  };

  const handleUpdateContact = async (updates: any) => {
    if (!user || !contactId) return;
    const ref = doc(firestore, `users/${user.uid}/contacts/${contactId}`);
    updateDocumentNonBlocking(ref, updates);
    setIsEditing(false);
    toast({ title: "Lead Updated", description: "Contact information has been synchronized." });
  };

  const handleGenerateEmail = async () => {
    if (!user || !contactId) return;
    setIsGenerating(true);
    try {
      const res = await generateNurtureEmail(user.uid, contactId);
      setAiDraft({ subject: res.subject, body: res.body });
      toast({ title: "Draft Ready", description: "Monica has prepared a strategic follow-up." });
    } catch (err) {
      toast({ variant: "destructive", title: "AI Error", description: "Could not generate draft." });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGetCoaching = async () => {
    if (!user || !contactId) return;
    setIsGenerating(true);
    try {
      const res = await generateConversationCoaching(user.uid, contactId);
      setCoaching(res);
    } catch (err) {
      toast({ variant: "destructive", title: "AI Error", description: "Could not generate coaching tips." });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!contactId || contactLoading) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-2xl w-full p-0">
          <div className="p-8 space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (!contact) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl w-full p-0 flex flex-col shadow-2xl">
        <SheetHeader className="p-6 bg-slate-50 border-b relative">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary text-[10px] font-black uppercase tracking-widest">
                  {contact.archagent_source?.replace('_', ' ') || 'CRM LEAD'}
                </Badge>
                {contact.listing_status === 'FOR_SALE' && (
                  <Badge className="bg-green-500 text-[10px] animate-pulse">ACTIVE MLS</Badge>
                )}
              </div>
              <SheetTitle className="text-3xl font-black font-headline text-primary mt-2">
                {contact.name}
              </SheetTitle>
              <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground mt-1">
                <button 
                  onClick={() => handleCopy(contact.phone, "Phone")}
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <Phone className="h-3 w-3" /> {contact.phone || "No Phone"}
                </button>
                <button 
                  onClick={() => handleCopy(contact.email, "Email")}
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <Mail className="h-3 w-3" /> {contact.email || "No Email"}
                </button>
              </div>
            </div>
            <div className="text-center p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">ICP Score</p>
              <p className="text-3xl font-black text-primary leading-none">{contact.icpScore}</p>
              <p className="text-[10px] font-bold text-muted-foreground">/ 99</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-6 overflow-x-auto no-scrollbar pb-1">
            <Button size="sm" className="gap-2 bg-primary h-9 font-bold shadow-md shrink-0">
              <PhoneCall className="h-4 w-4" /> Call Lead
            </Button>
            <Button size="sm" variant="outline" className="gap-2 h-9 font-bold shrink-0 border-slate-200" onClick={() => setActiveTab("ai-steps")}>
              <Mail className="h-4 w-4 text-primary" /> Email
            </Button>
            <Button size="sm" variant="outline" className="gap-2 h-9 font-bold shrink-0 border-slate-200">
              <Plus className="h-4 w-4 text-primary" /> Add Note
            </Button>
            <Button size="sm" variant="secondary" className="gap-2 h-9 font-bold shrink-0" onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? <><Save className="h-4 w-4" /> Save</> : <><User className="h-4 w-4" /> Edit Profile</>}
            </Button>
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b bg-white">
            <TabsList className="w-full justify-start gap-6 h-12 bg-transparent p-0 rounded-none overflow-x-auto no-scrollbar">
              <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-bold text-xs uppercase tracking-widest">Overview</TabsTrigger>
              <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-bold text-xs uppercase tracking-widest">History</TabsTrigger>
              <TabsTrigger value="ai-steps" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-bold text-xs uppercase tracking-widest gap-2">
                <Sparkles className="h-3 w-3 text-accent" /> AI Steps
              </TabsTrigger>
              <TabsTrigger value="property" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-bold text-xs uppercase tracking-widest">Property</TabsTrigger>
              <TabsTrigger value="social" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-bold text-xs uppercase tracking-widest">Social</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 bg-slate-50/30">
            <div className="p-6">
              
              {/* ─── TAB 1: OVERVIEW ─── */}
              <TabsContent value="overview" className="m-0 space-y-6">
                <Card className="border-none shadow-sm overflow-hidden">
                  <div className="bg-primary p-4 flex items-center justify-between">
                    <h3 className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2">
                      <Home className="h-4 w-4" /> Property Intelligence
                    </h3>
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.propertyAddress)}`} target="_blank" rel="noreferrer">
                      <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 h-7 text-[10px] font-bold gap-1">
                        <MapPin className="h-3 w-3" /> View Map <ExternalLink className="h-3 w-3" />
                      </Button>
                    </a>
                  </div>
                  <CardContent className="p-6 grid grid-cols-2 gap-6 bg-white">
                    <div className="col-span-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Address</p>
                      <p className="text-sm font-bold text-primary">{contact.propertyAddress}</p>
                    </div>
                    <div>
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Beds / Baths</p>
                      <p className="text-sm font-bold">{contact.bedrooms || 3} bd / {contact.bathrooms || 2} ba</p>
                    </div>
                    <div>
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Living Area</p>
                      <p className="text-sm font-bold">{contact.sqft?.toLocaleString() || '2,450'} sqft</p>
                    </div>
                    <div>
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Est. Value</p>
                      <p className="text-sm font-bold text-accent">$485,000</p>
                    </div>
                    <div>
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Equity (LTV)</p>
                      <p className="text-sm font-bold text-green-600">High Equity (42%)</p>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-none shadow-sm bg-white p-6 space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                      <Zap className="h-4 w-4 text-accent" /> Motivation & Urgency
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Reported Motivation</p>
                        <p className="text-sm font-semibold italic text-slate-700">"{contact.motivation || "Expanding family, needs more space."}"</p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-100">Hot Urgency</Badge>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">Job Relo</Badge>
                      </div>
                    </div>
                  </Card>

                  <Card className="border-none shadow-sm bg-white p-6 space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" /> Lead Metadata
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground font-bold">Follow-up Stage</span>
                        <span className="font-black text-primary">Stage {contact.followUpStage || 0}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground font-bold">Last Contact</span>
                        <span className="font-bold">{contact.lastContactDate ? format(new Date(contact.lastContactDate), 'MMM d, yyyy') : 'Never'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground font-bold">Assigned Agent</span>
                        <span className="font-bold">Monica Selvaggio</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>

              {/* ─── TAB 2: CONVERSATION HISTORY ─── */}
              <TabsContent value="history" className="m-0 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <History className="h-5 w-5" /> Interaction Timeline
                  </h3>
                  <Button size="sm" variant="outline" className="h-8 text-[10px] font-black uppercase tracking-widest gap-2">
                    <Plus className="h-3 w-3" /> Add Manual Note
                  </Button>
                </div>

                <div className="space-y-4">
                  {historyLoading ? (
                    Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
                  ) : history && history.length > 0 ? (
                    history.map((item) => (
                      <div key={item.id} className="p-4 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${item.type === 'email' ? 'bg-blue-100 text-blue-600' : item.type === 'call' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'}`}>
                              {item.type === 'email' ? <Mail className="h-4 w-4" /> : item.type === 'call' ? <Phone className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-black text-primary uppercase">{item.type} {item.outcome ? `— ${item.outcome}` : ''}</p>
                              <p className="text-[10px] text-muted-foreground font-bold">{format(new Date(item.date), 'MMM d, h:mm a')}</p>
                            </div>
                          </div>
                          <Badge className={`${item.sentiment === 'positive' ? 'bg-green-500' : item.sentiment === 'negative' ? 'bg-red-500' : 'bg-slate-400'} text-[8px] h-4 font-black uppercase`}>
                            {item.sentiment || 'neutral'}
                          </Badge>
                        </div>
                        {item.subject && <p className="text-xs font-black text-slate-800 mb-1">{item.subject}</p>}
                        <p className="text-xs text-slate-600 leading-relaxed italic border-l-2 border-slate-100 pl-3">
                          {item.content || item.summary || "No notes provided for this interaction."}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center border-2 border-dashed rounded-3xl bg-slate-50/50">
                      <RefreshCw className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                      <p className="text-xs text-muted-foreground font-bold italic">No history found for this lead.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ─── TAB 3: AI NEXT STEPS ─── */}
              <TabsContent value="ai-steps" className="m-0 space-y-8">
                <div className="p-4 bg-primary text-white rounded-2xl flex items-center justify-between shadow-lg">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-primary-foreground/70 tracking-widest leading-none">Current Sales Cadence</p>
                    <p className="text-sm font-bold">Stage {contact.followUpStage || 1} of Expired Listing Sequence</p>
                  </div>
                  <Zap className="h-6 w-6 text-accent animate-pulse" />
                </div>

                {pendingTask && (
                  <Card className="border-none shadow-md bg-accent/5 border border-accent/10 p-6 space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-accent" />
                      <h4 className="text-sm font-black text-primary uppercase">Recommended Strategic Action</h4>
                    </div>
                    <p className="text-sm font-bold text-slate-800">{pendingTask.title}</p>
                    <p className="text-xs text-slate-600 leading-relaxed italic">"Monica, {pendingTask.description}"</p>
                  </Card>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <Button onClick={handleGenerateEmail} disabled={isGenerating} className="gap-2 bg-primary h-12 font-bold shadow-lg shadow-primary/10">
                    {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    Generate Email
                  </Button>
                  <Button onClick={handleGetCoaching} disabled={isGenerating} variant="outline" className="gap-2 h-12 font-bold border-primary/20 text-primary hover:bg-primary/5">
                    <BrainCircuit className="h-4 w-4" /> Get Coaching
                  </Button>
                </div>

                {aiDraft && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="p-6 bg-white rounded-3xl shadow-xl border border-slate-100 space-y-4">
                      <div className="flex items-center justify-between border-b pb-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Mail className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="text-xs font-black text-primary uppercase tracking-widest">Strategic Outreach Draft</span>
                        </div>
                        <Badge variant="outline" className="text-[9px] border-green-200 bg-green-50 text-green-700">COMPLIANCE PASS</Badge>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Subject</p>
                        <p className="text-sm font-bold">{aiDraft.subject}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Message Body</p>
                        <div className="p-4 bg-slate-50 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap italic">
                          {aiDraft.body}
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 pt-2">
                        <Button variant="ghost" size="sm" onClick={() => setAiDraft(null)} className="text-xs font-bold">Discard</Button>
                        <Button size="sm" className="gap-2 bg-accent hover:bg-accent/90 text-primary font-black px-6 shadow-lg shadow-accent/20">
                          <Send className="h-4 w-4" /> Send via Gmail
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {coaching && (
                  <Accordion type="single" collapsible className="space-y-3">
                    <AccordionItem value="talking-points" className="border rounded-2xl bg-white px-4">
                      <AccordionTrigger className="text-xs font-black uppercase text-primary hover:no-underline">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" /> Talking Points
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-2">
                        {coaching.talking_points.map((p: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                            {p}
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="objections" className="border rounded-2xl bg-white px-4">
                      <AccordionTrigger className="text-xs font-black uppercase text-red-600 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" /> Likely Objections
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-2">
                        {coaching.objections.map((p: string, i: number) => (
                          <div key={i} className="p-3 bg-red-50/50 rounded-xl border border-red-100 text-xs font-bold text-red-900 italic">
                            "{p}"
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}

                <Card className="border-none shadow-md bg-slate-100/50 p-6 space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <PhoneCall className="h-4 w-4" /> Vulcan7 Call Logger
                  </h3>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500">Call Outcome</Label>
                      <Select defaultValue="Voicemail">
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Select Outcome" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Connected">Connected</SelectItem>
                          <SelectItem value="Voicemail">Voicemail</SelectItem>
                          <SelectItem value="No Answer">No Answer</SelectItem>
                          <SelectItem value="Callback Requested">Callback Requested</SelectItem>
                          <SelectItem value="Appointment Set">Appointment Set</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500">Call Notes</Label>
                      <Textarea placeholder="Key details from the conversation..." className="bg-white min-h-[100px]" />
                    </div>
                    <Button className="w-full bg-primary font-black py-6 text-sm uppercase tracking-widest shadow-xl">
                      Log Call & Advance Cadence
                    </Button>
                  </div>
                </Card>
              </TabsContent>

              {/* ─── TAB 4: PROPERTY INTELLIGENCE ─── */}
              <TabsContent value="property" className="m-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-none shadow-sm bg-white p-6 space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                      <Scale className="h-4 w-4 text-primary" /> Public Records
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground font-bold">Owner of Record</span>
                        <span className="font-bold">{contact.name}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground font-bold">Last Sale Date</span>
                        <span className="font-bold">Oct 14, 2012</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground font-bold">Last Sale Price</span>
                        <span className="font-bold">$214,000</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground font-bold">Tax Assessed</span>
                        <span className="font-bold">$384,200</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="border-none shadow-sm bg-white p-6 space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-accent" /> Neighborhood Stats
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground font-bold">Median Price (Zip)</span>
                        <span className="font-bold">$542,000</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground font-bold">Avg. DOM</span>
                        <span className="font-bold">34 days</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground font-bold">Price Trend</span>
                        <span className="font-bold text-green-600">+4.2% YoY</span>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">External Data Links</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="justify-between h-11 px-4 border-slate-200 font-bold text-xs bg-white">
                      Trulia Intel <ExternalLink className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" className="justify-between h-11 px-4 border-slate-200 font-bold text-xs bg-white">
                      Zillow History <ExternalLink className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" className="justify-between h-11 px-4 border-slate-200 font-bold text-xs bg-white">
                      Realtor.com <ExternalLink className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" className="justify-between h-11 px-4 border-slate-200 font-bold text-xs bg-white">
                      County Assessor <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* ─── TAB 5: SOCIAL INTELLIGENCE ─── */}
              <TabsContent value="social" className="m-0 space-y-6">
                <Card className="border-none shadow-md bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Globe className="h-20 w-20" />
                  </div>
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-accent" />
                      <h3 className="text-xs font-black uppercase tracking-widest text-accent">Monica AI Social Summary</h3>
                    </div>
                    <p className="text-sm leading-relaxed italic text-blue-50">
                      "Lead shows high activity in local neighborhood Facebook groups. Sentiment analysis suggests frustration with current DIY sale attempt. Monica recommends mentioning the recent Pinehurst Dr sale to build authority."
                    </p>
                    <Button size="sm" variant="outline" className="text-white border-white/20 hover:bg-white/10 text-[10px] font-bold gap-2">
                      <RefreshCw className="h-3 w-3" /> Re-analyze Presence
                    </Button>
                  </div>
                </Card>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Platform Connections</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { icon: Facebook, color: 'text-blue-600', label: 'Facebook' },
                      { icon: Linkedin, color: 'text-blue-700', label: 'LinkedIn' },
                      { icon: Instagram, color: 'text-pink-600', label: 'Instagram' },
                      { icon: Youtube, color: 'text-red-600', label: 'YouTube' },
                      { icon: Globe, color: 'text-green-600', label: 'Nextdoor' },
                      { icon: Search, color: 'text-slate-600', label: 'Google' }
                    ].map((platform) => (
                      <div key={platform.label} className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border shadow-sm space-y-2 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-pointer">
                        <platform.icon className={`h-6 w-6 ${platform.color}`} />
                        <span className="text-[8px] font-black uppercase text-slate-500">{platform.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

            </div>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
