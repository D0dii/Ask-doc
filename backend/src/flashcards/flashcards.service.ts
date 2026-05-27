import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Flashcard,
  FlashcardGenerationMode,
} from './entities/flashcard.entity';
import { LlmService } from '../shared/llm-client/llm.service';
import {
  EvidencePolicyService,
  EvidencePolicyViolationError,
} from '../retrieval/evidence/evidence-policy.service';
import { QueryOrchestratorService } from '../retrieval/services/query-orchestrator.service';
import { LLM_MODELS } from '../shared/constants/ai-models.constants';
import { GenerateFlashcardDto } from './dtos/generate-flashcard.dto';

interface ParsedGeneralKnowledgeFlashcards {
  cards: Array<{ front: string; back: string }>;
  generalKnowledge: string;
  generalKnowledgeConfidence: number;
}

@Injectable()
export class FlashcardsService {
  constructor(
    @InjectRepository(Flashcard)
    private readonly flashcardRepository: Repository<Flashcard>,
    private readonly llmService: LlmService,
    private readonly queryOrchestratorService: QueryOrchestratorService,
    private readonly evidencePolicyService: EvidencePolicyService,
  ) {}

  async create(data: {
    knowledgeHubId: string;
    ownerId: string;
    front: string;
    back: string;
  }): Promise<Flashcard> {
    const flashcard = this.flashcardRepository.create({
      knowledgeHubId: data.knowledgeHubId,
      ownerId: data.ownerId,
      front: data.front,
      back: data.back,
      generationMode: null,
      sourceMetadata: null,
    });

    return this.flashcardRepository.save(flashcard);
  }

  async findAllByKnowledgeHub(
    knowledgeHubId: string,
    ownerId: string,
  ): Promise<Flashcard[]> {
    return this.flashcardRepository.find({
      where: { knowledgeHubId, ownerId },
      order: { updatedAt: 'DESC' },
    });
  }

  async findOneById(
    id: string,
    knowledgeHubId: string,
    ownerId: string,
  ): Promise<Flashcard | null> {
    return this.flashcardRepository.findOne({
      where: { id, knowledgeHubId, ownerId },
    });
  }

  async update(
    id: string,
    knowledgeHubId: string,
    ownerId: string,
    data: { front?: string; back?: string },
  ): Promise<Flashcard | null> {
    const flashcard = await this.findOneById(id, knowledgeHubId, ownerId);
    if (!flashcard) {
      return null;
    }

    if (data.front !== undefined) {
      flashcard.front = data.front;
    }

    if (data.back !== undefined) {
      flashcard.back = data.back;
    }

    return this.flashcardRepository.save(flashcard);
  }

  async remove(
    id: string,
    knowledgeHubId: string,
    ownerId: string,
  ): Promise<boolean> {
    const flashcard = await this.findOneById(id, knowledgeHubId, ownerId);
    if (!flashcard) {
      return false;
    }

    await this.flashcardRepository.remove(flashcard);
    return true;
  }

  async generate(
    knowledgeHubId: string,
    ownerId: string,
    dto: GenerateFlashcardDto,
  ): Promise<Flashcard[]> {
    const input = this.resolveGenerationInput(dto);

    const evidenceContext = await this.queryOrchestratorService.buildContext({
      knowledgeHubId,
      query: input,
      limit: undefined,
      includeWebSources: true,
    });

    const prompt = this.buildGenerationPrompt(
      dto.mode,
      input,
      dto.count ?? 5,
      evidenceContext.context,
    );

    const firstPass = await this.llmService.generateText({
      model: LLM_MODELS.GROQ.DEFAULT,
      system:
        'You are an expert study assistant. Generate concise, accurate flashcards from provided evidence when possible.',
      prompt: `${prompt}\n\nAt the end of your response, add one final line in this exact format:\nGENERAL_KNOWLEDGE: <text or none>\nAnd one more final line in this exact format:\nGENERAL_KNOWLEDGE_CONFIDENCE: <number between 0 and 1>`,
    });

    const parsed = await this.applyPolicyWithRegeneration(prompt, firstPass);

    const cards = parsed.cards.map((card) =>
      this.flashcardRepository.create({
        knowledgeHubId,
        ownerId,
        front: card.front,
        back: card.back,
        generationMode: dto.mode,
        sourceMetadata: {
          includeWebSources: false,
          sources: evidenceContext.chunks.map((chunk) => ({
            sourceType: chunk.sourceType,
            sourceRef: chunk.sourceRef,
            score: chunk.score,
          })),
        },
      }),
    );

    return this.flashcardRepository.save(cards);
  }

  private buildGenerationPrompt(
    mode: FlashcardGenerationMode,
    input: string,
    count: number,
    evidenceContext: string,
  ): string {
    return [
      `Generation mode: ${mode}`,
      `Generate exactly ${count} flashcards.`,
      'Return only valid JSON as an array of objects with keys "front" and "back".',
      'Each "front" should be a focused question or prompt, each "back" should be a concise answer.',
      '',
      'User input:',
      input,
      '',
      'Evidence context:',
      evidenceContext || 'No evidence found.',
    ].join('\n');
  }

