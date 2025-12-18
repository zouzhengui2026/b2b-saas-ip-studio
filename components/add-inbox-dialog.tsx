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
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAppStore } from "@/lib/app-context"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Mic, FileText } from "lucide-react"
import { sleep } from "@/lib/utils"
import type { InboxItem, InboxExtractedAssets } from "@/lib/types"

interface AddInboxDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddInboxDialog({ open, onOpenChange }: AddInboxDialogProps) {
  const { state, dispatch } = useAppStore()
  const { toast } = useToast()

  const [type, setType] = useState<"voice" | "text">("voice")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [audioUrl, setAudioUrl] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!content && !audioUrl) {
      toast({ title: "错误", description: "请输入内容或音频链接", variant: "destructive" })
      return
    }
    if (!state.currentIpId) {
      toast({ title: "错误", description: "请先选择IP", variant: "destructive" })
      return
    }

    setLoading(true)
    await sleep(800 + Math.random() * 400)

    // Mock AI processing
    const mockAssets: InboxExtractedAssets = {
      topicSeeds: [`关于「${title || "新录音"}」的选题想法`, "延伸话题：用户痛点分析"],
      evidenceClues: ["可能需要补充相关数据支撑"],
      objections: ["注意规避敏感表述"],
      strategySignals: ["内容方向调整建议"],
    }

    const newInbox: InboxItem = {
      id: `inbox-${Date.now()}`,
      personaId: state.currentIpId,
      type,
      title: title || "新录音",
      transcript: content || undefined,
      memoSummary: content ? `内容摘要：${content.slice(0, 50)}...` : undefined,
      duration: type === "voice" ? Math.floor(Math.random() * 180) + 30 : undefined,
      audioUrl: audioUrl || undefined,
      status: "processed",
      extractedAssets: mockAssets,
      createdAt: new Date().toISOString(),
    }

    dispatch({ type: "ADD_INBOX", payload: newInbox })
    toast({ title: "提交成功", description: "已自动提取选题灵感和关键信息" })

    setTitle("")
    setContent("")
    setAudioUrl("")
    setLoading(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加录音/笔记</DialogTitle>
          <DialogDescription>记录您的灵感和想法，AI将自动提取关键信息</DialogDescription>
        </DialogHeader>

        <Tabs value={type} onValueChange={(v) => setType(v as "voice" | "text")} className="py-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="voice">
              <Mic className="h-4 w-4 mr-2" />
              语音录音
            </TabsTrigger>
            <TabsTrigger value="text">
              <FileText className="h-4 w-4 mr-2" />
              文本笔记
            </TabsTrigger>
          </TabsList>

          <TabsContent value="voice" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="voice-title">标题</Label>
              <Input id="voice-title" placeholder="录音标题" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="audio-url">音频链接 (可选)</Label>
              <Input
                id="audio-url"
                placeholder="https://..."
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="voice-content">文字内容 (模拟语音转文字)</Label>
              <Textarea
                id="voice-content"
                placeholder="输入或粘贴语音内容..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
              />
            </div>
          </TabsContent>

          <TabsContent value="text" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="text-title">标题</Label>
              <Input id="text-title" placeholder="笔记标题" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="text-content">内容</Label>
              <Textarea
                id="text-content"
                placeholder="输入您的想法和灵感..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            提交并提取
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
