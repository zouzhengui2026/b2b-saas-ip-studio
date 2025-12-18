"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useAppStore } from "@/lib/app-context"
import { useToast } from "@/hooks/use-toast"
import { Sparkles, Loader2, ChevronRight, ChevronLeft, Lightbulb } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { mockGenerateContentId, getCurrentWeekNumber, sleep, platformNames, formatNames } from "@/lib/utils"
import type { Content } from "@/lib/types"
import { useRouter } from "next/navigation"

interface GenerateWeeklyWizardProps {
  // 可选：生成完成或用户取消时的回调，由容器（例如页面）决定跳转逻辑
  onFinished?: () => void
}

interface GeneratedTopic {
  id: string
  platform: "douyin" | "xiaohongshu" | "wechat"
  title: string
  hook: string
  topicCluster: string
  format: string
  evidenceSuggestion: string
  selected: boolean
  fromDraftSource?: boolean // mark if from user's draft source
}

export function GenerateWeeklyWizard({ onFinished }: GenerateWeeklyWizardProps) {
  const { state, dispatch, currentOrgPersonas, currentEpoch, currentSettings } = useAppStore()
  const { toast } = useToast()
  const router = useRouter()

  const [step, setStep] = useState<"config" | "result">("config")
  const [loading, setLoading] = useState(false)
  const [batchLoading, setBatchLoading] = useState(false)

  // Config - 从settings读取默认值
  const defaultRatio = currentSettings?.defaultWeeklyRatio || { douyin: 6, xiaohongshu: 4, wechat: 2 }
  // IP固定为当前选中的IP，不允许切换
  const selectedIpId = state.currentIpId || ""
  const currentPersona = currentOrgPersonas.find((p) => p.id === selectedIpId)
  const [douyinCount, setDouyinCount] = useState(defaultRatio.douyin)
  const [xhsCount, setXhsCount] = useState(defaultRatio.xiaohongshu)
  const [wxCount, setWxCount] = useState(defaultRatio.wechat)
  const [weekFocus, setWeekFocus] = useState("")
  const [useInspiration, setUseInspiration] = useState(true)
  const [useInboxSeeds, setUseInboxSeeds] = useState(true)
  const [useTopPatterns, setUseTopPatterns] = useState(true)
  const [useDraftSources, setUseDraftSources] = useState(true) // new option for draft sources

  // Result
  const [generatedTopics, setGeneratedTopics] = useState<GeneratedTopic[]>([])

  const topicClusters = ["产品评测", "行业观察", "选购指南", "避坑指南", "使用技巧", "年度盘点"]
  const defaultFormatsList = currentSettings?.defaultFormats || ["talking-head", "listicle", "tutorial"]
  const formats = ["talking-head", "listicle", "tutorial", "story", "vlog"]

  const draftSourcesCount = state.weeklyDraftSources.length

  // settings 变化时重置默认值
  useEffect(() => {
    const ratio = currentSettings?.defaultWeeklyRatio || { douyin: 6, xiaohongshu: 4, wechat: 2 }
    setDouyinCount(ratio.douyin)
    setXhsCount(ratio.xiaohongshu)
    setWxCount(ratio.wechat)
  }, [currentSettings])

  const handleGenerate = async () => {
    if (!selectedIpId) {
      toast({ title: "错误", description: "请选择IP", variant: "destructive" })
      return
    }
    setLoading(true)
    await sleep(800 + Math.random() * 400)

    const topics: GeneratedTopic[] = []
    const totalCount = douyinCount + xhsCount + wxCount

    const draftSources = useDraftSources ? [...state.weeklyDraftSources] : []
    let draftSourceIndex = 0

    for (let i = 0; i < totalCount; i++) {
      let platform: "douyin" | "xiaohongshu" | "wechat"
      if (i < douyinCount) platform = "douyin"
      else if (i < douyinCount + xhsCount) platform = "xiaohongshu"
      else platform = "wechat"

      const cluster = topicClusters[Math.floor(Math.random() * topicClusters.length)]
      // 优先使用settings中的defaultFormats，如果没有则随机选择
      const format =
        defaultFormatsList.length > 0
          ? defaultFormatsList[Math.floor(Math.random() * defaultFormatsList.length)]
          : formats[Math.floor(Math.random() * formats.length)]

      const hasDraftSource = draftSourceIndex < draftSources.length
      const draftSource = hasDraftSource ? draftSources[draftSourceIndex] : null

      if (hasDraftSource) {
        draftSourceIndex++
      }

      topics.push({
        id: `topic-${i}`,
        platform,
        title: draftSource
          ? `${cluster}：${draftSource}` // use draft source as part of title
          : `${cluster}：${weekFocus || "本周重点话题"} #${i + 1}`,
        hook: draftSource
          ? `来自你的灵感：${draftSource}...` // indicate this comes from user input
          : `这是一个关于${cluster}的精彩开头...`,
        topicCluster: cluster,
        format,
        evidenceSuggestion: "建议引用相关案例数据",
        selected: true,
        fromDraftSource: hasDraftSource, // mark origin
      })
    }

    setGeneratedTopics(topics)
    setStep("result")
    setLoading(false)
  }

  const handleToggleTopic = (id: string) => {
    setGeneratedTopics((prev) => prev.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t)))
  }

  const handleBatchCreate = async () => {
    const selectedTopics = generatedTopics.filter((t) => t.selected)
    if (selectedTopics.length === 0) {
      toast({ title: "错误", description: "请至少选择一个选题", variant: "destructive" })
      return
    }

    setBatchLoading(true)
    await sleep(800 + Math.random() * 400)

    const weekNumber = getCurrentWeekNumber()
    const newContents: Content[] = selectedTopics.map((topic) => ({
      id: mockGenerateContentId(topic.platform),
      personaId: selectedIpId,
      platform: topic.platform,
      title: topic.title,
      topicCluster: topic.topicCluster,
      format: topic.format as Content["format"],
      epochId: currentEpoch?.id,
      script: {
        hook: topic.hook,
        outline: [],
      },
      evidenceIds: [],
      referenceIds: [],
      status: "draft" as const,
      weekNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))

    dispatch({ type: "ADD_CONTENTS_BATCH", payload: newContents })
    dispatch({ type: "CLEAR_DRAFT_SOURCES" }) // clear draft sources after use

    toast({ title: "创建成功", description: `已创建 ${newContents.length} 条内容工单` })
    setBatchLoading(false)
    setStep("config")
    setGeneratedTopics([])

    // 由容器决定跳转逻辑，默认跳到内容工单
    if (onFinished) {
      onFinished()
    } else {
      router.push("/contents")
    }
  }

  const handleCancel = () => {
    setStep("config")
    setGeneratedTopics([])
    if (onFinished) {
      onFinished()
    } else {
      router.back()
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          生成本周选题
        </h2>
        <p className="text-sm text-muted-foreground">
          {step === "config" ? "配置本周内容计划参数" : "选择要纳入本周的选题"}
        </p>
      </div>

      {step === "config" && (
        <div className="space-y-6 py-2">
            <div className="space-y-2">
              <Label>当前IP</Label>
              <Input
                value={currentPersona?.name || "未选择IP"}
                disabled
                className="bg-muted cursor-not-allowed"
                readOnly
              />
              {!selectedIpId && (
                <p className="text-sm text-muted-foreground">请在顶部导航栏选择一个IP</p>
              )}
            </div>

            {currentEpoch && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  当前阶段: <span className="font-medium">{currentEpoch.name}</span>
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Label>各平台内容数量</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">抖音</Label>
                  <Input
                    type="number"
                    min={0}
                    max={20}
                    value={douyinCount}
                    onChange={(e) => setDouyinCount(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">小红书</Label>
                  <Input
                    type="number"
                    min={0}
                    max={20}
                    value={xhsCount}
                    onChange={(e) => setXhsCount(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">视频号</Label>
                  <Input
                    type="number"
                    min={0}
                    max={20}
                    value={wxCount}
                    onChange={(e) => setWxCount(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weekFocus">本周重点</Label>
              <Input
                id="weekFocus"
                placeholder="如：年终盘点、新品发布"
                value={weekFocus}
                onChange={(e) => setWeekFocus(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <Label>选题来源</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="draftSources"
                    checked={useDraftSources}
                    onCheckedChange={(c) => setUseDraftSources(!!c)}
                  />
                  <label htmlFor="draftSources" className="text-sm flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    选题池灵感
                    <Badge variant={draftSourcesCount > 0 ? "default" : "secondary"}>{draftSourcesCount}</Badge>
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="inspiration" checked={useInspiration} onCheckedChange={(c) => setUseInspiration(!!c)} />
                  <label htmlFor="inspiration" className="text-sm">
                    参考库灵感 ({state.references.filter((r) => r.isInspiration).length})
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="inbox" checked={useInboxSeeds} onCheckedChange={(c) => setUseInboxSeeds(!!c)} />
                  <label htmlFor="inbox" className="text-sm">
                    Inbox选题种子 ({state.inboxItems.filter((i) => i.extractedAssets?.topicSeeds?.length).length})
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="top" checked={useTopPatterns} onCheckedChange={(c) => setUseTopPatterns(!!c)} />
                  <label htmlFor="top" className="text-sm">
                    上周最佳模式
                  </label>
                </div>
              </div>
            </div>

            {draftSourcesCount > 0 && useDraftSources && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg space-y-2">
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  选题池内容将优先用于生成选题
                </p>
                <div className="flex flex-wrap gap-1">
                  {state.weeklyDraftSources.slice(0, 5).map((source, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {source.length > 20 ? source.slice(0, 20) + "..." : source}
                    </Badge>
                  ))}
                  {draftSourcesCount > 5 && (
                    <Badge variant="secondary" className="text-xs">
                      +{draftSourcesCount - 5} 更多
                    </Badge>
                  )}
                </div>
              </div>
            )}
        </div>
      )}

      {step === "result" && (
        <div className="space-y-4 py-2 max-h-[50vh] overflow-y-auto">
            {generatedTopics.map((topic) => (
              <div
                key={topic.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${topic.selected ? "border-primary bg-primary/5" : "border-muted"}`}
                onClick={() => handleToggleTopic(topic.id)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox checked={topic.selected} onCheckedChange={() => handleToggleTopic(topic.id)} />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{platformNames[topic.platform]}</Badge>
                      <Badge variant="secondary">{topic.topicCluster}</Badge>
                      <Badge variant="secondary">{formatNames[topic.format] || topic.format}</Badge>
                      {topic.fromDraftSource && (
                        <Badge variant="default" className="bg-yellow-500 text-white">
                          <Lightbulb className="h-3 w-3 mr-1" />
                          来自选题池
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium">{topic.title}</p>
                    <p className="text-sm text-muted-foreground">{topic.hook}</p>
                    <p className="text-xs text-muted-foreground">证据建议: {topic.evidenceSuggestion}</p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end border-t pt-4">
        {step === "config" ? (
          <>
            <Button variant="outline" onClick={handleCancel}>
              取消
            </Button>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              生成选题单
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={() => setStep("config")}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              返回配置
            </Button>
            <Button onClick={handleBatchCreate} disabled={batchLoading}>
              {batchLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              批量生成脚本 ({generatedTopics.filter((t) => t.selected).length})
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
