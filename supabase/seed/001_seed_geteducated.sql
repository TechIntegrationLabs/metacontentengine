-- Seed File: GetEducated Initial Tenant Data
-- Version: 1.0
-- Description: Creates the GetEducated tenant with initial configuration
--
-- Run this after migrations are applied:
-- Option 1: Include in push: supabase db push --include-seed
-- Option 2: Run manually in SQL Editor

-- ============================================
-- CREATE GETEDUCATED TENANT
-- ============================================

-- Use a deterministic UUID for easy reference (you can change this)
-- This UUID will be referenced throughout the seed
DO $$
DECLARE
  v_tenant_id UUID := 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
BEGIN

  -- Insert tenant
  INSERT INTO tenants (
    id,
    name,
    slug,
    app_name,
    primary_color,
    secondary_color,
    accent_color,
    primary_domain,
    plan,
    status,
    features
  ) VALUES (
    v_tenant_id,
    'GetEducated',
    'geteducated',
    'Perdia',
    '#3B82F6',  -- Blue
    '#6366F1',  -- Indigo
    '#F97316',  -- Orange
    'geteducated.com',
    'pro',
    'active',
    '{
      "maxContributors": 10,
      "maxArticlesPerMonth": 500,
      "aiGenerationEnabled": true,
      "advancedAnalytics": true,
      "customDomains": true,
      "apiAccess": true
    }'::jsonb
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    app_name = EXCLUDED.app_name,
    features = EXCLUDED.features;

  RAISE NOTICE 'Tenant created/updated: GetEducated (%)' , v_tenant_id;

END $$;

-- ============================================
-- CREATE CONTRIBUTORS
-- ============================================

-- Reference the tenant ID
DO $$
DECLARE
  v_tenant_id UUID := 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
