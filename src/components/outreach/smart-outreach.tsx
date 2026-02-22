"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Sparkles, 
  Mail, 
  MessageSquare, 
  PhoneCall, 
  Wand2,
  RefreshCw,
  Send,
  FileText,
  Clock,
  History,
  Download
} from "lucide-react"
import { 
  generatePersonalizedEmail, 
  GeneratePersonalizedEmailOutput 
} from "@/ai/flows/generate-personalized-email"
import { 
  generatePersonalizedSMS, 
  GeneratePersonalizedSMSOutput 
} from "@/ai/flows/generate-personalized-sms-flow"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, where, limit } from "firebase/firestore"
import { logVulcan7CallResult, pushToVulcan7DialQueue } from "@/app/actions/vulcan7"
import { useCallLogs, useContacts } from "@/hooks/useFirestoreData"
import { format } from "date-fns"

export function SmartOutreach() {
  const { user } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()
  const [selectedContact, setSelectedContact] = React.useState<any | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [sending, setSending] = React.useState(false)
  const [loggingCall, setLoggingCall] = React.useState(false)
  const [generatedContent, setGeneratedContent] = React.useState<{
    email?: GeneratePersonalizedEmailOutput;
    sms?: GeneratePersonalizedSMSOutput;
  }>({})

  // Form State for Vulcan7 Log
  const [callOutcome, setCallOutcome] = React.useState("Voicemail")
  const [callNotes, setCallNotes] = React.useState("")
  const [callDuration, setCallDuration] = React.useState("1")
  const [nextAction, setNextAction] = React.useState("")

  const { data: activeList, isLoading: listLoading } = useContacts({ minScore: 80 });
  const { data: callHistory } = useCallLogs(selectedContact?.id);

  const handleGenerateContent = async (contact: any, type: 'email' | 'sms') => {
    setLoading(true)
    try {
      if (type === 'email') {
        const res = await generatePersonalizedEmail({
          contactName: contact.name,
          contactEmail: contact.email || 'seller@example.com',
          propertyName: contact.propertyAddress,
          sellerMotivation: contact.motivation || 'Standard sale',
          companyName: "Selvaggio Global Real Estate",
          agentName: "Monica AI"
        })
        setGeneratedContent(prev => ({ ...prev, email: res }))
      } else if (type === 'sms') {
        const res = await generatePersonalizedSMS({
          contactName: contact.name,
          propertyAddress: contact.propertyAddress,
          estimateInfo: "We provide a free 24-hour cash offer valuation.",
          sellerMotivation: contact.motivation
        })
        setGeneratedContent(prev => ({ ...prev, sms: res }))
      }
      toast({ title: "Grok Intelligence Ready", description: "Personalized outreach has been drafted." });
    } catch (error) {
      toast({ variant: "destructive", title: "Generation Failed", description: "Monica could not connect to Grok." })
    } finally {
      setLoading(false)
    }
  }

  const handleSendEmail = async () => {
    if (!selectedContact || !generatedContent.email || !user) return;
    setSending(true);
    try {
      const res = await fetch('/api/gmail/send', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.uid,
          to: selectedContact.email,
          subject: generatedContent.email.subject,
          body: generatedContent.email.body,
          leadId: selectedContact.id
        })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Message Delivered", description: `Outreach sent to ${selectedContact.name}.` });
        setGeneratedContent(prev => ({ ...prev, email: undefined }));
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Send Failed", description: err.message });
    } finally {
      setSending(false);
    }
  };

  const handleExportToVulcan = async () => {
    if (!user || !selectedContact) return;
    try {
      const csv = await pushToVulcan7DialQueue(user.uid, [selectedContact.id]);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vulcan7_export_${selectedContact.name.replace(/\s/g, '_')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast({ title: "Export Ready", description: "Upload this file to your Vulcan7 session." });
    } catch (err) {
      toast({ variant: "destructive", title: "Export Failed", description: "Could not generate CSV." });
    }
  };

  const handleLogCall = async () => {
    if (!user || !selectedContact) return;
    setLoggingCall(true);
    try {
      await logVulcan7CallResult(user.uid, selectedContact.id, {
        outcome: callOutcome,
        notes: callNotes,
        duration: parseInt(callDuration),
        nextAction: nextAction
      });
      toast({ title: "Call Logged", description: "Activity history updated and follow-up task created." });
      setCallNotes("");
      setNextAction("");
    } catch (err) {
      toast({ variant: "destructive", title: "Logging Failed", description: "Could not save call result." });
    } finally {
      setLoggingCall(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* List Panel */}
      <Card className="lg:col-span-1 shadow-lg border-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Smart Queue</CardTitle>
            <CardDescription>ICP Score &gt; 80, Priority Leads</CardDescription>
          </div>
          <Badge variant="secondary" className="bg-primary/5 text-primary">
            {(activeList || []).length} Leads
          </Badge>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-3">
              {listLoading ? (
                Array.from({length: 4}).map((_, i) => (
                  <div key={i} className="p-4 rounded-lg border bg-white space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))
              ) : activeList && activeList.length > 0 ? (
                activeList.map((contact) => (
                  <div 
                    key={contact.id}
                    onClick={() => {
                      setSelectedContact(contact)
                      setGeneratedContent({})
                    }}
                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:border-accent ${selectedContact?.id === contact.id ? 'bg-secondary border-primary ring-1 ring-primary' : 'bg-white'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-sm text-primary">{contact.name}</span>
                      <Badge className="bg-accent text-white h-5 text-[10px]">Score: {contact.icpScore}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{contact.propertyAddress}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Sparkles className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">No high-priority leads in queue.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Action Panel */}
      <Card className="lg:col-span-2 shadow-lg border-none bg-white overflow-hidden">
        {selectedContact ? (
          <>
            <CardHeader className="bg-slate-50/50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-primary">{selectedContact.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {selectedContact.email || 'No email'}</span>
                    <span className="flex items-center gap-1"><PhoneCall className="h-3 w-3" /> {selectedContact.phone || 'No phone'}</span>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                  <span className="text-[10px] font-bold uppercase text-accent tracking-tighter">Vulcan7 Ready</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs defaultValue="vulcan7">
                <TabsList className="grid w-full grid-cols-3 mb-8">
                  <TabsTrigger value="vulcan7" className="gap-2"><PhoneCall className="h-4 w-4" /> Dialer (Vulcan7)</TabsTrigger>
                  <TabsTrigger value="email" className="gap-2"><Mail className="h-4 w-4" /> Email</TabsTrigger>
                  <TabsTrigger value="sms" className="gap-2"><MessageSquare className="h-4 w-4" /> SMS</TabsTrigger>
                </TabsList>
                
                <TabsContent value="vulcan7" className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 rounded-xl border border-dashed text-center space-y-3">
                        <p className="text-xs text-muted-foreground italic">Prepare for your dialer session.</p>
                        <Button onClick={handleExportToVulcan} variant="outline" className="w-full gap-2 font-bold h-11 border-primary/20 hover:bg-primary/5">
                          <Download className="h-4 w-4" /> Export to Vulcan7 CSV
                        </Button>
                      </div>

                      <div className="space-y-4 pt-4 border-t">
                        <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                          <History className="h-3 w-3" /> Call History
                        </h4>
                        <div className="space-y-2">
                          {callHistory?.slice(0, 3).map((log) => (
                            <div key={log.id} className="p-3 bg-slate-50 rounded-lg border flex justify-between items-center text-xs">
                              <div>
                                <span className="font-bold text-primary">{log.outcome}</span>
                                <p className="text-[10px] text-muted-foreground truncate w-40">{log.summary}</p>
                              </div>
                              <span className="text-[10px] text-slate-400">{format(new Date(log.date), 'MMM d')}</span>
                            </div>
                          ))}
                          {(!callHistory || callHistory.length === 0) && <p className="text-xs text-muted-foreground italic">No previous calls logged.</p>}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 bg-slate-50/50 p-4 rounded-2xl border">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black text-slate-500">Call Outcome</Label>
                        <Select value={callOutcome} onValueChange={setCallOutcome}>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select Outcome" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Connected">Connected</SelectItem>
                            <SelectItem value="Voicemail">Voicemail</SelectItem>
                            <SelectItem value="No Answer">No Answer</SelectItem>
                            <SelectItem value="Callback Requested">Callback Requested</SelectItem>
                            <SelectItem value="Appointment Set">Appointment Set</SelectItem>
                            <SelectItem value="Not Interested">Not Interested</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black text-slate-500">Duration (mins)</Label>
                        <Input type="number" value={callDuration} onChange={(e) => setCallDuration(e.target.value)} className="bg-white" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black text-slate-500">Notes</Label>
                        <Textarea value={callNotes} onChange={(e) => setCallNotes(e.target.value)} placeholder="What was discussed?" className="bg-white min-h-[80px]" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black text-slate-500">Next Strategic Step</Label>
                        <Input value={nextAction} onChange={(e) => setNextAction(e.target.value)} placeholder="e.g. Follow up in 3 days with CMA" className="bg-white" />
                      </div>
                      <Button onClick={handleLogCall} disabled={loggingCall} className="w-full bg-primary font-bold h-11">
                        {loggingCall ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Log Call Result"}
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="email" className="space-y-4">
                  {!generatedContent.email ? (
                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl bg-slate-50">
                      <Wand2 className="h-10 w-10 text-slate-300 mb-4" />
                      <p className="text-muted-foreground mb-6">Generate a personalized outreach email with Grok-4.</p>
                      <Button onClick={() => handleGenerateContent(selectedContact, 'email')} disabled={loading} className="gap-2">
                        {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
                        Generate with Grok
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                      <div className="p-4 rounded-lg bg-slate-50 border space-y-2">
                        <p className="text-sm font-semibold">Subject: {generatedContent.email.subject}</p>
                        <div className="h-px bg-slate-200 my-2" />
                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{generatedContent.email.body}</p>
                      </div>
                      <div className="flex justify-end gap-3">
                        <Button variant="outline" size="sm" onClick={() => setGeneratedContent(prev => ({...prev, email: undefined}))}>Regenerate</Button>
                        <Button size="sm" className="gap-2 bg-accent" onClick={handleSendEmail} disabled={sending}>
                          {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          Send Now
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="sms" className="space-y-4">
                  {!generatedContent.sms ? (
                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl bg-slate-50">
                      <MessageSquare className="h-10 w-10 text-slate-300 mb-4" />
                      <p className="text-muted-foreground mb-6">Draft a short, human SMS with Grok-4 intelligence.</p>
                      <Button onClick={() => handleGenerateContent(selectedContact, 'sms')} disabled={loading} className="gap-2">
                        {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
                        Draft with Grok
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                      <div className="max-w-[80%] p-4 rounded-2xl bg-primary text-primary-foreground shadow-md rounded-bl-none ml-2">
                        <p className="text-sm leading-relaxed">{generatedContent.sms.smsMessage}</p>
                      </div>
                      <div className="flex justify-end gap-3">
                        <Button variant="outline" size="sm" onClick={() => setGeneratedContent(prev => ({...prev, sms: undefined}))}>Regenerate</Button>
                        <Button size="sm" className="gap-2 bg-accent"><Send className="h-4 w-4" /> Send SMS</Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-[600px] text-center p-8">
            <div className="bg-slate-50 rounded-full p-6 mb-6">
              <Sparkles className="h-12 w-12 text-slate-200" />
            </div>
            <h3 className="text-xl font-headline font-bold text-slate-400 mb-2">No Lead Selected</h3>
            <p className="text-muted-foreground max-w-xs">Select a lead from your smart queue to generate Grok outreach or log a Vulcan7 call.</p>
          </div>
        )}
      </Card>
    </div>
  )
}
