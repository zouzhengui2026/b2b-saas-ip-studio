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
import { Badge } from "@/components/ui/badge"
import { PublishInfoDialog } from "@/components/publish-info-dialog"
import { EvidencePickerDialog } from "@/components/evidence-picker-dialog"
import { AddLeadDrawer } from "@/components/add-lead-dialog"
import {
  platformNames,
  contentStatusNames,
  contentStatusColors,
  formatDate,
  formatNames,
  copyToClipboard,
  sleep,
} from "@/lib/utils"
import {
  ArrowLeft,
  Play,
  Package,
  CheckCircle,
  Copy,
  RefreshCw,
  AlertTriangle,
  Shield,
  Loader2,
  Plus,
  UserPlus,
  Ban,
  Edit,
  Trash2,
  Save,
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Content, ContentMetrics } from "@/lib/types"

export default function ContentDetailPage() {
  const { contentId } = useParams<{ contentId: string }>()
  const { state, dispatch, runQa, generatePublishPack, generateScript } = useAppStore()
  const { toast } = useToast()

  const content = state.contents.find((c) => c.id === contentId)
  const evidences = useMemo(
    () => state.evidences.filter((e) => content?.evidenceIds.includes(e.id)),
    [state.evidences, content?.evidenceIds],
  )

  const [qaLoading, setQaLoading] = useState(false)
  const [packLoading, setPackLoading] = useState(false)
  const [scriptLoading, setScriptLoading] = useState(false)
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [evidencePickerOpen, setEvidencePickerOpen] = useState(false)
  const [leadDialogOpen, setLeadDialogOpen] = useState(false)
  const [publishDate, setPublishDate] = useState("")
  const [publishUrl, setPublishUrl] = useState("")

  // Script editing form
  const [scriptForm, setScriptForm] = useState({
    hook: content?.script?.hook || "",
    outline: content?.script?.outline || [],
    fullScript: content?.script?.fullScript || "",
  })
  const [editingOutlineIndex, setEditingOutlineIndex] = useState<number | null>(null)
  const [newOutlineItem, setNewOutlineItem] = useState("")
  const [savingScript, setSavingScript] = useState(false)

  // Sync script form when content changes
  useEffect(() => {
    if (content) {
      setScriptForm({
        hook: content.script?.hook || "",
        outline: content.script?.outline || [],
        fullScript: content.script?.fullScript || "",
      })
    }
  }, [content])

  // Metrics form
  const [metricsForm, setMetricsForm] = useState<ContentMetrics>({
    views: content?.metrics?.views || 0,
    likes: content?.metrics?.likes || 0,
    comments: content?.metrics?.comments || 0,
    shares: content?.metrics?.shares || 0,
    saves: content?.metrics?.saves || 0,
    inquiries: content?.metrics?.inquiries || 0,
    appointments: content?.metrics?.appointments || 0,
    deals: content?.metrics?.deals || 0,
    notes: content?.metrics?.notes || "",
  })

  if (!content) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">内容不存在</p>
          <Link href="/contents">
            <Button variant="link">返回内容列表</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const isQaBlocked = content.qaResult?.verdict === "block"

  const handleRunQa = async () => {
    setQaLoading(true)
    toast({ title: "开始审核", description: "正在进行AI内容审核..." })
    const result = await runQa(content.id)
    if (result.verdict === "pass") {
      toast({ title: "审核通过", description: `得分 ${result.score}，内容已标记为已通过` })
    } else {
      toast({
        title: result.verdict === "block" ? "审核阻断" : "需要修复",
        description: result.issues.join("; "),
        variant: "destructive",
      })
    }
    setQaLoading(false)
  }

  const handleGeneratePack = async () => {
    setPackLoading(true)
    toast({ title: "生成中", description: "正在生成发布包..." })
    await generatePublishPack(content.id)
    toast({ title: "生成完成", description: "发布包已生成" })
    setPackLoading(false)
  }

  const handleRegenerateScript = async (style?: string) => {
    setScriptLoading(true)
    toast({ title: "AI 生成中", description: "正在调用 DeepSeek 生成脚本..." })
    const result = await generateScript(content.id, style)
    if (result.success) {
      if (result.error) {
        // 使用了 fallback
        toast({ title: "已生成", description: result.error, variant: "default" })
      } else {
        toast({ title: "✨ AI 生成完成", description: "脚本已由 DeepSeek AI 生成" })
      }
    } else {
      toast({ title: "生成失败", description: result.error || "未知错误", variant: "destructive" })
    }
    setScriptLoading(false)
  }

  const handleSaveScript = async () => {
    if (!content) return
    setSavingScript(true)
    await sleep(300)

    dispatch({
      type: "UPDATE_CONTENT",
      payload: {
        ...content,
        script: {
          ...content.script,
          hook: scriptForm.hook,
          outline: scriptForm.outline,
          fullScript: scriptForm.fullScript,
        },
        updatedAt: new Date().toISOString(),
      },
    })

    toast({ title: "保存成功", description: "脚本内容已更新" })
    setSavingScript(false)
  }

  const handleAddOutlineItem = () => {
    if (newOutlineItem.trim()) {
      setScriptForm({
        ...scriptForm,
        outline: [...scriptForm.outline, newOutlineItem.trim()],
      })
      setNewOutlineItem("")
    }
  }

  const handleUpdateOutlineItem = (index: number, value: string) => {
    const newOutline = [...scriptForm.outline]
    newOutline[index] = value
    setScriptForm({ ...scriptForm, outline: newOutline })
  }

  const handleDeleteOutlineItem = (index: number) => {
    setScriptForm({
      ...scriptForm,
      outline: scriptForm.outline.filter((_, i) => i !== index),
    })
  }

  const handleTryPublish = () => {
    if (isQaBlocked) {
      toast({
        title: "无法发布",
        description: "QA审核结果为阻断，请先修复内容问题后重新审核",
        variant: "destructive",
      })
      return
    }
    setPublishDialogOpen(true)
  }

  const confirmPublish = (date: string, url?: string) => {
    dispatch({
      type: "UPDATE_CONTENT",
      payload: {
        ...content,
        status: "published",
        publishedAt: date,
        publishUrl: url,
        updatedAt: new Date().toISOString(),
      },
    })
    toast({ title: "已标记发布", description: "内容状态已更新" })
    setPublishDialogOpen(false)
    setPublishDate("")
    setPublishUrl("")
  }

  const handleCopyContentId = async () => {
    await copyToClipboard(content.id)
    toast({ title: "已复制", description: "内容ID已复制到剪贴板" })
  }

  const handleCopyPublishPack = async () => {
    if (!content.publishPack) return
    const packText = `【标题候选】\n${content.publishPack.titleCandidates.join("\n")}\n\n【文案】\n${content.publishPack.caption}\n\n【标签】\n${content.publishPack.hashtags.join(" ")}\n\n【封面文案】${content.publishPack.coverText || ""}\n\n【置顶评论】${content.publishPack.pinnedComment || ""}\n\n【A/B测试建议】${content.publishPack.abTestSuggestion || ""}`
    await copyToClipboard(packText)
    toast({ title: "已复制", description: "发布包已复制到剪贴板" })
  }

  const handleSaveMetrics = async () => {
    dispatch({
      type: "UPDATE_CONTENT_METRICS",
      payload: { id: content.id, metrics: metricsForm },
    })
    toast({ title: "保存成功", description: "数据已更新" })
  }

  const handleEvidenceSelect = (ids: string[]) => {
    dispatch({
      type: "UPDATE_CONTENT",
      payload: { ...content, evidenceIds: ids, updatedAt: new Date().toISOString() },
    })
    toast({ title: "已更新", description: "证据引用已更新" })
  }

  const handleApplyFix = async () => {
    toast({ title: "应用修改", description: "正在自动修复问题..." })
    await sleep(800)
    // Mock fix - remove banned words and add evidence suggestion
    const updatedContent: Content = {
      ...content,
      script: {
        ...content.script,
        fullScript: content.script?.fullScript?.replace(/绝对|最好|必买|保证/g, "推荐") || "",
      },
      updatedAt: new Date().toISOString(),
    }
    dispatch({ type: "UPDATE_CONTENT", payload: updatedContent })
    toast({ title: "修复完成", description: "已自动替换敏感词" })
  }

  const handleForcePass = () => {
    dispatch({
      type: "UPDATE_CONTENT",
      payload: { ...content, status: "approved", updatedAt: new Date().toISOString() },
    })
    toast({ title: "已强制通过", description: "请确保内容合规" })
  }

  return (
    <DashboardLayout>
      <PageHeader
        title={content.title || "无标题"}
        breadcrumbs={[{ label: "内容工单", href: "/contents" }, { label: content.id }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/contents">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={scriptLoading}>
                  {scriptLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  重新生成脚本
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleRegenerateScript()}>默认风格</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRegenerateScript("shorter")}>更精简</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRegenerateScript("professional")}>更专业</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRegenerateScript("casual")}>更口语</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={handleRunQa} disabled={qaLoading}>
              {qaLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              运行QA
            </Button>
            <Button variant="outline" onClick={handleGeneratePack} disabled={packLoading}>
              {packLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Package className="h-4 w-4 mr-2" />}
              生成发布包
            </Button>
            {content.status === "approved" && (
              <Button onClick={handleTryPublish} disabled={isQaBlocked}>
                {isQaBlocked ? (
                  <>
                    <Ban className="h-4 w-4 mr-2" />
                    QA阻断
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    标记已发布
                  </>
                )}
              </Button>
            )}
          </div>
        }
      />

      {isQaBlocked && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg flex items-center gap-3">
          <Ban className="h-5 w-5 text-destructive" />
          <div>
            <p className="font-medium text-destructive">内容被QA阻断</p>
            <p className="text-sm text-muted-foreground">该内容无法标记为已发布，请先修复问题后重新运行QA审核</p>
          </div>
        </div>
      )}

      {/* Info Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-muted rounded-lg">
        <code
          className="text-sm bg-background px-2 py-1 rounded cursor-pointer hover:bg-accent"
          onClick={handleCopyContentId}
        >
          {content.id}
          <Copy className="inline h-3 w-3 ml-1" />
        </code>
        <Badge variant="outline">{platformNames[content.platform]}</Badge>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${contentStatusColors[content.status]}`}>
          {contentStatusNames[content.status]}
        </span>
        {content.topicCluster && <Badge variant="secondary">{content.topicCluster}</Badge>}
        {content.format && <Badge variant="secondary">{formatNames[content.format] || content.format}</Badge>}
        <span className="text-xs text-muted-foreground">更新于 {formatDate(content.updatedAt)}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Script Editor */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">脚本内容</CardTitle>
              <Button onClick={handleSaveScript} disabled={savingScript} size="sm">
                {savingScript ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                保存
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Hook</Label>
                <Textarea
                  value={scriptForm.hook}
                  onChange={(e) => setScriptForm({ ...scriptForm, hook: e.target.value })}
                  placeholder="开场钩子..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>大纲</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddOutlineItem}
                    disabled={!newOutlineItem.trim()}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    添加
                  </Button>
                </div>
                <div className="space-y-2">
                  {scriptForm.outline.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-muted-foreground w-6">{idx + 1}.</span>
                      {editingOutlineIndex === idx ? (
                        <Input
                          value={item}
                          onChange={(e) => handleUpdateOutlineItem(idx, e.target.value)}
                          onBlur={() => setEditingOutlineIndex(null)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              setEditingOutlineIndex(null)
                            }
                          }}
                          className="flex-1"
                          autoFocus
                        />
                      ) : (
                        <>
                          <span className="flex-1 p-2 bg-muted rounded cursor-pointer hover:bg-accent" onClick={() => setEditingOutlineIndex(idx)}>
                            {item}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteOutlineItem(idx)}
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-6">
                      {scriptForm.outline.length + 1}.
                    </span>
                    <Input
                      value={newOutlineItem}
                      onChange={(e) => setNewOutlineItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newOutlineItem.trim()) {
                          handleAddOutlineItem()
                        }
                      }}
                      placeholder="输入新的大纲项..."
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>完整脚本</Label>
                <Textarea
                  value={scriptForm.fullScript}
                  onChange={(e) => setScriptForm({ ...scriptForm, fullScript: e.target.value })}
                  placeholder="完整脚本内容..."
                  rows={8}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>引用证据</Label>
                  <Button variant="outline" size="sm" onClick={() => setEvidencePickerOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    添加证据
                  </Button>
                </div>
                {evidences.length > 0 ? (
                  <div className="space-y-2">
                    {evidences.map((ev) => (
                      <div key={ev.id} className="p-2 bg-muted rounded text-sm">
                        <p className="font-medium">{ev.title}</p>
                        <p className="text-muted-foreground text-xs">{ev.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">暂无引用证据</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Publish Pack */}
          {content.publishPack && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">发布包</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    复制以下内容到抖音/小红书/视频号发布
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleCopyPublishPack}>
                  <Copy className="h-4 w-4 mr-1" />
                  一键复制全部
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    <strong>使用说明：</strong>点击"一键复制全部"后，去对应平台（抖音/小红书/视频号）发布内容，发布完成后回来点击"标记已发布"填写发布链接。
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>标题候选（点击复制）</Label>
                    <span className="text-xs text-muted-foreground">选择一个使用</span>
                  </div>
                  {content.publishPack.titleCandidates.map((title, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-muted rounded cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => copyToClipboard(title).then(() => toast({ title: "已复制", description: "标题已复制到剪贴板" }))}
                    >
                      <span className="text-sm">{title}</span>
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>文案</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(content.publishPack?.caption || "").then(() => toast({ title: "已复制", description: "文案已复制到剪贴板" }))}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      复制
                    </Button>
                  </div>
                  <div className="p-2 bg-muted rounded text-sm whitespace-pre-wrap">{content.publishPack?.caption || ""}</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>标签</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard((content.publishPack?.hashtags || []).join(" ")).then(() => toast({ title: "已复制", description: "标签已复制到剪贴板" }))}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      复制
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {content.publishPack.hashtags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="cursor-default">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                {content.publishPack.coverText && (
                  <div className="space-y-1">
                    <Label>封面文案</Label>
                    <p className="text-sm">{content.publishPack.coverText}</p>
                  </div>
                )}
                {content.publishPack.pinnedComment && (
                  <div className="space-y-1">
                    <Label>置顶评论</Label>
                    <p className="text-sm">{content.publishPack.pinnedComment}</p>
                  </div>
                )}
                {content.publishPack.abTestSuggestion && (
                  <div className="space-y-1">
                    <Label>A/B测试建议</Label>
                    <p className="text-sm text-muted-foreground">{content.publishPack.abTestSuggestion}</p>
                  </div>
                )}
                {content.status !== "published" && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-green-800 dark:text-green-200">发布后记得回来</p>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
                          在平台发布完成后，点击右上角"标记已发布"填写发布链接，方便后续追踪数据
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Metrics */}
          {content.status === "published" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">数据回填</CardTitle>
                <CardDescription>记录内容发布后的表现数据</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">播放量</Label>
                    <Input
                      type="number"
                      value={metricsForm.views || ""}
                      onChange={(e) => setMetricsForm({ ...metricsForm, views: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">点赞</Label>
                    <Input
                      type="number"
                      value={metricsForm.likes || ""}
                      onChange={(e) => setMetricsForm({ ...metricsForm, likes: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">评论</Label>
                    <Input
                      type="number"
                      value={metricsForm.comments || ""}
                      onChange={(e) => setMetricsForm({ ...metricsForm, comments: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">收藏</Label>
                    <Input
                      type="number"
                      value={metricsForm.saves || ""}
                      onChange={(e) => setMetricsForm({ ...metricsForm, saves: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-primary">咨询数 *</Label>
                    <Input
                      type="number"
                      value={metricsForm.inquiries || ""}
                      onChange={(e) => setMetricsForm({ ...metricsForm, inquiries: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">预约数</Label>
                    <Input
                      type="number"
                      value={metricsForm.appointments || ""}
                      onChange={(e) => setMetricsForm({ ...metricsForm, appointments: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">成交数</Label>
                    <Input
                      type="number"
                      value={metricsForm.deals || ""}
                      onChange={(e) => setMetricsForm({ ...metricsForm, deals: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">备注</Label>
                  <Textarea
                    value={metricsForm.notes || ""}
                    onChange={(e) => setMetricsForm({ ...metricsForm, notes: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveMetrics}>保存数据</Button>
                  <Button variant="outline" onClick={() => setLeadDialogOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    从此内容创建线索
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: QA Results */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                QA审核
              </CardTitle>
            </CardHeader>
            <CardContent>
              {content.qaResult ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{content.qaResult.score}分</span>
                    <Badge
                      variant={
                        content.qaResult.verdict === "pass"
                          ? "default"
                          : content.qaResult.verdict === "fix"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {content.qaResult.verdict === "pass"
                        ? "通过"
                        : content.qaResult.verdict === "fix"
                          ? "需修复"
                          : "阻断"}
                    </Badge>
                  </div>
                  {content.qaResult.issues.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        问题
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {content.qaResult.issues.map((issue, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-destructive">•</span>
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {content.qaResult.suggestions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">建议</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {content.qaResult.suggestions.map((sug, i) => (
                          <li key={i}>• {sug}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {content.qaResult.verdict !== "pass" && (
                    <div className="space-y-2 pt-2 border-t">
                      <Button variant="outline" size="sm" className="w-full bg-transparent" onClick={handleApplyFix}>
                        应用修改建议
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full text-destructive" onClick={handleForcePass}>
                        人工确认通过
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">仅管理员可强制通过</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">暂未审核</p>
              )}
            </CardContent>
          </Card>

          {content.metrics && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">数据表现</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">播放量</span>
                  <span className="font-medium">{content.metrics.views?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">点赞</span>
                  <span className="font-medium">{content.metrics.likes?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">评论</span>
                  <span className="font-medium">{content.metrics.comments?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between text-primary">
                  <span>咨询数</span>
                  <span className="font-medium">{content.metrics.inquiries || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">预约数</span>
                  <span className="font-medium">{content.metrics.appointments || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">成交数</span>
                  <span className="font-medium">{content.metrics.deals || 0}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <PublishInfoDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        defaultDate={content.publishedAt || publishDate}
        defaultUrl={content.publishUrl || publishUrl}
        onConfirm={confirmPublish}
      />
      <EvidencePickerDialog
        open={evidencePickerOpen}
        onOpenChange={setEvidencePickerOpen}
        selectedIds={content.evidenceIds}
        onSelect={handleEvidenceSelect}
      />
      <AddLeadDrawer open={leadDialogOpen} onOpenChange={setLeadDialogOpen} prefilledContentId={content.id} />
    </DashboardLayout>
  )
}
