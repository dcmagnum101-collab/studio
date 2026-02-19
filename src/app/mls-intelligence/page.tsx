
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
  ShieldAlert
} from "lucide-react"
import { useUser, useFirestore, addDocumentNonBlocking } from "@/firebase"
import { searchTrulia, normalizeTruliaListing } from "@/services/trulia-service"
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

  useEffect(() => {
    if (user) {
      handleSync();
    }
  }, [user, activeMarket, activeTab]);

  const handleSync = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const hash = (MONICA_MARKET_HASHES as any)[activeMarket];
      let filters = {};
      let listingType: 'FOR_SALE' | 'SOLD' = 'FOR_SALE';

      if (activeTab === "fsbo") filters = { listingTypes: ["FSBO"] };
      if (activeTab === "foreclosure") filters = { listingTypes: ["FORECLOSURE"] };
      if (activeTab === "reduced") filters = { priceReduced: true };
      if (activeTab === "sold") listingType = 'SOLD';

      const res = await searchTrulia(user.uid, { encodedHash: hash, listingType, filters });
      
      // Since normalizeTruliaListing is now a Server Action (async), we must Promise.all the results
      const normalized = await Promise.all((res?.data || []).map((raw: any) => normalizeTruliaListing(raw)));
      
      setListings(normalized);
    } catch (err) {
      toast({ variant: "destructive", title: "Sync Failed", description: "Could not fetch Trulia data." });
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
      name: "Trulia Prospect",
      propertyAddress: listing.address,
      icpScore: icp,
      archagent_source: "trulia_intel",
      archagent_tags: ["trulia", listing.is_fsbo ? "fsbo" : "", listing.is_foreclosure ? "foreclosure" : ""].filter(Boolean),
      pipeline_stage: "new_lead",
      motivation: listing.is_fsbo ? "FSBO listing detected on Trulia" : "Active listing monitoring",
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
            <h1 className="text-xl font-bold font-headline text-primary">MLS Intelligence</h1>
            <div className="ml-auto flex gap-2">
              <select 
                className="h-9 rounded-md border border-input px-3 text-sm bg-white"
                value={activeMarket}
                onChange={(e) => setActiveMarket(e.target.value)}
              >
                <option value="las_vegas">Las Vegas, NV</option>
                <option value="henderson">Henderson, NV</option>
              </select>
              <Button size="sm" variant="outline" onClick={handleSync} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Sync Trulia
              </Button>
            </div>
          </header>
          
          <main className="p-8 max-w-7xl mx-auto w-full space-y-8">
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
                  <p className="text-xs text-white/70 mt-1">Tracked listings in {activeMarket.replace('_', ' ')}</p>
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
                    Hot Motivation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black text-primary">{listings.filter(l => l.is_fsbo || l.is_foreclosure).length}</div>
                  <p className="text-xs text-muted-foreground mt-1">FSBO & Foreclosure detected</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="bg-slate-100 p-1 rounded-xl w-full justify-start h-auto">
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
                        <TableHead className="font-bold">Type/Status</TableHead>
                        <TableHead className="text-right font-bold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">Fetching live Trulia data...</TableCell>
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
                              <div className="flex flex-wrap gap-1">
                                {listing.is_fsbo && <Badge className="bg-orange-500">FSBO</Badge>}
                                {listing.is_foreclosure && <Badge className="bg-red-600"><ShieldAlert className="h-3 w-3 mr-1" /> REO</Badge>}
                                <Badge variant="outline" className="capitalize">{listing.status.replace('_', ' ')}</Badge>
                              </div>
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
                          <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">No matching listings found in this market segment.</TableCell>
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
