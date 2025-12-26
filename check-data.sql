-- 步骤1：查看数据库中有多少用户和他们的数据概况
SELECT
  COUNT(DISTINCT user_id) as 总用户数,
  COUNT(*) as 总记录数,
  MAX(updated_at) as 最后更新时间
FROM user_app_state;

-- 步骤2：查看每个用户有多少数据
SELECT
  user_id,
  jsonb_array_length(state->'orgs') as 组织数,
  jsonb_array_length(state->'personas') as IP数,
  jsonb_array_length(state->'contents') as 内容数,
  jsonb_array_length(state->'leads') as 线索数,
  updated_at as 最后更新
FROM user_app_state
ORDER BY updated_at DESC;

-- 步骤3：查看你的用户ID（换成你的邮箱登录后看到的ID）
-- 在浏览器F12控制台运行：console.log(await (await import('/lib/supabase-browser.js')).createSupabaseBrowserClient().auth.getUser())
-- 或者直接看浏览器localStorage中的'supabase-user-id'

-- 步骤4：查看某个用户的完整数据结构（把USER_ID换成实际的用户ID）
SELECT
  user_id,
  state,
  updated_at
FROM user_app_state
WHERE user_id = 'USER_ID'
ORDER BY updated_at DESC
LIMIT 1;

-- 步骤5：查看内容状态分布（了解有多少内容）
SELECT
  status,
  COUNT(*) as 数量
FROM (
  SELECT
    jsonb_array_elements(state->'contents')->>'status' as status
  FROM user_app_state
) as content_statuses
GROUP BY status
ORDER BY 数量 DESC;
