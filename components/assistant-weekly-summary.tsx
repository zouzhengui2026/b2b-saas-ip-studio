"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/app-context"
import { TrendingUp, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getCurrentWeekNumber, sleep, platformNames } from "@/lib/utils"
import type { Content } from "@/lib/types"

export function AssistantWeeklySummary() {
  const { state, dispatch } = useAppStore()
  const { toast } = useToast()

  const { insights, hasEnoughData, topContents } = useMemo(() => {
    if (!state.currentIpId) {
      return { insights: [] as string[], hasEnoughData: false, topContents: [] as Content[] }
    }

    const contents = state.contents.filter(
      (c) => c.personaId === state.currentIpId && c.status === "published" && c.metrics?.inquiries,
    )
    const sorted = [...contents].sort((a, b) => (b.metrics?.inquiries || 0) - (a.metrics?.inquiries || 0))
    const top = sorted.slice(0, 3)

    if (top.length < 2) {
      return { insights: [] as string[], hasEnoughData: false, topContents: top }
    }

    const clusters = [...new Set(top.map((c) => c.topicCluster).filter(Boolean))] as string[]
    const mainCluster = clusters[0] || "核心业务相关话题"
    const bestPlatform = platformNames[top[0].platform] || "抖音"

    const result = [
      `最近咨询表现最好的是「${mainCluster}」相关内容，建议下周多做 2 条类似主题。`,
      `带有具体数字/步骤的内容（例如「3个…」「5步…」）互动和咨询明显更高，可以继续多用这种结构。`,
      `当前在 ${bestPlatform} 上的内容转化更稳定，可以优先保证该平台的内容节奏，其他平台以铺量为主。`,
    ]

    return { insights: result, hasEnoughData: true, topContents: top }
  }, [state.contents, state.currentIpId])

  const handleGenerateNextWeek = async () => {
    if (!state.currentIpId) return
    if (!hasEnoughData || topContents.length === 0) {
      toast({
        title: "数据还不够",
        description: "至少需要 2 条带有咨询数据的内容，才能生成下周草案。",
        variant: "destructive",
      })
      return
    }

    await sleep(400)
    const weekNumber = getCurrentWeekNumber()

    const drafts: Content[] = topContents.map((base, index) => ({
      ...base,
      id: `${base.id}-NEXT-${index + 1}`,
      status: "idea",
      metrics: undefined,
      publishedAt: undefined,
      publishUrl: undefined,
      weekNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))

    dispatch({ type: "ADD_CONTENTS_BATCH", payload: drafts })
    toast({
      title: "下周草案已生成",
      description: `已基于本周表现较好的内容生成 ${drafts.length} 条下周内容草案。`,
    })
  }

  if (!state.currentIpId) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          一周小结 & 下周建议
        </CardTitle>
        <CardDescription>基于你目前回填的咨询数据，给出简单可执行的方向建议。</CardDescription>
      </CardHeader>
      <CardContent>
        {hasEnoughData ? (
          <ul className="space-y-2 text-sm">
            {insights.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-primary font-medium">{idx + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            目前带有咨询数据的内容还比较少，先从「今日任务」开始稳定发几条，后面我会帮你自动总结哪类内容更值钱。
          </p>
        )}
      </CardContent>
      {hasEnoughData && (
        <CardFooter className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>可以一键基于这些内容，生成下周的 2~3 条草案。</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleGenerateNextWeek}>
            生成下周草案
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}


