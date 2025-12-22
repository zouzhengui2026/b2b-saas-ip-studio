// 基础类型定义

export interface Org {
  id: string
  name: string
  industry?: string
  city?: string
  isSensitive?: boolean
  logo?: string
  createdAt: string
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  orgIds: string[]
  role: "admin" | "editor" | "viewer"
}

export interface Persona {
  id: string
  orgId: string
  name: string
  avatar?: string
  bio: string
  type: "founder" | "expert" | "brand" | "kol"
  status: "active" | "inactive"
  brandBook?: BrandBook
  offers: Offer[]
  currentEpochId?: string
  // 智能体相关：业务与账号定位（仅前端使用）
  businessStage?: "idea" | "running" | "expanding"
  mainOffer?: string
  avgTicketSize?: number
  targetCustomerDescription?: string
  createdAt: string
  updatedAt: string
}

export interface BrandBook {
  tone: string
  keywords: string[]
  avoidWords: string[]
  targetAudience: string
  valueProposition: string
  communicationStyle?: string
  contentPillars?: string[]
  visualIdentity?: string
}

export interface Offer {
  id: string
  name: string
  description: string
  price?: number
  link?: string
  benefits?: string[]
}

export interface Evidence {
  id: string
  personaId: string
  type: "case" | "testimonial" | "data" | "award" | "media" | "screenshot"
  title: string
  description: string
  source?: string
  date?: string
  tags: string[]
  scope: "public" | "internal" | "confidential"
  fileUrl?: string
  createdAt: string
}

export interface Epoch {
  id: string
  personaId: string
  name: string
  startDate: string
  endDate?: string
  description: string
  goals: string[]
  priorityTopics: string[]
  platformWeights: {
    douyin: number
    xiaohongshu: number
    wechat: number
  }
  isCurrent: boolean
  createdAt: string
}

export interface Account {
  id: string
  personaId: string
  platform: "douyin" | "xiaohongshu" | "wechat" | "weibo" | "bilibili"
  accountId: string
  accountName: string
  followers?: number
  isVerified: boolean
  status: "active" | "inactive"
  createdAt: string
}

export interface ReferenceExtracted {
  hook?: string
  structure?: string
  cta?: string
  format?: string
  highlights?: string[]
  risks?: string[]
}

export interface Reference {
  id: string
  personaId: string
  type: "article" | "video" | "post" | "document"
  title: string
  url?: string
  platform?: "douyin" | "xiaohongshu" | "wechat" | "weibo" | "bilibili"
  content?: string
  summary?: string
  snapshotUrl?: string
  tags: string[]
  source: string
  extracted?: ReferenceExtracted
  isInspiration?: boolean
  collectedAt: string
}

export type ContentStatus =
  | "idea"
  | "draft"
  | "writing"
  | "qa_pending"
  | "qa_fix"
  | "approved"
  | "scheduled"
  | "published"
  | "archived"

export type QaVerdict = "pass" | "fix" | "block"

export interface ContentMetrics {
  views?: number
  likes?: number
  comments?: number
  shares?: number
  saves?: number
  inquiries?: number
  appointments?: number
  deals?: number
  notes?: string
  updatedAt?: string
}

export interface ContentScript {
  hook?: string
  outline?: string[]
  fullScript?: string
  shootingNotes?: string[]
}

export interface PublishPack {
  titleCandidates: string[]
  caption: string
  hashtags: string[]
  coverText?: string
  pinnedComment?: string
  abTestSuggestion?: string
  generatedAt: string
}

export interface QaResult {
  verdict: QaVerdict
  score: number
  issues: string[]
  suggestions: string[]
  checkedAt: string
}

export interface Content {
  id: string
  personaId: string
  accountId?: string
  platform: "douyin" | "xiaohongshu" | "wechat"
  title: string
  topicCluster?: string
  format?: "talking-head" | "vlog" | "tutorial" | "story" | "listicle" | "reaction"
  epochId?: string
  script?: ContentScript
  evidenceIds: string[]
  referenceIds: string[]
  status: ContentStatus
  qaResult?: QaResult
  publishPack?: PublishPack
  scheduledAt?: string
  publishedAt?: string
  publishUrl?: string
  metrics?: ContentMetrics
  weekNumber: string
  createdAt: string
  updatedAt: string
}

export type LeadStatus = "new" | "contacted" | "qualified" | "appointment" | "won" | "lost"
export type LeadSource = "comment" | "dm" | "form" | "referral" | "manual"
export type LeadLevel = "hot" | "warm" | "cold"