BEGIN

  -- Contributor 1: Tony Huffman (Rankings Expert)
  INSERT INTO contributors (
    tenant_id,
    name,
    display_name,
    style_proxy,
    style_proxy_description,
    voice_profile,
    expertise_areas,
    content_types,
    is_active,
    is_default
  ) VALUES (
    v_tenant_id,
    'Tony Huffman',
    'Tony Huffman',
    'Kif Richmann',
    'Data-driven researcher known for evidence-based analysis and transparent methodology',
    '{
      "formalityScale": 6,
      "description": "Tony writes with authority and precision. His style is data-driven and analytical, backing claims with statistics and research. He uses a professional but accessible tone, avoiding jargon while maintaining expertise.",
      "guidelines": "Lead with data when possible. Use specific numbers and statistics. Maintain objectivity while being helpful. Structure content logically with clear hierarchies.",
      "signaturePhrases": ["research indicates", "data shows", "based on our analysis", "according to"],
      "transitionWords": ["furthermore", "additionally", "notably", "importantly"],
      "phrasesToAvoid": ["in conclusion", "it is important to note", "needless to say"],
      "topicsToAvoid": ["political opinions", "controversial takes"]
    }'::jsonb,
    ARRAY['rankings', 'data analysis', 'affordability', 'ROI', 'salary outcomes'],
    ARRAY['ranking', 'listicle', 'data-driven guide'],
    true,
    true
  )
  ON CONFLICT DO NOTHING;

  -- Contributor 2: Kayleigh Gilbert (Career Counselor)
  INSERT INTO contributors (
    tenant_id,
    name,
    display_name,
    style_proxy,
    style_proxy_description,
    voice_profile,
    expertise_areas,
    content_types,
    is_active
  ) VALUES (
    v_tenant_id,
    'Kayleigh Gilbert',
    'Kayleigh Gilbert',
    'Alicia Montez',
    'Empathetic career counselor with focus on practical guidance and student success',
    '{
      "formalityScale": 4,
      "description": "Kayleigh writes with warmth and encouragement. Her style is conversational yet informative, focusing on practical advice and real-world outcomes. She connects emotionally with readers while providing actionable guidance.",
      "guidelines": "Be encouraging and supportive. Use second-person (you) frequently. Include practical tips and action items. Share relatable examples.",
      "signaturePhrases": ["you can", "here is how", "the good news is", "consider"],
      "transitionWords": ["so", "now", "next", "also"],
      "phrasesToAvoid": ["obviously", "simply", "just"],
      "topicsToAvoid": []
    }'::jsonb,
    ARRAY['career guidance', 'degree programs', 'professional development', 'student success'],
    ARRAY['guide', 'how-to', 'career profile'],
    true
  )
  ON CONFLICT DO NOTHING;

  -- Contributor 3: Sara (Admissions Expert)
  INSERT INTO contributors (
    tenant_id,
    name,
    display_name,
    style_proxy,
    style_proxy_description,
    voice_profile,
    expertise_areas,
    content_types,
    is_active
  ) VALUES (
    v_tenant_id,
    'Sara',
    'Sara',
    'Danny Rodriguez',
    'Former admissions counselor with insider knowledge of the college application process',
    '{
      "formalityScale": 5,
      "description": "Sara writes with insider expertise and practical knowledge. Her style balances authority with approachability, offering specific advice that readers can immediately apply.",
      "guidelines": "Share insider tips when relevant. Be specific about requirements and processes. Address common misconceptions. Provide clear action steps.",
      "signaturePhrases": ["from my experience", "one thing many students overlook", "the key is", "here is what you need to know"],
      "transitionWords": ["first", "then", "meanwhile", "however"],
      "phrasesToAvoid": ["basically", "obviously"],
      "topicsToAvoid": []
    }'::jsonb,
    ARRAY['admissions', 'application process', 'requirements', 'accreditation'],
    ARRAY['guide', 'explainer', 'checklist'],
    true
  )
  ON CONFLICT DO NOTHING;

  -- Contributor 4: Charity (Financial Aid Expert)
  INSERT INTO contributors (
    tenant_id,
    name,
    display_name,
    style_proxy,
    style_proxy_description,
    voice_profile,
    expertise_areas,
    content_types,
    is_active
  ) VALUES (
    v_tenant_id,
    'Charity',
    'Charity',
    'Julia Tell',
    'Financial aid specialist focused on making education accessible and affordable',
    '{
      "formalityScale": 5,
      "description": "Charity writes with clarity and compassion about financial topics. She demystifies complex financial aid concepts and focuses on helping students find ways to afford their education.",
      "guidelines": "Explain financial concepts clearly. Use examples with real numbers when helpful. Be encouraging about financial aid opportunities. Include deadlines and requirements.",
      "signaturePhrases": ["the good news is", "many students do not realize", "you may qualify for", "do not overlook"],
      "transitionWords": ["additionally", "for example", "specifically", "importantly"],
      "phrasesToAvoid": ["obviously", "as you know"],
      "topicsToAvoid": []
    }'::jsonb,
    ARRAY['financial aid', 'scholarships', 'student loans', 'FAFSA', 'affordability'],
    ARRAY['guide', 'listicle', 'explainer'],
    true
  )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Contributors created for GetEducated';

END $$;

-- ============================================
-- CREATE DOMAIN RULES
-- ============================================

DO $$
DECLARE
  v_tenant_id UUID := 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
