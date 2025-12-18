"use client"

import { useAppStore } from "@/lib/app-context"
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
import { useState } from "react"
import { GenerateWeeklyWizard } from "./generate-weekly-wizard"
import { AddReferenceDialog } from "./add-reference-dialog"
import { AddInboxDialog } from "./add-inbox-dialog"
import { AddLeadDrawer } from "./add-lead-dialog"

export function AppTopbar() {
  const { state, currentOrg, currentPersona, currentOrgPersonas, setCurrentOrg, setCurrentIp, logout } = useAppStore()
  const router = useRouter()
  const [showWeeklyWizard, setShowWeeklyWizard] = useState(false)
  const [showRefDialog, setShowRefDialog] = useState(false)
  const [showInboxDialog, setShowInboxDialog] = useState(false)
  const [showLeadDialog, setShowLeadDialog] = useState(false)

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <>
      <header className="h-14 border-b border-border bg-card px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Org Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Building2 className="h-4 w-4" />
                <span>{currentOrg?.name || "选择组织"}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>切换组织</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {state.orgs.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => setCurrentOrg(org.id)}
                  className={org.id === state.currentOrgId ? "bg-accent" : ""}
                >
                  {org.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* IP Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 bg-transparent">
                <User2 className="h-4 w-4" />
                <span>{currentPersona?.name || "选择IP"}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>切换IP</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {currentOrgPersonas.length === 0 ? (
                <DropdownMenuItem disabled>暂无IP</DropdownMenuItem>
              ) : (
                currentOrgPersonas.map((persona) => (
                  <DropdownMenuItem
                    key={persona.id}
                    onClick={() => setCurrentIp(persona.id)}
                    className={persona.id === state.currentIpId ? "bg-accent" : ""}
                  >
                    {persona.name}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" className="gap-2">
                <Zap className="h-4 w-4" />
                <span>快速操作</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowRefDialog(true)}>
                <BookmarkPlus className="h-4 w-4 mr-2" />
                收录参考
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/weekly-wizard")}>
                <Sparkles className="h-4 w-4 mr-2" />
                生成本周选题
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowInboxDialog(true)}>
                <Mic className="h-4 w-4 mr-2" />
                开始录音
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowLeadDialog(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                创建线索
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={state.currentUser?.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{state.currentUser?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{state.currentUser?.name}</span>
                  <span className="text-xs text-muted-foreground">{state.currentUser?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/settings")}>个人信息</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* 周选题向导改为独立页面，这里不再渲染弹窗版本 */}
      <AddReferenceDialog open={showRefDialog} onOpenChange={setShowRefDialog} />
      <AddInboxDialog open={showInboxDialog} onOpenChange={setShowInboxDialog} />
      <AddLeadDrawer open={showLeadDialog} onOpenChange={setShowLeadDialog} />
    </>
  )
}
