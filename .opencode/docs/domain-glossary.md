# Domain Glossary

- Workspace: a user-owned container for files and conversations.
- File: uploaded PDF tracked in relational storage and indexing pipeline.
- Ingestion: extract PDF text, split into chunks, create embeddings, index vectors.
- Chunk: smallest retrievable text segment stored with metadata.
- Retrieval: semantic search over workspace-filtered vectors.
- Citation/Source: chunk reference returned with an answer for grounding.
- Conversation: chat thread under a workspace.
- Message: user or assistant entry in a conversation.
- Query rewrite: converting follow-up prompts into standalone questions.
