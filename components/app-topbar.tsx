"use client"

import { useAppStore } from "@/lib/app-context"
import { createSupabaseBrowserClient } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Building2, ChevronDown, User2, Zap, BookmarkPlus, Sparkles, Mic, UserPlus, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { AddInboxDialog } from "./add-inbox-dialog"
import { AddLeadDrawer } from "./add-lead-dialog"

export function AppTopbar() {
  const { state, currentOrg, currentPersona, currentOrgPersonas, setCurrentOrg, setCurrentIp } = useAppStore()
  const router = useRouter()
  const [showInboxDialog, setShowInboxDialog] = useState(false)
  const [showLeadDialog, setShowLeadDialog] = useState(false)
  const supabase = createSupabaseBrowserClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }
  // 避免 SSR 和客户端文本不一致：只有客户端挂载后显示组织名称
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <>
      <header className="h-14 border-b border-border/50 bg-background/60 backdrop-blur-xl px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Org Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="gap-2 bg-secondary/50 border-border/50 hover:bg-secondary hover:border-border"
              >
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{isMounted ? (currentOrg?.name || "选择组织") : "选择组织"}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="glass-card border-border/50">
              <DropdownMenuLabel className="text-muted-foreground">切换组织</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/50" />
              {state.orgs.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => setCurrentOrg(org.id)}
                  className={org.id === state.currentOrgId ? "bg-primary/20 text-primary" : ""}
                >
                  {org.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* IP Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="gap-2 bg-secondary/50 border-border/50 hover:bg-secondary hover:border-border"
              >
                <User2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{isMounted ? (currentPersona?.name || "选择IP") : "选择IP"}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="glass-card border-border/50">
              <DropdownMenuLabel className="text-muted-foreground">切换IP</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/50" />
              {currentOrgPersonas.length === 0 ? (
                <DropdownMenuItem disabled>暂无IP</DropdownMenuItem>
              ) : (
                currentOrgPersonas.map((persona) => (
                  <DropdownMenuItem
                    key={persona.id}
                    onClick={() => setCurrentIp(persona.id)}
                    className={persona.id === state.currentIpId ? "bg-primary/20 text-primary" : ""}
                  >
                    {persona.name}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2 btn-gradient border-0">
                <Zap className="h-4 w-4" />
                <span>快速操作</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-card border-border/50 w-48">
              <DropdownMenuItem 
                onClick={() => router.push("/references/new")}
                className="gap-3 py-2.5"
              >
                <BookmarkPlus className="h-4 w-4 text-chart-2" />
                <span>收录参考</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => router.push("/weekly-wizard")}
                className="gap-3 py-2.5"
              >
                <Sparkles className="h-4 w-4 text-chart-1" />
                <span>生成本周选题</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowInboxDialog(true)}
                className="gap-3 py-2.5"
              >
                <Mic className="h-4 w-4 text-chart-3" />
                <span>开始录音</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowLeadDialog(true)}
                className="gap-3 py-2.5"
              >
                <UserPlus className="h-4 w-4 text-chart-4" />
                <span>创建线索</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:ring-2 hover:ring-primary/30 transition-all">
                <Avatar className="h-8 w-8 ring-2 ring-border/50">
                  <AvatarImage src={state.currentUser?.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="bg-gradient-to-br from-[oklch(0.55_0.25_280)] to-[oklch(0.60_0.20_220)] text-white text-sm">
                    {state.currentUser?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-card border-border/50 w-56">
              <DropdownMenuLabel className="py-3">
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{state.currentUser?.name}</span>
                  <span className="text-xs text-muted-foreground font-normal">{state.currentUser?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem onClick={async () => {
                try {
                  const sup = createSupabaseBrowserClient()
                  await sup.auth.signOut()
                } catch (e) {}
                // navigate to login to force re-login
                router.push("/login")
                router.refresh()
              }} className="py-2.5">
                刷新会话
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem onClick={() => router.push("/settings")} className="py-2.5">
                个人信息
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive py-2.5">
                <LogOut className="h-4 w-4 mr-2" />
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <AddInboxDialog open={showInboxDialog} onOpenChange={setShowInboxDialog} />
      <AddLeadDrawer open={showLeadDialog} onOpenChange={setShowLeadDialog} />
    </>
  )
}
