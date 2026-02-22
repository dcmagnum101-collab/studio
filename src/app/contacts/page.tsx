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
  ChevronDown
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

const SOURCE_CONFIG: Record<string, { label: string; color: string }> = {
  expired: { label: 'Expired', color: 'bg-red-500' },
  fsbo: { label: 'FSBO', color: 'bg-orange-500' },
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
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-xl font-bold font-headline text-primary">Prospecting Hub</h1>
          </header>
          
          <main className="p-8 max-w-7xl mx-auto w-full">
            <div className="flex flex-col gap-8">
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative w-full max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search current page..." 
                        className="pl-10 h-10 shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="sm" className="gap-2 h-10 shadow-sm">
                        <Filter className="h-4 w-4" />
                        Filters
                      </Button>
                      <Button size="sm" className="gap-2 bg-accent hover:bg-accent/90 h-10 shadow-md">
                        <UserPlus className="h-4 w-4" />
                        New Lead
                      </Button>
                    </div>
                  </div>

                  <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full flex h-auto p-1 bg-slate-100 rounded-xl overflow-x-auto justify-start no-scrollbar">
                      <TabsTrigger value="all" className="flex-1 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        All Leads
                      </TabsTrigger>
                      {Object.keys(SOURCE_CONFIG).map((key) => {
                        const config = SOURCE_CONFIG[key];
                        return (
                          <TabsTrigger key={key} value={key} className="flex-1 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2">
                            <div className={`h-2 w-2 rounded-full ${config.color}`} />
                            {config.label}
                          </TabsTrigger>
                        )
                      })}
                    </TabsList>

                    <div className="mt-8 rounded-xl border bg-white shadow-lg overflow-hidden border-slate-200">
                      <Table>
                        <TableHeader className="bg-slate-50/80">
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="font-bold text-slate-700">Lead</TableHead>
                            <TableHead className="font-bold text-slate-700">Property</TableHead>
                            <TableHead className="font-bold text-slate-700">Score</TableHead>
                            <TableHead className="font-bold text-slate-700">Status</TableHead>
                            <TableHead className="text-right font-bold text-slate-700">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredContacts.length > 0 ? (
                            filteredContacts.map((contact) => (
                              <TableRow key={contact.id} className="cursor-pointer hover:bg-slate-50/50" onClick={() => handleViewDetails(contact)}>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="font-bold text-primary flex items-center gap-1.5">
                                      {contact.name}
                                      {contact.ai_urgency === 'hot' && <Flame className="h-3.5 w-3.5 text-red-500 fill-red-500" />}
                                    </span>
                                    <span className="text-xs text-muted-foreground">{contact.phone}</span>
                                    <Badge className={`w-fit mt-1 text-[9px] h-4 py-0 font-normal ${SOURCE_CONFIG[contact.archagent_source]?.color || 'bg-slate-500'}`}>
                                      {SOURCE_CONFIG[contact.archagent_source]?.label || 'Other'}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{contact.propertyAddress}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                      {contact.property_type?.replace('_', ' ') || 'Single Family'}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
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
                                <TableCell>
                                  <Badge variant="outline" className="text-[10px] font-bold bg-slate-50">
                                    {contact.pipeline_stage?.replace('_', ' ') || 'Active'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleViewDetails(contact)}>Intelligence</DropdownMenuItem>
                                      <DropdownMenuItem>Start Sequence</DropdownMenuItem>
                                      <DropdownMenuItem className="text-red-600">Archive</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : !loading && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-20 text-muted-foreground border-dashed border-2">
                                No leads found in this view.
                              </TableCell>
                            </TableRow>
                          )}
                          {loading && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-10 italic text-muted-foreground">
                                Monica is fetching data...
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                      
                      {hasMore && (
                        <div className="p-4 border-t bg-slate-50/50 flex justify-center">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={loadMore} 
                            disabled={loading}
                            className="text-primary font-bold gap-2"
                          >
                            {loading ? "Loading..." : "Load More Leads"}
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </Tabs>
                </div>

                <div className="space-y-8">
                  <EnrichmentTool />
                  <Card className="border-none shadow-md bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-accent" />
                        AI Lead Alerts
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs italic">
                        "URL Enrichment active. Monica is now extracting lead signals from pasted links."
                      </div>
                      <Button variant="outline" className="w-full text-white border-white/20 hover:bg-white/10">View Insights</Button>
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