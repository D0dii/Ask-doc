import type { VectorSearchResult } from '../../shared/vector-store/vector-store.port';

export type EvidenceSourceType =
  | 'retrieved_doc'
  | 'chat_answer'
  | 'web_source'
  | 'general_knowledge';

export interface EvidenceChunk {
  sourceType: EvidenceSourceType;
  content: string;
  sourceRef?: string;
  score?: number;
  metadata?: Record<string, unknown>;
}

export interface BuildEvidenceContextInput {
  knowledgeHubId: string;
  query: string;
  limit?: number;
  includeWebSources?: boolean;
}

export interface BuildEvidenceContextResult {
  chunks: EvidenceChunk[];
  context: string;
  sources: VectorSearchResult[];
  retrieved: EvidenceChunk[];
  web: EvidenceChunk[];
}

export interface RetrievedEvidenceResult {
  sources: VectorSearchResult[];
  evidenceChunks: EvidenceChunk[];
}
