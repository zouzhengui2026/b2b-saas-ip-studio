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
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assistant", label: "智能助手", icon: Sparkles, highlight: true },
  { href: "/personas", label: "IP管理", icon: Users },
  { href: "/accounts", label: "账号管理", icon: AtSign },
  { href: "/references", label: "参考库", icon: BookOpen },
  { href: "/contents", label: "内容工单", icon: FileText },
  { href: "/ledger", label: "内容账本", icon: BookMarked },
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
        "h-screen flex flex-col transition-all duration-300 border-r",
        "bg-sidebar/80 backdrop-blur-xl border-sidebar-border",
        collapsed ? "w-16" : "w-60",
      )}
    >
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[oklch(0.55_0.25_280)] to-[oklch(0.60_0.20_220)] flex items-center justify-center shadow-lg">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg text-gradient">IP Studio</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[oklch(0.55_0.25_280)] to-[oklch(0.60_0.20_220)] flex items-center justify-center shadow-lg mx-auto">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
        )}
        {!collapsed && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setCollapsed(!collapsed)} 
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Collapsed toggle */}
      {collapsed && (
        <div className="flex justify-center py-2 border-b border-sidebar-border">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setCollapsed(!collapsed)} 
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map((item, index) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            const isHighlight = item.highlight
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? isHighlight
                        ? "bg-gradient-to-r from-[oklch(0.55_0.25_280)] to-[oklch(0.60_0.20_220)] text-white shadow-lg shadow-[oklch(0.65_0.22_280/0.3)]"
                        : "bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border"
                      : isHighlight
                        ? "text-[oklch(0.75_0.18_280)] hover:bg-sidebar-accent hover:text-[oklch(0.85_0.15_280)]"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className={cn(
                    "h-5 w-5 flex-shrink-0 transition-transform duration-200",
                    isActive && "scale-110"
                  )} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="text-xs text-muted-foreground text-center">
            <span className="text-gradient font-medium">IP Studio</span>
            <span className="mx-1">·</span>
            <span>v1.0</span>
          </div>
        </div>
      )}
    </aside>
  )
}
