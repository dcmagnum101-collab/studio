
"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sparkles, PhoneCall, ArrowRight, RefreshCw, Calendar, Flame } from "lucide-react"
import { MOCK_CONTACTS } from "@/lib/mock-data"

export function MorningBriefingCard() {
  const [loading, setLoading] = React.useState(false)
  const topPriority = MOCK_CONTACTS.sort((a, b) => b.icpScore - a.icpScore)[0]

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1000)
  }

  return (
    <Card className="border-none shadow-lg bg-gradient-to-br from-primary via-primary to-primary/90 text-white overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-accent rounded-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-headline">Good Morning, Monica</CardTitle>
              <CardDescription className="text-primary-foreground/70 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Today's Briefing • March 23, 2024
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={handleRefresh}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
          <p className="text-sm leading-relaxed text-blue-50">
            "Monica, your pipeline is hot today! We've received 12 fresh expired listings and 3 pre-foreclosures in your target zip codes. Focus on the Las Vegas North zone—there's high intent activity there this morning. Your top priority is ready for a call."
          </p>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {[
            { label: 'Expired', count: 12, color: 'bg-red-500' },
            { label: 'FSBO', count: 8, color: 'bg-orange-500' },
            { label: 'Pre-Fore', count: 3, color: 'bg-yellow-500' },
            { label: 'FRBO', count: 11, color: 'bg-blue-500' },
            { label: 'Rec', count: 7, color: 'bg-purple-500' },
            { label: 'Circle', count: 34, color: 'bg-green-500' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
              <div className="text-lg font-bold">{stat.count}</div>
              <div className="text-[10px] uppercase tracking-wider text-white/60">{stat.label}</div>
            </div>
          ))}
        </div>

        {topPriority && (
          <div className="bg-accent/20 rounded-xl p-4 border border-accent/30 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center ring-4 ring-accent/20">
                <Flame className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{topPriority.name}</span>
                  <Badge className="bg-accent text-[10px] h-4">94/99 Score</Badge>
                </div>
                <p className="text-xs text-white/70">{topPriority.propertyAddress}</p>
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button size="sm" className="flex-1 bg-white text-primary hover:bg-white/90 gap-2 font-bold">
                <PhoneCall className="h-4 w-4" /> Call Now
              </Button>
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/10 px-2">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
