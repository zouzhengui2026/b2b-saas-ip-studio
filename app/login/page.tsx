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
import { Loader2, Zap, Target, TrendingUp, Shield } from "lucide-react"

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

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary p-12 flex-col justify-center text-primary-foreground">
        <h1 className="text-4xl font-bold mb-6">老板IP获客操作系统</h1>
        <p className="text-xl mb-8 text-primary-foreground/80">一站式管理您的IP内容、获客线索和商业变现</p>
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary-foreground/10 rounded-lg">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">AI驱动内容生产</h3>
              <p className="text-primary-foreground/70">智能生成选题、脚本、发布包</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary-foreground/10 rounded-lg">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">全链路线索管理</h3>
              <p className="text-primary-foreground/70">从内容到咨询到成交，闭环追踪</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary-foreground/10 rounded-lg">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">数据驱动决策</h3>
              <p className="text-primary-foreground/70">周复盘自动生成，优化内容策略</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary-foreground/10 rounded-lg">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">QA质量把关</h3>
              <p className="text-primary-foreground/70">自动审核，规避风险，确保合规</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">登录</CardTitle>
            <CardDescription>登录您的账号开始使用</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="请输入邮箱"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                登录
              </Button>
            </form>
            <div className="mt-4 flex items-center justify-between text-sm">
              <Button variant="link" className="p-0 h-auto" onClick={() => router.push("/onboarding")}>
                注册新账号
              </Button>
              <Button variant="link" className="p-0 h-auto" onClick={() => setForgotOpen(true)}>
                忘记密码？
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">测试账号: zhangsan@example.com / 123456</p>
          </CardContent>
        </Card>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent>
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
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setForgotOpen(false)}>
              取消
            </Button>
            <Button onClick={handleForgotPassword} disabled={forgotLoading}>
              {forgotLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              发送重置链接
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
