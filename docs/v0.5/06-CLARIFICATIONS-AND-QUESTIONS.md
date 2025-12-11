# Meta Content Engine v0.5 - Clarifications and Questions

> **Document Version:** 2.0
> **Created:** December 10, 2024
> **Status:** ✅ ANSWERED - Ready for Implementation

---

## Section 1: Reference Implementation ("App A")

### Q1.1: Access to Reference Application ✅

**Answers:**
1. **Yes**, App A is at: `C:\Users\Disruptors\Documents\Disruptors Projects\perdiav5`
2. Fully accessible with complete implementations
3. Feature specs from working production code

**Key Reference Files:**
| Feature | App A Location |
|---------|----------------|
| Generation Pipeline | `supabase/functions/generate-full-article/` |
| StealthGPT | `supabase/functions/_shared/stealthgpt-client.ts` |
| Internal Linking | `src/services/internal-link-suggester.ts` |
| Link Compliance | `src/services/link-compliance-checker.ts` |
| Risk Assessment | `src/services/risk-assessment.ts` |
| Monetization | `supabase/functions/_shared/monetization-engine.ts` |
| Quality Scoring | `src/services/qa-score-calculator.ts` |

---

### Q1.2: Feature Completeness Priority ✅

**Answer:** Option B - Tier 1 + Tier 2 for initial launch

**Reasoning:**
- Tier 1 = absolute blockers (StealthGPT, internal linking = core value prop)
- Tier 2 = "complete system" vs "fancy editor"
- Tier 3/4 = post-launch incremental additions

---

## Section 2: External Services & API Keys

### Q2.1: StealthGPT Configuration ✅

**Defaults from App A:**
- Bypass mode: **Medium** (balanced)
- Tone: **PhD** (highest quality)
- Business mode: **Enabled**
- Chunking: **150-200 words** split on H2/H3 headings

**Fallback:** Yes, implement Claude-based basic rephrasing (improvement over App A)

---

### Q2.2: DataForSEO Integration ✅

**Answer:** Manual keyword entry first, DataForSEO as Tier 3 enhancement

---

### Q2.3: BLS Data ✅

**Implementation:**
- NOT live API
- Cached/imported data + AI-powered citation generation
- BLSCitationHelper suggests relevant BLS URLs

**Datasets:** OOH, Employment Projections, Wages by Occupation

---

### Q2.4: WordPress Instances ✅

**Answer:**
- One WordPress site per tenant initially
- Self-hosted with REST API + Application Passwords
- **Yoast SEO integration required**
- Multi-site support as future enhancement

---

## Section 3: Business Logic Clarifications

### Q3.1: Blocked Domains List ✅

**Complete list (17 domains):**
```typescript
const BLOCKED_DOMAINS = [
  'usnews.com',
  'niche.com',
  'bestcolleges.com',
  'collegechoice.net',
  'thebestschools.org',
  'onlinecolleges.com',
  'onlineu.com',
  'guidetoonlineschools.com',
  'affordablecollegesonline.org',
  'collegeatlas.org',
  'mydegreeguide.com',
  'intelligent.com',
  'edumed.org',
  'nursingprocess.org',
  'accreditedschoolsonline.org',
  'master-ede.org',
  'onlineschoolscenter.com'
];
```

**Rules:**
- All `.edu` domains blocked (except GetEducated school pages)
- **Hard block** - cannot publish with blocked links
- Wikipedia: Allowed but discouraged

---

### Q3.2: Monetization Categories ✅

**13 Degree Levels:**
```
Associate's, Bachelor's, Master's, Doctoral, Certificate,
Diploma, Professional, Graduate Certificate, Post-Master's Certificate,
Specialist, Post-Doctoral, Undergraduate Certificate, Boot Camp
```

**155 Categories:** Stored in `monetization_categories` table (subject × level × specialization)

**Shortcode formats:**
- `[degree_table subject="X" level="Y"]` - Full comparison table
- `[degree_offer school_id="X"]` - Single school offer
- `[program_card program_id="X"]` - Program highlight card
- `[cta_banner category="X"]` - Call-to-action banner

**Placement:** AI-determined optimal placement

**Multi-tenant:** GetEducated-specific; make configurable or disableable for other tenants

---

### Q3.3: Auto-Publish Rules ✅

| Setting | Value |
|---------|-------|
| Default days after ready | 3 days |
| Without review allowed | Only if: Risk=LOW, Quality≥80, No compliance issues, All QA passes |
| Minimum quality | 80/100 |
| Publish time | 9 AM EST (configurable) |
| Content calendar | Not implemented |

---

### Q3.4: Risk Assessment Thresholds ✅

**Risk Calculation:**
```
CRITICAL: Any blocking issue (unauthorized author, blocked links)
HIGH: 2+ major issues OR AI detection risk > 30%
MEDIUM: 1 major issue OR 2+ minor issues OR AI detection risk 15-30%
LOW: 0-1 minor issues AND AI detection risk < 15%
```

**Auto-publish:**
- MEDIUM+ blocks auto-publish
- HIGH requires manual review
- CRITICAL cannot be published at all

