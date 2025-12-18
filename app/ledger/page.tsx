"use client"

import { useState, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useAppStore } from "@/lib/app-context"
import { EmptyStateCard } from "@/components/empty-state-card"
import { platformNames, contentStatusNames, contentStatusColors, formatDate, sleep } from "@/lib/utils"
import { BookOpen, Sparkles, Loader2, TrendingUp, ArrowUpDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type SortField = "inquiries" | "appointments" | "deals" | "publishedAt"
type TimeRange = "7d" | "30d" | "all"

export default function LedgerPage() {
  const { state } = useAppStore()
  const { toast } = useToast()

  const [sortBy, setSortBy] = useState<SortField>("inquiries")
  const [sortAsc, setSortAsc] = useState(false)
  const [platformFilter, setPlatformFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [timeRange, setTimeRange] = useState<TimeRange>("all")
  const [insightLoading, setInsightLoading] = useState(false)
  const [insights, setInsights] = useState<string[] | null>(null)

  const filteredContents = useMemo(() => {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    return state.contents
      .filter((c) => c.personaId === state.currentIpId)
      .filter((c) => platformFilter === "all" || c.platform === platformFilter)
      .filter((c) => statusFilter === "all" || c.status === statusFilter)
      .filter((c) => {
        if (timeRange === "all") return true
        if (!c.publishedAt) return false
        const pubDate = new Date(c.publishedAt)
        if (timeRange === "7d") return pubDate >= sevenDaysAgo
        if (timeRange === "30d") return pubDate >= thirtyDaysAgo
        return true
      })
      .sort((a, b) => {
        let aVal: number | string = 0
        let bVal: number | string = 0

        if (sortBy === "publishedAt") {
          aVal = a.publishedAt || ""
          bVal = b.publishedAt || ""
          return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
        } else {
          aVal = a.metrics?.[sortBy] || 0
          bVal = b.metrics?.[sortBy] || 0
          return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
        }
      })
  }, [state.contents, state.currentIpId, platformFilter, statusFilter, timeRange, sortBy, sortAsc])

  const contentWithMetrics = useMemo(
    () => filteredContents.filter((c) => c.metrics?.inquiries && c.metrics.inquiries > 0),
    [filteredContents],
  )

  const handleGenerateInsights = async () => {
    try {
      // 重新计算以确保使用最新数据
      const currentContentWithMetrics = filteredContents.filter(
        (c) => c.metrics?.inquiries && c.metrics.inquiries > 0,
      )

      if (currentContentWithMetrics.length < 3) {
        toast({
          title: "数据不足，无法生成洞察",
          description: `当前只有 ${currentContentWithMetrics.length} 条内容有咨询数据。生成洞察需要至少3条有咨询数据的内容，请先回填更多内容的咨询数据后再试。`,
          variant: "destructive",
        })
        return
      }

      setInsightLoading(true)
      toast({ title: "生成中", description: "正在分析内容数据..." })
      
      await sleep(1200)

      // Mock insights based on top content
      const topContent = currentContentWithMetrics.slice(0, 3)
      
      if (!topContent || topContent.length === 0) {
        toast({ title: "错误", description: "无法生成洞察，请检查数据", variant: "destructive" })
        setInsightLoading(false)
        return
      }

      const topClusters = [...new Set(topContent.map((c) => c.topicCluster).filter(Boolean))]
      const platform = topContent[0]?.platform || "douyin"
      const platformName = platformNames[platform] || "抖音"

      setInsights([
        `Top主题簇：「${topClusters[0] || "产品评测"}」类内容平均咨询数最高，建议继续加码`,
        `Top Hook模式：数字开头的标题转化率高出35%，建议下周采用更多数字化标题`,
        `平台表现：${platformName}平台ROI最高，可适当倾斜资源`,
      ])

      toast({ title: "洞察生成完成", description: "基于你的内容数据生成了3条建议" })
    } catch (error) {
      console.error("生成洞察时出错:", error)
      toast({
        title: "生成失败",
        description: "生成洞察时出现错误，请稍后重试",
        variant: "destructive",
      })
    } finally {
      setInsightLoading(false)
    }
  }

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortBy(field)
      setSortAsc(false)
    }
  }

  if (!state.currentIpId) {
    return (
      <DashboardLayout>
        <PageHeader title="资产账本" breadcrumbs={[{ label: "资产账本" }]} />
        <EmptyStateCard icon={BookOpen} title="请先选择IP" description="请在顶部导航栏选择一个IP来查看资产账本" />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="资产账本"
        breadcrumbs={[{ label: "资产账本" }]}
        actions={
          <Button onClick={handleGenerateInsights} disabled={insightLoading}>
            {insightLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            生成洞察
          </Button>
        }
      />

      {/* Insights */}
      {insights && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              AI洞察
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {insights.map((insight, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-primary font-medium">{i + 1}.</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">平台</label>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="douyin">抖音</SelectItem>
                  <SelectItem value="xiaohongshu">小红书</SelectItem>
                  <SelectItem value="wechat">视频号</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">状态</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="published">已发布</SelectItem>
                  <SelectItem value="approved">已通过</SelectItem>
                  <SelectItem value="draft">草稿</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">时间范围</label>
              <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">最近7天</SelectItem>
                  <SelectItem value="30d">最近30天</SelectItem>
                  <SelectItem value="all">全部</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">内容列表</CardTitle>
          <CardDescription>共 {filteredContents.length} 条内容</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredContents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>内容ID</TableHead>
                  <TableHead>平台</TableHead>
                  <TableHead>主题簇</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="cursor-pointer hover:bg-accent" onClick={() => toggleSort("inquiries")}>
                    <div className="flex items-center gap-1">
                      咨询数
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-accent" onClick={() => toggleSort("appointments")}>
                    <div className="flex items-center gap-1">
                      预约数
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-accent" onClick={() => toggleSort("deals")}>
                    <div className="flex items-center gap-1">
                      成交数
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-accent" onClick={() => toggleSort("publishedAt")}>
                    <div className="flex items-center gap-1">
                      发布时间
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContents.map((content) => (
                  <TableRow key={content.id} className="cursor-pointer hover:bg-accent">
                    <TableCell>
                      <Link href={`/contents/${content.id}`} className="text-primary hover:underline">
                        {content.id}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{platformNames[content.platform]}</Badge>
                    </TableCell>
                    <TableCell>{content.topicCluster || "-"}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${contentStatusColors[content.status]}`}
                      >
                        {contentStatusNames[content.status]}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{content.metrics?.inquiries || 0}</TableCell>
                    <TableCell>{content.metrics?.appointments || 0}</TableCell>
                    <TableCell>{content.metrics?.deals || 0}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {content.publishedAt ? formatDate(content.publishedAt) : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyStateCard icon={BookOpen} title="暂无内容" description="当前筛选条件下没有内容" />
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
