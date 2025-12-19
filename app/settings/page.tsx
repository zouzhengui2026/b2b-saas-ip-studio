"use client"

import { useState, useEffect } from "react"
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
import { NoIpSelectedCard } from "@/components/no-ip-selected-card"
import { useAppStore } from "@/lib/app-context"
import { useToast } from "@/hooks/use-toast"
import { sleep, formatNames } from "@/lib/utils"
import { Users, Ban, Settings, Plus, Trash2, Loader2, AlertTriangle, Info, UserPlus, Mail, Shield, Edit } from "lucide-react"
import type { TeamMember, Settings as SettingsType } from "@/lib/types"

export default function SettingsPage() {
  const { state, dispatch, currentSettings } = useAppStore()
  const { toast } = useToast()

  // Team Members
  const teamMembers = state.teamMembers.filter((t) => t.orgId === state.currentOrgId)
  const [memberDrawerOpen, setMemberDrawerOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [memberName, setMemberName] = useState("")
  const [memberEmail, setMemberEmail] = useState("")
  const [memberRole, setMemberRole] = useState<"admin" | "editor" | "viewer">("editor")
  const [memberLoading, setMemberLoading] = useState(false)
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

  // Reset member form when drawer closes
  useEffect(() => {
    if (!memberDrawerOpen) {
      setMemberName("")
      setMemberEmail("")
      setMemberRole("editor")
      setEditingMember(null)
    }
  }, [memberDrawerOpen])

  // Check if IP is selected
  if (!state.currentIpId) {
    return (
      <DashboardLayout>
        <PageHeader title="设置" breadcrumbs={[{ label: "设置" }]} />
        <NoIpSelectedCard />
      </DashboardLayout>
    )
  }

  const openEditMember = (member: TeamMember) => {
    setEditingMember(member)
    setMemberName(member.name)
    setMemberEmail(member.email)
    setMemberRole(member.role)
    setMemberDrawerOpen(true)
  }

  const handleSaveMember = async () => {
    if (!memberName || !memberEmail) {
      toast({ title: "错误", description: "请填写完整信息", variant: "destructive" })
      return
    }

    setMemberLoading(true)
    await sleep(800)

    if (editingMember) {
      // Update existing member
      dispatch({
        type: "UPDATE_TEAM_MEMBER",
        payload: {
          ...editingMember,
          name: memberName,
          email: memberEmail,
          role: memberRole,
        },
      })
      toast({ title: "已更新", description: "成员信息已更新" })
    } else {
      // Add new member
      const newMember: TeamMember = {
        id: `tm-${Date.now()}`,
        orgId: state.currentOrgId!,
        name: memberName,
        email: memberEmail,
        role: memberRole,
        invitedAt: new Date().toISOString(),
        status: "pending",
      }
      dispatch({ type: "ADD_TEAM_MEMBER", payload: newMember })
      toast({ title: "邀请已发送", description: `已向 ${memberEmail} 发送邀请` })
    }

    setMemberDrawerOpen(false)
    setMemberLoading(false)
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

  const roleOptions = [
    { value: "admin" as const, label: "管理员", desc: "可管理所有设置和成员" },
    { value: "editor" as const, label: "编辑", desc: "可创建和编辑内容" },
    { value: "viewer" as const, label: "查看者", desc: "仅可查看内容" },
  ]

  const allFormats = ["talking-head", "vlog", "tutorial", "story", "listicle", "reaction"]

  return (
    <DashboardLayout>
      <PageHeader title="设置" breadcrumbs={[{ label: "设置" }]} />

      <Tabs defaultValue="team" className="space-y-6">
        <TabsList className="bg-secondary/50 border border-border/50">
          <TabsTrigger value="team" className="gap-2 data-[state=active]:bg-background">
            <Users className="h-4 w-4" />
            团队成员
          </TabsTrigger>
          <TabsTrigger value="banned" className="gap-2 data-[state=active]:bg-background">
            <Ban className="h-4 w-4" />
            禁区词
          </TabsTrigger>
          <TabsTrigger value="defaults" className="gap-2 data-[state=active]:bg-background">
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
              <Button onClick={() => setMemberDrawerOpen(true)} className="btn-gradient border-0">
                <Plus className="h-4 w-4 mr-2" />
                邀请成员
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border border-border/50 rounded-xl hover:border-border transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[oklch(0.55_0.25_280)] to-[oklch(0.60_0.20_220)] flex items-center justify-center">
                        <span className="text-sm font-medium text-white">{member.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={member.status === "active" ? "success" : "warning"}>
                        {member.status === "active" ? "已激活" : "待接受"}
                      </Badge>
                      <Badge variant="outline" className="border-border/50">{roleLabels[member.role]}</Badge>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => openEditMember(member)}
                        className="hover:bg-secondary"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteMember(member.id)}
                        className="hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {teamMembers.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                      <Users className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">暂无团队成员</p>
                    <p className="text-sm text-muted-foreground/60">点击上方按钮邀请团队成员</p>
                  </div>
                )}
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
              <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <Info className="h-4 w-4 text-blue-400" />
                <p className="text-sm text-blue-400">
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
                <Button onClick={handleAddBannedWord} disabled={addingWord} className="btn-gradient border-0">
                  {addingWord ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {currentSettings?.bannedWords.map((word) => (
                  <Badge
                    key={word}
                    variant="secondary"
                    className="px-3 py-1.5 cursor-pointer hover:bg-destructive/20 hover:text-destructive transition-colors"
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

              <Button onClick={handleSaveConfig} disabled={savingConfig} className="btn-gradient border-0">
                {savingConfig && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                保存配置
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Member Add/Edit Drawer */}
      <Drawer open={memberDrawerOpen} onOpenChange={setMemberDrawerOpen} direction="right">
        <DrawerContent className="h-full w-full sm:max-w-md ml-auto rounded-l-xl rounded-r-none">
          <DrawerHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-[oklch(0.55_0.25_280)] to-[oklch(0.60_0.20_220)] shadow-lg">
                <UserPlus className="h-5 w-5 text-white" />
              </div>
              <div>
                <DrawerTitle className="text-xl">
                  {editingMember ? "编辑成员" : "邀请团队成员"}
                </DrawerTitle>
                <DrawerDescription>
                  {editingMember ? "修改成员信息和权限" : "输入成员信息，发送邀请邮件"}
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="member-name" className="text-foreground">
                姓名 <span className="text-destructive">*</span>
              </Label>
              <Input 
                id="member-name"
                placeholder="成员姓名" 
                value={memberName} 
                onChange={(e) => setMemberName(e.target.value)} 
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="member-email" className="flex items-center gap-2 text-foreground">
                <Mail className="h-4 w-4 text-muted-foreground" />
                邮箱 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="member-email"
                type="email"
                placeholder="email@example.com"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                disabled={!!editingMember} // 编辑时邮箱不可改
              />
              {editingMember && (
                <p className="text-xs text-muted-foreground">邮箱不可修改</p>
              )}
            </div>

            {/* Role Selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-foreground">
                <Shield className="h-4 w-4 text-muted-foreground" />
                角色权限
              </Label>
              <div className="space-y-2">
                {roleOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMemberRole(option.value)}
                    className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                      memberRole === option.value
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                        : "border-border/50 bg-secondary/30 hover:border-border hover:bg-secondary/50"
                    }`}
                  >
                    <div className={`p-2 rounded-lg mt-0.5 ${memberRole === option.value ? "bg-primary/20" : "bg-secondary"}`}>
                      <Shield className={`h-4 w-4 ${memberRole === option.value ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <div className={`font-medium ${memberRole === option.value ? "text-primary" : "text-foreground"}`}>
                        {option.label}
                      </div>
                      <div className="text-xs text-muted-foreground">{option.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="p-4 rounded-xl bg-secondary/30 border border-border/30 space-y-2">
              <div className="text-sm font-medium text-foreground">💡 小贴士</div>
              <div className="text-xs text-muted-foreground space-y-1">
                {editingMember ? (
                  <>
                    <p>• 修改角色后权限立即生效</p>
                    <p>• 管理员可以管理所有成员和设置</p>
                    <p>• 编辑可以创建和编辑内容，但不能管理成员</p>
                  </>
                ) : (
                  <>
                    <p>• 邀请发送后，成员需点击邮件中的链接激活账号</p>
                    <p>• 管理员可以管理所有成员和设置</p>
                    <p>• 编辑可以创建和编辑内容，但不能管理成员</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <DrawerFooter className="border-t border-border/50 pt-4">
            <div className="flex gap-3 w-full">
              <Button 
                variant="outline" 
                onClick={() => setMemberDrawerOpen(false)} 
                className="flex-1 border-border/50"
              >
                取消
              </Button>
              <Button 
                onClick={handleSaveMember} 
                disabled={memberLoading} 
                className="flex-1 btn-gradient border-0"
              >
                {memberLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingMember ? "保存" : "发送邀请"}
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
              确认移除
            </AlertDialogTitle>
            <AlertDialogDescription>确定要移除该团队成员吗？此操作不可撤销。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border/50">取消</AlertDialogCancel>
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
