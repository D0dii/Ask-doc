import { Injectable } from '@nestjs/common';

export const GENERAL_KNOWLEDGE_BUDGET_EXCEEDED =
  'GENERAL_KNOWLEDGE_BUDGET_EXCEEDED' as const;

export class EvidencePolicyViolationError extends Error {
  readonly code = GENERAL_KNOWLEDGE_BUDGET_EXCEEDED;
  readonly shouldRegenerate = true;

  constructor(message = 'General knowledge budget exceeded') {
    super(message);
    this.name = 'EvidencePolicyViolationError';
  }
}

export interface EnforceGeneralKnowledgeBudgetInput {
  generatedText: string;
  generalKnowledgeText?: string;
  generalKnowledgeConfidence?: number;
}

@Injectable()
export class EvidencePolicyService {
  private static readonly GENERAL_KNOWLEDGE_BUDGET_RATIO = 0.1;

  enforceGeneralKnowledgeBudget({
    generatedText,
    generalKnowledgeText,
    generalKnowledgeConfidence,
  }: EnforceGeneralKnowledgeBudgetInput): void {
    const totalLength = generatedText.trim().length;
    const generalKnowledgeLength = generalKnowledgeText?.trim().length ?? 0;

    if (generalKnowledgeLength === 0) {
      return;
    }

    if (
      generalKnowledgeConfidence === undefined ||
      Number.isNaN(generalKnowledgeConfidence) ||
      generalKnowledgeConfidence < 0.8
    ) {
      throw new EvidencePolicyViolationError(
        'General knowledge confidence below required threshold',
      );
    }

    const ratio = generalKnowledgeLength / Math.max(totalLength, 1);

    if (ratio > EvidencePolicyService.GENERAL_KNOWLEDGE_BUDGET_RATIO) {
      throw new EvidencePolicyViolationError();
    }
  }
}
