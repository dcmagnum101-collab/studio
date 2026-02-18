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
  ChevronRight
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"

export default function OpenHousePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [newAddress, setNewAddress] = useState("");
  const [newDate, setNewDate] = useState("");

  useEffect(() => {
    setMounted(true)
  }, [])

  const ohQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'openHouses'), orderBy('date', 'desc'));
  }, [firestore, user]);

  const { data: openHouses, isLoading } = useCollection(ohQuery);

  const handleCreateOpenHouse = () => {
    if (!firestore || !user || !newAddress || !newDate) return;
    
    const ohRef = collection(firestore, 'users', user.uid, 'openHouses');
    addDocumentNonBlocking(ohRef, {
      address: newAddress,
      date: newDate,
      signin_count: 0,
      seller_count: 0,
      status: 'upcoming',
      ownerId: user.uid
    });

    toast({
      title: "Open House Created",
      description: "Sign-in page and QR code generated."
    });
    
    setNewAddress("");
    setNewDate("");
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
                <Button className="ml-auto gap-2 bg-accent hover:bg-accent/90">
                  <Plus className="h-4 w-4" /> New Event
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create Open House</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="address">Property Address</Label>
                    <Input id="address" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="123 Example St, Las Vegas" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} type="date" />
                  </div>
                  <Button onClick={handleCreateOpenHouse} className="mt-4">Generate QR Code</Button>
                </div>
              </DialogContent>
            </Dialog>
          </header>
          
          <main className="p-8 max-w-7xl mx-auto w-full space-y-8">
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-none shadow-md bg-primary text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Total Sign-ins
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black">{(openHouses || []).reduce((acc, oh) => acc + (oh.signin_count || 0), 0)}</div>
                  <p className="text-xs text-white/70 mt-1">From {openHouses?.length || 0} events</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md bg-accent text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Seller Conversions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black">{(openHouses || []).reduce((acc, oh) => acc + (oh.seller_count || 0), 0)}</div>
                  <p className="text-xs text-white/70 mt-1">Potential listings captured</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                    <Home className="h-4 w-4 text-accent" />
                    Upcoming Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black text-primary">{(openHouses || []).filter(oh => oh.status === 'upcoming').length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Scheduled for this month</p>
                </CardContent>
              </Card>
            </div>

            <section className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-accent" />
                Your Open Houses
              </h2>
              <div className="grid gap-4">
                {isLoading ? (
                  <p className="text-center py-10 text-xs text-muted-foreground">Loading events...</p>
                ) : openHouses && openHouses.length > 0 ? (
                  openHouses.map((oh) => (
                    <Card key={oh.id} className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden group">
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row items-center">
                          <div className="p-6 flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="font-bold text-primary">{oh.address}</h3>
                              <Badge variant={oh.status === 'upcoming' ? 'default' : 'secondary'} className="capitalize">
                                {oh.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-6 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><CalendarIcon className="h-3 w-3" /> {oh.date}</span>
                              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {oh.signin_count} Sign-ins</span>
                              <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-accent" /> {oh.seller_count} Sellers</span>
                            </div>
                          </div>
                          <div className="p-4 bg-slate-50 flex gap-2 w-full md:w-auto md:border-l">
                            <Button variant="outline" size="sm" className="flex-1 md:flex-none gap-2">
                              <QrCode className="h-4 w-4" /> QR Code
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1 md:flex-none gap-2">
                              <ExternalLink className="h-4 w-4" /> Sign-in URL
                            </Button>
                            <Button size="sm" className="flex-1 md:flex-none gap-2">
                              Live View <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-20 border border-dashed rounded-xl">
                    <p className="text-xs text-muted-foreground">No open houses yet. Create your first event!</p>
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