BEGIN

  -- Blocked domains (competitors)
  INSERT INTO tenant_domain_rules (tenant_id, domain, rule_type, reason) VALUES
    (v_tenant_id, 'onlineu.com', 'blocked', 'Competitor site'),
    (v_tenant_id, 'usnews.com', 'blocked', 'Competitor rankings'),
    (v_tenant_id, 'bestcolleges.com', 'blocked', 'Competitor site'),
    (v_tenant_id, 'niche.com', 'blocked', 'Competitor site'),
    (v_tenant_id, 'petersons.com', 'blocked', 'Competitor site'),
    (v_tenant_id, 'princetonreview.com', 'blocked', 'Competitor site'),
    (v_tenant_id, 'collegedata.com', 'blocked', 'Competitor site'),
    (v_tenant_id, 'collegesimply.com', 'blocked', 'Competitor site'),
    (v_tenant_id, 'collegefactual.com', 'blocked', 'Competitor site'),
    (v_tenant_id, 'forbes.com', 'blocked', 'Competitor rankings'),
    (v_tenant_id, 'timeshighereducation.com', 'blocked', 'Competitor rankings'),
    (v_tenant_id, 'intelligent.com', 'blocked', 'Competitor site')
  ON CONFLICT DO NOTHING;

  -- Allowed domains (trusted sources)
  INSERT INTO tenant_domain_rules (tenant_id, domain, rule_type, reason) VALUES
    (v_tenant_id, 'bls.gov', 'allowed', 'Bureau of Labor Statistics - authoritative source'),
    (v_tenant_id, 'ed.gov', 'allowed', 'Department of Education - official source'),
    (v_tenant_id, 'studentaid.gov', 'allowed', 'Federal Student Aid - official source'),
    (v_tenant_id, 'nces.ed.gov', 'allowed', 'National Center for Education Statistics'),
    (v_tenant_id, 'chea.org', 'allowed', 'Council for Higher Education Accreditation'),
    (v_tenant_id, 'aacsb.edu', 'allowed', 'AACSB Accreditation'),
    (v_tenant_id, 'collegeboard.org', 'allowed', 'College Board - official source'),
    (v_tenant_id, 'ncaa.org', 'allowed', 'NCAA - official source'),
    (v_tenant_id, 'cacrep.org', 'allowed', 'Counseling accreditation'),
    (v_tenant_id, 'acenursing.org', 'allowed', 'Nursing accreditation')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Domain rules created for GetEducated';

END $$;

-- ============================================
-- CREATE CONTENT LEVELS (Degree Levels)
-- ============================================

DO $$
DECLARE
  v_tenant_id UUID := 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
BEGIN

  INSERT INTO tenant_content_levels (tenant_id, name, code, description, level_order) VALUES
    (v_tenant_id, 'Certificate', 'cert', 'Undergraduate certificate programs', 1),
    (v_tenant_id, 'Associate', 'assoc', 'Associate degree programs (2-year)', 2),
    (v_tenant_id, 'Bachelor''s', 'bach', 'Bachelor''s degree programs (4-year)', 3),
    (v_tenant_id, 'Post-Baccalaureate', 'post-bach', 'Post-baccalaureate certificates', 4),
    (v_tenant_id, 'Master''s', 'mast', 'Master''s degree programs', 5),
    (v_tenant_id, 'Post-Master''s', 'post-mast', 'Post-master''s certificates', 6),
    (v_tenant_id, 'Doctorate', 'doct', 'Doctoral degree programs (PhD, EdD, etc.)', 7),
    (v_tenant_id, 'Professional', 'prof', 'Professional degrees (JD, MD, etc.)', 8),
    (v_tenant_id, 'Graduate Certificate', 'grad-cert', 'Graduate-level certificates', 9),
    (v_tenant_id, 'Online', 'online', 'Online/distance learning programs', 10)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Content levels created for GetEducated';

END $$;

-- ============================================
-- CREATE BANNED PHRASES
-- ============================================

DO $$
DECLARE
  v_tenant_id UUID := 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
BEGIN

  INSERT INTO tenant_banned_phrases (tenant_id, phrase, phrase_type, severity, reason) VALUES
    (v_tenant_id, 'in conclusion', 'exact', 'warning', 'Generic phrase that sounds AI-generated'),
    (v_tenant_id, 'it is important to note', 'exact', 'warning', 'Filler phrase'),
    (v_tenant_id, 'needless to say', 'exact', 'warning', 'Unnecessary filler'),
    (v_tenant_id, 'in today''s world', 'exact', 'warning', 'Cliché opening'),
    (v_tenant_id, 'in this day and age', 'exact', 'warning', 'Cliché phrase'),
    (v_tenant_id, 'at the end of the day', 'exact', 'warning', 'Overused phrase'),
    (v_tenant_id, 'it goes without saying', 'exact', 'warning', 'Filler phrase'),
    (v_tenant_id, 'as we all know', 'exact', 'warning', 'Assumptive phrase'),
    (v_tenant_id, 'revolutionize', 'contains', 'warning', 'Marketing speak'),
    (v_tenant_id, 'game-changer', 'contains', 'warning', 'Marketing speak'),
    (v_tenant_id, 'synergy', 'exact', 'warning', 'Corporate jargon'),
    (v_tenant_id, 'leverage', 'exact', 'warning', 'Overused business term')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Banned phrases created for GetEducated';

