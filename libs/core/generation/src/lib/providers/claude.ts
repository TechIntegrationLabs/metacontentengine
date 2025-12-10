import { AIProvider, GenerationRequest, GenerationResult, ArticleOutline, HumanizationRequest, HumanizationResult, ContributorVoice } from '../types';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

interface ClaudeConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export class ClaudeProvider implements AIProvider {
  name = 'claude';
  private config: ClaudeConfig;

  constructor(config: ClaudeConfig) {
    this.config = {
      model: 'claude-sonnet-4-20250514',
      temperature: 0.7,
      maxTokens: 8000,
      ...config,
    };
  }

  private async callClaude(systemPrompt: string, userPrompt: string): Promise<{ content: string; usage: { input: number; output: number } }> {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      throw new Error('Claude API error: ' + response.statusText);
    }

    const data = await response.json();
    return {
      content: data.content[0].text,
      usage: {
        input: data.usage?.input_tokens || 0,
        output: data.usage?.output_tokens || 0,
      },
    };
  }

  private buildSystemPrompt(voice: ContributorVoice): string {
    return 'You are an expert content writer.\n\n' +
      'VOICE PROFILE:\n' +
      '- Formality: ' + voice.formalityScale + '/10\n' +
      '- Style: ' + voice.description + '\n' +
      (voice.guidelines ? '- Guidelines: ' + voice.guidelines + '\n' : '') +
      (voice.signaturePhrases.length ? '- Signature phrases: ' + voice.signaturePhrases.join(', ') + '\n' : '') +
      (voice.phrasesToAvoid.length ? '- Avoid: ' + voice.phrasesToAvoid.join(', ') + '\n' : '');
  }

  async generateContent(request: GenerationRequest): Promise<GenerationResult> {
    try {
      const systemPrompt = this.buildSystemPrompt(request.contributorVoice);
      
      let userPrompt = 'Write a ' + request.contentType + ' about: ' + request.topic;
      
      if (request.primaryKeyword) {
        userPrompt += '\nKeyword: ' + request.primaryKeyword;
      }
      
      if (request.targetWordCount) {
        userPrompt += '\nTarget: ~' + request.targetWordCount + ' words';
      }
      
      userPrompt += '\n\nFormat in Markdown.';

      const result = await this.callClaude(systemPrompt, userPrompt);

      const inputCost = (result.usage.input / 1000) * 0.003;
      const outputCost = (result.usage.output / 1000) * 0.015;

      return {
        success: true,
        content: result.content,
        usage: {
          inputTokens: result.usage.input,
          outputTokens: result.usage.output,
          totalTokens: result.usage.input + result.usage.output,
          cost: inputCost + outputCost,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async generateOutline(topic: string, contentType: string): Promise<ArticleOutline> {
    const result = await this.callClaude(
      'You are a content strategist. Generate outlines in JSON format only.',
      'Create outline for a ' + contentType + ' about: ' + topic + '. Return only valid JSON.'
    );

    try {
      return JSON.parse(result.content);
    } catch {
      throw new Error('Failed to parse outline');
    }
  }

  async humanizeContent(request: HumanizationRequest): Promise<HumanizationResult> {
    try {
      const result = await this.callClaude(
        'You are an editor making AI content sound human. Match this voice: ' + request.contributorVoice.description,
        'Humanize (' + request.aggressiveness + '):\n\n' + request.content
      );

      return {
        success: true,
        content: result.content,
        changes: Math.round(result.usage.output * 0.3),
      };
    } catch (error) {
      return {
        success: false,
        content: request.content,
        changes: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export default ClaudeProvider;
