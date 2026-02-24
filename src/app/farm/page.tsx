"use client"
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, useRef } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Map as MapIcon,
  Search,
  Plus,
  RefreshCw,
  Download,
  MousePointer2,
  Circle as CircleIcon,
  Trash2,
  MapPin,
  Home,
  User,
  DollarSign,
  Sparkles,
  ExternalLink,
  Copy,
  ChevronRight,
  Flame,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Layers,
  History,
  AlertCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { GoogleMap, useJsApiLoader, DrawingManager, Circle, InfoWindow } from "@react-google-maps/api"
import { pullZoneParcels, calculateICPScore, ClarkParcel, fetchAssessorDetail } from "@/lib/clark-county"
import { MLSListing } from "@/services/lvr-mls-service"
import { normalizeAddress } from "@/utils/address-utils"
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc, setDoc } from "firebase/firestore"
import { grokJSON } from "@/services/grok-service"
import { FEATURES } from "@/lib/feature-flags"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const center = {
  lat: 36.1699,
  lng: -115.1398
};

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const LIBRARIES: ("drawing" | "geometry" | "places")[] = ["drawing", "geometry", "places"];

const MAPS_PLACEHOLDER = 'AIzaSyAKHt2xQfi9XvjwpVu9_nC-yiTXYMqmefE';

