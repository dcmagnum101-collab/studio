"use client"

import React, { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useUser } from "@/firebase"
import { generateCMAReport, type CMAReport } from "@/app/actions/cma"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Printer, 
  MapPin, 
  Home, 
  TrendingUp, 
  Calendar, 
  Scale, 
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  Building2,
  Phone,
  Mail,
  ShieldCheck,
  BrainCircuit
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"

export default function CMAReportPage() {
  const params = useParams();
  const { user } = useUser();
  const [report, setReport] = useState<CMAReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && params.contactId) {
      handleGenerate();
    }
  }, [user, params.contactId]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await generateCMAReport(user!.uid, params.contactId as string);
      setReport(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="max-w-3xl w-full space-y-8 text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-black text-primary">Synthesizing Market Intelligence...</h1>
          <p className="text-slate-500 italic">Monica is analyzing comparable sales and calculating strategic list price benchmarks.</p>
          <div className="grid gap-4 mt-12">
            <Skeleton className="h-12 w-full bg-slate-200" />
            <Skeleton className="h-48 w-full bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!report) return <div className="p-20 text-center">Error generating report.</div>;

  return (
    <div className="min-h-screen bg-slate-100/50 py-12 px-4 sm:px-8 print:p-0 print:bg-white">
      {/* TOOLBAR (HIDDEN ON PRINT) */}
      <div className="max-w-5xl mx-auto mb-8 flex justify-between items-center print:hidden">
        <Link href={`/contacts`}>
          <Button variant="ghost" className="gap-2 font-bold text-slate-600">
            <ArrowLeft className="h-4 w-4" /> Back to CRM
          </Button>
        </Link>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleGenerate} className="gap-2 font-bold bg-white">
            <RefreshCw className="h-4 w-4" /> Regenerate Comps
          </Button>
          <Button onClick={() => window.print()} className="gap-2 font-black bg-primary px-8">
            <Printer className="h-4 w-4" /> Print / Save PDF
          </Button>
        </div>
      </div>

      {/* REPORT CONTAINER */}
      <div className="max-w-5xl mx-auto bg-white shadow-2xl rounded-[2.5rem] overflow-hidden print:shadow-none print:rounded-none">
        {/* HEADER SECTION */}
        <header className="bg-primary text-white p-10 sm:p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <Sparkles className="h-64 w-64 text-accent" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div className="space-y-4 max-w-2xl">
              <Badge className="bg-accent text-primary font-black uppercase tracking-[0.2em] px-3 py-1">STRATEGIC PRICING REPORT</Badge>
              <h1 className="text-4xl sm:text-6xl font-black font-headline tracking-tighter leading-tight">
                Market Valuation for {report.subject.name}
              </h1>
              <div className="flex items-center gap-3 text-primary-foreground/70 font-bold">
                <MapPin className="h-5 w-5 text-accent" />
                <span className="text-xl">{report.subject.propertyAddress}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Prepared By</p>
              <p className="text-2xl font-black">Monica Selvaggio</p>
              <p className="text-xs font-bold opacity-60">Selvaggio Global Real Estate</p>
            </div>
          </div>
        </header>

        <main className="p-10 sm:p-16 space-y-16">
          {/* PRICING GRID */}
          <section className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-50 rounded-3xl p-8 text-center border-2 border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Conservative Entry</p>
              <p className="text-3xl font-black text-slate-700">${report.analysis.priceRange.low.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-2">Maximum Velocity</p>
            </div>
            <div className="bg-primary/5 rounded-3xl p-8 text-center border-4 border-accent shadow-xl relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-primary text-[9px] font-black px-4 py-1 rounded-full uppercase tracking-widest">Target Listing</div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">Recommended Price</p>
              <p className="text-5xl font-black text-primary">${report.analysis.priceRange.target.toLocaleString()}</p>
              <p className="text-xs text-primary/60 font-bold mt-2">Optimal Market Alignment</p>
            </div>
            <div className="bg-slate-50 rounded-3xl p-8 text-center border-2 border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Aggressive Target</p>
              <p className="text-3xl font-black text-slate-700">${report.analysis.priceRange.high.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-2">Patience Required</p>
            </div>
          </section>

          {/* AI NARRATIVE */}
          <section className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h2 className="text-2xl font-black flex items-center gap-3 text-primary">
                <BrainCircuit className="h-6 w-6 text-accent" />
                Valuation Methodology
              </h2>
              <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
                <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{report.analysis.narrative}</p>
              </div>
            </div>
            <div className="space-y-6">
              <h2 className="text-2xl font-black flex items-center gap-3 text-primary">
                <TrendingUp className="h-6 w-6 text-accent" />
                Current Market Sentiment
              </h2>
              <div className="p-8 bg-slate-900 text-white rounded-3xl shadow-xl">
                <p className="text-sm leading-relaxed opacity-80 italic">"{report.analysis.marketInsight}"</p>
                <div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent">
                  <ShieldCheck className="h-4 w-4" /> Real-time Neighborhood Pulse Active
                </div>
              </div>
            </div>
          </section>

          {/* COMP TABLE */}
          <section className="space-y-8">
            <div className="flex justify-between items-end">
              <h2 className="text-2xl font-black text-primary">Comparable Neighborhood Benchmarks</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Recent Sales (Last 90 Days)</p>
            </div>
            <div className="overflow-hidden rounded-3xl border border-slate-100 shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Comp Address</th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Specs</th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Sold Price</th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">$/SqFt</th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">DOM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {report.comparables.map((comp, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-5">
                        <p className="font-bold text-slate-800 text-sm">{comp.address}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Verified Sold Listing</p>
                      </td>
                      <td className="p-5 text-sm font-bold text-slate-600">{comp.beds}bd | {comp.baths}ba | {comp.sqft.toLocaleString()}ft</td>
                      <td className="p-5 text-sm font-black text-primary">${comp.soldPrice.toLocaleString()}</td>
                      <td className="p-5 text-sm font-bold text-slate-600">${Math.round(comp.pricePerSqFt)}</td>
                      <td className="p-5">
                        <Badge variant="outline" className="text-[9px] font-black">{comp.daysOnMarket} Days</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="pt-16 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="space-y-2 text-center md:text-left">
              <p className="text-xl font-black text-primary">Monica Selvaggio</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Licensed Real Estate Professional</p>
            </div>
            <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <span className="flex items-center gap-2"><Phone className="h-3 w-3" /> (702) 555-0199</span>
              <span className="flex items-center gap-2"><Mail className="h-3 w-3" /> monicaselvaggio@gmail.com</span>
              <span className="flex items-center gap-2"><Building2 className="h-3 w-3" /> NV LIC: S.0123456</span>
            </div>
          </footer>
        </main>
      </div>

      <div className="max-w-5xl mx-auto mt-8 text-center opacity-40">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
          * This report is a strategic market analysis provided by Monica AI Hub. Data is derived from various sources including RapidAPI, Trulia, and local market estimators. It is not an official appraisal.
        </p>
      </div>
    </div>
  );
}
