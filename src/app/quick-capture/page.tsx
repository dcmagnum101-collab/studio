
"use client"

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Send, RefreshCw, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function QuickCaptureContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const capturedUrl = searchParams.get("url") || "";
  const capturedText = searchParams.get("text") || "";

  useEffect(() => {
    if (capturedText) {
      handleAnalyze();
    }
  }, []);

  const handleAnalyze = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setAnalysis({
        name: "Potential Lead",
        motivation: "Major life transition detected in post content.",
        urgency: "High",
        suggestedOpener: "Hi! I saw your post regarding the move. I specialize in helping families in your neighborhood navigate these transitions. Would a quick market pulse update be helpful?"
      });
    }, 1200);
  };

  const handleSave = () => {
    toast({
      title: "Lead Created",
      description: "Contact has been added to your Prospecting Hub."
    });
    setTimeout(() => window.close(), 1000);
  };

  return (
    <div className="p-4 bg-slate-50 min-h-screen">
      <Card className="border-none shadow-xl overflow-hidden max-w-md mx-auto">
        <CardHeader className="bg-primary text-white pb-6">
          <div className="flex justify-between items-center mb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              Monica Quick Capture
            </CardTitle>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-8 w-8" onClick={() => window.close()}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-primary-foreground/70 text-xs">AI-powered social lead extraction</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6 bg-white">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Source URL</Label>
              <Input value={capturedUrl} readOnly className="bg-slate-50 text-xs truncate" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Captured Text</Label>
              <Textarea value={capturedText} className="min-h-[100px] text-xs leading-relaxed" />
            </div>
            
            {!analysis && !loading && (
              <Button onClick={handleAnalyze} className="w-full gap-2">
                <Sparkles className="h-4 w-4" /> Analyze Post
              </Button>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <RefreshCw className="h-8 w-8 text-accent animate-spin" />
                <p className="text-xs text-muted-foreground italic">Monica is extracting lead intelligence...</p>
              </div>
            )}

            {analysis && (
              <div className="space-y-4 pt-4 border-t animate-in fade-in slide-in-from-top-2">
                <div className="p-4 bg-accent/5 rounded-xl border border-accent/10 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-primary">{analysis.name}</h4>
                      <p className="text-[10px] text-muted-foreground uppercase font-black">Motivation: {analysis.motivation}</p>
                    </div>
                    <Badge className="bg-accent h-4 text-[8px] font-bold uppercase">{analysis.urgency}</Badge>
                  </div>
                  <div className="h-px bg-slate-100" />
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-muted-foreground uppercase">AI Suggested Opener</p>
                    <p className="text-xs text-slate-700 italic bg-white p-3 rounded-lg border leading-relaxed leading-relaxed">"{analysis.suggestedOpener}"</p>
                    <div className="flex gap-2 justify-end pt-2">
                      <Button size="sm" className="gap-2 bg-primary" onClick={handleSave}>
                        <Send className="h-3 w-3" /> Approve & Save
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function QuickCapturePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground italic">Opening Quick Capture...</div>}>
      <QuickCaptureContent />
    </Suspense>
  );
}
