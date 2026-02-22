
"use client"

import React, { useState, useEffect } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  UserPlus,
  Flame,
  Sparkles,
  ChevronDown,
  Phone,
  Mail,
  ArrowUpRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ContactDetailsSheet } from "@/components/contacts/contact-details-sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnrichmentTool } from "@/components/prospecting/enrichment-tool";
import { useUser, useFirestore, usePaginatedCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, where } from "firebase/firestore";
import Link from "next/link";

const SOURCE_CONFIG: Record<string, { label: string; color: string }> = {
  expired: { label: 'Expired', color: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' },
  fsbo: { label: 'FSBO', color: 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]' },
  preforeclosure: { label: 'Pre-Fore', color: 'bg-yellow-600' },
  probate: { label: 'Probate', color: 'bg-purple-600' },
  url_enrichment: { label: 'Enriched', color: 'bg-blue-500' },
  social_capture: { label: 'Social', color: 'bg-pink-500' },
};

export default function ContactsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [selectedContact, setSelectedContact] = React.useState<any | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const contactsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    const base = collection(firestore, 'users', user.uid, 'contacts');
    
    if (activeTab === "all") {
      return query(base, orderBy('name', 'asc'));
    }
    
    return query(
      base, 
      where('archagent_source', '==', activeTab),
      orderBy('name', 'asc')
    );
  }, [user, firestore, activeTab]);

  const { data: contacts, loading, hasMore, loadMore } = usePaginatedCollection(contactsQuery, 25);

  const handleViewDetails = (contact: any) => {
    setSelectedContact(contact);
    setSheetOpen(true);
  };

  const filteredContacts = (contacts || []).filter(c => {
    const matchesSearch = c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         c.propertyAddress?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 md:px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-lg md:text-xl font-bold font-headline text-primary truncate">Prospecting Hub</h1>
            <div className="ml-auto flex items-center gap-2">
               <Button size="sm" className="gap-2 bg-accent hover:bg-accent/90 h-9 shadow-md text-[10px] md:text-xs font-black uppercase tracking-widest">
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Lead</span>
              </Button>
            </div>
          </header>
          
          <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">
            <div className="flex flex-col gap-6 md:gap-8">
              <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
                <div className="lg:col-span-2 space-y-6 md:space-y-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative w-full max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search leads..." 
                        className="pl-10 h-11 shadow-sm rounded-xl"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-2 h-11 rounded-xl shadow-sm px-4">
                        <Filter className="h-4 w-4" />
                        Filters
                      </Button>
                    </div>
                  </div>

                  <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full flex h-auto p-1 bg-slate-100 rounded-2xl overflow-x-auto justify-start no-scrollbar">
                      <TabsTrigger value="all" className="flex-1 py-3 rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        All
                      </TabsTrigger>
                      {Object.keys(SOURCE_CONFIG).map((key) => {
                        const config = SOURCE_CONFIG[key];
                        return (
                          <TabsTrigger key={key} value={key} className="flex-1 py-3 rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2">
                            <div className={`h-2 w-2 rounded-full ${config.color}`} />
                            <span className="hidden sm:inline">{config.label}</span>
                          </TabsTrigger>
                        )
                      })}
                    </TabsList>

                    {/* DESKTOP TABLE VIEW */}
                    <div className="hidden md:block mt-8 rounded-2xl border bg-white shadow-xl overflow-hidden border-slate-200">
                      <Table>
                        <TableHeader className="bg-slate-50/80">
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="font-bold text-slate-700 py-4 px-6">Lead</TableHead>
                            <TableHead className="font-bold text-slate-700 py-4">Property</TableHead>
                            <TableHead className="font-bold text-slate-700 py-4">Score</TableHead>
                            <TableHead className="font-bold text-slate-700 py-4">Status</TableHead>
                            <TableHead className="text-right font-bold text-slate-700 py-4 px-6">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredContacts.length > 0 ? (
                            filteredContacts.map((contact) => (
                              <TableRow key={contact.id} className="cursor-pointer hover:bg-primary/[0.02] transition-colors" onClick={() => handleViewDetails(contact)}>
                                <TableCell className="py-4 px-6">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-primary flex items-center gap-1.5">
                                      {contact.name}
                                      {contact.ai_urgency === 'hot' && <Flame className="h-3.5 w-3.5 text-red-500 fill-red-500" />}
                                    </span>
                                    <span className="text-xs text-muted-foreground">{contact.phone}</span>
                                    <Badge className={`w-fit mt-1.5 text-[9px] h-4 py-0 font-bold uppercase tracking-tighter ${SOURCE_CONFIG[contact.archagent_source]?.color || 'bg-slate-500'}`}>
                                      {SOURCE_CONFIG[contact.archagent_source]?.label || 'Other'}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell className="py-4">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-slate-700">{contact.propertyAddress}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                                      {contact.property_type?.replace('_', ' ') || 'Single Family'}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="py-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-black text-primary">{contact.icpScore}</span>
                                    <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full ${contact.icpScore > 80 ? 'bg-green-500' : 'bg-yellow-500'}`} 
                                        style={{ width: `${contact.icpScore}%` }}
                                      />
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="py-4">
                                  <Badge variant="outline" className="text-[10px] font-bold bg-slate-50 border-slate-200 capitalize">
                                    {contact.pipeline_stage?.replace('_', ' ') || 'Active'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right py-4 px-6" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary">
                                      <Phone className="h-4 w-4" />
                                    </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="rounded-xl shadow-2xl border-slate-200">
                                        <DropdownMenuItem onClick={() => handleViewDetails(contact)} className="font-bold text-xs gap-2">
                                          <ArrowUpRight className="h-3 w-3" /> View Intelligence
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="font-bold text-xs gap-2">
                                          <Sparkles className="h-3 w-3 text-accent" /> Start Sequence
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600 font-bold text-xs">Archive Lead</DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : !loading && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-24 text-muted-foreground italic border-dashed border-2 border-slate-100 rounded-b-2xl">
                                Monica has no results matching your current criteria.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* MOBILE CARD VIEW */}
                    <div className="md:hidden mt-6 space-y-4">
                      {filteredContacts.map((contact) => (
                        <Card key={contact.id} className="border-none shadow-md overflow-hidden" onClick={() => handleViewDetails(contact)}>
                          <CardContent className="p-4 space-y-4">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <h3 className="font-bold text-primary flex items-center gap-1.5">
                                  {contact.name}
                                  {contact.ai_urgency === 'hot' && <Flame className="h-3.5 w-3.5 text-red-500 fill-red-500" />}
                                </h3>
                                <p className="text-xs font-semibold text-slate-600">{contact.propertyAddress}</p>
                              </div>
                              <div className="text-right">
                                <span className="block text-lg font-black text-primary leading-none">{contact.icpScore}</span>
                                <span className="text-[8px] text-muted-foreground font-black uppercase tracking-widest">ICP SCORE</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                              <Badge className={`text-[8px] h-4 py-0 font-black uppercase tracking-widest ${SOURCE_CONFIG[contact.archagent_source]?.color || 'bg-slate-500'}`}>
                                {SOURCE_CONFIG[contact.archagent_source]?.label || 'Other'}
                              </Badge>
                              <div className="flex gap-2">
                                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-slate-100">
                                  <Phone className="h-3.5 w-3.5 text-primary" />
                                </Button>
                                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-slate-100">
                                  <Mail className="h-3.5 w-3.5 text-primary" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {!loading && filteredContacts.length === 0 && (
                        <div className="text-center py-20 px-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                          <p className="text-xs text-muted-foreground italic">No results found.</p>
                        </div>
                      )}
                    </div>
                    
                    {hasMore && (
                      <div className="p-6 flex justify-center">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={loadMore} 
                          disabled={loading}
                          className="text-primary font-black uppercase tracking-widest text-[10px] gap-2 hover:bg-primary/5"
                        >
                          {loading ? "Monica is syncing..." : "Load More Intelligence"}
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </Tabs>
                </div>

                <div className="space-y-6 md:space-y-8">
                  <EnrichmentTool />
                  <Card className="border-none shadow-xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Sparkles className="h-20 w-20" />
                    </div>
                    <CardHeader className="relative z-10">
                      <CardTitle className="text-sm md:text-base font-bold flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-accent" />
                        AI Lead Signals
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 relative z-10">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-xs italic leading-relaxed text-blue-50">
                        "High-equity patterns detected in Summerlin zip code 89144. Monica recommends a Circle Prospecting blast."
                      </div>
                      <Button variant="outline" className="w-full text-white border-white/20 hover:bg-white/10 rounded-xl font-bold text-xs h-11">View Neighborhood Intel</Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </main>
          
          <ContactDetailsSheet 
            contact={selectedContact} 
            open={sheetOpen} 
            onOpenChange={setSheetOpen} 
          />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
