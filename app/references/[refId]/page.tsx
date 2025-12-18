"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAppStore } from "@/lib/app-context"
import { formatDate, platformNames } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { Lightbulb, ArrowLeft, ExternalLink } from "lucide-react"

export default function ReferenceDetailPage({ params }: { params: { refId: string } }) {
  const { refId } = params
  const { state } = useAppStore()
  const router = useRouter()

  const ref = state.references.find((r) => r.id === refId)

  if (!ref) {
    return (
      <DashboardLayout>
        <PageHeader
          title="参考详情"
          breadcrumbs={[{ label: "参考库", href: "/references" }, { label: "未找到" }]}
          actions={
            <Button variant="outline" onClick={() => router.push("/references")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回列表
            </Button>
          }
        />
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">未找到该参考内容</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="参考详情"
        breadcrumbs={[{ label: "参考库", href: "/references" }, { label: ref.title }]}
        actions={
          <Button variant="outline" onClick={() => router.push("/references")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回列表
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {ref.title}
              {ref.isInspiration && (
                <Badge variant="secondary" className="text-xs">
                  <Lightbulb className="h-3 w-3 mr-1" />
                  灵感
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="outline">{ref.type}</Badge>
              {ref.platform && <Badge variant="outline">{platformNames[ref.platform]}</Badge>}
              <span>来源: {ref.source}</span>
              <span>收录于 {formatDate(ref.collectedAt)}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {ref.url && (
              <div>
                <span className="text-sm text-muted-foreground mr-2">原始链接:</span>
                <a href={ref.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">
                  <span className="text-sm text-primary break-all">{ref.url}</span>
                  <ExternalLink className="h-3 w-3 text-primary" />
                </a>
              </div>
            )}

            {ref.snapshotUrl && (
              <div>
                <span className="text-sm text-muted-foreground mr-2">截图链接:</span>
                <a
                  href={ref.snapshotUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1"
                >
                  <span className="text-sm text-primary break-all">{ref.snapshotUrl}</span>
                  <ExternalLink className="h-3 w-3 text-primary" />
                </a>
              </div>
            )}

            {ref.content && (
              <div className="space-y-1">
                <p className="text-sm font-medium">内容摘要</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ref.content}</p>
              </div>
            )}

            {ref.tags.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium">标签</p>
                <div className="flex flex-wrap gap-2">
                  {ref.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">拆解结果</CardTitle>
            <CardDescription>用于后续选题与内容工单的结构化信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {ref.extracted ? (
              <>
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
                {ref.extracted.cta && (
                  <p>
                    <span className="font-medium">CTA:</span> {ref.extracted.cta}
                  </p>
                )}
                {ref.extracted.highlights && ref.extracted.highlights.length > 0 && (
                  <p>
                    <span className="font-medium">亮点:</span> {ref.extracted.highlights.join(", ")}
                  </p>
                )}
                {ref.extracted.risks && ref.extracted.risks.length > 0 && (
                  <p>
                    <span className="font-medium">风险:</span> {ref.extracted.risks.join(", ")}
                  </p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">当前参考尚未生成拆解，可在新建时使用「生成拆解」功能。</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}


