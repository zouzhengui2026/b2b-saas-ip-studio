"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  AtSign,
  BookOpen,
  FileText,
  BookMarked,
  Target,
  Mic,
  CalendarCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bot,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assistant", label: "智能助手", icon: Bot },
  { href: "/personas", label: "IP管理", icon: Users },
  { href: "/accounts", label: "账号管理", icon: AtSign },
  { href: "/references", label: "参考库", icon: BookOpen },
  { href: "/contents", label: "内容工单", icon: FileText },
  { href: "/ledger", label: "内容资产账本", icon: BookMarked },
  { href: "/leads", label: "线索工单", icon: Target },
  { href: "/inbox", label: "语音Inbox", icon: Mic },
  { href: "/weekly-review", label: "周复盘", icon: CalendarCheck },
  { href: "/settings", label: "设置", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "h-screen bg-card border-r border-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-60",
      )}
    >
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border">
        {!collapsed && <span className="font-semibold text-lg text-foreground">SaaS后台</span>}
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="h-8 w-8">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
