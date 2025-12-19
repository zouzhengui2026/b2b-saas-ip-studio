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
import { Loader2, MessageSquare, Package, Users, Globe, Sparkles } from "lucide-react"

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
      <Card className="border-dashed border-border/30">
        <CardHeader>
          <CardTitle className="text-muted-foreground">请选择一个 IP</CardTitle>
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

  const toneOptions = [
    { value: "story" as const, label: "讲故事", desc: "用真实案例打动人" },
    { value: "teaching" as const, label: "教方法", desc: "分享干货和技巧" },
    { value: "qna" as const, label: "问答拆解", desc: "解答常见疑问" },
  ]

  return (
    <Card className="relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[oklch(0.65_0.22_280/0.05)] rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2" />
      
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
            <MessageSquare className="h-4 w-4 text-white" />
          </div>
          先聊聊你的生意
        </CardTitle>
        <CardDescription>下面这些问题，帮我快速搞懂你是谁、卖什么、想吸引谁。</CardDescription>
      </CardHeader>
      <CardContent className="relative space-y-6">
        {/* Business Description */}
        <div className="space-y-2">
          <Label htmlFor="business-desc" className="flex items-center gap-2 text-foreground">
            <Package className="h-4 w-4 text-chart-1" />
            你主要是做什么生意？ <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="business-desc"
            placeholder="比如：帮中小老板做短视频投放；线下有一家美容店；卖私教课……"
            value={businessDesc}
            onChange={(e) => setBusinessDesc(e.target.value)}
            rows={3}
            className="bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary/20 resize-none"
          />
        </div>

        {/* Main Offer */}
        <div className="space-y-2">
          <Label htmlFor="main-offer" className="flex items-center gap-2 text-foreground">
            <Sparkles className="h-4 w-4 text-chart-2" />
            你最想卖的核心产品/服务是什么？ <span className="text-destructive">*</span>
          </Label>
          <Input
            id="main-offer"
            placeholder="比如：1v1咨询服务、线下训练营、长期陪跑服务"
            value={mainOffer}
            onChange={(e) => setMainOffer(e.target.value)}
            className="bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary/20 h-11"
          />
        </div>

        {/* Average Ticket Size */}
        <div className="space-y-2">
          <Label htmlFor="avg-ticket" className="text-foreground">大概客单价（可选）</Label>
          <Input
            id="avg-ticket"
            type="number"
            placeholder="比如：500，1999"
            value={avgTicketSize}
            onChange={(e) => setAvgTicketSize(e.target.value)}
            className="bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary/20 h-11"
          />
        </div>

        {/* Target Customer */}
        <div className="space-y-2">
          <Label htmlFor="target-customer" className="flex items-center gap-2 text-foreground">
            <Users className="h-4 w-4 text-chart-3" />
            你最想吸引什么样的客户？ <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="target-customer"
            placeholder="比如：30-45岁的中小老板，自己带团队，有一定现金流，但内容这块比较薄弱……"
            value={targetCustomer}
            onChange={(e) => setTargetCustomer(e.target.value)}
            rows={3}
            className="bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary/20 resize-none"
          />
        </div>

        {/* Platforms */}
        <div className="space-y-2">
          <Label htmlFor="platforms" className="flex items-center gap-2 text-foreground">
            <Globe className="h-4 w-4 text-chart-4" />
            你主要想在哪些平台发内容？
          </Label>
          <Input
            id="platforms"
            placeholder="比如：抖音, 小红书, 视频号"
            value={platforms}
            onChange={(e) => setPlatforms(e.target.value)}
            className="bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary/20 h-11"
          />
        </div>

        {/* Tone Selection */}
        <div className="space-y-3">
          <Label className="text-foreground">你更喜欢哪种表达方式？</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {toneOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTone(option.value)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  tone === option.value
                    ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                    : "border-border/50 bg-secondary/30 hover:border-border hover:bg-secondary/50"
                }`}
              >
                <div className={`font-medium ${tone === option.value ? "text-primary" : "text-foreground"}`}>
                  {option.label}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{option.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="relative flex justify-end gap-3 pt-2">
        <Button 
          type="button" 
          onClick={handleSubmit} 
          disabled={submitting}
          className="btn-gradient border-0 px-6"
        >
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          生成账号定位
        </Button>
      </CardFooter>
    </Card>
  )
}
