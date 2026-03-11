# AI Chatbot & RAG System Features

## Current Capabilities

### 1. Multi-Tier Retrieval Pipeline (Cost-Optimized)
- **FAQ Quick Match**: ~10 pre-canned answers (zero API cost) for common questions
- **Full-Text Search (FTS)**: PostgreSQL-native semantic keyword search
- **Vector Similarity**: pgvector (512-dim embeddings via `text-embedding-3-small`)
- **Result**: ~70% of queries answered by FAQ or FTS; only 30% hit expensive embeddings

### 2. Knowledge Base Indexing
- **Structural Chunking**: Course → Module → Resource level organization
- **Content Hashing**: SHA-256 dirty-check prevents re-embedding unchanged content
- **Automatic Scheduling**: Daily 3 AM index run via `rag:index` Artisan command
- **Supports**: Text resources, mentor notes, course descriptions, modules, prerequisites
- **Skips**: Video/link resources without indexable text

### 3. Cost Optimization
- **Reduced Dimensionality**: 512-dim vectors vs default 1536 (3× cost reduction)
- **Query Embedding Cache**: 24-hour TTL prevents re-embedding identical queries
- **Graceful Degradation**: Falls back to FTS when vector DB not ready; falls back to direct content if chunks not indexed
- **Content Filtering**: Strips HTML, removes excess whitespace before embedding

### 4. Context-Aware Responses
- **Platform Chat**: Lists all enrolled courses + endorsed skills
- **Course Chat**: Highlights current course progress, shows completion %, other courses briefly
- **Resource Chat**: Shows resource-specific context + course progress (falls back if resource chunks empty)
- **User Progress Context**: Injected once per request via `UserProgressSummary` value object
  - Enrolled courses with completion %
  - Endorsed skills count
  - Recently completed resources (last 5)

### 5. Scope-Filtered Retrieval
- Platform queries search all indexed content
- Course context queries search only that course's resources
- Resource context queries search only that resource (with course fallback)
- Prevents information leakage between courses

### 6. AI Integration
- **Provider**: OpenAI (`text-embedding-3-small` for embeddings, configurable chat model)
- **Streaming**: Real-time response chunks via `streamChat()` callback
- **Embedding Cache**: Prevents redundant API calls for identical text
- **Contract-Based**: `AiProvider` interface allows swapping providers (Anthropic, local, etc.)

### 7. Role-Based Behavior
- **Guests**: No progress context; can access free resources
- **Authenticated Learners**: Full progress context; personalized recommendations
- **Mentors**: Can see enrollment/completion context when chatting in their courses
- **System Prompts**: Dynamically generated based on user tier (free vs paid)

## Architecture Overview

```
User Query
    ↓
[AiChatController]
    ↓
┌─────────────────────────────────────┐
│ 1. Load User Progress (DB query)    │ → UserProgressSummary
│ 2. Build Context Meta               │ → ChatContextMeta
│ 3. Retrieve Relevant Knowledge      │ → RagRetriever
│ 4. Build System Prompt              │ → Context Builders
└─────────────────────────────────────┘
    ↓
[AiProvider.streamChat()]
    ↓
Personalized Response with Retrieved Knowledge
```

## Files & Components

| File | Purpose |
|------|---------|
| `app/Services/KnowledgeChunker` | Splits courses/modules/resources into indexable chunks |
| `app/Services/RagRetriever` | Three-tier retrieval (FAQ→FTS→vector) |
| `app/Services/OpenAiProvider` | Embedding + streaming via OpenAI API |
| `app/AiChat/UserProgressSummary` | Value object for user learning context |
| `app/AiChat/ChatContextMeta` | Metadata passed to all context builders |
| `app/AiChat/PlatformChatContext` | System prompt for platform-level chat |
| `app/AiChat/CourseChatContext` | System prompt for course-level chat |
| `app/AiChat/ResourceChatContext` | System prompt for resource-level chat |
| `app/Console/Commands/IndexKnowledge` | `rag:index` Artisan command |
| `config/chat-faq.php` | FAQ knowledge base (pre-canned answers) |
| `database/migrations/...create_knowledge_chunks_table` | pgvector table + HNSW index |
| `tests/Feature/UserProgressSummaryTest` | Progress context tests |
| `tests/Feature/RagIndexCommandTest` | Indexing & dirty-check tests |
| `tests/Feature/RagRetrieverTest` | Retrieval pipeline tests |

## Extensibility

### Adding New Progress Signals
Only modify `UserProgressSummary.php`:
```php
// In forUser() factory, add new queries:
$streaks = $user->computeStreaks(); // hypothetical

// In toPromptSection(), add to output:
$lines[] = "Current Streak: {$streaks->current}";
```

**No changes needed** to controller, context builders, or RAG system.

### Swapping AI Providers
Implement `AiProvider` contract and bind in `AppServiceProvider`:
```php
$this->app->bind(AiProvider::class, AnthropicProvider::class);
```

### Adjusting Retrieval Sensitivity
Edit thresholds in `RagRetriever`:
- FTS rank threshold: `0.05`
- Vector similarity distance: `0.35`

## Testing

**233 tests passing** covering:
- Knowledge chunking (empty resource skipping, HTML stripping, paragraph splitting)
- Indexing (dirty-check, fresh flag, course filtering)
- Retrieval (FAQ, FTS, vector similarity, scope filtering)
- User progress context (enrollments, endorsements, prompt formatting)
- Chat integration (progress in system prompts)

Run with: `php artisan test --compact`

## Known Limitations / Future Work

1. **Multilingual RAG**: Currently indexes only default locale; doesn't separate en/bn chunks
2. **Admin Knowledge Base Upload**: Plan allows admins to upload docs/PDFs; not yet implemented
3. **Admin Dashboard**: No visibility into indexed chunks, retrieval metrics, or cache performance
4. **Follow-Up Context**: Chat maintains history (via ChatSession), but RAG doesn't prioritize recent messages
5. **Cost Tracking**: No logging of embedding API calls or cost per query
6. **Fallback Clarity**: When RAG returns no chunks, system note says "check the page" — could be more specific
