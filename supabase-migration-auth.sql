-- Supabase Auth 数据隔离迁移脚本
-- 请在 Supabase 控制台的 SQL Editor 中执行此脚本

-- 1. 删除旧的 RLS 策略
DROP POLICY IF EXISTS "Users can read own state" ON user_app_state;
DROP POLICY IF EXISTS "Users can insert own state" ON user_app_state;
DROP POLICY IF EXISTS "Users can update own state" ON user_app_state;
DROP POLICY IF EXISTS "Users can delete own state" ON user_app_state;
DROP POLICY IF EXISTS "Allow all" ON user_app_state;

-- 2. 修改 user_id 字段类型为 UUID（如果之前有数据需要先清空或迁移）
-- 如果表中已有旧数据，先清空（开发阶段可以这样做）
TRUNCATE TABLE user_app_state;

-- 修改列类型
ALTER TABLE user_app_state 
  ALTER COLUMN user_id TYPE UUID USING user_id::UUID;

-- 3. 创建基于 Supabase Auth 的 RLS 策略
-- 用户只能访问自己的数据，通过 auth.uid() 验证

-- 查询策略：只能查询自己的数据
CREATE POLICY "Users can read own state" ON user_app_state
  FOR SELECT 
  TO authenticated
  USING (user_id = auth.uid());

-- 插入策略：只能插入自己的数据
CREATE POLICY "Users can insert own state" ON user_app_state
  FOR INSERT 
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 更新策略：只能更新自己的数据
CREATE POLICY "Users can update own state" ON user_app_state
  FOR UPDATE 
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 删除策略：只能删除自己的数据
CREATE POLICY "Users can delete own state" ON user_app_state
  FOR DELETE 
  TO authenticated
  USING (user_id = auth.uid());

-- 4. 确认 RLS 已启用
ALTER TABLE user_app_state ENABLE ROW LEVEL SECURITY;

-- 完成！现在每个用户只能访问自己的数据

