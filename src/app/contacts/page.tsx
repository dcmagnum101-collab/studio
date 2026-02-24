"use client"
export const dynamic = 'force-dynamic';

import React, { useState, useRef } from "react"
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
import { Label } from "@/components/ui/label";
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
  ArrowUpRight,
  Globe,
  UploadCloud,
  RefreshCw,
  Plus,
  User,
  Zap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { ContactDetailsSheet } from "@/components/contacts/contact-details-sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnrichmentTool } from "@/components/prospecting/enrichment-tool";
import { useContacts } from "@/hooks/useFirestoreData";
import { normalizePhone } from "@/lib/utils";
import { useUser, useFirestore, addDocumentNonBlocking } from "@/firebase";
import { collection } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { syncVulcan7Leads } from "@/app/actions/vulcan7";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

const SOURCE_CONFIG: Record<string, { label: string; color: string }> = {
  expired: { label: 'Expired', color: 'bg-red-500' },
  fsbo: { label: 'FSBO', color: 'bg-orange-500' },
  preforeclosure: { label: 'Pre-Fore', color: 'bg-yellow-600' },
  divorce: { label: 'Divorce', color: 'bg-rose-600' },
  probate: { label: 'Probate', color: 'bg-purple-600' },
  url_enrichment: { label: 'Enriched', color: 'bg-blue-500' },
  social_capture: { label: 'Social', color: 'bg-pink-500' },
  vulcan7: { label: 'Vulcan7', color: 'bg-indigo-600' },
};

