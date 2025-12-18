"use client"

import { useState, useEffect } from "react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAppStore } from "@/lib/app-context"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { sleep } from "@/lib/utils"
import type { Lead, LeadSource, LeadLevel } from "@/lib/types"

interface AddLeadDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prefilledContentId?: string
}

export function AddLeadDrawer({ open, onOpenChange, prefilledContentId }: AddLeadDrawerProps) {
  const { state, dispatch } = useAppStore()
  const { toast } = useToast()

  const [name, setName] = useState("")
  const [contact, setContact] = useState("")
  const [platform, setPlatform] = useState("")
  const [source, setSource] = useState<LeadSource>("dm")
  const [sourceContentId, setSourceContentId] = useState(prefilledContentId || "")
  const [leadLevel, setLeadLevel] = useState<LeadLevel>("warm")
  const [needTag, setNeedTag] = useState("")
  const [nextAction, setNextAction] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  // Reset form when drawer opens/closes or prefilledContentId changes
  useEffect(() => {
    if (open) {
      setSourceContentId(prefilledContentId || "")
    } else {
      // Reset form when drawer closes
      setName("")
      setContact("")
      setPlatform("")
      setSource("dm")
      setSourceContentId("")
      setLeadLevel("warm")
      setNeedTag("")
      setNextAction("")
      setNotes("")
    }
  }, [open, prefilledContentId])

  const publishedContents = state.contents.filter((c) => c.personaId === state.currentIpId && c.status === "published")

  const handleSubmit = async () => {
    if (!name) {
      toast({ title: "错误", description: "请填写线索名称", variant: "destructive" })
      return
    }
    if (!state.currentIpId) {
      toast({ title: "错误", description: "请先选择IP", variant: "destructive" })
      return
    }

    setLoading(true)
    await sleep(500)

    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      personaId: state.currentIpId,
      name,
      contact: contact || undefined,
      platform: platform || undefined,
      source,
      sourceContentId: sourceContentId || undefined,
      status: "new",
      leadLevel,
      needTag: needTag || undefined,
      nextAction: nextAction || undefined,
      notes: notes || undefined,
      tags: needTag ? [needTag] : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    dispatch({ type: "ADD_LEAD", payload: newLead })
    toast({ title: "创建成功", description: "线索已添加" })

    // Reset
    setName("")
    setContact("")
    setPlatform("")
    setSource("dm")
    setSourceContentId("")
    setLeadLevel("warm")
    setNeedTag("")
    setNextAction("")
    setLoading(false)
    onOpenChange(false)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="h-full w-full sm:max-w-md">
        <DrawerHeader>
          <DrawerTitle>创建线索</DrawerTitle>
          <DrawerDescription>记录新的商机线索</DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="lead-name">线索名称 *</Label>
            <Input
              id="lead-name"
              placeholder="如：某品牌市场部"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lead-contact">联系方式</Label>
              <Input
                id="lead-contact"
                placeholder="电话/邮箱/微信"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-platform">来源平台</Label>
              <Input
                id="lead-platform"
                placeholder="如：抖音、小红书"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>线索来源</Label>
              <Select value={source} onValueChange={(v) => setSource(v as LeadSource)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dm">私信</SelectItem>
                  <SelectItem value="comment">评论</SelectItem>
                  <SelectItem value="form">表单</SelectItem>
                  <SelectItem value="referral">转介绍</SelectItem>
                  <SelectItem value="manual">手动录入</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>意向等级</Label>
              <Select value={leadLevel} onValueChange={(v) => setLeadLevel(v as LeadLevel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hot">高意向</SelectItem>
                  <SelectItem value="warm">中意向</SelectItem>
                  <SelectItem value="cold">低意向</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>关联内容</Label>
            <Select value={sourceContentId} onValueChange={setSourceContentId}>
              <SelectTrigger>
                <SelectValue placeholder="选择来源内容" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">无</SelectItem>
                {publishedContents.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.id} - {c.title?.slice(0, 20)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="need-tag">需求标签</Label>
              <Input
                id="need-tag"
                placeholder="如：品牌合作"
                value={needTag}
                onChange={(e) => setNeedTag(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="next-action">下一步动作</Label>
              <Input
                id="next-action"
                placeholder="如：周一跟进"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
              />
            </div>
          </div>

            <div className="space-y-2">
              <Label htmlFor="lead-notes">备注</Label>
              <Textarea
                id="lead-notes"
                placeholder="其他信息..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </div>

        <DrawerFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            创建
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
