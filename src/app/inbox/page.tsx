"use client"
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  MessageSquare, 
  Send, 
  Search, 
  Phone, 
  MoreVertical, 
  CheckCheck, 
  User, 
  RefreshCw,
  Clock,
  Sparkles,
  ArrowLeft
} from "lucide-react"
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, where, doc, limit } from "firebase/firestore"
import { format } from "date-fns"
import { sendSMSAction } from "@/app/actions/twilio"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function SMSInboxPage() {
  const { user } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()
  const [selectedContact, setSelectedContact] = useState<any | null>(null)
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // 1. Fetch Conversations (Contacts with message activity)
  const convoQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null
    return query(
      collection(firestore, "users", user.uid, "contacts"),
      where("lastMessageSnippet", "!=", null),
      orderBy("lastContactDate", "desc")
    )
  }, [user, firestore])

  const { data: convos, isLoading: convosLoading } = useCollection(convoQuery)

  // 2. Fetch Thread for Selected Contact
  const threadQuery = useMemoFirebase(() => {
    if (!user || !firestore || !selectedContact) return null
    return query(
      collection(firestore, "users", user.uid, "contacts", selectedContact.id, "sms_thread"),
      orderBy("timestamp", "asc"),
      limit(100)
    )
  }, [user, firestore, selectedContact])

  const { data: thread } = useCollection(threadQuery)

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [thread])

  // Mark as Read
  useEffect(() => {
    if (selectedContact?.unreadSMSCount > 0 && user) {
      const ref = doc(firestore, `users/${user.uid}/contacts/${selectedContact.id}`)
      updateDocumentNonBlocking(ref, { unreadSMSCount: 0 })
    }
  }, [selectedContact, user, firestore])

  // Request Notifications Permission
  useEffect(() => {
    if (typeof window !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !selectedContact || !user || sending) return

    setSending(true)
    try {
      await sendSMSAction({
        userId: user.uid,
        contactId: selectedContact.id,
        to: selectedContact.phone,
        body: message
      })
      setMessage("")
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to send", description: err.message })
    } finally {
      setSending(false)
    }
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-xl font-bold font-headline text-primary">SMS Command Center</h1>
            {convosLoading && <RefreshCw className="ml-auto h-4 w-4 animate-spin text-slate-300" />}
          </header>

          <main className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50/30">
            {/* Conversation List */}
            <aside className={`w-full md:w-80 lg:w-96 border-r bg-white flex flex-col transition-all ${selectedContact ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input placeholder="Search messages..." className="pl-10 h-11 bg-slate-50 border-none rounded-xl" />
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="divide-y">
                  {convos?.map((convo) => (
                    <div 
                      key={convo.id}
                      onClick={() => setSelectedContact(convo)}
                      className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors flex gap-4 relative group ${selectedContact?.id === convo.id ? 'bg-primary/5' : ''}`}
                    >
                      <Avatar className="h-12 w-12 rounded-2xl">
                        <AvatarFallback className="bg-primary text-white font-black">{convo.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-bold text-slate-900 truncate">{convo.name}</h3>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {convo.lastContactDate ? format(convo.lastContactDate.toDate(), 'h:mm a') : ''}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate leading-relaxed">
                          {convo.lastMessageSnippet || 'No messages yet'}
                        </p>
                      </div>
                      {convo.unreadSMSCount > 0 && (
                        <div className="absolute top-4 right-4 h-5 w-5 bg-accent rounded-full flex items-center justify-center text-[10px] font-black text-primary shadow-lg shadow-accent/20">
                          {convo.unreadSMSCount}
                        </div>
                      )}
                    </div>
                  ))}
                  {(!convos || convos.length === 0) && !convosLoading && (
                    <div className="p-12 text-center space-y-4">
                      <MessageSquare className="h-12 w-12 text-slate-200 mx-auto" />
                      <p className="text-sm text-slate-400 italic">No text conversations found.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </aside>

            {/* Chat Thread */}
            <section className={`flex-1 flex flex-col bg-white overflow-hidden transition-all ${!selectedContact ? 'hidden md:flex' : 'flex'}`}>
              {selectedContact ? (
                <>
                  <header className="h-16 border-b px-6 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-4">
                      <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedContact(null)}>
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold">
                          {selectedContact.name[0]}
                        </div>
                        <div>
                          <h2 className="text-sm font-black text-primary leading-none">{selectedContact.name}</h2>
                          <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">{selectedContact.phone}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" className="rounded-xl"><Phone className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="rounded-xl"><MoreVertical className="h-4 w-4" /></Button>
                    </div>
                  </header>

                  <ScrollArea className="flex-1 bg-slate-50/50 p-6">
                    <div className="max-w-3xl mx-auto space-y-6 pb-4">
                      {thread?.map((msg, i) => (
                        <div 
                          key={msg.id || i}
                          className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[80%] space-y-1`}>
                            <div 
                              className={`p-4 rounded-3xl text-sm leading-relaxed shadow-sm ${
                                msg.direction === 'outbound' 
                                  ? 'bg-primary text-white rounded-tr-none' 
                                  : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                              }`}
                            >
                              {msg.body}
                            </div>
                            <div className={`flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-slate-400 ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                              {msg.timestamp ? format(new Date(msg.timestamp), 'h:mm a') : ''}
                              {msg.direction === 'outbound' && <CheckCheck className="h-3 w-3" />}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={scrollRef} />
                    </div>
                  </ScrollArea>

                  <footer className="p-4 bg-white border-t">
                    <form onSubmit={handleSend} className="max-w-3xl mx-auto flex items-center gap-2">
                      <div className="flex-1 relative">
                        <Input 
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Type your message..."
                          className="h-12 bg-slate-50 border-none rounded-2xl pr-12 focus-visible:ring-primary"
                          disabled={sending}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                          SMS
                        </div>
                      </div>
                      <Button 
                        type="submit" 
                        disabled={!message.trim() || sending}
                        className="h-12 w-12 rounded-2xl bg-primary shadow-lg shadow-primary/20"
                      >
                        {sending ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </form>
                  </footer>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
                  <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center border-4 border-white shadow-inner">
                    <MessageSquare className="h-10 w-10 text-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-primary">No conversation selected</h3>
                    <p className="text-sm text-slate-400 max-w-xs mx-auto italic">
                      Choose a contact from the left to start coordinating your next listing.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
