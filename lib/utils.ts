import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 生成内容ID
export function mockGenerateContentId(platform: "douyin" | "xiaohongshu" | "wechat"): string {
  const weekStr = getCurrentWeekNumber()
  const random = Math.floor(Math.random() * 900) + 100

  const prefixMap = {
    douyin: "DY",
    xiaohongshu: "XHS",
    wechat: "WX",
  }

  return `${prefixMap[platform]}-${weekStr}-${random}`
}

// 获取当前周数字符串
export function getCurrentWeekNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const week = getWeekNumber(now)
  return `${year}W${week.toString().padStart(2, "0")}`
}

// 获取周数
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

// 异步等待
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// 格式化日期
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

// 格式化日期时间
export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// 平台名称映射
export const platformNames: Record<string, string> = {
  douyin: "抖音",
  xiaohongshu: "小红书",
  wechat: "视频号",
  weibo: "微博",
  bilibili: "B站",
}

// 平台图标颜色
export const platformColors: Record<string, string> = {
  douyin: "bg-black text-white",
  xiaohongshu: "bg-red-500 text-white",
  wechat: "bg-green-500 text-white",
  weibo: "bg-orange-500 text-white",
  bilibili: "bg-pink-500 text-white",
}

// 内容状态名称映射
export const contentStatusNames: Record<string, string> = {
  idea: "创意",
  draft: "草稿",
  writing: "撰写中",
  qa_pending: "待审核",
  qa_fix: "待修复",
  approved: "已通过",
  scheduled: "已排期",
  published: "已发布",
  archived: "已归档",
}

// 内容状态颜色
export const contentStatusColors: Record<string, string> = {
  idea: "bg-gray-100 text-gray-800",
  draft: "bg-yellow-100 text-yellow-800",
  writing: "bg-blue-100 text-blue-800",
  qa_pending: "bg-orange-100 text-orange-800",
  qa_fix: "bg-red-100 text-red-800",
  approved: "bg-green-100 text-green-800",
  scheduled: "bg-purple-100 text-purple-800",
  published: "bg-emerald-100 text-emerald-800",
  archived: "bg-gray-100 text-gray-600",
}

// 线索状态名称映射
export const leadStatusNames: Record<string, string> = {
  new: "新线索",
  contacted: "已联系",
  qualified: "已验证",
  appointment: "已预约",
  won: "已成交",
  lost: "已流失",
}

// 线索状态颜色
export const leadStatusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  qualified: "bg-green-100 text-green-800",
  appointment: "bg-purple-100 text-purple-800",
  won: "bg-emerald-100 text-emerald-800",
  lost: "bg-gray-100 text-gray-600",
}

// 线索级别名称
export const leadLevelNames: Record<string, string> = {
  hot: "高意向",
  warm: "中意向",
  cold: "低意向",
}

// 线索级别颜色
export const leadLevelColors: Record<string, string> = {
  hot: "bg-red-100 text-red-800",
  warm: "bg-orange-100 text-orange-800",
  cold: "bg-blue-100 text-blue-800",
}

// 内容格式名称
export const formatNames: Record<string, string> = {
  "talking-head": "口播",
  vlog: "Vlog",
  tutorial: "教程",
  story: "故事",
  listicle: "清单",
  reaction: "反应",
}

// 证据类型名称
export const evidenceTypeNames: Record<string, string> = {
  case: "案例",
  testimonial: "见证",
  data: "数据",
  award: "荣誉",
  media: "媒体",
  screenshot: "截图",
}

// IP类型名称
export const personaTypeNames: Record<string, string> = {
  founder: "创始人",
  expert: "专家",
  brand: "品牌",
  kol: "KOL",
}

// 复制到剪贴板
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
