"use client"

import { useState, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAppStore } from "@/lib/app-context"
import { EmptyStateCard } from "@/components/empty-state-card"
import { AddLeadDrawer } from "@/components/add-lead-dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Plus, Target, Search, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { leadStatusNames, leadStatusColors, leadLevelNames, leadLevelColors, formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import type { Lead, LeadStatus } from "@/lib/types"

const statusFlow: LeadStatus[] = ["new", "contacted", "qualified", "appointment", "won", "lost"]

export default function LeadsPage() {
  const { state, dispatch } = useAppStore()
  const { toast } = useToast()
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<LeadStatus | null>(null)

  // Filters
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [levelFilter, setLevelFilter] = useState<string>("all")

  const leads = useMemo(() => {
    return state.leads
      .filter((l) => l.personaId === state.currentIpId)
      .filter((l) => {
        if (search && !l.name.toLowerCase().includes(search.toLowerCase())) return false
        if (statusFilter !== "all" && l.status !== statusFilter) return false
        if (levelFilter !== "all" && l.leadLevel !== levelFilter) return false
        return true
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [state.leads, state.currentIpId, search, statusFilter, levelFilter])

  const handleStatusChange = (lead: Lead, newStatus: LeadStatus) => {
    if (newStatus === "appointment" || newStatus === "won") {
      setSelectedLead(lead)
      setPendingStatus(newStatus)
      setConfirmDialogOpen(true)
    } else {
      updateLeadStatus(lead, newStatus)
    }
  }

  const updateLeadStatus = (lead: Lead, newStatus: LeadStatus, updateContent = false) => {
    dispatch({
      type: "UPDATE_LEAD",
      payload: { ...lead, status: newStatus, updatedAt: new Date().toISOString() },
    })

    // Update content metrics if needed
    if (updateContent && lead.sourceContentId) {
      const content = state.contents.find((c) => c.id === lead.sourceContentId)
      if (content) {
        const metricsUpdate =
          newStatus === "appointment"
            ? { appointments: (content.metrics?.appointments || 0) + 1 }
            : { deals: (content.metrics?.deals || 0) + 1 }
        dispatch({
          type: "UPDATE_CONTENT_METRICS",
          payload: { id: content.id, metrics: metricsUpdate },
        })
        toast({
          title: "已更新",
          description: `已同步更新内容 ${content.id} 的${newStatus === "appointment" ? "预约" : "成交"}数`,
        })
      }
    }

    toast({ title: "状态已更新" })
  }

  const confirmStatusChange = () => {
    if (selectedLead && pendingStatus) {
      updateLeadStatus(selectedLead, pendingStatus, true)
    }
    setConfirmDialogOpen(false)
    setPendingStatus(null)
  }

  const handleUpdateLead = (updates: Partial<Lead>) => {
    if (!selectedLead) return
    dispatch({
      type: "UPDATE_LEAD",
      payload: { ...selectedLead, ...updates, updatedAt: new Date().toISOString() },
    })
    setSelectedLead({ ...selectedLead, ...updates } as Lead)
    toast({ title: "已保存" })
  }

  if (!state.currentIpId) {
    return (
      <DashboardLayout>
        <PageHeader title="线索工单" breadcrumbs={[{ label: "线索工单" }]} />
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
        title="线索工单"
        breadcrumbs={[{ label: "线索工单" }]}
        actions={
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            创建线索
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索线索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            {statusFlow.map((s) => (
              <SelectItem key={s} value={s}>
                {leadStatusNames[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="意向" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部意向</SelectItem>
            <SelectItem value="hot">高意向</SelectItem>
            <SelectItem value="warm">中意向</SelectItem>
            <SelectItem value="cold">低意向</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {leads.length === 0 ? (
        <EmptyStateCard
          icon={Target}
          title="暂无线索"
          description="从内容详情页创建线索，或手动添加"
          actionLabel="创建线索"
          onAction={() => setAddDialogOpen(true)}
        />
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <Card
              key={lead.id}
              className="hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => setSelectedLead(lead)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base">{lead.name}</CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${leadStatusColors[lead.status]}`}>
                        {leadStatusNames[lead.status]}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${leadLevelColors[lead.leadLevel]}`}
                      >
                        {leadLevelNames[lead.leadLevel]}
                      </span>
                      <span>来源: {lead.source}</span>
                      {lead.platform && <span>平台: {lead.platform}</span>}
                    </CardDescription>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(lead.updatedAt)}</span>
                </div>
              </CardHeader>
              {(lead.notes || lead.nextAction) && (
                <CardContent className="pt-0">
                  {lead.nextAction && (
                    <p className="text-sm text-primary flex items-center gap-1">
                      <ArrowRight className="h-3 w-3" />
                      {lead.nextAction}
                    </p>
                  )}
                  {lead.notes && <p className="text-sm text-muted-foreground mt-1">{lead.notes}</p>}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Lead Detail Sheet */}
      <Sheet open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedLead && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedLead.name}</SheetTitle>
                <SheetDescription>
                  创建于 {formatDate(selectedLead.createdAt)}
                  {selectedLead.sourceContentId && ` · 来源内容: ${selectedLead.sourceContentId}`}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* Status Flow */}
                <div className="space-y-2">
                  <Label>状态流转</Label>
                  <div className="flex flex-wrap gap-2">
                    {statusFlow.map((status) => (
                      <Button
                        key={status}
                        variant={selectedLead.status === status ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleStatusChange(selectedLead, status)}
                        disabled={selectedLead.status === status}
                      >
                        {leadStatusNames[status]}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2">
                  <Label>联系方式</Label>
                  <p className="text-sm">{selectedLead.contact || "未填写"}</p>
                </div>

                {/* Need Tag */}
                <div className="space-y-2">
                  <Label htmlFor="needTag">需求标签</Label>
                  <Input
                    id="needTag"
                    value={selectedLead.needTag || ""}
                    onChange={(e) => handleUpdateLead({ needTag: e.target.value })}
                  />
                </div>

                {/* Next Action */}
                <div className="space-y-2">
                  <Label htmlFor="nextAction">下一步动作</Label>
                  <Input
                    id="nextAction"
                    value={selectedLead.nextAction || ""}
                    onChange={(e) => handleUpdateLead({ nextAction: e.target.value })}
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">备注</Label>
                  <Textarea
                    id="notes"
                    value={selectedLead.notes || ""}
                    onChange={(e) => handleUpdateLead({ notes: e.target.value })}
                    rows={3}
                  />
                </div>

                {/* Tags */}
                {selectedLead.tags.length > 0 && (
                  <div className="space-y-2">
                    <Label>标签</Label>
                    <div className="flex flex-wrap gap-1">
                      {selectedLead.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AddLeadDrawer open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title={pendingStatus === "appointment" ? "确认预约" : "确认成交"}
        description={`是否同步更新关联内容的${pendingStatus === "appointment" ? "预约" : "成交"}数？`}
        confirmLabel="确认并更新"
        onConfirm={confirmStatusChange}
      />
    </DashboardLayout>
  )
}
