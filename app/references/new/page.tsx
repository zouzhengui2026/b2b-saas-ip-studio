"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAppStore } from "@/lib/app-context"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Sparkles, Link2, FileText, Layers, ArrowLeft, Zap, CheckCircle2 } from "lucide-react"
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
        title: urlLine,
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
        <PageHeader title="收录参考" breadcrumbs={[{ label: "参考库", href: "/references" }, { label: "收录参考" }]} />
        <Card className="border-dashed border-border/30">
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
        title="收录参考"
        breadcrumbs={[{ label: "参考库", href: "/references" }, { label: "收录参考" }]}
        actions={
          <Button 
            variant="outline" 
            onClick={() => router.push("/references")}
            className="border-border/50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回列表
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mode Selection */}
          <div className="flex gap-3">
            <button
              onClick={() => setMode("single")}
              className={`flex-1 flex items-center gap-3 p-4 rounded-xl border transition-all ${
                mode === "single"
                  ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                  : "border-border/50 bg-secondary/30 hover:border-border hover:bg-secondary/50"
              }`}
            >
              <div className={`p-2 rounded-lg ${mode === "single" ? "bg-primary/20" : "bg-secondary"}`}>
                <FileText className={`h-5 w-5 ${mode === "single" ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div className="text-left">
                <div className={`font-medium ${mode === "single" ? "text-primary" : "text-foreground"}`}>单条收录</div>
                <div className="text-xs text-muted-foreground">详细填写一条参考内容</div>
              </div>
            </button>
            <button
              onClick={() => setMode("bulk")}
              className={`flex-1 flex items-center gap-3 p-4 rounded-xl border transition-all ${
                mode === "bulk"
                  ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                  : "border-border/50 bg-secondary/30 hover:border-border hover:bg-secondary/50"
              }`}
            >
              <div className={`p-2 rounded-lg ${mode === "bulk" ? "bg-primary/20" : "bg-secondary"}`}>
                <Layers className={`h-5 w-5 ${mode === "bulk" ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div className="text-left">
                <div className={`font-medium ${mode === "bulk" ? "text-primary" : "text-foreground"}`}>批量收录</div>
                <div className="text-xs text-muted-foreground">一次粘贴多条链接</div>
              </div>
            </button>
          </div>

          {/* Form Card */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[oklch(0.65_0.22_280/0.05)] rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2" />
            
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-2">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${mode === "single" ? "from-violet-500 to-purple-600" : "from-cyan-500 to-blue-600"}`}>
                  {mode === "single" ? <FileText className="h-4 w-4 text-white" /> : <Layers className="h-4 w-4 text-white" />}
                </div>
                {mode === "single" ? "参考内容详情" : "批量链接"}
              </CardTitle>
              <CardDescription>
                {mode === "single" 
                  ? "填写标题和链接，可选填其他详细信息" 
                  : "一次粘贴多条链接，每行一条，后续可在详情页补充信息"}
              </CardDescription>
            </CardHeader>

            <CardContent className="relative space-y-5">
              {mode === "single" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="ref-title" className="flex items-center gap-2">
                      标题 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="ref-title"
                      placeholder="参考内容标题，例如：3分钟讲透私域运营"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ref-url" className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                      链接
                    </Label>
                    <Input
                      id="ref-url"
                      placeholder="https://..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>平台</Label>
                      <Select value={platform} onValueChange={(v) => setPlatform(v as Reference["platform"])}>
                        <SelectTrigger className="bg-secondary/50 border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass-card border-border/50">
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
                        <SelectTrigger className="bg-secondary/50 border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass-card border-border/50">
                          <SelectItem value="video">视频</SelectItem>
                          <SelectItem value="article">文章</SelectItem>
                          <SelectItem value="post">帖子</SelectItem>
                          <SelectItem value="document">文档</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ref-tags">标签（逗号分隔）</Label>
                    <Input
                      id="ref-tags"
                      placeholder="如：爆款, 竞品分析, 选题"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ref-snapshot">截图链接（可选）</Label>
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
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="ref-bulk-urls" className="flex items-center gap-2">
                      批量链接 <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="ref-bulk-urls"
                      placeholder={"一次粘贴多条链接，每行一条，例如：\nhttps://www.douyin.com/video/xxx\nhttps://www.xiaohongshu.com/explore/xxx\nhttps://mp.weixin.qq.com/s/xxx"}
                      value={bulkUrls}
                      onChange={(e) => setBulkUrls(e.target.value)}
                      rows={8}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      已输入 {bulkUrls.split("\n").filter(l => l.trim()).length} 条链接
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>平台（统一设置）</Label>
                      <Select value={platform} onValueChange={(v) => setPlatform(v as Reference["platform"])}>
                        <SelectTrigger className="bg-secondary/50 border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass-card border-border/50">
                          <SelectItem value="douyin">抖音</SelectItem>
                          <SelectItem value="xiaohongshu">小红书</SelectItem>
                          <SelectItem value="wechat">公众号</SelectItem>
                          <SelectItem value="weibo">微博</SelectItem>
                          <SelectItem value="bilibili">B站</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>类型（统一设置）</Label>
                      <Select value={type} onValueChange={(v) => setType(v as Reference["type"])}>
                        <SelectTrigger className="bg-secondary/50 border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass-card border-border/50">
                          <SelectItem value="video">视频</SelectItem>
                          <SelectItem value="article">文章</SelectItem>
                          <SelectItem value="post">帖子</SelectItem>
                          <SelectItem value="document">文档</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ref-tags">标签（统一设置，逗号分隔）</Label>
                    <Input
                      id="ref-tags"
                      placeholder="如：同行参考, 抖音爆款"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => router.push("/references")}
              className="border-border/50"
            >
              取消
            </Button>
            {mode === "bulk" ? (
              <Button 
                onClick={handleSaveBulk} 
                disabled={saving}
                className="btn-gradient border-0"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <CheckCircle2 className="mr-2 h-4 w-4" />
                保存 {bulkUrls.split("\n").filter(l => l.trim()).length} 条链接
              </Button>
            ) : (
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="btn-gradient border-0"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <CheckCircle2 className="mr-2 h-4 w-4" />
                保存参考
              </Button>
            )}
          </div>
        </div>

        {/* Right: AI Extract */}
        <div className="space-y-6">
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[oklch(0.70_0.15_200/0.08)] rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2" />
            
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                AI 拆解
              </CardTitle>
              <CardDescription>
                自动提取 Hook、结构、亮点，方便后续选题
              </CardDescription>
            </CardHeader>

            <CardContent className="relative space-y-4">
              <Button
                variant="outline"
                className="w-full border-border/50 hover:border-primary/50 hover:bg-primary/5"
                onClick={handleGenerateExtract}
                disabled={generating || !title}
              >
                {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Zap className="mr-2 h-4 w-4 text-amber-400" />
                生成拆解
              </Button>

              {!title && mode === "single" && (
                <p className="text-xs text-muted-foreground text-center">
                  请先填写标题再生成拆解
                </p>
              )}

              {mode === "bulk" && (
                <p className="text-xs text-muted-foreground text-center">
                  批量收录后，可在参考详情页单独进行拆解
                </p>
              )}

              {extracted && (
                <div className="space-y-3 p-4 rounded-xl bg-secondary/30 border border-border/30">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Hook</div>
                    <p className="text-sm text-foreground">{extracted.hook}</p>
                  </div>
                  <div className="divider-glow" />
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">结构</div>
                    <p className="text-sm text-foreground">{extracted.structure}</p>
                  </div>
                  {extracted.cta && (
                    <>
                      <div className="divider-glow" />
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">CTA</div>
                        <p className="text-sm text-foreground">{extracted.cta}</p>
                      </div>
                    </>
                  )}
                  {extracted.highlights && extracted.highlights.length > 0 && (
                    <>
                      <div className="divider-glow" />
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">亮点</div>
                        <div className="flex flex-wrap gap-1">
                          {extracted.highlights.map((h, i) => (
                            <span key={i} className="text-xs px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-400">
                              {h}
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  {extracted.risks && extracted.risks.length > 0 && (
                    <>
                      <div className="divider-glow" />
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">风险</div>
                        <div className="flex flex-wrap gap-1">
                          {extracted.risks.map((r, i) => (
                            <span key={i} className="text-xs px-2 py-1 rounded-md bg-amber-500/20 text-amber-400">
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="border-border/30">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-primary">💡</span>
                  <span>收录同行爆款内容，分析其 Hook 和结构</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary">💡</span>
                  <span>标签方便后续筛选，如「爆款」「竞品」等</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary">💡</span>
                  <span>AI 拆解可帮你快速理解内容结构</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
