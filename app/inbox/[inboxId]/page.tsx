"use client"

import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppStore } from "@/lib/app-context"
import { Badge } from "@/components/ui/badge"
import { EmptyStateCard } from "@/components/empty-state-card"
import { ArrowLeft, Mic, FileText, Lightbulb, Award, AlertTriangle, TrendingUp, Plus, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { formatDateTime } from "@/lib/utils"

export default function InboxDetailPage() {
  const { inboxId } = useParams<{ inboxId: string }>()
  const { state, dispatch } = useAppStore()
  const { toast } = useToast()
  const router = useRouter()

  const item = state.inboxItems.find((i) => i.id === inboxId)

  if (!item) {
    return (
      <DashboardLayout>
        <EmptyStateCard
          icon={Mic}
          title="录音不存在"
          description="找不到该语音记录"
          actionLabel="返回Inbox列表"
          onAction={() => router.push("/inbox")}
        />
      </DashboardLayout>
    )
  }

  const handleAddToWeekly = (seed: string) => {
    // 直接存储可读文本，不加inboxId前缀
    dispatch({ type: "ADD_DRAFT_SOURCE", payload: seed })
    toast({ title: "已添加", description: "已加入本周选题灵感池" })
  }

  const handleMarkProcessed = () => {
    dispatch({
      type: "UPDATE_INBOX",
      payload: { ...item, status: "processed" },
    })
    toast({ title: "已标记", description: "录音已标记为已处理" })
  }

  const handleGoToEvidence = () => {
    if (!state.currentIpId) {
      toast({ title: "提示", description: "请先选择一个IP", variant: "destructive" })
      return
    }
    router.push(`/personas/${state.currentIpId}`)
  }

  const handleEpochProposal = () => {
    if (!state.currentIpId) {
      toast({ title: "提示", description: "请先选择一个IP", variant: "destructive" })
      return
    }
    router.push(`/personas/${state.currentIpId}`)
  }

  return (
    <DashboardLayout>
      <PageHeader
        title={item.title}
        breadcrumbs={[{ label: "语音Inbox", href: "/inbox" }, { label: item.title }]}
        actions={
          <div className="flex gap-2">
            <Link href="/inbox">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回列表
              </Button>
            </Link>
            {item.status === "pending" && (
              <Button onClick={handleMarkProcessed}>
                <CheckCircle className="h-4 w-4 mr-2" />
                标记已处理
              </Button>
            )}
          </div>
        }
      />

      {/* Info Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-muted rounded-lg">
        <Badge variant={item.type === "voice" ? "default" : "secondary"}>
          {item.type === "voice" ? "语音" : "文本"}
        </Badge>
        <Badge
          variant={item.status === "pending" ? "destructive" : item.status === "processed" ? "default" : "outline"}
        >
          {item.status === "pending" ? "待处理" : item.status === "processed" ? "已处理" : "已归档"}
        </Badge>
        {item.duration && (
          <span className="text-sm text-muted-foreground">
            {Math.floor(item.duration / 60)}分{item.duration % 60}秒
          </span>
        )}
        <span className="text-sm text-muted-foreground">创建于 {formatDateTime(item.createdAt)}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {item.type === "voice" ? <Mic className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                {item.type === "voice" ? "录音详情" : "文本笔记"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {item.transcript ? (
                <div>
                  <h4 className="font-medium mb-2">转录/内容</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-4 rounded-lg">
                    {item.transcript}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">暂无转录文本</p>
              )}
              {item.memoSummary && (
                <div>
                  <h4 className="font-medium mb-2">摘要</h4>
                  <p className="text-sm text-muted-foreground">{item.memoSummary}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Extracted Assets */}
        <div className="space-y-6">
          {item.extractedAssets?.topicSeeds && item.extractedAssets.topicSeeds.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  选题种子
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {item.extractedAssets.topicSeeds.map((seed, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <span className="text-sm">{seed}</span>
                    <Button variant="ghost" size="sm" onClick={() => handleAddToWeekly(seed)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {item.extractedAssets?.evidenceClues && item.extractedAssets.evidenceClues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  证据线索
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {item.extractedAssets.evidenceClues.map((clue, idx) => (
                  <p key={idx} className="text-sm p-2 bg-muted rounded">
                    {clue}
                  </p>
                ))}
                <Button variant="outline" size="sm" className="w-full bg-transparent" onClick={handleGoToEvidence}>
                  去证据库添加
                </Button>
              </CardContent>
            </Card>
          )}

          {item.extractedAssets?.objections && item.extractedAssets.objections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  异议/风险
                </CardTitle>
              </CardHeader>
              <CardContent>
                {item.extractedAssets.objections.map((obj, idx) => (
                  <p key={idx} className="text-sm p-2 bg-muted rounded">
                    {obj}
                  </p>
                ))}
              </CardContent>
            </Card>
          )}

          {item.extractedAssets?.strategySignals && item.extractedAssets.strategySignals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  策略信号
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {item.extractedAssets.strategySignals.map((signal, idx) => (
                  <p key={idx} className="text-sm p-2 bg-muted rounded">
                    {signal}
                  </p>
                ))}
                <Button variant="outline" size="sm" className="w-full bg-transparent" onClick={handleEpochProposal}>
                  发起阶段变更提案
                </Button>
              </CardContent>
            </Card>
          )}

          {!item.extractedAssets?.topicSeeds?.length &&
            !item.extractedAssets?.evidenceClues?.length &&
            !item.extractedAssets?.objections?.length &&
            !item.extractedAssets?.strategySignals?.length && (
              <Card className="border-dashed">
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">暂无提取资产</p>
                </CardContent>
              </Card>
            )}
        </div>
      </div>
    </DashboardLayout>
  )
}
