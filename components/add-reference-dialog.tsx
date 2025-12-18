"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAppStore } from "@/lib/app-context"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Sparkles } from "lucide-react"
import { sleep } from "@/lib/utils"
import type { Reference, ReferenceExtracted } from "@/lib/types"

interface AddReferenceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddReferenceDialog({ open, onOpenChange }: AddReferenceDialogProps) {
  const { state, dispatch } = useAppStore()
  const { toast } = useToast()

  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [platform, setPlatform] = useState<Reference["platform"]>("douyin")
  const [type, setType] = useState<Reference["type"]>("video")
  const [tags, setTags] = useState("")
  const [snapshotUrl, setSnapshotUrl] = useState("")
  const [extracted, setExtracted] = useState<ReferenceExtracted | null>(null)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)

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
      collectedAt: new Date().toISOString(),
    }

    dispatch({ type: "ADD_REFERENCE", payload: newRef })
    toast({ title: "保存成功", description: "参考已添加到参考库" })

    // Reset form
    setTitle("")
    setUrl("")
    setPlatform("douyin")
    setType("video")
    setTags("")
    setSnapshotUrl("")
    setExtracted(null)
    setSaving(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>收录参考</DialogTitle>
          <DialogDescription>添加优质内容作为创作参考</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="ref-title">标题 *</Label>
            <Input id="ref-title" placeholder="参考内容标题" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ref-url">链接</Label>
            <Input id="ref-url" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="ref-snapshot">截图链接</Label>
            <Input
              id="ref-snapshot"
              placeholder="https://..."
              value={snapshotUrl}
              onChange={(e) => setSnapshotUrl(e.target.value)}
            />
          </div>

          <Button
            variant="outline"
            className="w-full bg-transparent"
            onClick={handleGenerateExtract}
            disabled={generating}
          >
            {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Sparkles className="mr-2 h-4 w-4" />
            生成拆解
          </Button>

          {extracted && (
            <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
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
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
