"use client"

import { useState } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAppStore } from "@/lib/app-context"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { mockGenerateContentId, getCurrentWeekNumber, sleep } from "@/lib/utils"
import type { Content } from "@/lib/types"

interface AddContentDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddContentDrawer({ open, onOpenChange }: AddContentDrawerProps) {
  const { state, dispatch, currentEpoch } = useAppStore()
  const { toast } = useToast()

  const [platform, setPlatform] = useState<"douyin" | "xiaohongshu" | "wechat">("douyin")
  const [title, setTitle] = useState("")
  const [topicCluster, setTopicCluster] = useState("")
  const [format, setFormat] = useState<Content["format"]>("talking-head")
  const [hook, setHook] = useState("")
  const [loading, setLoading] = useState(false)

  const topicClusters = ["产品评测", "行业观察", "选购指南", "避坑指南", "使用技巧", "年度盘点"]

  const handleSubmit = async () => {
    if (!title) {
      toast({ title: "错误", description: "请填写标题", variant: "destructive" })
      return
    }
    if (!state.currentIpId) {
      toast({ title: "错误", description: "请先选择IP", variant: "destructive" })
      return
    }

    setLoading(true)
    await sleep(500)

    const newContent: Content = {
      id: mockGenerateContentId(platform),
      personaId: state.currentIpId,
      platform,
      title,
      topicCluster: topicCluster || undefined,
      format,
      epochId: currentEpoch?.id,
      script: hook ? { hook } : undefined,
      evidenceIds: [],
      referenceIds: [],
      status: "draft",
      weekNumber: getCurrentWeekNumber(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    dispatch({ type: "ADD_CONTENT", payload: newContent })
    toast({ title: "创建成功", description: `内容工单 ${newContent.id} 已创建` })

    // Reset
    setPlatform("douyin")
    setTitle("")
    setTopicCluster("")
    setFormat("talking-head")
    setHook("")
    setLoading(false)
    onOpenChange(false)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="h-full w-full sm:max-w-md">
        <DrawerHeader>
          <DrawerTitle>新建内容</DrawerTitle>
          <DrawerDescription>创建一个新的内容工单</DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>平台</Label>
                <Select value={platform} onValueChange={(v) => setPlatform(v as typeof platform)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="douyin">抖音</SelectItem>
                    <SelectItem value="xiaohongshu">小红书</SelectItem>
                    <SelectItem value="wechat">公众号</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>内容形态</Label>
                <Select value={format} onValueChange={(v) => setFormat(v as Content["format"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="talking-head">口播</SelectItem>
                    <SelectItem value="listicle">清单</SelectItem>
                    <SelectItem value="tutorial">教程</SelectItem>
                    <SelectItem value="story">故事</SelectItem>
                    <SelectItem value="vlog">Vlog</SelectItem>
                    <SelectItem value="reaction">反应</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content-title">标题 *</Label>
              <Input id="content-title" placeholder="内容标题" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>主题簇</Label>
              <Select value={topicCluster} onValueChange={setTopicCluster}>
                <SelectTrigger>
                  <SelectValue placeholder="选择主题簇" />
                </SelectTrigger>
                <SelectContent>
                  {topicClusters.map((tc) => (
                    <SelectItem key={tc} value={tc}>
                      {tc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content-hook">Hook (可选)</Label>
              <Textarea
                id="content-hook"
                placeholder="开场钩子"
                value={hook}
                onChange={(e) => setHook(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </div>

        <DrawerFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            创建
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
