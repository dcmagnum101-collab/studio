
"use client"

import React, { useState } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Card, CardContent } from "@/components/ui/card"
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
  Filter,
  RefreshCw,
  MoreVertical,
  CalendarCheck
} from "lucide-react"
import { format } from "date-fns"
import { useUser, useFirestore } from "@/firebase"
import Link from "next/link"
import { useTasks } from "@/hooks/useFirestoreData"
import { completeTaskAction, snoozeTaskAction, archiveTaskAction } from "@/app/actions/tasks"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"

export default function TasksPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending");
  const { data: tasks, isLoading } = useTasks(activeTab);

  const handleComplete = async (taskId: string) => {
    if (!user) return;
    try {
      await completeTaskAction(user.uid, taskId);
      toast({ title: "Completed", description: "Cadence updated." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  const handleSnooze = async (taskId: string, days: number) => {
    if (!user) return;
    try {
      await snoozeTaskAction(user.uid, taskId, days);
      toast({ title: "Snoozed", description: `Task moved ${days} days.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  const handleArchive = async (taskId: string) => {
    if (!user) return;
    try {
      await archiveTaskAction(user.uid, taskId);
      toast({ title: "Archived", description: "Task removed." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  const priorityColors: Record<string, string> = {
    urgent: 'text-red-600 bg-red-50 border-red-200',
    high: 'text-orange-600 bg-orange-50 border-orange-200',
    normal: 'text-blue-600 bg-blue-50 border-blue-200',
    low: 'text-slate-600 bg-slate-50 border-slate-200',
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="h-4 w-4" />;
      case 'email': return <MessageSquare className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'appointment': return <CalendarCheck className="h-4 w-4" />;
      default: return <CheckSquare className="h-4 w-4" />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 md:px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-base md:text-xl font-bold font-headline text-primary truncate">Follow-up Agenda</h1>
            <Button size="sm" className="ml-auto gap-2 bg-accent hover:bg-accent/90 rounded-xl h-9 shadow-md font-black text-[10px] uppercase tracking-widest px-4">
              <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Add Task</span>
            </Button>
          </header>
          
          <main className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6 md:space-y-8 pb-24">
            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary text-white rounded-xl shadow-lg">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-xs sm:text-sm font-black text-primary uppercase tracking-widest">Daily Power Hour</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Monica has prioritized {tasks?.filter(t => t.priority === 'urgent').length || 0} urgent deals.</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full sm:w-auto text-[10px] font-black uppercase tracking-widest border-primary/20 text-primary bg-white h-11 sm:h-10 px-6 rounded-xl shadow-sm">Start Execution</Button>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <div className="flex items-center justify-between mb-6">
                <TabsList className="bg-slate-100 p-1 rounded-xl h-11 flex-1 sm:flex-none">
                  <TabsTrigger value="pending" className="flex-1 sm:flex-none rounded-lg font-bold text-xs px-6 data-[state=active]:bg-white">Agenda</TabsTrigger>
                  <TabsTrigger value="completed" className="flex-1 sm:flex-none rounded-lg font-bold text-xs px-6 data-[state=active]:bg-white">History</TabsTrigger>
                </TabsList>
                <div className="hidden sm:flex items-center gap-2 ml-4">
                  {isLoading && <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />}
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-primary h-11 w-11 rounded-xl">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <TabsContent value="pending" className="space-y-4">
                {tasks && tasks.length > 0 ? (
                  tasks.map((task) => (
                    <Card key={task.id} className="border-none shadow-md hover:shadow-xl transition-all rounded-2xl overflow-hidden group">
                      <CardContent className="p-4 md:p-5 flex gap-4">
                        <div className="pt-1">
                          <Checkbox 
                            onCheckedChange={() => handleComplete(task.id)}
                            className="h-7 w-7 sm:h-6 sm:w-6 rounded-lg border-2 border-primary/20 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                          />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-sm md:text-base font-bold text-primary group-hover:text-accent transition-colors">{task.title}</h4>
                              <Link href={`/contacts/${task.contactId}`} className="inline-flex items-center gap-1.5 mt-1 hover:underline">
                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">{task.contact_name}</span>
                                <ArrowRight className="h-3 w-3 text-slate-300" />
                              </Link>
                            </div>
                            <div className="flex items-center gap-1">
                              <Badge className={`text-[8px] font-black uppercase tracking-widest h-5 px-2 whitespace-nowrap ${priorityColors[task.priority] || ''}`}>
                                {task.priority}
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 rounded-full"><MoreVertical className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl shadow-2xl">
                                  <DropdownMenuItem onClick={() => handleSnooze(task.id, 1)} className="text-xs font-bold gap-2 py-3 sm:py-2">Snooze 1 Day</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleSnooze(task.id, 3)} className="text-xs font-bold gap-2 py-3 sm:py-2">Snooze 3 Days</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleArchive(task.id)} className="text-red-600 font-bold text-xs gap-2 py-3 sm:py-2">Archive Task</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          
                          {task.description && (
                            <p className="text-xs text-slate-600 leading-relaxed italic border-l-2 border-slate-100 pl-3">"{task.description}"</p>
                          )}

                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                            <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                              <Clock className="h-3 w-3" /> {task.due_date ? format(new Date(task.due_date), 'MMM d, h:mm a') : 'ANYTIME'}
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <Link href={`/contacts/${task.contactId}`} className="flex-1 sm:flex-none">
                                <Button size="sm" className="w-full h-11 sm:h-8 text-[10px] font-black uppercase tracking-widest gap-2 rounded-xl bg-primary shadow-lg shadow-primary/10">
                                  {getTypeIcon(task.type)}
                                  Execute
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-24 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                    <CheckSquare className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-sm text-slate-400 font-medium italic">Agenda is clear. Great work!</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="completed" className="space-y-3 opacity-70">
                {tasks?.map((task) => (
                  <div key={task.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 group">
                    <Checkbox checked className="h-5 w-5 opacity-50" />
                    <div className="flex-1">
                      <p className="text-xs font-bold line-through text-slate-500">{task.title}</p>
                      <p className="text-[10px] text-slate-400">{task.contact_name} • {task.completed_at ? format(new Date(task.completed_at), 'MMM d') : 'Done'}</p>
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
