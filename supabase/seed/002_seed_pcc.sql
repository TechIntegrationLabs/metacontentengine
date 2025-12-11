-- Seed File: Polynesian Cultural Center (PCC) Initial Tenant Data
-- Version: 1.0
-- Description: Creates the PCC tenant with initial configuration
--
-- Run this after migrations are applied:
-- Option 1: Include in push: supabase db push --include-seed
-- Option 2: Run manually in SQL Editor

-- ============================================
-- CREATE PCC TENANT
-- ============================================

-- Deterministic UUID for PCC tenant (easy reference)
-- UUID: b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e
DO $$
DECLARE
  v_tenant_id UUID := 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';
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
    'Polynesian Cultural Center',
    'pcc',
    'PCC Content Engine',
    '#1E3A5F',  -- Deep Ocean Blue (Polynesian theme)
    '#2D5A3D',  -- Tropical Green
    '#D4A017',  -- Golden Sand
    'polynesia.com',
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

  RAISE NOTICE 'Tenant created/updated: Polynesian Cultural Center (%)' , v_tenant_id;

END $$;

-- ============================================
-- CREATE CONTRIBUTORS
-- ============================================

DO $$
DECLARE
  v_tenant_id UUID := 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';
BEGIN

  -- Contributor 1: Cultural Heritage Expert
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
    'Keoni Makua',
    'Keoni Makua',
    'Cultural Storyteller',
    'Expert in Polynesian cultural heritage, traditions, and authentic storytelling',
    '{
      "formalityScale": 5,
      "description": "Keoni writes with warmth and reverence for Polynesian culture. His style blends educational content with storytelling, making cultural heritage accessible and engaging. He emphasizes authenticity and respect for traditions.",
      "guidelines": "Honor cultural traditions with accurate information. Use storytelling to engage readers. Include cultural context and significance. Respect sacred topics appropriately.",
      "signaturePhrases": ["in our culture", "passed down through generations", "the heart of Polynesia", "our ancestors taught us"],
      "transitionWords": ["as you will discover", "traditionally", "in the islands", "throughout Polynesia"],
      "phrasesToAvoid": ["exotic", "primitive", "natives", "luau party"],
      "topicsToAvoid": ["cultural appropriation", "inauthentic representations"]
    }'::jsonb,
    ARRAY['Polynesian culture', 'Hawaiian traditions', 'Samoan heritage', 'Tongan customs', 'Maori culture', 'Tahitian traditions'],
    ARRAY['cultural guide', 'educational content', 'heritage story'],
    true,
    true
  )
  ON CONFLICT DO NOTHING;

  -- Contributor 2: Travel & Experience Writer
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
    'Leilani Kai',
    'Leilani Kai',
    'Experience Guide',
    'Travel writer specializing in immersive cultural experiences and visitor engagement',
    '{
      "formalityScale": 4,
      "description": "Leilani writes with enthusiasm and warmth, helping visitors feel welcomed and prepared for their cultural journey. Her style is friendly and practical, focusing on creating memorable experiences.",
      "guidelines": "Be welcoming and encouraging. Provide practical visitor tips. Paint vivid pictures of experiences. Include insider recommendations.",
      "signaturePhrases": ["when you visit", "do not miss", "the best time to", "locals recommend"],
      "transitionWords": ["next", "after that", "meanwhile", "also"],
      "phrasesToAvoid": ["tourist trap", "boring", "skip this"],
      "topicsToAvoid": []
    }'::jsonb,
    ARRAY['visitor experiences', 'cultural shows', 'island villages', 'dining experiences', 'family activities'],
    ARRAY['visitor guide', 'experience overview', 'tips and recommendations'],
    true
  )
  ON CONFLICT DO NOTHING;

  -- Contributor 3: Events & Entertainment Expert
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
    'Manu Tama',
    'Manu Tama',
    'Entertainment Specialist',
    'Expert on Polynesian performances, events, and entertainment offerings',
    '{
      "formalityScale": 5,
      "description": "Manu writes with energy and expertise about performances and events. His style captures the excitement of live entertainment while educating readers about the cultural significance behind each show.",
      "guidelines": "Convey the energy of performances. Explain cultural significance. Include practical show details. Build anticipation for events.",
      "signaturePhrases": ["experience the magic of", "watch as performers", "feel the rhythm of", "witness the artistry"],
      "transitionWords": ["as the show unfolds", "during the performance", "following", "throughout"],
      "phrasesToAvoid": ["just a show", "typical"],
      "topicsToAvoid": []
    }'::jsonb,
    ARRAY['Ha: Breath of Life show', 'luau experiences', 'cultural performances', 'special events', 'night shows'],
    ARRAY['event preview', 'show guide', 'entertainment spotlight'],
    true
  )
  ON CONFLICT DO NOTHING;

  -- Contributor 4: Educational Content Specialist
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
    'Moana Lani',
    'Moana Lani',
    'Cultural Educator',
    'Educational content specialist focusing on learning experiences and cultural immersion',
    '{
      "formalityScale": 6,
      "description": "Moana writes with clarity and educational purpose. Her style makes complex cultural topics accessible while maintaining academic credibility. She focuses on hands-on learning and cultural immersion.",
      "guidelines": "Explain concepts clearly. Connect activities to cultural learning. Include hands-on elements. Cite cultural sources when appropriate.",
      "signaturePhrases": ["learn how to", "discover the art of", "through this experience", "cultural significance of"],
      "transitionWords": ["furthermore", "in addition", "specifically", "for example"],
      "phrasesToAvoid": ["simple", "easy", "just"],
      "topicsToAvoid": []
    }'::jsonb,
    ARRAY['cultural workshops', 'hands-on activities', 'educational programs', 'school groups', 'cultural preservation'],
    ARRAY['educational guide', 'workshop overview', 'learning experience'],
    true
  )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Contributors created for PCC';

