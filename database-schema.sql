-- 规范化数据库Schema设计
-- 从JSONB state迁移到独立表结构

-- ============================================================================
-- 1. 核心表结构
-- ============================================================================

-- 用户表 (扩展Supabase auth.users)
CREATE TABLE users (
  id TEXT PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  avatar TEXT,
  role TEXT CHECK (role IN ('admin', 'editor', 'viewer')) DEFAULT 'viewer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 组织表
CREATE TABLE orgs (
  id TEXT PRIMARY KEY DEFAULT 'org-' || gen_random_uuid()::text,
  name TEXT NOT NULL,
  industry TEXT,
  city TEXT,
  is_sensitive BOOLEAN DEFAULT FALSE,
  logo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 组织成员关系表 (多对多)
CREATE TABLE org_members (
  id TEXT PRIMARY KEY DEFAULT 'member-' || gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'editor', 'viewer')) DEFAULT 'viewer',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- IP表 (Personas)
CREATE TABLE personas (
  id TEXT PRIMARY KEY DEFAULT 'persona-' || gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar TEXT,
  bio TEXT,
  type TEXT CHECK (type IN ('founder', 'expert', 'brand', 'kol')),
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  current_epoch_id TEXT,
  -- 智能体相关字段
  business_stage TEXT CHECK (business_stage IN ('idea', 'running', 'expanding')),
  main_offer TEXT,
  avg_ticket_size INTEGER,
  target_customer_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 品牌书表 (BrandBook - JSONB存储复杂结构)
CREATE TABLE persona_brand_books (
  id TEXT PRIMARY KEY DEFAULT 'brandbook-' || gen_random_uuid()::text,
  persona_id TEXT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  tone TEXT,
  keywords TEXT[],
  avoid_words TEXT[],
  target_audience TEXT,
  value_proposition TEXT,
  communication_style TEXT,
  content_pillars TEXT[],
  visual_identity TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 产品服务表 (Offers)
CREATE TABLE persona_offers (
  id TEXT PRIMARY KEY DEFAULT 'offer-' || gen_random_uuid()::text,
  persona_id TEXT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  link TEXT,
  benefits TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 发展阶段表 (Epochs)
CREATE TABLE epochs (
  id TEXT PRIMARY KEY DEFAULT 'epoch-' || gen_random_uuid()::text,
  persona_id TEXT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  description TEXT,
  goals TEXT[],
  priority_topics TEXT[],
  platform_weights JSONB, -- {douyin: 0.4, xiaohongshu: 0.4, wechat: 0.2}
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 证据表 (Evidences)
CREATE TABLE evidences (
  id TEXT PRIMARY KEY DEFAULT 'evidence-' || gen_random_uuid()::text,
  persona_id TEXT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('case', 'testimonial', 'data', 'award', 'media', 'screenshot')),
  title TEXT NOT NULL,
  description TEXT,
  source TEXT,
  date DATE,
  tags TEXT[],
  scope TEXT CHECK (scope IN ('public', 'internal', 'confidential')) DEFAULT 'public',
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 社交账号表 (Accounts)
CREATE TABLE accounts (
  id TEXT PRIMARY KEY DEFAULT 'account-' || gen_random_uuid()::text,
  persona_id TEXT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  platform TEXT CHECK (platform IN ('douyin', 'xiaohongshu', 'wechat', 'weibo', 'bilibili')),
  account_id TEXT NOT NULL,
  account_name TEXT NOT NULL,
  followers INTEGER,
  is_verified BOOLEAN DEFAULT FALSE,
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 参考内容表 (References)
CREATE TABLE references (
  id TEXT PRIMARY KEY DEFAULT 'ref-' || gen_random_uuid()::text,
  persona_id TEXT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('article', 'video', 'post', 'document')),
  title TEXT NOT NULL,
  url TEXT,
  platform TEXT CHECK (platform IN ('douyin', 'xiaohongshu', 'wechat', 'weibo', 'bilibili')),
  content TEXT,
  summary TEXT,
  snapshot_url TEXT,
  tags TEXT[],
  source TEXT,
  is_inspiration BOOLEAN DEFAULT FALSE,
  collected_at TIMESTAMPTZ DEFAULT NOW(),
  -- 提取的结构化数据 (JSONB)
  extracted JSONB,
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 内容工单表 (Contents)
CREATE TABLE contents (
  id TEXT PRIMARY KEY DEFAULT 'content-' || gen_random_uuid()::text,
  persona_id TEXT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  account_id TEXT REFERENCES accounts(id),
  platform TEXT CHECK (platform IN ('douyin', 'xiaohongshu', 'wechat')),
  title TEXT NOT NULL,
  topic_cluster TEXT,
  format TEXT CHECK (format IN ('talking-head', 'vlog', 'tutorial', 'story', 'listicle', 'reaction')),
  epoch_id TEXT REFERENCES epochs(id),
  status TEXT CHECK (status IN ('idea', 'draft', 'writing', 'qa_pending', 'qa_fix', 'approved', 'scheduled', 'published', 'archived')) DEFAULT 'idea',
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  publish_url TEXT,
  week_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 内容脚本表 (Content Scripts)
CREATE TABLE content_scripts (
  id TEXT PRIMARY KEY DEFAULT 'script-' || gen_random_uuid()::text,
  content_id TEXT NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  hook TEXT,
  outline TEXT[],
  full_script TEXT,
  shooting_notes TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 内容QA结果表
CREATE TABLE content_qa_results (
  id TEXT PRIMARY KEY DEFAULT 'qa-' || gen_random_uuid()::text,
  content_id TEXT NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  verdict TEXT CHECK (verdict IN ('pass', 'fix', 'block')),
  score INTEGER CHECK (score >= 0 AND score <= 100),
  issues TEXT[],
  suggestions TEXT[],
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 内容发布包表
CREATE TABLE content_publish_packs (
  id TEXT PRIMARY KEY DEFAULT 'pack-' || gen_random_uuid()::text,
  content_id TEXT NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  title_candidates TEXT[],
  caption TEXT,
  hashtags TEXT[],
  cover_text TEXT,
  pinned_comment TEXT,
  ab_test_suggestion TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 内容指标表
CREATE TABLE content_metrics (
  id TEXT PRIMARY KEY DEFAULT 'metric-' || gen_random_uuid()::text,
  content_id TEXT NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  views INTEGER,
  likes INTEGER,
  comments INTEGER,
  shares INTEGER,
  saves INTEGER,
  inquiries INTEGER,
  appointments INTEGER,
  deals INTEGER,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 线索表 (Leads)
CREATE TABLE leads (
  id TEXT PRIMARY KEY DEFAULT 'lead-' || gen_random_uuid()::text,
  persona_id TEXT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact TEXT,
  platform TEXT,
  source TEXT CHECK (source IN ('comment', 'dm', 'form', 'referral', 'manual')),
  source_content_id TEXT REFERENCES contents(id),
  status TEXT CHECK (status IN ('new', 'contacted', 'qualified', 'appointment', 'won', 'lost')) DEFAULT 'new',
  lead_level TEXT CHECK (lead_level IN ('hot', 'warm', 'cold')) DEFAULT 'warm',
  need_tag TEXT,
  next_action TEXT,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 语音录入表 (Inbox Items)
CREATE TABLE inbox_items (
  id TEXT PRIMARY KEY DEFAULT 'inbox-' || gen_random_uuid()::text,
  persona_id TEXT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('voice', 'text')) DEFAULT 'voice',
  title TEXT NOT NULL,
  transcript TEXT,
  memo_summary TEXT,
  duration INTEGER, -- 秒
  audio_url TEXT,
  status TEXT CHECK (status IN ('pending', 'processed', 'archived')) DEFAULT 'pending',
  -- 提取的资产 (JSONB)
  extracted_assets JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 周报表 (Weekly Reports)
CREATE TABLE weekly_reports (
  id TEXT PRIMARY KEY DEFAULT 'report-' || gen_random_uuid()::text,
  persona_id TEXT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  epoch_id TEXT REFERENCES epochs(id),
  week_number TEXT NOT NULL,
  conclusions TEXT[],
  top3_content_ids TEXT[],
  funnel_issues TEXT[],
  next_week_suggestions JSONB, -- {boost: [], cut: [], addEvidence: []}
  draft_topics JSONB, -- 选题数组
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 设置表 (Settings)
CREATE TABLE org_settings (
  id TEXT PRIMARY KEY DEFAULT 'setting-' || gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  banned_words TEXT[],
  default_weekly_ratio JSONB, -- {douyin: 0.4, xiaohongshu: 0.4, wechat: 0.2}
  default_formats TEXT[],
  -- 智能体相关偏好
  preferred_content_tone TEXT CHECK (preferred_content_tone IN ('story', 'teaching', 'qna')),
  daily_content_capacity INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(org_id)
);

-- ============================================================================
-- 2. 索引设计
-- ============================================================================

-- 用户ID索引 (所有表都需要，用于RLS)
CREATE INDEX idx_users_id ON users(id);
CREATE INDEX idx_orgs_user_id ON orgs(user_id);
CREATE INDEX idx_org_members_user_id ON org_members(user_id);
CREATE INDEX idx_personas_user_id ON personas(user_id);
CREATE INDEX idx_persona_brand_books_user_id ON persona_brand_books(user_id);
CREATE INDEX idx_persona_offers_user_id ON persona_offers(user_id);
CREATE INDEX idx_epochs_user_id ON epochs(user_id);
CREATE INDEX idx_evidences_user_id ON evidences(user_id);
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_references_user_id ON references(user_id);
CREATE INDEX idx_contents_user_id ON contents(user_id);
CREATE INDEX idx_content_scripts_user_id ON content_scripts(user_id);
CREATE INDEX idx_content_qa_results_user_id ON content_qa_results(user_id);
CREATE INDEX idx_content_publish_packs_user_id ON content_publish_packs(user_id);
CREATE INDEX idx_content_metrics_user_id ON content_metrics(user_id);
CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_inbox_items_user_id ON inbox_items(user_id);
CREATE INDEX idx_weekly_reports_user_id ON weekly_reports(user_id);
CREATE INDEX idx_org_settings_user_id ON org_settings(user_id);

-- 外键索引
CREATE INDEX idx_org_members_org_id ON org_members(org_id);
CREATE INDEX idx_personas_org_id ON personas(org_id);
CREATE INDEX idx_persona_brand_books_persona_id ON persona_brand_books(persona_id);
CREATE INDEX idx_persona_offers_persona_id ON persona_offers(persona_id);
CREATE INDEX idx_epochs_persona_id ON epochs(persona_id);
CREATE INDEX idx_evidences_persona_id ON evidences(persona_id);
CREATE INDEX idx_accounts_persona_id ON accounts(persona_id);
CREATE INDEX idx_references_persona_id ON references(persona_id);
CREATE INDEX idx_contents_persona_id ON contents(persona_id);
CREATE INDEX idx_contents_account_id ON contents(account_id);
CREATE INDEX idx_contents_epoch_id ON contents(epoch_id);
CREATE INDEX idx_content_scripts_content_id ON content_scripts(content_id);
CREATE INDEX idx_content_qa_results_content_id ON content_qa_results(content_id);
CREATE INDEX idx_content_publish_packs_content_id ON content_publish_packs(content_id);
CREATE INDEX idx_content_metrics_content_id ON content_metrics(content_id);
CREATE INDEX idx_leads_persona_id ON leads(persona_id);
CREATE INDEX idx_leads_source_content_id ON leads(source_content_id);
CREATE INDEX idx_inbox_items_persona_id ON inbox_items(persona_id);
CREATE INDEX idx_weekly_reports_persona_id ON weekly_reports(persona_id);
CREATE INDEX idx_weekly_reports_epoch_id ON weekly_reports(epoch_id);
CREATE INDEX idx_org_settings_org_id ON org_settings(org_id);

-- 常用查询索引
CREATE INDEX idx_contents_status ON contents(status);
CREATE INDEX idx_contents_platform ON contents(platform);
CREATE INDEX idx_contents_created_at ON contents(created_at);
CREATE INDEX idx_contents_updated_at ON contents(updated_at);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_inbox_items_status ON inbox_items(status);
CREATE INDEX idx_references_type ON references(type);
CREATE INDEX idx_accounts_platform ON accounts(platform);

-- ============================================================================
-- 3. 行级安全策略 (RLS)
-- ============================================================================

-- 启用RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_brand_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE epochs ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidences ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE references ENABLE ROW LEVEL SECURITY;
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_qa_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_publish_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_settings ENABLE ROW LEVEL SECURITY;

-- RLS策略：用户只能访问自己的数据
CREATE POLICY "users_policy" ON users FOR ALL USING (auth.uid()::text = id);
CREATE POLICY "orgs_policy" ON orgs FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "org_members_policy" ON org_members FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "personas_policy" ON personas FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "persona_brand_books_policy" ON persona_brand_books FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "persona_offers_policy" ON persona_offers FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "epochs_policy" ON epochs FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "evidences_policy" ON evidences FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "accounts_policy" ON accounts FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "references_policy" ON references FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "contents_policy" ON contents FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "content_scripts_policy" ON content_scripts FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "content_qa_results_policy" ON content_qa_results FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "content_publish_packs_policy" ON content_publish_packs FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "content_metrics_policy" ON content_metrics FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "leads_policy" ON leads FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "inbox_items_policy" ON inbox_items FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "weekly_reports_policy" ON weekly_reports FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "org_settings_policy" ON org_settings FOR ALL USING (auth.uid()::text = user_id);

-- ============================================================================
-- 4. 迁移脚本 (从JSONB到规范化表)
-- ============================================================================

-- 创建迁移函数
CREATE OR REPLACE FUNCTION migrate_jsonb_to_tables()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  user_record RECORD;
  org_record RECORD;
  persona_record RECORD;
  epoch_record RECORD;
  evidence_record RECORD;
  account_record RECORD;
  reference_record RECORD;
  content_record RECORD;
  lead_record RECORD;
  inbox_record RECORD;
  report_record RECORD;
  setting_record RECORD;
BEGIN
  -- 遍历所有用户的state数据
  FOR user_record IN SELECT user_id, state FROM user_app_state LOOP
    -- 1. 迁移组织数据
    FOR org_record IN SELECT * FROM jsonb_array_elements(user_record.state->'orgs') LOOP
      INSERT INTO orgs (id, name, industry, city, is_sensitive, logo, created_at, user_id)
      VALUES (
        org_record.value->>'id',
        org_record.value->>'name',
        org_record.value->>'industry',
        org_record.value->>'city',
        (org_record.value->>'isSensitive')::boolean,
        org_record.value->>'logo',
        (org_record.value->>'createdAt')::timestamptz,
        user_record.user_id
      ) ON CONFLICT (id) DO NOTHING;
    END LOOP;

    -- 2. 迁移用户数据 (扩展auth.users)
    FOR org_record IN SELECT * FROM jsonb_array_elements(user_record.state->'users') LOOP
      INSERT INTO users (id, name, email, avatar, role)
      VALUES (
        org_record.value->>'id',
        org_record.value->>'name',
        org_record.value->>'email',
        org_record.value->>'avatar',
        org_record.value->>'role'
      ) ON CONFLICT (id) DO NOTHING;

      -- 建立组织成员关系
      FOR org_id IN SELECT * FROM jsonb_array_elements_text(org_record.value->'orgIds') LOOP
        INSERT INTO org_members (org_id, user_id, role)
        VALUES (org_id, org_record.value->>'id', org_record.value->>'role')
        ON CONFLICT (org_id, user_id) DO NOTHING;
      END LOOP;
    END LOOP;

    -- 3. 迁移IP数据
    FOR persona_record IN SELECT * FROM jsonb_array_elements(user_record.state->'personas') LOOP
      INSERT INTO personas (
        id, org_id, name, avatar, bio, type, status, current_epoch_id,
        business_stage, main_offer, avg_ticket_size, target_customer_description,
        created_at, updated_at, user_id
      ) VALUES (
        persona_record.value->>'id',
        persona_record.value->>'orgId',
        persona_record.value->>'name',
        persona_record.value->>'avatar',
        persona_record.value->>'bio',
        persona_record.value->>'type',
        persona_record.value->>'status',
        persona_record.value->>'currentEpochId',
        persona_record.value->>'businessStage',
        persona_record.value->>'mainOffer',
        (persona_record.value->>'avgTicketSize')::integer,
        persona_record.value->>'targetCustomerDescription',
        (persona_record.value->>'createdAt')::timestamptz,
        (persona_record.value->>'updatedAt')::timestamptz,
        user_record.user_id
      ) ON CONFLICT (id) DO NOTHING;

      -- 迁移品牌书
      IF persona_record.value ? 'brandBook' THEN
        INSERT INTO persona_brand_books (
          persona_id, tone, keywords, avoid_words, target_audience,
          value_proposition, communication_style, content_pillars, visual_identity, user_id
        ) VALUES (
          persona_record.value->>'id',
          persona_record.value->'brandBook'->>'tone',
          ARRAY(SELECT jsonb_array_elements_text(persona_record.value->'brandBook'->'keywords')),
          ARRAY(SELECT jsonb_array_elements_text(persona_record.value->'brandBook'->'avoidWords')),
          persona_record.value->'brandBook'->>'targetAudience',
          persona_record.value->'brandBook'->>'valueProposition',
          persona_record.value->'brandBook'->>'communicationStyle',
          ARRAY(SELECT jsonb_array_elements_text(persona_record.value->'brandBook'->'contentPillars')),
          persona_record.value->'brandBook'->>'visualIdentity',
          user_record.user_id
        );
      END IF;

      -- 迁移产品服务
      FOR offer_record IN SELECT * FROM jsonb_array_elements(persona_record.value->'offers') LOOP
        INSERT INTO persona_offers (persona_id, name, description, price, link, benefits, user_id)
        VALUES (
          persona_record.value->>'id',
          offer_record.value->>'name',
          offer_record.value->>'description',
          (offer_record.value->>'price')::decimal,
          offer_record.value->>'link',
          ARRAY(SELECT jsonb_array_elements_text(offer_record.value->'benefits')),
          user_record.user_id
        );
      END LOOP;
    END LOOP;

    -- 继续迁移其他实体...
    -- (这里可以继续添加epochs, evidences, accounts, contents等实体的迁移逻辑)

    RAISE NOTICE '迁移用户 % 的数据完成', user_record.user_id;
  END LOOP;

  RAISE NOTICE 'JSONB到规范化表迁移完成';
END;
$$;

-- ============================================================================
-- 5. 触发器：自动更新updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有表添加updated_at触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orgs_updated_at BEFORE UPDATE ON orgs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_personas_updated_at BEFORE UPDATE ON personas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_persona_brand_books_updated_at BEFORE UPDATE ON persona_brand_books FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_epochs_updated_at BEFORE UPDATE ON epochs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_evidences_updated_at BEFORE UPDATE ON evidences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_references_updated_at BEFORE UPDATE ON references FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contents_updated_at BEFORE UPDATE ON contents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_scripts_updated_at BEFORE UPDATE ON content_scripts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inbox_items_updated_at BEFORE UPDATE ON inbox_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_weekly_reports_updated_at BEFORE UPDATE ON weekly_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_org_settings_updated_at BEFORE UPDATE ON org_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. 视图：简化复杂查询
-- ============================================================================

-- 内容统计视图
CREATE VIEW content_stats AS
SELECT
  c.id,
  c.persona_id,
  c.platform,
  c.status,
  c.created_at,
  c.updated_at,
  cs.hook,
  cs.full_script,
  cm.views,
  cm.likes,
  cm.comments,
  cm.inquiries,
  cm.appointments,
  cm.deals,
  qr.verdict as qa_verdict,
  qr.score as qa_score
FROM contents c
LEFT JOIN content_scripts cs ON c.id = cs.content_id
LEFT JOIN content_metrics cm ON c.id = cm.content_id
LEFT JOIN content_qa_results qr ON c.id = qr.content_id;

-- IP仪表板视图
CREATE VIEW persona_dashboard AS
SELECT
  p.id,
  p.name,
  p.org_id,
  o.name as org_name,
  p.status,
  p.business_stage,
  COUNT(DISTINCT c.id) as total_contents,
  COUNT(DISTINCT CASE WHEN c.status = 'published' THEN c.id END) as published_contents,
  COUNT(DISTINCT l.id) as total_leads,
  COUNT(DISTINCT CASE WHEN l.status = 'won' THEN l.id END) as won_leads,
  COUNT(DISTINCT a.id) as total_accounts
FROM personas p
LEFT JOIN orgs o ON p.org_id = o.id
LEFT JOIN contents c ON p.id = c.persona_id
LEFT JOIN leads l ON p.id = l.persona_id
LEFT JOIN accounts a ON p.id = a.persona_id
GROUP BY p.id, p.name, p.org_id, o.name, p.status, p.business_stage;
