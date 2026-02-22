
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
  ShieldCheck
} from "lucide-react"
import { useUser, useFirestore, addDocumentNonBlocking } from "@/firebase"
import { syncLVRListings, fetchNeighborhoodStats, getExpiringLeadsAction } from "@/app/actions/lvr-mls"
import { useToast } from "@/hooks/use-toast"
import { collection } from "firebase/firestore"

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

  const handleSync = async (type: 'active' | 'expired' | 'pending' | 'sold') => {
    if (!user) return;
    setLoading(type);
    try {
      const res = await syncLVRListings({ type, zipCodes: selectedZips, userId: user.uid });
      toast({
        title: `Sync Complete: ${type.toUpperCase()}`,
        description: `Imported ${res.imported} new prospects. ${res.duplicates} duplicates skipped.`,
      });
      // Optionally refresh a local results preview if needed
    } catch (err: any) {
      toast({ variant: "destructive", title: "Sync Failed", description: err.message });
    } finally {
      setLoading(null);
    }
  };

  const handleFindExpiring = async () => {
    if (!user) return;
    setLoading('expiring');
    try {
      const leads = await getExpiringLeadsAction(user.uid, selectedZips);
      setResults(leads);
      toast({ title: "Pre-Expiry Scan Complete", description: `Found ${leads.length} listings expiring within 7 days.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Scan Failed", description: err.message });
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
              <Badge className="bg-green-500 gap-1.5 h-6 px-2 text-[10px] uppercase font-black tracking-widest">
                <ShieldCheck className="h-3 w-3" /> Connection: Active
              </Badge>
            </div>
            <Button className="ml-auto bg-accent hover:bg-accent/90 text-primary font-bold shadow-md h-9 gap-2">
              <RefreshCw className="h-4 w-4" /> Sync All Data
            </Button>
          </header>
          
          <main className="p-8 max-w-7xl mx-auto w-full space-y-8">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-accent" />
                  Target Zip Codes
                </h2>
                <span className="text-[10px] text-muted-foreground italic">Monica is monitoring {selectedZips.length} neighborhoods</span>
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
              <Card className="border-none shadow-md hover:shadow-xl transition-all cursor-pointer group" onClick={() => handleSync('active')}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Home className="h-5 w-5" />
                    </div>
                    {loading === 'active' && <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Active Listings</h3>
                    <p className="text-xs text-muted-foreground">Monitor current competition</p>
                  </div>
                  <Button variant="ghost" size="sm" className="w-full justify-between p-0 h-auto font-black text-[10px] uppercase tracking-tighter text-blue-600">
                    Run Sync <ChevronRight className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md hover:shadow-xl transition-all cursor-pointer group" onClick={() => handleSync('expired')}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="p-2 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-600 group-hover:text-white transition-colors">
                      <Clock className="h-5 w-5" />
                    </div>
                    {loading === 'expired' && <RefreshCw className="h-4 w-4 animate-spin text-red-600" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Expired Sync</h3>
                    <p className="text-xs text-muted-foreground">High-intent seller leads</p>
                  </div>
                  <Button variant="ghost" size="sm" className="w-full justify-between p-0 h-auto font-black text-[10px] uppercase tracking-tighter text-red-600">
                    Run Sync <ChevronRight className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md hover:shadow-xl transition-all cursor-pointer group" onClick={handleFindExpiring}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="p-2 bg-accent/10 text-accent rounded-lg group-hover:bg-accent group-hover:text-white transition-colors">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    {loading === 'expiring' && <RefreshCw className="h-4 w-4 animate-spin text-accent" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Pre-Expiry Alert</h3>
                    <p className="text-xs text-muted-foreground">Approach before they expire</p>
                  </div>
                  <Button variant="ghost" size="sm" className="w-full justify-between p-0 h-auto font-black text-[10px] uppercase tracking-tighter text-accent">
                    Scan LVR <ChevronRight className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md hover:shadow-xl transition-all cursor-pointer group" onClick={() => handleSync('sold')}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-colors">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    {loading === 'sold' && <RefreshCw className="h-4 w-4 animate-spin text-green-600" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Recent Solds</h3>
                    <p className="text-xs text-muted-foreground">Analyze neighbor price points</p>
                  </div>
                  <Button variant="ghost" size="sm" className="w-full justify-between p-0 h-auto font-black text-[10px] uppercase tracking-tighter text-green-600">
                    Run Sync <ChevronRight className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-none shadow-xl bg-white overflow-hidden">
                  <CardHeader className="bg-slate-50/50 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Recent Sync Results</CardTitle>
                        <CardDescription className="text-xs">Intelligence matches from LVR feed</CardDescription>
                      </div>
                      <Sparkles className="h-5 w-5 text-accent animate-pulse" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow>
                          <TableHead className="font-bold text-xs uppercase">Property</TableHead>
                          <TableHead className="font-bold text-xs uppercase">Price</TableHead>
                          <TableHead className="font-bold text-xs uppercase">DOM</TableHead>
                          <TableHead className="text-right font-bold text-xs uppercase">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.length > 0 ? (
                          results.map((item) => (
                            <TableRow key={item.mlsNumber} className="hover:bg-slate-50/50 transition-colors">
                              <TableCell className="py-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-14 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                                    {item.thumbnail ? (
                                      <img src={item.thumbnail} className="h-full w-full object-cover" />
                                    ) : <Home className="h-full w-full p-2 text-slate-300" />}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-primary truncate">{item.propertyAddress}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase">{item.zip} • {item.beds}bd/{item.baths}ba</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm font-black text-slate-700">${item.listPrice?.toLocaleString()}</span>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-[10px] font-bold border-slate-200">{item.daysOnMarket} Days</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button size="sm" variant="ghost" className="h-8 gap-2 text-xs font-bold text-primary">
                                  Prospect <ArrowUpRight className="h-3.5 w-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-20 text-muted-foreground italic text-xs">
                              Select a sync category to preview real-time LVR data.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
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
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-black uppercase text-slate-400">Active Listings</p>
                        <p className="text-sm font-bold text-blue-600">{stat.active_count}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-black uppercase text-slate-400">Sold (30d)</p>
                        <p className="text-sm font-bold text-green-600">{stat.sold_last_30_days}</p>
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
