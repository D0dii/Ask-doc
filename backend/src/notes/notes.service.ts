import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Note, NoteGenerationMode } from './entities/note.entity';
import { LlmService } from '../shared/llm-client/llm.service';
import {
  EvidencePolicyService,
  EvidencePolicyViolationError,
} from '../shared/evidence/evidence-policy.service';
import { EvidencePipelineService } from '../shared/evidence/evidence-pipeline.service';
import { LLM_MODELS } from '../shared/constants/ai-models.constants';
import { GenerateNoteDto } from './dtos/generate-note.dto';

interface ParsedGeneralKnowledgeNote {
  content: string;
  generalKnowledge: string;
  generalKnowledgeConfidence: number;
}

const MAX_UNGROUNDED_SENTENCE_RATIO = 0.1;
const MIN_SENTENCE_TOKEN_OVERLAP_RATIO = 0.35;

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private readonly noteRepository: Repository<Note>,
    private readonly llmService: LlmService,
    private readonly evidencePipelineService: EvidencePipelineService,
    private readonly evidencePolicyService: EvidencePolicyService,
  ) {}

  async create(data: {
    knowledgeHubId: string;
    ownerId: string;
    title: string;
    content: string;
  }): Promise<Note> {
    const note = this.noteRepository.create({
      knowledgeHubId: data.knowledgeHubId,
      ownerId: data.ownerId,
      title: data.title,
      content: data.content,
      generationMode: null,
      sourceMetadata: null,
    });

    return this.noteRepository.save(note);
  }

  async findAllByKnowledgeHub(
    knowledgeHubId: string,
    ownerId: string,
  ): Promise<Note[]> {
    return this.noteRepository.find({
      where: { knowledgeHubId, ownerId },
      order: { updatedAt: 'DESC' },
    });
  }

  async findOneById(
    id: string,
    knowledgeHubId: string,
    ownerId: string,
  ): Promise<Note | null> {
    return this.noteRepository.findOne({
      where: { id, knowledgeHubId, ownerId },
    });
  }

  async update(
    id: string,
    knowledgeHubId: string,
    ownerId: string,
    data: { title?: string; content?: string },
  ): Promise<Note | null> {
    const note = await this.findOneById(id, knowledgeHubId, ownerId);
    if (!note) {
      return null;
    }

    if (data.title !== undefined) {
      note.title = data.title;
    }
    if (data.content !== undefined) {
      note.content = data.content;
    }

    return this.noteRepository.save(note);
  }

  async remove(id: string, knowledgeHubId: string, ownerId: string): Promise<boolean> {
    const note = await this.findOneById(id, knowledgeHubId, ownerId);
    if (!note) {
      return false;
    }

    await this.noteRepository.remove(note);
    return true;
  }

  async generate(
    knowledgeHubId: string,
    ownerId: string,
    dto: GenerateNoteDto,
  ): Promise<Note> {
    const input = this.resolveGenerationInput(dto);

    const evidenceContext = await this.evidencePipelineService.buildContext({
      knowledgeHubId,
      query: input,
      limit: undefined,
      includeWebSources: true,
    });

    const prompt = this.buildGenerationPrompt(dto.mode, input, evidenceContext.context);

    const firstPass = await this.llmService.generateText({
      model: LLM_MODELS.GROQ.DEFAULT,
      system:
        'You are an expert note-taking assistant. Produce concise, structured notes based only on provided evidence when possible.',
      prompt: `${prompt}\n\nAt the end of your response, add one final line in this exact format:\nGENERAL_KNOWLEDGE: <text or none>\nAnd one more final line in this exact format:\nGENERAL_KNOWLEDGE_CONFIDENCE: <number between 0 and 1>`,
    });

    const parsed = await this.applyPolicyWithRegeneration(
      prompt,
      firstPass,
      evidenceContext.context,
    );

    const note = this.noteRepository.create({
      knowledgeHubId,
      ownerId,
      title: dto.title?.trim() || this.defaultGeneratedTitle(dto.mode, input),
      content: parsed.content,
      generationMode: dto.mode,
      sourceMetadata: {
        includeWebSources: false,
        sources: evidenceContext.chunks.map((chunk) => ({
          sourceType: chunk.sourceType,
          sourceRef: chunk.sourceRef,
          score: chunk.score,
        })),
      },
    });

    return this.noteRepository.save(note);
  }

  private buildGenerationPrompt(
    mode: NoteGenerationMode,
    input: string,
    evidenceContext: string,
  ): string {
    return [
      `Generation mode: ${mode}`,
      'Create a clean markdown note with a short heading and concise bullet points.',
      'If evidence is missing, explicitly state what is uncertain.',
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
    evidenceContext: string,
  ): Promise<ParsedGeneralKnowledgeNote> {
    try {
      const parsedFirstPass = this.parseGeneralKnowledgeTaggedNote(firstPass);
      this.enforceGroundingBudget(parsedFirstPass.content, evidenceContext);
      this.evidencePolicyService.enforceGeneralKnowledgeBudget({
        generatedText: parsedFirstPass.content,
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
            'You are an expert note-taking assistant. Produce concise, structured notes based strictly on provided evidence.',
          prompt: `${basePrompt}\n\nStrict rule: use only provided evidence context. If information is missing, say so.\nAt the end of your response, add one final line in this exact format:\nGENERAL_KNOWLEDGE: none\nAnd one more final line in this exact format:\nGENERAL_KNOWLEDGE_CONFIDENCE: 1.0`,
        });

        const parsedSecondPass = this.parseGeneralKnowledgeTaggedNote(secondPass);
        this.enforceGroundingBudget(parsedSecondPass.content, evidenceContext);
        this.evidencePolicyService.enforceGeneralKnowledgeBudget({
          generatedText: parsedSecondPass.content,
          generalKnowledgeText: parsedSecondPass.generalKnowledge,
          generalKnowledgeConfidence: parsedSecondPass.generalKnowledgeConfidence,
        });

        return parsedSecondPass;
      }

      throw error;
    }
  }

  private parseGeneralKnowledgeTaggedNote(response: string): ParsedGeneralKnowledgeNote {
    const lines = response
      .split('\n')
      .map((line) => line.trimEnd())
      .filter((line) => line.length > 0);

    if (lines.length < 2) {
      throw new EvidencePolicyViolationError(
        'Missing general knowledge metadata tags in model response',
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

    const generalKnowledgeRaw = knowledgeLine.slice(knowledgePrefix.length).trim();
    const confidenceRaw = confidenceLine.slice(confidencePrefix.length).trim();
    const confidence = Number.parseFloat(confidenceRaw);

    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
      throw new EvidencePolicyViolationError(
        'Invalid GENERAL_KNOWLEDGE_CONFIDENCE value',
      );
    }

    const content = lines.slice(0, -2).join('\n').trim();

    return {
      content,
      generalKnowledge:
        generalKnowledgeRaw.toLowerCase() === 'none' ? '' : generalKnowledgeRaw,
      generalKnowledgeConfidence: confidence,
    };
  }

  private defaultGeneratedTitle(mode: NoteGenerationMode, input: string): string {
    const modeLabel =
      mode === NoteGenerationMode.FROM_ANSWER
        ? 'From Answer'
        : mode === NoteGenerationMode.FROM_SELECTION
          ? 'From Selection'
          : 'From Topic Query';

    const cleanInput = input.trim().replace(/\s+/g, ' ');
    const suffix = cleanInput.length > 80 ? `${cleanInput.slice(0, 77)}...` : cleanInput;

    return `${modeLabel}: ${suffix}`;
  }

  private resolveGenerationInput(dto: GenerateNoteDto): string {
    if (dto.mode === NoteGenerationMode.FROM_TOPIC_QUERY) {
      return dto.query ?? '';
    }

    if (dto.mode === NoteGenerationMode.FROM_ANSWER) {
      return `Generate notes from chat message ${dto.messageId}`;
    }

    return dto.selectionText ?? '';
  }

  private enforceGroundingBudget(
    generatedContent: string,
    evidenceContext: string,
  ): void {
    const evidenceTokens = this.extractTokens(evidenceContext);

    if (evidenceTokens.size === 0) {
      throw new EvidencePolicyViolationError('Insufficient evidence for generation');
    }

    const sentences = this.extractSentences(generatedContent);
    if (sentences.length === 0) {
      throw new EvidencePolicyViolationError('Generated note is empty');
    }

    let unsupportedSentences = 0;
    for (const sentence of sentences) {
      const sentenceTokens = this.extractTokens(sentence);
      if (sentenceTokens.size === 0) {
        continue;
      }

      let overlap = 0;
      for (const token of sentenceTokens) {
        if (evidenceTokens.has(token)) {
          overlap += 1;
        }
      }

      const sentenceOverlapRatio = overlap / sentenceTokens.size;
      if (sentenceOverlapRatio < MIN_SENTENCE_TOKEN_OVERLAP_RATIO) {
        unsupportedSentences += 1;
      }
    }

    const unsupportedRatio = unsupportedSentences / sentences.length;
    if (unsupportedRatio > MAX_UNGROUNDED_SENTENCE_RATIO) {
      throw new EvidencePolicyViolationError(
        'Generated note exceeds allowed ungrounded content budget',
      );
    }
  }

  private extractSentences(text: string): string[] {
    return text
      .split(/[.!?]\s+/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length > 0);
  }

  private extractTokens(text: string): Set<string> {
    return new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((token) => token.length >= 4),
    );
  }
}
