"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer"
import { useAppStore } from "@/lib/app-context"
import { EmptyStateCard } from "@/components/empty-state-card"
import { Plus, Users, Power, Loader2, User, Briefcase, Building2, Star, Sparkles } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { personaTypeNames, sleep } from "@/lib/utils"
import type { Persona } from "@/lib/types"

const typeOptions = [
  { value: "founder" as const, label: "创始人IP", icon: User, desc: "老板亲自下场做内容" },
  { value: "expert" as const, label: "专家IP", icon: Briefcase, desc: "行业专家分享干货" },
  { value: "brand" as const, label: "品牌IP", icon: Building2, desc: "企业品牌形象账号" },
  { value: "kol" as const, label: "KOL", icon: Star, desc: "意见领袖/网红" },
]

export default function PersonasPage() {
  const { state, dispatch, currentOrgPersonas, setCurrentIp } = useAppStore()
  const { toast } = useToast()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [type, setType] = useState<Persona["type"]>("founder")
  const [bio, setBio] = useState("")

  // Reset form when drawer closes
  useEffect(() => {
    if (!drawerOpen) {
      setName("")
      setType("founder")
      setBio("")
    }
  }, [drawerOpen])

  // Calculate stats per persona
  const getPersonaStats = (personaId: string) => {
    const contents = state.contents.filter((c) => c.personaId === personaId)
    const recentInquiries = contents
      .filter((c) => c.status === "published")
      .reduce((sum, c) => sum + (c.metrics?.inquiries || 0), 0)
    return { contentCount: contents.length, recentInquiries }
  }

  const handleCreate = async () => {
    if (!name) {
      toast({ title: "错误", description: "请填写IP名称", variant: "destructive" })
      return
    }
    if (!state.currentOrgId) {
      toast({ title: "错误", description: "请先选择组织", variant: "destructive" })
      return
    }

    setLoading(true)
    await sleep(500)

    const newPersona: Persona = {
      id: `ip-${Date.now()}`,
      orgId: state.currentOrgId,
      name,
      bio,
      type,
      status: "active",
      offers: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    dispatch({ type: "ADD_PERSONA", payload: newPersona })
    toast({ title: "创建成功", description: `IP "${name}" 已创建` })

    setLoading(false)
    setDrawerOpen(false)
  }

  const handleToggleStatus = (persona: Persona) => {
    const newStatus = persona.status === "active" ? "inactive" : "active"
    dispatch({
      type: "UPDATE_PERSONA",
      payload: { ...persona, status: newStatus, updatedAt: new Date().toISOString() },
    })
    toast({ title: newStatus === "active" ? "已启用" : "已停用" })
  }

  const handleSetCurrent = (personaId: string) => {
    setCurrentIp(personaId)
    toast({ title: "已切换", description: "当前IP已切换" })
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="IP管理"
        breadcrumbs={[{ label: "IP管理" }]}
        actions={
          <Button onClick={() => setDrawerOpen(true)} className="btn-gradient border-0">
            <Plus className="h-4 w-4 mr-2" />
            创建IP
          </Button>
        }
      />

      {currentOrgPersonas.length === 0 ? (
        <EmptyStateCard
          icon={Users}
          title="暂无IP"
          description="创建您的第一个IP人设，开始内容创作之旅"
          actionLabel="创建IP"
          onAction={() => setDrawerOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentOrgPersonas.map((persona, index) => {
            const stats = getPersonaStats(persona.id)
            const isCurrent = persona.id === state.currentIpId
            return (
              <Card
                key={persona.id}
                className={`hover:border-primary/50 transition-all animate-slide-up ${isCurrent ? "border-primary shadow-lg shadow-primary/10" : ""}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardHeader className="flex flex-row items-start gap-4">
                  <Avatar className="h-12 w-12 ring-2 ring-border/50">
                    <AvatarImage src={persona.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="bg-gradient-to-br from-[oklch(0.55_0.25_280)] to-[oklch(0.60_0.20_220)] text-white">
                      {persona.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-lg">{persona.name}</CardTitle>
                      {isCurrent && <Badge className="bg-primary/20 text-primary border-0">当前</Badge>}
                      <Badge variant={persona.status === "active" ? "success" : "secondary"}>
                        {persona.status === "active" ? "活跃" : "停用"}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-1 mt-1">
                      {personaTypeNames[persona.type]} · {persona.bio || "暂无简介"}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <span className="font-semibold text-foreground">{stats.contentCount}</span>
                      <span className="text-muted-foreground">内容</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-semibold text-foreground">{stats.recentInquiries}</span>
                      <span className="text-muted-foreground">咨询</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-semibold text-foreground">{persona.offers.length}</span>
                      <span className="text-muted-foreground">产品</span>
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/personas/${persona.id}`} className="flex-1">
                      <Button variant="outline" className="w-full border-border/50">
                        查看详情
                      </Button>
                    </Link>
                    {!isCurrent && (
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => handleSetCurrent(persona.id)}
                        className="border-border/50"
                        title="设为当前IP"
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="right">
        <DrawerContent className="h-full w-full sm:max-w-md ml-auto rounded-l-xl rounded-r-none">
          <DrawerHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-[oklch(0.55_0.25_280)] to-[oklch(0.60_0.20_220)] shadow-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <DrawerTitle className="text-xl">创建新IP</DrawerTitle>
                <DrawerDescription>设置IP的基本信息和定位</DrawerDescription>
              </div>
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="ip-name" className="text-foreground">
                IP名称 <span className="text-destructive">*</span>
              </Label>
              <Input 
                id="ip-name" 
                placeholder="如：科技老王、职场小李" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
            </div>

            {/* Type Selection */}
            <div className="space-y-3">
              <Label className="text-foreground">IP类型</Label>
              <div className="grid grid-cols-2 gap-3">
                {typeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setType(option.value)}
                    className={`flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all ${
                      type === option.value
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                        : "border-border/50 bg-secondary/30 hover:border-border hover:bg-secondary/50"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${type === option.value ? "bg-primary/20" : "bg-secondary"}`}>
                      <option.icon className={`h-4 w-4 ${type === option.value ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <div className={`font-medium text-sm ${type === option.value ? "text-primary" : "text-foreground"}`}>
                        {option.label}
                      </div>
                      <div className="text-xs text-muted-foreground">{option.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="ip-bio" className="text-foreground">简介</Label>
              <Textarea
                id="ip-bio"
                placeholder="一句话描述IP定位，例如：专注于科技产品评测与行业趋势分析"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
              />
            </div>

            {/* Tips */}
            <div className="p-4 rounded-xl bg-secondary/30 border border-border/30 space-y-2">
              <div className="text-sm font-medium text-foreground">💡 小贴士</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• IP名称建议简短好记，便于粉丝记忆</p>
                <p>• 创建后可以在详情页完善更多信息</p>
                <p>• 一个组织可以创建多个IP</p>
              </div>
            </div>
          </div>

          <DrawerFooter className="border-t border-border/50 pt-4">
            <div className="flex gap-3 w-full">
              <Button 
                variant="outline" 
                onClick={() => setDrawerOpen(false)} 
                className="flex-1 border-border/50"
              >
                取消
              </Button>
              <Button 
                onClick={handleCreate} 
                disabled={loading} 
                className="flex-1 btn-gradient border-0"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                创建IP
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </DashboardLayout>
  )
}
