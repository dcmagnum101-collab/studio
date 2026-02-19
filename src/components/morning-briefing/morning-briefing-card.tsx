"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sparkles, PhoneCall, ArrowRight, RefreshCw, Calendar, Flame } from "lucide-react"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit } from "firebase/firestore"
import Link from "next/link"

export function MorningBriefingCard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const briefingQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'morningBriefings'), orderBy('date', 'desc'), limit(1));
  }, [firestore, user]);

  const { data: briefings, isLoading } = useCollection(briefingQuery);
  const currentBriefing = briefings?.[0] as any;

  const topPriorityQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'contacts'), orderBy('icpScore', 'desc'), limit(1));
  }, [firestore, user]);

  const { data: topContacts } = useCollection(topPriorityQuery);
  const topPriority = topContacts?.[0] as any;

  if (!mounted) return null;

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
                <Calendar className="h-3 w-3" /> Today's Briefing • {new Date().toLocaleDateString()}
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
          <p className="text-sm leading-relaxed text-blue-50">
            {currentBriefing?.briefing_text || "Monica, your pipeline is hot today! You have fresh activity in your target zip codes. Review your top priority lead below to start your power hour."}
          </p>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {[
            { label: 'Expired', count: currentBriefing?.fresh_expireds || 0, color: 'bg-red-500' },
            { label: 'FSBO', count: currentBriefing?.fresh_fsbos || 0, color: 'bg-orange-500' },
            { label: 'Pre-Fore', count: currentBriefing?.preforeclosure || 0, color: 'bg-yellow-500' },
            { label: 'FRBO', count: currentBriefing?.frbo || 0, color: 'bg-blue-500' },
            { label: 'Rec', count: currentBriefing?.recommended || 0, color: 'bg-purple-500' },
            { label: 'Circle', count: currentBriefing?.circle || 0, color: 'bg-green-500' },
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
                  <Badge className="bg-accent text-[10px] h-4">{topPriority.icpScore}/99 Score</Badge>
                </div>
                <p className="text-xs text-white/70">{topPriority.propertyAddress}</p>
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Link href={`/contacts/${topPriority.id}`}>
                <Button size="sm" className="flex-1 bg-white text-primary hover:bg-white/90 gap-2 font-bold">
                  <PhoneCall className="h-4 w-4" /> Open Profile
                </Button>
              </Link>
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
