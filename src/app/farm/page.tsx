"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Map as MapIcon, 
  Search, 
  MousePointer2, 
  Square, 
  Circle, 
  Download, 
  Layers,
  Sparkles,
  Home,
  Users,
  Info,
  TrendingUp,
  MapPin,
  RefreshCw,
  Plus
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { GoogleMap, useJsApiLoader, DrawingManager, Polygon, InfoWindow } from "@react-google-maps/api"
import { searchProperties, fetchParcelAtPoint, pullZoneParcels, calculateICPScore, ClarkParcel } from "@/lib/clark-county"
import { useUser, useFirestore, addDocumentNonBlocking } from "@/firebase"
import { collection } from "firebase/firestore"

const center = {
  lat: 36.1699,
  lng: -115.1398
};

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

export default function FarmZonePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [drawingMode, setDrawingMode] = useState<google.maps.drawing.OverlayType | null>(null);
  const [selectedParcel, setSelectedParcel] = useState<any>(null);
  const [searchResults, setSearchProperties] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [pulledParcels, setPulledParcels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [maxContacts, setMaxContacts] = useState([100]);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ['drawing', 'geometry', 'places']
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const onMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    setLoading(true);
    try {
      const feature = await fetchParcelAtPoint(e.latLng.lat(), e.latLng.lng());
      setSelectedParcel(feature);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (val.length > 2) {
      const results = await searchProperties(val);
      setSearchProperties(results);
    } else {
      setSearchProperties([]);
    }
  };

  const handleSelectProperty = (property: any) => {
    setSearchProperties([]);
    setSearchQuery("");
    setSelectedParcel(property);
    if (map && property.geometry) {
      // Find center of geometry
      // For simplicity, we just assume it's a point or has a center
      map.panTo({ lat: property.geometry.y || 36.1699, lng: property.geometry.x || -115.1398 });
      map.setZoom(18);
    }
  };

  const onOverlayComplete = async (e: any) => {
    setDrawingMode(null);
    setLoading(true);
    let results = [];
    
    if (e.type === 'circle') {
      const radius = e.overlay.getRadius();
      const center = e.overlay.getCenter();
      // Approx circle with polygon
      results = await pullZoneParcels({
        spatialRel: 'esriSpatialRelIntersects',
        geometryType: 'esriGeometryEnvelope', // Simplified for demo
        geometry: e.overlay.getBounds().toJSON()
      });
    } else if (e.type === 'polygon') {
      const path = e.overlay.getPath().getArray().map((p: any) => [p.lng(), p.lat()]);
      results = await pullZoneParcels({
        rings: [path],
        spatialReference: { wkid: 4326 }
      });
    }
    
    setPulledParcels(results);
    setLoading(false);
    toast({
      title: "Zone Pull Complete",
      description: `Found ${results.length} residential properties in this area.`
    });
  };

  const handleAddLead = (attributes: ClarkParcel) => {
    if (!user || !firestore) return;
    
    const contactsRef = collection(firestore, 'users', user.uid, 'contacts');
    const icpScore = calculateICPScore(attributes);
    
    addDocumentNonBlocking(contactsRef, {
      name: attributes.OWNER_NAME,
      propertyAddress: attributes.SITUS_ADDR,
      email: "",
      phone: "",
      archagent_source: "farm_zone_manual_click",
      archagent_tags: [
        "gis_import",
        attributes.OWNER_STATE !== 'NV' ? "absentee_owner" : "",
        (new Date().getFullYear() - new Date(attributes.SALE_DATE).getFullYear() >= 10) ? "long_term_owner" : ""
      ].filter(Boolean),
      icpScore,
      pipeline_stage: "new_lead",
      motivation: "Imported from GIS Farm Zone",
      property_type: "single_family",
      estimated_commission: (attributes.TOTAL_AV || 0) * 0.03,
      ownerId: user.uid,
      created_at: new Date().toISOString()
    });

    toast({
      title: "Lead Added",
      description: `${attributes.OWNER_NAME} has been added to your Prospector.`
    });
  };

  if (!mounted) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-xl font-bold font-headline text-primary">Farm Zone Prospector</h1>
            
            <div className="ml-auto w-96 relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search address, owner, or APN..." 
                  className="pl-10 h-10 shadow-sm"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              {searchResults.length > 0 && (
                <Card className="absolute top-12 left-0 w-full z-50 shadow-xl border-none">
                  <div className="p-2 space-y-1">
                    {searchResults.map((p: any) => (
                      <div 
                        key={p.attributes.APN} 
                        className="p-3 hover:bg-slate-50 cursor-pointer rounded-lg transition-colors border-b last:border-0"
                        onClick={() => handleSelectProperty(p)}
                      >
                        <p className="text-sm font-bold text-primary">{p.attributes.SITUS_ADDR}</p>
                        <p className="text-[10px] text-muted-foreground">{p.attributes.OWNER_NAME} • ${p.attributes.TOTAL_AV?.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </header>
          
          <main className="flex h-[calc(100vh-64px)] overflow-hidden">
            <div className="flex-1 relative bg-slate-100">
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={center}
                  zoom={12}
                  onLoad={setMap}
                  onClick={onMapClick}
                  options={{
                    disableDefaultUI: true,
                    zoomControl: true,
                    styles: [
                      {
                        featureType: "poi",
                        elementType: "labels",
                        stylers: [{ visibility: "off" }]
                      }
                    ]
                  }}
                >
                  <DrawingManager
                    drawingMode={drawingMode}
                    onOverlayComplete={onOverlayComplete}
                    options={{
                      drawingControl: false,
                      circleOptions: {
                        fillColor: '#D4AF37',
                        fillOpacity: 0.2,
                        strokeWeight: 2,
                        clickable: false,
                        editable: true,
                        zIndex: 1
                      },
                      polygonOptions: {
                        fillColor: '#D4AF37',
                        fillOpacity: 0.2,
                        strokeWeight: 2,
                        clickable: false,
                        editable: true,
                        zIndex: 1
                      }
                    }}
                  />

                  {selectedParcel && (
                    <InfoWindow
                      position={selectedParcel.geometry ? { lat: selectedParcel.geometry.y, lng: selectedParcel.geometry.x } : undefined}
                      onCloseClick={() => setSelectedParcel(null)}
                    >
                      <div className="p-2 max-w-xs space-y-3">
                        <div className="space-y-1">
                          <h4 className="font-bold text-primary">{selectedParcel.attributes.SITUS_ADDR}</h4>
                          <p className="text-xs text-muted-foreground">Owner: {selectedParcel.attributes.OWNER_NAME}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="p-2 bg-slate-50 rounded">
                            <span className="text-muted-foreground block uppercase">Assessed</span>
                            <span className="font-bold">${selectedParcel.attributes.TOTAL_AV?.toLocaleString()}</span>
                          </div>
                          <div className="p-2 bg-slate-50 rounded">
                            <span className="text-muted-foreground block uppercase">Built</span>
                            <span className="font-bold">{selectedParcel.attributes.YEAR_BUILT}</span>
                          </div>
                        </div>
                        {selectedParcel.attributes.OWNER_STATE !== 'NV' && (
                          <Badge className="bg-blue-50 text-blue-700 border-blue-100 w-full justify-center">
                            OUT OF STATE OWNER
                          </Badge>
                        )}
                        <Button 
                          size="sm" 
                          className="w-full gap-2" 
                          onClick={() => handleAddLead(selectedParcel.attributes)}
                        >
                          <Plus className="h-3 w-3" /> Add to Prospector
                        </Button>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}

              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <Card className="shadow-md border-none p-1">
                  <div className="flex flex-col gap-1">
                    <Button 
                      variant={drawingMode === google.maps.drawing.OverlayType.CIRCLE ? 'default' : 'ghost'} 
                      size="icon" 
                      onClick={() => setDrawingMode(google.maps.drawing.OverlayType.CIRCLE)}
                    >
                      <Circle className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant={drawingMode === google.maps.drawing.OverlayType.POLYGON ? 'default' : 'ghost'} 
                      size="icon" 
                      onClick={() => setDrawingMode(google.maps.drawing.OverlayType.POLYGON)}
                    >
                      <Square className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDrawingMode(null)}>
                      <MousePointer2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              </div>
            </div>

            <aside className="w-96 border-l bg-white flex flex-col shadow-xl z-20">
              <Tabs defaultValue="zone" className="flex-1 flex flex-col">
                <div className="p-4 border-b">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="zone">Zone Details</TabsTrigger>
                    <TabsTrigger value="lookup">Owner Lookup</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="zone" className="flex-1 overflow-y-auto p-6 space-y-8">
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                      <MapIcon className="h-5 w-5 text-accent" />
                      Farm Parameters
                    </h2>
                    <p className="text-xs text-muted-foreground">Filters for Clark County GIS pull.</p>
                  </div>

                  <div className="space-y-4">
                    {[
                      'Absentee Owners',
                      'Long-term (10+ years)',
                      'High Equity (LTV < 50%)',
                      'Empty Nesters'
                    ].map((filter) => (
                      <div key={filter} className="flex items-center justify-between p-3 rounded-lg border bg-slate-50/50">
                        <Label className="text-sm cursor-pointer">{filter}</Label>
                        <Plus className="h-4 w-4 text-slate-300" />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Max Leads</h3>
                      <Badge variant="secondary">{maxContacts} Contacts</Badge>
                    </div>
                    <Slider 
                      value={maxContacts} 
                      onValueChange={setMaxContacts} 
                      max={500} 
                      step={50} 
                      min={50}
                    />
                  </div>

                  {pulledParcels.length > 0 && (
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-primary font-bold">
                            <Users className="h-4 w-4" />
                            Results
                          </div>
                          <Badge className="bg-accent">{pulledParcels.length}</Badge>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {pulledParcels.slice(0, 5).map((p: any) => (
                            <div key={p.attributes.APN} className="text-[10px] p-2 bg-white rounded border flex justify-between items-center">
                              <span className="font-medium truncate pr-2">{p.attributes.SITUS_ADDR}</span>
                              <Badge variant="outline" className="h-4 px-1">{calculateICPScore(p.attributes)}</Badge>
                            </div>
                          ))}
                          {pulledParcels.length > 5 && (
                            <p className="text-[10px] text-center text-muted-foreground italic">And {pulledParcels.length - 5} more...</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="pt-4">
                    <Button 
                      className="w-full gap-2 py-6 text-lg font-bold" 
                      disabled={loading || pulledParcels.length === 0}
                      onClick={() => {
                        pulledParcels.forEach(p => handleAddLead(p.attributes));
                        setPulledParcels([]);
                      }}
                    >
                      {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                      Pull Leads to CRM
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="lookup" className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label>Detailed Parcel Lookup</Label>
                      <Input placeholder="Enter APN (e.g. 138-24-810-017)" />
                      <Button variant="outline" className="w-full">Lookup Parcel</Button>
                    </div>
                    
                    <div className="text-center py-20 border-2 border-dashed rounded-xl opacity-50">
                      <Info className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-xs">Search for a property to see full purchase history and equity analysis.</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </aside>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}