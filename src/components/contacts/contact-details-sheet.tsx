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
import { ComplianceGuard } from "@/components/compliance/ComplianceGuard"

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
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  // AI Draft States
  const [aiDraft, setAiDraft] = useState<{ subject: string; body: string } | null>(null);
  const [coaching, setCoaching] = useState<any>(null);
  const [manualNote, setManualNote] = useState("");

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

  const handleSendEmail = async (finalContent: string) => {
    if (!user || !contactId || !contact?.email || !aiDraft) return;
    setIsSendingEmail(true);
    try {
      await sendNurtureEmail({
        userId: user.uid,
        contactId,
        to: contact.email,
        subject: aiDraft.subject,
        body: finalContent,
        isAiGenerated: true
      });
      toast({ title: "Email Sent", description: "Message delivered successfully." });
      setAiDraft(null);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Send Failed", description: err.message });
    } finally {
      setIsSendingEmail(false);
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
              
              <TabsContent value="ai-steps" className="m-0 space-y-8">
                <div className="p-4 bg-primary text-white rounded-2xl flex items-center justify-between shadow-lg">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-primary-foreground/70 tracking-widest leading-none">Current Sales Cadence</p>
                    <p className="text-sm font-bold">Stage {contact.followUpStage || 1} of Active Sequence</p>
                  </div>
                  <Zap className="h-6 w-6 text-accent animate-pulse" />
                </div>

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
                        <Badge variant="outline" className="text-[9px] border-green-200 bg-green-50 text-green-700">READY FOR SEND</Badge>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Subject</Label>
                        <p className="text-sm font-bold">{aiDraft.subject}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Message Body</Label>
                        <div className="p-4 bg-slate-50 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap italic">
                          {aiDraft.body}
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 pt-2">
                        <Button variant="ghost" size="sm" onClick={() => setAiDraft(null)} className="text-xs font-bold">Discard</Button>
                        
                        <ComplianceGuard 
                          content={aiDraft.body} 
                          type="email" 
                          contactName={contact.name} 
                          onApproved={handleSendEmail}
                        >
                          <Button size="sm" disabled={isSendingEmail} className="gap-2 bg-accent hover:bg-accent/90 text-primary font-black px-6 shadow-lg shadow-accent/20">
                            <Send className="h-4 w-4" /> Send Securely
                          </Button>
                        </ComplianceGuard>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rest of AI steps content... */}
              </TabsContent>

              {/* Other tabs... */}
            </div>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
