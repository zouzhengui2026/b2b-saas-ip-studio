"use client"

import { supabase, isSupabaseConfigured } from "./supabase"
import type { AppState } from "./types"

const STORAGE_KEY = "b2b-saas-app-state"
const STORAGE_VERSION = "1.0"

// 获取用户标识（简化版，使用邮箱或设备ID）
function getUserId(state: AppState): string {
  // 如果用户已登录，使用邮箱作为标识
  if (state.currentUser?.email) {
    return state.currentUser.email
  }
  // 否则使用设备指纹（存储在 localStorage）
  if (typeof window !== "undefined") {
    let deviceId = localStorage.getItem("device-id")
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).slice(2)}`
      localStorage.setItem("device-id", deviceId)
    }
    return deviceId
  }
  return "anonymous"
}

// ============ Supabase 存储 ============

async function loadFromSupabase(userId: string): Promise<AppState | null> {
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from("user_app_state")
      .select("state, version")
      .eq("user_id", userId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // 没有找到记录，这是正常的首次使用情况
        return null
      }
      console.error("Supabase load error:", error)
      return null
    }

    if (data?.version !== STORAGE_VERSION) {
      console.warn("State version mismatch, will use initial state")
      return null
    }

    return data.state as AppState
  } catch (error) {
    console.error("Failed to load from Supabase:", error)
    return null
  }
}

async function saveToSupabase(userId: string, state: AppState): Promise<boolean> {
  if (!supabase) return false

  try {
    const { error } = await supabase
      .from("user_app_state")
      .upsert(
        {
          user_id: userId,
          state,
          version: STORAGE_VERSION,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )

    if (error) {
      console.error("Supabase save error:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Failed to save to Supabase:", error)
    return false
  }
}

async function clearSupabaseState(userId: string): Promise<void> {
  if (!supabase) return

  try {
    await supabase.from("user_app_state").delete().eq("user_id", userId)
  } catch (error) {
    console.error("Failed to clear Supabase state:", error)
  }
}

// ============ localStorage 存储（后备） ============

function loadFromLocalStorage(): AppState | null {
  if (typeof window === "undefined") return null

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    const parsed = JSON.parse(stored)
    if (parsed.version !== STORAGE_VERSION) return null
    return parsed.state as AppState
  } catch (error) {
    console.warn("Failed to load from localStorage:", error)
    return null
  }
}

function saveToLocalStorage(state: AppState): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: STORAGE_VERSION,
        state,
        savedAt: new Date().toISOString(),
      })
    )
  } catch (error) {
    console.warn("Failed to save to localStorage:", error)
  }
}

function clearLocalStorage(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.warn("Failed to clear localStorage:", error)
  }
}

// ============ 统一存储接口 ============

export interface StorageService {
  load: (initialState: AppState) => Promise<AppState>
  save: (state: AppState) => Promise<void>
  clear: (state: AppState) => Promise<void>
  getStorageType: () => "supabase" | "localStorage"
}

export function createStorageService(): StorageService {
  const useSupabase = isSupabaseConfigured()

  return {
    getStorageType: () => (useSupabase ? "supabase" : "localStorage"),

    load: async (initialState: AppState): Promise<AppState> => {
      // 尝试 Supabase
      if (useSupabase) {
        // 先尝试从 localStorage 获取用户信息以确定 userId
        const localState = loadFromLocalStorage()
        const userId = getUserId(localState || initialState)

        const supabaseState = await loadFromSupabase(userId)
        if (supabaseState) {
          console.log("✅ 已从 Supabase 云端加载数据")
          return supabaseState
        }
      }

      // 降级到 localStorage
      const localState = loadFromLocalStorage()
      if (localState) {
        console.log("📦 已从本地存储加载数据")
        return localState
      }

      return initialState
    },

    save: async (state: AppState): Promise<void> => {
      const userId = getUserId(state)

      // 始终保存到 localStorage（作为本地缓存）
      saveToLocalStorage(state)

      // 如果 Supabase 可用，也保存到云端
      if (useSupabase) {
        const success = await saveToSupabase(userId, state)
        if (success) {
          console.log("☁️ 已同步到云端")
        }
      }
    },

    clear: async (state: AppState): Promise<void> => {
      const userId = getUserId(state)

      clearLocalStorage()

      if (useSupabase) {
        await clearSupabaseState(userId)
      }
    },
  }
}

// 单例
let storageServiceInstance: StorageService | null = null

export function getStorageService(): StorageService {
  if (!storageServiceInstance) {
    storageServiceInstance = createStorageService()
  }
  return storageServiceInstance
}

