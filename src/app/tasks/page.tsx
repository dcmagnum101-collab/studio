"use client"

import React, { useState, useEffect } from "react"
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
  AlertCircle, 
  Phone, 
  Mail, 
  MessageSquare,
  Sparkles,
  ArrowRight,
  Plus
} from "lucide-react"
import { format } from "date-fns"
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase"
import { collection, query, doc, orderBy } from "firebase/firestore"
import Link from "next/link"

export default function TasksPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const tasksQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'tasks'),
      orderBy('due_date', 'asc')
    );
  }, [firestore, user]);

  const { data: tasks, isLoading } = useCollection(tasksQuery);

  const toggleTask = (id: string, currentStatus: string) => {
    if (!firestore || !user) return;
    const taskRef = doc(firestore, 'users', user.uid, 'tasks', id);
    updateDocumentNonBlocking(taskRef, {
      status: currentStatus === 'completed' ? 'pending' : 'completed',
      completed_at: currentStatus === 'completed' ? null : new Date().toISOString()
    });
  };

  const priorityColors = {
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
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-xl font-bold font-headline text-primary">Task Manager</h1>
            <Button size="sm" className="ml-auto gap-2 bg-accent hover:bg-accent/90">
              <Plus className="h-4 w-4" /> New Task
            </Button>
          </header>
          
          <main className="p-8 max-w-5xl mx-auto w-full space-y-8">
            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary text-white rounded-lg">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-primary">Monica's Daily Focus</h3>
                  <p className="text-xs text-muted-foreground">Focus on your Power Hour tasks to advance your pipeline.</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="text-xs font-bold border-primary/20 text-primary">Start Power Hour</Button>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <section className="space-y-4">
                  <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                    <Clock className="h-5 w-5 text-accent" />
                    Due Today
                  </h2>
                  <div className="space-y-3">
                    {isLoading ? (
                      <p className="text-center py-10 text-xs text-muted-foreground">Loading tasks...</p>
                    ) : tasks && tasks.filter(t => t.status !== 'completed').length > 0 ? (
                      tasks.filter(t => t.status !== 'completed').map((task) => (
                        <Card key={task.id} className="border-none shadow-sm hover:shadow-md transition-all">
                          <CardContent className="p-4 flex gap-4">
                            <Checkbox 
                              checked={task.status === 'completed'} 
                              onCheckedChange={() => toggleTask(task.id, task.status)}
                              className="mt-1"
                            />
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="text-sm font-bold text-primary">{task.title}</h4>
                                  <p className="text-xs text-muted-foreground mt-0.5">{task.contact_name}</p>
                                </div>
                                <Badge className={`text-[9px] font-bold uppercase tracking-wider ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                                  {task.priority}
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-600 line-clamp-2 italic">"{task.description}"</p>
                              {task.ai_reason && (
                                <div className="text-[10px] bg-accent/5 text-accent p-2 rounded-lg border border-accent/10 flex items-center gap-2">
                                  <Sparkles className="h-3 w-3" />
                                  Monica AI: {task.ai_reason}
                                </div>
                              )}
                              <div className="flex items-center gap-4 pt-1">
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold">
                                  <Calendar className="h-3 w-3" /> {format(new Date(task.due_date), 'h:mm a')}
                                </div>
                                <div className="flex items-center gap-2">
                                  {task.type === 'call' && (
                                    <Link href={`/contacts/${task.contactId}`}>
                                      <Button size="sm" className="h-7 text-[10px] gap-1 px-2"><Phone className="h-3 w-3" /> Call</Button>
                                    </Link>
                                  )}
                                  {task.type === 'sms' && (
                                    <Link href={`/contacts/${task.contactId}`}>
                                      <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 px-2"><MessageSquare className="h-3 w-3" /> SMS</Button>
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-10 border border-dashed rounded-xl">
                        <p className="text-xs text-muted-foreground">No tasks due today.</p>
                      </div>
                    )}
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-lg font-bold text-slate-400 flex items-center gap-2">
                    <CheckSquare className="h-5 w-5" />
                    Completed
                  </h2>
                  <div className="space-y-3 opacity-60">
                    {tasks && tasks.filter(t => t.status === 'completed').map((task) => (
                      <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-dashed">
                        <Checkbox checked onCheckedChange={() => toggleTask(task.id, task.status)} />
                        <span className="text-sm line-through text-slate-500">{task.title}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                <Card className="shadow-lg border-none">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-accent" />
                      AI Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 bg-slate-50 rounded-xl space-y-2 border">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Re-engagement</p>
                      <p className="text-xs font-medium">Monica detected 3 leads that haven't been contacted in 5+ days.</p>
                      <Button variant="link" size="sm" className="h-auto p-0 text-xs font-bold text-accent">Bulk Create Tasks <ArrowRight className="h-3 w-3 ml-1" /></Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-none bg-primary text-white">
                  <CardContent className="p-6 text-center space-y-4">
                    <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center mx-auto ring-8 ring-white/10">
                      <AlertCircle className="h-8 w-8 text-white" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold">Power Hour Focus</h3>
                      <p className="text-xs text-white/70">Connect with high-intent leads from ArchAgent Expireds.</p>
                    </div>
                    <Button className="w-full bg-white text-primary font-bold hover:bg-white/90">View Strategy</Button>
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
