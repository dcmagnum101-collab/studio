
"use client"

import React, { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Database, 
  RefreshCw, 
  Sparkles, 
  Home, 
  History, 
  Calendar, 
  Youtube, 
  Mail, 
  Scale, 
  Map,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SourcesHubPage() {
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSyncSource = (sourceName: string) => {
    setSyncing(sourceName);
    setTimeout(() => {
      setSyncing(null);
      toast({
        title: `${sourceName} Sync Complete`,
        description: "Fresh leads have been added to your Prospecting Hub."
      });
    }, 1500);
  };

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
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-none shadow-md bg-primary text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Database className="h-4 w-4 text-accent" />
                    Total Active Sources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black">15</div>
                  <p className="text-xs text-primary-foreground/70 mt-1">Providing 24/7 intelligence</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md bg-accent text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Leads Created (7d)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black">142</div>
                  <p className="text-xs text-white/70 mt-1">Average ICP Score: 74</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md bg-white border border-slate-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                    <TrendingUp className="h-4 w-4 text-accent" />
                    Automation Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black text-primary">Healthy</div>
                  <p className="text-xs text-muted-foreground mt-1">Next global sync in 4h 12m</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="all" className="space-y-8">
              <TabsList className="bg-slate-100 p-1 rounded-xl w-full justify-start overflow-x-auto no-scrollbar">
                <TabsTrigger value="all">All Sources</TabsTrigger>
                <TabsTrigger value="distress">Distress & REO</TabsTrigger>
                <TabsTrigger value="public">Public Records</TabsTrigger>
                <TabsTrigger value="engagement">Engagement</TabsTrigger>
                <TabsTrigger value="market">Market Data</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[
                  { name: "HUD Foreclosures", icon: Scale, type: "distress", desc: "FHA single-family REO data." },
                  { name: "Fannie Mae REO", icon: Home, type: "distress", desc: "HomePath bank-owned listings." },
                  { name: "Freddie Mac REO", icon: Home, type: "distress", desc: "HomeSteps institutional listings." },
                  { name: "Divorce Filings", icon: Scale, type: "public", desc: "Clark County Family Court data." },
                  { name: "USPS Vacancy", icon: Map, type: "market", desc: "Quarterly address vacancy tracking." },
                  { name: "YouTube Monitor", icon: Youtube, type: "engagement", desc: "Inbound comment intent signals." },
                  { name: "Google Alerts", icon: Mail, type: "engagement", desc: "Keyword-based web monitoring." },
                  { name: "HMDA Mortgage", icon: TrendingUp, type: "market", desc: "Equity & refi pattern analysis." },
                  { name: "Census Mobility", icon: Database, type: "market", desc: "Likely-to-move demographic scores." }
                ].map((source) => (
                  <Card key={source.name} className="border-none shadow-sm hover:shadow-md transition-all group">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className={`p-2 rounded-lg ${syncing === source.name ? 'bg-accent/10' : 'bg-slate-100'} group-hover:bg-primary/5 transition-colors`}>
                          <source.icon className={`h-5 w-5 ${syncing === source.name ? 'text-accent' : 'text-slate-600'}`} />
                        </div>
                        <Badge variant="secondary" className="text-[10px] uppercase">{source.type}</Badge>
                      </div>
                      <CardTitle className="text-sm font-bold mt-4">{source.name}</CardTitle>
                      <CardDescription className="text-xs leading-relaxed">{source.desc}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 flex items-center justify-between border-t mt-4">
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <History className="h-3 w-3" /> Sync 2h ago
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-xs font-bold gap-2 text-primary"
                        onClick={() => handleSyncSource(source.name)}
                        disabled={syncing !== null}
                      >
                        {syncing === source.name ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                        Sync
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>

            <section className="grid lg:grid-cols-2 gap-8">
              <Card className="border-none shadow-md overflow-hidden">
                <CardHeader className="bg-slate-50/50">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-accent" />
                    DOM Tracking Alert Queue
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100">
                    {[
                      { addr: "842 Pinehurst Dr", dom: 62, status: "Urgent", price: "$645k" },
                      { addr: "119 Summerlin Pkwy", dom: 44, status: "Watching", price: "$890k" },
                      { addr: "2201 Sahara Ave", dom: 76, status: "Hot", price: "$420k" }
                    ].map((item) => (
                      <div key={item.addr} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="text-sm font-bold text-primary">{item.addr}</p>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
                            <span>{item.price}</span>
                            <span>{item.dom} Days on Market</span>
                          </div>
                        </div>
                        <Badge className={`${item.status === 'Hot' ? 'bg-red-500' : 'bg-slate-100 text-slate-600'}`}>
                          {item.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-slate-50/50 border-t">
                    <Button variant="outline" className="w-full text-xs h-8">View Full DOM Tracker</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" />
                    Monica's Free Lead Strategy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
                    <p className="text-xs leading-relaxed italic text-blue-100">
                      "I've cross-referenced HMDA refinance data with Clark County GIS. Zip code 89144 shows a 22% spike in homeowners with 50%+ equity who haven't refinanced in 3 years. I've highlighted 12 contacts in your Prospector who match this high-motivation profile."
                    </p>
                    <div className="flex justify-end">
                      <Button size="sm" variant="outline" className="text-white border-white/20 hover:bg-white/10 text-[10px] h-7">View Target List</Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                      <p className="text-[10px] text-white/50 uppercase">Best Source (ROI)</p>
                      <p className="text-sm font-bold">Divorce Filings</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                      <p className="text-[10px] text-white/50 uppercase">Volume Source</p>
                      <p className="text-sm font-bold">HUD Foreclosures</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
