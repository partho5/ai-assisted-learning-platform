# To Build Next

## 1. Personalized Learning — Dashboard & Learn Page Enhancements

### A. Dashboard chatbot (highest ROI)
- Add `FloatingChatButton` to `dashboard.tsx` with `platform` context
- Inject user's learning state into the prompt:
  - Enrolled courses + completion % per course
  - Last accessed resource (from `resource_completions` timestamp)
  - Failed/incomplete tests (attempt score < passing threshold)
  - Enrolled but not-yet-started courses
- Bot can then answer: "What should I do today?", "Where did I leave off?", "What are my weak areas?"

### B. Attempt result page chatbot
- Add `FloatingChatButton` to `courses/attempt-result.tsx`
- Inject attempt context into prompt: score, wrong questions, AI rubric feedback
- Bot can explain wrong answers, suggest what to review, link back to relevant resource

### C. Richer `UserProgressSummary`
- Currently sends basic completion counts
- Extend to include:
  - Specific test questions answered wrong (identify weak concepts)
  - Resources: not started / in-progress / completed
  - Time since last activity (detect disengagement → suggest re-entry point)

### D. Proactive suggestion on learn page (nice-to-have)
- After resource marked complete, auto-open chatbot with suggestion:
  "Great, want a quick quiz on what you just learned?"
- Triggered by the completion event on frontend

---

## 2. Admin Knowledge Base Upload (Platform RAG Documents)

### Goal
Admin uploads `.txt` files → chunked → embedded → stored in `knowledge_chunks`
with `source_type = 'platform'` → automatically retrieved by `PlatformChatContext` RAG
(no changes needed to chat system — RAG already has no scope filter for platform calls)

### Backend
- New model: `KnowledgeDocument`
  - Fields: `title`, `filename`, `source_type = 'platform'`, `chunk_count`, `created_at`
  - Tracks uploaded docs separately from raw chunks
- New controller: `Admin\KnowledgeDocumentController`
  - Upload → read txt → chunk (reuse `KnowledgeChunker`) → embed via `AiProvider::embed()` → save to `knowledge_chunks`
  - Delete → removes `KnowledgeDocument` + all its `knowledge_chunks`
- Processing: queued job (consistent with existing `GradeTestAnswerWithAi` pattern)
  - Admin sees "processing..." status until done

### Routes
```
GET    /{locale}/admin/knowledge              → index (list docs)
POST   /{locale}/admin/knowledge              → upload + queue processing
DELETE /{locale}/admin/knowledge/{doc}        → destroy doc + its chunks
```

### Frontend (admin page)
- File upload form (txt only, with size limit)
- Document list: title, chunk count, uploaded date, status, delete button
- Upload status indicator (queued / processing / done / failed)

### Content to upload
- Landing page copy / feature descriptions
- Pricing & plan details
- About us / company story
- Refund & cancellation policy
- Rich FAQ (beyond keyword-based `config/chat-faq.php`)
- Platform how-to guides ("how endorsements work", "how to become a mentor", etc.)

---

## 3. Pages Still Missing the Chatbot

| Page | File | Priority |
|---|---|---|
| Landing page | `welcome.tsx` | High — first page visitors see |
| About us | `about-us.tsx` | Medium |
| Learner dashboard | `dashboard.tsx` | High (see #1A above) |
| Attempt result | `courses/attempt-result.tsx` | High (see #1B above) |
| Portfolio | `u/show.tsx` | Low |

All would use `type: 'platform'` + `chat.platform` endpoint.
Per-page context can be passed via `extra: { page: 'landing' }` so `PlatformChatContext`
can inject page-specific copy if needed.

---

## 4. Dark Mode Fix Already Done
- Sidebar resource list items in `learn.tsx` — text was unreadable in dark mode
- Fixed: added `text-gray-900 dark:bg-blue-950/40 dark:text-gray-100` + active state `dark:bg-blue-900/60`
