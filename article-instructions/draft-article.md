# Draft Article — Single Entry Point

You are an expert content strategist and SEO writer. This file contains everything you need to draft a complete article and insert it into the database.

**Expected usage**: `read article-instructions/draft-article.md and draft an article titled "Your Title Here"`

---

## Step 1: Build the Article Skeleton

Read `article-instructions/article-guide-1.md` and execute all 6 sections using the provided title as the topic:
1. Concept Extraction (3-5 expandable angles from the topic)
2. Recommended Focus Concept
3. Keyword Strategy (primary + secondary keyphrases, cannibalization check)
4. Unique Insight Angle (the "aha moment")
5. Article Skeleton (title, meta description, introduction outline, section-by-section outline, conclusion)
6. Content Depth Signals

Present the skeleton to the user. Wait for approval before proceeding.

---

## Step 1.5: Build the Internal Link Candidate Set

After the skeleton is approved, gather all existing articles that could be linked from this new article.

### Small catalog (under ~50 articles)

Run a single query to load all published articles:

```sql
SELECT id, title, slug, excerpt FROM articles WHERE status = 'published' ORDER BY id;
```

### Large catalog (50+ articles)

Extract 8-12 key phrases from the approved skeleton (section topics, key claims, named concepts). For each phrase, run a PostgreSQL full-text search:

```sql
SELECT id, title, slug, excerpt
FROM articles
WHERE to_tsvector('english', title || ' ' || excerpt || ' ' || body)
      @@ plainto_tsquery('english', '<key phrase here>')
AND status = 'published'
LIMIT 10;
```

Deduplicate the results across all queries. This narrows hundreds of articles to the 20-30 most relevant candidates.

### Build the reference list

Combine query results with the site base URL (use `get-absolute-url` tool with path `/resources/<slug>`) to produce a reference list:

```
Title: <title>
URL: <full url>
Topic: <what this article covers, from excerpt>
```

Keep this list available during Step 2 writing.

### Internal linking rules during writing

- **Maximize links**: Link to every relevant existing article. Authority is built through density of natural internal links.
- **Links must improve the sentence**: The anchor text should make the sentence read better than it would without the link. The link adds a relevant clause, detail, or connection that strengthens the argument.
- **Anchor text is part of the argument**: Never use "click here," "see also," or parenthetical references. The linked phrase flows as natural reading.
- **No forced link sections**: No "Related Articles" lists. Every link lives inside a content paragraph.
- **Distribute across sections**: Spread links throughout the article, not clustered in one section.
- **Link the same article at most once**.

**Good example:**
> "The AI fills in the blanks using the most statistically common patterns from <a href="/en/resources/how-ai-bias-shapes-answers">its training data, which already carries its own biases</a>."

**Bad example:**
> "The AI fills in the blanks using common patterns. (See also: How AI Bias Shapes the Answers You Get)"

The test: if you remove the `<a>` tags, the sentence should still read perfectly. If you remove the linked phrase entirely, the sentence should feel like it lost something.

---

## Step 2: Write the Full Article

Read these two files now:
- `article-instructions/core-structure-guide.md` — sentence structuring rules
- `article-instructions/rich-text-formatting.md` — available HTML formatting patterns

Then write the **complete, publish-ready article** as a single HTML body string.

### Writing rules
- Expand every skeleton section into full paragraphs with real content, examples, and explanations.
- The article must be a finished piece a reader can consume end-to-end. Not an outline, not a summary.
- Each H2 section: multiple paragraphs covering the skeleton's "what this section covers", "key claim", and "example/analogy".
- Include the introduction hook, the insight, concrete before/after examples, and the conclusion with CTA.
- Target 1500-2500+ words depending on topic depth. Do not cut corners or leave sections thin.

### Sentence rules (from `core-structure-guide.md`)
- Plain, clear English. No slang, idioms, cultural references, or native-speaker expressions.
- Never use an em dash. Rewrite with a comma instead.
- Never use figurative or indirect phrases. Say exactly what you mean.

### Visual presentation
- Use lists, tables, callouts, section-blocks, and highlights as much as naturally possible to present the core message in the most visual and scannable way.
- If a point can be a table, make it a table. If a key insight deserves a callout, use a callout. If a comparison exists, use a before/after table or side-by-side list.
- Do NOT restructure or pad the article just to force formatting. Rich text elements serve the content, not the other way around.

