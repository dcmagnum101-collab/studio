
"use client"

import React from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MOCK_CONTACTS, Contact, ArchAgentSource } from "@/lib/mock-data";
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
import { 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal, 
  UserPlus,
  AlertCircle,
  TrendingUp,
  Flame
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ContactDetailsSheet } from "@/components/contacts/contact-details-sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const SOURCE_CONFIG: Record<string, { label: string; color: string }> = {
  expired: { label: 'Expired', color: 'bg-red-500' },
  fsbo: { label: 'FSBO', color: 'bg-orange-500' },
  preforeclosure: { label: 'Pre-Fore', color: 'bg-yellow-600' },
  frbo: { label: 'FRBO', color: 'bg-blue-500' },
  recommended: { label: 'Recommended', color: 'bg-purple-500' },
  circle_prospect: { label: 'Circle', color: 'bg-green-500' },
  manual: { label: 'Manual', color: 'bg-slate-500' },
};

export default function ContactsPage() {
  const [selectedContact, setSelectedContact] = React.useState<Contact | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<string>("all");

  const handleViewDetails = (contact: Contact) => {
    setSelectedContact(contact);
    setSheetOpen(true);
  };

  const filteredContacts = activeTab === "all" 
    ? MOCK_CONTACTS 
    : MOCK_CONTACTS.filter(c => c.archagent_source === activeTab);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-xl font-bold font-headline text-primary">ArchAgent Prospector</h1>
          </header>
          
          <main className="p-8 max-w-7xl mx-auto w-full">
            <div className="flex flex-col gap-8">
              {/* Header Stats & Search */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search name, address, or tags..." className="pl-10 h-10 shadow-sm" />
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" className="gap-2 h-10 shadow-sm">
                    <Filter className="h-4 w-4" />
                    Filters
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2 h-10 shadow-sm">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                  <Button size="sm" className="gap-2 bg-accent hover:bg-accent/90 h-10 shadow-md">
                    <UserPlus className="h-4 w-4" />
                    New Lead
                  </Button>
                </div>
              </div>

              {/* Multi-Stream Tabs */}
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full flex h-auto p-1 bg-slate-100 rounded-xl overflow-x-auto justify-start no-scrollbar">
                  <TabsTrigger value="all" className="flex-1 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    All Leads ({MOCK_CONTACTS.length})
                  </TabsTrigger>
                  {Object.entries(SOURCE_CONFIG).map(([key, config]) => {
                    const count = MOCK_CONTACTS.filter(c => c.archagent_source === key).length;
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
                        <TableHead className="w-[240px] font-bold text-slate-700">Lead</TableHead>
                        <TableHead className="font-bold text-slate-700">Property Details</TableHead>
                        <TableHead className="font-bold text-slate-700">ICP Score</TableHead>
                        <TableHead className="font-bold text-slate-700">Intelligence Tags</TableHead>
                        <TableHead className="font-bold text-slate-700">Status</TableHead>
                        <TableHead className="text-right font-bold text-slate-700">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContacts.length > 0 ? (
                        filteredContacts.map((contact) => (
                          <TableRow key={contact.id} className="cursor-pointer hover:bg-slate-50/50 border-slate-100" onClick={() => handleViewDetails(contact)}>
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
                                  {contact.property_type.replace('_', ' ')} • LTV: {contact.loan_to_value}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col gap-1 w-16">
                                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                                    <div 
                                      className={`h-full ${contact.icpScore > 80 ? 'bg-green-500' : contact.icpScore > 60 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                      style={{ width: `${contact.icpScore}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] text-muted-foreground font-bold">{contact.icpScore}/99</span>
                                </div>
                                {contact.likely_to_list_score && contact.likely_to_list_score > 70 && (
                                  <TrendingUp className="h-4 w-4 text-green-600" title="Likely to List" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {contact.archagent_tags.slice(0, 2).map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-[9px] h-5 py-0 px-1.5 bg-blue-50 text-blue-700 border-blue-100">
                                    {tag.replace('_', ' ')}
                                  </Badge>
                                ))}
                                {contact.archagent_tags.length > 2 && (
                                  <span className="text-[9px] text-muted-foreground">+{contact.archagent_tags.length - 2}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={contact.status === 'Closed' ? 'default' : 'outline'}
                                className={`text-[10px] font-bold ${contact.status === 'Urgent' ? 'bg-red-50 border-red-200 text-red-700' : contact.status === 'Lead' ? 'border-blue-200 text-blue-700 bg-blue-50' : ''}`}
                              >
                                {contact.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 rounded-full">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 shadow-xl">
                                  <DropdownMenuItem onClick={() => handleViewDetails(contact)}>View Intelligence</DropdownMenuItem>
                                  <DropdownMenuItem>Assign Sequence</DropdownMenuItem>
                                  <DropdownMenuItem>Score Intelligence</DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">Archive Lead</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                            No fresh leads in this stream today.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Tabs>
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
