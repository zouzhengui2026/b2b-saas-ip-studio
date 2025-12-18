"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useAppStore } from "@/lib/app-context"
import { Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface EvidencePickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedIds: string[]
  onSelect: (ids: string[]) => void
}

export function EvidencePickerDialog({ open, onOpenChange, selectedIds, onSelect }: EvidencePickerDialogProps) {
  const { state, currentPersona } = useAppStore()
  const [search, setSearch] = useState("")
  const [localSelected, setLocalSelected] = useState<string[]>(selectedIds)

  const filteredEvidences = useMemo(() => {
    return state.evidences
      .filter((e) => e.personaId === currentPersona?.id)
      .filter(
        (e) =>
          e.title.toLowerCase().includes(search.toLowerCase()) ||
          e.description.toLowerCase().includes(search.toLowerCase()) ||
          e.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())),
      )
  }, [state.evidences, currentPersona?.id, search])

  const handleToggle = (id: string) => {
    setLocalSelected((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const handleConfirm = () => {
    onSelect(localSelected)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>选择证据</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索证据..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="max-h-80 overflow-y-auto space-y-2">
          {filteredEvidences.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">暂无证据</p>
          ) : (
            filteredEvidences.map((evidence) => (
              <div
                key={evidence.id}
                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer"
                onClick={() => handleToggle(evidence.id)}
              >
                <Checkbox
                  checked={localSelected.includes(evidence.id)}
                  onCheckedChange={() => handleToggle(evidence.id)}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{evidence.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{evidence.description}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {evidence.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleConfirm}>确认选择 ({localSelected.length})</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
