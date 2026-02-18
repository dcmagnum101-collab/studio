
"use client"

import React from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MOCK_CONTACTS, Contact } from "@/lib/mock-data";
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
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ContactDetailsSheet } from "@/components/contacts/contact-details-sheet";

export default function ContactsPage() {
  const [selectedContact, setSelectedContact] = React.useState<Contact | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const handleViewDetails = (contact: Contact) => {
    setSelectedContact(contact);
    setSheetOpen(true);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-xl font-bold font-headline text-primary">Lead Database</h1>
          </header>
          
          <main className="p-8 max-w-7xl mx-auto w-full">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search name, address, or email..." className="pl-10" />
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                  <Button size="sm" className="gap-2 bg-accent hover:bg-accent/90">
                    <UserPlus className="h-4 w-4" />
                    New Lead
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="w-[200px]">Contact</TableHead>
                      <TableHead>Property Address</TableHead>
                      <TableHead>ICP Score</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>DNC</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_CONTACTS.map((contact) => (
                      <TableRow key={contact.id} className="cursor-pointer hover:bg-slate-50/50" onClick={() => handleViewDetails(contact)}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-primary">{contact.name}</span>
                            <span className="text-xs text-muted-foreground">{contact.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{contact.propertyAddress}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div 
                                className={`h-full ${contact.icpScore > 80 ? 'bg-green-500' : contact.icpScore > 60 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                style={{ width: `${contact.icpScore}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold">{contact.icpScore}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal">
                            {contact.source}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={contact.status === 'Closed' ? 'default' : 'outline'}
                            className={contact.status === 'Lead' ? 'border-blue-200 text-blue-700 bg-blue-50' : ''}
                          >
                            {contact.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {contact.dnc ? (
                            <Badge variant="destructive" className="gap-1 px-1 h-5">
                              <AlertCircle className="h-3 w-3" />
                              DNC
                            </Badge>
                          ) : (
                            <span className="text-xs text-green-600 font-medium">Safe</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(contact)}>View Details</DropdownMenuItem>
                              <DropdownMenuItem>Edit Contact</DropdownMenuItem>
                              <DropdownMenuItem>Score Again</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
