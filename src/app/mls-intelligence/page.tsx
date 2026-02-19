"use client"

import React, { useState, useEffect } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Search, 
  Filter, 
  Home, 
  TrendingDown, 
  AlertCircle, 
  Sparkles, 
  RefreshCw,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Database,
  CheckCircle2
} from "lucide-react"
import { useUser, useFirestore, addDocumentNonBlocking } from "@/firebase"
import { unifiedMLSSync } from "@/services/mls-sync-orchestrator"
import { MONICA_MARKET_HASHES } from "@/config/trulia-constants"
import { useToast } from "@/hooks/use-toast"
import { collection } from "firebase/firestore"

export default function MLSIntelligencePage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [activeMarket, setActiveMarket] = useState("las_vegas");
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [currentSource, setCurrentSource] = useState<'trulia' | 'realtor' | 'zillow' | 'homes' | 'fallback'>('trulia');

  useEffect(() => {
    if (user) {
      handleSync();
    }
  }, [user, activeMarket, activeTab]);

  const handleSync = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await unifiedMLSSync(user.uid, activeMarket, activeTab);
      setListings(result.data);
      setCurrentSource(result.source);
      
      if (result.status === 'fallback') {
        toast({ 
          title: "Fallback Sync Active", 
          description: `Switched to ${result.source.toUpperCase()} as Trulia primary was unavailable.` 
        });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Global Sync Failed", description: "All real estate data sources are currently unreachable." });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = (listing: any) => {
    if (!user) return;
    const db = useFirestore();
    const contactsRef = collection(db, 'users', user.uid, 'contacts');
    
    let icp = 50;
    if (listing.is_fsbo) icp += 15;
    if (listing.is_foreclosure) icp += 20;
    if (listing.days_on_market > 60) icp += 20;

    addDocumentNonBlocking(contactsRef, {
      name: "Market Prospect",
      propertyAddress: listing.address,
      icpScore: icp,
      archagent_source: "mls_intel",
      archagent_tags: [listing.source || "mls", listing.is_fsbo ? "fsbo" : "", listing.is_foreclosure ? "foreclosure" : ""].filter(Boolean),
      pipeline_stage: "new_lead",
      motivation: listing.is_fsbo ? "FSBO listing detected" : "MLS monitoring signal",
      ownerId: user.uid,
      created_at: new Date().toISOString()
    });

    toast({ title: "Lead Created", description: `${listing.address} added to CRM.` });
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold font-headline text-primary">MLS Intelligence</h1>
              <Badge variant="outline" className="gap-1.5 py-1 px-2 border-slate-200 bg-slate-50 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <Database className="h-3 w-3" />
                Live Source: {currentSource}
              </Badge>
            </div>
            <div className="ml-auto flex gap-2">
              <select 
                className="h-9 rounded-md border border-input px-3 text-sm bg-white"
                value={activeMarket}
                onChange={(e) => setActiveMarket(e.target.value)}
              >
                <option value="las_vegas">Las Vegas, NV</option>
                <option value="henderson">Henderson, NV</option>
                <option value="north_las_vegas">North Las Vegas</option>
                <option value="summerlin">Summerlin</option>
              </select>
              <Button size="sm" variant="outline" onClick={handleSync} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Force Sync
              </Button>
            </div>
          </header>
          
          <main className="p-8 max-w-7xl mx-auto w-full space-y-8">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 text-white rounded-lg">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-blue-900">Multi-Source Sync Active</h3>
                  <p className="text-xs text-blue-700">Monica is currently cross-referencing Trulia, Realtor.com, and Zillow for data integrity.</p>
                </div>
              </div>
              <div className="flex -space-x-2">
                {['T', 'R', 'Z', 'H'].map((source) => (
                  <div key={source} className="h-8 w-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-sm">
                    {source}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-none shadow-md bg-primary text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Home className="h-4 w-4 text-accent" />
                    Market Inventory
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black">{listings.length}</div>
                  <p className="text-xs text-white/70 mt-1">Properties tracked in {activeMarket.replace('_', ' ')}</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md bg-accent text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Stale Inventory
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black">{listings.filter(l => l.days_on_market > 60).length}</div>
                  <p className="text-xs text-white/70 mt-1">Listings with DOM 60+</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                    <Sparkles className="h-4 w-4 text-accent" />
                    Source Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-black text-primary uppercase">{loading ? 'Syncing...' : 'Optimal'}</div>
                  <p className="text-xs text-muted-foreground mt-1">Redundancy systems online</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="bg-slate-100 p-1 rounded-xl w-full justify-start h-auto overflow-x-auto no-scrollbar">
                <TabsTrigger value="active">Active Listings</TabsTrigger>
                <TabsTrigger value="sold">Recently Sold</TabsTrigger>
                <TabsTrigger value="fsbo">FSBO Tracker</TabsTrigger>
                <TabsTrigger value="foreclosure">Foreclosures</TabsTrigger>
                <TabsTrigger value="reduced">Price Reductions</TabsTrigger>
              </TabsList>

              <Card className="border-none shadow-xl">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-bold">Property</TableHead>
                        <TableHead className="font-bold">Price</TableHead>
                        <TableHead className="font-bold">DOM</TableHead>
                        <TableHead className="font-bold">Source</TableHead>
                        <TableHead className="text-right font-bold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">Fetching intelligence from multiple sources...</TableCell>
                        </TableRow>
                      ) : listings.length > 0 ? (
                        listings.map((listing) => (
                          <TableRow key={listing.id} className="hover:bg-slate-50 transition-colors">
                            <TableCell>
                              <div className="font-bold text-primary">{listing.address}</div>
                              <div className="text-[10px] text-muted-foreground uppercase">{listing.city} • {listing.beds}bd/{listing.baths}ba • {listing.sqft}sf</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-bold">${listing.list_price?.toLocaleString() || listing.sold_price?.toLocaleString()}</div>
                              {listing.price_reduced && <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[9px] h-4">REDUCED</Badge>}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Clock className={`h-3 w-3 ${listing.days_on_market > 60 ? 'text-red-500' : 'text-slate-400'}`} />
                                <span className={listing.days_on_market > 60 ? 'font-bold text-red-600' : ''}>{listing.days_on_market} days</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize text-[10px] font-medium bg-white">{listing.source || currentSource}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" className="gap-2" onClick={() => handleCreateLead(listing)}>
                                <ArrowUpRight className="h-4 w-4" /> Import Lead
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">No matching listings found in current data pull.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Tabs>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
