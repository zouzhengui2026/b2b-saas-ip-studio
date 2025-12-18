"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/app-context"

export default function HomePage() {
  const { state } = useAppStore()
  const router = useRouter()

  useEffect(() => {
    if (state.isAuthenticated) {
      router.push("/dashboard")
    } else {
      router.push("/login")
    }
  }, [state.isAuthenticated, router])

  return null
}
