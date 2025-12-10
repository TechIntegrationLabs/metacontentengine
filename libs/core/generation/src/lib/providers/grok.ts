import { AIProvider, GenerationRequest, GenerationResult, ArticleOutline, HumanizationRequest, HumanizationResult, ContributorVoice } from '../types';

const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

interface GrokConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export class GrokProvider implements AIProvider {
  name = 'grok';
  private config: GrokConfig;

  constructor(config: GrokConfig) {
    this.config = {
      model: 'grok-3-turbo',
      temperature: 0.7,
      maxTokens: 8000,
      ...config,
    };
  }

  private async callGrok(messages: Array<{ role: string; content: string }>): Promise<{ content: string; usage: { input: number; output: number } }> {
    const response = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.config.apiKey,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error('Grok API error: ' + response.statusText);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      usage: {
        input: data.usage?.prompt_tokens || 0,
        output: data.usage?.completion_tokens || 0,
      },
    };
  }

  private buildSystemPrompt(voice: ContributorVoice): string {
    return 'You are an expert content writer with a specific voice and style.\n\n' +
      'VOICE PROFILE:\n' +
      '- Formality Level: ' + voice.formalityScale + '/10 (1=very formal, 10=very casual)\n' +
      '- Voice Description: ' + voice.description + '\n' +
      (voice.guidelines ? '- Writing Guidelines: ' + voice.guidelines + '\n' : '') +
      (voice.signaturePhrases.length ? '- Use these phrases naturally: ' + voice.signaturePhrases.join(', ') + '\n' : '') +
      (voice.transitionWords.length ? '- Preferred transitions: ' + voice.transitionWords.join(', ') + '\n' : '') +
      (voice.phrasesToAvoid.length ? '- NEVER use these phrases: ' + voice.phrasesToAvoid.join(', ') + '\n' : '') +
      '\nWrite naturally and engagingly. Focus on value and readability.';
  }

  async generateContent(request: GenerationRequest): Promise<GenerationResult> {
    try {
      const systemPrompt = this.buildSystemPrompt(request.contributorVoice);
      
      let userPrompt = 'Write a comprehensive ' + request.contentType + ' about: ' + request.topic + '\n\n';
      
      if (request.primaryKeyword) {
        userPrompt += 'Primary keyword (use naturally 3-5 times): ' + request.primaryKeyword + '\n';
      }
      
      if (request.secondaryKeywords?.length) {
        userPrompt += 'Secondary keywords: ' + request.secondaryKeywords.join(', ') + '\n';
      }
      
      if (request.targetWordCount) {
        userPrompt += 'Target word count: approximately ' + request.targetWordCount + ' words\n';
      }
      
      if (request.outline) {
        userPrompt += '\nFollow this outline:\n' + JSON.stringify(request.outline, null, 2);
      }
      
      userPrompt += '\n\nFormat the article in Markdown with proper headings (##, ###).';
      
      if (request.seoOptimize) {
        userPrompt += '\n\nInclude a compelling meta title and meta description at the end.';
      }

      const result = await this.callGrok([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);

      // Calculate estimated cost (Grok pricing)
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
    const result = await this.callGrok([
      {
        role: 'system',
        content: 'You are an expert content strategist. Generate detailed article outlines in JSON format.',
      },
      {
        role: 'user',
        content: 'Create a detailed outline for a ' + contentType + ' about: ' + topic + '\n\n' +
          'Return ONLY valid JSON with this structure:\n' +
          '{\n' +
          '  "title": "Article title",\n' +
          '  "hook": "Opening hook paragraph",\n' +
          '  "sections": [\n' +
          '    { "heading": "Section title", "level": 2, "keyPoints": ["point 1", "point 2"], "targetWords": 200 }\n' +
          '  ],\n' +
          '  "conclusion": "Conclusion summary",\n' +
          '  "targetWordCount": 1500\n' +
          '}',
      },
    ]);

    try {
      return JSON.parse(result.content);
    } catch {
      throw new Error('Failed to parse outline response');
    }
  }

  async humanizeContent(request: HumanizationRequest): Promise<HumanizationResult> {
    try {
      const aggressivenessPrompts = {
        light: 'Make subtle improvements to make the text sound more natural and human-written. Preserve the structure.',
        medium: 'Significantly rework the text to sound naturally human-written. Vary sentence structure and add personality.',
        heavy: 'Completely rewrite the content to be indistinguishable from human writing. Add unique perspectives and voice.',
      };

      const result = await this.callGrok([
        {
          role: 'system',
          content: 'You are an expert editor who makes AI-generated content sound naturally human-written.\n\n' +
            'VOICE TO MATCH:\n' + JSON.stringify(request.contributorVoice, null, 2),
        },
        {
          role: 'user',
          content: aggressivenessPrompts[request.aggressiveness] + '\n\n' +
            'CONTENT TO HUMANIZE:\n\n' + request.content,
        },
      ]);

      return {
        success: true,
        content: result.content,
        changes: Math.round(result.usage.output * 0.3), // Rough estimate of changes
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

export default GrokProvider;
