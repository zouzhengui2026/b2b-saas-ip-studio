"use client"

import { useState, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppStore } from "@/lib/app-context"
import { EmptyStateCard } from "@/components/empty-state-card"
import { AddReferenceDialog } from "@/components/add-reference-dialog"
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
  const { state, currentPersona } = useAppStore()
  const router = useRouter()
  const [addRefOpen, setAddRefOpen] = useState(false)
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

  // KPI calculations
  const validLeads = ipLeads.filter((l) => l.status !== "lost").length
  const appointments = ipLeads.filter((l) => l.status === "appointment" || l.status === "won").length
  const deals = ipLeads.filter((l) => l.status === "won").length
  const publishedCount = ipContents.filter((c) => c.status === "published").length

  // Todos
  const qaFixContents = ipContents.filter((c) => c.status === "qa_fix")
  const approvedContents = ipContents.filter((c) => c.status === "approved")
  const needMetricsContents = ipContents.filter(
    (c) => c.status === "published" && (!c.metrics?.inquiries || c.metrics.inquiries === 0),
  )

  // Top 3 contents by inquiries
  const top3Contents = useMemo(() => {
    return [...ipContents]
      .filter((c) => c.status === "published" && c.metrics?.inquiries)
      .sort((a, b) => (b.metrics?.inquiries || 0) - (a.metrics?.inquiries || 0))
      .slice(0, 3)
  }, [ipContents])

  const kpiCards = [
    { label: "有效线索", value: validLeads, icon: Target, color: "text-blue-500" },
    { label: "预约数", value: appointments, icon: Calendar, color: "text-purple-500" },
    { label: "成交数", value: deals, icon: HandCoins, color: "text-green-500" },
    { label: "已发布内容", value: publishedCount, icon: FileText, color: "text-orange-500" },
  ]

  if (!state.currentIpId) {
    return (
      <DashboardLayout>
        <PageHeader title="Dashboard" breadcrumbs={[{ label: "Dashboard" }]} />
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">请先在顶部选择一个IP</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  const hasTodos = qaFixContents.length > 0 || approvedContents.length > 0 || needMetricsContents.length > 0

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
        {kpiCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* This Week Todos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              本周待办
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!hasTodos ? (
              <p className="text-muted-foreground text-center py-4">暂无待办事项</p>
            ) : (
              <div className="space-y-3">
                {qaFixContents.length > 0 && (
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-red-800">待QA修复</p>
                      <p className="text-sm text-red-600">{qaFixContents.length} 条内容需要修复</p>
                    </div>
                    <Link href="/contents">
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                )}
                {approvedContents.length > 0 && (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium text-green-800">待发布</p>
                      <p className="text-sm text-green-600">{approvedContents.length} 条内容已通过审核</p>
                    </div>
                    <Link href="/contents">
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                )}
                {needMetricsContents.length > 0 && (
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="font-medium text-yellow-800">待回填数据</p>
                      <p className="text-sm text-yellow-600">{needMetricsContents.length} 条内容需要补充咨询数</p>
                    </div>
                    <Link href="/contents">
                      <Button variant="ghost" size="sm">
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
              <TrendingUp className="h-5 w-5" />
              Top3 最佳内容
            </CardTitle>
            <CardDescription>按咨询数排序</CardDescription>
          </CardHeader>
          <CardContent>
            {top3Contents.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">暂无已发布内容数据</p>
            ) : (
              <div className="space-y-3">
                {top3Contents.map((content, idx) => (
                  <Link key={content.id} href={`/contents/${content.id}`}>
                    <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer">
                      <span className="text-lg font-bold text-muted-foreground">#{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{content.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {platformNames[content.platform]}
                          </Badge>
                          <span>{content.metrics?.inquiries || 0} 咨询</span>
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
          <CardTitle>快捷操作</CardTitle>
          <CardDescription>快速开始常用操作</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => setAddRefOpen(true)}>
            <BookOpen className="h-4 w-4 mr-2" />
            收录参考
          </Button>
          <Button variant="outline" onClick={() => router.push("/weekly-wizard")}>
            <Sparkles className="h-4 w-4 mr-2" />
            生成本周选题
          </Button>
          <Button variant="outline" onClick={() => setAddInboxOpen(true)}>
            <Mic className="h-4 w-4 mr-2" />
            开始录音
          </Button>
          <Button variant="outline" onClick={() => setAddLeadOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
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
      <AddReferenceDialog open={addRefOpen} onOpenChange={setAddRefOpen} />
      <AddInboxDialog open={addInboxOpen} onOpenChange={setAddInboxOpen} />
      <AddLeadDrawer open={addLeadOpen} onOpenChange={setAddLeadOpen} />
    </DashboardLayout>
  )
}