END $$;

-- ============================================
-- CREATE DOMAIN RULES
-- ============================================

DO $$
DECLARE
  v_tenant_id UUID := 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';
BEGIN

  -- Blocked domains (competitors and potentially problematic sources)
  INSERT INTO tenant_domain_rules (tenant_id, domain, rule_type, reason) VALUES
    (v_tenant_id, 'tripadvisor.com', 'blocked', 'Third-party review site'),
    (v_tenant_id, 'yelp.com', 'blocked', 'Third-party review site'),
    (v_tenant_id, 'viator.com', 'blocked', 'Competitor booking site'),
    (v_tenant_id, 'getyourguide.com', 'blocked', 'Competitor booking site'),
    (v_tenant_id, 'expedia.com', 'blocked', 'Third-party booking site'),
    (v_tenant_id, 'travelocity.com', 'blocked', 'Third-party booking site')
  ON CONFLICT DO NOTHING;

  -- Allowed domains (trusted sources)
  INSERT INTO tenant_domain_rules (tenant_id, domain, rule_type, reason) VALUES
    (v_tenant_id, 'polynesia.com', 'allowed', 'Official PCC website'),
    (v_tenant_id, 'gohawaii.com', 'allowed', 'Hawaii Tourism Authority - official source'),
    (v_tenant_id, 'hawaiitourismauthority.org', 'allowed', 'Hawaii Tourism Authority - official source'),
    (v_tenant_id, 'nps.gov', 'allowed', 'National Park Service - official source'),
    (v_tenant_id, 'hawaii.edu', 'allowed', 'University of Hawaii - academic source'),
    (v_tenant_id, 'bishopmuseum.org', 'allowed', 'Bishop Museum - cultural authority'),
    (v_tenant_id, 'smithsonianmag.com', 'allowed', 'Smithsonian - reputable source'),
    (v_tenant_id, 'nationalgeographic.com', 'allowed', 'National Geographic - reputable source'),
    (v_tenant_id, 'unesco.org', 'allowed', 'UNESCO - cultural heritage authority')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Domain rules created for PCC';

END $$;

-- ============================================
-- CREATE CONTENT LEVELS (Experience Types)
-- ============================================

DO $$
DECLARE
  v_tenant_id UUID := 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';
BEGIN

  INSERT INTO tenant_content_levels (tenant_id, name, code, description, level_order) VALUES
    (v_tenant_id, 'Day Experience', 'day', 'Daytime cultural center experiences', 1),
    (v_tenant_id, 'Evening Experience', 'evening', 'Evening shows and luau experiences', 2),
    (v_tenant_id, 'Full Day Package', 'full-day', 'Complete day and evening packages', 3),
    (v_tenant_id, 'Cultural Workshop', 'workshop', 'Hands-on cultural learning activities', 4),
    (v_tenant_id, 'Group Experience', 'group', 'School and tour group programs', 5),
    (v_tenant_id, 'VIP Experience', 'vip', 'Premium and exclusive experiences', 6),
    (v_tenant_id, 'Special Event', 'event', 'Seasonal and special occasions', 7)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Content levels created for PCC';

END $$;

-- ============================================
-- CREATE BANNED PHRASES
-- ============================================

DO $$
DECLARE
  v_tenant_id UUID := 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';
