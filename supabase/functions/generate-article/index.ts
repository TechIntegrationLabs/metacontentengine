/**
 * Edge Function: generate-article
 *
 * AI-powered article generation pipeline.
 * Handles the full generation flow: context → draft → humanization → QA
 *
 * Usage:
 *   POST /functions/v1/generate-article
 *   Body: {
 *     "topic": "Article topic",
 *     "primaryKeyword": "target keyword",
 *     "contentType": "guide" | "ranking" | "listicle" | "how-to",
 *     "contributorId": "uuid" (optional),
 *     "targetWordCount": 2000 (optional),
 *     "outline": [...] (optional)
 *   }
 *
 * Returns streaming progress updates and final article content
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import {
  createUserClient,
  createAdminClient,
  getTenantContext,
  handleCors,
  jsonResponse,
  errorResponse,
  corsHeaders,
} from '../_shared/supabase-client.ts'

// Types
interface GenerateRequest {
  topic: string
  primaryKeyword?: string
  contentType: string
  contributorId?: string
  targetWordCount?: number
  outline?: string[]
  clusterId?: string
  ideaId?: string
}

interface PipelineStage {
  name: string
  progress: number
}

const STAGES: PipelineStage[] = [
  { name: 'INITIALIZING', progress: 0 },
  { name: 'GATHERING_CONTEXT', progress: 10 },
  { name: 'SELECTING_CONTRIBUTOR', progress: 20 },
  { name: 'GENERATING_OUTLINE', progress: 30 },
  { name: 'DRAFTING', progress: 40 },
  { name: 'HUMANIZING', progress: 60 },
  { name: 'QUALITY_CHECK', progress: 80 },
  { name: 'FINALIZING', progress: 90 },
  { name: 'COMPLETE', progress: 100 },
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
    // Get tenant context
    const context = await getTenantContext(req)
    if (!context) {
      return errorResponse('Unauthorized', 401)
    }

    const body: GenerateRequest = await req.json()

    // Validate required fields
    if (!body.topic) {
      return errorResponse('Topic is required')
    }

    if (!body.contentType) {
      return errorResponse('Content type is required')
    }

    const userClient = createUserClient(req)
    const admin = createAdminClient()

    // Create pipeline run record
    const { data: pipelineRun, error: pipelineError } = await userClient
      .from('pipeline_runs')
      .insert({
        tenant_id: context.tenantId,
        topic: body.topic,
        primary_keyword: body.primaryKeyword,
        content_type: body.contentType,
        contributor_id: body.contributorId,
        stage: 'INITIALIZING',
        progress: 0,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (pipelineError) {
      console.error('Failed to create pipeline run:', pipelineError)
      return errorResponse('Failed to start generation', 500)
    }

    // Helper to update pipeline stage
    const updateStage = async (stage: string, progress: number, data?: Record<string, unknown>) => {
      await userClient
        .from('pipeline_runs')
        .update({
          stage,
          progress,
          ...data,
        })
        .eq('id', pipelineRun.id)
    }

    // Get tenant settings
    const { data: settings } = await userClient
      .from('tenant_settings')
      .select('key, value')
      .eq('tenant_id', context.tenantId)

    const generationSettings = settings?.find(s => s.key === 'generation')?.value || {}
    const targetWordCount = body.targetWordCount || generationSettings.defaultWordCount || 2000

    // STAGE: Gathering Context
    await updateStage('GATHERING_CONTEXT', 10)

    // Get tenant domain rules
    const { data: domainRules } = await userClient
      .from('tenant_domain_rules')
      .select('domain, rule_type')
      .eq('tenant_id', context.tenantId)
      .eq('is_active', true)

    const blockedDomains = domainRules?.filter(r => r.rule_type === 'blocked').map(r => r.domain) || []
    const allowedDomains = domainRules?.filter(r => r.rule_type === 'allowed').map(r => r.domain) || []

    // Get banned phrases
    const { data: bannedPhrases } = await userClient
      .from('tenant_banned_phrases')
      .select('phrase, phrase_type')
      .eq('tenant_id', context.tenantId)
      .eq('is_active', true)

    // STAGE: Selecting Contributor
    await updateStage('SELECTING_CONTRIBUTOR', 20)

    let contributor
    if (body.contributorId) {
      const { data } = await userClient
        .from('contributors')
        .select('*')
        .eq('id', body.contributorId)
        .single()
      contributor = data
    } else {
      // Auto-select based on content type and expertise
      const { data } = await userClient
        .from('contributors')
        .select('*')
        .eq('tenant_id', context.tenantId)
        .eq('is_active', true)
        .contains('content_types', [body.contentType])
        .limit(1)
        .single()

      if (!data) {
        // Fall back to default contributor
        const { data: defaultContributor } = await userClient
          .from('contributors')
          .select('*')
          .eq('tenant_id', context.tenantId)
          .eq('is_default', true)
          .single()
        contributor = defaultContributor
      } else {
        contributor = data
      }
    }

    if (!contributor) {
      await updateStage('ERROR', 0, { error: 'No contributor found' })
      return errorResponse('No contributor available', 400)
    }

    await userClient
      .from('pipeline_runs')
      .update({ contributor_id: contributor.id })
      .eq('id', pipelineRun.id)

    // STAGE: Generating Outline
    await updateStage('GENERATING_OUTLINE', 30)

    // Get API key for Grok
    const { data: grokKey } = await admin.rpc('get_decrypted_api_key', {
      p_tenant_id: context.tenantId,
      p_service: 'grok',
    })

    if (!grokKey) {
      await updateStage('ERROR', 0, { error: 'Grok API key not configured' })
      return errorResponse('Grok API key not configured. Please add it in Settings.', 400)
    }

    // Build the generation prompt
    const voiceProfile = contributor.voice_profile || {}
    const outlinePrompt = buildOutlinePrompt(body, voiceProfile, targetWordCount)

    // Call Grok for outline (placeholder - implement actual API call)
    let outline = body.outline
    if (!outline) {
      // TODO: Implement actual Grok API call
      outline = [
        'Introduction',
        'Key Point 1',
        'Key Point 2',
        'Key Point 3',
        'FAQs',
        'Conclusion',
      ]
    }

    await updateStage('GENERATING_OUTLINE', 35, { outline: JSON.stringify(outline) })

    // STAGE: Drafting
    await updateStage('DRAFTING', 40)

    const draftPrompt = buildDraftPrompt(body, voiceProfile, outline, targetWordCount, bannedPhrases)

    // TODO: Implement actual Grok API call for drafting
    // For now, return a placeholder response

    const draftContent = `
# ${body.topic}

This is a placeholder article draft. In production, this would be generated by Grok API.

## Introduction

Lorem ipsum dolor sit amet, consectetur adipiscing elit.

## Key Points

- Point 1 about ${body.primaryKeyword || body.topic}
- Point 2 with supporting details
- Point 3 with actionable advice

## Conclusion

Summary of the main points covered in this article.

---
*Generated by Meta Content Engine*
    `.trim()

    await updateStage('DRAFTING', 55, { generated_content: draftContent })

    // STAGE: Humanizing
    await updateStage('HUMANIZING', 60)

    // Get StealthGPT key if humanization is enabled
    const { data: stealthKey } = await admin.rpc('get_decrypted_api_key', {
      p_tenant_id: context.tenantId,
      p_service: 'stealthgpt',
    })

    let humanizedContent = draftContent
    if (stealthKey) {
      // TODO: Implement StealthGPT API call
      humanizedContent = draftContent // Placeholder
    }

    await updateStage('HUMANIZING', 75)

    // STAGE: Quality Check
    await updateStage('QUALITY_CHECK', 80)

    // Calculate basic quality metrics
    const wordCount = humanizedContent.split(/\s+/).length
    const qualityScore = Math.min(100, Math.round(
      (wordCount >= targetWordCount * 0.8 ? 30 : 15) +
      (humanizedContent.includes('## ') ? 20 : 10) +
      (humanizedContent.includes('- ') ? 15 : 5) +
      35 // Base score
    ))

    await updateStage('QUALITY_CHECK', 85)

    // STAGE: Finalizing
    await updateStage('FINALIZING', 90)

    // Create article record
    const { data: article, error: articleError } = await userClient
      .from('articles')
      .insert({
        tenant_id: context.tenantId,
        title: body.topic,
        slug: body.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        content: humanizedContent,
        status: 'draft',
        contributor_id: contributor.id,
        primary_keyword: body.primaryKeyword,
        cluster_id: body.clusterId,
        quality_score: qualityScore,
        word_count: wordCount,
        reading_time: Math.ceil(wordCount / 200),
        created_by: context.userId,
      })
      .select()
      .single()

    if (articleError) {
      console.error('Failed to create article:', articleError)
      await updateStage('ERROR', 0, { error: 'Failed to save article' })
      return errorResponse('Failed to save article', 500)
    }

    // Update content idea if provided
    if (body.ideaId) {
      await userClient
        .from('content_ideas')
        .update({
          status: 'generated',
          article_id: article.id,
        })
        .eq('id', body.ideaId)
    }

    // Complete pipeline
    await updateStage('COMPLETE', 100, {
      article_id: article.id,
      completed_at: new Date().toISOString(),
      tokens_used: 0, // TODO: Track actual tokens
      estimated_cost: 0, // TODO: Calculate cost
    })

    // Log AI usage
    await userClient.from('ai_usage').insert({
      tenant_id: context.tenantId,
      provider: 'grok',
      model: 'grok-2',
      input_tokens: 1000, // Placeholder
      output_tokens: wordCount,
      total_tokens: 1000 + wordCount,
      cost: 0.01, // Placeholder
      operation: 'article_generation',
      pipeline_run_id: pipelineRun.id,
    })

    return jsonResponse({
      success: true,
      articleId: article.id,
      pipelineRunId: pipelineRun.id,
      qualityScore,
      wordCount,
      message: 'Article generated successfully',
    })

  } catch (err) {
    console.error('Error:', err)
    return errorResponse('Internal server error', 500)
  }
})

// Helper functions

function buildOutlinePrompt(
  request: GenerateRequest,
  voiceProfile: Record<string, unknown>,
  targetWordCount: number
): string {
  return `
Create an outline for an article about: ${request.topic}

Content Type: ${request.contentType}
Target Word Count: ${targetWordCount}
Primary Keyword: ${request.primaryKeyword || request.topic}

Voice Profile:
${voiceProfile.description || 'Professional and informative'}

Guidelines:
${voiceProfile.guidelines || 'Write clearly and helpfully'}

Create a detailed outline with main sections and key points to cover.
  `.trim()
}

function buildDraftPrompt(
  request: GenerateRequest,
  voiceProfile: Record<string, unknown>,
  outline: string[],
  targetWordCount: number,
  bannedPhrases: Array<{ phrase: string; phrase_type: string }> | null
): string {
  const phrasesToAvoid = [
    ...(voiceProfile.phrasesToAvoid as string[] || []),
    ...(bannedPhrases?.map(p => p.phrase) || []),
  ]

  return `
Write a comprehensive article about: ${request.topic}

Content Type: ${request.contentType}
Target Word Count: ${targetWordCount}
Primary Keyword: ${request.primaryKeyword || request.topic}

Outline:
${outline.map((item, i) => `${i + 1}. ${item}`).join('\n')}

Voice Profile:
${voiceProfile.description || 'Professional and informative'}

Guidelines:
${voiceProfile.guidelines || 'Write clearly and helpfully'}

Signature Phrases to Use:
${(voiceProfile.signaturePhrases as string[] || []).join(', ') || 'None specified'}

Phrases to AVOID:
${phrasesToAvoid.join(', ') || 'None specified'}

Write the full article following the outline and voice profile.
  `.trim()
}
