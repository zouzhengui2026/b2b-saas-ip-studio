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
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <Link 
            href="/dashboard" 
            className="hover:text-foreground transition-colors p-1 rounded hover:bg-secondary/50"
          >
            <Home className="h-4 w-4" />
          </Link>
          {breadcrumbs.map((item, index) => (
            <span key={index} className="flex items-center gap-1">
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
              {item.href ? (
                <Link 
                  href={item.href} 
                  className="hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-secondary/50"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium px-1.5 py-0.5">{item.label}</span>
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
