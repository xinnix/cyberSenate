import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private _client: OpenAI | null = null;

  private get client(): OpenAI {
    if (!this._client) {
      const apiKey = process.env.DEEPSEEK_API_KEY;
      if (!apiKey) {
        throw new Error('DEEPSEEK_API_KEY 环境变量未设置，无法调用 LLM');
      }
      this._client = new OpenAI({ apiKey, baseURL: 'https://api.deepseek.com' });
    }
    return this._client;
  }

  async chat(messages: LLMMessage[], options?: LLMOptions): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: 'deepseek-chat',
      messages,
      temperature: options?.temperature ?? 0.8,
      max_tokens: options?.maxTokens ?? 4096,
    });

    return response.choices[0]?.message?.content ?? '';
  }
}
