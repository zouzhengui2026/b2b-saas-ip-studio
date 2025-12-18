"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAppStore } from "@/lib/app-context"
import { EmptyStateCard } from "@/components/empty-state-card"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Plus, BookOpen, ExternalLink, Search, Copy, Lightbulb, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatDate, platformNames, copyToClipboard } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export default function ReferencesPage() {
  const { state, dispatch } = useAppStore()
  const { toast } = useToast()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedRefId, setSelectedRefId] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState("")
  const [platformFilter, setPlatformFilter] = useState<string>("all")

  const references = useMemo(() => {
    return state.references
      .filter((r) => r.personaId === state.currentIpId)
      .filter((r) => {
        if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false
        if (platformFilter !== "all" && r.platform !== platformFilter) return false
        return true
      })
      .sort((a, b) => new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime())
  }, [state.references, state.currentIpId, search, platformFilter])

  const handleCopyStructure = async (refId: string) => {
    const ref = state.references.find((r) => r.id === refId)
    if (!ref?.extracted) {
      toast({ title: "无内容", description: "该参考暂无结构模板", variant: "destructive" })
      return
    }
    const text = `【Hook】${ref.extracted.hook || ""}\n【结构】${ref.extracted.structure || ""}\n【CTA】${ref.extracted.cta || ""}`
    await copyToClipboard(text)
    toast({ title: "已复制", description: "结构模板已复制" })
  }

  const handleAddToInspiration = (refId: string) => {
    const ref = state.references.find((r) => r.id === refId)
    if (!ref) return
    dispatch({
      type: "UPDATE_REFERENCE",
      payload: { ...ref, isInspiration: true },
    })
    // 存储可读文本：标题 + hook
    const seed = `${ref.title}｜${ref.extracted?.hook ?? ""}`.trim()
    dispatch({ type: "ADD_DRAFT_SOURCE", payload: seed })
    toast({ title: "已添加", description: "已加入本周选题灵感" })
  }

  const handleDelete = () => {
    if (!selectedRefId) return
    dispatch({ type: "DELETE_REFERENCE", payload: selectedRefId })
    toast({ title: "已删除" })
    setDeleteDialogOpen(false)
    setSelectedRefId(null)
  }

  if (!state.currentIpId) {
    return (
      <DashboardLayout>
        <PageHeader title="参考库" breadcrumbs={[{ label: "参考库" }]} />
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
        title="参考库"
        breadcrumbs={[{ label: "参考库" }]}
        actions={
          <Link href="/references/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              收录参考
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索标题..."
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
            <SelectItem value="weibo">微博</SelectItem>
            <SelectItem value="bilibili">B站</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {references.length === 0 ? (
        <EmptyStateCard
          icon={BookOpen}
          title="暂无参考"
          description="收录优质内容作为创作参考"
          actionLabel="收录参考"
          onAction={() => {
            window.location.href = "/references/new"
          }}
        />
      ) : (
        <div className="space-y-4">
          {references.map((ref) => (
            <Card key={ref.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <Link href={`/references/${ref.id}`}>
                      <CardTitle className="text-base flex items-center gap-2 hover:text-primary cursor-pointer">
                        {ref.title}
                        {ref.isInspiration && (
                          <Badge variant="secondary" className="text-xs">
                            <Lightbulb className="h-3 w-3 mr-1" />
                            灵感
                          </Badge>
                        )}
                      </CardTitle>
                    </Link>
                    <CardDescription className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant="outline">{ref.type}</Badge>
                      {ref.platform && <Badge variant="outline">{platformNames[ref.platform]}</Badge>}
                      <span>来源: {ref.source}</span>
                      <span>收录于 {formatDate(ref.collectedAt)}</span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    {ref.url && (
                      <a href={ref.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleCopyStructure(ref.id)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedRefId(ref.id)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {ref.summary && <p className="text-sm text-muted-foreground">{ref.summary}</p>}
                {ref.extracted && (
                  <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                    {ref.extracted.hook && (
                      <p>
                        <span className="font-medium">Hook:</span> {ref.extracted.hook}
                      </p>
                    )}
                    {ref.extracted.structure && (
                      <p>
                        <span className="font-medium">结构:</span> {ref.extracted.structure}
                      </p>
                    )}
                    {ref.extracted.highlights && (
                      <p>
                        <span className="font-medium">亮点:</span> {ref.extracted.highlights.join(", ")}
                      </p>
                    )}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {ref.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                {!ref.isInspiration && (
                  <Button variant="outline" size="sm" onClick={() => handleAddToInspiration(ref.id)}>
                    <Lightbulb className="h-4 w-4 mr-1" />
                    加入选题灵感
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="删除参考"
        description="确定要删除这条参考吗？此操作不可撤销。"
        confirmLabel="删除"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </DashboardLayout>
  )
}
