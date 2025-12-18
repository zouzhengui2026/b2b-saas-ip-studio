"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAppStore } from "@/lib/app-context"
import { EmptyStateCard } from "@/components/empty-state-card"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Plus, AtSign, CheckCircle, Edit, Trash2, Loader2 } from "lucide-react"
import { platformNames, sleep } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import type { Account } from "@/lib/types"

export default function AccountsPage() {
  const { state, dispatch } = useAppStore()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Form state
  const [platform, setPlatform] = useState<Account["platform"]>("douyin")
  const [accountId, setAccountId] = useState("")
  const [accountName, setAccountName] = useState("")
  const [followers, setFollowers] = useState("")

  const accounts = state.accounts.filter((a) => a.personaId === state.currentIpId)

  const resetForm = () => {
    setPlatform("douyin")
    setAccountId("")
    setAccountName("")
    setFollowers("")
    setEditingAccount(null)
  }

  const openEdit = (account: Account) => {
    setEditingAccount(account)
    setPlatform(account.platform)
    setAccountId(account.accountId)
    setAccountName(account.accountName)
    setFollowers(account.followers?.toString() || "")
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!accountId || !accountName) {
      toast({ title: "错误", description: "请填写账号ID和名称", variant: "destructive" })
      return
    }
    if (!state.currentIpId) {
      toast({ title: "错误", description: "请先选择IP", variant: "destructive" })
      return
    }

    setLoading(true)
    await sleep(500)

    if (editingAccount) {
      dispatch({
        type: "UPDATE_ACCOUNT",
        payload: {
          ...editingAccount,
          platform,
          accountId,
          accountName,
          followers: followers ? Number(followers) : undefined,
        },
      })
      toast({ title: "已更新" })
    } else {
      const newAccount: Account = {
        id: `acc-${Date.now()}`,
        personaId: state.currentIpId,
        platform,
        accountId,
        accountName,
        followers: followers ? Number(followers) : undefined,
        isVerified: false,
        status: "active",
        createdAt: new Date().toISOString(),
      }
      dispatch({ type: "ADD_ACCOUNT", payload: newAccount })
      toast({ title: "绑定成功" })
    }

    resetForm()
    setLoading(false)
    setDialogOpen(false)
  }

  const handleDelete = () => {
    if (!selectedId) return
    dispatch({ type: "DELETE_ACCOUNT", payload: selectedId })
    toast({ title: "已删除" })
    setDeleteDialogOpen(false)
    setSelectedId(null)
  }

  if (!state.currentIpId) {
    return (
      <DashboardLayout>
        <PageHeader title="账号管理" breadcrumbs={[{ label: "账号管理" }]} />
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
        title="账号管理"
        breadcrumbs={[{ label: "账号管理" }]}
        actions={
          <Button
            onClick={() => {
              resetForm()
              setDialogOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            绑定账号
          </Button>
        }
      />

      {accounts.length === 0 ? (
        <EmptyStateCard
          icon={AtSign}
          title="暂无账号"
          description="绑定您的社交媒体账号，开始管理多平台内容"
          actionLabel="绑定账号"
          onAction={() => setDialogOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  {account.accountName}
                  {account.isVerified && <CheckCircle className="h-4 w-4 text-blue-500" />}
                </CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(account)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedId(account.id)
                      setDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge variant="outline">{platformNames[account.platform]}</Badge>
                <p className="text-sm text-muted-foreground">@{account.accountId}</p>
                {account.followers && (
                  <p className="text-sm">
                    <span className="font-medium">{account.followers.toLocaleString()}</span>
                    <span className="text-muted-foreground"> 粉丝</span>
                  </p>
                )}
                <Badge variant={account.status === "active" ? "default" : "secondary"}>
                  {account.status === "active" ? "活跃" : "停用"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) resetForm()
          setDialogOpen(open)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAccount ? "编辑账号" : "绑定账号"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>平台</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as Account["platform"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="douyin">抖音</SelectItem>
                  <SelectItem value="xiaohongshu">小红书</SelectItem>
                  <SelectItem value="wechat">微信公众号</SelectItem>
                  <SelectItem value="weibo">微博</SelectItem>
                  <SelectItem value="bilibili">B站</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountId">账号ID *</Label>
              <Input
                id="accountId"
                placeholder="平台用户ID"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountName">账号名称 *</Label>
              <Input
                id="accountName"
                placeholder="显示名称"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="followers">粉丝数</Label>
              <Input
                id="followers"
                type="number"
                placeholder="可选"
                value={followers}
                onChange={(e) => setFollowers(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingAccount ? "保存" : "绑定"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="删除账号"
        description="确定要删除这个账号吗？"
        confirmLabel="删除"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </DashboardLayout>
  )
}
