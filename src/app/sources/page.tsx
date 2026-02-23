"use client"

import React, { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  Database, 
  RefreshCw, 
  Sparkles, 
  Home, 
  History, 
  Youtube, 
  Mail, 
  Scale, 
  Map,
  TrendingUp,
  AlertCircle,
  ShieldCheck,
  Search,
  Globe,
  Smartphone,
  CheckCircle2,
  Lock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useDoc, useMemoFirebase } from "@/firebase";
import { FEATURES } from "@/lib/feature-flags";

const SOURCES = [
  { id: 'spark', name: "LVR Spark API", icon: Home, desc: "Official Las Vegas MLS feed (Geographic radius)." },
  { id: 'trulia', name: "Trulia Listings", icon: Map, desc: "Sync active/sold data via RapidAPI." },
  { id: 'records', name: "Public Records", icon: Scale, desc: "NOD and Probate monitoring (Clark County)." },
  { id: 'social', name: "Social Capture", icon: Smartphone, desc: "AI extraction from Nextdoor and FB." }
];

export default function SourcesHubPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-xl font-bold font-headline text-primary">Intelligence Sources Hub</h1>
          </header>
          
          <main className="p-8 max-w-7xl mx-auto w-full space-y-8">
            {!FEATURES.sparkMLS && (
              <Card className="border-amber-200 bg-amber-50 shadow-sm border-2">
                <CardContent className="p-6 flex items-start gap-4">
                  <AlertCircle className="h-6 w-6 text-amber-600 shrink-0 mt-1" />
                  <div className="space-y-2">
                    <h3 className="font-black text-amber-900 uppercase text-xs tracking-widest">MLS Connection Required</h3>
                    <p className="text-sm text-amber-800 leading-relaxed">
                      Official LVR MLS data is not connected. Get your <strong>Spark API Key</strong> at sparkplatform.com and add it to your environment variables to enable radius searches and competitor detection.
                    </p>
                    <Button variant="outline" size="sm" className="bg-white border-amber-200 text-amber-900 font-bold h-8">
                      Setup Instructions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {SOURCES.map((source) => (
                <Card key={source.id} className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className={`p-2 rounded-lg bg-slate-100 group-hover:bg-primary/5 transition-colors`}>
                        <source.icon className={`h-5 w-5 text-slate-600 group-hover:text-primary transition-colors`} />
                      </div>
                      <Badge variant="secondary" className="text-[10px] uppercase">
                        {(source.id === 'spark' && FEATURES.sparkMLS) ? 'CONNECTED' : 'READY'}
                      </Badge>
                    </div>
                    <CardTitle className="text-sm font-bold mt-4">{source.name}</CardTitle>
                    <CardDescription className="text-xs leading-relaxed">{source.desc}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 flex items-center justify-between border-t mt-4 bg-slate-50/50">
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <History className="h-3 w-3" /> Ready to sync
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 text-xs font-bold gap-2 text-primary"
                      disabled={source.id === 'spark' && !FEATURES.sparkMLS}
                    >
                      {source.id === 'spark' && !FEATURES.sparkMLS && <Lock className="h-3 w-3" />}
                      Sync Hub
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
