'use client';

import React from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BrainCircuit, Sparkles, Zap, ShieldCheck } from "lucide-react";
import { ObjectionCoachContent } from "@/components/objection-coach/objection-coach-content";
import { Badge } from "@/components/ui/badge";

export default function ObjectionCoachPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#F9FAFB]">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-xl font-bold font-headline text-primary">Tactical Objection Coach</h1>
          </header>

          <main className="p-4 md:p-8 max-w-4xl mx-auto w-full space-y-8">
            <Card className="border-none shadow-xl bg-gradient-to-br from-primary via-primary to-slate-900 text-white overflow-hidden relative rounded-[2rem]">
              <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                <BrainCircuit className="h-48 w-48 text-accent" />
              </div>
              <CardContent className="p-8 sm:p-12 relative z-10 space-y-6">
                <Badge className="bg-accent text-primary font-black tracking-[0.2em] uppercase px-3 h-6">EXECUTIVE CO-PILOT</Badge>
                <div className="space-y-2">
                  <h2 className="text-3xl sm:text-5xl font-black font-headline tracking-tighter">Winning the Conversation</h2>
                  <p className="text-lg text-primary-foreground/70 max-w-xl leading-relaxed">
                    Monica, real estate is won in the first 30 seconds of an objection. Use this coach to practice or get real-time redirects during a high-stakes call.
                  </p>
                </div>
                <div className="flex items-center gap-6 pt-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-accent">
                    <Zap className="h-4 w-4" /> Instant Response Library
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                    <Sparkles className="h-4 w-4" /> Grok-4 Live Analysis
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-green-400">
                    <ShieldCheck className="h-4 w-4" /> NV Compliance Guard
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-8">
              <Card className="border-none shadow-md bg-white rounded-[2rem] overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b p-8">
                  <CardTitle className="text-xl font-black text-primary">Live Objection Handling</CardTitle>
                  <CardDescription>Select a category or type exactly what the seller said.</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <ObjectionCoachContent />
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
