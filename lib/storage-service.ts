"use client"

import { supabase, isSupabaseConfigured } from "./supabase"
import { createSupabaseBrowserClient } from "./supabase-browser"
import type { AppState } from "./types"

const STORAGE_KEY = "b2b-saas-app-state"
const STORAGE_VERSION = "1.0"

// 获取当前登录用户的 ID（使用 Supabase Auth）
async function getAuthUserId(): Promise<string | null> {
  try {
    const supabaseClient = createSupabaseBrowserClient()
    const { data: { user } } = await supabaseClient.auth.getUser()
    return user?.id || null
  } catch {
    return null
  }
}

// 同步获取缓存的用户 ID（用于快速操作）
function getCachedUserId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("supabase-user-id")
}

// 缓存用户 ID 到 localStorage
function cacheUserId(userId: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("supabase-user-id", userId)
  }
}

// 清除缓存的用户 ID
function clearCachedUserId(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("supabase-user-id")
  }
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
      // 打印完整错误对象，方便调试
      try {
        console.error("Supabase save error (full):", error)
        console.error("Supabase save error (summary):", {
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
          userId: userId ? (userId.slice(0, 8) + "...") : null,
        })
      } catch (e) {
        console.error("Supabase save error (could not stringify):", error)
      }
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

// 同步加载 localStorage（用于快速初始化）
export function loadFromLocalStorageSync(): AppState | null {
  const state = loadFromLocalStorage()
  if (state) {
    console.log("📦 同步加载本地存储", { personas: state.personas.length, contents: state.contents.length })
  }
  return state
}

function saveToLocalStorage(state: AppState): void {
  if (typeof window === "undefined") return

  try {
    const data = {
      version: STORAGE_VERSION,
      state,
      savedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    console.log("💾 已保存到本地存储", { personas: state.personas.length, contents: state.contents.length })
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
  // RLS 已禁用，启用 Supabase 云存储
  const useSupabase = isSupabaseConfigured()

  return {
    getStorageType: () => (useSupabase ? "supabase" : "localStorage"),

    load: async (initialState: AppState): Promise<AppState> => {
      // 尝试 Supabase（需要用户已登录）
      if (useSupabase) {
        const userId = await getAuthUserId()
        
        if (userId) {
          // 缓存用户 ID 供后续使用
          cacheUserId(userId)
          
          const supabaseState = await loadFromSupabase(userId)
          if (supabaseState) {
            console.log("✅ 已从 Supabase 云端加载数据", { userId: userId.slice(0, 8) + "..." })
            // 同步到本地缓存
            saveToLocalStorage(supabaseState)
            return supabaseState
          }
          
          // 用户已登录但云端没有数据 -> 新用户
          console.log("👤 新用户，使用初始状态")
          return initialState
        }
      }

      // 未登录或 Supabase 不可用 -> 使用 localStorage
      const localState = loadFromLocalStorage()
      if (localState) {
        console.log("📦 已从本地存储加载数据")
        return localState
      }

      return initialState
    },

    save: async (state: AppState): Promise<void> => {
      // 始终保存到 localStorage（作为本地缓存）
      saveToLocalStorage(state)

      // 如果 Supabase 可用且用户已登录，同步到云端
      if (useSupabase) {
        const userId = getCachedUserId() || await getAuthUserId()
        
        if (userId) {
          cacheUserId(userId)
          const success = await saveToSupabase(userId, state)
          if (success) {
            console.log("☁️ 已同步到云端")
          }
        }
      }
    },

    clear: async (_state: AppState): Promise<void> => {
      const userId = getCachedUserId()
      
      clearLocalStorage()
      clearCachedUserId()

      if (useSupabase && userId) {
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

