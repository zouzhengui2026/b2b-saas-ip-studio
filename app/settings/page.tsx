"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { NoIpSelectedCard } from "@/components/no-ip-selected-card"
import { useAppStore } from "@/lib/app-context"
import { useToast } from "@/hooks/use-toast"
import { sleep, formatNames } from "@/lib/utils"
import { Users, Ban, Settings, Plus, Trash2, Loader2, AlertTriangle, Info } from "lucide-react"
import type { TeamMember, Settings as SettingsType } from "@/lib/types"

export default function SettingsPage() {
  const { state, dispatch, currentSettings } = useAppStore()
  const { toast } = useToast()

  // Team Members
  const teamMembers = state.teamMembers.filter((t) => t.orgId === state.currentOrgId)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteName, setInviteName] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"admin" | "editor" | "viewer">("editor")
  const [inviteLoading, setInviteLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null)

  // Banned Words
  const [newBannedWord, setNewBannedWord] = useState("")
  const [addingWord, setAddingWord] = useState(false)

  // Default Config
  const [douyinRatio, setDouyinRatio] = useState(currentSettings?.defaultWeeklyRatio.douyin || 6)
  const [xhsRatio, setXhsRatio] = useState(currentSettings?.defaultWeeklyRatio.xiaohongshu || 4)
  const [wxRatio, setWxRatio] = useState(currentSettings?.defaultWeeklyRatio.wechat || 2)
  const [selectedFormats, setSelectedFormats] = useState<string[]>(currentSettings?.defaultFormats || [])
  const [savingConfig, setSavingConfig] = useState(false)

  // Check if IP is selected
  if (!state.currentIpId) {
    return (
      <DashboardLayout>
        <PageHeader title="设置" breadcrumbs={[{ label: "设置" }]} />
        <NoIpSelectedCard />
      </DashboardLayout>
    )
  }

  const handleInviteMember = async () => {
    if (!inviteName || !inviteEmail) {
      toast({ title: "错误", description: "请填写完整信息", variant: "destructive" })
      return
    }

    setInviteLoading(true)
    await sleep(800)

    const newMember: TeamMember = {
      id: `tm-${Date.now()}`,
      orgId: state.currentOrgId!,
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      invitedAt: new Date().toISOString(),
      status: "pending",
    }

    dispatch({ type: "ADD_TEAM_MEMBER", payload: newMember })
    toast({ title: "邀请已发送", description: `已向 ${inviteEmail} 发送邀请` })
    setInviteDialogOpen(false)
    setInviteName("")
    setInviteEmail("")
    setInviteRole("editor")
    setInviteLoading(false)
  }

  const handleDeleteMember = (id: string) => {
    setMemberToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteMember = () => {
    if (memberToDelete) {
      dispatch({ type: "DELETE_TEAM_MEMBER", payload: memberToDelete })
      toast({ title: "已移除", description: "团队成员已移除" })
    }
    setDeleteDialogOpen(false)
    setMemberToDelete(null)
  }

  const handleAddBannedWord = async () => {
    if (!newBannedWord.trim()) {
      toast({ title: "错误", description: "请输入禁区词", variant: "destructive" })
      return
    }

    if (currentSettings?.bannedWords.includes(newBannedWord.trim())) {
      toast({ title: "错误", description: "该词已存在", variant: "destructive" })
      return
    }

    setAddingWord(true)
    await sleep(300)

    dispatch({
      type: "ADD_BANNED_WORD",
      payload: { orgId: state.currentOrgId!, word: newBannedWord.trim() },
    })
    toast({ title: "已添加", description: `禁区词 "${newBannedWord}" 已添加` })
    setNewBannedWord("")
    setAddingWord(false)
  }

  const handleRemoveBannedWord = (word: string) => {
    dispatch({
      type: "REMOVE_BANNED_WORD",
      payload: { orgId: state.currentOrgId!, word },
    })
    toast({ title: "已删除", description: `禁区词 "${word}" 已删除` })
  }

  const handleToggleFormat = (format: string) => {
    setSelectedFormats((prev) => (prev.includes(format) ? prev.filter((f) => f !== format) : [...prev, format]))
  }

  const handleSaveConfig = async () => {
    if (!state.currentOrgId) return

    setSavingConfig(true)
    await sleep(500)

    const updatedSettings: SettingsType = {
      orgId: state.currentOrgId,
      bannedWords: currentSettings?.bannedWords || [],
      defaultWeeklyRatio: {
        douyin: douyinRatio,
        xiaohongshu: xhsRatio,
        wechat: wxRatio,
      },
      defaultFormats: selectedFormats,
    }

    dispatch({ type: "UPDATE_SETTINGS", payload: updatedSettings })
    toast({ title: "保存成功", description: "默认配置已更新" })
    setSavingConfig(false)
  }

  const roleLabels: Record<string, string> = {
    admin: "管理员",
    editor: "编辑",
    viewer: "查看者",
  }

  const allFormats = ["talking-head", "vlog", "tutorial", "story", "listicle", "reaction"]

  return (
    <DashboardLayout>
      <PageHeader title="设置" breadcrumbs={[{ label: "设置" }]} />

      <Tabs defaultValue="team" className="space-y-6">
        <TabsList>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            团队成员
          </TabsTrigger>
          <TabsTrigger value="banned" className="gap-2">
            <Ban className="h-4 w-4" />
            禁区词
          </TabsTrigger>
          <TabsTrigger value="defaults" className="gap-2">
            <Settings className="h-4 w-4" />
            默认配置
          </TabsTrigger>
        </TabsList>

        {/* Team Members */}
        <TabsContent value="team">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>团队成员</CardTitle>
                <CardDescription>管理组织内的团队成员和权限</CardDescription>
              </div>
              <Button onClick={() => setInviteDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                邀请成员
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-sm font-medium">{member.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={member.status === "active" ? "default" : "secondary"}>
                        {member.status === "active" ? "已激活" : "待接受"}
                      </Badge>
                      <Badge variant="outline">{roleLabels[member.role]}</Badge>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteMember(member.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                {teamMembers.length === 0 && <p className="text-center text-muted-foreground py-8">暂无团队成员</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Banned Words */}
        <TabsContent value="banned">
          <Card>
            <CardHeader>
              <CardTitle>禁区词</CardTitle>
              <CardDescription>内容中包含禁区词时，QA审核会标记问题</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <Info className="h-4 w-4 text-blue-500" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  QA审核时会自动检测内容是否包含禁区词，包含时会降低分数并提示修改
                </p>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="输入禁区词..."
                  value={newBannedWord}
                  onChange={(e) => setNewBannedWord(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddBannedWord()}
                />
                <Button onClick={handleAddBannedWord} disabled={addingWord}>
                  {addingWord ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {currentSettings?.bannedWords.map((word) => (
                  <Badge
                    key={word}
                    variant="secondary"
                    className="px-3 py-1.5 cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    onClick={() => handleRemoveBannedWord(word)}
                  >
                    {word}
                    <Trash2 className="h-3 w-3 ml-2" />
                  </Badge>
                ))}
                {(!currentSettings?.bannedWords || currentSettings.bannedWords.length === 0) && (
                  <p className="text-muted-foreground text-sm">暂无禁区词</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Default Config */}
        <TabsContent value="defaults">
          <Card>
            <CardHeader>
              <CardTitle>默认配置</CardTitle>
              <CardDescription>设置生成周选题时的默认参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>默认周选题比例</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">抖音</Label>
                    <Input
                      type="number"
                      min={0}
                      max={20}
                      value={douyinRatio}
                      onChange={(e) => setDouyinRatio(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">小红书</Label>
                    <Input
                      type="number"
                      min={0}
                      max={20}
                      value={xhsRatio}
                      onChange={(e) => setXhsRatio(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">视频号</Label>
                    <Input
                      type="number"
                      min={0}
                      max={20}
                      value={wxRatio}
                      onChange={(e) => setWxRatio(Number(e.target.value))}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">总计: {douyinRatio + xhsRatio + wxRatio} 条/周</p>
              </div>

              <div className="space-y-3">
                <Label>默认内容格式</Label>
                <div className="flex flex-wrap gap-3">
                  {allFormats.map((format) => (
                    <div key={format} className="flex items-center space-x-2">
                      <Checkbox
                        id={format}
                        checked={selectedFormats.includes(format)}
                        onCheckedChange={() => handleToggleFormat(format)}
                      />
                      <label htmlFor={format} className="text-sm">
                        {formatNames[format] || format}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleSaveConfig} disabled={savingConfig}>
                {savingConfig && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                保存配置
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>邀请团队成员</DialogTitle>
            <DialogDescription>输入成员信息，发送邀请邮件</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>姓名</Label>
              <Input placeholder="成员姓名" value={inviteName} onChange={(e) => setInviteName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>邮箱</Label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>角色</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "admin" | "editor" | "viewer")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">管理员</SelectItem>
                  <SelectItem value="editor">编辑</SelectItem>
                  <SelectItem value="viewer">查看者</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleInviteMember} disabled={inviteLoading}>
              {inviteLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              发送邀请
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              确认移除
            </AlertDialogTitle>
            <AlertDialogDescription>确定要移除该团队成员吗？此操作不可撤销。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认移除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
