"use client"

import React, { useState, useEffect } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Database, 
  RefreshCw, 
  Sparkles, 
  MapPin, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ArrowUpRight,
  Home,
  ShieldCheck,
  ArrowRight,
  Search,
  Lock
} from "lucide-react"
import { useUser, useFirestore, addDocumentNonBlocking, useDoc, useMemoFirebase } from "@/firebase"
import { syncLVRListings, fetchNeighborhoodStats } from "@/app/actions/lvr-mls"
import { unifiedMLSSync } from "@/services/mls-sync-orchestrator"
import { useToast } from "@/hooks/use-toast"
import { FEATURES } from "@/lib/feature-flags"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const VEGAS_ZIPS = [
  { zip: "89144", area: "Summerlin" },
  { zip: "89135", area: "Summerlin South" },
  { zip: "89012", area: "Henderson" },
  { zip: "89052", area: "Seven Hills" },
  { zip: "89117", area: "Lakes/Peccole" },
  { zip: "89138", area: "The Vistas" },
];

export default function MLSIntelligencePage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [selectedZips, setSelectedZips] = useState<string[]>(["89144", "89135"]);
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [vitals, setVitals] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      handleLoadVitals();
    }
  }, [user, selectedZips]);

  const handleLoadVitals = async () => {
    if (!user) return;
    try {
      const data = await fetchNeighborhoodStats(user.uid, selectedZips);
      setVitals(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSyncNow = async () => {
    if (!user || !FEATURES.mlsData) return;
    setLoading('global');
    try {
      const res = await unifiedMLSSync(user.uid, 'las_vegas', 'all');
      setResults(res.data);
      toast({ title: "Sync Complete", description: `Pulled ${res.data.length} listings.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Sync Failed", description: err.message });
    } finally {
      setLoading(null);
    }
  };

  const handleSync = async (type: 'active' | 'expired' | 'pending' | 'sold') => {
    if (!user || !FEATURES.mlsData) return;
    setLoading(type);
    try {
      const res = await syncLVRListings({ type, zipCodes: selectedZips, userId: user.uid });
      toast({
        title: `Sync Complete: ${type.toUpperCase()}`,
        description: `Imported ${res.imported} new prospects.`,
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Sync Failed", description: err.message });
    } finally {
      setLoading(null);
    }
  };

  const toggleZip = (zip: string) => {
    setSelectedZips(prev => 
      prev.includes(zip) ? prev.filter(z => z !== zip) : [...prev, zip]
    );
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold font-headline text-primary">LVR MLS Intelligence</h1>
              <Badge className={`${FEATURES.mlsData ? 'bg-green-500' : 'bg-amber-500'} gap-1.5 h-6 px-2 text-[10px] uppercase font-black tracking-widest text-white`}>
                <ShieldCheck className="h-3 w-3" /> Connection: {FEATURES.mlsData ? 'Active' : 'Offline'}
              </Badge>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    className="ml-auto bg-accent hover:bg-accent/90 text-primary font-bold shadow-md h-9 gap-2"
                    disabled={!FEATURES.mlsData || !!loading}
                    onClick={handleSyncNow}
                  >
                    {!FEATURES.mlsData && <Lock className="h-3.5 w-3.5" />}
                    <RefreshCw className={`h-4 w-4 ${loading === 'global' ? 'animate-spin' : ''}`} /> Sync All Data
                  </Button>
                </TooltipTrigger>
                {!FEATURES.mlsData && (
                  <TooltipContent>Connect RapidAPI in Settings to enable live data</TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </header>
          
          <main className="p-8 max-w-7xl mx-auto w-full space-y-8">
            {!FEATURES.mlsData && (
              <Card className="border-amber-200 bg-amber-50 shadow-sm">
                <CardContent className="p-4 flex items-center gap-4">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <p className="text-sm font-medium text-amber-800">
                    MLS live data integration is disabled. <strong>Connect RapidAPI in Settings</strong> to unlock real-time expired and active listings.
                  </p>
                </CardContent>
              </Card>
            )}

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-accent" />
                  Target Zip Codes
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {VEGAS_ZIPS.map(item => (
                  <Button 
                    key={item.zip}
                    variant={selectedZips.includes(item.zip) ? "default" : "outline"}
                    className={`h-10 rounded-xl px-4 font-bold text-xs transition-all ${selectedZips.includes(item.zip) ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-white border-slate-200'}`}
                    onClick={() => toggleZip(item.zip)}
                  >
                    {item.zip} <span className="ml-2 text-[10px] opacity-60 font-medium">{item.area}</span>
                  </Button>
                ))}
              </div>
            </section>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                { type: 'active', label: 'Active Listings', icon: Home, color: 'text-blue-600', bg: 'bg-blue-50' },
                { type: 'expired', label: 'Expired Sync', icon: Clock, color: 'text-red-600', bg: 'bg-red-50' },
                { type: 'pending', label: 'Pending Sales', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
                { type: 'sold', label: 'Recent Solds', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
              ].map((s) => (
                <Card key={s.type} className={`border-none shadow-md transition-all ${FEATURES.mlsData ? 'hover:shadow-xl cursor-pointer group' : 'opacity-60 cursor-not-allowed'}`} onClick={() => FEATURES.mlsData && handleSync(s.type as any)}>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className={`p-2 ${s.bg} ${s.color} rounded-lg ${FEATURES.mlsData ? 'group-hover:bg-primary group-hover:text-white' : ''} transition-colors`}>
                        <s.icon className="h-5 w-5" />
                      </div>
                      {loading === s.type && <RefreshCw className={`h-4 w-4 animate-spin ${s.color}`} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{s.label}</h3>
                      <p className="text-xs text-muted-foreground">{FEATURES.mlsData ? 'Run neighborhood scan' : 'RapidAPI required'}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-none shadow-xl bg-white overflow-hidden">
                  <CardHeader className="bg-slate-50/50 border-b">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Sync Results</CardTitle>
                      <Sparkles className="h-5 w-5 text-accent animate-pulse" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {results.length > 0 ? (
                      <Table>
                        <TableHeader className="bg-slate-50/50">
                          <TableRow>
                            <TableHead className="font-bold text-xs uppercase">Property</TableHead>
                            <TableHead className="font-bold text-xs uppercase">Price</TableHead>
                            <TableHead className="text-right font-bold text-xs uppercase">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {results.map((item) => (
                            <TableRow key={item.mlsNumber || item.id} className="hover:bg-slate-50/50 transition-colors">
                              <TableCell className="py-4">
                                <div className="flex items-center gap-3">
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-primary truncate">{item.propertyAddress || item.address}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase">{item.zip} • {item.beds}bd/{item.baths}ba</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm font-black text-slate-700">${(item.listPrice || item.list_price)?.toLocaleString()}</span>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button size="sm" variant="ghost" className="h-8 gap-2 text-xs font-bold text-primary">
                                  Prospect <ArrowUpRight className="h-3.5 w-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-24 px-6 text-center space-y-6">
                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center">
                          <Search className="h-8 w-8 text-slate-200" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold text-slate-900">No listings synced yet</h3>
                          <p className="text-xs text-slate-500 max-w-xs mx-auto">
                            {FEATURES.mlsData ? 'Monica is ready to scan the Henderson and Summerlin markets.' : 'Connect your data sources in Settings to enable market intelligence scans.'}
                          </p>
                        </div>
                        {FEATURES.mlsData && (
                          <Button 
                            onClick={handleSyncNow} 
                            disabled={!!loading}
                            className="bg-primary h-12 px-8 rounded-xl font-black gap-2 shadow-lg"
                          >
                            <RefreshCw className={`h-4 w-4 ${loading === 'global' ? 'animate-spin' : ''}`} />
                            Sync Now
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  Neighborhood Vitals
                </h2>
                {vitals.map(stat => (
                  <Card key={stat.zipCode} className="border-none shadow-md bg-gradient-to-br from-white to-slate-50">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg font-black text-primary">{stat.zipCode}</CardTitle>
                        <Badge className="bg-primary/5 text-primary border-primary/10">{VEGAS_ZIPS.find(z => z.zip === stat.zipCode)?.area}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-black uppercase text-slate-400">Median Price</p>
                        <p className="text-sm font-bold text-slate-700">${stat.median_price.toLocaleString()}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-black uppercase text-slate-400">Avg DOM</p>
                        <p className="text-sm font-bold text-slate-700">{stat.avg_dom} Days</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
