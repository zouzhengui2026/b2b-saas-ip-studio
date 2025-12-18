"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAppStore } from "@/lib/app-context"
import { AlertCircle, CalendarClock, Sparkles } from "lucide-react"
import { AssistantOnboarding } from "@/components/assistant-onboarding"
import { AssistantTodayTask } from "@/components/assistant-today-task"
import { AssistantWeeklySummary } from "@/components/assistant-weekly-summary"

type TodayTaskStatus = "onboarding" | "need_content" | "waiting_publish" | "waiting_feedback" | "done"

export default function AssistantPage() {
  const { state, currentPersona } = useAppStore()
  const router = useRouter()

  const todayTaskStatus: TodayTaskStatus = useMemo(() => {
    if (!state.currentIpId) return "onboarding"
    if (!state.assistantStage || state.assistantStage === "not_started") return "onboarding"
    // V1: 先简单返回需要内容，后续由 AssistantTodayTask 细分
    return "need_content"
  }, [state.currentIpId, state.assistantStage])

  const subtitle =
    todayTaskStatus === "onboarding"
      ? "先把你的生意和账号目标讲清楚，我来帮你定一个起号路线图。"
      : "每天陪你走完一条内容，从选题到脚本到效果复盘。"

  return (
    <DashboardLayout>
      <PageHeader title="智能助手" breadcrumbs={[{ label: "智能助手" }]} />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            起号陪跑 · 中小老板版
          </CardTitle>
          <CardDescription>{subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            <span>
              当前IP：<span className="font-medium text-foreground">{currentPersona?.name ?? "未选择"}</span>
            </span>
          </div>
          {!state.currentIpId && (
            <div className="flex items-center gap-2 text-destructive mt-1">
              <AlertCircle className="h-4 w-4" />
              <span>请先在顶部选择一个 IP，再开始使用智能助手。</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {todayTaskStatus === "onboarding" ? (
            <AssistantOnboarding onFinished={() => {}} />
          ) : (
            <AssistantTodayTask />
          )}
        </div>
        <div className="space-y-6">
          <AssistantWeeklySummary />
        </div>
      </div>
    </DashboardLayout>
  )
}


