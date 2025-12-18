"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppStore } from "@/lib/app-context"
import { EmptyStateCard } from "@/components/empty-state-card"
import { AddInboxDialog } from "@/components/add-inbox-dialog"
import { Mic, Clock, FileText, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function InboxPage() {
  const { state, dispatch } = useAppStore()
  const { toast } = useToast()
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  const inboxItems = useMemo(
    () =>
      state.inboxItems
        .filter((i) => i.personaId === state.currentIpId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [state.inboxItems, state.currentIpId],
  )

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "--"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleMarkProcessed = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const item = state.inboxItems.find((i) => i.id === id)
    if (!item) return
    dispatch({
      type: "UPDATE_INBOX",
      payload: { ...item, status: "processed" },
    })
    toast({ title: "已标记为已处理" })
  }

  if (!state.currentIpId) {
    return (
      <DashboardLayout>
        <PageHeader title="语音Inbox" breadcrumbs={[{ label: "语音Inbox" }]} />
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
        title="语音Inbox"
        breadcrumbs={[{ label: "语音Inbox" }]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setAddDialogOpen(true)}>
              <Mic className="h-4 w-4 mr-2" />
              开始录音
            </Button>
            <Button onClick={() => setAddDialogOpen(true)}>
              <FileText className="h-4 w-4 mr-2" />
              文本记录
            </Button>
          </div>
        }
      />

      {inboxItems.length === 0 ? (
        <EmptyStateCard
          icon={Mic}
          title="暂无录音"
          description="录制您的灵感和想法，AI将自动提取选题"
          actionLabel="开始录音"
          onAction={() => setAddDialogOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {inboxItems.map((item) => (
            <Link key={item.id} href={`/inbox/${item.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {item.type === "voice" ? <Mic className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                        {item.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge variant={item.status === "pending" ? "secondary" : "outline"}>
                          {item.status === "pending" ? "待处理" : item.status === "processed" ? "已处理" : "已归档"}
                        </Badge>
                        {item.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(item.duration)}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.status === "pending" && (
                        <Button variant="outline" size="sm" onClick={(e) => handleMarkProcessed(item.id, e)}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          标记已处理
                        </Button>
                      )}
                      <span className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                </CardHeader>
                {item.memoSummary && (
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">{item.memoSummary}</p>
                    {item.extractedAssets?.topicSeeds && item.extractedAssets.topicSeeds.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.extractedAssets.topicSeeds.slice(0, 3).map((seed, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {seed}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}

      <AddInboxDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </DashboardLayout>
  )
}
