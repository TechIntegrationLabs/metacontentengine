/**
 * Edge Function: analyze-brand
 *
 * AI-powered brand DNA extraction from a website URL.
 * Used by the Magic Setup wizard to auto-configure tenant settings.
 *
 * Usage:
 *   POST /functions/v1/analyze-brand
 *   Body: {
 *     "url": "https://example.com",
 *     "additionalContext": "Optional context about the brand" (optional)
 *   }
 *
 * Returns brand profile including:
 * - Industry classification
 * - Voice tone (1-10 scale)
 * - Target audience description
 * - Suggested keywords
 * - Brand description
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import {
  createAdminClient,
  getTenantContext,
  handleCors,
  jsonResponse,
  errorResponse,
} from '../_shared/supabase-client.ts'

// Types
interface AnalyzeBrandRequest {
  url: string
  additionalContext?: string
}

interface BrandProfile {
  name: string
  industry: string
  tone: number
  audience: string
  keywords: string[]
  description: string
  colors?: {
    primary: string
    secondary: string
  }
  suggestedContributors?: ContributorSuggestion[]
}

interface ContributorSuggestion {
  name: string
  role: string
  expertise: string[]
  formalityScale: number
}

// Industry classifications
const INDUSTRIES = [
  'Education Technology', 'Healthcare', 'Finance', 'E-commerce',
  'SaaS', 'Marketing', 'Real Estate', 'Legal', 'Travel',
  'Food & Beverage', 'Fashion', 'Technology', 'Consulting',
  'Non-profit', 'Media & Entertainment', 'Manufacturing',
]

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  // Only allow POST
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405)
  }

  try {
    const body: AnalyzeBrandRequest = await req.json()

    // Validate URL
    if (!body.url) {
      return errorResponse('URL is required')
    }

    let url: URL
    try {
      url = new URL(body.url)
    } catch {
      return errorResponse('Invalid URL format')
    }

    const admin = createAdminClient()

    // In production, this would:
    // 1. Fetch the website content
    // 2. Use Claude or Grok to analyze the content
    // 3. Extract colors from CSS/images
    // 4. Return structured brand profile

    // For MVP, use intelligent pattern matching and defaults
    const hostname = url.hostname.replace('www.', '')
    const brandName = extractBrandName(hostname)

    // Analyze URL patterns for industry hints
    const industry = detectIndustry(hostname, body.additionalContext)

    // Determine tone based on industry defaults
    const tone = getDefaultTone(industry)

    // Generate audience based on industry
    const audience = generateAudience(industry, brandName)

    // Generate keywords based on industry and brand
    const keywords = generateKeywords(industry, brandName)

    // Generate brand description
    const description = generateDescription(brandName, industry, audience)

    // Suggest contributor personas
    const suggestedContributors = suggestContributors(industry)

    const brandProfile: BrandProfile = {
      name: brandName,
      industry,
      tone,
      audience,
      keywords,
      description,
      suggestedContributors,
    }

    // If we have API keys, use AI for better analysis
    const { data: claudeKey } = await admin.rpc('get_decrypted_api_key', {
      p_tenant_id: null, // Platform key
      p_service: 'claude',
    })

    if (claudeKey) {
      // Enhanced analysis with Claude
      const enhancedProfile = await analyzeWithAI(
        body.url,
        body.additionalContext,
        claudeKey
      )

      if (enhancedProfile) {
        Object.assign(brandProfile, enhancedProfile)
      }
    }

    return jsonResponse({
      success: true,
      profile: brandProfile,
    })

  } catch (err) {
    console.error('Error:', err)
    return errorResponse('Failed to analyze brand', 500)
  }
})

// ===== Helper Functions =====

function extractBrandName(hostname: string): string {
  // Remove common TLDs and subdomains
  const parts = hostname.split('.')
  let name = parts[0]

  // Handle common patterns
  if (parts.length > 2) {
    name = parts[parts.length - 2]
  }

  // Capitalize first letter
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function detectIndustry(hostname: string, context?: string): string {
  const combined = `${hostname} ${context || ''}`.toLowerCase()

  // Industry detection patterns
  const patterns: Record<string, string[]> = {
    'Education Technology': ['edu', 'learn', 'school', 'university', 'college', 'course', 'training', 'degree', 'certification'],
    'Healthcare': ['health', 'medical', 'clinic', 'hospital', 'doctor', 'wellness', 'pharma', 'care'],
    'Finance': ['bank', 'finance', 'invest', 'money', 'loan', 'credit', 'insurance', 'wealth'],
    'E-commerce': ['shop', 'store', 'buy', 'cart', 'retail', 'product', 'sale', 'deal'],
    'SaaS': ['app', 'software', 'platform', 'cloud', 'tool', 'dashboard', 'api', 'saas'],
    'Marketing': ['market', 'agency', 'brand', 'creative', 'media', 'advertis', 'seo', 'content'],
    'Real Estate': ['real', 'estate', 'home', 'property', 'house', 'realty', 'rent', 'mortgage'],
    'Legal': ['law', 'legal', 'attorney', 'lawyer', 'firm', 'counsel', 'justice'],
    'Travel': ['travel', 'tour', 'vacation', 'hotel', 'flight', 'trip', 'book', 'destination'],
    'Technology': ['tech', 'digital', 'data', 'cyber', 'it', 'solution', 'system', 'innovation'],
  }

  for (const [industry, keywords] of Object.entries(patterns)) {
    for (const keyword of keywords) {
      if (combined.includes(keyword)) {
        return industry
      }
    }
  }

  return 'General Business'
}

function getDefaultTone(industry: string): number {
  const toneMap: Record<string, number> = {
    'Education Technology': 7,
    'Healthcare': 8,
    'Finance': 8,
    'E-commerce': 5,
    'SaaS': 6,
    'Marketing': 5,
    'Real Estate': 6,
    'Legal': 9,
    'Travel': 4,
    'Technology': 6,
    'General Business': 6,
  }

  return toneMap[industry] || 6
}

function generateAudience(industry: string, brandName: string): string {
  const audienceMap: Record<string, string> = {
    'Education Technology': `Students, educators, and lifelong learners seeking quality educational resources and career advancement through ${brandName}`,
    'Healthcare': `Patients, healthcare providers, and health-conscious individuals looking for trusted medical information and services`,
    'Finance': `Individuals and businesses seeking financial guidance, investment opportunities, and wealth management solutions`,
    'E-commerce': `Online shoppers looking for quality products, great deals, and convenient shopping experiences`,
    'SaaS': `Business professionals and teams seeking efficient software solutions to streamline their workflows`,
    'Marketing': `Businesses and entrepreneurs looking to grow their brand presence and reach their target audience effectively`,
    'Real Estate': `Home buyers, sellers, and real estate investors seeking property opportunities and market insights`,
    'Legal': `Individuals and businesses requiring professional legal counsel and representation`,
    'Travel': `Travelers and adventure seekers planning their next trip or vacation experience`,
    'Technology': `Technology enthusiasts and businesses seeking innovative solutions and digital transformation`,
  }

  return audienceMap[industry] || `Professionals and consumers interested in ${brandName}'s products and services`
}

function generateKeywords(industry: string, brandName: string): string[] {
  const keywordMap: Record<string, string[]> = {
    'Education Technology': ['Online Learning', 'Education', 'Courses', 'Certification', 'Career Development'],
    'Healthcare': ['Health', 'Wellness', 'Medical', 'Care', 'Treatment'],
    'Finance': ['Investment', 'Banking', 'Wealth', 'Financial Planning', 'Money Management'],
    'E-commerce': ['Shopping', 'Products', 'Deals', 'Online Store', 'Reviews'],
    'SaaS': ['Software', 'Platform', 'Tools', 'Productivity', 'Automation'],
    'Marketing': ['Brand', 'Growth', 'Digital Marketing', 'Strategy', 'Content'],
    'Real Estate': ['Property', 'Homes', 'Real Estate', 'Investment', 'Market'],
    'Legal': ['Law', 'Legal Services', 'Attorney', 'Counsel', 'Rights'],
    'Travel': ['Travel', 'Destinations', 'Vacation', 'Booking', 'Adventures'],
    'Technology': ['Technology', 'Innovation', 'Digital', 'Solutions', 'IT'],
  }

  const baseKeywords = keywordMap[industry] || ['Business', 'Services', 'Solutions', 'Quality', 'Professional']
  return [brandName, ...baseKeywords]
}

function generateDescription(brandName: string, industry: string, audience: string): string {
  return `${brandName} is a trusted platform in the ${industry} space, dedicated to serving ${audience.split(' ').slice(0, 5).join(' ')} with quality content and resources.`
}

function suggestContributors(industry: string): ContributorSuggestion[] {
  const contributorMap: Record<string, ContributorSuggestion[]> = {
    'Education Technology': [
      { name: 'Dr. Academic Expert', role: 'Subject Matter Expert', expertise: ['Research', 'Academia', 'Analysis'], formalityScale: 8 },
      { name: 'Student Success Coach', role: 'Advisor', expertise: ['Career Guidance', 'Student Life', 'Tips'], formalityScale: 5 },
    ],
    'Healthcare': [
      { name: 'Dr. Health Expert', role: 'Medical Writer', expertise: ['Health', 'Wellness', 'Medical'], formalityScale: 8 },
      { name: 'Wellness Coach', role: 'Health Advocate', expertise: ['Lifestyle', 'Prevention', 'Nutrition'], formalityScale: 5 },
    ],
    'Finance': [
      { name: 'Financial Analyst', role: 'Expert', expertise: ['Markets', 'Investment', 'Analysis'], formalityScale: 8 },
      { name: 'Money Coach', role: 'Advisor', expertise: ['Personal Finance', 'Budgeting', 'Savings'], formalityScale: 6 },
    ],
    'Technology': [
      { name: 'Tech Lead', role: 'Developer Advocate', expertise: ['Engineering', 'Architecture', 'Code'], formalityScale: 6 },
      { name: 'Product Expert', role: 'Writer', expertise: ['Reviews', 'Comparisons', 'Guides'], formalityScale: 5 },
    ],
  }

  return contributorMap[industry] || [
    { name: 'Industry Expert', role: 'Writer', expertise: ['Analysis', 'Insights', 'Trends'], formalityScale: 6 },
    { name: 'Content Specialist', role: 'Editor', expertise: ['Guides', 'How-to', 'Tips'], formalityScale: 5 },
  ]
}

async function analyzeWithAI(
  url: string,
  context: string | undefined,
  apiKey: string
): Promise<Partial<BrandProfile> | null> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Analyze this website URL and provide brand profile information:

URL: ${url}
Additional Context: ${context || 'None'}

Respond ONLY with valid JSON in this exact format:
{
  "industry": "Industry classification",
  "tone": 7,
  "audience": "Target audience description",
  "keywords": ["Keyword1", "Keyword2", "Keyword3", "Keyword4", "Keyword5"],
  "description": "Brief brand description"
}

The tone should be a number from 1-10 where 1 is very casual and 10 is very formal.`
        }],
      }),
    })

    if (!response.ok) {
      console.error('Claude API error:', response.status)
      return null
    }

    const data = await response.json()
    const content = data.content?.[0]?.text

    if (!content) return null

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    return JSON.parse(jsonMatch[0])
  } catch (err) {
    console.error('AI analysis error:', err)
    return null
  }
}
