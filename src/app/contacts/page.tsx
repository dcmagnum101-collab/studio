"use client"

import React, { useState, useEffect, useMemo } from "react"
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  UserPlus,
  Flame,
  Sparkles
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
import { SocialLeadCapture } from "@/components/prospecting/social-lead-capture";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";

const SOURCE_CONFIG: Record<string, { label: string; color: string }> = {
  expired: { label: 'Expired', color: 'bg-red-500' },
  fsbo: { label: 'FSBO', color: 'bg-orange-500' },
  preforeclosure: { label: 'Pre-Fore', color: 'bg-yellow-600' },
  frbo: { label: 'FRBO', color: 'bg-blue-500' },
  probate: { label: 'Probate', color: 'bg-purple-600' },
  social_capture: { label: 'Social', color: 'bg-pink-500' },
  gis_import: { label: 'GIS', color: 'bg-green-600' },
  recommended: { label: 'Recommended', color: 'bg-purple-500' },
  circle_prospect: { label: 'Circle', color: 'bg-green-500' },
  manual: { label: 'Manual', color: 'bg-slate-500' },
};

export default function ContactsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [selectedContact, setSelectedContact] = React.useState<any | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<string>("all");
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const contactsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'users', user.uid, 'contacts'),
      orderBy('name', 'asc')
    );
  }, [user, firestore]);

  const { data: liveContacts, isLoading } = useCollection(contactsQuery);

  const handleViewDetails = (contact: any) => {
    setSelectedContact(contact);
    setSheetOpen(true);
  };

  const filteredContacts = (liveContacts || []).filter(c => {
    const matchesTab = activeTab === "all" || c.archagent_source === activeTab;
    const matchesSearch = c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         c.propertyAddress?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  if (!mounted) return null;

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
                        placeholder="Search leads..." 
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
                        All ({(liveContacts || []).length})
                      </TabsTrigger>
                      {['expired', 'fsbo', 'preforeclosure', 'probate', 'social_capture'].map((key) => {
                        const config = SOURCE_CONFIG[key];
                        const count = (liveContacts || []).filter(c => c.archagent_source === key).length;
                        return (
                          <TabsTrigger key={key} value={key} className="flex-1 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2">
                            <div className={`h-2 w-2 rounded-full ${config.color}`} />
                            {config.label} ({count})
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
                          {isLoading ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Loading leads...</TableCell>
                            </TableRow>
                          ) : filteredContacts.length > 0 ? (
                            filteredContacts.map((contact) => (
                              <TableRow key={contact.id} className="cursor-pointer hover:bg-slate-50/50" onClick={() => handleViewDetails(contact)}>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="font-bold text-primary flex items-center gap-1.5">
                                      {contact.name}
                                      {contact.status === 'Urgent' && <Flame className="h-3.5 w-3.5 text-red-500 fill-red-500" />}
                                    </span>
                                    <span className="text-xs text-muted-foreground">{contact.phone}</span>
                                    <Badge className={`w-fit mt-1 text-[9px] h-4 py-0 font-normal ${SOURCE_CONFIG[contact.archagent_source]?.color}`}>
                                      {SOURCE_CONFIG[contact.archagent_source]?.label}
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
                                    {contact.status || 'Active'}
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
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-20 text-muted-foreground border-dashed border-2">
                                No leads found matching your criteria.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </Tabs>
                </div>

                <div className="space-y-8">
                  <SocialLeadCapture />
                  <Card className="border-none shadow-md bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-accent" />
                        AI Lead Alerts
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs italic">
                        "3 new probate filings matched your target zip code. High equity detected on 2 properties."
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs italic">
                        "Michael Chen (Ghost Lead) just opened your follow-up email for the 3rd time. Move to call queue."
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
