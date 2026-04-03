# AskDoc System Map

## Backend module map
- `auth/`: Google OAuth, JWT cookies, refresh/logout/me endpoints.
- `users/`: user persistence and lookup.
- `workspaces/`: workspace CRUD and access checks.
- `documents/`: file metadata and upload lifecycle endpoints.
- `ingestion/`: PDF extraction, chunking, embeddings, indexing.
- `retrieval/`: vector search against Qdrant.
- `chat/`: query endpoint, conversations, message/source persistence.
- `shared/`: LLM and vector-store abstractions, constants.

## Frontend feature map
- `features/auth/`: auth provider and user menu/session behavior.
- `features/workspaces/`: workspace listing, creation, sidebar, page layouts.
- `features/files/`: upload/list/delete files in workspace scope.
- `features/chat/`: ask question, render messages/sources, conversation history.
- `routes/`: route hierarchy and auth-gated areas.
- `lib/api-client.ts`: generated client config + 401 refresh interceptor.

## External dependencies
- PostgreSQL: relational data and metadata.
- Qdrant: vector index and semantic retrieval.
- Ollama: local embeddings provider.
- Groq: answer generation model endpoint.
