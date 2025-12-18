"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/app-context"
import type { Content, ContentStatus } from "@/lib/types"
import { getCurrentWeekNumber, mockGenerateContentId, sleep } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

type ThemeType = "pain" | "story" | "tip" | "offer"

export function AssistantTodayTask() {
  const { state, dispatch, currentPersona, currentEpoch } = useAppStore()
  const { toast } = useToast()
  const router = useRouter()

  const [platform, setPlatform] = useState<Content["platform"]>("douyin")
  const [theme, setTheme] = useState<ThemeType>("pain")
  const [seed, setSeed] = useState("")
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    if (!state.currentIpId || !currentPersona) {
      toast({
        title: "请先选择 IP",
        description: "在顶部选择一个 IP 后，再生成今日内容。",
        variant: "destructive",
      })
      return
    }
    if (!seed) {
      toast({
        title: "还差一句话",
        description: "简单写一句你今天最想讲的点，我来帮你展开成脚本。",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    await sleep(500)

    const themeMap: Record<ThemeType, { cluster: string; format: Content["format"]; label: string }> = {
      pain: { cluster: "客户痛点", format: "talking-head", label: "痛点拆解" },
      story: { cluster: "真实故事", format: "story", label: "故事分享" },
      tip: { cluster: "操作技巧", format: "tutorial", label: "实用技巧" },
      offer: { cluster: "产品/服务介绍", format: "talking-head", label: "产品说明" },
    }

    const themeInfo = themeMap[theme]
    const baseTitle =
      theme === "pain"
        ? `很多老板都在问：${seed}`
        : theme === "story"
          ? `${seed} 的真实故事`
          : theme === "tip"
            ? `${seed} 的3个关键做法`
            : `为什么说${seed} 很适合你现在的阶段？`

    const newContent: Content = {
      id: mockGenerateContentId(platform),
      personaId: state.currentIpId,
      platform,
      title: baseTitle,
      topicCluster: themeInfo.cluster,
      format: themeInfo.format,
      epochId: currentEpoch?.id,
      script: {
        hook:
          theme === "pain"
            ? `你是不是也遇到过这种情况：${seed}？`
            : theme === "story"
              ? `跟你讲一个我/客户真实遇到的故事：${seed}`
              : theme === "tip"
                ? `今天分享几个非常实用的小技巧，帮你搞定「${seed}」`
                : `很多老板问我：${seed} 到底值不值得做？今天一次讲清楚。`,
        outline:
          theme === "story"
            ? ["背景和人物", "冲突/问题", "转折点", "结果", "复盘和启示"]
            : ["先说结论", "具体拆解1", "具体拆解2", "具体拆解3", "总结和行动建议"],
        fullScript: `今天想跟你聊一个和「${seed}」有关的话题。\n\n先说结论：${
          theme === "pain" ? "如果不解决这个问题，后面会越来越被动。" : "只要抓住几个关键点，其实没有你想得那么难。"
        }\n\n接下来我会用几个小段落，帮你把这个话题讲透：\n1）当前常见做法的问题\n2）我这边的实战经验\n3）可以马上照着做的具体步骤。\n\n最后，我会给你一个非常简单的下一步行动建议。`,
      },
      evidenceIds: [],
      referenceIds: [],
      status: "draft",
      weekNumber: getCurrentWeekNumber(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    dispatch({ type: "ADD_CONTENT", payload: newContent })
    dispatch({ type: "SET_ASSISTANT_STAGE", payload: "week1" })

    toast({
      title: "今日内容已生成",
      description: `已为你创建内容工单 ${newContent.id}，可以继续在详情里微调脚本。`,
    })

    setLoading(false)
    router.push(`/contents/${newContent.id}`)
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle>今日任务：先拿下一条内容</CardTitle>
        <CardDescription>用一句你最想讲的话，生成一条今天的内容工单和脚本草稿。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>今天更想做哪一类内容？</Label>
            <Select value={theme} onValueChange={(v) => setTheme(v as ThemeType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pain">客户常见痛点</SelectItem>
                <SelectItem value="story">真实故事/案例</SelectItem>
                <SelectItem value="tip">操作技巧/清单</SelectItem>
                <SelectItem value="offer">产品/服务说明</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>准备发到哪个平台？</Label>
            <Select value={platform} onValueChange={(v) => setPlatform(v as Content["platform"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="douyin">抖音</SelectItem>
                <SelectItem value="xiaohongshu">小红书</SelectItem>
                <SelectItem value="wechat">视频号</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="seed">用你自己的话说一句，今天最想讲什么？ *</Label>
          <Textarea
            id="seed"
            placeholder='比如：“很多老板做抖音一年，一条带货视频都没有” / “我有个学员3个月从0做到月收30万”'
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            rows={3}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleGenerate} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          一键生成今日内容
        </Button>
      </CardFooter>
    </Card>
  )
}

// 预留：后续在这里根据 contents 计算 waiting_publish / waiting_feedback 等状态
export function getTodayTaskStatusForContents(
  _contents: Content[],
  _targetStatuses: ContentStatus[],
): "need_content" | "waiting_publish" | "waiting_feedback" | "done" {
  // V1 先全部视为 need_content，后续可以按日期和状态细分
  return "need_content"
}



