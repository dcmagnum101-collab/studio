
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
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useDoc, useMemoFirebase } from "@/firebase";
import { syncTruliaListingsAction } from "@/app/actions/prospecting/trulia";
import { syncRealtorListingsAction } from "@/app/actions/prospecting/realtor-com";
import { syncCraigslistFSBOAction } from "@/app/actions/prospecting/craigslist";
import { syncPublicRecordsAction } from "@/app/actions/prospecting/public-records";

const SOURCES = [
  { id: 'trulia', name: "Trulia Listings", icon: Map, desc: "Sync active/sold data via RapidAPI." },
  { id: 'realtor', name: "Realtor.com", icon: Globe, desc: "Official listing data and stale lead tracking." },
  { id: 'craigslist', name: "Craigslist FSBO", icon: Search, desc: "Scrape by-owner listings via JSON feed." },
  { id: 'records', name: "Public Records", icon: Scale, desc: "NOD and Probate monitoring (Clark County)." },
  { id: 'social', name: "Social Capture", icon: Smartphone, desc: "AI extraction from Nextdoor and FB." },
  { id: 'youtube', name: "YouTube Monitor", icon: Youtube, desc: "Keyword monitoring for 'moving' signals." },
  { id: 'lvr', name: "LVR MLS", icon: Home, desc: "Direct board integration for Las Vegas." }
];

export default function SourcesHubPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [zipCode, setZipCode] = useState("89144");
  const [syncResults, setSyncResults] = useState<Record<string, any>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const month = new Date().toISOString().slice(0, 7);
  const quotaRef = useMemoFirebase(() => user ? `users/${user.uid}/rapidapi_quota/${month}` : null, [user, month]);
  const { data: quota } = useDoc(quotaRef);

  const handleSync = async (sourceId: string) => {
    if (!user) return;
    setSyncing(sourceId);
    try {
      let res;
      switch(sourceId) {
        case 'trulia': res = await syncTruliaListingsAction(user.uid, { zipCode, type: 'for_sale' }); break;
        case 'realtor': res = await syncRealtorListingsAction(user.uid, { zipCode, status: 'active' }); break;
        case 'craigslist': res = await syncCraigslistFSBOAction(user.uid, { city: 'lasvegas' }); break;
        case 'records': res = await syncPublicRecordsAction(user.uid, { zipCode, type: 'preforeclosure' }); break;
        default: 
          await new Promise(resolve => setTimeout(resolve, 1000));
          res = { imported: 0, duplicates: 0 };
      }
      
      setSyncResults(prev => ({ ...prev, [sourceId]: res }));
      toast({
        title: `${sourceId.toUpperCase()} Sync Complete`,
        description: `Imported ${res.imported || 0} leads. ${res.duplicates || 0} duplicates skipped.`,
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Sync Failed", description: err.message });
    } finally {
      setSyncing(null);
    }
  };

  const handleSyncAll = async () => {
    toast({ title: "Global Sync Initiated", description: "Monica is running parallel queries across all sources." });
    const tasks = SOURCES.map(s => handleSync(s.id));
    await Promise.allSettled(tasks);
  };

  if (!mounted) return null;

  const totalCalls = (quota?.trulia_calls || 0) + (quota?.realtor_calls || 0);
  const quotaPercent = Math.min(100, (totalCalls / 500) * 100);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-xl font-bold font-headline text-primary">Intelligence Sources Hub</h1>
            <div className="ml-auto flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border">
                <Map className="h-4 w-4 text-slate-400" />
                <Input 
                  value={zipCode} 
                  onChange={(e) => setZipCode(e.target.value)} 
                  className="h-7 w-20 border-none bg-transparent font-bold text-sm focus-visible:ring-0 p-0"
                  placeholder="Zip"
                />
              </div>
              <Button size="sm" className="bg-accent hover:bg-accent/90 text-primary font-bold shadow-md h-9 gap-2" onClick={handleSyncAll}>
                <RefreshCw className="h-4 w-4" /> Sync All Sources
              </Button>
            </div>
          </header>
          
          <main className="p-8 max-w-7xl mx-auto w-full space-y-8">
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-none shadow-md bg-primary text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Database className="h-4 w-4 text-accent" />
                    RapidAPI Quota
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="opacity-70">Monthly Usage</span>
                    <span className="font-bold">{totalCalls} / 500</span>
                  </div>
                  <Progress value={quotaPercent} className="h-2 bg-white/10" />
                  <p className="text-[10px] text-white/50 italic">Resets on the 1st of each month</p>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-md bg-accent text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Global Sync Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black">Healthy</div>
                  <p className="text-xs text-white/70 mt-1">Next global sync in 4h 12m</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md bg-white border border-slate-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                    <TrendingUp className="h-4 w-4 text-accent" />
                    Leads Captured (24h)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black text-primary">24</div>
                  <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold">
                    <TrendingUp className="h-3 w-3" /> +12% from yesterday
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {SOURCES.map((source) => (
                <Card key={source.id} className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className={`p-2 rounded-lg bg-slate-100 group-hover:bg-primary/5 transition-colors`}>
                        <source.icon className={`h-5 w-5 text-slate-600 group-hover:text-primary transition-colors`} />
                      </div>
                      <Badge variant="secondary" className="text-[10px] uppercase">
                        {syncResults[source.id] ? 'Connected' : 'Ready'}
                      </Badge>
                    </div>
                    <CardTitle className="text-sm font-bold mt-4">{source.name}</CardTitle>
                    <CardDescription className="text-xs leading-relaxed">{source.desc}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 flex items-center justify-between border-t mt-4 bg-slate-50/50">
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <History className="h-3 w-3" /> 
                      {syncResults[source.id] ? 'Just now' : 'Never'}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 text-xs font-bold gap-2 text-primary"
                      onClick={() => handleSync(source.id)}
                      disabled={syncing === source.id}
                    >
                      {syncing === source.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      Sync
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-none shadow-xl bg-white overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Recent Sync Results</CardTitle>
                    <CardDescription className="text-xs">Newly acquired leads across all active channels</CardDescription>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {Object.entries(syncResults).length > 0 ? (
                    SOURCES.map(s => {
                      const res = syncResults[s.id];
                      if (!res || !res.imported) return null;
                      return (
                        <div key={s.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                              <s.icon className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-primary">{s.name} Sync</p>
                              <p className="text-[10px] text-muted-foreground">Imported {res.imported} new prospects into your pipeline.</p>
                            </div>
                          </div>
                          <Badge className="bg-green-500">Success</Badge>
                        </div>
                      )
                    })
                  ) : (
                    <div className="p-20 text-center text-slate-400 italic text-sm">
                      Select a source to begin syncing real-time intelligence.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
