
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
  Wrench
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
import { usePathname } from "next/navigation"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Setup Guide", href: "/setup-guide", icon: Wrench },
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

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="py-6 px-4">
        <div className="flex items-center gap-3">
          <div className="bg-accent rounded-lg p-2 text-accent-foreground shadow-lg">
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="font-headline font-bold text-xl tracking-tight group-data-[collapsible=icon]:hidden">
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
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.name}</span>
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
            <SidebarMenuButton className="text-red-300 hover:text-red-100 hover:bg-red-900/20">
              <LogOut />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
