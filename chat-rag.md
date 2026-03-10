# Chat RAG Implementation Plan

## Architecture Overview

**Goal:** Replace manual content injection in chat context builders with RAG (Retrieval-Augmented Generation) using pgvector. Only relevant chunks are retrieved per query, minimizing token usage.

**Core stack:**
- pgvector (PostgreSQL extension) — no new infra
- `text-embedding-3-small` at 512 dimensions — lowest cost embedding
- Hybrid FTS + vector retrieval — FTS is free, vector only as fallback
- Daily batch indexing with content-hash dirty check

---

## Cost Optimizations

- Daily batch index (not per-save): mentor edits 10× → 1 embedding run
- Content hash on chunks: only re-embed if content actually changed
- Cache query embeddings 24h: same question from 10 users = 1 API call
- FTS first: skip embedding for 60–70% of queries (exact keyword matches)
- 512-dim embeddings: 3× smaller than default 1536
- Skip non-text resources (video/link) with no meaningful body
- FAQ/keyword shortcut layer: zero API cost for top ~10 common questions
- Aggressive guest rate limiting (5 msg/hr vs 20/min for auth users)

---

## Step 1: Database — pgvector + knowledge_chunks table

- Enable `pgvector` extension via migration (`CREATE EXTENSION IF NOT EXISTS vector`)
- Create `knowledge_chunks` table: `id`, `source_type`, `source_id`, `chunk_text`, `embedding` (vector(512)), `content_hash` (string), `metadata` (json), `timestamps`
- Create HNSW index on embedding column for fast similarity search

**Self-critique:** pgvector must be installed on the server. Migration will fail otherwise.
→ Add a check/helpful error. Sail's Postgres supports it since v1.18+.

---

## Step 2: embed() on AiProvider

- Add `embed(string $text): array` to `AiProvider` contract
- Implement in `OpenAiProvider` using `text-embedding-3-small` with `dimensions: 512`
- Cache: SHA-256 hash of text → vector, TTL 24h. Cache key includes model name.

**Self-critique:** Cache key must include model name — changing model later would serve stale wrong-dimension vectors.

---

## Step 3: KnowledgeChunker service

`App\Services\KnowledgeChunker` — produces chunks from a Course:
- **Course chunk:** title + description + difficulty + category
- **Module chunk:** module title + description + resource title list
- **Resource chunk:** title + type + mentor_note + why_this_resource + stripped content (~2000 chars)
- Strip HTML (TipTap output) before embedding — plain text only
- Skip resources with no meaningful text (video/link with only a title)
- Split long text at paragraph boundaries if stripped content > 2000 chars

**Self-critique:** `content` is HTML. Must strip tags before chunking. For most resources this is small — avoid over-engineering the splitter.

---

## Step 4: Indexing command + scheduling

- `php artisan rag:index` — queries published courses
- For each resource: compute hash of chunk-relevant fields; skip if matches stored `content_hash`
- Delete stale chunks for changed resources, re-create them
- Delete orphan chunks for deleted resources (cascade or cleanup pass)
- Schedule daily at 3 AM in `routes/console.php`
- Callable manually for first-time setup

**Self-critique:** Timestamp comparison alone re-embeds on non-content saves (e.g. `order` change).
→ `content_hash` solves this — only embed when content actually differs.

---

## Step 5: RagRetriever service

`App\Services\RagRetriever::retrieve(string $query, ?string $sourceType, ?int $sourceId, int $limit = 5)`

Flow:
1. Check FAQ cache (step 7) first → return canned answer (zero API cost)
2. PostgreSQL FTS (`to_tsvector/to_tsquery`) with `ts_rank` threshold → if ≥ 3 quality results, return them
3. Fallback: embed query → cosine similarity `<=>` → filter by source scope → top-K
4. If best score < 0.35 → return empty (signals "no relevant knowledge found")

**Self-critique:** FTS and vector are sequential fallbacks, not merged — this is intentional. FTS result quality checked by `ts_rank` threshold, not just count. Otherwise 3 garbage results would block vector search.

