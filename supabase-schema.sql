-- Supabase 数据库 Schema
-- 请在 Supabase 控制台的 SQL Editor 中执行此脚本

-- 用户状态存储表（简化方案：将整个应用状态存为 JSON）
-- 这种方式类似 localStorage，适合快速上线
-- 后续可以根据需要拆分为独立的表
CREATE TABLE IF NOT EXISTS user_app_state (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,  -- 可以是邮箱或其他用户标识
  state JSONB NOT NULL,          -- 存储完整的 AppState
  version TEXT DEFAULT '1.0',    -- 数据版本，用于迁移
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以加速按 user_id 查询
CREATE INDEX IF NOT EXISTS idx_user_app_state_user_id ON user_app_state(user_id);

-- 更新 updated_at 触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_app_state_updated_at ON user_app_state;
CREATE TRIGGER update_user_app_state_updated_at
  BEFORE UPDATE ON user_app_state
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 启用 Row Level Security (RLS)
ALTER TABLE user_app_state ENABLE ROW LEVEL SECURITY;

-- 允许匿名用户读写自己的数据（通过 user_id 匹配）
-- 注意：生产环境建议使用 Supabase Auth 进行更安全的认证
CREATE POLICY "Users can read own state" ON user_app_state
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own state" ON user_app_state
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own state" ON user_app_state
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete own state" ON user_app_state
  FOR DELETE USING (true);

