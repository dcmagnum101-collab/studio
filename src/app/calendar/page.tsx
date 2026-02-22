
"use client";

import React, { useState } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  MoreVertical,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { useAppointments, useTasks } from "@/hooks/useFirestoreData";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");

  const { data: appointments, isLoading: apptsLoading } = useAppointments();
  const { data: tasks, isLoading: tasksLoading } = useTasks();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const getDayEvents = (day: Date) => {
    const dayAppts = (appointments || []).filter((appt) => isSameDay(new Date(appt.date), day));
    const dayTasks = (tasks || []).filter((task) => isSameDay(new Date(task.due_date), day));
    return { dayAppts, dayTasks };
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const loading = apptsLoading || tasksLoading;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-white shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-xl font-bold font-headline text-primary">Schedule & Appointments</h1>

            <div className="ml-auto flex items-center gap-4">
              {loading && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
              <div className="flex items-center bg-slate-100 rounded-lg p-1">
                <Button
                  variant={view === "month" ? "secondary" : "ghost"}
                  size="sm"
                  className={`text-xs h-8 ${view === "month" ? "bg-white shadow-sm" : ""}`}
                  onClick={() => setView("month")}
                >
                  Month
                </Button>
                <Button
                  variant={view === "week" ? "secondary" : "ghost"}
                  size="sm"
                  className={`text-xs h-8 ${view === "week" ? "bg-white shadow-sm" : ""}`}
                  onClick={() => setView("week")}
                >
                  Week
                </Button>
                <Button
                  variant={view === "day" ? "secondary" : "ghost"}
                  size="sm"
                  className={`text-xs h-8 ${view === "day" ? "bg-white shadow-sm" : ""}`}
                  onClick={() => setView("day")}
                >
                  Day
                </Button>
              </div>
              <Button size="sm" className="gap-2 bg-accent hover:bg-accent/90">
                <Plus className="h-4 w-4" /> Book Appointment
              </Button>
            </div>
          </header>

          <main className="flex h-[calc(100vh-64px)] overflow-hidden">
            <div className="flex-1 flex flex-col p-6 bg-slate-50/30 overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-black text-primary">{format(currentDate, "MMMM yyyy")}</h2>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={goToToday}>
                      Today
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex-1 border rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col">
                <div className="grid grid-cols-7 border-b bg-slate-50/50">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div
                      key={day}
                      className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="flex-1 grid grid-cols-7 grid-rows-5 overflow-y-auto">
                  {calendarDays.map((day, idx) => {
                    const { dayAppts, dayTasks } = getDayEvents(day);
                    const isToday = isSameDay(day, new Date());
                    const isCurrentMonth = isSameMonth(day, monthStart);

                    return (
                      <div
                        key={idx}
                        className={`min-h-[120px] border-r border-b p-2 transition-colors hover:bg-slate-50/50 flex flex-col gap-1 ${!isCurrentMonth ? "bg-slate-50/30 text-slate-400" : ""}`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span
                            className={`text-xs font-bold h-6 w-6 flex items-center justify-center rounded-full ${isToday ? "bg-primary text-white" : ""}`}
                          >
                            {format(day, "d")}
                          </span>
                        </div>

                        <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                          {dayAppts.map((appt) => (
                            <div
                              key={appt.id}
                              className="bg-blue-100 text-blue-700 text-[10px] p-1 rounded-md border border-blue-200 truncate font-medium flex items-center gap-1"
                            >
                              <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                              {appt.title}
                            </div>
                          ))}
                          {dayTasks.map((task) => (
                            <div
                              key={task.id}
                              className="bg-yellow-100 text-yellow-700 text-[10px] p-1 rounded-md border border-yellow-200 truncate font-medium flex items-center gap-1"
                            >
                              <div className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                              {task.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <aside className="w-80 border-l bg-white p-6 space-y-8 overflow-y-auto">
              <section className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-accent" />
                  Upcoming Today
                </h3>
                <div className="space-y-3">
                  {appointments &&
                  appointments.filter((a) => isSameDay(new Date(a.date), new Date())).length > 0 ? (
                    appointments
                      .filter((a) => isSameDay(new Date(a.date), new Date()))
                      .map((appt) => (
                        <Card key={appt.id} className="border-none shadow-sm bg-blue-50/50">
                          <CardContent className="p-4 space-y-2">
                            <div className="flex justify-between items-start">
                              <Badge className="bg-blue-600 text-[9px] h-4">Appointment</Badge>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </div>
                            <h4 className="text-sm font-bold text-blue-900">{appt.title}</h4>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-[10px] text-blue-700">
                                <Clock className="h-3 w-3" /> {format(new Date(appt.date), "h:mm a")} (
                                {appt.duration_minutes} min)
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-blue-700">
                                <MapPin className="h-3 w-3" /> {appt.address}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-blue-700">
                                <User className="h-3 w-3" /> {appt.contact_name}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                  ) : (
                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-xs text-muted-foreground italic">No appointments today</p>
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Tasks Overdue
                </h3>
                <div className="space-y-2">
                  {tasks &&
                    tasks
                      .filter((t) => t.priority === "urgent" && t.status !== "completed")
                      .map((task) => (
                        <div
                          key={task.id}
                          className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3"
                        >
                          <div className="h-2 w-2 rounded-full bg-red-500 mt-1" />
                          <div>
                            <p className="text-xs font-bold text-red-900">{task.title}</p>
                            <p className="text-[10px] text-red-700">{task.contact_name}</p>
                          </div>
                        </div>
                      ))}
                  {tasks?.filter((t) => t.priority === "urgent" && t.status !== "completed").length === 0 && (
                    <p className="text-[10px] text-muted-foreground text-center italic py-4">No urgent tasks overdue.</p>
                  )}
                </div>
              </section>
            </aside>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
