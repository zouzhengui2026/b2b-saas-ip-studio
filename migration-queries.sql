-- ============================================================================
-- 数据迁移准备查询
-- ============================================================================

-- 1. 查看当前用户状态表概况
SELECT
  user_id,
  COUNT(*) as record_count,
  MAX(updated_at) as last_updated,
  jsonb_object_keys(state) as top_level_keys
FROM user_app_state
GROUP BY user_id, jsonb_object_keys(state)
ORDER BY user_id, last_updated DESC;

-- 2. 查看某个用户的完整state结构（调试用）
-- 替换 YOUR_USER_ID 为实际的用户ID
SELECT
  user_id,
  state,
  updated_at
FROM user_app_state
WHERE user_id = 'YOUR_USER_ID'
ORDER BY updated_at DESC
LIMIT 1;

-- 3. 统计各实体的数量分布
SELECT
  user_id,
  jsonb_array_length(state->'orgs') as org_count,
  jsonb_array_length(state->'personas') as persona_count,
  jsonb_array_length(state->'contents') as content_count,
  jsonb_array_length(state->'leads') as lead_count,
  jsonb_array_length(state->'references') as reference_count,
  jsonb_array_length(state->'evidences') as evidence_count,
  jsonb_array_length(state->'accounts') as account_count,
  jsonb_array_length(state->'inboxItems') as inbox_count,
  updated_at
FROM user_app_state
ORDER BY updated_at DESC;

-- 4. 导出组织数据样本
SELECT
  user_id,
  jsonb_array_elements(state->'orgs') as org_data
FROM user_app_state
WHERE user_id = 'YOUR_USER_ID'
ORDER BY updated_at DESC
LIMIT 1;

-- 5. 导出IP数据样本
SELECT
  user_id,
  jsonb_array_elements(state->'personas') as persona_data
FROM user_app_state
WHERE user_id = 'YOUR_USER_ID'
ORDER BY updated_at DESC
LIMIT 1;

-- 6. 导出内容数据样本
SELECT
  user_id,
  jsonb_array_elements(state->'contents') as content_data
FROM user_app_state
WHERE user_id = 'YOUR_USER_ID'
ORDER BY updated_at DESC
LIMIT 1;

-- 7. 查看内容状态分布
SELECT
  user_id,
  content_data.value->>'status' as status,
  COUNT(*) as count
FROM user_app_state,
LATERAL jsonb_array_elements(state->'contents') as content_data
WHERE user_id = 'YOUR_USER_ID'
GROUP BY user_id, content_data.value->>'status'
ORDER BY status;

-- 8. 查看线索状态分布
SELECT
  user_id,
  lead_data.value->>'status' as status,
  COUNT(*) as count
FROM user_app_state,
LATERAL jsonb_array_elements(state->'leads') as lead_data
WHERE user_id = 'YOUR_USER_ID'
GROUP BY user_id, lead_data.value->>'status'
ORDER BY status;

-- 9. 验证数据完整性 - 检查是否有缺失的关联ID
-- 检查内容是否都有有效的persona_id
SELECT
  user_id,
  'content_without_persona' as issue,
  content_data.value->>'id' as content_id,
  content_data.value->>'personaId' as persona_id
FROM user_app_state,
LATERAL jsonb_array_elements(state->'contents') as content_data
WHERE user_id = 'YOUR_USER_ID'
  AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(state->'personas') as p
    WHERE p.value->>'id' = content_data.value->>'personaId'
  );

-- 10. 生成数据迁移报告
SELECT
  'Migration Readiness Report' as report_title,
  COUNT(DISTINCT user_id) as total_users,
  COUNT(*) as total_records,
  SUM(jsonb_array_length(state->'orgs')) as total_orgs,
  SUM(jsonb_array_length(state->'personas')) as total_personas,
  SUM(jsonb_array_length(state->'contents')) as total_contents,
  SUM(jsonb_array_length(state->'leads')) as total_leads,
  MAX(updated_at) as latest_update
FROM user_app_state;

-- 11. 备份当前数据（以防迁移失败）
-- 在运行迁移前，建议先创建备份
CREATE TABLE user_app_state_backup AS
SELECT * FROM user_app_state;

-- 验证备份
SELECT COUNT(*) as backup_record_count FROM user_app_state_backup;