export default function ContactsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selectedContact, setSelectedContact] = React.useState<any | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Quick Add State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newAddress, setNewAddress] = useState("");

  // Import State
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { 
    data: contacts, 
    loading, 
    hasMore, 
    loadMore,
    refresh
  } = useContacts({ source: activeTab === 'all' ? undefined : activeTab, searchQuery });

  const handleViewDetails = (contact: any) => {
    setSelectedContact(contact);
    setSheetOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsImporting(true);
    setImportProgress(10);
    
    try {
      const text = await file.text();
      setImportProgress(40);
      
      const res = await syncVulcan7Leads(user.uid, text);
      setImportProgress(100);
      
      toast({ 
        title: "Import Complete", 
        description: `Imported ${res.imported} new prospects. ${res.duplicates} duplicates skipped.` 
      });
      
      // Force refresh the list to show new leads
      refresh();
    } catch (err: any) {
      toast({ 
        variant: "destructive", 
        title: "Import Failed", 
        description: err.message 
      });
    } finally {
      setIsImporting(false);
      setTimeout(() => setImportProgress(0), 1000);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleManualAdd = () => {
    if (!user || !firestore || !newName) return;
    
    const normalized = normalizePhone(newPhone);
    const contactsRef = collection(firestore, 'users', user.uid, 'contacts');
    
    addDocumentNonBlocking(contactsRef, {
      name: newName,
      phone: normalized,
      email: newEmail,
      propertyAddress: newAddress,
      archagent_source: 'manual',
      icpScore: 50,
      pipeline_stage: 'new_lead',
      ownerId: user.uid,
      created_at: new Date().toISOString()
    });

    toast({ title: "Lead Added", description: `${newName} saved.` });
    setIsAddOpen(false);
    setNewName("");
    setNewPhone("");
    setNewEmail("");
    setNewAddress("");
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 md:px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-lg md:text-xl font-bold font-headline text-primary truncate">Prospector</h1>
            <div className="ml-auto flex items-center gap-2">
              {/* VULCAN7 IMPORT BUTTON */}
              <div className="relative group">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 h-9 text-[10px] md:text-xs font-black uppercase tracking-widest px-4 border-primary/20 text-primary shadow-sm hover:bg-slate-50 transition-colors"
                  disabled={isImporting}
                >
                  {isImporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                  <span className="hidden sm:inline">Import Vulcan7</span>
                </Button>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept=".csv" 
                  className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed z-10" 
                  onChange={handleFileChange}
                  disabled={isImporting}
                />
              </div>

              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2 bg-accent hover:bg-accent/90 h-9 shadow-md text-[10px] md:text-xs font-black uppercase tracking-widest px-4">
                    <UserPlus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add Lead</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md w-[95vw] rounded-2xl">
                  <DialogHeader>
                    <DialogTitle>Quick Add Prospect</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" value={newName} onChange={e => setNewName(e.target.value)} placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input 
                        id="phone" 
                        value={newPhone} 
                        onChange={e => setNewPhone(e.target.value)}
                        onBlur={() => setNewPhone(normalizePhone(newPhone))} 
                        placeholder="(702) 555-0100" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="john@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Property Address</Label>
                      <Input id="address" value={newAddress} onChange={e => setNewAddress(e.target.value)} placeholder="123 Example St, Las Vegas" />
                    </div>
                  </div>
                  <DialogFooter className="flex-row gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                    <Button onClick={handleManualAdd} className="bg-primary flex-1">Save Lead</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </header>

          {/* IMPORT PROGRESS OVERLAY */}
          {isImporting && (
            <div className="bg-primary/5 border-b p-2 animate-in slide-in-from-top-2">
              <div className="max-w-7xl mx-auto flex items-center gap-4 px-6 h-10">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Monica is indexing your leads...
                    </span>
                    <span className="text-[9px] font-black text-primary">{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} className="h-1 bg-primary/10" />
                </div>
              </div>
            </div>
          )}
          
          <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">
            {contacts.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-12 sm:py-24 space-y-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center space-y-4">
                  <div className="h-24 w-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <User className="h-12 w-12 text-slate-300" />
                  </div>
                  <h2 className="text-3xl font-black text-primary">No leads yet — let's fix that</h2>
                  <p className="text-slate-500 max-w-md mx-auto text-sm">
                    Most agents start with a Vulcan7 CSV export — it takes about 2 minutes to populate your entire pipeline.
                  </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-3 w-full max-w-4xl">
                  <Card className="border-none shadow-xl hover:scale-105 transition-transform group cursor-pointer relative overflow-hidden">
                    <input 
                      type="file" 
                      accept=".csv" 
                      className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                      onChange={handleFileChange}
                    />
                    <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                      <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <UploadCloud className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-slate-900">Import Vulcan7</h3>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">FASTEST START</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Link href="/sources" className="contents">
                    <Card className="border-none shadow-xl hover:scale-105 transition-transform group cursor-pointer">
                      <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                        <div className="h-12 w-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors">
                          <RefreshCw className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-bold text-slate-900">Sync Live Listings</h3>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">REAL-TIME DATA</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  <Card className="border-none shadow-xl hover:scale-105 transition-transform group cursor-pointer" onClick={() => setIsAddOpen(true)}>
                    <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                      <div className="h-12 w-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                        <Plus className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-slate-900">Add Lead Manually</h3>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">QUICK ADD</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Tabs defaultValue="list" className="w-full space-y-6">
                <TabsList className="grid w-full grid-cols-2 md:hidden">
                  <TabsTrigger value="list" className="font-bold text-xs uppercase tracking-widest">Prospects</TabsTrigger>
                  <TabsTrigger value="enrich" className="font-bold text-xs uppercase tracking-widest">Enrichment</TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="m-0 space-y-6">
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
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                      <TabsList className="w-full md:w-auto flex h-auto p-1 bg-slate-100 rounded-xl overflow-x-auto justify-start no-scrollbar">
                        <TabsTrigger value="all" className="flex-1 md:flex-none py-2 px-4 rounded-lg text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-white">All</TabsTrigger>
                        {Object.keys(SOURCE_CONFIG).map((key) => (
                          <TabsTrigger key={key} value={key} className="flex-1 md:flex-none py-2 px-4 rounded-lg text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-white">
                            {SOURCE_CONFIG[key].label}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                      {/* DESKTOP TABLE VIEW */}
                      <div className="hidden md:block rounded-2xl border bg-white shadow-xl overflow-hidden border-slate-200">
                        <Table>
                          <TableHeader className="bg-slate-50/80">
                            <TableRow>
                              <TableHead className="font-bold text-slate-700 py-4 px-6">Lead</TableHead>
                              <TableHead className="font-bold text-slate-700 py-4">Property</TableHead>
                              <TableHead className="font-bold text-slate-700 py-4">Score</TableHead>
                              <TableHead className="text-right font-bold text-slate-700 py-4 px-6">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {contacts.length > 0 ? (
                              contacts.map((contact) => (
                                <TableRow key={contact.id} className="cursor-pointer hover:bg-primary/[0.02]" onClick={() => handleViewDetails(contact)}>
                                  <TableCell className="py-4 px-6">
                                    <div className="flex flex-col">
                                      <span className="font-bold text-primary flex items-center gap-1.5">
                                        {contact.name}
                                        {contact.ai_urgency === 'hot' && <Flame className="h-3.5 w-3.5 text-red-500 fill-red-500" />}
                                      </span>
                                      <Badge className={`w-fit mt-1.5 text-[9px] h-4 py-0 font-bold uppercase ${SOURCE_CONFIG[contact.archagent_source]?.color || 'bg-slate-500 text-white'}`}>
                                        {SOURCE_CONFIG[contact.archagent_source]?.label || 'Other'}
                                      </Badge>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-4">
                                    <span className="text-sm font-semibold text-slate-700">{contact.propertyAddress}</span>
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
                                  <TableCell className="text-right py-4 px-6">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                                      <ArrowUpRight className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : loading && (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-24 text-muted-foreground italic">Syncing prospects...</TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      {/* MOBILE CARD VIEW */}
                      <div className="md:hidden space-y-4">
                        {contacts.map((contact) => (
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
                                  <span className="text-[8px] text-muted-foreground font-black uppercase tracking-widest">ICP</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                <Badge className={`text-[8px] h-4 py-0 font-black uppercase ${SOURCE_CONFIG[contact.archagent_source]?.color || 'bg-slate-500 text-white'}`}>
                                  {SOURCE_CONFIG[contact.archagent_source]?.label || 'Other'}
                                </Badge>
                                <div className="flex gap-2">
                                  {contact.phone && (
                                    <a href={`tel:${contact.phone.replace(/\D/g, '')}`} onClick={e => e.stopPropagation()}>
                                      <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full bg-slate-100">
                                        <Phone className="h-4 w-4 text-primary" />
                                      </Button>
                                    </a>
                                  )}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full" onClick={e => e.stopPropagation()}>
                                        <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-xl">
                                      <DropdownMenuItem onClick={() => handleViewDetails(contact)}>View Details</DropdownMenuItem>
                                      <DropdownMenuItem className="text-red-600">Archive</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      
                      {hasMore && (
                        <div className="p-6 flex justify-center">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={loadMore} 
                            disabled={loading}
                            className="text-primary font-black uppercase tracking-widest text-[10px] gap-2 h-11 px-8 rounded-xl bg-primary/5"
                          >
                            {loading ? "Syncing..." : "Load More"}
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="hidden lg:block space-y-8">
                      <EnrichmentTool />
                      <Card className="border-none shadow-xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                          <Sparkles className="h-20 w-20" />
                        </div>
                        <CardHeader className="relative z-10">
                          <CardTitle className="text-base font-bold flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-accent" />
                            AI Signals
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 relative z-10">
                          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-xs italic text-blue-50 leading-relaxed">
                            "High-equity patterns detected in Summerlin zip code 89144. Monica recommends a Circle Prospecting blast."
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="enrich" className="m-0 space-y-6 md:hidden">
                  <EnrichmentTool />
                  <Card className="border-none shadow-lg bg-primary text-white p-6 rounded-2xl">
                    <div className="flex items-center gap-3 mb-4">
                      <Globe className="h-6 w-6 text-accent" />
                      <h3 className="font-bold">Neighborhood Signals</h3>
                    </div>
                    <p className="text-sm text-primary-foreground/80 italic">"Detected high movement signals in Henderson area (89012) over the last 48 hours."</p>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </main>
          
          <ContactDetailsSheet 
            contact={selectedContact} 
            open={sheetOpen} 
            onOpenChange={setSheetOpen} 
          />

          {/* Quick Add FAB for mobile */}
          <div className="md:hidden fixed bottom-24 right-4 z-40 pb-safe">
            <Button 
              size="icon" 
              className="h-14 w-14 rounded-full bg-accent text-primary shadow-2xl hover:scale-110 active:scale-95 transition-transform"
              onClick={() => setIsAddOpen(true)}
            >
              <UserPlus className="h-6 w-6" />
            </Button>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