END $$;

-- ============================================
-- CREATE SAMPLE MONETIZATION CATEGORIES
-- ============================================

DO $$
DECLARE
  v_tenant_id UUID := 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
BEGIN

  INSERT INTO tenant_monetization_categories (
    tenant_id, category, category_id, sub_category, sub_category_id,
    shortcode_template, keyword_patterns, priority
  ) VALUES
    (v_tenant_id, 'Business', 'business', 'MBA', 'mba',
     '[degree_programs category="business" level="masters" subtype="mba"]',
     ARRAY['mba', 'business administration', 'mba program'], 10),

    (v_tenant_id, 'Business', 'business', 'Accounting', 'accounting',
     '[degree_programs category="business" subtype="accounting"]',
     ARRAY['accounting', 'cpa', 'accountant'], 9),

    (v_tenant_id, 'Healthcare', 'healthcare', 'Nursing', 'nursing',
     '[degree_programs category="healthcare" subtype="nursing"]',
     ARRAY['nursing', 'rn', 'bsn', 'nurse'], 10),

    (v_tenant_id, 'Healthcare', 'healthcare', 'Healthcare Administration', 'healthcare-admin',
     '[degree_programs category="healthcare" subtype="administration"]',
     ARRAY['healthcare administration', 'health management', 'mha'], 8),

    (v_tenant_id, 'Education', 'education', 'Teaching', 'teaching',
     '[degree_programs category="education" subtype="teaching"]',
     ARRAY['teaching', 'teacher', 'education degree'], 9),

    (v_tenant_id, 'Education', 'education', 'Educational Leadership', 'ed-leadership',
     '[degree_programs category="education" subtype="leadership"]',
     ARRAY['educational leadership', 'principal', 'superintendent', 'edd'], 8),

    (v_tenant_id, 'Technology', 'technology', 'Computer Science', 'cs',
     '[degree_programs category="technology" subtype="computer-science"]',
     ARRAY['computer science', 'cs degree', 'programming'], 9),

    (v_tenant_id, 'Technology', 'technology', 'Cybersecurity', 'cybersecurity',
     '[degree_programs category="technology" subtype="cybersecurity"]',
     ARRAY['cybersecurity', 'information security', 'cyber'], 8),

    (v_tenant_id, 'Psychology', 'psychology', 'Psychology', 'psychology',
     '[degree_programs category="psychology"]',
     ARRAY['psychology', 'psych degree', 'behavioral science'], 8),

    (v_tenant_id, 'Criminal Justice', 'criminal-justice', 'Criminal Justice', 'cj',
     '[degree_programs category="criminal-justice"]',
     ARRAY['criminal justice', 'criminology', 'law enforcement'], 7)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Monetization categories created for GetEducated';

END $$;

-- ============================================
-- CREATE DEFAULT TENANT SETTINGS
-- ============================================

DO $$
DECLARE
  v_tenant_id UUID := 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
