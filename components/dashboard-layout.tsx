"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "./app-sidebar"
import { AppTopbar } from "./app-topbar"
import { useAppStore } from "@/lib/app-context"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { state } = useAppStore()
  const router = useRouter()
  
  // 解决 Hydration 错误：等待客户端挂载完成
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    // 未登录时重定向到登录页
    if (isMounted && !state.isAuthenticated) {
      router.push("/login")
    }
  }, [state.isAuthenticated, router, isMounted])

  // 客户端未挂载时显示加载状态（避免 hydration 不匹配）
  if (!isMounted) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // 未登录时不渲染内容
  if (!state.isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppTopbar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
