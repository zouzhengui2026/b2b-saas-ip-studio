"use client"

import { useState, useEffect } from "react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAppStore } from "@/lib/app-context"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Mic, FileText, Sparkles, Link2, Zap } from "lucide-react"
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

  // Reset form when drawer closes
  useEffect(() => {
    if (!open) {
      setTitle("")
      setContent("")
      setAudioUrl("")
      setType("voice")
    }
  }, [open])

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
      title: title || (type === "voice" ? "新录音" : "新笔记"),
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

    setLoading(false)
    onOpenChange(false)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="h-full w-full sm:max-w-md ml-auto rounded-l-xl rounded-r-none">
        <DrawerHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg">
              {type === "voice" ? <Mic className="h-5 w-5 text-white" /> : <FileText className="h-5 w-5 text-white" />}
            </div>
            <div>
              <DrawerTitle className="text-xl">添加录音/笔记</DrawerTitle>
              <DrawerDescription>记录灵感和想法，AI 自动提取关键信息</DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Type Selection */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setType("voice")}
              className={`flex-1 flex items-center gap-3 p-4 rounded-xl border transition-all ${
                type === "voice"
                  ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                  : "border-border/50 bg-secondary/30 hover:border-border hover:bg-secondary/50"
              }`}
            >
              <div className={`p-2 rounded-lg ${type === "voice" ? "bg-primary/20" : "bg-secondary"}`}>
                <Mic className={`h-4 w-4 ${type === "voice" ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div className="text-left">
                <div className={`font-medium ${type === "voice" ? "text-primary" : "text-foreground"}`}>语音录音</div>
                <div className="text-xs text-muted-foreground">录制或粘贴音频</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setType("text")}
              className={`flex-1 flex items-center gap-3 p-4 rounded-xl border transition-all ${
                type === "text"
                  ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                  : "border-border/50 bg-secondary/30 hover:border-border hover:bg-secondary/50"
              }`}
            >
              <div className={`p-2 rounded-lg ${type === "text" ? "bg-primary/20" : "bg-secondary"}`}>
                <FileText className={`h-4 w-4 ${type === "text" ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div className="text-left">
                <div className={`font-medium ${type === "text" ? "text-primary" : "text-foreground"}`}>文本笔记</div>
                <div className="text-xs text-muted-foreground">直接输入文字</div>
              </div>
            </button>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="inbox-title" className="text-foreground">标题</Label>
            <Input 
              id="inbox-title" 
              placeholder={type === "voice" ? "录音标题" : "笔记标题"} 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
            />
          </div>

          {/* Voice specific: Audio URL */}
          {type === "voice" && (
            <div className="space-y-2">
              <Label htmlFor="audio-url" className="flex items-center gap-2 text-foreground">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                音频链接（可选）
              </Label>
              <Input
                id="audio-url"
                placeholder="https://..."
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
              />
            </div>
          )}

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="inbox-content" className="text-foreground">
              {type === "voice" ? "文字内容（模拟语音转文字）" : "笔记内容"}
            </Label>
            <Textarea
              id="inbox-content"
              placeholder={type === "voice" 
                ? "输入或粘贴语音内容，AI 将自动提取选题灵感..." 
                : "输入您的想法和灵感，例如：今天和客户聊天发现一个有意思的话题..."
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
            />
          </div>

          {/* AI Preview */}
          {content && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                AI 将自动提取
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• 选题灵感和延伸话题</p>
                <p>• 关键观点和数据线索</p>
                <p>• 可能的风险和注意事项</p>
                <p>• 内容方向建议</p>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-border/30 space-y-2">
            <div className="text-sm font-medium text-foreground">💡 使用场景</div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• 灵感闪现时快速记录</p>
              <p>• 和客户聊天后记录选题素材</p>
              <p>• 看到好内容后的即时想法</p>
              <p>• 日常思考和复盘记录</p>
            </div>
          </div>
        </div>

        <DrawerFooter className="border-t border-border/50 pt-4">
          <div className="flex gap-3 w-full">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="flex-1 border-border/50"
            >
              取消
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading} 
              className="flex-1 btn-gradient border-0"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Zap className="mr-2 h-4 w-4" />
              提交并提取
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
