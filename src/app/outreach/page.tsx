"use client";
export const dynamic = 'force-dynamic';

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SmartOutreach } from "@/components/outreach/smart-outreach";

export default function OutreachPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-xl font-bold font-headline text-primary">Smart Outreach Hub</h1>
          </header>
          
          <main className="p-8 max-w-7xl mx-auto w-full">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-primary mb-2">Smart List Builder</h2>
              <p className="text-muted-foreground"> Monica's AI engine automatically prioritizes leads based on ICP score and filters out DNC records.</p>
            </div>
            
            <SmartOutreach />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
