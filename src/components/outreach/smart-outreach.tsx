
"use client"

import * as React from "react"
import { MOCK_CONTACTS, Contact } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Sparkles, 
  Mail, 
  MessageSquare, 
  PhoneCall, 
  CheckCircle2, 
  XCircle,
  Wand2,
  RefreshCw,
  Send,
  Loader2,
  FileText
} from "lucide-react"
import { 
  generatePersonalizedEmail, 
  GeneratePersonalizedEmailOutput 
} from "@/ai/flows/generate-personalized-email"
import { 
  generatePersonalizedSMS, 
  GeneratePersonalizedSMSOutput 
} from "@/ai/flows/generate-personalized-sms-flow"
import {
  automateAIVoiceCall,
  AutomateAIVoiceCallOutput
} from "@/ai/flows/automate-ai-voice-call"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

export function SmartOutreach() {
  const { toast } = useToast()
  const [activeList, setActiveList] = React.useState<Contact[]>([])
  const [selectedContact, setSelectedContact] = React.useState<Contact | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [callActive, setCallActive] = React.useState(false)
  const [loggingProgress, setLoggingProgress] = React.useState(false)
  const [generatedContent, setGeneratedContent] = React.useState<{
    email?: GeneratePersonalizedEmailOutput;
    sms?: GeneratePersonalizedSMSOutput;
    voice?: AutomateAIVoiceCallOutput;
  }>({})

  // ICP Score filtering logic
  const buildSmartList = () => {
    setLoading(true)
    setTimeout(() => {
      const list = MOCK_CONTACTS
        .filter(c => !c.dnc && c.icpScore >= 80)
        .sort((a, b) => b.icpScore - a.icpScore)
      setActiveList(list)
      setLoading(false)
      toast({
        title: "Smart List Updated",
        description: `Found ${list.length} high-priority leads ready for outreach.`
      })
    }, 800)
  }

  const handleGenerateContent = async (contact: Contact, type: 'email' | 'sms' | 'voice') => {
    setLoading(true)
    try {
      if (type === 'email') {
        const res = await generatePersonalizedEmail({
          contactName: contact.name,
          contactEmail: contact.email,
          propertyName: contact.propertyAddress,
          sellerMotivation: contact.motivation,
          companyName: "Monica Realty Solutions",
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
      } else if (type === 'voice') {
        const res = await automateAIVoiceCall({
          contactName: contact.name,
          contactPhoneNumber: contact.phone,
          propertyAddress: contact.propertyAddress,
          sellerMotivation: contact.motivation
        })
        setGeneratedContent(prev => ({ ...prev, voice: res }))
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Could not generate AI content at this time."
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStartCall = () => {
    setCallActive(true)
    toast({
      title: "Call Initiated",
      description: `Connecting Vapi AI to ${selectedContact?.name}...`
    })
    
    // Simulate call ending after 3 seconds
    setTimeout(() => {
      setCallActive(false)
      setLoggingProgress(true)
      
      // Simulate post-call logging
      setTimeout(() => {
        setLoggingProgress(false)
        toast({
          title: "Call Logged",
          description: "Summary and next actions added to contact record."
        })
      }, 2000)
    }, 3000)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* List Panel */}
      <Card className="lg:col-span-1 shadow-lg border-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Smart Queue</CardTitle>
            <CardDescription>ICP Score &gt; 80, no DNC</CardDescription>
          </div>
          <Button onClick={buildSmartList} size="icon" variant="ghost" className="h-8 w-8">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            {activeList.length === 0 && !loading && (
              <div className="text-center py-12">
                <Sparkles className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-4">Click below to generate your daily smart list</p>
                <Button onClick={buildSmartList} variant="outline" className="w-full">Initialize Builder</Button>
              </div>
            )}
            
            <div className="space-y-3">
              {activeList.map((contact) => (
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
              ))}
              
              {loading && Array.from({length: 4}).map((_, i) => (
                <div key={i} className="p-4 rounded-lg border bg-white space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
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
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {selectedContact.email}</span>
                    <span className="flex items-center gap-1"><PhoneCall className="h-3 w-3" /> {selectedContact.phone}</span>
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-white border-primary text-primary">Priority 1 Lead</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {callActive ? (
                <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                  <div className="h-20 w-20 bg-primary rounded-full flex items-center justify-center mb-6 ring-8 ring-primary/20">
                    <PhoneCall className="h-10 w-10 text-white animate-bounce" />
                  </div>
                  <h3 className="text-xl font-bold text-primary">Live Vapi Call in Progress...</h3>
                  <p className="text-muted-foreground mt-2">AI is currently conversing with {selectedContact.name}</p>
                </div>
              ) : loggingProgress ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-12 w-12 text-accent animate-spin mb-4" />
                  <h3 className="text-xl font-bold text-primary">Logging Call Outcomes</h3>
                  <p className="text-muted-foreground mt-2 italic">Monica is summarizing the conversation and updating CRM...</p>
                </div>
              ) : (
                <Tabs defaultValue="email">
                  <TabsList className="grid w-full grid-cols-3 mb-8">
                    <TabsTrigger value="email" className="gap-2"><Mail className="h-4 w-4" /> Email</TabsTrigger>
                    <TabsTrigger value="sms" className="gap-2"><MessageSquare className="h-4 w-4" /> SMS</TabsTrigger>
                    <TabsTrigger value="voice" className="gap-2"><PhoneCall className="h-4 w-4" /> Voice (Vapi)</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="email" className="space-y-4">
                    {!generatedContent.email ? (
                      <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl bg-slate-50">
                        <Wand2 className="h-10 w-10 text-slate-300 mb-4" />
                        <p className="text-muted-foreground mb-6">Generate a personalized outreach email for this seller.</p>
                        <Button onClick={() => handleGenerateContent(selectedContact, 'email')} disabled={loading} className="gap-2">
                          {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
                          Generate Email
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
                          <Button size="sm" className="gap-2 bg-accent"><Send className="h-4 w-4" /> Send Now</Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="sms" className="space-y-4">
                    {!generatedContent.sms ? (
                      <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl bg-slate-50">
                        <MessageSquare className="h-10 w-10 text-slate-300 mb-4" />
                        <p className="text-muted-foreground mb-6">Create a short, engaging SMS script for this property.</p>
                        <Button onClick={() => handleGenerateContent(selectedContact, 'sms')} disabled={loading} className="gap-2">
                          {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
                          Generate SMS
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

                  <TabsContent value="voice" className="space-y-4">
                    {!generatedContent.voice ? (
                      <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl bg-slate-50">
                        <PhoneCall className="h-10 w-10 text-slate-300 mb-4" />
                        <p className="text-muted-foreground mb-6">Prepare Vapi scripts for automated calling and voicemail drops.</p>
                        <Button onClick={() => handleGenerateContent(selectedContact, 'voice')} disabled={loading} className="gap-2">
                          {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
                          Prepare Voice Session
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                        <div className="space-y-4">
                          <div className="p-4 rounded-lg border bg-blue-50/50">
                            <h4 className="text-xs font-bold uppercase text-blue-700 mb-2">Call Script</h4>
                            <p className="text-sm text-slate-700 italic">"{generatedContent.voice.callScript}"</p>
                          </div>
                          <div className="p-4 rounded-lg border bg-orange-50/50">
                            <h4 className="text-xs font-bold uppercase text-orange-700 mb-2">Voicemail Script</h4>
                            <p className="text-sm text-slate-700 italic">"{generatedContent.voice.voicemailScript}"</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-4 bg-slate-50 p-6 rounded-lg border">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                              <span className="text-xs font-medium">Vapi Integration Online</span>
                            </div>
                            <Button size="lg" className="gap-2 bg-primary" onClick={handleStartCall}>
                              <PhoneCall className="h-5 w-5" /> Initiate Vapi Call
                            </Button>
                          </div>
                          <div className="h-px bg-slate-200" />
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            <span>Monica will automatically log outcome, summary, and next actions after the call concludes.</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-[600px] text-center p-8">
            <div className="bg-slate-50 rounded-full p-6 mb-6">
              <Sparkles className="h-12 w-12 text-slate-200" />
            </div>
            <h3 className="text-xl font-headline font-bold text-slate-400 mb-2">No Lead Selected</h3>
            <p className="text-muted-foreground max-w-xs">Select a lead from your smart queue to generate AI outreach content.</p>
          </div>
        )}
      </Card>
    </div>
  )
}
