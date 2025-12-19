"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { NoIpSelectedCard } from "@/components/no-ip-selected-card"
import { useAppStore } from "@/lib/app-context"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { getCurrentWeekNumber, sleep, platformNames, mockGenerateContentId } from "@/lib/utils"
import {
  CalendarCheck,
  Loader2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  FileText,
  ArrowRight,
  Import,
} from "lucide-react"
import Link from "next/link"
import type { WeeklyReport, Content } from "@/lib/types"

type TimeRange = "this-week" | "last-week" | "30days"

export default function WeeklyReviewPage() {
  const { state, dispatch, currentPersona } = useAppStore()
  const { toast } = useToast()
  const router = useRouter()

  const [timeRange, setTimeRange] = useState<TimeRange>("this-week")
  const [loading, setLoading] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [currentReport, setCurrentReport] = useState<WeeklyReport | null>(null)

  // Check if IP is selected
  if (!state.currentIpId || !currentPersona) {
    return (
      <DashboardLayout>
        <PageHeader title="周复盘" breadcrumbs={[{ label: "周复盘" }]} />
        <NoIpSelectedCard />
      </DashboardLayout>
    )
  }

  // Get published contents for current IP
  const publishedContents = state.contents
    .filter((c) => c.personaId === state.currentIpId && c.status === "published" && c.metrics)
    .sort((a, b) => (b.metrics?.inquiries || 0) - (a.metrics?.inquiries || 0))

  const top3Contents = publishedContents.slice(0, 3)

  // Calculate funnel metrics
  const totalViews = publishedContents.reduce((sum, c) => sum + (c.metrics?.views || 0), 0)
  const totalInquiries = publishedContents.reduce((sum, c) => sum + (c.metrics?.inquiries || 0), 0)
  const totalAppointments = publishedContents.reduce((sum, c) => sum + (c.metrics?.appointments || 0), 0)
  const totalDeals = publishedContents.reduce((sum, c) => sum + (c.metrics?.deals || 0), 0)

  const handleGenerateReport = async () => {
    setLoading(true)
    toast({ title: "生成中", description: "正在生成周复盘报告..." })
    await sleep(1000)

    const weekNumber = getCurrentWeekNumber()

    // Mock conclusions based on data
    const conclusions: string[] = [
      `本周${platformNames.douyin}表现最佳，占总咨询量的${Math.floor(Math.random() * 30 + 40)}%`,
      `产品评测类内容互动率高于平均水平${Math.floor(Math.random() * 20 + 10)}%`,
      `周末发布的内容平均播放量比工作日高出${Math.floor(Math.random() * 15 + 5)}%`,
    ]

    // Mock funnel issues
    const funnelIssues: string[] = []
    if (totalInquiries > 0 && totalAppointments < totalInquiries * 0.3) {
      funnelIssues.push("咨询到预约转化率偏低，建议优化私信话术")
    }
    if (totalAppointments > 0 && totalDeals < totalAppointments * 0.5) {
      funnelIssues.push("预约到成交转化率需提升，检查服务流程")
    }
    if (funnelIssues.length === 0) {
      funnelIssues.push("漏斗整体健康，继续保持当前策略")
    }

    // Mock suggestions
    const nextWeekSuggestions = {
      boost: ["继续深耕产品评测类内容", "增加用户案例分享", "优化发布时间段"],
      cut: ["减少纯资讯类转载", "暂停低互动话题"],
      addEvidence: ["补充客户成功案例", "收集更多数据支撑"],
    }

    // Generate 12 draft topics
    const topicClusters = currentPersona?.brandBook?.contentPillars || ["产品评测", "行业观察", "选购指南"]
    const formats = ["talking-head", "listicle", "tutorial", "story"]
    const platforms: ("douyin" | "xiaohongshu" | "wechat")[] = [
      "douyin",
      "douyin",
      "douyin",
      "douyin",
      "douyin",
      "douyin",
      "xiaohongshu",
      "xiaohongshu",
      "xiaohongshu",
      "xiaohongshu",
      "wechat",
      "wechat",
    ]

    const draftTopics = platforms.map((platform, i) => ({
      platform,
      title: `${topicClusters[i % topicClusters.length]}：下周选题 #${i + 1}`,
      hook: `这是一个关于${topicClusters[i % topicClusters.length]}的精彩开头...`,
      topicCluster: topicClusters[i % topicClusters.length],
      format: formats[i % formats.length],
    }))

    const report: WeeklyReport = {
      id: `report-${Date.now()}`,
      personaId: state.currentIpId!,
      weekNumber,
      conclusions,
      top3ContentIds: top3Contents.map((c) => c.id),
      funnelIssues,
      nextWeekSuggestions,
      draftTopics,
      generatedAt: new Date().toISOString(),
    }

    dispatch({ type: "ADD_WEEKLY_REPORT", payload: report })
    setCurrentReport(report)
    setLoading(false)
    toast({ title: "生成完成", description: "周复盘报告已生成" })
  }

  const handleImportAsContents = async () => {
    if (!currentReport || currentReport.draftTopics.length === 0) {
      toast({ title: "错误", description: "暂无选题可导入", variant: "destructive" })
      return
    }

    setImportLoading(true)
    toast({ title: "导入中", description: "正在创建内容工单..." })
    await sleep(800)

    const weekNumber = getCurrentWeekNumber()
    const newContents: Content[] = currentReport.draftTopics.map((topic) => ({
      id: mockGenerateContentId(topic.platform),
      personaId: state.currentIpId!,
      platform: topic.platform,
      title: topic.title,
      topicCluster: topic.topicCluster,
      format: topic.format as Content["format"],
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
    setImportLoading(false)
    toast({ title: "导入成功", description: `已创建 ${newContents.length} 条内容工单` })
    router.push("/contents")
  }

  return (
    <DashboardLayout>
      <PageHeader title="周复盘" breadcrumbs={[{ label: "周复盘" }]} />

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>时间范围</Label>
              <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
                <SelectTrigger className="w-[140px] bg-secondary/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-card border-border/50">
                  <SelectItem value="this-week">本周</SelectItem>
                  <SelectItem value="last-week">上周</SelectItem>
                  <SelectItem value="30days">近30天</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-secondary/30 border border-border/30">
              <span className="text-sm text-muted-foreground">当前IP：</span>
              <span className="font-medium text-foreground">{currentPersona.name}</span>
            </div>
            <Button onClick={handleGenerateReport} disabled={loading} className="btn-gradient border-0">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CalendarCheck className="h-4 w-4 mr-2" />}
              生成周复盘报告
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      {currentReport ? (
        <div className="space-y-6">
          {/* Conclusions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-1.5 rounded-lg bg-amber-500/20">
                  <Lightbulb className="h-4 w-4 text-amber-400" />
                </div>
                本周结论
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {currentReport.conclusions.map((conclusion, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary font-medium">{i + 1}.</span>
                    <span>{conclusion}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Top 3 Contents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-1.5 rounded-lg bg-emerald-500/20">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                </div>
                Top 3 内容
              </CardTitle>
              <CardDescription>按咨询数排序</CardDescription>
            </CardHeader>
            <CardContent>
              {top3Contents.length > 0 ? (
                <div className="space-y-3">
                  {top3Contents.map((content, i) => (
                    <Link
                      key={content.id}
                      href={`/contents/${content.id}`}
                      className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-secondary/50 hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                          i === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' :
                          i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800' :
                          'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
                        }`}>
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-medium">{content.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Badge variant="outline" className="text-xs border-border/50">
                              {platformNames[content.platform]}
                            </Badge>
                            <span>{content.metrics?.views?.toLocaleString() || 0} 播放</span>
                            <span className="text-primary font-medium">{content.metrics?.inquiries || 0} 咨询</span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">暂无已发布内容数据</p>
              )}
            </CardContent>
          </Card>

          {/* Funnel Issues */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-1.5 rounded-lg bg-orange-500/20">
                  <AlertTriangle className="h-4 w-4 text-orange-400" />
                </div>
                漏斗问题
              </CardTitle>
              <CardDescription>
                播放 {totalViews.toLocaleString()} → 咨询 {totalInquiries} → 预约 {totalAppointments} → 成交{" "}
                {totalDeals}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {currentReport.funnelIssues.map((issue, i) => (
                  <li key={i} className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-orange-400">•</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Next Week Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">下周建议</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-medium">
                    <TrendingUp className="h-4 w-4" />
                    加强 (Boost)
                  </div>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    {currentReport.nextWeekSuggestions.boost.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 font-medium">
                    <TrendingDown className="h-4 w-4" />
                    削减 (Cut)
                  </div>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    {currentReport.nextWeekSuggestions.cut.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-blue-400 font-medium">
                    <FileText className="h-4 w-4" />
                    补充证据
                  </div>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    {currentReport.nextWeekSuggestions.addEvidence.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Draft Topics */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">下周选题草案</CardTitle>
                <CardDescription>共 {currentReport.draftTopics.length} 条选题</CardDescription>
              </div>
              <Button onClick={handleImportAsContents} disabled={importLoading} className="btn-gradient border-0">
                {importLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Import className="h-4 w-4 mr-2" />
                )}
                一键导入为下周内容工单
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentReport.draftTopics.map((topic, i) => (
                  <div key={i} className="p-4 border border-border/50 rounded-xl space-y-2 hover:border-border transition-colors">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-border/50">{platformNames[topic.platform]}</Badge>
                      <Badge variant="secondary">{topic.topicCluster}</Badge>
                    </div>
                    <p className="font-medium text-sm">{topic.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{topic.hook}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="border-dashed border-border/30">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <CalendarCheck className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">周复盘</h3>
            <p className="text-muted-foreground mb-4">选择时间范围，点击上方按钮生成本周复盘报告</p>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  )
}
