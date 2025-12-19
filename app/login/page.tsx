"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Zap, Target, TrendingUp, Shield, Sparkles } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("zhangsan@example.com")
  const [password, setPassword] = useState("123456")
  const [loading, setLoading] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotLoading, setForgotLoading] = useState(false)
  const { login } = useAppStore()
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast({ title: "错误", description: "请填写邮箱和密码", variant: "destructive" })
      return
    }
    setLoading(true)
    const success = await login(email, password)
    if (success) {
      toast({ title: "登录成功", description: "欢迎回来！" })
      router.push("/dashboard")
    } else {
      toast({ title: "登录失败", description: "邮箱或密码错误", variant: "destructive" })
    }
    setLoading(false)
  }

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      toast({ title: "错误", description: "请输入邮箱地址", variant: "destructive" })
      return
    }
    setForgotLoading(true)
    await new Promise((r) => setTimeout(r, 1000))
    toast({ title: "发送成功", description: "重置密码链接已发送到您的邮箱" })
    setForgotLoading(false)
    setForgotOpen(false)
    setForgotEmail("")
  }

  const features = [
    {
      icon: Zap,
      title: "AI驱动内容生产",
      desc: "智能生成选题、脚本、发布包",
      color: "from-violet-500 to-purple-600",
    },
    {
      icon: Target,
      title: "全链路线索管理",
      desc: "从内容到咨询到成交，闭环追踪",
      color: "from-cyan-500 to-blue-600",
    },
    {
      icon: TrendingUp,
      title: "数据驱动决策",
      desc: "周复盘自动生成，优化内容策略",
      color: "from-emerald-500 to-green-600",
    },
    {
      icon: Shield,
      title: "QA质量把关",
      desc: "自动审核，规避风险，确保合规",
      color: "from-amber-500 to-orange-600",
    },
  ]

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-background">
        {/* 渐变光晕 */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[oklch(0.55_0.25_280/0.15)] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[oklch(0.60_0.20_220/0.12)] rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[oklch(0.70_0.15_200/0.08)] rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
        {/* 网格背景 */}
        <div className="absolute inset-0 grid-bg opacity-30" />
      </div>

      {/* Left Panel - Features */}
      <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-center relative z-10">
        <div className="max-w-lg mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 animate-fade-in">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[oklch(0.55_0.25_280)] to-[oklch(0.60_0.20_220)] flex items-center justify-center shadow-lg shadow-[oklch(0.65_0.22_280/0.3)]">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gradient">IP Studio</h2>
              <p className="text-sm text-muted-foreground">老板IP获客操作系统</p>
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-4 text-foreground animate-slide-up">
            用AI陪你从0到1
            <br />
            <span className="text-gradient">打造个人IP</span>
          </h1>
          <p className="text-lg mb-10 text-muted-foreground animate-slide-up delay-100">
            一站式管理您的IP内容、获客线索和商业变现
          </p>

          <div className="space-y-4">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="flex items-start gap-4 p-4 rounded-xl glass-card animate-slide-up hover-glow transition-all"
                style={{ animationDelay: `${(index + 2) * 100}ms` }}
              >
                <div className={`p-2.5 rounded-lg bg-gradient-to-br ${feature.color} shadow-lg`}>
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <Card className="w-full max-w-md glass-card border-border/50 animate-scale-in">
          <CardHeader className="text-center pb-2">
            {/* Mobile Logo */}
            <div className="flex items-center justify-center gap-2 mb-4 lg:hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[oklch(0.55_0.25_280)] to-[oklch(0.60_0.20_220)] flex items-center justify-center shadow-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gradient">IP Studio</span>
            </div>
            <CardTitle className="text-2xl font-bold">欢迎回来</CardTitle>
            <CardDescription className="text-muted-foreground">登录您的账号开始使用</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="请输入邮箱"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary/20 h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">密码</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary/20 h-11"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-11 btn-gradient border-0 font-medium text-base" 
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                登录
              </Button>
            </form>
            <div className="mt-6 flex items-center justify-between text-sm">
              <Button 
                variant="link" 
                className="p-0 h-auto text-muted-foreground hover:text-primary" 
                onClick={() => router.push("/onboarding")}
              >
                注册新账号
              </Button>
              <Button 
                variant="link" 
                className="p-0 h-auto text-muted-foreground hover:text-primary" 
                onClick={() => setForgotOpen(true)}
              >
                忘记密码？
              </Button>
            </div>
            <div className="divider-glow my-6" />
            <p className="text-xs text-muted-foreground text-center">
              测试账号: <span className="text-foreground/70">zhangsan@example.com</span> / <span className="text-foreground/70">123456</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="glass-card border-border/50">
          <DialogHeader>
            <DialogTitle>重置密码</DialogTitle>
            <DialogDescription>输入您的邮箱地址，我们将发送重置密码链接</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">邮箱地址</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="请输入邮箱"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="bg-secondary/50 border-border/50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setForgotOpen(false)} className="border-border/50">
              取消
            </Button>
            <Button onClick={handleForgotPassword} disabled={forgotLoading} className="btn-gradient border-0">
              {forgotLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              发送重置链接
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
