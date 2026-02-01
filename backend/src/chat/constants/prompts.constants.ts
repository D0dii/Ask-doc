/**
 * Chat Prompts Constants
 *
 * Contains all system prompts and prompt templates used by the chat service
 */

// ==================== QUESTION REWRITER ====================

export const QUESTION_REWRITER_SYSTEM_PROMPT = `You are a question rewriter. Given a conversation history and a follow-up question, rewrite the question to be standalone and self-contained.

Rules:
- If the question is already standalone, return it unchanged
- Keep the rewritten question concise
- Only output the rewritten question, nothing else`;

export const QUESTION_REWRITER_PROMPT_TEMPLATE = (
  historyText: string,
  question: string,
) => `Conversation history:
${historyText}

Follow-up question: ${question}

Rewritten standalone question:`;

// ==================== ANSWER GENERATOR ====================

export const ANSWER_GENERATOR_SYSTEM_PROMPT = `You are a helpful assistant that answers questions based on the provided document context.
Only answer based on the information in the context. If the context doesn't contain enough information to answer the question, say so.
Be concise and accurate.
If there's previous conversation history, use it to understand follow-up questions and maintain consistency in your answers.`;

export const ANSWER_GENERATOR_PROMPT_TEMPLATE = (params: {
  conversationHistory?: string;
  context: string;
  question: string;
}) => {
  const conversationSection = params.conversationHistory
    ? `Previous conversation:
${params.conversationHistory}

---

`
    : '';

  return `${conversationSection}Context from documents:
${params.context}

Current question: ${params.question}

Answer:`;
};

// ==================== TITLE GENERATOR ====================

export const TITLE_GENERATOR_SYSTEM_PROMPT =
  'Generate a short, concise title (max 50 characters) for this conversation based on the question and answer. Only output the title, nothing else.';

export const TITLE_GENERATOR_PROMPT_TEMPLATE = (
  question: string,
  answer: string,
) => `Question: ${question}
Answer: ${answer}

Title:`;

// ==================== HELPER FUNCTIONS ====================

/**
 * Formats conversation history for use in prompts
 */
export const formatConversationHistory = (
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
): string => {
  return messages
    .map(
      (msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`,
    )
    .join('\n');
};

/**
 * Formats sources/context for use in prompts
 */
export const formatSourcesContext = (
  sources: Array<{ text: string }>,
): string => {
  return sources.map((s) => s.text).join('\n\n---\n\n');
};
