
"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Users,
  Settings,
  PieChart,
  LogOut,
  Sparkles,
  Map,
  Trello,
  CheckSquare,
  CalendarDays,
  Database,
  Building2,
  MessageSquare,
  FileBarChart,
  BrainCircuit,
  Bell,
  RefreshCw,
  X,
  ArrowRight,
  Upload,
  Home,
  Mail,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase"
import { signOut } from 'firebase/auth'
import { initializeFirebase } from '@/firebase/init'
import { collection, query, where, orderBy, limit, doc } from "firebase/firestore"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()
  const firestore = useFirestore()

  // Real-time unread SMS count
  const unreadQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null
    return query(collection(firestore, "users", user.uid, "contacts"), where("unreadSMSCount", ">", 0))
  }, [user, firestore])

  const { data: unreadContacts } = useCollection(unreadQuery)
  const unreadSMSCount = unreadContacts?.length || 0

  // Hot Alerts Query
  const alertsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null
    return query(
      collection(firestore, "users", user.uid, "alerts"),
      where("read", "==", false),
      orderBy("created_at", "desc"),
      limit(10)
    )
  }, [user, firestore])

  const { data: hotAlerts, isLoading: alertsLoading } = useCollection(alertsQuery)
  const unreadAlertsCount = hotAlerts?.length || 0

  // Navigation — most used at top, plain English labels
  const navigation = [
    { name: "Home", href: "/", icon: LayoutDashboard },
    { name: "My Leads", href: "/contacts", icon: Users },
    { name: "Import Leads", href: "/sources", icon: Upload },
    { name: "Pipeline", href: "/pipeline", icon: Trello },
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Calendar", href: "/calendar", icon: CalendarDays },
    { name: "Write Outreach", href: "/outreach", icon: Sparkles },
    { name: "Inbox", href: "/inbox", icon: MessageSquare, badge: unreadSMSCount },
    { name: "Practice Scripts", href: "/objection-coach", icon: BrainCircuit },
    { name: "My Farm", href: "/farm", icon: Map },
    { name: "Open Houses", href: "/open-house", icon: Home },
    { name: "Market Activity", href: "/mls-intelligence", icon: Building2 },
    { name: "Neighborhood Reports", href: "/market-report", icon: FileBarChart },
    { name: "My Stats", href: "/analytics", icon: PieChart },
    { name: "Settings", href: "/settings", icon: Settings },
  ]

  const handleMarkRead = (alertId: string) => {
    if (!user || !firestore) return;
    const alertRef = doc(firestore, `users/${user.uid}/alerts/${alertId}`);
    updateDocumentNonBlocking(alertRef, { read: true });
  };

  const handleSignOut = async () => {
    try {
      const { auth } = initializeFirebase();
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="py-6 px-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-accent rounded-lg p-2 text-accent-foreground shadow-lg shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="font-headline font-bold text-xl tracking-tight group-data-[collapsible=icon]:hidden text-primary text-nowrap">
            Monica AI Hub
          </span>
        </div>

        <div className="group-data-[collapsible=icon]:hidden">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-10 w-10 text-primary/60 hover:text-primary hover:bg-primary/5 rounded-xl">
                <Bell className="h-5 w-5" />
                {unreadAlertsCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 border-2 border-white text-white p-0 flex items-center justify-center text-[10px] font-black rounded-full animate-in zoom-in shadow-sm">
                    {unreadAlertsCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent side="right" align="start" className="w-80 p-0 overflow-hidden rounded-[1.5rem] border-none shadow-2xl">
              <header className="bg-primary text-white p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-accent" />
                  <h3 className="font-black text-xs uppercase tracking-widest">Hot Alerts</h3>
                </div>
                {alertsLoading && <RefreshCw className="h-3 w-3 animate-spin opacity-50" />}
              </header>
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 bg-white">
                {hotAlerts && hotAlerts.length > 0 ? (
                  hotAlerts.map((alert) => (
                    <div key={alert.id} className="p-4 space-y-2 hover:bg-slate-50 transition-colors group relative">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] font-black text-primary uppercase tracking-tighter flex items-center gap-1.5">
                          <div className={`h-1.5 w-1.5 rounded-full ${alert.type === 'icp' ? 'bg-orange-500' : alert.type === 'sms' ? 'bg-blue-500' : 'bg-red-500'}`} />
                          {alert.title}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                          onClick={() => handleMarkRead(alert.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{alert.message}</p>
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-[8px] font-bold text-slate-400 uppercase">
                          {alert.created_at ? format(alert.created_at.toDate(), 'h:mm a') : 'Just now'}
                        </span>
                        <Link href={`/contacts/${alert.leadId}`}>
                          <Button variant="link" className="h-auto p-0 text-[10px] font-black text-primary uppercase gap-1">
                            View <ArrowRight className="h-2.5 w-2.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center space-y-3">
                    <CheckSquare className="h-8 w-8 text-slate-100 mx-auto" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No active alerts</p>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu className="px-2">
          {navigation.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.name}
                className="hover:bg-sidebar-accent transition-all duration-200"
              >
                <Link href={item.href} className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <item.icon />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && item.badge > 0 && (
                    <span className="bg-accent text-primary text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center shrink-0">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarSeparator className="mb-4 opacity-20" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleSignOut}
            >
              <LogOut />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