BEGIN

  INSERT INTO tenant_banned_phrases (tenant_id, phrase, phrase_type, severity, reason) VALUES
    -- Cultural sensitivity
    (v_tenant_id, 'exotic', 'exact', 'error', 'Othering language - disrespectful to cultures'),
    (v_tenant_id, 'primitive', 'exact', 'error', 'Offensive and inaccurate'),
    (v_tenant_id, 'natives', 'exact', 'warning', 'Prefer specific island/cultural identities'),
    (v_tenant_id, 'savages', 'exact', 'error', 'Highly offensive'),
    (v_tenant_id, 'hula girl', 'exact', 'warning', 'Stereotypical - use "hula dancer"'),
    (v_tenant_id, 'grass skirt', 'exact', 'warning', 'Often inaccurate - use proper attire names'),

    -- Generic AI phrases
    (v_tenant_id, 'in conclusion', 'exact', 'warning', 'Generic phrase that sounds AI-generated'),
    (v_tenant_id, 'it is important to note', 'exact', 'warning', 'Filler phrase'),
    (v_tenant_id, 'needless to say', 'exact', 'warning', 'Unnecessary filler'),
    (v_tenant_id, 'in today''s world', 'exact', 'warning', 'Cliche opening'),

    -- Marketing cliches
    (v_tenant_id, 'hidden gem', 'exact', 'warning', 'Overused travel phrase'),
    (v_tenant_id, 'bucket list', 'exact', 'warning', 'Overused travel phrase'),
    (v_tenant_id, 'off the beaten path', 'exact', 'warning', 'Overused travel phrase'),
    (v_tenant_id, 'paradise on earth', 'exact', 'warning', 'Overused Hawaii cliche')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Banned phrases created for PCC';

END $$;

-- ============================================
-- CREATE MONETIZATION CATEGORIES
-- ============================================

DO $$
DECLARE
  v_tenant_id UUID := 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';
BEGIN

  INSERT INTO tenant_monetization_categories (
    tenant_id, category, category_id, sub_category, sub_category_id,
    shortcode_template, keyword_patterns, priority
  ) VALUES
    (v_tenant_id, 'Tickets', 'tickets', 'Day Admission', 'day-admission',
     '[pcc_booking type="day-admission"]',
     ARRAY['day pass', 'admission', 'tickets', 'visit pcc'], 10),

    (v_tenant_id, 'Tickets', 'tickets', 'Luau Package', 'luau',
     '[pcc_booking type="luau"]',
     ARRAY['luau', 'alii luau', 'dinner show', 'evening package'], 10),

    (v_tenant_id, 'Tickets', 'tickets', 'Ha: Breath of Life', 'ha-show',
     '[pcc_booking type="ha-show"]',
     ARRAY['ha breath of life', 'night show', 'evening show', 'fire knife'], 9),

    (v_tenant_id, 'Experiences', 'experiences', 'Island Villages', 'villages',
     '[pcc_experience type="villages"]',
     ARRAY['island villages', 'cultural villages', 'samoa', 'tonga', 'fiji', 'tahiti', 'hawaii', 'aotearoa'], 8),

    (v_tenant_id, 'Experiences', 'experiences', 'Canoe Tours', 'canoe',
     '[pcc_experience type="canoe"]',
     ARRAY['canoe tour', 'canoe ride', 'lagoon', 'boat tour'], 7),

    (v_tenant_id, 'Experiences', 'experiences', 'Workshops', 'workshops',
     '[pcc_experience type="workshops"]',
     ARRAY['workshop', 'lei making', 'weaving', 'cooking class', 'hands-on'], 7),

    (v_tenant_id, 'Groups', 'groups', 'School Groups', 'schools',
     '[pcc_booking type="school-group"]',
     ARRAY['school group', 'field trip', 'educational trip', 'student group'], 6),

    (v_tenant_id, 'Groups', 'groups', 'Tour Groups', 'tours',
     '[pcc_booking type="tour-group"]',
     ARRAY['tour group', 'group booking', 'group discount'], 6)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Monetization categories created for PCC';

END $$;

-- ============================================
-- CREATE DEFAULT TENANT SETTINGS
-- ============================================

DO $$
DECLARE
  v_tenant_id UUID := 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';
