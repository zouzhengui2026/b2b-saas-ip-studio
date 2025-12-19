"use client"

import type React from "react"
import { createContext, useContext, useReducer, useCallback, useMemo, useEffect, useState, type ReactNode } from "react"
import type { AppState, AppAction, Content, ContentStatus, ContentMetrics, QaResult, PublishPack, Settings } from "./types"
import { initialAppState } from "./mock-data"
import { sleep } from "./utils"

// localStorage 持久化配置
const STORAGE_KEY = "b2b-saas-app-state"
const STORAGE_VERSION = "1.0"

// 从 localStorage 加载状态
function loadStateFromStorage(): AppState | null {
  if (typeof window === "undefined") return null
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    const parsed = JSON.parse(stored)
    // 版本检查，如果版本不匹配则返回 null 使用默认数据
    if (parsed.version !== STORAGE_VERSION) return null
    return parsed.state as AppState
  } catch (error) {
    console.warn("Failed to load state from localStorage:", error)
    return null
  }
}

// 保存状态到 localStorage
function saveStateToStorage(state: AppState): void {
  if (typeof window === "undefined") return
  try {
    const data = {
      version: STORAGE_VERSION,
      state,
      savedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.warn("Failed to save state to localStorage:", error)
  }
}

// 清除 localStorage 中的状态
function clearStorageState(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.warn("Failed to clear state from localStorage:", error)
  }
}

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_CURRENT_ORG": {
      const orgPersonas = state.personas.filter((p) => p.orgId === action.payload)
      const firstPersonaId = orgPersonas.length > 0 ? orgPersonas[0].id : null
      return { ...state, currentOrgId: action.payload, currentIpId: firstPersonaId }
    }
    case "SET_CURRENT_IP":
      return { ...state, currentIpId: action.payload || null }
    case "LOGIN": {
      const orgId = action.payload.orgIds[0] || null
      const orgPersonas = orgId ? state.personas.filter((p) => p.orgId === orgId) : []
      const firstPersonaId = orgPersonas.length > 0 ? orgPersonas[0].id : null
      return {
        ...state,
        isAuthenticated: true,
        currentUser: action.payload,
        currentOrgId: orgId,
        currentIpId: firstPersonaId,
      }
    }
    case "LOGOUT":
      return {
        ...initialAppState,
        isAuthenticated: false,
        currentUser: null,
        currentOrgId: null,
        currentIpId: null,
        weeklyDraftSources: [],
      }
    // Org CRUD
    case "ADD_ORG":
      return { ...state, orgs: [...state.orgs, action.payload] }
    case "UPDATE_ORG":
      return {
        ...state,
        orgs: state.orgs.map((o) => (o.id === action.payload.id ? action.payload : o)),
      }
    // Persona CRUD
    case "ADD_PERSONA":
      return { ...state, personas: [...state.personas, action.payload] }
    case "UPDATE_PERSONA":
      return {
        ...state,
        personas: state.personas.map((p) => (p.id === action.payload.id ? action.payload : p)),
      }
    case "DELETE_PERSONA":
      return {
        ...state,
        personas: state.personas.filter((p) => p.id !== action.payload),
        currentIpId: state.currentIpId === action.payload ? null : state.currentIpId,
      }
    // Epoch CRUD
    case "ADD_EPOCH":
      return { ...state, epochs: [...state.epochs, action.payload] }
    case "UPDATE_EPOCH":
      return {
        ...state,
        epochs: state.epochs.map((e) => (e.id === action.payload.id ? action.payload : e)),
      }
    case "SET_CURRENT_EPOCH":
      return {
        ...state,
        epochs: state.epochs.map((e) =>
          e.personaId === action.payload.personaId ? { ...e, isCurrent: e.id === action.payload.epochId } : e,
        ),
        personas: state.personas.map((p) =>
          p.id === action.payload.personaId ? { ...p, currentEpochId: action.payload.epochId } : p,
        ),
      }
    // Evidence CRUD
    case "ADD_EVIDENCE":
      return { ...state, evidences: [...state.evidences, action.payload] }
    case "UPDATE_EVIDENCE":
      return {
        ...state,
        evidences: state.evidences.map((e) => (e.id === action.payload.id ? action.payload : e)),
      }
    case "DELETE_EVIDENCE":
      return { ...state, evidences: state.evidences.filter((e) => e.id !== action.payload) }
    // Account CRUD
    case "ADD_ACCOUNT":
      return { ...state, accounts: [...state.accounts, action.payload] }
    case "UPDATE_ACCOUNT":
      return {
        ...state,
        accounts: state.accounts.map((a) => (a.id === action.payload.id ? action.payload : a)),
      }
    case "DELETE_ACCOUNT":
      return { ...state, accounts: state.accounts.filter((a) => a.id !== action.payload) }
    // Reference CRUD
    case "ADD_REFERENCE":
      return { ...state, references: [...state.references, action.payload] }
    case "UPDATE_REFERENCE":
      return {
        ...state,
        references: state.references.map((r) => (r.id === action.payload.id ? action.payload : r)),
      }
    case "DELETE_REFERENCE":
      return { ...state, references: state.references.filter((r) => r.id !== action.payload) }
    // Content CRUD
    case "ADD_CONTENT":
      return { ...state, contents: [...state.contents, action.payload] }
    case "UPDATE_CONTENT":
      return {
        ...state,
        contents: state.contents.map((c) => (c.id === action.payload.id ? action.payload : c)),
      }
    case "DELETE_CONTENT":
      return { ...state, contents: state.contents.filter((c) => c.id !== action.payload) }
    case "SET_CONTENT_STATUS":
      return {
        ...state,
        contents: state.contents.map((c) =>
          c.id === action.payload.id ? { ...c, status: action.payload.status, updatedAt: new Date().toISOString() } : c,
        ),
      }
    case "UPDATE_CONTENT_METRICS":
      return {
        ...state,
        contents: state.contents.map((c) =>
          c.id === action.payload.id
            ? {
                ...c,
                metrics: { ...c.metrics, ...action.payload.metrics, updatedAt: new Date().toISOString() },
                updatedAt: new Date().toISOString(),
              }
            : c,
        ),
      }
    case "SET_QA_RESULT":
      return {
        ...state,
        contents: state.contents.map((c) =>
          c.id === action.payload.id
            ? { ...c, qaResult: action.payload.qaResult, updatedAt: new Date().toISOString() }
            : c,
        ),
      }
    case "SET_PUBLISH_PACK":
      return {
        ...state,
        contents: state.contents.map((c) =>
          c.id === action.payload.id
            ? { ...c, publishPack: action.payload.publishPack, updatedAt: new Date().toISOString() }
            : c,
        ),
      }
    case "ADD_CONTENTS_BATCH":
      return { ...state, contents: [...state.contents, ...action.payload] }
    // Lead CRUD
    case "ADD_LEAD":
      return { ...state, leads: [...state.leads, action.payload] }
    case "UPDATE_LEAD":
      return {
        ...state,
        leads: state.leads.map((l) => (l.id === action.payload.id ? action.payload : l)),
      }
    case "DELETE_LEAD":
      return { ...state, leads: state.leads.filter((l) => l.id !== action.payload) }
    // Inbox CRUD
    case "ADD_INBOX":
      return { ...state, inboxItems: [...state.inboxItems, action.payload] }
    case "UPDATE_INBOX":
      return {
        ...state,
        inboxItems: state.inboxItems.map((i) => (i.id === action.payload.id ? action.payload : i)),
      }
    case "DELETE_INBOX":
      return { ...state, inboxItems: state.inboxItems.filter((i) => i.id !== action.payload) }
    // Weekly Report
    case "ADD_WEEKLY_REPORT":
      return { ...state, weeklyReports: [...state.weeklyReports, action.payload] }
    // Team Members
    case "ADD_TEAM_MEMBER":
      return { ...state, teamMembers: [...state.teamMembers, action.payload] }
    case "UPDATE_TEAM_MEMBER":
      return { ...state, teamMembers: state.teamMembers.map((t) => t.id === action.payload.id ? action.payload : t) }
    case "DELETE_TEAM_MEMBER":
      return { ...state, teamMembers: state.teamMembers.filter((t) => t.id !== action.payload) }
    // Settings
    case "UPDATE_SETTINGS":
      return {
        ...state,
        settings: state.settings.map((s) => (s.orgId === action.payload.orgId ? action.payload : s)),
      }
    case "ADD_BANNED_WORD":
      return {
        ...state,
        settings: state.settings.map((s) =>
          s.orgId === action.payload.orgId ? { ...s, bannedWords: [...s.bannedWords, action.payload.word] } : s,
        ),
      }
    case "REMOVE_BANNED_WORD":
      return {
        ...state,
        settings: state.settings.map((s) =>
          s.orgId === action.payload.orgId
            ? { ...s, bannedWords: s.bannedWords.filter((w) => w !== action.payload.word) }
            : s,
        ),
      }
    // Draft Sources
    case "ADD_DRAFT_SOURCE":
      return {
        ...state,
        weeklyDraftSources: state.weeklyDraftSources.includes(action.payload)
          ? state.weeklyDraftSources
          : [...state.weeklyDraftSources, action.payload],
      }
    case "CLEAR_DRAFT_SOURCES":
      return { ...state, weeklyDraftSources: [] }
    case "SET_ASSISTANT_STAGE":
      return { ...state, assistantStage: action.payload }
    default:
      return state
  }
}

