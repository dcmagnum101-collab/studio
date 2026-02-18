
"use client"

import { Contact } from "@/lib/mock-data"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Phone, Mail, MapPin, History, Activity, Calendar, FileText } from "lucide-react"

interface ContactDetailsSheetProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactDetailsSheet({ contact, open, onOpenChange }: ContactDetailsSheetProps) {
  if (!contact) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md w-full">
        <SheetHeader>
          <div className="flex justify-between items-start">
            <SheetTitle className="text-2xl font-bold font-headline text-primary">{contact.name}</SheetTitle>
            <Badge className="bg-accent text-white">Score: {contact.icpScore}</Badge>
          </div>
          <SheetDescription className="flex items-center gap-2">
            <Activity className="h-3 w-3" /> Status: {contact.status}
          </SheetDescription>
        </SheetHeader>

        <Separator className="my-6" />

        <ScrollArea className="h-[calc(100vh-200px)] pr-4">
          <div className="space-y-6">
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Contact Info</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>{contact.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>{contact.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{contact.propertyAddress}</span>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Seller Motivation</h3>
              <div className="p-3 bg-secondary rounded-lg text-sm italic">
                "{contact.motivation}"
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <History className="h-4 w-4" /> Activity Logs
                </h3>
              </div>
              
              <div className="space-y-4">
                {contact.activityLogs.length > 0 ? (
                  contact.activityLogs.map((log) => (
                    <div key={log.id} className="relative pl-6 pb-4 border-l border-slate-200 last:border-0 last:pb-0">
                      <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-primary" />
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-primary flex items-center gap-1 capitalize">
                            {log.type === 'call' && <Phone className="h-3 w-3" />}
                            {log.type === 'email' && <Mail className="h-3 w-3" />}
                            {log.type}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{new Date(log.date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm font-medium">{log.outcome}</p>
                        <p className="text-xs text-muted-foreground">{log.summary}</p>
                        {log.nextAction && (
                          <div className="mt-2 text-[10px] px-2 py-1 bg-accent/10 text-accent rounded flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Next: {log.nextAction}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 border-2 border-dashed rounded-lg bg-slate-50">
                    <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No recent activity logged</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
