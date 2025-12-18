"use client"

import { useState, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAppStore } from "@/lib/app-context"
import { EmptyStateCard } from "@/components/empty-state-card"
import { AddContentDrawer } from "@/components/add-content-dialog"
import { PublishInfoDialog } from "@/components/publish-info-dialog"
import { Plus, FileText, Sparkles, Search, Copy, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  platformNames,
  contentStatusNames,
  contentStatusColors,
  formatDate,
  formatNames,
  copyToClipboard,
} from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function ContentsPage() {
  const { state, dispatch } = useAppStore()
  const { toast } = useToast()
  const router = useRouter()
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null)
  const [publishDate, setPublishDate] = useState("")
  const [publishUrl, setPublishUrl] = useState("")
  const [loading, setLoading] = useState(false)

  // Filters
  const [search, setSearch] = useState("")
  const [platformFilter, setPlatformFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [formatFilter, setFormatFilter] = useState<string>("all")

  const contents = useMemo(() => {
    return state.contents
      .filter((c) => c.personaId === state.currentIpId)
      .filter((c) => {
        if (
          search &&
          !c.title?.toLowerCase().includes(search.toLowerCase()) &&
          !c.id.toLowerCase().includes(search.toLowerCase())
        )
          return false
        if (platformFilter !== "all" && c.platform !== platformFilter) return false
        if (statusFilter !== "all" && c.status !== statusFilter) return false
        if (formatFilter !== "all" && c.format !== formatFilter) return false
        return true
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [state.contents, state.currentIpId, search, platformFilter, statusFilter, formatFilter])

  const handleCopyPublishPack = async (contentId: string) => {
    const content = state.contents.find((c) => c.id === contentId)
    if (!content?.publishPack) {
      toast({ title: "错误", description: "该内容暂无发布包", variant: "destructive" })
      return
    }
    const packText = `【标题】${content.publishPack.titleCandidates[0]}\n\n【文案】${content.publishPack.caption}\n\n【标签】${content.publishPack.hashtags.join(" ")}`
    await copyToClipboard(packText)
    toast({ title: "复制成功", description: "发布包已复制到剪贴板" })
  }

  const handleMarkPublished = (contentId: string) => {
    setSelectedContentId(contentId)
    setPublishDialogOpen(true)
  }

  const confirmPublish = (date: string, url?: string) => {
    if (!selectedContentId) return
    const content = state.contents.find((c) => c.id === selectedContentId)
    if (!content) return

    dispatch({
      type: "UPDATE_CONTENT",
      payload: {
        ...content,
        status: "published",
        publishedAt: date,
        publishUrl: url,
        updatedAt: new Date().toISOString(),
      },
    })
    toast({ title: "已标记发布", description: "内容状态已更新为已发布" })
    setPublishDialogOpen(false)
    setSelectedContentId(null)
    setPublishDate("")
    setPublishUrl("")
  }

  if (!state.currentIpId) {
    return (
      <DashboardLayout>
        <PageHeader title="内容工单" breadcrumbs={[{ label: "内容工单" }]} />
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">请先在顶部选择一个IP</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="内容工单"
        breadcrumbs={[{ label: "内容工单" }]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/weekly-wizard")}>
              <Sparkles className="h-4 w-4 mr-2" />
              生成本周选题
            </Button>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              新建内容
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索标题或ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="平台" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部平台</SelectItem>
            <SelectItem value="douyin">抖音</SelectItem>
            <SelectItem value="xiaohongshu">小红书</SelectItem>
            <SelectItem value="wechat">公众号</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="idea">创意</SelectItem>
            <SelectItem value="draft">草稿</SelectItem>
            <SelectItem value="qa_fix">待修复</SelectItem>
            <SelectItem value="approved">已通过</SelectItem>
            <SelectItem value="published">已发布</SelectItem>
          </SelectContent>
        </Select>
        <Select value={formatFilter} onValueChange={setFormatFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="形态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部形态</SelectItem>
            <SelectItem value="talking-head">口播</SelectItem>
            <SelectItem value="listicle">清单</SelectItem>
            <SelectItem value="tutorial">教程</SelectItem>
            <SelectItem value="story">故事</SelectItem>
            <SelectItem value="vlog">Vlog</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {contents.length === 0 ? (
        <EmptyStateCard
          icon={FileText}
          title="暂无内容"
          description="生成本周选题计划或手动创建内容"
          actionLabel="生成本周选题"
          onAction={() => router.push("/weekly-wizard")}
        />
      ) : (
        <div className="space-y-3">
          {contents.map((content) => (
            <Card key={content.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <Link href={`/contents/${content.id}`} className="flex-1 min-w-0">
                    <CardTitle className="text-base hover:text-primary cursor-pointer">
                      {content.title || "无标题"}
                    </CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-2 mt-1">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{content.id}</code>
                      <Badge variant="outline">{platformNames[content.platform]}</Badge>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${contentStatusColors[content.status]}`}
                      >
                        {contentStatusNames[content.status]}
                      </span>
                      {content.format && (
                        <Badge variant="secondary" className="text-xs">
                          {formatNames[content.format] || content.format}
                        </Badge>
                      )}
                      {content.topicCluster && (
                        <Badge variant="secondary" className="text-xs">
                          {content.topicCluster}
                        </Badge>
                      )}
                    </CardDescription>
                  </Link>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {content.publishPack && (
                      <Button variant="ghost" size="sm" onClick={() => handleCopyPublishPack(content.id)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                    {content.status === "approved" && (
                      <Button variant="outline" size="sm" onClick={() => handleMarkPublished(content.id)}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        标记已发布
                      </Button>
                    )}
                    <span className="text-xs text-muted-foreground">{formatDate(content.updatedAt)}</span>
                  </div>
                </div>
              </CardHeader>
              {content.metrics && (
                <CardContent className="pt-0">
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>
                      <span className="font-medium text-foreground">
                        {content.metrics.views?.toLocaleString() || 0}
                      </span>{" "}
                      播放
                    </span>
                    <span>
                      <span className="font-medium text-foreground">
                        {content.metrics.likes?.toLocaleString() || 0}
                      </span>{" "}
                      点赞
                    </span>
                    <span>
                      <span className="font-medium text-foreground">{content.metrics.inquiries || 0}</span> 咨询
                    </span>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <AddContentDrawer open={addDialogOpen} onOpenChange={setAddDialogOpen} />

      {/* Publish Info Dialog */}
      <PublishInfoDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        defaultDate={publishDate}
        defaultUrl={publishUrl}
        onConfirm={confirmPublish}
      />
    </DashboardLayout>
  )
}
