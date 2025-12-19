"use client"

import { useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAppStore } from "@/lib/app-context"
import { AlertCircle, CalendarClock, Sparkles, Zap, Bot } from "lucide-react"
import { AssistantOnboarding } from "@/components/assistant-onboarding"
import { AssistantTodayTask } from "@/components/assistant-today-task"
import { AssistantWeeklySummary } from "@/components/assistant-weekly-summary"

type TodayTaskStatus = "onboarding" | "need_content" | "waiting_publish" | "waiting_feedback" | "done"

export default function AssistantPage() {
  const { state, currentPersona } = useAppStore()

  const todayTaskStatus: TodayTaskStatus = useMemo(() => {
    if (!state.currentIpId) return "onboarding"
    if (!state.assistantStage || state.assistantStage === "not_started") return "onboarding"
    return "need_content"
  }, [state.currentIpId, state.assistantStage])

  const subtitle =
    todayTaskStatus === "onboarding"
      ? "先把你的生意和账号目标讲清楚，我来帮你定一个起号路线图。"
      : "每天陪你走完一条内容，从选题到脚本到效果复盘。"

  return (
    <DashboardLayout>
      <PageHeader title="智能助手" breadcrumbs={[{ label: "智能助手" }]} />

      {/* Hero Card */}
      <Card className="mb-6 relative overflow-hidden animate-fade-in">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.55_0.25_280/0.1)] to-[oklch(0.60_0.20_220/0.05)]" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-[oklch(0.65_0.22_280/0.1)] rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
        
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[oklch(0.55_0.25_280)] to-[oklch(0.60_0.20_220)] shadow-lg shadow-[oklch(0.65_0.22_280/0.3)]">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-gradient text-xl">起号陪跑</span>
              <span className="text-muted-foreground text-sm ml-2">· 中小老板版</span>
            </div>
          </CardTitle>
          <CardDescription className="text-base mt-2">{subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="relative flex flex-col gap-3 text-sm">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border/50">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <CalendarClock className="h-4 w-4 text-primary" />
            </div>
            <span className="text-muted-foreground">
              当前IP：<span className="font-semibold text-foreground">{currentPersona?.name ?? "未选择"}</span>
            </span>
          </div>
          {!state.currentIpId && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="p-1.5 rounded-lg bg-destructive/20">
                <AlertCircle className="h-4 w-4 text-destructive" />
              </div>
              <span className="text-destructive">请先在顶部选择一个 IP，再开始使用智能助手。</span>
            </div>
          )}
          {state.currentIpId && todayTaskStatus !== "onboarding" && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="p-1.5 rounded-lg bg-emerald-500/20">
                <Zap className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="text-emerald-400">账号定位已完成，可以开始今日内容创作</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="animate-slide-up delay-100">
            {todayTaskStatus === "onboarding" ? (
              <AssistantOnboarding onFinished={() => {}} />
            ) : (
              <AssistantTodayTask />
            )}
          </div>
        </div>
        <div className="space-y-6">
          <div className="animate-slide-up delay-200">
            <AssistantWeeklySummary />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