**AI Detection:** Internal heuristics only (no external detector)

---

### Q3.5: Internal Linking Targets ✅

| Setting | Value |
|---------|-------|
| Target links per article | 3-5 (configurable) |
| Distribution | Spread throughout content |
| Max links to single URL | 10 total across all articles |
| Link behavior | Same tab (no `target="_blank"`) |
| Priority articles | "Pillar content" flag for preferential linking |

**Relevance scoring:**
```
score = titleOverlapScore * 0.4 +
        topicMatchScore * 0.3 +
        keywordMatchScore * 0.2 +
        linkEquityScore * 0.1
```

---

## Section 4: UI/UX Decisions

### Q4.1: Kanban Board Design ✅

- **Limits:** No hard limits, virtualized rendering
- **Card display:** Title + Contributor + Quality Score + Risk Badge + Word Count
- **Drag rules:**
  - Can skip forward (Ideas → Ready for urgent)
  - Cannot skip backward
  - Some transitions trigger actions (→ QA Review triggers QA calc)
- **Design:** Left color border indicating risk level

---

### Q4.2: Content Ideas Workflow ✅

- **Creation:** Anyone can create
- **Approval:** Admin and Owner only
- **Archival:** Auto-archive after conversion to article
- **Rejection reasons:** Free-form + predefined options:
  - "Already covered"
  - "Off-topic for site"
  - "Low search potential"
  - "Competitor keyword"
  - "Other"

---

### Q4.3: Editor Sidebar Components ✅

**Priority order:**
1. Quality Metrics (6-metric checklist)
2. Link Compliance Checker
3. Internal Link Suggester
4. Risk Level Display
5. SEO Preview (Yoast-style)
6. Shortcode Inspector (if monetization enabled)
7. Schema Generator
8. BLS Citation Helper
9. Article Navigation/TOC Generator
10. AI Training Panel

**Layout:** Collapsible accordion, right sidebar

---

## Section 5: Technical Architecture

### Q5.1: Generation Pipeline Async ✅

- **Async:** Yes, absolutely required (2-5 min generation)
- **Notification:** Real-time via Supabase subscriptions + toast + Kanban spinner
- **Max time:** ~5 minutes full pipeline

---

### Q5.2: Queue Processing ✅

| Setting | Value |
|---------|-------|
| Max concurrent per tenant | 3 |
| Platform-wide limit | 10 |
| Trigger | Supabase scheduled function (every 1 min) |
| Retries | 3 attempts: 1min, 5min, 15min backoff |

---

### Q5.3: Site Catalog Population ✅

- **Primary source:** WordPress REST API
- **Secondary:** Manual CSV upload
- **Content stored:** Metadata only (title, URL, excerpt, categories, tags, publish date)
- **Sync:** Real-time on publish + daily full sync

---

## Section 6: Multi-Tenant Considerations

### Q6.1: Feature Availability ✅

| Feature | Availability |
|---------|--------------|
| Monetization | Configurable per tenant |
| Keyword research | Available to all |
| Subscription plans | Future enhancement |

**GetEducated-specific items to genericize:**
- BLS Citation Helper → Generic "External Citation Helper"
- School database → Remove
- Ranking reports → Remove
- Monetization categories → Make configurable

---

### Q6.2: Default Configuration ✅

| Setting | Default |
|---------|---------|
| Domain rules | Start empty |
| Banned phrases | Start empty |
| Starter ideas | None |
| Monetization | Empty (configure during onboarding) |

---

## Section 7: Implementation Preferences

### Q7.1: Testing ✅
**Option B:** Critical path tests only (generation, publishing, auth)

### Q7.2: Documentation ✅
**Option D:** Match existing (JSDoc on complex functions, inline for non-obvious)

### Q7.3: Error Handling ✅
**Option D:** Depends on feature
- Generation: Retry with eventual failure
- Publishing: Fail fast (data integrity)
- UI: Graceful degradation

---

## Section 8: Timeline & Priority

### Q8.1: Delivery ✅

**Iterative releases:**
1. Phase 1: Tier 1 (core pipeline)
2. Phase 2: Tier 2 (automation, monetization)
3. Phase 3: Tier 3 (polish, analytics)

---

### Q8.2: Resource Constraints ✅

| Resource | Constraint |
|----------|------------|
| StealthGPT | ~$0.01/100 words (budget per tenant) |
| Claude | Standard pricing (track per tenant) |
| Supabase | Pro tier recommended |
| Netlify | No constraint |

---

## Section 9: Codebase Conventions

### Q9.1: Conventions ✅
- ✅ PascalCase for components
- ✅ `use` prefix for hooks
- ✅ lowercase-hyphens for services
- ✅ Add pages to `app.tsx` routing

### Q9.2: State Management ✅
- ✅ TanStack Query for server state
- React Context for cross-cutting (tenant, user)
- Local state for UI-only
- No Zustand/Jotai needed

---

## Ready for Implementation

All questions answered. Proceed with Phase 1 (Tier 1 features).
