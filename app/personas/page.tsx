"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAppStore } from "@/lib/app-context"
import { EmptyStateCard } from "@/components/empty-state-card"
import { Plus, Users, Power, Loader2 } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { personaTypeNames, sleep } from "@/lib/utils"
import type { Persona } from "@/lib/types"

export default function PersonasPage() {
  const { state, dispatch, currentOrgPersonas, setCurrentIp } = useAppStore()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [type, setType] = useState<Persona["type"]>("founder")
  const [bio, setBio] = useState("")

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

    setName("")
    setType("founder")
    setBio("")
    setLoading(false)
    setDialogOpen(false)
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
          <Button onClick={() => setDialogOpen(true)}>
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
          onAction={() => setDialogOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentOrgPersonas.map((persona) => {
            const stats = getPersonaStats(persona.id)
            const isCurrent = persona.id === state.currentIpId
            return (
              <Card
                key={persona.id}
                className={`hover:border-primary/50 transition-colors ${isCurrent ? "border-primary" : ""}`}
              >
                <CardHeader className="flex flex-row items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={persona.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{persona.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{persona.name}</CardTitle>
                      {isCurrent && <Badge>当前</Badge>}
                      <Badge variant={persona.status === "active" ? "default" : "secondary"}>
                        {persona.status === "active" ? "活跃" : "停用"}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-1">
                      {personaTypeNames[persona.type]} · {persona.bio || "暂无简介"}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4 text-sm">
                    <span>
                      <span className="font-medium">{stats.contentCount}</span>
                      <span className="text-muted-foreground ml-1">内容</span>
                    </span>
                    <span>
                      <span className="font-medium">{stats.recentInquiries}</span>
                      <span className="text-muted-foreground ml-1">咨询</span>
                    </span>
                    <span>
                      <span className="font-medium">{persona.offers.length}</span>
                      <span className="text-muted-foreground ml-1">产品</span>
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/personas/${persona.id}`} className="flex-1">
                      <Button variant="outline" className="w-full bg-transparent">
                        查看详情
                      </Button>
                    </Link>
                    {!isCurrent && (
                      <Button variant="outline" size="icon" onClick={() => handleSetCurrent(persona.id)}>
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

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建IP</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ip-name">IP名称 *</Label>
              <Input id="ip-name" placeholder="如：科技老王" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>IP类型</Label>
              <Select value={type} onValueChange={(v) => setType(v as Persona["type"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="founder">创始人IP</SelectItem>
                  <SelectItem value="expert">专家IP</SelectItem>
                  <SelectItem value="brand">品牌IP</SelectItem>
                  <SelectItem value="kol">KOL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ip-bio">简介</Label>
              <Textarea
                id="ip-bio"
                placeholder="一句话描述IP定位"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
