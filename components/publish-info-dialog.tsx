"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PublishInfoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultDate?: string
  defaultUrl?: string
  onConfirm: (date: string, url?: string) => void
}

export function PublishInfoDialog({
  open,
  onOpenChange,
  defaultDate,
  defaultUrl,
  onConfirm,
}: PublishInfoDialogProps) {
  const [publishDate, setPublishDate] = useState("")
  const [publishUrl, setPublishUrl] = useState("")

  useEffect(() => {
    if (open) {
      // 设置默认日期为今天（格式：YYYY-MM-DD）
      const today = defaultDate
        ? new Date(defaultDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0]
      setPublishDate(today)
      setPublishUrl(defaultUrl || "")
    }
  }, [open, defaultDate, defaultUrl])

  const handleConfirm = () => {
    // 如果日期为空，使用今天
    const dateToUse = publishDate || new Date().toISOString().split("T")[0]
    // 转换为ISO字符串
    const isoDate = new Date(dateToUse).toISOString()
    onConfirm(isoDate, publishUrl || undefined)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>标记已发布</DialogTitle>
          <DialogDescription>请填写发布信息</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="publish-date">发布日期 *</Label>
            <Input
              id="publish-date"
              type="date"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="publish-url">发布链接（可选）</Label>
            <Input
              id="publish-url"
              type="url"
              placeholder="https://..."
              value={publishUrl}
              onChange={(e) => setPublishUrl(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleConfirm}>确认发布</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

