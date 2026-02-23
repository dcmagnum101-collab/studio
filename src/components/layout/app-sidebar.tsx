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
  Home,
  Database,
  Building2,
  Wrench,
  MessageSquare
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
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { signOut } from 'firebase/auth'
import { initializeFirebase } from '@/firebase/init'
import { collection, query, where } from "firebase/firestore"

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()
  const firestore = useFirestore()
  
  // Real-time unread count
  const unreadQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null
    return query(collection(firestore, "users", user.uid, "contacts"), where("unreadSMSCount", ">", 0))
  }, [user, firestore])

  const { data: unreadContacts } = useCollection(unreadQuery)
  const unreadCount = unreadContacts?.length || 0

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Setup Guide", href: "/setup-guide", icon: Wrench },
    { name: "Inbox", href: "/inbox", icon: MessageSquare, badge: unreadCount },
    { name: "Prospector", href: "/contacts", icon: Users },
    { name: "MLS Intel", href: "/mls-intelligence", icon: Building2 },
    { name: "Sources Hub", href: "/sources", icon: Database },
    { name: "Pipeline", href: "/pipeline", icon: Trello },
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Calendar", href: "/calendar", icon: CalendarDays },
    { name: "Farm Zones", href: "/farm", icon: Map },
    { name: "Open House", href: "/open-house", icon: Home },
    { name: "Outreach Builder", href: "/outreach", icon: Sparkles },
    { name: "Analytics", href: "/analytics", icon: PieChart },
    { name: "Settings", href: "/settings", icon: Settings },
  ]

  const handleSignOut = async () => {
    try {
      const { auth } = initializeFirebase();
      await signOut(auth);
      // The FirebaseProvider automatically clears the cookie on auth state change
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="py-6 px-4">
        <div className="flex items-center gap-3">
          <div className="bg-accent rounded-lg p-2 text-accent-foreground shadow-lg">
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="font-headline font-bold text-xl tracking-tight group-data-[collapsible=icon]:hidden text-primary text-nowrap">
            Monica AI Hub
          </span>
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