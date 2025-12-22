"use client"

import { useState, useMemo, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppStore } from "@/lib/app-context"
import { EmptyStateCard } from "@/components/empty-state-card"
import { AddInboxDialog } from "@/components/add-inbox-dialog"
import { AddLeadDrawer } from "@/components/add-lead-dialog"
import {
  Target,
  Calendar,
  HandCoins,
  FileText,
  AlertCircle,
  Sparkles,
  BookOpen,
  Mic,
  UserPlus,
  ArrowRight,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { platformNames } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export default function DashboardPage() {
  // ========== 所有 Hooks 必须在最前面，不能在条件返回之后 ==========
  const { state, currentPersona, isLoading } = useAppStore()
  const router = useRouter()
  const [addInboxOpen, setAddInboxOpen] = useState(false)
  const [addLeadOpen, setAddLeadOpen] = useState(false)

  const ipContents = useMemo(
    () => state.contents.filter((c) => c.personaId === state.currentIpId),
    [state.contents, state.currentIpId],
  )

  const ipLeads = useMemo(
    () => state.leads.filter((l) => l.personaId === state.currentIpId),
    [state.leads, state.currentIpId],
  )

  const top3Contents = useMemo(() => {
    return [...ipContents]
      .filter((c) => c.status === "published" && c.metrics?.inquiries)
      .sort((a, b) => (b.metrics?.inquiries || 0) - (a.metrics?.inquiries || 0))
      .slice(0, 3)
  }, [ipContents])

  useEffect(() => {
    if (!isLoading && state.orgs.length === 0) {
      router.push("/onboarding")
    }
  }, [isLoading, state.orgs.length, router])

  // ========== 普通计算 ==========
  const validLeads = ipLeads.filter((l) => l.status !== "lost").length
  const appointments = ipLeads.filter((l) => l.status === "appointment" || l.status === "won").length
  const deals = ipLeads.filter((l) => l.status === "won").length
  const publishedCount = ipContents.filter((c) => c.status === "published").length

  const qaFixContents = ipContents.filter((c) => c.status === "qa_fix")
  const approvedContents = ipContents.filter((c) => c.status === "approved")
  const needMetricsContents = ipContents.filter(
    (c) => c.status === "published" && (!c.metrics?.inquiries || c.metrics.inquiries === 0),
  )

  const hasTodos = qaFixContents.length > 0 || approvedContents.length > 0 || needMetricsContents.length > 0

  const kpiCards = [
    { 
      label: "有效线索", 
      value: validLeads, 
      icon: Target, 
      gradient: "from-blue-500 to-cyan-500",
      bgGlow: "bg-blue-500/10"
    },
    { 
      label: "预约数", 
      value: appointments, 
      icon: Calendar, 
      gradient: "from-violet-500 to-purple-500",
      bgGlow: "bg-violet-500/10"
    },
    { 
      label: "成交数", 
      value: deals, 
      icon: HandCoins, 
      gradient: "from-emerald-500 to-green-500",
      bgGlow: "bg-emerald-500/10"
    },
    { 
      label: "已发布内容", 
      value: publishedCount, 
      icon: FileText, 
      gradient: "from-amber-500 to-orange-500",
      bgGlow: "bg-amber-500/10"
    },
  ]

  // ========== 条件返回（所有 hooks 已在上面调用完毕）==========
  if (isLoading || state.orgs.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">加载中...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!state.currentIpId) {
    return (
      <DashboardLayout>
        <PageHeader title="Dashboard" breadcrumbs={[{ label: "Dashboard" }]} />
        <Card className="border-dashed border-border/30">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">请先在顶部选择一个IP</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  // ========== 主要渲染 ==========
  return (
    <DashboardLayout>
      <PageHeader title="Dashboard" breadcrumbs={[{ label: "Dashboard" }]} />

      <div className="mb-6">
        <p className="text-muted-foreground">
          当前IP: <span className="font-medium text-foreground">{currentPersona?.name}</span>
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpiCards.map((stat, index) => (
          <Card 
            key={stat.label} 
            className="relative overflow-hidden"
          >
            {/* Background glow */}
            <div className={`absolute inset-0 ${stat.bgGlow} opacity-50`} />
            <CardHeader className="relative flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient}`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-gradient">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* This Week Todos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500">
                <AlertCircle className="h-4 w-4 text-white" />
              </div>
              本周待办
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!hasTodos ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="h-6 w-6 text-emerald-500" />
                </div>
                <p className="text-muted-foreground">暂无待办事项</p>
                <p className="text-sm text-muted-foreground/60">太棒了！保持这个节奏</p>
              </div>
            ) : (
              <div className="space-y-3">
                {qaFixContents.length > 0 && (
                  <div className="flex items-center justify-between p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                    <div>
                      <p className="font-medium text-rose-400">待QA修复</p>
                      <p className="text-sm text-rose-400/70">{qaFixContents.length} 条内容需要修复</p>
                    </div>
                    <Link href="/contents">
                      <Button variant="ghost" size="sm" className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/20">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                )}
                {approvedContents.length > 0 && (
                  <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <div>
                      <p className="font-medium text-emerald-400">待发布</p>
                      <p className="text-sm text-emerald-400/70">{approvedContents.length} 条内容已通过审核</p>
                    </div>
                    <Link href="/contents">
                      <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                )}
                {needMetricsContents.length > 0 && (
                  <div className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <div>
                      <p className="font-medium text-amber-400">待回填数据</p>
                      <p className="text-sm text-amber-400/70">{needMetricsContents.length} 条内容需要补充咨询数</p>
                    </div>
                    <Link href="/contents">
                      <Button variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/20">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top 3 Contents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              Top3 最佳内容
            </CardTitle>
            <CardDescription>按咨询数排序</CardDescription>
          </CardHeader>
          <CardContent>
            {top3Contents.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">暂无已发布内容数据</p>
                <p className="text-sm text-muted-foreground/60">发布内容后这里会显示排行</p>
              </div>
            ) : (
              <div className="space-y-3">
                {top3Contents.map((content, idx) => (
                  <Link key={content.id} href={`/contents/${content.id}`}>
                    <div className="flex items-center gap-3 p-4 border border-border/50 rounded-xl hover:bg-secondary/50 hover:border-primary/30 transition-all cursor-pointer group">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        idx === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' :
                        idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800' :
                        'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate group-hover:text-primary transition-colors">{content.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Badge variant="outline" className="text-xs border-border/50">
                            {platformNames[content.platform]}
                          </Badge>
                          <span className="text-primary font-medium">{content.metrics?.inquiries || 0} 咨询</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            快捷操作
          </CardTitle>
          <CardDescription>快速开始常用操作</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            onClick={() => router.push("/references/new")}
            className="border-border/50 hover:border-primary/50 hover:bg-primary/5"
          >
            <BookOpen className="h-4 w-4 mr-2 text-chart-2" />
            收录参考
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push("/weekly-wizard")}
            className="border-border/50 hover:border-primary/50 hover:bg-primary/5"
          >
            <Sparkles className="h-4 w-4 mr-2 text-chart-1" />
            生成本周选题
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setAddInboxOpen(true)}
            className="border-border/50 hover:border-primary/50 hover:bg-primary/5"
          >
            <Mic className="h-4 w-4 mr-2 text-chart-3" />
            开始录音
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setAddLeadOpen(true)}
            className="border-border/50 hover:border-primary/50 hover:bg-primary/5"
          >
            <UserPlus className="h-4 w-4 mr-2 text-chart-4" />
            创建线索
          </Button>
        </CardContent>
      </Card>

      {/* Empty State for new IPs */}
      {ipContents.length === 0 && (
        <div className="mt-8">
          <EmptyStateCard
            icon={FileText}
            title="开始您的内容创作"
            description="收录参考内容，生成本周选题计划"
            actionLabel="生成本周选题"
            onAction={() => router.push("/weekly-wizard")}
          />
        </div>
      )}

      {/* Dialogs */}
      <AddInboxDialog open={addInboxOpen} onOpenChange={setAddInboxOpen} />
      <AddLeadDrawer open={addLeadOpen} onOpenChange={setAddLeadOpen} />
    </DashboardLayout>
  )
}
