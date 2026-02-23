"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Sparkles, 
  BrainCircuit, 
  RefreshCw,
  ArrowRight,
  Send,
  Lock,
  AlertTriangle
} from "lucide-react"
import { generateNurturePlan, NurtureAnalysis } from "@/services/nurture-engine-service"
import { useUser } from "@/firebase"
import { useToast } from "@/hooks/use-toast"
import { sendNurtureEmail } from "@/app/actions/gmail"
import { ComplianceGuard } from "@/components/compliance/ComplianceGuard"
import { FEATURES } from "@/lib/feature-flags"

interface NurtureEngineProps {
  contactId: string;
  contactName: string;
}

export function LeadNurtureEngine({ contactId, contactName }: NurtureEngineProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [analysis, setAnalysis] = useState<NurtureAnalysis | null>(null);

  const handleRefresh = async () => {
    if (!user || !FEATURES.ai) return;
    setLoading(true);
    try {
      const result = await generateNurturePlan(user.uid, contactId);
      setAnalysis(result);
      toast({ title: "Intelligence Updated", description: "Monica has refreshed the deal strategy." });
    } catch (error) {
      toast({ variant: "destructive", title: "AI Run Failed", description: "Could not generate nurture plan." });
    } finally {
      setLoading(false);
    }
  };

  const handleSendDraft = async (finalContent: string) => {
    if (!user || !analysis?.draftedMessage) return;
    setSending(true);
    try {
      await sendNurtureEmail({
        userId: user.uid,
        contactId,
        to: "recipient@example.com",
        subject: analysis.draftedMessage.subject || "Strategic Real Estate Update",
        body: finalContent,
        isAiGenerated: true
      });
      toast({ title: "Email Sent", description: "Nurture message delivered." });
      setAnalysis(null);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Send Failed", description: err.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="border-none shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden">
      <CardHeader className="border-b border-white/10 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent rounded-lg">
              <BrainCircuit className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Nurture Engine</CardTitle>
              <CardDescription className="text-slate-400 text-xs">Deterministic Deal Intelligence</CardDescription>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={loading || !FEATURES.ai}
            className="text-white hover:bg-white/10 border border-white/10"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : (
              !FEATURES.ai ? <Lock className="h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />
            )}
            {analysis ? 'Refresh Intel' : 'Run Analysis'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-8">
        {!FEATURES.ai && (
          <div className="py-8 text-center space-y-4 bg-white/5 rounded-2xl border border-white/10">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
            <p className="text-xs text-slate-400 max-w-xs mx-auto italic">Monica's strategic analysis is offline. <strong>Connect Grok AI in Settings</strong> to unlock deterministic deal steps and outbound drafting.</p>
          </div>
        )}

        {FEATURES.ai && !analysis && !loading && (
          <div className="py-12 text-center space-y-4">
            <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
              <Sparkles className="h-8 w-8 text-slate-500" />
            </div>
            <p className="text-sm text-slate-400 max-w-xs mx-auto italic">Monica is waiting to analyze recent activity and calculate the next best action.</p>
          </div>
        )}

        {FEATURES.ai && loading && (
          <div className="py-12 flex flex-col items-center gap-4">
            <RefreshCw className="h-10 w-10 text-accent animate-spin" />
            <p className="text-xs text-accent font-bold uppercase tracking-widest animate-pulse">Processing Deal Intelligence...</p>
          </div>
        )}

        {FEATURES.ai && analysis && !loading && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            {/* Next Actions */}
            <section className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Suggested Next Actions</h4>
              <div className="grid gap-3">
                {analysis.nextActions.map((action, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5 group hover:bg-white/10 transition-colors">
                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${action.priority === 'high' ? 'bg-red-500 shadow-[0_0_8px_red]' : 'bg-blue-400'}`} />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-100">{action.title}</p>
                      <p className="text-xs text-slate-400">{action.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-white transition-colors" />
                  </div>
                ))}
              </div>
            </section>

            {/* Drafted Message & Compliance */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Outreach Draft</h4>
                <Badge variant="outline" className={`text-[9px] border-white/10 ${analysis.compliance.isEligible ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                  {analysis.compliance.isEligible ? 'SAFE TO SEND' : 'SENDING BLOCKED'}
                </Badge>
              </div>

              {analysis.draftedMessage && (
                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-2xl text-slate-900 space-y-2 shadow-2xl">
                    {analysis.draftedMessage.subject && (
                      <p className="text-[10px] font-black text-slate-400 border-b pb-2 mb-2">SUBJECT: {analysis.draftedMessage.subject}</p>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{analysis.draftedMessage.body}</p>
                  </div>
                  <div className="flex justify-end">
                    <ComplianceGuard 
                      content={analysis.draftedMessage.body} 
                      type={analysis.draftedMessage.type} 
                      contactName={contactName} 
                      onApproved={handleSendDraft}
                    >
                      <Button 
                        disabled={!analysis.compliance.isEligible || sending} 
                        className="gap-2 bg-accent hover:bg-accent/90 text-primary font-bold shadow-lg shadow-accent/20"
                      >
                        {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        {analysis.compliance.isEligible ? 'Send via Gmail' : 'Blocked'}
                      </Button>
                    </ComplianceGuard>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
