"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users } from "lucide-react"
import { useAppStore } from "@/lib/app-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function NoIpSelectedCard() {
  const { currentOrgPersonas, setCurrentIp } = useAppStore()

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">请先选择IP</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm mb-4">您可以在顶部导航栏切换IP，或在下方快速选择</p>
        {currentOrgPersonas.length > 0 ? (
          <Select onValueChange={setCurrentIp}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="选择一个IP" />
            </SelectTrigger>
            <SelectContent>
              {currentOrgPersonas.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-sm text-muted-foreground">当前组织下暂无IP</p>
        )}
      </CardContent>
    </Card>
  )
}
