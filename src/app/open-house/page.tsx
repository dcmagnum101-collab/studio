
"use client"

import React, { useState, useEffect } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Home, 
  Plus, 
  QrCode, 
  Users, 
  TrendingUp, 
  Calendar as CalendarIcon,
  ExternalLink,
  ChevronRight,
  Copy,
  CheckCircle2,
  RefreshCw
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, doc, setDoc } from "firebase/firestore"

export default function OpenHousePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [newAddress, setNewAddress] = useState("");
  const [newDate, setNewDate] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    setMounted(true)
  }, [])

  // Use top-level collection for public access
  const ohQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'openHouses'), orderBy('date', 'desc'));
  }, [firestore, user]);

  const { data: openHouses, isLoading } = useCollection(ohQuery);

  const handleCreateOpenHouse = async () => {
    if (!firestore || !user || !newAddress || !newDate) return;
    
    setIsCreating(true);
    try {
      const ohRef = doc(collection(firestore, 'openHouses'));
      await setDoc(ohRef, {
        id: ohRef.id,
        address: newAddress,
        date: newDate,
        signin_count: 0,
        seller_count: 0,
        status: 'upcoming',
        ownerId: user.uid,
        created_at: new Date().toISOString()
      });

      toast({
        title: "Open House Created",
        description: "Public sign-in page and QR code are ready."
      });
      
      setNewAddress("");
      setNewDate("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Creation Failed", description: err.message });
    } finally {
      setIsCreating(false);
    }
  };

  const copyUrl = (id: string) => {
    const url = `${window.location.origin}/oh/${id}`;
    navigator.clipboard.writeText(url);
    toast({ title: "URL Copied", description: "Sign-in link copied to clipboard." });
  };

  if (!mounted) return null

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-xl font-bold font-headline text-primary">Open House Hub</h1>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="ml-auto gap-2 bg-accent hover:bg-accent/90 h-9 font-bold px-4 rounded-xl shadow-md">
                  <Plus className="h-4 w-4" /> New Event
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black text-primary">Create Event</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="address">Property Address</Label>
                    <Input id="address" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="123 Example St, Las Vegas" className="h-11 rounded-xl" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} type="date" className="h-11 rounded-xl" />
                  </div>
                  <Button onClick={handleCreateOpenHouse} disabled={isCreating} className="h-12 rounded-xl bg-primary text-lg font-bold">
                    {isCreating ? <RefreshCw className="h-5 w-5 animate-spin mr-2" /> : <QrCode className="h-5 w-5 mr-2" />}
                    Generate Digital Sign-in
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </header>
          
          <main className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
            <div className="grid gap-4 md:gap-6 md:grid-cols-3">
              <Card className="border-none shadow-md bg-primary text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 opacity-70">
                    <Users className="h-4 w-4" />
                    Total Sign-ins
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black">{(openHouses || []).reduce((acc, oh) => acc + (oh.signin_count || 0), 0)}</div>
                  <p className="text-[10px] text-white/50 mt-1 uppercase font-bold tracking-tighter">From {openHouses?.length || 0} Events</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md bg-accent text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 opacity-70">
                    <TrendingUp className="h-4 w-4" />
                    Seller Prospects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black">{(openHouses || []).reduce((acc, oh) => acc + (oh.seller_count || 0), 0)}</div>
                  <p className="text-[10px] text-white/50 mt-1 uppercase font-bold tracking-tighter">High Intent Leads</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md bg-white border border-slate-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-400">
                    <Home className="h-4 w-4 text-accent" />
                    Active Hubs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-primary">{(openHouses || []).filter(oh => oh.status === 'upcoming').length}</div>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">Scheduled Events</p>
                </CardContent>
              </Card>
            </div>

            <section className="space-y-6">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-accent" />
                <h2 className="text-lg font-black text-primary uppercase tracking-widest">Digital Hubs</h2>
              </div>
              
              <div className="grid gap-4">
                {isLoading ? (
                  <div className="text-center py-20"><RefreshCw className="h-8 w-8 animate-spin mx-auto text-slate-200" /></div>
                ) : openHouses && openHouses.length > 0 ? (
                  openHouses.map((oh) => (
                    <Card key={oh.id} className="border-none shadow-sm hover:shadow-xl transition-all overflow-hidden group rounded-2xl border border-slate-50">
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row items-center">
                          <div className="p-6 flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              <h3 className="font-black text-primary text-lg">{oh.address}</h3>
                              <Badge variant={oh.status === 'upcoming' ? 'default' : 'secondary'} className="capitalize text-[10px] font-black h-5">
                                {oh.status}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                              <span className="flex items-center gap-1.5"><CalendarIcon className="h-3.5 w-3.5 text-accent" /> {oh.date}</span>
                              <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-primary" /> {oh.signin_count || 0} Visitors</span>
                              <span className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-green-500" /> {oh.seller_count || 0} Sellers</span>
                            </div>
                          </div>
                          <div className="p-4 bg-slate-50/50 flex gap-2 w-full md:w-auto md:border-l md:px-6">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 md:flex-none h-10 rounded-xl gap-2 font-bold bg-white"
                              onClick={() => copyUrl(oh.id)}
                            >
                              <Copy className="h-4 w-4" /> Link
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="flex-1 md:flex-none h-10 rounded-xl gap-2 font-bold bg-white">
                                  <QrCode className="h-4 w-4" /> QR Code
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-xs text-center p-8 rounded-[2rem]">
                                <DialogTitle className="mb-4 text-xl font-black">Scan to Sign In</DialogTitle>
                                <div className="bg-white p-4 rounded-3xl shadow-inner border-8 border-slate-50 mx-auto">
                                  <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + '/oh/' + oh.id)}`} 
                                    alt="QR Code" 
                                    className="w-full h-full"
                                  />
                                </div>
                                <p className="mt-6 text-xs text-slate-500 font-medium">Point your camera to open the digital sign-in form.</p>
                              </DialogContent>
                            </Dialog>
                            <Button asChild size="sm" className="flex-1 md:flex-none h-10 rounded-xl gap-2 font-black shadow-lg shadow-primary/10">
                              <a href={`/oh/${oh.id}`} target="_blank">
                                Open Hub <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-24 border-2 border-dashed rounded-[2.5rem] bg-slate-50/50">
                    <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
                      <CalendarIcon className="h-10 w-10 text-slate-200" />
                    </div>
                    <h3 className="text-xl font-black text-primary">No active hubs</h3>
                    <p className="text-slate-400 text-sm max-w-xs mx-auto mt-2">Create your first digital sign-in page for your next listing event.</p>
                  </div>
                )}
              </div>
            </section>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
