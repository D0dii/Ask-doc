import { RerankerService } from './reranker.service';
import type { EvidenceChunk } from '../../shared/evidence/evidence.types';

describe('RerankerService', () => {
  it('caps general knowledge chunks to 15 percent', () => {
    const service = new RerankerService();

    const semantic: EvidenceChunk[] = Array.from({ length: 8 }).map(
      (_, index) => ({
        sourceType: 'retrieved_doc',
        content: `semantic-${index}`,
        sourceRef: `file-${index}`,
        score: 0.9 - index * 0.01,
      }),
    );

    const generalKnowledge: EvidenceChunk[] = Array.from({ length: 6 }).map(
      (_, index) => ({
        sourceType: 'general_knowledge',
        content: `gk-${index}`,
        score: 0.8 - index * 0.01,
      }),
    );

    const chunks = service.fuse({
      semantic,
      keyword: [],
      web: [],
      generalKnowledge,
      limit: 10,
      maxGeneralKnowledgeRatio: 0.15,
    });

    const generalCount = chunks.filter(
      (chunk) => chunk.sourceType === 'general_knowledge',
    ).length;

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.length).toBeLessThanOrEqual(10);
    expect(generalCount).toBeLessThanOrEqual(1);
  });
});
