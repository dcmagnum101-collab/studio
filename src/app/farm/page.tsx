
"use client"

import React from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
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
  Users
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function FarmZonePage() {
  const { toast } = useToast()
  const [maxContacts, setMaxContacts] = React.useState([100])
  const [drawingMode, setDrawingMode] = React.useState<'radius' | 'polygon' | null>(null)

  const handleImport = () => {
    toast({
      title: "ArchAgent Import Started",
      description: "Pulling 87 leads from Summerlin West neighborhood..."
    })
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-xl font-bold font-headline text-primary">Farm Zone Prospector</h1>
          </header>
          
          <main className="flex h-[calc(100vh-64px)] overflow-hidden">
            {/* Map Area */}
            <div className="flex-1 relative bg-slate-100">
              {/* Mock Map Background */}
              <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/map1/1200/1200')] bg-cover opacity-40" />
              <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 opacity-10 pointer-events-none">
                {Array.from({ length: 144 }).map((_, i) => (
                  <div key={i} className="border border-primary/20" />
                ))}
              </div>

              {/* Map Controls */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <Card className="shadow-md border-none p-1">
                  <div className="flex flex-col gap-1">
                    <Button 
                      variant={drawingMode === 'radius' ? 'default' : 'ghost'} 
                      size="icon" 
                      onClick={() => setDrawingMode('radius')}
                      title="Draw Radius"
                    >
                      <Circle className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant={drawingMode === 'polygon' ? 'default' : 'ghost'} 
                      size="icon" 
                      onClick={() => setDrawingMode('polygon')}
                      title="Draw Polygon"
                    >
                      <Square className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Select Area">
                      <MousePointer2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
                <Card className="shadow-md border-none p-1">
                  <Button variant="ghost" size="icon" title="Map Layers">
                    <Layers className="h-4 w-4" />
                  </Button>
                </Card>
              </div>

              {/* Search Bar on Map */}
              <div className="absolute top-4 right-4 w-80">
                <Card className="shadow-lg border-none">
                  <div className="p-2 flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Enter neighborhood or city..." className="pl-8 h-9 text-sm" />
                    </div>
                    <Button size="sm" className="h-9">Search</Button>
                  </div>
                </Card>
              </div>

              {/* Just Sold Shortcut */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                <Button size="lg" className="bg-accent hover:bg-accent/90 shadow-2xl gap-2 font-bold px-8 py-6 rounded-full">
                  <Sparkles className="h-5 w-5" />
                  Just Sold Blast
                </Button>
              </div>
            </div>

            {/* Panel Sidebar */}
            <aside className="w-96 border-l bg-white flex flex-col shadow-xl z-20">
              <div className="p-6 border-b">
                <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                  <MapIcon className="h-5 w-5 text-accent" />
                  Zone Configuration
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Configure parameters for ArchAgent lead pull.</p>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Filters</h3>
                  <div className="grid gap-3">
                    {[
                      'Absentee Owners',
                      'High Equity (LTV < 50%)',
                      'Free & Clear',
                      'Empty Nesters',
                      'Out of State Owners'
                    ].map((filter) => (
                      <div key={filter} className="flex items-center justify-between p-3 rounded-lg border bg-slate-50/50">
                        <Label className="text-sm cursor-pointer" htmlFor={filter}>{filter}</Label>
                        <Input type="checkbox" id={filter} className="h-4 w-4" defaultChecked />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Lead Volume</h3>
                    <Badge variant="secondary">{maxContacts} Contacts</Badge>
                  </div>
                  <Slider 
                    value={maxContacts} 
                    onValueChange={setMaxContacts} 
                    max={500} 
                    step={50} 
                    min={50}
                  />
                  <p className="text-[10px] text-muted-foreground italic">
                    Estimated 284 contacts match your filters in this zone.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Auto-Sequence</h3>
                  <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                    <option>circle_prospect (Default)</option>
                    <option>landlord_nurture</option>
                    <option>recommended_daily</option>
                  </select>
                </div>

                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2 text-primary font-bold">
                      <Users className="h-4 w-4" />
                      Zone Summary
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-xl font-bold">87</div>
                        <div className="text-[10px] text-muted-foreground">Match Lead</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold">12</div>
                        <div className="text-[10px] text-muted-foreground">High Score (70+)</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="p-6 border-t bg-slate-50/50">
                <Button className="w-full gap-2 py-6 text-lg font-bold" onClick={handleImport}>
                  <Download className="h-5 w-5" />
                  Pull Leads to Prospector
                </Button>
              </div>
            </aside>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
