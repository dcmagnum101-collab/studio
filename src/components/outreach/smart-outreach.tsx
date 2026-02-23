"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { 
  Sparkles, 
  Mail, 
  MessageSquare, 
  PhoneCall, 
  Wand2,
  RefreshCw,
  Send,
  Lock,
  AlertTriangle
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
import { useContacts } from "@/hooks/useFirestoreData"
import { FEATURES } from "@/lib/feature-flags"
import { ComplianceGuard } from "@/components/compliance/ComplianceGuard"

export function SmartOutreach() {
  const { user } = useUser()
  const { toast } = useToast()
  const [selectedContact, setSelectedContact] = React.useState<any | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [sending, setSending] = React.useState(false)
  const [generatedContent, setGeneratedContent] = React.useState<{
    email?: GeneratePersonalizedEmailOutput;
    sms?: GeneratePersonalizedSMSOutput;
  }>({})

  const { data: activeList, isLoading: listLoading } = useContacts({ minScore: 80 });

  const handleGenerateContent = async (contact: any, type: 'email' | 'sms') => {
    if (!FEATURES.ai) {
      toast({ variant: "destructive", title: "AI Disabled", description: "Add your Grok API key in Settings." });
      return;
    }
    
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
      toast({ title: "Intelligence Ready", description: "Outreach has been drafted." });
    } catch (error) {
      toast({ variant: "destructive", title: "Generation Failed", description: "Monica could not connect to Grok." })
    } finally {
      setLoading(false)
    }
  }

  const handleSendEmail = async (finalBody: string) => {
    if (!selectedContact || !generatedContent.email || !user) return;
    setSending(true);
    try {
      const res = await fetch('/api/gmail/send', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.uid,
          to: selectedContact.email,
          subject: generatedContent.email.subject,
          body: finalBody,
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
                    <Mail className="h-3 w-3" /> {selectedContact.email || 'No email'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {!FEATURES.ai && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <p className="text-sm text-amber-800 font-medium">AI Generation is currently disabled. Add your Grok API key in Settings to draft outreach.</p>
                </div>
              )}

              <Tabs defaultValue="email">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="email" className="gap-2"><Mail className="h-4 w-4" /> Email</TabsTrigger>
                  <TabsTrigger value="sms" className="gap-2" disabled={!FEATURES.sms}>
                    {!FEATURES.sms && <Lock className="h-3 w-3" />}
                    <MessageSquare className="h-4 w-4" /> SMS
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="email" className="space-y-4">
                  {!generatedContent.email ? (
                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl bg-slate-50">
                      <Wand2 className="h-10 w-10 text-slate-300 mb-4" />
                      <p className="text-muted-foreground mb-6">Generate a personalized outreach email with Grok-4.</p>
                      <Button onClick={() => handleGenerateContent(selectedContact, 'email')} disabled={loading || !FEATURES.ai} className="gap-2">
                        {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
                        {!FEATURES.ai && <Lock className="h-4 w-4" />}
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
                        <ComplianceGuard 
                          content={generatedContent.email.body} 
                          type="email" 
                          contactName={selectedContact.name} 
                          onApproved={handleSendEmail}
                        >
                          <Button size="sm" className="gap-2 bg-accent" disabled={sending}>
                            {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            Check Compliance & Send
                          </Button>
                        </ComplianceGuard>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="sms" className="space-y-4">
                  {FEATURES.sms ? (
                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl bg-slate-50">
                      <MessageSquare className="h-10 w-10 text-slate-300 mb-4" />
                      <p className="text-muted-foreground mb-6">Draft a short, human SMS with Grok-4 intelligence.</p>
                      <Button onClick={() => handleGenerateContent(selectedContact, 'sms')} disabled={loading || !FEATURES.ai} className="gap-2">
                        {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
                        Draft with Grok
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl bg-slate-50 text-center px-6">
                      <Lock className="h-10 w-10 text-slate-300 mb-4" />
                      <h4 className="font-bold text-slate-900 mb-2">SMS Integration Required</h4>
                      <p className="text-sm text-slate-500">Connect Twilio in Settings to enable automated text message outreach.</p>
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
            <p className="text-muted-foreground max-w-xs">Select a lead to generate Grok outreach with compliance guardrails.</p>
          </div>
        )}
      </Card>
    </div>
  )
}
