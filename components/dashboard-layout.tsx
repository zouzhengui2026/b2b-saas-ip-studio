"use client"

import type React from "react"
import { AppSidebar } from "./app-sidebar"
import { AppTopbar } from "./app-topbar"

interface DashboardLayoutProps {
  children: React.ReactNode
}

// 认证由 middleware 处理，这里只负责布局
export function DashboardLayout({ children }: DashboardLayoutProps) {
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
