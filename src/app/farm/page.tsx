"use client"

import React, { useState, useEffect, useCallback } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Card, CardContent } from "@/components/ui/card"
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
  Circle as CircleIcon, 
  Download, 
  Users, 
  RefreshCw,
  Plus,
  Zap,
  MapPin
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { GoogleMap, useJsApiLoader, DrawingManager, InfoWindow } from "@react-google-maps/api"
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
  const [drawingMode, setDrawingMode] = useState<string | null>(null);
  const [selectedParcel, setSelectedParcel] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [pulledParcels, setPulledParcels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [maxContacts, setMaxContacts] = useState([100]);
  const [zoom, setZoom] = useState(12);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyAKHt2xQfi9XvjwpVu9_nC-yiTXYMqmefE",
    libraries: ['drawing', 'geometry', 'places']
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const onMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng || drawingMode) return;
    setLoading(true);
    try {
      const feature = await fetchParcelAtPoint(e.latLng.lat(), e.latLng.lng());
      if (feature) {
        setSelectedParcel(feature);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [drawingMode]);

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (val.length > 2) {
      const results = await searchProperties(val);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectProperty = (property: any) => {
    setSearchResults([]);
    setSearchQuery("");
    setSelectedParcel(property);
    if (map && property.geometry) {
      const pos = property.geometry.y ? { lat: property.geometry.y, lng: property.geometry.x } : 
                  (property.geometry.rings ? { lat: property.geometry.rings[0][0][1], lng: property.geometry.rings[0][0][0] } : center);
      map.panTo(pos);
      map.setZoom(18);
    }
  };

  const onOverlayComplete = async (e: any) => {
    setDrawingMode(null);
    setLoading(true);
    let results = [];
    
    try {
      if (e.type === 'circle') {
        const bounds = e.overlay.getBounds();
        results = await pullZoneParcels({
          xmin: bounds.getSouthWest().lng(),
          ymin: bounds.getSouthWest().lat(),
          xmax: bounds.getNorthEast().lng(),
          ymax: bounds.getNorthEast().lat(),
          spatialReference: { wkid: 4326 }
        }, 'esriGeometryEnvelope');
      } else if (e.type === 'polygon') {
        const path = e.overlay.getPath().getArray().map((p: any) => [p.lng(), p.lat()]);
        results = await pullZoneParcels({
          rings: [path],
          spatialReference: { wkid: 4326 }
        });
      }
      
      setPulledParcels(results);
      toast({
        title: "Zone Pull Complete",
        description: `Found ${results.length} residential properties in this area.`
      });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "API Error", description: "Could not pull zone data." });
    } finally {
      setLoading(false);
      e.overlay.setMap(null);
    }
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
      archagent_source: "gis_import",
      archagent_tags: [
        "farm_zone",
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

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-screen p-8 text-center flex-col gap-4">
        <h2 className="text-xl font-bold text-destructive">Google Maps API Error</h2>
        <p className="text-muted-foreground max-w-md">The map service could not be loaded. Please ensure the "Maps JavaScript API" is enabled in your Google Cloud Console for the provided API key.</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

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
                  zoom={zoom}
                  onLoad={setMap}
                  onClick={onMapClick}
                  onZoomChanged={() => map && setZoom(map.getZoom()!)}
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
                    drawingMode={drawingMode as any}
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
                      position={selectedParcel.geometry?.y ? { lat: selectedParcel.geometry.y, lng: selectedParcel.geometry.x } : undefined}
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
                          className="w-full gap-2 bg-primary" 
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
                      variant={drawingMode === 'circle' ? 'default' : 'ghost'} 
                      size="icon" 
                      onClick={() => setDrawingMode(drawingMode === 'circle' ? null : 'circle')}
                    >
                      <CircleIcon className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant={drawingMode === 'polygon' ? 'default' : 'ghost'} 
                      size="icon" 
                      onClick={() => setDrawingMode(drawingMode === 'polygon' ? null : 'polygon')}
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
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="zone">Zone Details</TabsTrigger>
                    <TabsTrigger value="lookup">Owner Lookup</TabsTrigger>
                    <TabsTrigger value="blast">Sold Blast</TabsTrigger>
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
                          {pulledParcels.slice(0, 10).map((p: any) => (
                            <div key={p.attributes.APN} className="text-[10px] p-2 bg-white rounded border flex justify-between items-center">
                              <span className="font-medium truncate pr-2">{p.attributes.SITUS_ADDR}</span>
                              <Badge variant="outline" className="h-4 px-1">{calculateICPScore(p.attributes)}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="pt-4">
                    <Button 
                      className="w-full gap-2 py-6 text-lg font-bold bg-primary shadow-lg" 
                      disabled={loading || pulledParcels.length === 0}
                      onClick={() => {
                        pulledParcels.forEach(p => handleAddLead(p.attributes));
                        setPulledParcels([]);
                        toast({ title: "Import Successful", description: "Leads added to CRM." });
                      }}
                    >
                      {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                      Pull Leads to CRM
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="lookup" className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Search by APN or Address</Label>
                      <Input placeholder="Enter APN (e.g. 138-24-810-017)" />
                      <Button variant="outline" className="w-full">Lookup Parcel</Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="blast" className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                      <Zap className="h-5 w-5 text-accent" />
                      Just Sold Blast
                    </h2>
                    <p className="text-xs text-muted-foreground">Target neighbors of a recent high-value sale.</p>
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
