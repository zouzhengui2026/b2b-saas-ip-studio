"use client"

import { useState, useMemo, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAppStore } from "@/lib/app-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyStateCard } from "@/components/empty-state-card"
import { ArrowLeft, Star, Plus, Edit, Trash2, Check, Loader2, BookOpen, Award, Calendar, FileText, Target, Layers } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useRouter, useParams } from "next/navigation"
import { formatDate, evidenceTypeNames, personaTypeNames, sleep } from "@/lib/utils"
import type { Evidence, Epoch, BrandBook } from "@/lib/types"

const evidenceTypeOptions = [
  { value: "case" as const, label: "案例", desc: "成功案例和合作项目" },
  { value: "testimonial" as const, label: "见证", desc: "客户评价和反馈" },
  { value: "data" as const, label: "数据", desc: "数据统计和报告" },
  { value: "award" as const, label: "荣誉", desc: "获得的奖项和认证" },
  { value: "media" as const, label: "媒体", desc: "媒体报道和曝光" },
  { value: "screenshot" as const, label: "截图", desc: "平台截图和证明" },
]

const scopeOptions = [
  { value: "public" as const, label: "公开", desc: "所有人可见" },
  { value: "internal" as const, label: "内部", desc: "仅团队可见" },
  { value: "confidential" as const, label: "保密", desc: "仅管理员可见" },
]

