# Article Production Workflow

Follow these steps **in strict order**. Do not skip or merge steps.

---

## Step 0: Get Article Topic
- Ask the user for the article title/topic. Do NOT choose one yourself.
- If the user provides a lesson chunk, use it as input for Step 1.

## Step 1: Article Skeleton (use `article-guide-1.md`)
- Process the lesson chunk or topic through all 6 sections of `article-guide-1.md`:
  1. Concept Extraction
  2. Recommended Focus Concept
  3. Keyword Strategy
  4. Unique Insight Angle
  5. Article Skeleton (title, meta, section outlines)
  6. Content Depth Signals
- **Output**: Present the skeleton to the user. Wait for approval or adjustments before proceeding.

## Step 2: Write Publish-Ready Article (use `core-structure-guide.md` + `rich-text-formatting.md`)
- Read `core-structure-guide.md` for sentence structuring rules.
- Read `rich-text-formatting.md` for available HTML formatting.
- Write the **complete, publish-ready article** from the skeleton. This means:
  - Expand every skeleton section into full paragraphs with real content, examples, and explanations.
  - The article must be a finished piece a reader can consume end-to-end, not an outline or summary.
  - Each H2 section should have multiple paragraphs of substantive content covering everything outlined in the skeleton's "what this section covers", "key claim", and "example/analogy" notes.
  - Include the introduction hook, the "aha moment" insight, concrete before/after examples, and the conclusion with CTA, all as described in the skeleton.
  - Target a thorough article length (1500-2500+ words depending on topic depth). Do not cut corners or leave sections thin.
- **VISUAL PRESENTATION**: Use lists, tables, callouts, section-blocks, and highlights as much as naturally possible to present the core message in the most visual and scannable way. If a point can be a table, make it a table. If a key insight deserves a callout, use a callout. If a comparison exists, use a before/after table or side-by-side list. The goal is to make the article easy to scan and absorb, not a wall of paragraphs.
- **CONSTRAINT**: Do not restructure or pad the article just to force formatting. The rich text elements should serve the content's core message, not the other way around.
- Apply `core-structure-guide.md` rules throughout: plain English, no em dashes, no figurative language, direct statements.

## Step 3: Database Insert (use `article-insert-reference.md`)

### Query existing tags and categories first
Before choosing tags or a category, run these queries using the `database-query` MCP tool:

```sql
-- Get all existing categories
SELECT id, name, slug FROM categories ORDER BY name;

-- Get all existing tags
SELECT DISTINCT tag FROM (
  SELECT jsonb_array_elements_text(tags::jsonb) AS tag
  FROM articles WHERE tags IS NOT NULL
) sub ORDER BY tag;
```

- **Tags**: Use existing tags from the query results if they fit the article. Only create new tags if no suitable existing tag covers the concept.
- **Category**: Use an existing category from the query results if it fits. Only create a new category if none match.
- **Status**: Always `draft` (so `published_at` = `null`).
- **Author**: `author_id = 1`.
- Insert via tinker using the pattern in `article-insert-reference.md`.

---

## Checklist (verify before finalizing)
- [ ] Article topic approved by user
- [ ] Skeleton reviewed (Step 1 complete)
- [ ] Sentence rules applied (no em dashes, no figurative language, plain English)
- [ ] Rich text used only where content benefits, not forced
- [ ] Tags reuse existing where possible
- [ ] Category reuse existing where possible
- [ ] Status = draft, author_id = 1
- [ ] Article inserted via tinker