  private async applyPolicyWithRegeneration(
    basePrompt: string,
    firstPass: string,
  ): Promise<ParsedGeneralKnowledgeFlashcards> {
    try {
      const parsedFirstPass =
        this.parseGeneralKnowledgeTaggedFlashcards(firstPass);
      this.evidencePolicyService.enforceGeneralKnowledgeBudget({
        generatedText: JSON.stringify(parsedFirstPass.cards),
        generalKnowledgeText: parsedFirstPass.generalKnowledge,
        generalKnowledgeConfidence: parsedFirstPass.generalKnowledgeConfidence,
      });

      return parsedFirstPass;
    } catch (error) {
      if (
        error instanceof EvidencePolicyViolationError &&
        error.shouldRegenerate
      ) {
        const secondPass = await this.llmService.generateText({
          model: LLM_MODELS.GROQ.DEFAULT,
          system:
            'You are an expert study assistant. Generate concise, accurate flashcards based strictly on provided evidence.',
          prompt: `${basePrompt}\n\nStrict rule: use only provided evidence context. If information is missing, say so.\nAt the end of your response, add one final line in this exact format:\nGENERAL_KNOWLEDGE: none\nAnd one more final line in this exact format:\nGENERAL_KNOWLEDGE_CONFIDENCE: 1.0`,
        });

        const parsedSecondPass =
          this.parseGeneralKnowledgeTaggedFlashcards(secondPass);
        this.evidencePolicyService.enforceGeneralKnowledgeBudget({
          generatedText: JSON.stringify(parsedSecondPass.cards),
          generalKnowledgeText: parsedSecondPass.generalKnowledge,
          generalKnowledgeConfidence:
            parsedSecondPass.generalKnowledgeConfidence,
        });

        return parsedSecondPass;
      }

      throw error;
    }
  }

  private parseGeneralKnowledgeTaggedFlashcards(
    response: string,
  ): ParsedGeneralKnowledgeFlashcards {
    const lines = response
      .split('\n')
      .map((line) => line.trimEnd())
      .filter((line) => line.length > 0);

    if (lines.length < 3) {
      throw new EvidencePolicyViolationError(
        'Missing flashcard payload or metadata tags in model response',
      );
    }

    const confidenceLine = lines[lines.length - 1];
    const knowledgeLine = lines[lines.length - 2];
    const knowledgePrefix = 'GENERAL_KNOWLEDGE:';
    const confidencePrefix = 'GENERAL_KNOWLEDGE_CONFIDENCE:';

    if (!knowledgeLine.startsWith(knowledgePrefix)) {
      throw new EvidencePolicyViolationError(
        'Missing GENERAL_KNOWLEDGE tag in model response',
      );
    }

    if (!confidenceLine.startsWith(confidencePrefix)) {
      throw new EvidencePolicyViolationError(
        'Missing GENERAL_KNOWLEDGE_CONFIDENCE tag in model response',
      );
    }

    const jsonText = lines.slice(0, -2).join('\n').trim();
    let parsedCards: unknown;
    try {
      parsedCards = JSON.parse(jsonText);
    } catch {
      throw new EvidencePolicyViolationError('Invalid flashcards JSON payload');
    }

    if (!Array.isArray(parsedCards) || parsedCards.length === 0) {
      throw new EvidencePolicyViolationError(
        'Flashcards payload must be a non-empty array',
      );
    }

    const cards = parsedCards.map((card) => {
      if (
        !card ||
        typeof card !== 'object' ||
        !('front' in card) ||
        !('back' in card) ||
        typeof card.front !== 'string' ||
        typeof card.back !== 'string' ||
        card.front.trim().length === 0 ||
        card.back.trim().length === 0
      ) {
        throw new EvidencePolicyViolationError(
          'Each flashcard must include non-empty string front and back fields',
        );
      }

      return {
        front: card.front.trim(),
        back: card.back.trim(),
      };
    });

    const generalKnowledgeRaw = knowledgeLine
      .slice(knowledgePrefix.length)
      .trim();
    const confidenceRaw = confidenceLine.slice(confidencePrefix.length).trim();
    const confidence = Number.parseFloat(confidenceRaw);

    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
      throw new EvidencePolicyViolationError(
        'Invalid GENERAL_KNOWLEDGE_CONFIDENCE value',
      );
    }

    return {
      cards,
      generalKnowledge:
        generalKnowledgeRaw.toLowerCase() === 'none' ? '' : generalKnowledgeRaw,
      generalKnowledgeConfidence: confidence,
    };
  }

  private resolveGenerationInput(dto: GenerateFlashcardDto): string {
    if (dto.mode === FlashcardGenerationMode.FROM_TOPIC_QUERY) {
      return dto.query ?? '';
    }

    if (dto.mode === FlashcardGenerationMode.FROM_ANSWER) {
      return `Generate flashcards from chat message ${dto.messageId}`;
    }

    return dto.selectionText ?? '';
  }
}