export default function PersonaDetailPage() {
  const { ipId } = useParams<{ ipId: string }>()
  const { state, dispatch, setCurrentIp } = useAppStore()
  const { toast } = useToast()
  const router = useRouter()

  const persona = state.personas.find((p) => p.id === ipId)
  const personaEvidences = useMemo(() => state.evidences.filter((e) => e.personaId === ipId), [state.evidences, ipId])
  const personaEpochs = useMemo(() => state.epochs.filter((e) => e.personaId === ipId), [state.epochs, ipId])

  // BrandBook Edit State
  const [brandBookForm, setBrandBookForm] = useState<BrandBook>(
    persona?.brandBook || {
      tone: "",
      keywords: [],
      avoidWords: [],
      targetAudience: "",
      valueProposition: "",
    },
  )
  const [keywordsInput, setKeywordsInput] = useState(persona?.brandBook?.keywords.join(", ") || "")
  const [avoidWordsInput, setAvoidWordsInput] = useState(persona?.brandBook?.avoidWords.join(", ") || "")
  const [brandBookSaving, setBrandBookSaving] = useState(false)

  // Evidence Drawer State
  const [evidenceDrawerOpen, setEvidenceDrawerOpen] = useState(false)
  const [editingEvidence, setEditingEvidence] = useState<Evidence | null>(null)
  const [evidenceForm, setEvidenceForm] = useState({
    type: "case" as Evidence["type"],
    title: "",
    description: "",
    source: "",
    tags: "",
    scope: "public" as Evidence["scope"],
  })
  const [evidenceSaving, setEvidenceSaving] = useState(false)
  const [deleteEvidenceId, setDeleteEvidenceId] = useState<string | null>(null)

  // Epoch Drawer State
  const [epochDrawerOpen, setEpochDrawerOpen] = useState(false)
  const [epochForm, setEpochForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    description: "",
    goals: "",
    priorityTopics: "",
  })
  const [epochSaving, setEpochSaving] = useState(false)

  // Reset evidence form when drawer closes
  useEffect(() => {
    if (!evidenceDrawerOpen) {
      setEditingEvidence(null)
      setEvidenceForm({ type: "case", title: "", description: "", source: "", tags: "", scope: "public" })
    }
  }, [evidenceDrawerOpen])

  // Reset epoch form when drawer closes
  useEffect(() => {
    if (!epochDrawerOpen) {
      setEpochForm({ name: "", startDate: "", endDate: "", description: "", goals: "", priorityTopics: "" })
    }
  }, [epochDrawerOpen])

  if (!persona) {
    return (
      <DashboardLayout>
        <EmptyStateCard
          icon={Star}
          title="IP不存在"
          description="找不到该IP"
          actionLabel="返回IP列表"
          onAction={() => router.push("/personas")}
        />
      </DashboardLayout>
    )
  }

  const handleSetCurrentIp = () => {
    setCurrentIp(ipId)
    toast({ title: "已设置", description: `当前IP已切换为 ${persona.name}` })
  }

  // BrandBook handlers
  const handleSaveBrandBook = async () => {
    setBrandBookSaving(true)
    await sleep(500)
    const updatedBrandBook: BrandBook = {
      ...brandBookForm,
      keywords: keywordsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      avoidWords: avoidWordsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    }
    dispatch({
      type: "UPDATE_PERSONA",
      payload: { ...persona, brandBook: updatedBrandBook, updatedAt: new Date().toISOString() },
    })
    toast({ title: "保存成功", description: "品牌手册已更新" })
    setBrandBookSaving(false)
  }

  // Evidence handlers
  const openAddEvidence = () => {
    setEditingEvidence(null)
    setEvidenceForm({ type: "case", title: "", description: "", source: "", tags: "", scope: "public" })
    setEvidenceDrawerOpen(true)
  }

  const openEditEvidence = (ev: Evidence) => {
    setEditingEvidence(ev)
    setEvidenceForm({
      type: ev.type,
      title: ev.title,
      description: ev.description,
      source: ev.source || "",
      tags: ev.tags.join(", "),
      scope: ev.scope,
    })
    setEvidenceDrawerOpen(true)
  }

  const handleSaveEvidence = async () => {
    if (!evidenceForm.title) {
      toast({ title: "错误", description: "请填写证据标题", variant: "destructive" })
      return
    }
    setEvidenceSaving(true)
    await sleep(500)

    const evidenceData: Evidence = {
      id: editingEvidence?.id || `ev-${Date.now()}`,
      personaId: ipId,
      type: evidenceForm.type,
      title: evidenceForm.title,
      description: evidenceForm.description,
      source: evidenceForm.source || undefined,
      tags: evidenceForm.tags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      scope: evidenceForm.scope,
      createdAt: editingEvidence?.createdAt || new Date().toISOString(),
    }

    if (editingEvidence) {
      dispatch({ type: "UPDATE_EVIDENCE", payload: evidenceData })
      toast({ title: "更新成功", description: "证据已更新" })
    } else {
      dispatch({ type: "ADD_EVIDENCE", payload: evidenceData })
      toast({ title: "添加成功", description: "证据已添加" })
    }

    setEvidenceSaving(false)
    setEvidenceDrawerOpen(false)
  }

  const handleDeleteEvidence = () => {
    if (deleteEvidenceId) {
      dispatch({ type: "DELETE_EVIDENCE", payload: deleteEvidenceId })
      toast({ title: "已删除", description: "证据已删除" })
      setDeleteEvidenceId(null)
    }
  }

  // Epoch handlers
  const openAddEpoch = () => {
    setEpochForm({ name: "", startDate: "", endDate: "", description: "", goals: "", priorityTopics: "" })
    setEpochDrawerOpen(true)
  }

  const handleSaveEpoch = async () => {
    if (!epochForm.name || !epochForm.startDate) {
      toast({ title: "错误", description: "请填写阶段名称和开始日期", variant: "destructive" })
      return
    }
    setEpochSaving(true)
    await sleep(500)

    const newEpoch: Epoch = {
      id: `epoch-${Date.now()}`,
      personaId: ipId,
      name: epochForm.name,
      startDate: epochForm.startDate,
      endDate: epochForm.endDate || undefined,
      description: epochForm.description,
      goals: epochForm.goals
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      priorityTopics: epochForm.priorityTopics
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      platformWeights: { douyin: 50, xiaohongshu: 30, wechat: 20 },
      isCurrent: personaEpochs.length === 0,
      createdAt: new Date().toISOString(),
    }

    dispatch({ type: "ADD_EPOCH", payload: newEpoch })
    toast({ title: "创建成功", description: "阶段已创建" })
    setEpochSaving(false)
    setEpochDrawerOpen(false)
  }

  const handleSetCurrentEpoch = (epochId: string) => {
    dispatch({ type: "SET_CURRENT_EPOCH", payload: { personaId: ipId, epochId } })
    toast({ title: "已设置", description: "当前阶段已更新" })
  }

  return (
    <DashboardLayout>
      <PageHeader
        title={persona.name}
        breadcrumbs={[{ label: "IP管理", href: "/personas" }, { label: persona.name }]}
        actions={
          <div className="flex gap-2">
            <Link href="/personas">
              <Button variant="outline" className="border-border/50">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回列表
              </Button>
            </Link>
            {state.currentIpId !== ipId && (
              <Button onClick={handleSetCurrentIp} className="btn-gradient border-0">
                <Star className="h-4 w-4 mr-2" />
                设为当前IP
              </Button>
            )}
          </div>
        }
      />

      {/* Info Bar */}
      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-secondary/30 border border-border/50 rounded-xl">
        <Avatar className="h-12 w-12 ring-2 ring-primary/20">
          <AvatarImage src={persona.avatar || "/placeholder.svg"} />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">{persona.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-medium">{persona.name}</p>
          <p className="text-sm text-muted-foreground">{persona.bio}</p>
        </div>
        <Badge variant="outline" className="border-border/50">{personaTypeNames[persona.type] || persona.type}</Badge>
        <Badge variant={persona.status === "active" ? "success" : "secondary"}>
          {persona.status === "active" ? "活跃" : "停用"}
        </Badge>
        {state.currentIpId === ipId && (
          <Badge className="bg-gradient-to-r from-primary to-primary/80">
            当前IP
          </Badge>
        )}
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-secondary/50 border border-border/50">
          <TabsTrigger value="profile" className="flex items-center gap-2 data-[state=active]:bg-background">
            <BookOpen className="h-4 w-4" />
            资料
          </TabsTrigger>
          <TabsTrigger value="evidence" className="flex items-center gap-2 data-[state=active]:bg-background">
            <Award className="h-4 w-4" />
            证据库 ({personaEvidences.length})
          </TabsTrigger>
          <TabsTrigger value="epoch" className="flex items-center gap-2 data-[state=active]:bg-background">
            <Calendar className="h-4 w-4" />
            阶段 ({personaEpochs.length})
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">品牌手册</CardTitle>
                <CardDescription>定义IP的语言风格和内容方向</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>品牌调性</Label>
                  <Textarea
                    value={brandBookForm.tone}
                    onChange={(e) => setBrandBookForm({ ...brandBookForm, tone: e.target.value })}
                    placeholder="如：专业、亲和、务实"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>关键词（逗号分隔）</Label>
                  <Input
                    value={keywordsInput}
                    onChange={(e) => setKeywordsInput(e.target.value)}
                    placeholder="如：科技, 评测, 性价比"
                  />
                </div>
                <div className="space-y-2">
                  <Label>禁用词（逗号分隔）</Label>
                  <Input
                    value={avoidWordsInput}
                    onChange={(e) => setAvoidWordsInput(e.target.value)}
                    placeholder="如：绝对, 最好, 必买"
                  />
                </div>
                <div className="space-y-2">
                  <Label>目标受众</Label>
                  <Input
                    value={brandBookForm.targetAudience}
                    onChange={(e) => setBrandBookForm({ ...brandBookForm, targetAudience: e.target.value })}
                    placeholder="如：25-45岁科技爱好者"
                  />
                </div>
                <div className="space-y-2">
                  <Label>价值主张</Label>
                  <Textarea
                    value={brandBookForm.valueProposition}
                    onChange={(e) => setBrandBookForm({ ...brandBookForm, valueProposition: e.target.value })}
                    placeholder="如：用专业视角解读科技，让选择更简单"
                    rows={2}
                  />
                </div>
                <Button onClick={handleSaveBrandBook} disabled={brandBookSaving} className="btn-gradient border-0">
                  {brandBookSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  保存品牌手册
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">产品/服务</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {persona.offers.length > 0 ? (
                  persona.offers.map((offer) => (
                    <div key={offer.id} className="p-3 bg-secondary/50 border border-border/30 rounded-lg">
                      <p className="font-medium">{offer.name}</p>
                      <p className="text-sm text-muted-foreground">{offer.description}</p>
                      {offer.price && <p className="text-sm font-medium text-primary mt-1">¥{offer.price}</p>}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">暂无产品/服务</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Evidence Tab */}
        <TabsContent value="evidence">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">证据库</CardTitle>
                <CardDescription>管理IP的案例、见证、数据等证据</CardDescription>
              </div>
              <Button onClick={openAddEvidence} className="btn-gradient border-0">
                <Plus className="h-4 w-4 mr-2" />
                新增证据
              </Button>
            </CardHeader>
            <CardContent>
              {personaEvidences.length > 0 ? (
                <div className="space-y-3">
                  {personaEvidences.map((ev) => (
                    <div key={ev.id} className="flex items-start justify-between p-4 border border-border/50 rounded-xl hover:border-border transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="border-border/50">{evidenceTypeNames[ev.type] || ev.type}</Badge>
                          <Badge variant="secondary">
                            {ev.scope === "public" ? "公开" : ev.scope === "internal" ? "内部" : "保密"}
                          </Badge>
                        </div>
                        <p className="font-medium">{ev.title}</p>
                        <p className="text-sm text-muted-foreground">{ev.description}</p>
                        {ev.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {ev.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditEvidence(ev)} className="hover:bg-secondary">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteEvidenceId(ev.id)} className="hover:bg-destructive/10 hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyStateCard
                  icon={Award}
                  title="暂无证据"
                  description="添加案例、见证、数据等证据来支撑你的内容"
                  actionLabel="新增证据"
                  onAction={openAddEvidence}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Epoch Tab */}
        <TabsContent value="epoch">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">阶段管理</CardTitle>
                <CardDescription>定义IP的不同发展阶段和目标</CardDescription>
              </div>
              <Button onClick={openAddEpoch} className="btn-gradient border-0">
                <Plus className="h-4 w-4 mr-2" />
                新建阶段
              </Button>
            </CardHeader>
            <CardContent>
              {personaEpochs.length > 0 ? (
                <div className="space-y-3">
                  {personaEpochs.map((epoch) => (
                    <div
                      key={epoch.id}
                      className={`p-4 border rounded-xl transition-colors ${epoch.isCurrent ? "border-primary bg-primary/5" : "border-border/50 hover:border-border"}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{epoch.name}</p>
                            {epoch.isCurrent && <Badge className="bg-gradient-to-r from-primary to-primary/80">当前阶段</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{epoch.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(epoch.startDate)} - {epoch.endDate ? formatDate(epoch.endDate) : "进行中"}
                          </p>
                          {epoch.goals.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium">目标：</p>
                              <ul className="text-xs text-muted-foreground">
                                {epoch.goals.map((g, i) => (
                                  <li key={i}>• {g}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        {!epoch.isCurrent && (
                          <Button variant="outline" size="sm" onClick={() => handleSetCurrentEpoch(epoch.id)} className="border-border/50">
                            <Check className="h-4 w-4 mr-1" />
                            设为当前
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyStateCard
                  icon={Calendar}
                  title="暂无阶段"
                  description="创建阶段来定义IP的发展目标和内容方向"
                  actionLabel="新建阶段"
                  onAction={openAddEpoch}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Evidence Drawer */}
      <Drawer open={evidenceDrawerOpen} onOpenChange={setEvidenceDrawerOpen} direction="right">
        <DrawerContent className="h-full w-full sm:max-w-lg ml-auto rounded-l-xl rounded-r-none">
          <DrawerHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                <Award className="h-5 w-5 text-white" />
              </div>
              <div>
                <DrawerTitle className="text-xl">{editingEvidence ? "编辑证据" : "新增证据"}</DrawerTitle>
                <DrawerDescription>添加案例、见证、数据等证据来支撑内容</DrawerDescription>
              </div>
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Evidence Type */}
            <div className="space-y-3">
              <Label className="text-foreground">类型</Label>
              <div className="grid grid-cols-2 gap-2">
                {evidenceTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setEvidenceForm({ ...evidenceForm, type: option.value })}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                      evidenceForm.type === option.value
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                        : "border-border/50 bg-secondary/30 hover:border-border hover:bg-secondary/50"
                    }`}
                  >
                    <span className={`font-medium text-sm ${evidenceForm.type === option.value ? "text-primary" : "text-foreground"}`}>
                      {option.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{option.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Scope */}
            <div className="space-y-3">
              <Label className="text-foreground">可见范围</Label>
              <div className="grid grid-cols-3 gap-2">
                {scopeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setEvidenceForm({ ...evidenceForm, scope: option.value })}
                    className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all ${
                      evidenceForm.scope === option.value
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                        : "border-border/50 bg-secondary/30 hover:border-border hover:bg-secondary/50"
                    }`}
                  >
                    <span className={`font-medium text-sm ${evidenceForm.scope === option.value ? "text-primary" : "text-foreground"}`}>
                      {option.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{option.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="evidence-title" className="text-foreground">
                标题 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="evidence-title"
                value={evidenceForm.title}
                onChange={(e) => setEvidenceForm({ ...evidenceForm, title: e.target.value })}
                placeholder="证据标题"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="evidence-desc" className="text-foreground">描述</Label>
              <Textarea
                id="evidence-desc"
                value={evidenceForm.description}
                onChange={(e) => setEvidenceForm({ ...evidenceForm, description: e.target.value })}
                placeholder="详细描述..."
                rows={4}
              />
            </div>

            {/* Source */}
            <div className="space-y-2">
              <Label htmlFor="evidence-source" className="text-foreground">来源</Label>
              <Input
                id="evidence-source"
                value={evidenceForm.source}
                onChange={(e) => setEvidenceForm({ ...evidenceForm, source: e.target.value })}
                placeholder="如：抖音数据统计"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="evidence-tags" className="text-foreground">标签（逗号分隔）</Label>
              <Input
                id="evidence-tags"
                value={evidenceForm.tags}
                onChange={(e) => setEvidenceForm({ ...evidenceForm, tags: e.target.value })}
                placeholder="如：爆款, 手机, 小米"
              />
            </div>
          </div>

          <DrawerFooter className="border-t border-border/50 pt-4">
            <div className="flex gap-3 w-full">
              <Button variant="outline" onClick={() => setEvidenceDrawerOpen(false)} className="flex-1 border-border/50">
                取消
              </Button>
              <Button onClick={handleSaveEvidence} disabled={evidenceSaving} className="flex-1 btn-gradient border-0">
                {evidenceSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingEvidence ? "更新" : "添加"}
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Epoch Drawer */}
      <Drawer open={epochDrawerOpen} onOpenChange={setEpochDrawerOpen} direction="right">
        <DrawerContent className="h-full w-full sm:max-w-lg ml-auto rounded-l-xl rounded-r-none">
          <DrawerHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
                <Layers className="h-5 w-5 text-white" />
              </div>
              <div>
                <DrawerTitle className="text-xl">新建阶段</DrawerTitle>
                <DrawerDescription>定义IP的发展阶段和目标</DrawerDescription>
              </div>
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="epoch-name" className="text-foreground">
                阶段名称 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="epoch-name"
                value={epochForm.name}
                onChange={(e) => setEpochForm({ ...epochForm, name: e.target.value })}
                placeholder="如：2024Q4冲刺期"
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="epoch-start" className="text-foreground">
                  开始日期 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="epoch-start"
                  type="date"
                  value={epochForm.startDate}
                  onChange={(e) => setEpochForm({ ...epochForm, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="epoch-end" className="text-foreground">结束日期</Label>
                <Input
                  id="epoch-end"
                  type="date"
                  value={epochForm.endDate}
                  onChange={(e) => setEpochForm({ ...epochForm, endDate: e.target.value })}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="epoch-desc" className="text-foreground">描述</Label>
              <Textarea
                id="epoch-desc"
                value={epochForm.description}
                onChange={(e) => setEpochForm({ ...epochForm, description: e.target.value })}
                placeholder="阶段目标描述..."
                rows={3}
              />
            </div>

            {/* Goals */}
            <div className="space-y-2">
              <Label htmlFor="epoch-goals" className="text-foreground">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  目标（每行一个）
                </div>
              </Label>
              <Textarea
                id="epoch-goals"
                value={epochForm.goals}
                onChange={(e) => setEpochForm({ ...epochForm, goals: e.target.value })}
                placeholder={"完成20条深度评测\n涨粉5万\n签约3个品牌合作"}
                rows={4}
              />
            </div>

            {/* Priority Topics */}
            <div className="space-y-2">
              <Label htmlFor="epoch-topics" className="text-foreground">优先话题（逗号分隔）</Label>
              <Input
                id="epoch-topics"
                value={epochForm.priorityTopics}
                onChange={(e) => setEpochForm({ ...epochForm, priorityTopics: e.target.value })}
                placeholder="如：年度盘点, 新品首发"
              />
            </div>

            {/* Tips */}
            <div className="p-4 rounded-xl bg-secondary/30 border border-border/30 space-y-2">
              <div className="text-sm font-medium text-foreground">💡 小贴士</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• 阶段帮助你聚焦特定时期的内容方向</p>
                <p>• 设置清晰的目标有助于评估阶段成效</p>
                <p>• 第一个创建的阶段会自动设为当前阶段</p>
              </div>
            </div>
          </div>

          <DrawerFooter className="border-t border-border/50 pt-4">
            <div className="flex gap-3 w-full">
              <Button variant="outline" onClick={() => setEpochDrawerOpen(false)} className="flex-1 border-border/50">
                取消
              </Button>
              <Button onClick={handleSaveEpoch} disabled={epochSaving} className="flex-1 btn-gradient border-0">
                {epochSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                创建阶段
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Delete Evidence Confirm */}
      <ConfirmDialog
        open={!!deleteEvidenceId}
        onOpenChange={() => setDeleteEvidenceId(null)}
        title="删除证据"
        description="确定要删除这条证据吗？此操作不可撤销。"
        confirmLabel="删除"
        onConfirm={handleDeleteEvidence}
        variant="destructive"
      />
    </DashboardLayout>
  )
}
