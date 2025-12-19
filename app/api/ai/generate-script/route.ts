import { NextRequest, NextResponse } from "next/server"

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"

interface GenerateScriptRequest {
  title: string
  platform: string
  topicCluster?: string
  format?: string
  style?: string
  evidences?: { title: string; description: string }[]
  personaName?: string
  personaBio?: string
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY

    if (!apiKey || apiKey === "your_api_key_here") {
      return NextResponse.json(
        { error: "DeepSeek API Key 未配置，请在 .env.local 中设置 DEEPSEEK_API_KEY" },
        { status: 500 }
      )
    }

    const body: GenerateScriptRequest = await request.json()
    const { title, platform, topicCluster, format, style, evidences, personaName, personaBio } = body

    // 构建平台特定的提示
    const platformGuides: Record<string, string> = {
      douyin: "抖音短视频：开头3秒必须有强hook抓注意力，节奏快，口语化，1-3分钟为宜",
      xiaohongshu: "小红书笔记：标题要有数字和emoji，内容要真诚分享感，适当使用口语和网络用语",
      wechat: "公众号文章：结构清晰，深度内容，可以适当长一些，注重价值传递"
    }

    const styleGuides: Record<string, string> = {
      shorter: "精简版：控制在1分钟以内，只保留核心观点",
      professional: "专业版：使用专业术语，数据支撑，适合B端客户",
      casual: "口语版：像朋友聊天一样，轻松自然，多用口语表达"
    }

    const formatGuides: Record<string, string> = {
      "talking-head": "真人出镜口播形式",
      vlog: "日常记录式vlog形式",
      tutorial: "教程讲解形式，步骤清晰",
      story: "故事叙述形式，有起承转合",
      listicle: "清单式内容，条目分明",
      reaction: "反应/点评形式"
    }

    // 构建证据描述
    const evidenceText = evidences && evidences.length > 0
      ? `\n\n可引用的证据素材：\n${evidences.map((e, i) => `${i + 1}. ${e.title}: ${e.description}`).join("\n")}`
      : ""

    // 构建人设描述
    const personaText = personaName
      ? `\n创作者人设：${personaName}${personaBio ? `，${personaBio}` : ""}`
      : ""

    const systemPrompt = `你是一个专业的短视频/自媒体内容创作助手。你需要根据用户提供的主题和要求，生成高质量的脚本内容。

输出格式要求（JSON）：
{
  "hook": "开头金句/钩子，用于吸引观众注意力（15-30字）",
  "outline": ["大纲要点1", "大纲要点2", "大纲要点3", "大纲要点4"],
  "fullScript": "完整脚本内容，包含口播词",
  "shootingNotes": ["拍摄提示1", "拍摄提示2", "拍摄提示3"]
}

只输出JSON，不要有其他内容。`

    const userPrompt = `请为以下内容生成脚本：

标题：${title}
平台：${platformGuides[platform] || platform}
${topicCluster ? `主题方向：${topicCluster}` : ""}
${format ? `内容形式：${formatGuides[format] || format}` : ""}
${style ? `风格要求：${styleGuides[style] || style}` : ""}
${personaText}
${evidenceText}

请生成一个专业、有吸引力的脚本。`

    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("DeepSeek API Error:", error)
      return NextResponse.json(
        { error: `DeepSeek API 调用失败: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { error: "AI 未返回有效内容" },
        { status: 500 }
      )
    }

    // 解析 JSON 响应
    try {
      const script = JSON.parse(content)
      return NextResponse.json({
        success: true,
        script: {
          hook: script.hook || "",
          outline: script.outline || [],
          fullScript: script.fullScript || "",
          shootingNotes: script.shootingNotes || [],
        },
      })
    } catch (parseError) {
      console.error("Failed to parse AI response:", content)
      return NextResponse.json(
        { error: "AI 响应解析失败" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Generate script error:", error)
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    )
  }
}