BEGIN

  -- Generation settings
  INSERT INTO tenant_settings (tenant_id, key, value) VALUES
    (v_tenant_id, 'generation', '{
      "defaultWordCount": 2000,
      "minWordCount": 1500,
      "maxWordCount": 2500,
      "targetInternalLinks": 4,
      "targetExternalLinks": 3,
      "targetFaqCount": 3,
      "qualityThreshold": 85,
      "maxFixAttempts": 3
    }'::jsonb)
  ON CONFLICT (tenant_id, key) DO UPDATE SET value = EXCLUDED.value;

  -- Humanization settings
  INSERT INTO tenant_settings (tenant_id, key, value) VALUES
    (v_tenant_id, 'humanization', '{
      "primaryProvider": "stealthgpt",
      "fallbackProvider": "claude",
      "stealthgptTone": "College",
      "stealthgptMode": "High",
      "stealthgptDetector": "gptzero",
      "detectionThreshold": 25
    }'::jsonb)
  ON CONFLICT (tenant_id, key) DO UPDATE SET value = EXCLUDED.value;

  -- Publishing settings
  INSERT INTO tenant_settings (tenant_id, key, value) VALUES
    (v_tenant_id, 'publishing', '{
      "autoPublishEnabled": false,
      "autoPublishDelayDays": 5,
      "defaultPostStatus": "draft",
      "requireReview": true,
      "minQualityForAutoPublish": 85
    }'::jsonb)
  ON CONFLICT (tenant_id, key) DO UPDATE SET value = EXCLUDED.value;

  -- Content rules
  INSERT INTO tenant_settings (tenant_id, key, value) VALUES
    (v_tenant_id, 'contentRules', '{
      "blockEduDomains": true,
      "requireExternalCitations": true,
      "enforceApprovedAuthorsOnly": true,
      "requiredSections": ["introduction", "conclusion", "faqs"]
    }'::jsonb)
  ON CONFLICT (tenant_id, key) DO UPDATE SET value = EXCLUDED.value;

  RAISE NOTICE 'Tenant settings created for GetEducated';

END $$;

-- ============================================
-- CREATE SAMPLE CATEGORIES
-- ============================================

DO $$
DECLARE
  v_tenant_id UUID := 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
BEGIN

  INSERT INTO categories (tenant_id, name, slug, description) VALUES
    (v_tenant_id, 'Rankings', 'rankings', 'College and program rankings'),
    (v_tenant_id, 'Degree Guides', 'degree-guides', 'Comprehensive guides to degree programs'),
    (v_tenant_id, 'Career Guides', 'career-guides', 'Career path and job outlook information'),
    (v_tenant_id, 'Financial Aid', 'financial-aid', 'Scholarships, grants, and financial aid information'),
    (v_tenant_id, 'Admissions', 'admissions', 'College admissions advice and requirements'),
    (v_tenant_id, 'Online Learning', 'online-learning', 'Online degree programs and distance learning'),
    (v_tenant_id, 'Graduate School', 'graduate-school', 'Graduate and professional degree information')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Categories created for GetEducated';

END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these to verify the seed was applied correctly:

-- SELECT * FROM tenants WHERE slug = 'geteducated';
-- SELECT name, display_name, is_default FROM contributors WHERE tenant_id = 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
-- SELECT domain, rule_type FROM tenant_domain_rules WHERE tenant_id = 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d' ORDER BY rule_type, domain;
-- SELECT name, code FROM tenant_content_levels WHERE tenant_id = 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d' ORDER BY level_order;
-- SELECT phrase, severity FROM tenant_banned_phrases WHERE tenant_id = 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
-- SELECT category, sub_category FROM tenant_monetization_categories WHERE tenant_id = 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
-- SELECT key FROM tenant_settings WHERE tenant_id = 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';

-- ============================================
-- OUTPUT SUMMARY
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'GetEducated Tenant Seed Complete';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tenant ID: a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
  RAISE NOTICE 'Tenant Slug: geteducated';
  RAISE NOTICE 'App Name: Perdia';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Create an admin user in Supabase Auth';
  RAISE NOTICE '2. Add tenant_users record linking user to tenant';
  RAISE NOTICE '3. Configure API keys via tenant_api_keys table';
  RAISE NOTICE '4. Import site catalog from geteducated.com sitemap';
  RAISE NOTICE '============================================';
END $$;
