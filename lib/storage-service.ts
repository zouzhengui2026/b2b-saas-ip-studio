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

// 返回带有元信息的云端记录（包含 updated_at），供登录后比较本地/云端新旧
async function loadFromSupabase(userId: string): Promise<{ state: AppState; updated_at: string | null } | null> {
  // 在浏览器端使用专门的浏览器客户端以确保请求包含当前会话的 Authorization header
  try {
    const client = createSupabaseBrowserClient()
    if (!client) return null

    // 可能存在多个记录（历史/重复写入），单条查询使用 single() 会导致 PostgREST 返回 406。
    // 改为按更新时间降序取最新一条并使用 maybeSingle()，兼容 0 或 1 条结果。
    const { data, error } = await client
      .from("user_app_state")
      .select("state, version, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()

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
    return { state: data.state as AppState, updated_at: data.updated_at ?? null }
  } catch (error) {
    console.error("Failed to load from Supabase:", error)
    return null
  }
}

async function saveToSupabase(userId: string, state: AppState): Promise<boolean> {
  // 使用浏览器客户端确保携带当前会话的 token（Authorization header）
  const client = createSupabaseBrowserClient()
  if (!client) return false
  // 将 upsert 请求包装重试逻辑（指数退避）
  const payload = {
    user_id: userId,
    state,
    version: STORAGE_VERSION,
    updated_at: new Date().toISOString(),
  }

  const maxAttempts = 3
  let attempt = 0
  let delayMs = 300

  while (attempt < maxAttempts) {
    try {
      // 记录请求体快照，便于排查（不记录完整 state 内容以免泄露）
      try {
        console.log("Supabase upsert attempt", { attempt: attempt + 1, userId: userId ? userId.slice(0, 8) + "..." : null })
      } catch {}

      const { data, error, status } = await client
        .from("user_app_state")
        .upsert(payload, { onConflict: "user_id" })

      if (error) {
        // 如果 RLS 或权限问题，抛出以便进入重试/最终失败逻辑
        throw error
      }

      // 成功
      try {
        console.log("Supabase upsert success", { status, userId: userId ? userId.slice(0, 8) + "..." : null })
      } catch {}
      return true
    } catch (err: any) {
      // 打印详细错误帮助定位
      try {
        console.error("Supabase upsert failed on attempt", attempt + 1, err)
      } catch {}

      attempt++
      if (attempt >= maxAttempts) {
          // 如果是权限/行级安全错误，尝试主动清理本地 session，提示用户重新登录
          try {
            const code = err?.code || err?.status
            if (code === 401 || code === "401" || code === 42501 || code === "42501") {
              // 不在此处强制 signOut，改为设置一个本地标记并提示用户重新登录
              try {
                localStorage.setItem("supabase-session-invalid", "1")
                console.warn("Supabase: session appears invalid (401/42501). Please re-login to recover your session.")
              } catch (e) {
                // ignore
              }
            }
          } catch (e) {}
        try {
          console.error("Supabase save failed after max attempts", { userId: userId ? userId.slice(0, 8) + "..." : null })
        } catch {}
        return false
      }

      // 指数退避等待
      await new Promise((r) => setTimeout(r, delayMs))
      delayMs *= 2
    }
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
  // 返回 true 表示已成功同步到云端（或 Supabase 未配置），false 表示云端保存失败
  save: (state: AppState) => Promise<boolean>
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
          
          const supabaseRecord = await loadFromSupabase(userId)
          if (supabaseRecord) {
            console.log("✅ 已从 Supabase 云端加载数据", { userId: userId.slice(0, 8) + "..." })
            // 先读取本地 savedAt（如存在）
            let localSavedAt: string | null = null
            try {
              const raw = localStorage.getItem(STORAGE_KEY)
              if (raw) {
                const parsed = JSON.parse(raw)
                localSavedAt = parsed?.savedAt ?? null
              }
            } catch {}

            // 如果本地没有数据，优先使用云端；否则比较时间戳，若云端更新更晚则覆盖本地
            if (!localSavedAt) {
              saveToLocalStorage(supabaseRecord.state)
              return supabaseRecord.state
            } else {
              const cloudUpdatedAt = supabaseRecord.updated_at ? new Date(supabaseRecord.updated_at) : null
              const localUpdatedAt = localSavedAt ? new Date(localSavedAt) : null
              if (cloudUpdatedAt && localUpdatedAt && cloudUpdatedAt > localUpdatedAt) {
                saveToLocalStorage(supabaseRecord.state)
                return supabaseRecord.state
              }
              // 本地更新更晚或云端无时间戳 -> 保持本地数据
            }
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

    save: async (state: AppState): Promise<boolean> => {
      // 始终保存到 localStorage（作为本地缓存）
      saveToLocalStorage(state)

      // 如果 Supabase 未配置，视为已成功（本地已保存）
      if (!useSupabase) return true

      // Supabase 已配置：尝试同步到云端
      const userId = getCachedUserId() || await getAuthUserId()
      if (!userId) {
        // 当前无可用 session/userId，视为云端保存失败（提示用户刷新会话或登录）
        console.warn("Supabase configured but no user session found when saving")
        return false
      }

      cacheUserId(userId)
      const success = await saveToSupabase(userId, state)
      if (success) {
        console.log("☁️ 已同步到云端")
        return true
      }
      return false
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

