import { Inject, Injectable } from '@nestjs/common';
import { LLM_CLIENT } from './llm-client.port';
import type { LlmClientPort } from './llm-client.port';

@Injectable()
export class LlmService {
  constructor(@Inject(LLM_CLIENT) private llmClient: LlmClientPort) {}

  generateText(params: {
    model: string;
    prompt: string;
    system?: string;
  }): Promise<string> {
    return this.llmClient.generateText(params);
  }
}