### HTML format (from `rich-text-formatting.md`)
- Paragraphs: `<p>text</p>`
- Headings: `<h2><strong>Heading Text</strong></h2>`
- Highlights (use on phrases carrying core insight):
  - `<mark data-color="#00ffff" style="background-color: rgb(0, 255, 255); color: inherit;">cyan</mark>`
  - `<mark data-color="#ffff00" style="background-color: rgb(255, 255, 0); color: inherit;">yellow</mark>`
  - `<mark data-color="#00ff00" style="background-color: rgb(0, 255, 0); color: inherit;">green</mark>`
  - `<mark data-color="#ff8c00" style="background-color: rgb(255, 140, 0); color: inherit;">orange</mark>`
- Colored text: `<span style="color: rgb(239, 68, 68);">red text</span>`
- Callout (no label): `<div data-variant="purple" data-label="" data-type="callout">text</div>`
- Callout (with label): `<div data-variant="amber" data-label="Label" data-type="callout">text</div>` — variants: `purple`, `amber`, `green`, `teal`
- Section block hero-light: `<div data-variant="hero-light" data-label="Optional Label" data-type="section-block"><p>content</p></div>`
- Section block bordered: `<div data-variant="bordered" data-type="section-block"><p>content</p></div>`
- Lists: `<ul><li><p>item</p></li></ul>` or `<ol><li><p>item</p></li></ol>` — `<p>` inside `<li>` is required
- Table:
```
<table style="min-width: 75px;">
  <colgroup><col style="min-width: 25px;"><col style="min-width: 25px;"><col style="min-width: 25px;"></colgroup>
  <tbody>
    <tr><th colspan="1" rowspan="1"><p><strong>Header</strong></p></th>...</tr>
    <tr><td colspan="1" rowspan="1"><p>Cell</p></td>...</tr>
  </tbody>
</table>
```

---

## Step 3: Insert into Database

### Query existing tags and categories first
Use the `database-query` MCP tool (or tinker) to run:

```sql
SELECT id, name, slug FROM categories ORDER BY name;
```

```sql
SELECT DISTINCT tag FROM (
  SELECT jsonb_array_elements_text(tags::jsonb) AS tag
  FROM articles WHERE tags IS NOT NULL
) sub ORDER BY tag;
```

### Insert rules
- **Tags**: Use existing tags if they fit. Only create new tags if no existing tag covers the concept.
- **Category**: Use an existing category if it fits. Only create a new one if none match.
- **Status**: Always `draft` (`published_at` = `null`).
- **Author**: `author_id = 1`.

### Insert pattern (run via tinker)

```php
use App\Models\Article;
use App\Models\Category;
use App\Enums\ArticleStatus;
use Illuminate\Support\Str;

$title = 'Article Title Here';
$body  = '...'; // the full HTML body from Step 2

// Unique slug
$base = Str::slug($title);
$slug = $base;
$i = 2;
while (Article::where('slug', $slug)->exists()) {
    $slug = "{$base}-{$i}";
    $i++;
}

Article::create([
    'author_id'          => 1,
    'category_id'        => $categoryId, // from query above, or null
    'title'              => $title,
    'slug'               => $slug,
    'excerpt'            => '...', // short summary, max 500 chars
    'body'               => $body,
    'featured_image'     => null,
    'featured_image_alt' => null,
    'tags'               => ['tag1', 'tag2'], // from query above
    'status'             => ArticleStatus::Draft->value,
    'read_time_minutes'  => Article::calculateReadTime($body),
    'published_at'       => null,
]);
```

---

## Checklist (verify before finalizing)
- [ ] Skeleton approved by user
- [ ] Sentence rules: no em dashes, no figurative language, plain English
- [ ] On-page SEO: primary keyphrase in title, first paragraph, at least one H2, meta description
- [ ] Internal links: every relevant existing article linked, all links read as natural prose, no "see also" patterns
- [ ] Visual: tables, callouts, lists, highlights used wherever they serve the content
- [ ] Tags and category reuse existing where possible
- [ ] Status = draft, author_id = 1
- [ ] Inserted via tinker
