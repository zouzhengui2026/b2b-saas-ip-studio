"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/app-context"
import type { Persona, Settings } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface AssistantOnboardingProps {
  onFinished?: () => void
}

export function AssistantOnboarding({ onFinished }: AssistantOnboardingProps) {
  const { state, dispatch, currentPersona, currentSettings } = useAppStore()
  const { toast } = useToast()

  const [businessDesc, setBusinessDesc] = useState("")
  const [mainOffer, setMainOffer] = useState("")
  const [avgTicketSize, setAvgTicketSize] = useState<string>("")
  const [targetCustomer, setTargetCustomer] = useState("")
  const [platforms, setPlatforms] = useState<string>("抖音, 小红书, 视频号")
  const [tone, setTone] = useState<"story" | "teaching" | "qna">("story")
  const [submitting, setSubmitting] = useState(false)

  if (!state.currentIpId || !currentPersona) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>请选择一个 IP</CardTitle>
          <CardDescription>请先在顶部导航栏选择一个 IP，再开始智能助手问诊。</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const handleSubmit = async () => {
    if (!businessDesc || !mainOffer || !targetCustomer) {
      toast({
        title: "信息不完整",
        description: "请至少填写生意简介、主打产品/服务和目标客户。",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    const parsedTicket = avgTicketSize ? Number(avgTicketSize) || undefined : undefined

    const updatedPersona: Persona = {
      ...currentPersona,
      bio:
        currentPersona.bio ||
        `我是${currentPersona.name}，主要做${businessDesc}，分享真实做生意的经验和踩坑故事。`,
      mainOffer: mainOffer,
      businessStage: currentPersona.businessStage ?? "running",
      avgTicketSize: parsedTicket,
      targetCustomerDescription: targetCustomer,
      updatedAt: new Date().toISOString(),
    }

    const baseSettings: Settings | undefined = currentSettings ?? state.settings[0]
    const updatedSettings: Settings | undefined = baseSettings
      ? {
          ...baseSettings,
          preferredContentTone: tone,
          dailyContentCapacity: baseSettings.dailyContentCapacity ?? 1,
          defaultWeeklyRatio: baseSettings.defaultWeeklyRatio,
          defaultFormats: baseSettings.defaultFormats,
        }
      : undefined

    dispatch({ type: "UPDATE_PERSONA", payload: updatedPersona })
    if (updatedSettings) {
      dispatch({ type: "UPDATE_SETTINGS", payload: updatedSettings })
    }
    dispatch({ type: "SET_ASSISTANT_STAGE", payload: "diagnosed" })

    toast({
      title: "账号定位已生成",
      description: "后续我会按这个定位帮你规划内容路线和每日任务。",
    })

    setSubmitting(false)
    onFinished?.()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>先聊聊你的生意</CardTitle>
        <CardDescription>下面这些问题，帮我快速搞懂你是谁、卖什么、想吸引谁。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="business-desc">你主要是做什么生意？ *</Label>
          <Textarea
            id="business-desc"
            placeholder="比如：帮中小老板做短视频投放；线下有一家美容店；卖私教课……"
            value={businessDesc}
            onChange={(e) => setBusinessDesc(e.target.value)}
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="main-offer">你最想卖的核心产品/服务是什么？ *</Label>
          <Input
            id="main-offer"
            placeholder="比如：1v1咨询服务、线下训练营、长期陪跑服务"
            value={mainOffer}
            onChange={(e) => setMainOffer(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="avg-ticket">大概客单价（可选）</Label>
          <Input
            id="avg-ticket"
            type="number"
            placeholder="比如：500，1999"
            value={avgTicketSize}
            onChange={(e) => setAvgTicketSize(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="target-customer">你最想吸引什么样的客户？ *</Label>
          <Textarea
            id="target-customer"
            placeholder="比如：30-45岁的中小老板，自己带团队，有一定现金流，但内容这块比较薄弱……"
            value={targetCustomer}
            onChange={(e) => setTargetCustomer(e.target.value)}
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="platforms">你主要想在哪些平台发内容？（逗号分隔）</Label>
          <Input
            id="platforms"
            placeholder="比如：抖音, 小红书, 视频号"
            value={platforms}
            onChange={(e) => setPlatforms(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>你更喜欢哪种表达方式？</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={tone === "story" ? "default" : "outline"}
              size="sm"
              onClick={() => setTone("story")}
            >
              讲故事
            </Button>
            <Button
              type="button"
              variant={tone === "teaching" ? "default" : "outline"}
              size="sm"
              onClick={() => setTone("teaching")}
            >
              教方法
            </Button>
            <Button
              type="button"
              variant={tone === "qna" ? "default" : "outline"}
              size="sm"
              onClick={() => setTone("qna")}
            >
              问答拆解
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={handleSubmit} disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          先大概定一下
        </Button>
      </CardFooter>
    </Card>
  )
}


