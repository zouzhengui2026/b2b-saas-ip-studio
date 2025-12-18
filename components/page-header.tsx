"use client"

import { ChevronRight, Home } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: ReactNode
}

export function PageHeader({ title, breadcrumbs = [], actions }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
          <Link href="/dashboard" className="hover:text-foreground">
            <Home className="h-4 w-4" />
          </Link>
          {breadcrumbs.map((item, index) => (
            <span key={index} className="flex items-center gap-1">
              <ChevronRight className="h-4 w-4" />
              {item.href ? (
                <Link href={item.href} className="hover:text-foreground">
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Title & Actions */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
