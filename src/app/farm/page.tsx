"use client"

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
  History
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { GoogleMap, useJsApiLoader, DrawingManager, Circle, InfoWindow } from "@react-google-maps/api"
import { pullZoneParcels, calculateICPScore, ClarkParcel, fetchAssessorDetail } from "@/lib/clark-county"
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc, setDoc } from "firebase/firestore"
import { searchTrulia, normalizeTruliaListing } from "@/services/trulia-service"
import { grokAsk, grokJSON } from "@/services/grok-service"
import { FEATURES } from "@/lib/feature-flags"
import Link from "next/link"
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

export default function FarmZonePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [drawingMode, setDrawingMode] = useState<string | null>(null);
  const [parcels, setParcels] = useState<any[]>([]);
  const [selectedParcel, setSelectedParcel] = useState<any>(null);
  const [intelligence, setIntelligence] = useState<any>(null);
  const [loadingIntel, setLoadingIntel] = useState(false);
  const [loadingParcels, setLoadingParcels] = useState(false);
  const [zoneBounds, setZoneBounds] = useState<any>(null);
  const [newZoneName, setNewZoneName] = useState("");
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "",
    libraries: LIBRARIES
  });

  // Load Saved Zones
  const zonesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, "users", user.uid, "farmZones"), orderBy("createdAt", "desc"));
  }, [user, firestore]);
  const { data: savedZones } = useCollection(zonesQuery);

  useEffect(() => {
    setMounted(true);
  }, []);

  const clearMarkers = useCallback(() => {
    markers.forEach(m => m.setMap(null));
    setMarkers([]);
  }, [markers]);

  const getPinColor = (parcel: ClarkParcel, mlsStatus?: string, hasListingAgent?: boolean): string => {
    if (mlsStatus === 'FOR_SALE' && hasListingAgent) return '#DC2626'; // Red
    if (mlsStatus === 'PENDING' || mlsStatus === 'UNDER_CONTRACT') return '#EAB308'; // Yellow
    if (mlsStatus === 'FOR_SALE' && !hasListingAgent) return '#2563EB'; // Blue
    if (mlsStatus === 'FOR_RENT') return '#7C3AED'; // Purple
    if (mlsStatus === 'ACTIVE') return '#16A34A'; // Green
    if (parcel.OWNER_STATE && parcel.OWNER_STATE !== 'NV') return '#000000'; // Black
    return '#6B7280'; // Gray
  };

  const handleCircleComplete = async (circle: google.maps.Circle) => {
    const center = circle.getCenter();
    const radius = circle.getRadius();
    if (!center) return;

    setDrawingMode(null);
    setLoadingParcels(true);
    clearMarkers();

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

      const results = await pullZoneParcels(envelope, 'esriGeometryEnvelope');
      setParcels(results.sort((a: any, b: any) => calculateICPScore(b) - calculateICPScore(a)));
      setZoneBounds({ lat: center.lat(), lng: center.lng(), radius });

      toast({
        title: "Parcels Loaded",
        description: `Found ${results.length} residential properties in this area.`
      });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "GIS Error", description: "Could not pull parcels from Clark County." });
    } finally {
      setLoadingParcels(false);
    }
  };

  const handleParcelClick = async (parcel: any) => {
    setSelectedParcel(parcel);
    setLoadingIntel(true);
    setIntelligence(null);

    try {
      const [assessor, mlsRes] = await Promise.all([
        fetchAssessorDetail(parcel.APN),
        searchTrulia(user!.uid, { encodedHash: "", listingType: 'FOR_SALE', filters: { searchQuery: parcel.SITUS_ADDR } }).catch(() => null)
      ]);

      const mlsData = mlsRes?.data?.[0] ? await normalizeTruliaListing(mlsRes.data[0]) : null;

      // AI Valuation via Grok
      const aiValuation = await grokJSON(
        "You are a Nevada real estate appraiser. Generate a property valuation estimate based on assessor data. Return JSON ONLY.",
        `Property: ${parcel.BEDROOMS}bd/${parcel.BATHROOMS}ba, ${parcel.SQFT}sqft, built ${parcel.YEAR_BUILT}, ${parcel.SITUS_ADDR}. Assessed value: $${parcel.TOTAL_AV}. Last sale: $${parcel.SALE_PRICE} in ${parcel.SALE_DATE}. Return JSON: { estimatedValue: number, lowRange: number, highRange: number, pricePerSqft: number, confidence: 'high'|'medium'|'low', reasoning: string }`,
        user!.uid
      );

      setIntelligence({
        assessor,
        mls: mlsData,
        valuation: aiValuation
      });
    } catch (err) {
      console.error("Intelligence fetch failed:", err);
      toast({ variant: "destructive", title: "Analysis Failed", description: "Monica could not synthesize full intelligence for this property." });
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
      toast({ title: "Zone Saved", description: `"${newZoneName}" added to your farm library.` });
      setNewZoneName("");
    } catch (err) {
      toast({ variant: "destructive", title: "Save Failed", description: "Could not persist farm zone." });
    }
  };

  const handleAddLead = () => {
    if (!user || !selectedParcel || !intelligence) return;
    
    const contactsRef = collection(firestore, 'users', user.uid, 'contacts');
    const icpScore = calculateICPScore(selectedParcel);
    
    addDocumentNonBlocking(contactsRef, {
      name: selectedParcel.OWNER_NAME,
      propertyAddress: selectedParcel.SITUS_ADDR,
      email: "",
      phone: "",
      archagent_source: "gis_import",
      archagent_tags: ["farm_zone", selectedParcel.OWNER_STATE !== 'NV' ? "absentee_owner" : ""].filter(Boolean),
      icpScore,
      pipeline_stage: "new_lead",
      motivation: "Imported from GIS Farm Zone",
      estimated_commission: (intelligence.valuation?.estimatedValue || selectedParcel.TOTAL_AV) * 0.03,
      ownerId: user.uid,
      created_at: new Date().toISOString()
    });

    toast({ title: "Lead Added", description: `${selectedParcel.OWNER_NAME} saved to Prospector.` });
  };

  if (!mounted) return null;

  if (loadError) return <div className="p-20 text-center text-red-500">Google Maps Error: Check API Key and activation.</div>;

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />
        <SidebarInset className="flex flex-col h-full overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-white shadow-sm sticky top-0 z-30">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-xl font-bold font-headline text-primary flex items-center gap-2">
              <MapIcon className="h-5 w-5 text-accent" />
              Farm Zone Intelligence
            </h1>
            
            <div className="ml-auto flex items-center gap-2">
              <Button 
                variant={drawingMode === 'circle' ? 'default' : 'outline'} 
                onClick={() => setDrawingMode(drawingMode === 'circle' ? null : 'circle')}
                className="gap-2 font-bold"
              >
                <CircleIcon className="h-4 w-4" /> Draw Radius
              </Button>
              <Button variant="ghost" onClick={() => { setParcels([]); clearMarkers(); setZoneBounds(null); }} className="text-slate-400 font-bold">
                <Trash2 className="h-4 w-4 mr-2" /> Clear
              </Button>
            </div>
          </header>

          <main className="flex-1 flex overflow-hidden relative">
            {/* LEFT PANEL: PARCEL LIST & LEGEND */}
            <aside className="w-80 border-r bg-white flex flex-col shadow-xl z-20 relative overflow-hidden hidden md:flex">
              <div className="p-4 border-b bg-slate-50/50">
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Farm Legend</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { color: '#DC2626', label: 'Listed' },
                    { color: '#EAB308', label: 'Pending' },
                    { color: '#16A34A', label: 'Active' },
                    { color: '#2563EB', label: 'FSBO' },
                    { color: '#7C3AED', label: 'FRBO' },
                    { color: '#000000', label: 'OOS' }
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
                        <Input value={newZoneName} onChange={e => setNewZoneName(e.target.value)} placeholder="Summerlin West Block..." className="h-9" />
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
                          <Badge variant="outline" className="text-[9px] h-4 font-black">{calculateICPScore(p)}</Badge>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium truncate">{p.OWNER_NAME}</p>
                      </div>
                    ))}
                  </div>
                ) : savedZones && savedZones.length > 0 ? (
                  <div className="p-4 space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                      <History className="h-3 w-3" /> Saved Farm Zones
                    </h4>
                    {savedZones.map(zone => (
                      <Card 
                        key={zone.id} 
                        className="p-3 cursor-pointer hover:shadow-md transition-all border-slate-100 group"
                        onClick={() => {
                          if (map) {
                            map.panTo({ lat: zone.centerLat, lng: zone.centerLng });
                            map.setZoom(16);
                          }
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-black text-primary">{zone.name}</p>
                          <ChevronRight className="h-3 w-3 text-slate-300 group-hover:text-primary transition-colors" />
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">{zone.parcelCount} Parcels • {zone.radiusMeters.toFixed(0)}m</p>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center space-y-4 opacity-40">
                    <Layers className="h-10 w-10 mx-auto text-slate-300" />
                    <p className="text-xs font-bold text-slate-400 uppercase leading-relaxed">Draw a radius to begin neighborhood analysis</p>
                  </div>
                )}
              </ScrollArea>
            </aside>

            {/* THE MAP */}
            <div className="flex-1 relative bg-slate-100">
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={center}
                  zoom={12}
                  onLoad={setMap}
                  options={{
                    disableDefaultUI: true,
                    zoomControl: true,
                    styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }]
                  }}
                >
                  <DrawingManager
                    drawingMode={drawingMode as any}
                    onCircleComplete={handleCircleComplete}
                    options={{
                      drawingControl: false,
                      circleOptions: {
                        fillColor: '#1E3A8A',
                        fillOpacity: 0.1,
                        strokeColor: '#A88A2A',
                        strokeWeight: 2,
                        clickable: false,
                        editable: true,
                        zIndex: 1,
                      }
                    }}
                  />

                  {parcels.map(p => (
                    <Circle
                      key={p.APN}
                      center={{ lat: p.lat, lng: p.lng }}
                      radius={10}
                      onClick={() => handleParcelClick(p)}
                      options={{
                        fillColor: getPinColor(p),
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
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white px-6 py-3 rounded-full shadow-2xl border border-slate-100 flex items-center gap-3 z-40">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-xs font-black uppercase text-primary tracking-widest">Querying Clark County GIS...</span>
                </div>
              )}
            </div>

            {/* RIGHT PANEL: PROPERTY INTELLIGENCE CARD */}
            {selectedParcel && (
              <aside 
                className={`absolute inset-y-0 right-0 w-full sm:w-[400px] bg-white shadow-[-20px_0_50px_rgba(0,0,0,0.1)] z-40 transition-transform duration-500 ease-in-out transform ${selectedParcel ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}
              >
                <header className="p-6 bg-primary text-white shrink-0 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10"><MapPin className="h-24 w-24" /></div>
                  <div className="relative z-10 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <Badge className="bg-accent text-primary font-black text-[9px] uppercase tracking-widest px-2 h-5">PROPERTY REPORT</Badge>
                        <h2 className="text-xl font-black font-headline tracking-tighter leading-tight">{selectedParcel.SITUS_ADDR}</h2>
                        <p className="text-xs font-bold text-primary-foreground/60">{selectedParcel.SITUS_CITY}, NV {selectedParcel.SITUS_ZIP}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setSelectedParcel(null)} className="text-white hover:bg-white/10 rounded-full h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedParcel.OWNER_STATE !== 'NV' && <Badge className="bg-orange-500/20 text-orange-200 border-none text-[8px] font-black uppercase">OUT-OF-STATE</Badge>}
                      {intelligence?.assessor && (selectedParcel.TOTAL_AV - selectedParcel.SALE_PRICE) / selectedParcel.TOTAL_AV > 0.8 && <Badge className="bg-accent/30 text-accent-foreground border-none text-[8px] font-black uppercase">FREE & CLEAR</Badge>}
                    </div>
                  </div>
                </header>

                <ScrollArea className="flex-1 bg-slate-50/30">
                  <div className="p-6 space-y-8">
                    {loadingIntel ? (
                      <div className="space-y-6">
                        <Skeleton className="h-32 w-full rounded-2xl" />
                        <Skeleton className="h-48 w-full rounded-2xl" />
                        <Skeleton className="h-32 w-full rounded-2xl" />
                      </div>
                    ) : (
                      <>
                        {/* PROPERTY CORE */}
                        <section className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Home className="h-3 w-3 text-accent" /> Property Identity</h3>
                            <Button variant="ghost" size="sm" className="h-6 text-[9px] font-bold gap-1" onClick={() => navigator.clipboard.writeText(selectedParcel.APN)}>
                              APN: {selectedParcel.APN} <Copy className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-1">
                            <p className="text-lg font-black text-slate-800">{selectedParcel.BEDROOMS}bd / {selectedParcel.BATHROOMS}ba | {selectedParcel.SQFT.toLocaleString()} sqft</p>
                            <p className="text-xs font-bold text-slate-500">Built {selectedParcel.YEAR_BUILT} • Single Family Residential</p>
                          </div>
                        </section>

                        {/* OWNER */}
                        <section className="space-y-4">
                          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><User className="h-3 w-3 text-accent" /> Ownership</h3>
                          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                            <p className="font-black text-primary text-sm uppercase tracking-tight">{selectedParcel.OWNER_NAME}</p>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                              {selectedParcel.OWNER_ADDR}<br />
                              {selectedParcel.OWNER_CITY}, {selectedParcel.OWNER_STATE} {selectedParcel.OWNER_ZIP}
                            </p>
                          </div>
                        </section>

                        {/* FINANCIALS */}
                        <section className="space-y-4">
                          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><DollarSign className="h-3 w-3 text-accent" /> Financial Snapshot</h3>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white p-3 rounded-2xl border border-slate-100 text-center">
                              <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Assessed Value</p>
                              <p className="text-sm font-black text-slate-800">${selectedParcel.TOTAL_AV.toLocaleString()}</p>
                            </div>
                            <div className="bg-white p-3 rounded-2xl border border-slate-100 text-center">
                              <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Estimated Equity</p>
                              <p className="text-sm font-black text-green-600">~{((selectedParcel.TOTAL_AV - selectedParcel.SALE_PRICE) / selectedParcel.TOTAL_AV * 100).toFixed(0)}%</p>
                            </div>
                          </div>
                          <div className="bg-white p-4 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Purchase History</p>
                            <div className="flex justify-between items-end">
                              <div>
                                <p className="text-lg font-black text-slate-800">${selectedParcel.SALE_PRICE?.toLocaleString()}</p>
                                <p className="text-[10px] font-bold text-slate-500">{selectedParcel.SALE_DATE}</p>
                              </div>
                              <Badge variant="secondary" className="bg-blue-50 text-blue-700 h-5 text-[9px] font-black">
                                {new Date().getFullYear() - new Date(selectedParcel.SALE_DATE).getFullYear()} YEAR OWNER
                              </Badge>
                            </div>
                          </div>
                        </section>

                        {/* AI VALUATION */}
                        {intelligence?.valuation && (
                          <section className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Sparkles className="h-3 w-3 text-accent" /> Grok Intelligence</h3>
                            <Card className="border-none shadow-lg bg-gradient-to-br from-primary to-slate-900 text-white rounded-2xl overflow-hidden">
                              <CardContent className="p-5 space-y-4">
                                <div>
                                  <p className="text-[8px] font-black text-accent uppercase tracking-widest">Estimated Market Value</p>
                                  <p className="text-3xl font-black text-accent tracking-tighter">${intelligence.valuation.estimatedValue.toLocaleString()}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                                  <div>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase">Valuation Range</p>
                                    <p className="text-xs font-bold">${intelligence.valuation.lowRange.toLocaleString()} — ${intelligence.valuation.highRange.toLocaleString()}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[8px] font-bold text-slate-400 uppercase">Confidence</p>
                                    <Badge className={`${intelligence.valuation.confidence === 'high' ? 'bg-green-500' : 'bg-yellow-500'} text-[8px] h-4 font-black uppercase`}>{intelligence.valuation.confidence}</Badge>
                                  </div>
                                </div>
                                <p className="text-xs text-slate-300 italic leading-relaxed border-l-2 border-accent pl-3">"{intelligence.valuation.reasoning}"</p>
                              </CardContent>
                            </Card>
                          </section>
                        )}

                        {/* ICP SCORE BREAKDOWN */}
                        <section className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Lead Intensity</h3>
                            <div className="flex items-center gap-1 text-primary font-black">
                              <span className="text-lg">{calculateICPScore(selectedParcel)}</span>
                              <span className="text-[10px] opacity-40">/ 99</span>
                              <Flame className="h-4 w-4 text-orange-500 ml-1 fill-orange-500" />
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedParcel.OWNER_STATE !== 'NV' && <Badge variant="outline" className="text-[8px] font-black text-green-600 border-green-200 bg-green-50">+12 Out-of-state</Badge>}
                            {new Date().getFullYear() - new Date(selectedParcel.SALE_DATE).getFullYear() >= 10 && <Badge variant="outline" className="text-[8px] font-black text-green-600 border-green-200 bg-green-50">+12 Long-term owner</Badge>}
                            {(selectedParcel.TOTAL_AV - selectedParcel.SALE_PRICE) / selectedParcel.TOTAL_AV > 0.5 && <Badge variant="outline" className="text-[8px] font-black text-green-600 border-green-200 bg-green-50">+15 High equity</Badge>}
                            <Badge variant="outline" className="text-[8px] font-black text-green-600 border-green-200 bg-green-50">+5 Residential</Badge>
                          </div>
                        </section>
                      </>
                    )}
                  </div>
                </ScrollArea>

                <footer className="p-4 bg-white border-t grid grid-cols-2 gap-2 shrink-0">
                  <Button onClick={handleAddLead} className="bg-primary text-white font-black rounded-xl h-12 shadow-lg shadow-primary/10 gap-2">
                    <Plus className="h-4 w-4" /> Add to CRM
                  </Button>
                  <Button variant="outline" asChild className="rounded-xl h-12 font-bold border-slate-200">
                    <a href={`https://www.google.com/maps?q=&layer=c&cbll=${selectedParcel.lat},${selectedParcel.lng}`} target="_blank">
                      <MapPin className="h-4 w-4 mr-2 text-primary" /> Street View
                    </a>
                  </Button>
                  <Button variant="secondary" className="rounded-xl h-12 font-bold border-slate-200" onClick={() => navigator.clipboard.writeText(selectedParcel.APN)}>
                    <Copy className="h-4 w-4 mr-2" /> Copy APN
                  </Button>
                  <Button variant="outline" asChild className="rounded-xl h-12 font-bold border-slate-200">
                    <a href={`https://assessor.clarkcountynv.gov/AssessorSelfService/disclaimer.aspx?ParcelNumber=${selectedParcel.APN.replace(/-/g, '')}`} target="_blank">
                      <ExternalLink className="h-4 w-4 mr-2 text-slate-400" /> Records
                    </a>
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
