
"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, MessageSquare, Send, RefreshCw, Smartphone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function SocialLeadCapture() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)

  const handleCapture = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setAnalysis({
        name: "Jessica Miller",
        motivation: "Job relocation, needs to sell by end of summer",
        sentiment: "Determined",
        suggestedOpener: "Hi Jessica! I saw your post in the Henderson Neighbors group about moving. I specialize in helping families relocate from your zip code—would you like a quick market pulse on what your street is doing right now?"
      })
      toast({
        title: "AI Analysis Complete",
        description: "Social lead extracted and outreach drafted."
      })
    }, 1500)
  }

  return (
    <Card className="border-none shadow-lg overflow-hidden bg-white">
      <CardHeader className="bg-slate-50/50 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary text-white rounded-lg">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Social Lead Intelligence</CardTitle>
            <CardDescription>Paste posts from Nextdoor, FB, or LinkedIn to extract leads.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Source Platform</Label>
              <Select defaultValue="nextdoor">
                <SelectTrigger>
                  <SelectValue placeholder="Select Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nextdoor">Nextdoor</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Contact Name (If known)</Label>
              <Input placeholder="John Doe" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Post Content</Label>
            <Textarea 
              placeholder="e.g., 'Thinking about selling our place in Summerlin soon... does anyone know a good agent?'" 
              className="min-h-[120px]"
            />
          </div>
          <Button onClick={handleCapture} disabled={loading} className="w-full gap-2 font-bold py-6">
            {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
            AI Extract Lead & Draft Opener
          </Button>
        </div>

        {analysis && (
          <div className="space-y-4 pt-4 border-t animate-in fade-in slide-in-from-top-2">
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-bold text-primary">{analysis.name}</h4>
                  <p className="text-[10px] text-muted-foreground uppercase font-black">Motivation: {analysis.motivation}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground uppercase font-black">Sentiment</p>
                  <p className="text-xs font-bold text-accent">{analysis.sentiment}</p>
                </div>
              </div>
              <div className="h-px bg-primary/10" />
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-muted-foreground uppercase">AI Suggested Outreach</Label>
                <p className="text-xs text-slate-700 italic bg-white p-3 rounded-lg border">"{analysis.suggestedOpener}"</p>
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" className="text-xs">Edit</Button>
                  <Button size="sm" className="gap-2"><Send className="h-3 w-3" /> Approve & Create Contact</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
