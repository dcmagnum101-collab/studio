
"use client"

import React from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { MOCK_TASKS, Task } from "@/lib/mock-data"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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

export default function TasksPage() {
  const [tasks, setTasks] = React.useState<Task[]>(MOCK_TASKS);

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t));
  };

  const priorityColors = {
    urgent: 'text-red-600 bg-red-50 border-red-200',
    high: 'text-orange-600 bg-orange-50 border-orange-200',
    normal: 'text-blue-600 bg-blue-50 border-blue-200',
    low: 'text-slate-600 bg-slate-50 border-slate-200',
  };

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
            {/* AI Insights Bar */}
            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary text-white rounded-lg">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-primary">Monica's Daily Focus</h3>
                  <p className="text-xs text-muted-foreground">You have 3 urgent calls requested for this morning based on lead intent.</p>
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
                    {tasks.filter(t => t.status !== 'completed').map((task) => (
                      <Card key={task.id} className="border-none shadow-sm hover:shadow-md transition-all">
                        <CardContent className="p-4 flex gap-4">
                          <Checkbox 
                            checked={task.status === 'completed'} 
                            onCheckedChange={() => toggleTask(task.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="text-sm font-bold text-primary">{task.title}</h4>
                                <p className="text-xs text-muted-foreground mt-0.5">{task.contact_name}</p>
                              </div>
                              <Badge className={`text-[9px] font-bold uppercase tracking-wider ${priorityColors[task.priority]}`}>
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
                                {task.type === 'call' && <Button size="sm" className="h-7 text-[10px] gap-1 px-2"><Phone className="h-3 w-3" /> Call</Button>}
                                {task.type === 'sms' && <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 px-2"><MessageSquare className="h-3 w-3" /> SMS</Button>}
                                {task.type === 'email' && <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 px-2"><Mail className="h-3 w-3" /> Email</Button>}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-lg font-bold text-slate-400 flex items-center gap-2">
                    <CheckSquare className="h-5 w-5" />
                    Completed
                  </h2>
                  <div className="space-y-3 opacity-60">
                    {tasks.filter(t => t.status === 'completed').map((task) => (
                      <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-dashed">
                        <Checkbox checked readOnly />
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
                      <p className="text-xs font-medium">You haven't contacted <span className="text-primary font-bold">Jessica Williams</span> in 3 days. Her intent is high.</p>
                      <Button variant="link" size="sm" className="h-auto p-0 text-xs font-bold text-accent">Create Call Task <ArrowRight className="h-3 w-3 ml-1" /></Button>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl space-y-2 border">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Best Time to Call</p>
                      <p className="text-xs font-medium">Michael Chen usually answers around <span className="text-primary font-bold">2:00 PM</span>. Schedule your callback then.</p>
                      <Button variant="link" size="sm" className="h-auto p-0 text-xs font-bold text-accent">Schedule Callback <ArrowRight className="h-3 w-3 ml-1" /></Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-none bg-primary text-white">
                  <CardContent className="p-6 text-center space-y-4">
                    <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center mx-auto ring-8 ring-white/10">
                      <AlertCircle className="h-8 w-8 text-white" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold">Next Milestone</h3>
                      <p className="text-xs text-white/70">Sarah Johnson Listing Presentation</p>
                    </div>
                    <div className="text-2xl font-black">2 Days Away</div>
                    <Button className="w-full bg-white text-primary font-bold hover:bg-white/90">View Prep Brief</Button>
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