BEGIN

  -- Generation settings
  INSERT INTO tenant_settings (tenant_id, key, value) VALUES
    (v_tenant_id, 'generation', '{
      "defaultWordCount": 1500,
      "minWordCount": 1000,
      "maxWordCount": 2500,
      "targetInternalLinks": 4,
      "targetExternalLinks": 2,
      "targetFaqCount": 4,
      "qualityThreshold": 85,
      "maxFixAttempts": 3
    }'::jsonb)
  ON CONFLICT (tenant_id, key) DO UPDATE SET value = EXCLUDED.value;

  -- Humanization settings
  INSERT INTO tenant_settings (tenant_id, key, value) VALUES
    (v_tenant_id, 'humanization', '{
      "primaryProvider": "stealthgpt",
      "fallbackProvider": "claude",
      "stealthgptTone": "Professional",
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
      "blockCompetitorDomains": true,
      "requireExternalCitations": true,
      "enforceApprovedAuthorsOnly": true,
      "requiredSections": ["introduction", "conclusion", "faqs"],
      "culturalSensitivityCheck": true
    }'::jsonb)
  ON CONFLICT (tenant_id, key) DO UPDATE SET value = EXCLUDED.value;

  -- Brand settings specific to PCC
  INSERT INTO tenant_settings (tenant_id, key, value) VALUES
    (v_tenant_id, 'brand', '{
      "industry": "Leisure, Travel & Tourism, Hospitality",
      "targetAudience": ["families", "tourists", "cultural enthusiasts", "school groups"],
      "brandVoice": "warm, educational, culturally respectful, welcoming",
      "missionStatement": "Preserving and sharing the culture, arts, and crafts of Polynesia",
      "uniqueSellingPoints": [
        "Authentic Polynesian cultural experiences",
        "Six island villages representing Pacific cultures",
        "Award-winning Ha: Breath of Life show",
        "World-famous Ali''i Luau",
        "Educational and entertaining for all ages"
      ]
    }'::jsonb)
  ON CONFLICT (tenant_id, key) DO UPDATE SET value = EXCLUDED.value;

  RAISE NOTICE 'Tenant settings created for PCC';

END $$;

-- ============================================
-- CREATE CATEGORIES
-- ============================================

DO $$
DECLARE
  v_tenant_id UUID := 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';
BEGIN

  INSERT INTO categories (tenant_id, name, slug, description) VALUES
    (v_tenant_id, 'Cultural Heritage', 'cultural-heritage', 'Polynesian history, traditions, and cultural significance'),
    (v_tenant_id, 'Island Villages', 'island-villages', 'Content about the six Polynesian island villages'),
    (v_tenant_id, 'Shows & Entertainment', 'shows-entertainment', 'Ha: Breath of Life, luau, and performances'),
    (v_tenant_id, 'Visitor Guide', 'visitor-guide', 'Planning tips, tickets, and practical information'),
    (v_tenant_id, 'Activities & Experiences', 'activities-experiences', 'Workshops, canoe tours, and hands-on activities'),
    (v_tenant_id, 'Food & Dining', 'food-dining', 'Luau dining, island cuisine, and culinary experiences'),
    (v_tenant_id, 'Travel Tips', 'travel-tips', 'Getting to PCC, nearby attractions, Oahu travel'),
    (v_tenant_id, 'Special Events', 'special-events', 'Seasonal events, holidays, and special occasions')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Categories created for PCC';

END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these to verify the seed was applied correctly:

-- SELECT * FROM tenants WHERE slug = 'pcc';
-- SELECT name, display_name, is_default FROM contributors WHERE tenant_id = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';
-- SELECT domain, rule_type FROM tenant_domain_rules WHERE tenant_id = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' ORDER BY rule_type, domain;
-- SELECT name, code FROM tenant_content_levels WHERE tenant_id = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' ORDER BY level_order;
-- SELECT phrase, severity FROM tenant_banned_phrases WHERE tenant_id = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';
-- SELECT category, sub_category FROM tenant_monetization_categories WHERE tenant_id = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';
-- SELECT key FROM tenant_settings WHERE tenant_id = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';

-- ============================================
-- OUTPUT SUMMARY
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Polynesian Cultural Center Tenant Seed Complete';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tenant ID: b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';
  RAISE NOTICE 'Tenant Slug: pcc';
  RAISE NOTICE 'App Name: PCC Content Engine';
  RAISE NOTICE 'Domain: polynesia.com';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Create an admin user in Supabase Auth';
  RAISE NOTICE '2. Add tenant_users record linking user to tenant';
  RAISE NOTICE '3. Configure API keys via tenant_api_keys table';
  RAISE NOTICE '4. Import site catalog from polynesia.com sitemap';
  RAISE NOTICE '5. Update apps/pcc/.env.local with VITE_TENANT_ID';
  RAISE NOTICE '============================================';
END $$;
