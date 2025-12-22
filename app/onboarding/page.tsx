"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ChevronLeft, ChevronRight, Building2, User, Award, Plus, X } from "lucide-react"
import type { Org, Persona, Evidence, Offer } from "@/lib/types"

const industries = ["科技", "教育培训", "金融", "医疗健康", "电商零售", "文化娱乐", "其他"]
const ipTypes = [
  { value: "founder", label: "创始人IP" },
  { value: "expert", label: "专家IP" },
  { value: "brand", label: "品牌IP" },
  { value: "kol", label: "KOL" },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { dispatch, state, login } = useAppStore()
  const { toast } = useToast()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Step 1: Org
  const [orgName, setOrgName] = useState("")
  const [industry, setIndustry] = useState("")
  const [city, setCity] = useState("")
  const [isSensitive, setIsSensitive] = useState(false)

  // Step 2: IP
  const [ipName, setIpName] = useState("")
  const [ipType, setIpType] = useState<"founder" | "expert" | "brand" | "kol">("founder")
  const [ipBio, setIpBio] = useState("")

  // Step 3: Offer & Evidence
  const [offerName, setOfferName] = useState("")
  const [offerDesc, setOfferDesc] = useState("")
  const [offerPrice, setOfferPrice] = useState("")
  const [evidences, setEvidences] = useState<{ title: string; description: string; type: string }[]>([
    { title: "", description: "", type: "case" },
  ])

  const handleNext = () => {
    if (step === 1) {
      if (!orgName) {
        toast({ title: "错误", description: "请填写公司名称", variant: "destructive" })
        return
      }
      if (!industry) {
        toast({ title: "错误", description: "请选择行业", variant: "destructive" })
        return
      }
    }
    if (step === 2) {
      if (!ipName) {
        toast({ title: "错误", description: "请填写IP名称", variant: "destructive" })
        return
      }
    }
    if (step === 3) {
      const validEvidence = evidences.filter((e) => e.title && e.description)
      if (validEvidence.length === 0) {
        toast({ title: "错误", description: "请至少添加一条证据", variant: "destructive" })
        return
      }
    }
    setStep(step + 1)
  }

  const handlePrev = () => {
    setStep(step - 1)
  }

  const handleComplete = async () => {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1000))

    const orgId = `org-${Date.now()}`
    const ipId = `ip-${Date.now()}`

    // Create Org
    const newOrg: Org = {
      id: orgId,
      name: orgName,
      industry,
      city,
      isSensitive,
      createdAt: new Date().toISOString(),
    }
    dispatch({ type: "ADD_ORG", payload: newOrg })

    // Create Offer
    const offers: Offer[] = offerName
      ? [
          {
            id: `offer-${Date.now()}`,
            name: offerName,
            description: offerDesc,
            price: offerPrice ? Number(offerPrice) : undefined,
          },
        ]
      : []

    // Create Persona
    const newPersona: Persona = {
      id: ipId,
      orgId,
      name: ipName,
      bio: ipBio,
      type: ipType,
      status: "active",
      offers,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    dispatch({ type: "ADD_PERSONA", payload: newPersona })

    // Create Evidences
    const validEvidences = evidences.filter((e) => e.title && e.description)
    validEvidences.forEach((ev, idx) => {
      const newEvidence: Evidence = {
        id: `ev-${Date.now()}-${idx}`,
        personaId: ipId,
        type: ev.type as Evidence["type"],
        title: ev.title,
        description: ev.description,
        tags: [],
        scope: "public",
        createdAt: new Date().toISOString(),
      }
      dispatch({ type: "ADD_EVIDENCE", payload: newEvidence })
    })

    // 设置当前组织和 IP
    dispatch({ type: "SET_CURRENT_ORG", payload: orgId })
    dispatch({ type: "SET_CURRENT_IP", payload: ipId })

    toast({ title: "创建成功", description: "欢迎使用老板IP获客操作系统！" })
    router.push("/dashboard")
    setLoading(false)
  }

  const addEvidence = () => {
    setEvidences([...evidences, { title: "", description: "", type: "case" }])
  }

  const removeEvidence = (index: number) => {
    if (evidences.length > 1) {
      setEvidences(evidences.filter((_, i) => i !== index))
    }
  }

  const updateEvidence = (index: number, field: string, value: string) => {
    const updated = [...evidences]
    updated[index] = { ...updated[index], [field]: value }
    setEvidences(updated)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    s === step
                      ? "bg-primary text-primary-foreground"
                      : s < step
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s}
                </div>
              ))}
            </div>
          </div>
          <CardTitle className="text-2xl">
            {step === 1 && "创建组织"}
            {step === 2 && "创建IP"}
            {step === 3 && "添加产品与证据"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "填写您的公司基本信息"}
            {step === 2 && "创建您的第一个IP人设"}
            {step === 3 && "添加产品/服务和信任证据"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">组织信息将用于团队协作和数据隔离</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgName">公司名称 *</Label>
                <Input
                  id="orgName"
                  placeholder="请输入公司名称"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>所属行业 *</Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择行业" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((ind) => (
                      <SelectItem key={ind} value={ind}>
                        {ind}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">所在城市</Label>
                <Input id="city" placeholder="请输入城市" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>敏感行业</Label>
                  <p className="text-xs text-muted-foreground">医疗、金融等需要特殊合规审核</p>
                </div>
                <Switch checked={isSensitive} onCheckedChange={setIsSensitive} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">IP是您在社交平台上的人设形象</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ipName">IP名称 *</Label>
                <Input
                  id="ipName"
                  placeholder="如：科技老王、职场小李"
                  value={ipName}
                  onChange={(e) => setIpName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>IP类型</Label>
                <Select value={ipType} onValueChange={(v) => setIpType(v as typeof ipType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ipTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ipBio">IP简介</Label>
                <Textarea
                  id="ipBio"
                  placeholder="一句话描述您的IP定位和价值主张"
                  value={ipBio}
                  onChange={(e) => setIpBio(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Award className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">产品和证据是建立信任的关键</span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="offerName">产品/服务名称</Label>
                  <Input
                    id="offerName"
                    placeholder="如：品牌咨询、1v1辅导"
                    value={offerName}
                    onChange={(e) => setOfferName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="offerDesc">产品描述</Label>
                    <Input
                      id="offerDesc"
                      placeholder="简要描述"
                      value={offerDesc}
                      onChange={(e) => setOfferDesc(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="offerPrice">价格 (元)</Label>
                    <Input
                      id="offerPrice"
                      type="number"
                      placeholder="可选"
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>信任证据 * (至少1条)</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addEvidence}>
                    <Plus className="h-4 w-4 mr-1" />
                    添加
                  </Button>
                </div>
                {evidences.map((ev, idx) => (
                  <div key={idx} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">证据 {idx + 1}</span>
                      {evidences.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeEvidence(idx)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <Select value={ev.type} onValueChange={(v) => updateEvidence(idx, "type", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="证据类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="case">案例</SelectItem>
                        <SelectItem value="testimonial">客户见证</SelectItem>
                        <SelectItem value="data">数据</SelectItem>
                        <SelectItem value="award">荣誉奖项</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="证据标题"
                      value={ev.title}
                      onChange={(e) => updateEvidence(idx, "title", e.target.value)}
                    />
                    <Textarea
                      placeholder="证据描述"
                      value={ev.description}
                      onChange={(e) => updateEvidence(idx, "description", e.target.value)}
                      rows={2}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            {step > 1 && (
              <Button variant="outline" className="flex-1 bg-transparent" onClick={handlePrev}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                上一步
              </Button>
            )}
            {step === 1 && (
              <Button variant="outline" className="flex-1 bg-transparent" onClick={() => router.push("/login")}>
                返回登录
              </Button>
            )}
            {step < 3 ? (
              <Button className="flex-1" onClick={handleNext}>
                下一步
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button className="flex-1" onClick={handleComplete} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                完成创建
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
