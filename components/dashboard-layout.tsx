"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { AppSidebar } from "./app-sidebar"
import { AppTopbar } from "./app-topbar"
import { useAppStore } from "@/lib/app-context"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { state } = useAppStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // 未登录时重定向到登录页
    if (!state.isAuthenticated) {
      router.push("/login")
    }
  }, [state.isAuthenticated, router])

  // 未登录时不渲染内容
  if (!state.isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppTopbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
