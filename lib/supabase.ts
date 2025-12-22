import { createClient, SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// 验证 URL 格式是否正确
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

// 检查配置是否有效
const isConfigValid = isValidUrl(supabaseUrl) && supabaseAnonKey.length > 10

if (!isConfigValid) {
  console.warn("⚠️ Supabase 环境变量未配置或格式不正确，将使用 localStorage 作为后备存储")
  if (supabaseUrl && !isValidUrl(supabaseUrl)) {
    console.warn(`   URL 格式错误: "${supabaseUrl}"，应为 https://xxx.supabase.co 格式`)
  }
}

// 只有配置有效时才创建客户端
let supabase: SupabaseClient | null = null

if (isConfigValid) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
    console.log("✅ Supabase 客户端已初始化")
  } catch (error) {
    console.error("❌ Supabase 客户端创建失败:", error)
    supabase = null
  }
}

export { supabase }

export const isSupabaseConfigured = () => {
  return !!supabase
}

