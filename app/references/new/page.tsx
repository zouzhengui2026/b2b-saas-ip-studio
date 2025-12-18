"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAppStore } from "@/lib/app-context"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Sparkles } from "lucide-react"
import { sleep } from "@/lib/utils"
import type { Reference, ReferenceExtracted } from "@/lib/types"

export default function NewReferencePage() {
  const { state, dispatch } = useAppStore()
  const { toast } = useToast()
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [platform, setPlatform] = useState<Reference["platform"]>("douyin")
  const [type, setType] = useState<Reference["type"]>("video")
  const [tags, setTags] = useState("")
  const [snapshotUrl, setSnapshotUrl] = useState("")
  const [summary, setSummary] = useState("")
  const [bulkUrls, setBulkUrls] = useState("")
  const [extracted, setExtracted] = useState<ReferenceExtracted | null>(null)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState<"single" | "bulk">("single")

  const handleGenerateExtract = async () => {
    if (!title) {
      toast({ title: "错误", description: "请先填写标题", variant: "destructive" })
      return
    }
    setGenerating(true)
    await sleep(800 + Math.random() * 400)

    const mockExtracted: ReferenceExtracted = {
      hook: `关于「${title}」的精彩开头：这个话题很多人都在问...`,
      structure: "痛点引入 - 核心观点 - 案例说明 - 行动号召",
      cta: "关注了解更多",
      format: "talking-head",
      highlights: ["观点新颖", "数据详实", "节奏把控好"],
      risks: ["时长偏长", "部分表述可能敏感"],
    }

    setExtracted(mockExtracted)
    setGenerating(false)
    toast({ title: "生成完成", description: "已提取内容结构" })
  }

  const handleSave = async () => {
    if (!title) {
      toast({ title: "错误", description: "标题为必填项", variant: "destructive" })
      return
    }
    if (!state.currentIpId) {
      toast({ title: "错误", description: "请先选择IP", variant: "destructive" })
      return
    }

    setSaving(true)
    await sleep(500)

    const newRef: Reference = {
      id: `ref-${Date.now()}`,
      personaId: state.currentIpId,
      type,
      title,
      url: url || undefined,
      platform,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      source: platform || "其他",
      snapshotUrl: snapshotUrl || undefined,
      extracted: extracted || undefined,
      content: summary || undefined,
      collectedAt: new Date().toISOString(),
    }

    dispatch({ type: "ADD_REFERENCE", payload: newRef })
    toast({ title: "保存成功", description: "参考已添加到参考库" })
    setSaving(false)
    router.push("/references")
  }

  const handleSaveBulk = async () => {
    const trimmed = bulkUrls
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)

    if (trimmed.length === 0) {
      toast({
        title: "没有可用链接",
        description: "请在文本框中粘贴至少一条链接，每行一条",
        variant: "destructive",
      })
      return
    }

    if (!state.currentIpId) {
      toast({ title: "错误", description: "请先选择IP", variant: "destructive" })
      return
    }

    setSaving(true)
    await sleep(500)

    trimmed.forEach((urlLine, index) => {
      const newRef: Reference = {
        id: `ref-${Date.now()}-${index}`,
        personaId: state.currentIpId!,
        type,
        title: urlLine, // 先用链接本身做标题，后续可在详情页再编辑
        url: urlLine,
        platform,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        source: platform || "其他",
        snapshotUrl: undefined,
        extracted: undefined,
        content: undefined,
        collectedAt: new Date().toISOString(),
      }

      dispatch({ type: "ADD_REFERENCE", payload: newRef })
    })

    toast({
      title: "批量保存成功",
      description: `已添加 ${trimmed.length} 条参考链接到参考库`,
    })

    setSaving(false)
    router.push("/references")
  }

  if (!state.currentIpId) {
    return (
      <DashboardLayout>
        <PageHeader title="新建参考" breadcrumbs={[{ label: "参考库", href: "/references" }, { label: "新建" }]} />
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">请先在顶部选择一个IP</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="新建参考"
        breadcrumbs={[{ label: "参考库", href: "/references" }, { label: "新建参考" }]}
        actions={
          <Button variant="outline" onClick={() => router.push("/references")}>
            返回列表
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">收录方式</Label>
                <Tabs value={mode} onValueChange={(v) => setMode(v as "single" | "bulk")}>
                  <TabsList className="grid grid-cols-2">
                    <TabsTrigger value="single">单条</TabsTrigger>
                    <TabsTrigger value="bulk">批量</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {mode === "single" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="ref-title">标题 *</Label>
                    <Input
                      id="ref-title"
                      placeholder="参考内容标题"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ref-url">链接</Label>
                    <Input
                      id="ref-url"
                      placeholder="https://..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                  </div>
                </>
              )}

              {mode === "bulk" && (
                <div className="space-y-2">
                  <Label htmlFor="ref-bulk-urls">批量链接 *</Label>
                  <Textarea
                    id="ref-bulk-urls"
                    placeholder={"一次粘贴多条链接，每行一条，例如：\nhttps://example.com/1\nhttps://example.com/2"}
                    value={bulkUrls}
                    onChange={(e) => setBulkUrls(e.target.value)}
                    rows={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    适合一次收录多条同行内容。这里只用链接作为初始标题，后续可在参考详情页里再补充标题和拆解。
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>平台</Label>
                  <Select value={platform} onValueChange={(v) => setPlatform(v as Reference["platform"])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="douyin">抖音</SelectItem>
                      <SelectItem value="xiaohongshu">小红书</SelectItem>
                      <SelectItem value="wechat">公众号</SelectItem>
                      <SelectItem value="weibo">微博</SelectItem>
                      <SelectItem value="bilibili">B站</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>类型</Label>
                  <Select value={type} onValueChange={(v) => setType(v as Reference["type"])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">视频</SelectItem>
                      <SelectItem value="article">文章</SelectItem>
                      <SelectItem value="post">帖子</SelectItem>
                      <SelectItem value="document">文档</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ref-tags">标签 (逗号分隔)</Label>
                <Input
                  id="ref-tags"
                  placeholder="如：爆款, 竞品分析"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>

              {mode === "single" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="ref-snapshot">截图链接</Label>
                    <Input
                      id="ref-snapshot"
                      placeholder="https://..."
                      value={snapshotUrl}
                      onChange={(e) => setSnapshotUrl(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ref-summary">备注 / 摘要（可选）</Label>
                    <Textarea
                      id="ref-summary"
                      placeholder="简单记录这条参考的要点或使用场景"
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      rows={3}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => router.push("/references")}>
              取消
            </Button>
            {mode === "bulk" ? (
              <Button onClick={handleSaveBulk} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                保存链接
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                保存
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between">
                <span className="font-medium">AI 拆解</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent"
                  onClick={handleGenerateExtract}
                  disabled={generating}
                >
                  {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Sparkles className="mr-2 h-4 w-4" />
                  生成拆解
                </Button>
              </div>

              {extracted ? (
                <div className="p-3 bg-muted rounded-lg space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Hook:</span> {extracted.hook}
                  </p>
                  <p>
                    <span className="font-medium">结构:</span> {extracted.structure}
                  </p>
                  {extracted.cta && (
                    <p>
                      <span className="font-medium">CTA:</span> {extracted.cta}
                    </p>
                  )}
                  {extracted.highlights && (
                    <p>
                      <span className="font-medium">亮点:</span> {extracted.highlights.join(", ")}
                    </p>
                  )}
                  {extracted.risks && (
                    <p>
                      <span className="font-medium">风险:</span> {extracted.risks.join(", ")}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  点击「生成拆解」，根据标题自动提取 Hook、结构和亮点，方便后续选题与工单生成。
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}