export default function FarmZonePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [drawingMode, setDrawingMode] = useState<string | null>(null);
  const [parcels, setParcels] = useState<any[]>([]);
  const [mlsLookup, setMlsLookup] = useState<Map<string, MLSListing>>(new Map());
  const [selectedParcel, setSelectedParcel] = useState<any>(null);
  const [intelligence, setIntelligence] = useState<any>(null);
  const [loadingIntel, setLoadingIntel] = useState(false);
  const [loadingParcels, setLoadingParcels] = useState(false);
  const [zoneBounds, setZoneBounds] = useState<any>(null);
  const [newZoneName, setNewZoneName] = useState("");

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "",
    libraries: LIBRARIES
  });

  const zonesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, "users", user.uid, "farmZones"), orderBy("createdAt", "desc"));
  }, [user, firestore]);
  const { data: savedZones } = useCollection(zonesQuery);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getPinColor = (parcel: any, mlsMatch?: MLSListing): string => {
    if (mlsMatch) return mlsMatch.pinColor;
    if (parcel.OWNER_STATE && parcel.OWNER_STATE !== 'NV') return '#000000'; // Black - OOS
    return '#6B7280'; // Gray - Available
  };

  const handleCircleComplete = async (circle: google.maps.Circle) => {
    const center = circle.getCenter();
    const radius = circle.getRadius();
    if (!center || !user) return;

    setDrawingMode(null);
    setLoadingParcels(true);
    setParcels([]);

    try {
      const bounds = circle.getBounds();
      if (!bounds) return;

      const envelope = {
        xmin: bounds.getSouthWest().lng(),
        ymin: bounds.getSouthWest().lat(),
        xmax: bounds.getNorthEast().lng(),
        ymax: bounds.getNorthEast().lat(),
        spatialReference: { wkid: 4326 }
      };

      // Parallel Data Pull: GIS + MLS
      const [gisResults, sparkResults] = await Promise.all([
        pullZoneParcels(envelope, 'esriGeometryEnvelope'),
        fetch('/api/spark-proxy', {
          method: 'POST',
          body: JSON.stringify({ 
            action: 'listings_in_radius', 
            params: { userId: user.uid, lat: center.lat(), lng: center.lng(), radius } 
          })
        }).then(res => res.json()).catch(() => [])
      ]);

      const lookup = new Map<string, MLSListing>();
      (sparkResults as MLSListing[]).forEach(l => lookup.set(normalizeAddress(l.address), l));
      setMlsLookup(lookup);

      // Sort logic
      const sorted = gisResults.map((p: any) => ({
        ...p,
        mlsMatch: lookup.get(normalizeAddress(p.SITUS_ADDR)),
        icpScore: calculateICPScore(p)
      })).sort((a: any, b: any) => {
        // FSBO Priority
        if (a.mlsMatch?.pinLabel === 'FSBO' && b.mlsMatch?.pinLabel !== 'FSBO') return -1;
        if (b.mlsMatch?.pinLabel === 'FSBO' && a.mlsMatch?.pinLabel !== 'FSBO') return 1;
        // FRBO Priority
        if (a.mlsMatch?.pinLabel === 'FRBO' && b.mlsMatch?.pinLabel !== 'FRBO') return -1;
        if (b.mlsMatch?.pinLabel === 'FRBO' && a.mlsMatch?.pinLabel !== 'FRBO') return 1;
        // Listed by agent (RED) - Lowest Priority
        if (a.mlsMatch?.pinLabel === 'Listed' && b.mlsMatch?.pinLabel !== 'Listed') return 1;
        if (b.mlsMatch?.pinLabel === 'Listed' && a.mlsMatch?.pinLabel !== 'Listed') return -1;
        // High ICP Fallback
        return b.icpScore - a.icpScore;
      });

      setParcels(sorted);
      setZoneBounds({ lat: center.lat(), lng: center.lng(), radius });

      toast({
        title: "Zone Synchronized",
        description: `Found ${sorted.length} parcels and ${sparkResults.length} MLS signals.`
      });
    } catch (err) {
      toast({ variant: "destructive", title: "Sync Failed", description: "Could not pull data from Clark County or LVR MLS." });
    } finally {
      setLoadingParcels(false);
    }
  };

  const handleParcelClick = async (parcel: any) => {
    setSelectedParcel(parcel);
    setLoadingIntel(true);
    setIntelligence(null);

    try {
      const mlsMatch = mlsLookup.get(normalizeAddress(parcel.SITUS_ADDR));
      
      const [assessor, sparkDetail, aiValuation] = await Promise.all([
        fetchAssessorDetail(parcel.APN),
        mlsMatch ? fetch('/api/spark-proxy', {
          method: 'POST',
          body: JSON.stringify({ action: 'listing_detail', params: { listingKey: mlsMatch.listingKey } })
        }).then(res => res.json()) : fetch('/api/spark-proxy', {
          method: 'POST',
          body: JSON.stringify({ action: 'listing_by_address', params: { address: parcel.SITUS_ADDR } })
        }).then(res => res.json()),
        grokJSON(
          "You are a Nevada real estate appraiser. Generate a valuation estimate based on assessor and MLS data. Return JSON ONLY.",
          `Property: ${parcel.SITUS_ADDR}, ${parcel.BEDROOMS}bd/${parcel.BATHROOMS}ba, ${parcel.SQFT}sqft. Assessed: $${parcel.TOTAL_AV}. Last sale: $${parcel.SALE_PRICE}. Las Vegas market 2026. Return JSON: { estimatedValue: number, lowRange: number, highRange: number, pricePerSqft: number, confidence: 'high'|'medium'|'low', reasoning: string }`,
          user!.uid
        )
      ]);

      setIntelligence({
        assessor,
        mls: sparkDetail || mlsMatch,
        valuation: aiValuation
      });
    } catch (err) {
      toast({ variant: "destructive", title: "Analysis Interrupted", description: "Monica could not reach all intelligence nodes." });
    } finally {
      setLoadingIntel(false);
    }
  };

  const handleSaveZone = async () => {
    if (!user || !newZoneName || !zoneBounds) return;
    try {
      const zoneRef = doc(collection(firestore, "users", user.uid, "farmZones"));
      await setDoc(zoneRef, {
        id: zoneRef.id,
        name: newZoneName,
        centerLat: zoneBounds.lat,
        centerLng: zoneBounds.lng,
        radiusMeters: zoneBounds.radius,
        parcelCount: parcels.length,
        createdAt: serverTimestamp(),
        lastPulledAt: serverTimestamp()
      });
      toast({ title: "Zone Saved", description: `"${newZoneName}" added to library.` });
      setNewZoneName("");
    } catch (err) {
      toast({ variant: "destructive", title: "Save Failed", description: "Could not persist farm zone." });
    }
  };

  if (!mounted) return null;

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY === MAPS_PLACEHOLDER) {
    return (
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <SidebarInset className="flex flex-col items-center justify-center p-8 bg-slate-50">
            <div className="max-w-md text-center space-y-6">
              <div className="h-20 w-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-sm">
                <AlertTriangle className="h-10 w-10 text-amber-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-primary">Map Engine Offline</h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                  The Google Maps API key is missing or invalid. Monica needs this key to visualize parcel intelligence and farm zones.
                </p>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-slate-200 text-left space-y-3">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Technical Solution</p>
                <p className="text-xs text-slate-600">Update the <strong>NEXT_PUBLIC_GOOGLE_MAPS_KEY</strong> in your <code>apphosting.yaml</code> file or Firebase Console secrets.</p>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />
        <SidebarInset className="flex flex-col h-full overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-white shadow-sm sticky top-0 z-30">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-xl font-bold font-headline text-primary flex items-center gap-2">
              <MapIcon className="h-5 w-5 text-accent" />
              Farm Zone Map
            </h1>
            
            <div className="ml-auto flex items-center gap-2">
              <Button 
                variant={drawingMode === 'circle' ? 'default' : 'outline'} 
                onClick={() => setDrawingMode(drawingMode === 'circle' ? null : 'circle')}
                className="gap-2 font-bold"
              >
                <CircleIcon className="h-4 w-4" /> Draw Radius
              </Button>
              <Button variant="ghost" onClick={() => { setParcels([]); setZoneBounds(null); }} className="text-slate-400 font-bold">
                <Trash2 className="h-4 w-4 mr-2" /> Clear
              </Button>
            </div>
          </header>

          <main className="flex-1 flex overflow-hidden relative">
            <aside className="w-80 border-r bg-white flex flex-col shadow-xl z-20 relative overflow-hidden hidden md:flex">
              <div className="p-4 border-b bg-slate-50/50">
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Motivation Signals</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { color: '#DC2626', label: 'Listed (Agent)' },
                    { color: '#EAB308', label: 'Pending' },
                    { color: '#16A34A', label: 'Available' },
                    { color: '#2563EB', label: 'FSBO' },
                    { color: '#7C3AED', label: 'FRBO' },
                    { color: '#000000', label: 'Out of State' }
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>

              {parcels.length > 0 && (
                <div className="p-4 border-b bg-white flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Results</p>
                    <p className="text-lg font-black text-primary">{parcels.length} Parcels</p>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="sm" className="bg-accent text-primary font-black h-8 px-3">Save Zone</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-4 rounded-xl shadow-2xl">
                      <div className="space-y-3">
                        <Label className="text-xs font-bold">Zone Name</Label>
                        <Input value={newZoneName} onChange={e => setNewZoneName(e.target.value)} placeholder="Summerlin West Block..." />
                        <Button onClick={handleSaveZone} className="w-full h-9 bg-primary font-bold">Confirm Save</Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              <ScrollArea className="flex-1">
                {parcels.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {parcels.map(p => (
                      <div 
                        key={p.APN} 
                        className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${selectedParcel?.APN === p.APN ? 'bg-primary/5 border-l-4 border-primary' : ''}`}
                        onClick={() => {
                          handleParcelClick(p);
                          if (map) map.panTo({ lat: p.lat, lng: p.lng });
                        }}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-bold text-slate-900 truncate pr-2">{p.SITUS_ADDR}</span>
                          <Badge variant="outline" className="text-[9px] h-4 font-black">{p.icpScore}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] text-slate-400 font-medium truncate flex-1">{p.OWNER_NAME}</p>
                          {p.mlsMatch && (
                            <Badge className="h-4 text-[8px] font-black uppercase" style={{ backgroundColor: p.mlsMatch.pinColor }}>
                              {p.mlsMatch.pinLabel}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 space-y-6">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Saved Farm Zones</h4>
                    {savedZones?.map(zone => (
                      <Card key={zone.id} className="p-3 cursor-pointer hover:shadow-md transition-all border-slate-100 group" onClick={() => {
                        if (map) { map.panTo({ lat: zone.centerLat, lng: zone.centerLng }); map.setZoom(16); }
                      }}>
                        <p className="text-xs font-black text-primary">{zone.name}</p>
                        <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">{zone.parcelCount} Parcels</p>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </aside>

            <div className="flex-1 relative bg-slate-100">
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={center}
                  zoom={12}
                  onLoad={setMap}
                  options={{ disableDefaultUI: true, zoomControl: true }}
                >
                  <DrawingManager
                    drawingMode={drawingMode as any}
                    onCircleComplete={handleCircleComplete}
                    options={{
                      drawingControl: false,
                      circleOptions: { fillColor: '#1E3A8A', fillOpacity: 0.1, strokeColor: '#A88A2A', strokeWeight: 2, editable: true }
                    }}
                  />

                  {parcels.map(p => (
                    <Circle
                      key={p.APN}
                      center={{ lat: p.lat, lng: p.lng }}
                      radius={10}
                      onClick={() => handleParcelClick(p)}
                      options={{
                        fillColor: getPinColor(p, p.mlsMatch),
                        fillOpacity: 0.9,
                        strokeColor: '#FFFFFF',
                        strokeWeight: 1.5,
                        zIndex: 2
                      }}
                    />
                  ))}
                </GoogleMap>
              ) : <div className="flex items-center justify-center h-full"><RefreshCw className="h-8 w-8 animate-spin text-primary opacity-20" /></div>}

              {loadingParcels && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-40">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-xs font-black uppercase text-primary tracking-widest">Querying GIS & MLS Hubs...</span>
                </div>
              )}
            </div>

            {selectedParcel && (
              <aside className="absolute inset-y-0 right-0 w-full sm:w-[400px] bg-white shadow-[-20px_0_50px_rgba(0,0,0,0.1)] z-40 flex flex-col transition-transform">
                <header className="p-6 bg-primary text-white shrink-0 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10"><MapPin className="h-24 w-24" /></div>
                  <div className="relative z-10 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <Badge className="bg-accent text-primary font-black text-[9px] uppercase px-2 h-5">PROPERTY REPORT</Badge>
                        <h2 className="text-xl font-black font-headline leading-tight">{selectedParcel.SITUS_ADDR}</h2>
                        <p className="text-xs font-bold text-primary-foreground/60">{selectedParcel.SITUS_CITY}, NV</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setSelectedParcel(null)} className="text-white hover:bg-white/10 rounded-full h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </header>

                <ScrollArea className="flex-1 bg-slate-50/30">
                  <div className="p-6 space-y-8">
                    {loadingIntel ? (
                      <div className="space-y-6">
                        <Skeleton className="h-32 w-full rounded-2xl" />
                        <Skeleton className="h-48 w-full rounded-2xl" />
                      </div>
                    ) : (
                      <>
                        {intelligence?.mls && intelligence.mls.pinLabel === 'Listed' && (
                          <div className="bg-red-50 border-2 border-red-200 p-4 rounded-2xl flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                            <p className="text-xs font-bold text-red-900 leading-relaxed">
                              Currently listed with {intelligence.mls.listOfficeName || 'another brokerage'}. Do not contact seller directly.
                            </p>
                          </div>
                        )}

                        <section className="space-y-4">
                          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Home className="h-3 w-3 text-accent" /> Property Identity</h3>
                          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-1">
                            <p className="text-lg font-black text-slate-800">{selectedParcel.BEDROOMS}bd / {selectedParcel.BATHROOMS}ba | {selectedParcel.SQFT.toLocaleString()} sqft</p>
                            <p className="text-xs font-bold text-slate-500">Built {selectedParcel.YEAR_BUILT} • APN: {selectedParcel.APN}</p>
                          </div>
                        </section>

                        <section className="space-y-4">
                          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Sparkles className="h-3 w-3 text-accent" /> AI Valuation</h3>
                          <Card className="border-none shadow-lg bg-slate-900 text-white rounded-2xl">
                            <CardContent className="p-5 space-y-4">
                              <div>
                                <p className="text-[8px] font-black text-accent uppercase tracking-widest">Estimated Value</p>
                                <p className="text-3xl font-black text-accent">${intelligence?.valuation?.estimatedValue.toLocaleString()}</p>
                              </div>
                              <p className="text-xs text-slate-300 italic leading-relaxed">"{intelligence?.valuation?.reasoning}"</p>
                            </CardContent>
                          </Card>
                        </section>

                        <section className="space-y-4">
                          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><ShieldCheck className="h-3 w-3 text-accent" /> MLS Status</h3>
                          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                            {intelligence?.mls ? (
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <Badge style={{ backgroundColor: intelligence.mls.pinColor }} className="font-black uppercase text-[10px]">
                                    {intelligence.mls.standardStatus}
                                  </Badge>
                                  <span className="text-lg font-black text-primary">${intelligence.mls.listPrice?.toLocaleString()}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-bold space-y-1">
                                  <p>DOM: {intelligence.mls.daysOnMarket} Days</p>
                                  <p>Listing: {intelligence.mls.listAgentName} | {intelligence.mls.listOfficeName}</p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-xs text-slate-400 font-bold italic">
                                <Search className="h-3 w-3" /> Not currently listed in MLS
                              </div>
                            )}
                          </div>
                        </section>
                      </>
                    )}
                  </div>
                </ScrollArea>

                <footer className="p-4 bg-white border-t grid grid-cols-2 gap-2">
                  <Button className="bg-primary text-white font-black rounded-xl h-12 gap-2" onClick={() => toast({ title: "Added", description: "Lead saved to CRM." })}>
                    <Plus className="h-4 w-4" /> Add to CRM
                  </Button>
                  <Button variant="outline" className="rounded-xl h-12 font-bold" onClick={() => window.open(`https://www.google.com/maps?q=&layer=c&cbll=${selectedParcel.lat},${selectedParcel.lng}`, '_blank')}>
                    <MapPin className="h-4 w-4 mr-2" /> Street View
                  </Button>
                </footer>
              </aside>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
