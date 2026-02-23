"use client"

import React, { useState } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  RefreshCw, 
  Printer, 
  Send, 
  MapPin, 
  TrendingUp, 
  Home, 
  Clock, 
  Target,
  Sparkles,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  Zap,
  ArrowRight
} from "lucide-react"
import { generateMarketReport, sendMarketReportToFarm } from "@/app/actions/market-report"
import { useUser } from "@/firebase"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

const VEGAS_ZIPS = [
  { zip: "89144", area: "Summerlin" },
  { zip: "89135", area: "Summerlin South" },
  { zip: "89012", area: "Henderson" },
  { zip: "89052", area: "Seven Hills" },
  { zip: "89117", area: "Lakes/Peccole" },
  { zip: "89138", area: "The Vistas" },
];

export default function MarketReportPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [zipCode, setZipCode] = useState("89144");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [sending, setSending] = useState(false);

  const handleGenerate = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await generateMarketReport(user.uid, zipCode);
      setReport(data);
      toast({ title: "Report Ready", description: "Market intelligence synthesized." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSendToFarm = async () => {
    if (!user || !report) return;
    setSending(true);
    try {
      const res = await sendMarketReportToFarm(user.uid, zipCode, report);
      toast({ title: "Campaign Sent", description: `Delivered to ${res.count} farm contacts.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Send Failed", description: err.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-white shadow-sm sticky top-0 z-10 print:hidden">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-xl font-bold font-headline text-primary">Strategic Market Reports</h1>
          </header>

          <main className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-8">
            {/* Controls */}
            <Card className="border-none shadow-sm print:hidden bg-white rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-end gap-4">
                  <div className="space-y-2 flex-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Neighborhood Zip</label>
                    <Select value={zipCode} onValueChange={setZipCode}>
                      <SelectTrigger className="h-12 rounded-xl border-slate-200">
                        <SelectValue placeholder="Select Zip" />
                      </SelectTrigger>
                      <SelectContent>
                        {VEGAS_ZIPS.map(z => (
                          <SelectItem key={z.zip} value={z.zip}>{z.zip} - {z.area}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleGenerate} 
                    disabled={loading}
                    className="h-12 px-8 bg-primary rounded-xl font-black gap-2 shadow-lg shadow-primary/10 w-full md:w-auto"
                  >
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-accent" />}
                    Generate Insight
                  </Button>
                </div>
              </CardContent>
            </Card>

            {loading && (
              <div className="space-y-8 py-12">
                <div className="flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in-95">
                  <div className="p-4 bg-primary/5 rounded-full">
                    <RefreshCw className="h-12 w-12 animate-spin text-primary" />
                  </div>
                  <h2 className="text-2xl font-black text-primary">Monica is synthesizing neighborhood vitals...</h2>
                  <p className="text-slate-500 max-w-md italic">Analyzing active inventory and calculating neighborhood list-to-sale benchmarks.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-[2rem]" />)}
                </div>
              </div>
            )}

            {report && !loading && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* TOOLBAR */}
                <div className="flex justify-end gap-3 print:hidden">
                  <Button variant="outline" onClick={() => window.print()} className="gap-2 h-11 px-6 rounded-xl font-bold bg-white border-slate-200">
                    <Printer className="h-4 w-4" /> Print PDF
                  </Button>
                  <Button 
                    onClick={handleSendToFarm} 
                    disabled={sending}
                    className="gap-2 h-11 px-6 bg-accent hover:bg-accent/90 text-primary font-black rounded-xl shadow-lg shadow-accent/20"
                  >
                    {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send to Farm List
                  </Button>
                </div>

                {/* THE REPORT */}
                <div className="bg-white shadow-2xl rounded-[2.5rem] overflow-hidden border border-slate-100 print:shadow-none print:rounded-none print:border-none">
                  <header className="bg-primary text-white p-10 sm:p-16 relative">
                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                      <TrendingUp className="h-64 w-64 text-accent" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                      <div className="space-y-4">
                        <Badge className="bg-accent text-primary font-black tracking-[0.2em] uppercase px-3 h-6">MARKET INTELLIGENCE</Badge>
                        <h1 className="text-4xl sm:text-6xl font-black font-headline tracking-tighter leading-tight">
                          Las Vegas Market Update
                        </h1>
                        <div className="flex items-center gap-3 text-primary-foreground/70 font-bold">
                          <MapPin className="h-5 w-5 text-accent" />
                          <span className="text-xl">Neighborhood: {VEGAS_ZIPS.find(z => z.zip === zipCode)?.area || zipCode}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent mb-1">Report Period</p>
                        <p className="text-2xl font-black">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                      </div>
                    </div>
                  </header>

                  <main className="p-10 sm:p-16 space-y-16">
                    {/* STATS GRID */}
                    <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {[
                        { label: 'Active Inventory', val: report.stats.activeCount, icon: Home },
                        { label: 'Sold (30d)', val: report.stats.soldCount, icon: Target },
                        { label: 'Avg Days on Market', val: report.stats.avgDom, icon: Clock },
                        { label: 'Median $/SqFt', val: `$${report.stats.medianPriceSqFt}`, icon: Zap },
                      ].map((s, i) => (
                        <div key={i} className="bg-slate-50 rounded-[2rem] p-6 text-center border-2 border-slate-100 group hover:border-accent/20 transition-all duration-500">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{s.label}</p>
                          <p className="text-3xl font-black text-primary">{s.val}</p>
                        </div>
                      ))}
                    </section>

                    {/* AI NARRATIVE */}
                    <section className="grid lg:grid-cols-3 gap-12 items-start">
                      <div className="lg:col-span-2 space-y-8">
                        <h2 className="text-2xl font-black text-primary flex items-center gap-3">
                          <Sparkles className="h-6 w-6 text-accent" />
                          Strategic Analysis
                        </h2>
                        <div className="space-y-6 text-lg leading-relaxed text-slate-700 font-medium">
                          {report.narrative.split('\n').filter((p: string) => p.trim()).map((p: string, i: number) => (
                            <p key={i}>{p}</p>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-8">
                        <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldCheck className="h-12 w-12" /></div>
                          <h3 className="text-xl font-bold mb-4">List-to-Sale Accuracy</h3>
                          <div className="text-5xl font-black text-accent mb-2">{report.stats.avgListToSale}</div>
                          <p className="text-xs text-slate-400 font-medium leading-relaxed italic">
                            "Current data suggests homes in {zipCode} are closing at {report.stats.avgListToSale} of list price. Strategic initial positioning remains the highest leverage move for sellers."
                          </p>
                        </div>

                        <div className="bg-accent/5 border-4 border-accent/20 rounded-[2.5rem] p-8 space-y-4 text-center">
                          <h3 className="text-lg font-black text-primary uppercase tracking-widest">What's Your Home Worth?</h3>
                          <p className="text-xs text-slate-600 font-medium leading-relaxed">Neighborhood benchmarks are a starting point. For a property-specific valuation, schedule a virtual strategy session.</p>
                          <Button className="w-full h-14 bg-primary text-white font-black rounded-2xl gap-2 text-lg shadow-lg shadow-primary/20">
                            Book Strategy Call <ArrowRight className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </section>

                    {/* FOOTER */}
                    <footer className="pt-16 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8">
                      <div className="flex items-center gap-6">
                        <div className="h-20 w-20 bg-primary rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-lg">
                          MS
                        </div>
                        <div className="space-y-1">
                          <p className="text-2xl font-black text-primary">Monica Selvaggio</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Licensed Nevada Real Estate Professional</p>
                        </div>
                      </div>
                      <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <span className="flex items-center gap-2"><Phone className="h-3 w-3 text-accent" /> (702) 555-0199</span>
                        <span className="flex items-center gap-2"><Mail className="h-3 w-3" /> monicaselvaggio@gmail.com</span>
                        <span className="flex items-center gap-2"><Building2 className="h-3 w-3" /> NV LIC: S.0123456</span>
                      </div>
                    </footer>
                  </main>
                </div>
              </div>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
