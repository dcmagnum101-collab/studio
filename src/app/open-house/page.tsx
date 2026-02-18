
"use client"

import React, { useState, useEffect } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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

export default function OpenHousePage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [openHouses, setOpenHouses] = useState([
    { id: 'oh1', address: '847 Cascade Hills Dr, Las Vegas', date: '2024-03-28', signins: 12, sellers: 3, status: 'upcoming' },
    { id: 'oh2', address: '122 Sunset Blvd, Henderson', date: '2024-03-24', signins: 24, sellers: 6, status: 'completed' },
  ])

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCreateOpenHouse = () => {
    toast({
      title: "Open House Created",
      description: "Sign-in page and QR code generated."
    })
  }

  if (!mounted) return null

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-xl font-bold font-headline text-primary">Open House Sign-In Hub</h1>
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
                    <Input id="address" placeholder="123 Example St, Las Vegas" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="date">Date</Label>
                      <Input id="date" type="date" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="time">Start Time</Label>
                      <Input id="time" type="time" />
                    </div>
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
                    Total Sign-ins (YTD)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black">142</div>
                  <p className="text-xs text-white/70 mt-1">From 8 open house events</p>
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
                  <div className="text-3xl font-black">28</div>
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
                  <div className="text-3xl font-black text-primary">2</div>
                  <p className="text-xs text-muted-foreground mt-1">Scheduled for this week</p>
                </CardContent>
              </Card>
            </div>

            <section className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-accent" />
                Your Open Houses
              </h2>
              <div className="grid gap-4">
                {openHouses.map((oh) => (
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
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {oh.signins} Sign-ins</span>
                            <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-accent" /> {oh.sellers} Sellers</span>
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
                ))}
              </div>
            </section>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