---

## Step 6: Update ChatContext builders

- `PlatformChatContext`: `retrieve(query, null, null)` — all content
- `CourseChatContext`: `retrieve(query, 'course', $courseId)`
- `ResourceChatContext`: `retrieve(query, 'resource', $resourceId)` → fallback to course-scoped if empty
- Retrieved chunks → inject "Answer based ONLY on the following context:" + chunks
- Empty retrieval → inject "You don't have specific information about this. Say so honestly."
- For general conversation (greetings etc.) → respond normally; only apply ONLY-rule for platform/content questions

**Self-critique:** "ONLY" instruction too aggressive for greetings. → Qualify: "For questions about courses, content, or the platform, use ONLY the provided context. For general conversation, respond normally."

---

## Step 7: FAQ keyword shortcut layer

- `config/chat-faq.php` — ~10 Q&A pairs (pricing, enrollment, refunds, getting started)
- Array of trigger phrases per entry; match if any phrase is substring of user message
- Checked before RAG runs — matched → return canned answer, zero API cost
- Config file sufficient for now; DB-managed later if admin needs it

**Self-critique:** Substring matching is brittle but catches 80% of common questions at zero cost. Good enough for V1.

---

## Step 8: Tests

- Unit: `KnowledgeChunker` — correct chunks, HTML stripped, empty resources skipped
- Unit: `RagRetriever` — FTS path, vector path, empty result, scope filtering, score threshold
- Feature: `rag:index` command — creates chunks, skips unchanged (hash), deletes orphans
- Feature: chat endpoints — retrieved context in system prompt, "no info" fallback triggered
- Test: embed caching — same text → cache hit, no API call

Mock `AiProvider::embed()` in tests — no real OpenAI calls in CI.
Test DB needs pgvector. If not installed, skip vector-specific tests gracefully.

---

## File-Based Knowledge Base (Document Upload)

### How it fits

`knowledge_chunks` already has `source_type`/`source_id`. Add `source_type = 'document'`. Retrieval and chat context builders need no structural changes — just scope queries to include document chunks.

### New: `documents` table

```
id, uploader_id, title, filename, disk_path,
scope_type (platform|course), scope_id (nullable),
status (pending|indexed|failed), content_hash, chunks_count, timestamps
```

- Platform-scoped: searchable from all chats
- Course-scoped: searchable only from that course's chat

### Upload flow

- Admin: `POST /admin/documents` — platform scope
- Mentor: `POST /mentor/courses/{course}/documents` — course scope (own courses only)
- Accepted types: `.txt`, `.md` only (PDF deferred — needs parser)
- Store to private disk
- Dispatch `IndexDocumentJob` after upload

### `IndexDocumentJob`

- Read file from private disk
- Split by paragraph/double-newline into chunks (~500 chars)
- Strip markdown syntax for `.md` files
- Embed each chunk → insert into `knowledge_chunks` with `source_type = 'document'`
- Set `document.status = indexed` on success, `failed` on exception

**No dirty-check needed** — files are immutable after upload. Admin deletes + re-uploads to update.

### Retrieval scoping update

`RagRetriever` queries both course/resource chunks AND document chunks that match the current scope. Platform chat searches all document chunks. Course chat searches documents scoped to that course.

### Duplicate prevention

Hash file content on upload. Reject if hash already exists for that scope.

### Pitfalls

**Sensitive content:** Mentors could upload anything to their course. → Course-scoped docs auto-index (mentor's responsibility). Platform-scoped docs require admin review (`status = pending_review` until approved).

**PDF:** Deferred to V2. Architecture already supports it — just swap the file reader in `IndexDocumentJob`.

---

## Execution Order

1 → 2 → 3 → 4 → 8 (indexing tests) → 5 → 6 → 7 → 8 (retrieval + chat tests)
→ Document upload: add after Step 4 (shares the same indexing infrastructure)

Each step independently testable before proceeding to next.
