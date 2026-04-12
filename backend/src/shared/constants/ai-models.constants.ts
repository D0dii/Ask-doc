/**
 * AI Model Configuration Constants
 *
 * Centralized configuration for all AI models used in the application.
 * Change model names, providers, or settings in one place.
 */

// ==================== LLM MODELS ====================

export const LLM_MODELS = {
  /** Groq LLM models */
  GROQ: {
    /** Default model for all LLM operations */
    DEFAULT: 'llama-3.3-70b-versatile' as const,
  },
} as const;

// ==================== EMBEDDING MODELS ====================

export const EMBEDDING_MODELS = {
  /** Ollama embedding models */
  OLLAMA: {
    /** Default model for document embeddings */
    DEFAULT: 'nomic-embed-text-v2-moe' as const,
    /** Embedding dimensions (must match model output) */
    DIMENSIONS: 768,
  },
} as const;

// ==================== RAG CONFIGURATION ====================

export const RAG_CONFIG = {
  /** Qdrant collection name */
  COLLECTION_NAME: 'ask_doc',

  /** Vector similarity metric */
  DISTANCE_METRIC: 'Cosine' as const,

  /** Text chunking settings */
  CHUNK_SIZE: 1000,
  CHUNK_OVERLAP: 200,

  /** Embedding batch size (API limits) */
  EMBEDDING_BATCH_SIZE: 100,

  /** Number of search results to return */
  DEFAULT_SEARCH_LIMIT: 5,
} as const;

// ==================== CHAT CONFIGURATION ====================

export const CHAT_CONFIG = {
  /** Number of previous messages to include as context (N messages = N/2 Q&A pairs) */
  MAX_CONTEXT_MESSAGES: 6,

  /** Max title length for auto-generated conversation titles */
  MAX_TITLE_LENGTH: 50,
} as const;

// ==================== GENERATION POLICY ====================

export const GENERATION_POLICY = {
  GENERAL_KNOWLEDGE_BUDGET_PERCENT: 10,
  GENERAL_KNOWLEDGE_EVIDENCE_RATIO_MAX: 0.15,
  MAX_REGENERATE_ATTEMPTS: 2,
  INCLUDE_WEB_BY_DEFAULT: true,
} as const;