// Context Types
interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  // Actions
  setCurrentOrg: (orgId: string) => void
  setCurrentIp: (ipId: string | null) => void
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  // Content Actions
  setContentStatus: (id: string, status: ContentStatus) => void
  updateContentMetrics: (id: string, metrics: ContentMetrics) => void
  runQa: (contentId: string) => Promise<QaResult>
  generatePublishPack: (contentId: string) => Promise<PublishPack>
  generateScript: (contentId: string, style?: string) => Promise<void>
  // Computed
  currentOrg: (typeof initialAppState.orgs)[0] | undefined
  currentPersona: (typeof initialAppState.personas)[0] | undefined
  currentOrgPersonas: typeof initialAppState.personas
  currentEpoch: (typeof initialAppState.epochs)[0] | undefined
  currentSettings: Settings | undefined
}

const AppContext = createContext<AppContextType | null>(null)

// Provider Component
export function AppProvider({ children }: { children: ReactNode }) {
  // 使用延迟初始化，先尝试从 localStorage 加载
  const [state, dispatch] = useReducer(appReducer, initialAppState, (initial) => {
    // 服务端渲染时直接返回初始状态
    if (typeof window === "undefined") return initial
    // 客户端尝试从 localStorage 加载
    const stored = loadStateFromStorage()
    return stored || initial
  })

  // 用于标记是否已完成客户端初始化（处理 SSR hydration）
  const [isHydrated, setIsHydrated] = useState(false)

  // 客户端 hydration 完成后设置标记
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // 监听状态变化，自动保存到 localStorage
  useEffect(() => {
    if (isHydrated) {
      saveStateToStorage(state)
    }
  }, [state, isHydrated])

  const setCurrentOrg = useCallback((orgId: string) => {
    dispatch({ type: "SET_CURRENT_ORG", payload: orgId })
  }, [])

  const setCurrentIp = useCallback((ipId: string | null) => {
    dispatch({ type: "SET_CURRENT_IP", payload: ipId || "" })
  }, [])

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      await sleep(1000)
      if (email.includes("fail")) {
        return false
      }
      const user = state.users.find((u) => u.email === email)
      if (user && password === "123456") {
        dispatch({ type: "LOGIN", payload: user })
        return true
      }
      return false
    },
    [state.users],
  )

  const logout = useCallback(() => {
    clearStorageState() // 登出时清除本地存储
    dispatch({ type: "LOGOUT" })
  }, [])

  const setContentStatus = useCallback((id: string, status: ContentStatus) => {
    dispatch({ type: "SET_CONTENT_STATUS", payload: { id, status } })
  }, [])

  const updateContentMetrics = useCallback((id: string, metrics: ContentMetrics) => {
    dispatch({ type: "UPDATE_CONTENT_METRICS", payload: { id, metrics } })
  }, [])

  const runQa = useCallback(
    async (contentId: string): Promise<QaResult> => {
      await sleep(800 + Math.random() * 400)
      const content = state.contents.find((c) => c.id === contentId)
      const settings = state.settings.find((s) => s.orgId === state.currentOrgId)
      const bannedWords = settings?.bannedWords || []

      let verdict: "pass" | "fix" | "block" = "pass"
      const issues: string[] = []
      const suggestions: string[] = []
      let score = 90

      // Rule 1: Check evidence
      if (!content?.evidenceIds || content.evidenceIds.length === 0) {
        issues.push("内容缺少证据支撑")
        suggestions.push("建议添加至少一条相关证据")
        verdict = "fix"
        score -= 15
      }

      // Rule 2: Check banned words
      const fullText = `${content?.title || ""} ${content?.script?.hook || ""} ${content?.script?.fullScript || ""}`
      const foundBannedWords = bannedWords.filter((word) => fullText.includes(word))
      if (foundBannedWords.length > 0) {
        issues.push(`包含禁区词: ${foundBannedWords.join(", ")}`)
        suggestions.push("请修改或删除禁区词")
        verdict = verdict === "pass" ? "fix" : verdict
        score -= 10 * foundBannedWords.length
      }

      // Rule 3: XHS specific - check for lead generation
      if (content?.platform === "xiaohongshu") {
        const leadWords = ["加微信", "私聊", "联系方式", "vx", "wx"]
        const hasLead = leadWords.some((w) => fullText.toLowerCase().includes(w))
        if (hasLead) {
          issues.push("小红书内容包含导流信息，可能违规")
          verdict = "block"
          score -= 30
        }
      }

      // Rule 4: Check for promise words
      const promiseWords = ["保证", "100%", "绝对有效", "一定能"]
      const hasPromise = promiseWords.some((w) => fullText.includes(w))
      if (hasPromise) {
        issues.push("包含承诺性用语，存在合规风险")
        verdict = verdict === "pass" ? "fix" : verdict
        score -= 10
      }

      if (issues.length === 0) {
        suggestions.push("内容质量良好，建议发布前再次确认数据准确性")
      }

      const qaResult: QaResult = {
        verdict,
        score: Math.max(0, score),
        issues,
        suggestions,
        checkedAt: new Date().toISOString(),
      }

      dispatch({ type: "SET_QA_RESULT", payload: { id: contentId, qaResult } })

      // Update status based on verdict
      if (verdict === "pass") {
        dispatch({ type: "SET_CONTENT_STATUS", payload: { id: contentId, status: "approved" } })
      } else {
        dispatch({ type: "SET_CONTENT_STATUS", payload: { id: contentId, status: "qa_fix" } })
      }

      return qaResult
    },
    [state.contents, state.settings, state.currentOrgId],
  )

  const generatePublishPack = useCallback(
    async (contentId: string): Promise<PublishPack> => {
      await sleep(800 + Math.random() * 400)
      const content = state.contents.find((c) => c.id === contentId)

      const publishPack: PublishPack = {
        titleCandidates: [
          content?.title || "标题候选1",
          `${content?.script?.hook?.slice(0, 20) || "标题候选2"}...`,
          `【必看】${content?.title || "标题候选3"}`,
        ],
        caption: content?.script?.hook || "这是一条精彩内容的描述文案",
        hashtags: [
          `#${content?.topicCluster || "内容"}`,
          "#干货分享",
          content?.platform === "douyin" ? "#抖音" : content?.platform === "xiaohongshu" ? "#小红书" : "#公众号",
          "#值得收藏",
        ],
        coverText: content?.title?.slice(0, 15) || "封面文案",
        pinnedComment: "觉得有用的话，记得点赞收藏哦～有问题评论区见！",
        abTestSuggestion: "建议测试：数字开头标题 vs 疑问句标题",
        generatedAt: new Date().toISOString(),
      }

      dispatch({ type: "SET_PUBLISH_PACK", payload: { id: contentId, publishPack } })
      return publishPack
    },
    [state.contents],
  )

  const generateScript = useCallback(
    async (contentId: string, style?: string): Promise<{ success: boolean; error?: string }> => {
      const content = state.contents.find((c) => c.id === contentId)
      if (!content) return { success: false, error: "内容不存在" }

      const persona = state.personas.find((p) => p.id === content.personaId)
      const evidences = state.evidences
        .filter((e) => content.evidenceIds.includes(e.id))
        .map((e) => ({ title: e.title, description: e.description }))

      try {
        // 调用真实的 DeepSeek API
        const response = await fetch("/api/ai/generate-script", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: content.title,
            platform: content.platform,
            topicCluster: content.topicCluster,
            format: content.format,
            style,
            evidences,
            personaName: persona?.name,
            personaBio: persona?.bio,
          }),
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          console.error("AI API Error:", data.error)
          // 如果 API 失败，使用 fallback mock 数据
          return await generateScriptFallback(contentId, style)
        }

        const updatedContent: Content = {
          ...content,
          script: {
            hook: data.script.hook,
            outline: data.script.outline,
            fullScript: data.script.fullScript,
            shootingNotes: data.script.shootingNotes,
          },
          updatedAt: new Date().toISOString(),
        }

        dispatch({ type: "UPDATE_CONTENT", payload: updatedContent })
        return { success: true }
      } catch (error) {
        console.error("Generate script error:", error)
        // 网络错误时使用 fallback
        return await generateScriptFallback(contentId, style)
      }
    },
    [state.contents, state.personas, state.evidences],
  )

  // Fallback: 当 API 不可用时使用本地 mock 生成
  const generateScriptFallback = useCallback(
    async (contentId: string, style?: string): Promise<{ success: boolean; error?: string }> => {
      await sleep(500)
      const content = state.contents.find((c) => c.id === contentId)
      if (!content) return { success: false, error: "内容不存在" }

      const stylePrefix =
        style === "shorter"
          ? "【精简版】"
          : style === "professional"
            ? "【专业版】"
            : style === "casual"
              ? "【口语版】"
              : ""

      const updatedContent: Content = {
        ...content,
        script: {
          hook: `${stylePrefix}${content.script?.hook || content.title}`,
          outline: ["开场引入", "核心观点", "案例说明", "总结行动"],
          fullScript: `${stylePrefix}大家好，今天来聊聊${content.title}。这个话题最近很多人关注...\n\n首先，我们来看第一个要点...\n\n其次...\n\n最后，总结一下今天的内容...`,
          shootingNotes: ["准备相关素材", "注意表情自然", "控制时长在3分钟内"],
        },
        updatedAt: new Date().toISOString(),
      }

      dispatch({ type: "UPDATE_CONTENT", payload: updatedContent })
      return { success: true, error: "AI 服务暂不可用，已使用本地模板" }
    },
    [state.contents],
  )

  // Computed values
  const currentOrg = useMemo(
    () => state.orgs.find((o) => o.id === state.currentOrgId),
    [state.orgs, state.currentOrgId],
  )

  const currentPersona = useMemo(
    () => state.personas.find((p) => p.id === state.currentIpId),
    [state.personas, state.currentIpId],
  )

  const currentOrgPersonas = useMemo(
    () => state.personas.filter((p) => p.orgId === state.currentOrgId),
    [state.personas, state.currentOrgId],
  )

  const currentEpoch = useMemo(
    () => state.epochs.find((e) => e.personaId === state.currentIpId && e.isCurrent),
    [state.epochs, state.currentIpId],
  )

  const currentSettings = useMemo(
    () => state.settings.find((s) => s.orgId === state.currentOrgId),
    [state.settings, state.currentOrgId],
  )

  const value: AppContextType = {
    state,
    dispatch,
    setCurrentOrg,
    setCurrentIp,
    login,
    logout,
    setContentStatus,
    updateContentMetrics,
    runQa,
    generatePublishPack,
    generateScript,
    currentOrg,
    currentPersona,
    currentOrgPersonas,
    currentEpoch,
    currentSettings,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// Hook
export function useAppStore() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useAppStore must be used within an AppProvider")
  }
  return context
}