export interface Lead {
  id: string
  personaId: string
  name: string
  contact?: string
  platform?: string
  source: LeadSource
  sourceContentId?: string
  status: LeadStatus
  leadLevel: LeadLevel
  needTag?: string
  nextAction?: string
  notes?: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface InboxExtractedAssets {
  topicSeeds?: string[]
  evidenceClues?: string[]
  objections?: string[]
  strategySignals?: string[]
}

export interface InboxItem {
  id: string
  personaId: string
  type: "voice" | "text"
  title: string
  transcript?: string
  memoSummary?: string
  duration?: number
  audioUrl?: string
  status: "pending" | "processed" | "archived"
  extractedAssets?: InboxExtractedAssets
  createdAt: string
}

export interface WeeklyReport {
  id: string
  personaId: string
  epochId?: string
  weekNumber: string
  conclusions: string[]
  top3ContentIds: string[]
  funnelIssues: string[]
  nextWeekSuggestions: {
    boost: string[]
    cut: string[]
    addEvidence: string[]
  }
  draftTopics: {
    platform: "douyin" | "xiaohongshu" | "wechat"
    title: string
    hook: string
    topicCluster: string
    format: string
  }[]
  generatedAt: string
}

export interface TeamMember {
  id: string
  orgId: string
  name: string
  email: string
  role: "admin" | "editor" | "viewer"
  invitedAt: string
  status: "active" | "pending"
}

export interface Settings {
  orgId: string
  bannedWords: string[]
  defaultWeeklyRatio: { douyin: number; xiaohongshu: number; wechat: number }
  defaultFormats: string[]
  // 智能体相关偏好（仅前端使用）
  preferredContentTone?: "story" | "teaching" | "qna"
  dailyContentCapacity?: number
}

// App State 类型
export interface AppState {
  currentOrgId: string | null
  currentIpId: string | null
  isAuthenticated: boolean
  currentUser: User | null
  orgs: Org[]
  users: User[]
  personas: Persona[]
  epochs: Epoch[]
  evidences: Evidence[]
  accounts: Account[]
  references: Reference[]
  contents: Content[]
  leads: Lead[]
  inboxItems: InboxItem[]
  weeklyReports: WeeklyReport[]
  teamMembers: TeamMember[]
  settings: Settings[]
  weeklyDraftSources: string[]
  // 智能体阶段（仅前端使用）
  assistantStage?: "not_started" | "diagnosed" | "week1" | "week2"
}

export type AppAction =
  | { type: "SET_CURRENT_ORG"; payload: string }
  | { type: "SET_CURRENT_IP"; payload: string }
  | { type: "LOGIN"; payload: User }
  | { type: "LOGOUT" }
  // Org CRUD
  | { type: "ADD_ORG"; payload: Org }
  | { type: "UPDATE_ORG"; payload: Org }
  // Persona CRUD
  | { type: "ADD_PERSONA"; payload: Persona }
  | { type: "UPDATE_PERSONA"; payload: Persona }
  | { type: "DELETE_PERSONA"; payload: string }
  // Epoch CRUD
  | { type: "ADD_EPOCH"; payload: Epoch }
  | { type: "UPDATE_EPOCH"; payload: Epoch }
  | { type: "SET_CURRENT_EPOCH"; payload: { personaId: string; epochId: string } }
  // Evidence CRUD
  | { type: "ADD_EVIDENCE"; payload: Evidence }
  | { type: "UPDATE_EVIDENCE"; payload: Evidence }
  | { type: "DELETE_EVIDENCE"; payload: string }
  // Account CRUD
  | { type: "ADD_ACCOUNT"; payload: Account }
  | { type: "UPDATE_ACCOUNT"; payload: Account }
  | { type: "DELETE_ACCOUNT"; payload: string }
  // Reference CRUD
  | { type: "ADD_REFERENCE"; payload: Reference }
  | { type: "UPDATE_REFERENCE"; payload: Reference }
  | { type: "DELETE_REFERENCE"; payload: string }
  // Content CRUD
  | { type: "ADD_CONTENT"; payload: Content }
  | { type: "UPDATE_CONTENT"; payload: Content }
  | { type: "DELETE_CONTENT"; payload: string }
  | { type: "SET_CONTENT_STATUS"; payload: { id: string; status: ContentStatus } }
  | { type: "UPDATE_CONTENT_METRICS"; payload: { id: string; metrics: ContentMetrics } }
  | { type: "SET_QA_RESULT"; payload: { id: string; qaResult: QaResult } }
  | { type: "SET_PUBLISH_PACK"; payload: { id: string; publishPack: PublishPack } }
  | { type: "ADD_CONTENTS_BATCH"; payload: Content[] }
  // Lead CRUD
  | { type: "ADD_LEAD"; payload: Lead }
  | { type: "UPDATE_LEAD"; payload: Lead }
  | { type: "DELETE_LEAD"; payload: string }
  // Inbox CRUD
  | { type: "ADD_INBOX"; payload: InboxItem }
  | { type: "UPDATE_INBOX"; payload: InboxItem }
  | { type: "DELETE_INBOX"; payload: string }
  // Weekly Report
  | { type: "ADD_WEEKLY_REPORT"; payload: WeeklyReport }
  // Team Members
  | { type: "ADD_TEAM_MEMBER"; payload: TeamMember }
  | { type: "UPDATE_TEAM_MEMBER"; payload: TeamMember }
  | { type: "DELETE_TEAM_MEMBER"; payload: string }
  // Settings
  | { type: "UPDATE_SETTINGS"; payload: Settings }
  | { type: "ADD_BANNED_WORD"; payload: { orgId: string; word: string } }
  | { type: "REMOVE_BANNED_WORD"; payload: { orgId: string; word: string } }
  // Draft Sources
  | { type: "ADD_DRAFT_SOURCE"; payload: string }
  | { type: "CLEAR_DRAFT_SOURCES" }
  // Assistant
  | { type: "SET_ASSISTANT_STAGE"; payload: AppState["assistantStage"] }
  // Hydration (从存储恢复状态)
  | { type: "HYDRATE_STATE"; payload: AppState }
