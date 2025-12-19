"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAppStore } from "@/lib/app-context"
import { EmptyStateCard } from "@/components/empty-state-card"
import { Plus, AtSign, CheckCircle, Edit, Trash2, Loader2, Video, BookOpen, MessageSquare, AlertTriangle } from "lucide-react"
import { platformNames, sleep } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import type { Account } from "@/lib/types"

const platformOptions = [
  { value: "douyin" as const, label: "抖音", icon: Video },
  { value: "xiaohongshu" as const, label: "小红书", icon: BookOpen },
  { value: "wechat" as const, label: "视频号", icon: MessageSquare },
  { value: "weibo" as const, label: "微博", icon: MessageSquare },
  { value: "bilibili" as const, label: "B站", icon: Video },
]

export default function AccountsPage() {
  const { state, dispatch } = useAppStore()
  const { toast } = useToast()
  const [drawerOpen, setDrawerOpen] = useState(false)
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

  // Reset form when drawer closes
  useEffect(() => {
    if (!drawerOpen) {
      setPlatform("douyin")
      setAccountId("")
      setAccountName("")
      setFollowers("")
      setEditingAccount(null)
    }
  }, [drawerOpen])

  const openEdit = (account: Account) => {
    setEditingAccount(account)
    setPlatform(account.platform)
    setAccountId(account.accountId)
    setAccountName(account.accountName)
    setFollowers(account.followers?.toString() || "")
    setDrawerOpen(true)
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
      toast({ title: "已更新", description: "账号信息已更新" })
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
      toast({ title: "绑定成功", description: "账号已绑定" })
    }

    setLoading(false)
    setDrawerOpen(false)
  }

  const handleDelete = () => {
    if (!selectedId) return
    dispatch({ type: "DELETE_ACCOUNT", payload: selectedId })
    toast({ title: "已删除", description: "账号已删除" })
    setDeleteDialogOpen(false)
    setSelectedId(null)
  }

  if (!state.currentIpId) {
    return (
      <DashboardLayout>
        <PageHeader title="账号管理" breadcrumbs={[{ label: "账号管理" }]} />
        <Card className="border-dashed border-border/30">
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
          <Button onClick={() => setDrawerOpen(true)} className="btn-gradient border-0">
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
          onAction={() => setDrawerOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account, index) => (
            <Card 
              key={account.id}
              className="hover:border-primary/30 transition-all"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  {account.accountName}
                  {account.isVerified && <CheckCircle className="h-4 w-4 text-blue-400" />}
                </CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(account)} className="hover:bg-secondary">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedId(account.id)
                      setDeleteDialogOpen(true)
                    }}
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge variant="outline" className="border-border/50">{platformNames[account.platform]}</Badge>
                <p className="text-sm text-muted-foreground">@{account.accountId}</p>
                {account.followers && (
                  <p className="text-sm">
                    <span className="font-semibold text-foreground">{account.followers.toLocaleString()}</span>
                    <span className="text-muted-foreground"> 粉丝</span>
                  </p>
                )}
                <Badge variant={account.status === "active" ? "success" : "secondary"}>
                  {account.status === "active" ? "活跃" : "停用"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="right">
        <DrawerContent className="h-full w-full sm:max-w-md ml-auto rounded-l-xl rounded-r-none">
          <DrawerHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg">
                <AtSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <DrawerTitle className="text-xl">{editingAccount ? "编辑账号" : "绑定账号"}</DrawerTitle>
                <DrawerDescription>
                  {editingAccount ? "修改账号信息" : "绑定社交媒体账号，管理多平台内容"}
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Platform Selection */}
            <div className="space-y-3">
              <Label className="text-foreground">平台</Label>
              <div className="grid grid-cols-2 gap-3">
                {platformOptions.slice(0, 4).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPlatform(option.value)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      platform === option.value
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                        : "border-border/50 bg-secondary/30 hover:border-border hover:bg-secondary/50"
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${platform === option.value ? "bg-primary/20" : "bg-secondary"}`}>
                      <option.icon className={`h-4 w-4 ${platform === option.value ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <span className={`font-medium text-sm ${platform === option.value ? "text-primary" : "text-foreground"}`}>
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
              {/* B站单独一行 */}
              <button
                type="button"
                onClick={() => setPlatform("bilibili")}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  platform === "bilibili"
                    ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                    : "border-border/50 bg-secondary/30 hover:border-border hover:bg-secondary/50"
                }`}
              >
                <div className={`p-1.5 rounded-lg ${platform === "bilibili" ? "bg-primary/20" : "bg-secondary"}`}>
                  <Video className={`h-4 w-4 ${platform === "bilibili" ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <span className={`font-medium text-sm ${platform === "bilibili" ? "text-primary" : "text-foreground"}`}>
                  B站
                </span>
              </button>
            </div>

            {/* Account ID */}
            <div className="space-y-2">
              <Label htmlFor="accountId" className="text-foreground">
                账号ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="accountId"
                placeholder="平台用户ID，如：techlaowang"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              />
            </div>

            {/* Account Name */}
            <div className="space-y-2">
              <Label htmlFor="accountName" className="text-foreground">
                账号名称 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="accountName"
                placeholder="显示名称，如：科技老王"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
              />
            </div>

            {/* Followers */}
            <div className="space-y-2">
              <Label htmlFor="followers" className="text-foreground">粉丝数（可选）</Label>
              <Input
                id="followers"
                type="number"
                placeholder="如：580000"
                value={followers}
                onChange={(e) => setFollowers(e.target.value)}
              />
            </div>

            {/* Tips */}
            <div className="p-4 rounded-xl bg-secondary/30 border border-border/30 space-y-2">
              <div className="text-sm font-medium text-foreground">💡 小贴士</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• 账号ID用于数据追踪和内容发布</p>
                <p>• 粉丝数会影响周复盘的数据分析</p>
                <p>• 一个IP可以绑定多个平台账号</p>
              </div>
            </div>
          </div>

          <DrawerFooter className="border-t border-border/50 pt-4">
            <div className="flex gap-3 w-full">
              <Button 
                variant="outline" 
                onClick={() => setDrawerOpen(false)} 
                className="flex-1 border-border/50"
              >
                取消
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={loading} 
                className="flex-1 btn-gradient border-0"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingAccount ? "保存" : "绑定"}
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass-card border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-destructive/20">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              删除账号
            </AlertDialogTitle>
            <AlertDialogDescription>确定要删除这个账号吗？此操作不可撤销。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border/50">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
