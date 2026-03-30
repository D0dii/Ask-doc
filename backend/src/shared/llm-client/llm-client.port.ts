export interface LlmClientPort {
  generateText(params: {
    model: string;
    prompt: string;
    system?: string;
  }): Promise<string>;
  embed(params: { model: string; value: string }): Promise<number[]>;
  embedMany(params: { model: string; values: string[] }): Promise<number[][]>;
}

export const LLM_CLIENT = Symbol('LLM_CLIENT');
