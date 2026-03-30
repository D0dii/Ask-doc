import { Injectable } from '@nestjs/common';
import { generateText, embed, embedMany } from 'ai';
import { groq } from '@ai-sdk/groq';
import { ollama } from 'ai-sdk-ollama';
import type { LlmClientPort } from './llm-client.port';

@Injectable()
export class AiSdkLlmClientService implements LlmClientPort {
  async generateText(params: {
    model: string;
    prompt: string;
    system?: string;
  }): Promise<string> {
    const { text } = await generateText({
      model: groq(params.model),
      prompt: params.prompt,
      system: params.system,
    });

    return text;
  }

  async embed(params: { model: string; value: string }): Promise<number[]> {
    const { embedding } = await embed({
      model: ollama.embedding(params.model),
      value: params.value,
    });

    return embedding;
  }

  async embedMany(params: {
    model: string;
    values: string[];
  }): Promise<number[][]> {
    const { embeddings } = await embedMany({
      model: ollama.embedding(params.model),
      values: params.values,
    });

    return embeddings;
  }
}
