
"use client"

import React, { useState, useEffect, useMemo } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { 
  CheckSquare, 
  Calendar, 
  Clock, 
  Phone, 
  MessageSquare,
  Sparkles,
  ArrowRight,
  Plus,
  Filter
} from "lucide-react"
import { format } from "date-fns"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, doc, orderBy, updateDoc } from "firebase/firestore"
import Link from "next/link"

export default function TasksPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const tasksQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'users', user.uid, 'tasks'),
      orderBy('due_date', 'asc')
    );
  }, [user, firestore]);

  const { data: tasks, loading: isLoading } = useCollection(tasksQuery);

  const toggleTask = (id: string, currentStatus: string) => {
    if (!user || !firestore) return;
    const taskRef = doc(firestore, 'users', user.uid, 'tasks', id);
    updateDoc(taskRef, {
      status: currentStatus === 'completed' ? 'pending' : 'completed',
      completed_at: currentStatus === 'completed' ? null : new Date().toISOString()
    });
  };

  const priorityColors: Record<string, string> = {
    urgent: 'text-red-600 bg-red-50 border-red-200',
    high: 'text-orange-600 bg-orange-50 border-orange-200',
    normal: 'text-blue-600 bg-blue-50 border-blue-200',
    low: 'text-slate-600 bg-slate-50 border-slate-200',
  };

  if (!mounted) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 md:px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-base md:text-xl font-bold font-headline text-primary truncate">Task Manager</h1>
            <Button size="sm" className="ml-auto gap-2 bg-accent hover:bg-accent/90 rounded-xl h-9 shadow-md font-black text-[10px] uppercase">
              <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New Task</span>
            </Button>
          </header>
          
          <main className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6 md:space-y-8">
            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary text-white rounded-xl shadow-lg shadow-primary/20">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-sm font-black text-primary uppercase tracking-widest">Monica's Daily Focus</h3>
                  <p className="text-xs text-muted-foreground font-medium">Prioritize your Power Hour to advance high-intent deals.</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full sm:w-auto text-[10px] font-black uppercase tracking-widest border-primary/20 text-primary bg-white h-10 px-6 rounded-xl">Start Power Hour</Button>
            </div>

            <div className="grid gap-6 md:gap-8 grid-cols-1 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base md:text-lg font-black flex items-center gap-2 text-slate-800 uppercase tracking-widest">
                      <Clock className="h-5 w-5 text-accent" />
                      Due Today
                    </h2>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-primary">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {isLoading ? (
                      <p className="text-center py-10 text-xs text-muted-foreground italic">Syncing agenda...</p>
                    ) : tasks && tasks.filter(t => t.status !== 'completed').length > 0 ? (
                      tasks.filter(t => t.status !== 'completed').map((task) => (
                        <Card key={task.id} className="border-none shadow-md hover:shadow-xl transition-all rounded-2xl overflow-hidden group">
                          <CardContent className="p-4 md:p-5 flex gap-4">
                            <div className="pt-1">
                              <Checkbox 
                                checked={task.status === 'completed'} 
                                onCheckedChange={() => toggleTask(task.id, task.status)}
                                className="h-5 w-5 rounded-lg border-2 border-primary/20"
                              />
                            </div>
                            <div className="flex-1 space-y-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="text-sm md:text-base font-bold text-primary group-hover:text-accent transition-colors">{task.title}</h4>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">{task.contact_name}</p>
                                </div>
                                <Badge className={`text-[8px] font-black uppercase tracking-widest h-5 px-2 ${priorityColors[task.priority] || ''}`}>
                                  {task.priority}
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed italic border-l-2 border-slate-100 pl-3">"{task.description}"</p>
                              
                              {task.ai_reason && (
                                <div className="text-[10px] bg-accent/5 text-accent p-2.5 rounded-xl border border-accent/10 flex items-center gap-2 font-medium">
                                  <Sparkles className="h-3 w-3" />
                                  Monica AI: {task.ai_reason}
                                </div>
                              )}

                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                                  <Calendar className="h-3 w-3" /> {task.due_date ? format(new Date(task.due_date), 'h:mm a') : 'ANYTIME'}
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                  {task.type === 'call' && (
                                    <Link href={`/contacts/${task.contactId}`} className="flex-1 sm:flex-none">
                                      <Button size="sm" className="w-full h-8 text-[10px] font-black uppercase tracking-widest gap-2 rounded-xl bg-primary shadow-lg shadow-primary/10">
                                        <Phone className="h-3 w-3" /> Call Lead
                                      </Button>
                                    </Link>
                                  )}
                                  {task.type === 'sms' && (
                                    <Link href={`/contacts/${task.contactId}`} className="flex-1 sm:flex-none">
                                      <Button size="sm" variant="outline" className="w-full h-8 text-[10px] font-black uppercase tracking-widest gap-2 rounded-xl border-slate-200 bg-white">
                                        <MessageSquare className="h-3 w-3 text-primary" /> Send Text
                                      </Button>
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                        <CheckSquare className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                        <p className="text-xs text-muted-foreground font-medium italic">No tasks due today. You're all caught up!</p>
                      </div>
                    )}
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-sm font-black text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                    <CheckSquare className="h-4 w-4" />
                    Archive
                  </h2>
                  <div className="space-y-2 opacity-50">
                    {tasks && tasks.filter(t => t.status === 'completed').slice(0, 5).map((task) => (
                      <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <Checkbox checked onCheckedChange={() => toggleTask(task.id, task.status)} className="h-4 w-4 rounded-md" />
                        <span className="text-xs font-bold line-through text-slate-500">{task.title}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="space-y-6 md:space-y-8">
                <Card className="shadow-xl border-none bg-gradient-to-br from-primary to-slate-900 text-white rounded-3xl overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles className="h-16 w-16" />
                  </div>
                  <CardHeader className="relative z-10">
                    <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-accent">
                      <Sparkles className="h-4 w-4 text-accent" />
                      Monica's AI Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 relative z-10">
                    <div className="p-4 bg-white/5 rounded-2xl space-y-3 border border-white/10 backdrop-blur-sm">
                      <p className="text-[10px] font-black text-accent uppercase tracking-widest">Efficiency Alert</p>
                      <p className="text-xs font-medium leading-relaxed">"Monica, I've detected 3 high-intent leads that haven't been touched in 5 days. Advance them now to prevent deal drift."</p>
                      <Button variant="link" size="sm" className="h-auto p-0 text-xs font-bold text-accent hover:text-white">
                        Bulk Create Follow-ups <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
