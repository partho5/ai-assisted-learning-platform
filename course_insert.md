# Course Programmatic Insertion Guide

Use this file when asked to insert a course programmatically.
Given a course outline, follow every step in order. Do not skip steps.
The final result must be a fully accessible, production-ready course.

---

## How To Use This File

1. User provides a course outline (title, description, modules, lessons, quizzes, etc.).
2. You read this file fully before writing any code.
3. You write all insertion PHP code into a **temporary file** (e.g. `/tmp/course_insert.php`), then execute it with `php artisan tinker < /tmp/course_insert.php`. **Never** pipe PHP code directly into tinker from the shell — it causes escaping issues on production VPS.
4. After successful execution, delete the temp file: `rm /tmp/course_insert.php`.
5. You verify the course is accessible via its URL before declaring done.

---

## Use rich text
You will use rich-text-editor.tsx supported rich text content where fits.

## Pre-Flight: Resolve IDs

Before inserting, resolve the real database IDs you will need.

### Find the mentor's user_id
Always use userId 1 as the mentor.

### Find or create a category

```php
// List all categories
\App\Models\Category::all(['id', 'name', 'slug'])->each(fn($c) => print("{$c->id}: {$c->name}\n"));

// Create a category if it doesn't exist
$category = \App\Models\Category::firstOrCreate(
    ['slug' => \Illuminate\Support\Str::slug('Your Category Name')],
    ['name' => 'Your Category Name', 'description' => null]
);
echo $category->id;
```

---

## Enum Reference (use exact string values)

### `courses.status` : always `draft`

### `courses.difficulty`: beginner

### `courses.language`
| Value |
|---|
| `en` |
| `bn` |

### `courses.billing_type` : always `one_time`, leave `price` null for free


### `resources.type`
| Value | When to use |
|---|---|
| `video` | Embed/link a video; set `url` |
| `text` | Rich HTML content; set `content` (HTML) |
| `article` | External article link; set `url` |
| `document` | PDF or downloadable file; set `url` |
| `audio` | Audio file; set `url` |
| `image` | Image resource; set `url` |
| `assignment` | Requires mentor endorsement; attach a `Test` |

### `test_questions.question_type`
after a lesson create and insert few test question to make sure learner could grab the *key points*.

| Value | Has options? | Default evaluation |
|---|---|---|
| `paragraph` | No | `ai_graded` |
| `multiple_choice` | **Yes** | `exact_match` |
| `checkboxes` | **Yes** | `exact_match` |
| `dropdown` | **Yes** | `exact_match` |
| `date` | No | `numeric_comparison` |
| `time` | No | `numeric_comparison` |

### `test_questions.evaluation_method`
| Value | Notes |
|---|---|
| `exact_match` | Answer must match `correct_answer` exactly |
| `numeric_comparison` | Use with `numeric_operator` (`=`, `>=`, `<=`, `>`, `<`) |
| `ai_graded` | AI grades using `ai_rubric`; no `correct_answer` needed |

---

## Insertion Order

Always insert in this exact order — each step depends on the previous IDs.

```
1. Course
2. Modules  (each needs course_id)
3. Resources  (each needs module_id)
4. Tests  (each needs resource_id — only for quiz/assignment resources)
5. TestQuestions  (each needs test_id)
6. TestQuestionOptions  (each needs test_question_id — only for multiple_choice/checkboxes/dropdown)
```

### Execution Method: Temp PHP File

**Do NOT run PHP code directly in the shell.** Shell escaping breaks on production VPS.

Instead, combine all insertion code (Steps 1–6) into a single temp PHP file and execute it:

```bash
# 1. Write all PHP insertion code to a temp file (use the Write tool or cat <<'PHPEOF')
#    The file must NOT include <?php tags — tinker runs raw PHP.

# 2. Execute via tinker
php artisan tinker < /tmp/course_insert.php

# 3. Clean up
rm /tmp/course_insert.php
```

The Pre-Flight lookups (finding category IDs, etc.) can still use the MCP `tinker` tool interactively since those are short, simple commands without special characters.

---

## Step 1 — Insert the Course

```php
$course = \App\Models\Course::create([
    // --- REQUIRED ---
    'user_id'            => 1,                     // always use mentor id 1
    'title'              => 'Course Title Here',
    'slug'               => \Illuminate\Support\Str::slug('Course Title Here'),
    'description'        => 'Full course description.',
    'what_you_will_learn'=> "Bullet 1\nBullet 2\nBullet 3",
    'difficulty'         => 'beginner',            // beginner | intermediate | advanced
    'status'             => 'draft',                // always insert as draft
    'language'           => 'en',                  // en | bn
    'currency'           => 'USD',
    'billing_type'       => 'one_time',            // one_time | subscription
    'is_featured'        => false,

    // --- OPTIONAL ---
    'category_id'        => null,                  // category id from pre-flight, or null
    'subtitle'           => null,                  // short tagline
    'prerequisites'      => null,                  // text, shown before enrollment
    'estimated_duration' => null,                  // total minutes (integer)
    'thumbnail'          => null,                  // URL or storage path
    'price'              => null,                  // null = free; e.g. 29.99 for paid
    'subscription_duration_months' => null,        // only if billing_type = subscription
    'paypal_plan_id'     => null,
    'partner_commission_rate' => null,             // e.g. 20.00 for 20%
]);

echo "Course ID: {$course->id}, Slug: {$course->slug}";
```

> **Slug must be unique.** If the insert fails with a unique constraint error, append `-2`, `-3`, etc.

---

## Step 2 — Insert Modules

Repeat for each module. `order` starts at 0 and increments by 1.

```php
$module1 = \App\Models\Module::create([
    // --- REQUIRED ---
    'course_id'   => $course->id,
    'title'       => 'Module 1: Introduction',
    'order'       => 0,

    // --- OPTIONAL ---
    'description' => null,  // brief module overview
]);

$module2 = \App\Models\Module::create([
    'course_id'   => $course->id,
    'title'       => 'Module 2: Core Concepts',
    'order'       => 1,
    'description' => null,
]);

// continue for each module...
```

---

## Step 3 — Insert Resources (Lessons)

Repeat for each lesson inside each module. `order` starts at 0 per module.

```php
$resource1 = \App\Models\Resource::create([
    // --- REQUIRED ---
    'module_id'          => $module1->id,
    'title'              => 'Lesson 1: Welcome',
    'type'               => 'video',               // see enum reference above
    'order'              => 0,
    'is_free'            => true,                  // true = accessible without enrollment

    // --- CONDITIONAL (fill based on type) ---
    'url'                => 'https://youtube.com/watch?v=XXXX', // for video/article/document/audio/image
    'content'            => null,                  // HTML string for type=text

    // --- OPTIONAL ---
    'caption'            => null,                  // shown under video/image
    'estimated_time'     => 10,                    // minutes (integer)
    'why_this_resource'  => null,                  // shown to learner: why this matters
    'mentor_note'        => null,                  // private mentor-only note
]);

$resource2 = \App\Models\Resource::create([
    'module_id'          => $module1->id,
    'title'              => 'Lesson 2: Core Theory',
    'type'               => 'text',
    'order'              => 1,
    'is_free'            => false,
    'url'                => null,
    'content'            => '<h2>Introduction</h2><p>Content goes here...</p>',
    'estimated_time'     => 15,
    'why_this_resource'  => 'Understand the foundations before moving forward.',
    'mentor_note'        => null,
]);

// continue for each resource...
```

---

## Step 4 — Insert Tests (Quiz / Assignment resources only)

Only create a `Test` when the resource type is one of: `video`, `text`, `article`, `document`, `audio`, `image` (formative quiz) or `assignment` (requires mentor endorsement).

One resource → at most one test.

```php
$test = \App\Models\Test::create([
    // --- REQUIRED ---
    'testable_type'      => \App\Models\Resource::class,  // always this exact string
    'testable_id'        => $resource1->id,
    'title'              => 'Quiz: Welcome Check',

    // --- OPTIONAL ---
    'description'        => null,                  // shown to learner before starting
    'passing_score'      => 70,                    // percentage (0–100); null = no pass threshold
    'time_limit_minutes' => null,                  // null = unlimited
    'max_attempts'       => null,                  // null = unlimited
    'ai_help_enabled'    => false,                 // show AI assistant during attempt
]);

echo "Test ID: {$test->id}";
```

---

## Step 5 — Insert Test Questions

Repeat for each question. `order` starts at 0.

```php
// --- Paragraph (open-ended, AI-graded) ---
$q1 = \App\Models\TestQuestion::create([
    'test_id'           => $test->id,
    'order'             => 0,
    'question_type'     => 'paragraph',
    'body'              => 'Explain in your own words what you learned.',
    'points'            => 10,
    'evaluation_method' => 'ai_graded',
    'ai_rubric'         => 'Award full marks if the learner demonstrates understanding of X and Y.',
    'ai_help_enabled'   => false,
    'is_required'       => true,
    // leave correct_answer, hint, numeric_operator as null
    'correct_answer'    => null,
    'hint'              => null,
    'numeric_operator'  => null,
]);

// --- Multiple Choice ---
$q2 = \App\Models\TestQuestion::create([
    'test_id'           => $test->id,
    'order'             => 1,
    'question_type'     => 'multiple_choice',
    'body'              => 'Which of the following is correct?',
    'points'            => 5,
    'evaluation_method' => 'exact_match',
    'correct_answer'    => 'Option B',             // must match one option label exactly
    'hint'              => 'Think about the second concept.',
    'ai_help_enabled'   => false,
    'is_required'       => true,
    'ai_rubric'         => null,
    'numeric_operator'  => null,
]);

// --- Date question ---
$q3 = \App\Models\TestQuestion::create([
    'test_id'           => $test->id,
    'order'             => 2,
    'question_type'     => 'date',
    'body'              => 'What date did the framework release?',
    'points'            => 5,
    'evaluation_method' => 'numeric_comparison',
    'numeric_operator'  => '=',                    // = | >= | <= | > | <
    'correct_answer'    => '2024-03-01',
    'ai_rubric'         => null,
    'hint'              => null,
    'ai_help_enabled'   => false,
    'is_required'       => true,
]);
```

---

## Step 6 — Insert Options (multiple_choice / checkboxes / dropdown only)

Only needed when `question_type` is `multiple_choice`, `checkboxes`, or `dropdown`.
`order` starts at 0. For `multiple_choice`, only one option should match `correct_answer`.
For `checkboxes`, `correct_answer` should be a comma-separated string of correct labels.

```php
\App\Models\TestQuestionOption::create(['test_question_id' => $q2->id, 'label' => 'Option A', 'order' => 0]);
\App\Models\TestQuestionOption::create(['test_question_id' => $q2->id, 'label' => 'Option B', 'order' => 1]); // correct
\App\Models\TestQuestionOption::create(['test_question_id' => $q2->id, 'label' => 'Option C', 'order' => 2]);
\App\Models\TestQuestionOption::create(['test_question_id' => $q2->id, 'label' => 'Option D', 'order' => 3]);
```

---

## Verification

After all insertions, verify the course is correctly set up:

```php
// 1. Confirm the course exists and is published
$course = \App\Models\Course::with(['modules.resources.test.questions.options'])->find(COURSE_ID_HERE);
echo "Status: {$course->status->value}\n";
echo "Modules: {$course->modules->count()}\n";
echo "Resources: {$course->modules->flatMap->resources->count()}\n";

// 2. Show full structure
$course->modules->each(function ($module) {
    echo "\n[Module] {$module->title} (order={$module->order})\n";
    $module->resources->each(function ($r) {
        echo "  [Resource] {$r->title} | type={$r->type->value} | free={$r->is_free}\n";
        if ($r->test) {
            echo "    [Test] {$r->test->title} | questions={$r->test->questions->count()}\n";
        }
    });
});
```

### Get the public URL

```
/{locale}/courses/{slug}          — course detail page
/{locale}/learn/{slug}            — course learning page (requires enrollment)
```

Replace `{locale}` with `en` or `bn`. Replace `{slug}` with `$course->slug`.

---

## Common Mistakes to Avoid

| Mistake | Fix |
|---|---|
| Duplicate slug | Append `-2`, `-3` etc. to slug |
| `status = 'published'` on insert | Always insert as `'draft'`; publish manually after review |
| `testable_type` wrong | Must be the full class path: `App\Models\Resource` |
| `correct_answer` doesn't match option label | Must be character-for-character identical to an option's `label` |
| Missing options for `multiple_choice` | All types with `hasOptions() = true` need at least 2 options |
| `is_free = false` on all resources | First lesson should be `is_free = true` so guests can preview |
| Wrong `order` values | `order` is per-scope: modules share course scope; resources share module scope |
| Using `env()` directly | Not relevant here, but never reference env in code outside config |
| Running PHP directly in shell/tinker CLI | Always write to a temp file first, then `php artisan tinker < /tmp/course_insert.php` |
| Adding `use` statements for `Str` or any `App\Models\*` | **Do NOT add any `use` statements.** Tinker auto-aliases all `App\Models\*` classes and `Illuminate\Support\Str`. Adding `use` lines causes `FATAL ERROR: Cannot use X as Y because the name is already in use`. Simply write `Course::create(...)`, `Module::create(...)` etc. with no imports at the top of the file. |

---

## Tinker `use` Statement Behavior (Confirmed from Real Insertion)

**Problem encountered:** The first insertion attempt included these lines at the top of the temp file:

```php
use Illuminate\Support\Str;
use App\Models\{Course, Module, Resource, Test, TestQuestion, TestQuestionOption, Category};
```

**Error produced:**

```
FATAL ERROR  Cannot use Illuminate\Support\Str as Str because the name is already in use
FATAL ERROR  Cannot use App\Models\Course as Course because the name is already in use
```

**Why it happens:** When `php artisan tinker` starts, it automatically aliases every class in `App\Models\*` and common framework classes like `Illuminate\Support\Str` into the session scope. Any `use` statement that re-declares an already-aliased name causes a fatal PHP error and aborts the entire script — leaving the database in a partial state.

**Correct approach:** Write zero `use` statements. Use short model names directly (`Course::`, `Module::`, `Resource::` etc.) — tinker resolves them automatically. Confirmed working output:

```
[!] Aliasing 'Course' to 'App\Models\Course' for this Tinker session.
[!] Aliasing 'Module' to 'App\Models\Module' for this Tinker session.
[!] Aliasing 'Resource' to 'App\Models\Resource' for this Tinker session.
...
```

**Rule:** The temp file must start directly with executable PHP — no `<?php` tag, no `use` statements.

---

## Full Example: Minimal Viable Course

Write the following PHP code to `/tmp/course_insert.php`, then run `php artisan tinker < /tmp/course_insert.php`:

```php
// No use statements — tinker auto-aliases all App\Models\* classes

$course = Course::create([
    'user_id' => 1, 'title' => 'Sample Course', 'slug' => \Illuminate\Support\Str::slug('Sample Course'),
    'description' => 'A sample course.', 'what_you_will_learn' => "Point 1\nPoint 2",
    'difficulty' => 'beginner', 'status' => 'draft', 'language' => 'en',
    'currency' => 'USD', 'billing_type' => 'one_time', 'is_featured' => false,
]);

$m1 = Module::create(['course_id' => $course->id, 'title' => 'Getting Started', 'order' => 0]);

$r1 = Resource::create([
    'module_id' => $m1->id, 'title' => 'Introduction Video', 'type' => 'video',
    'order' => 0, 'is_free' => true, 'url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'estimated_time' => 5,
]);

$r2 = Resource::create([
    'module_id' => $m1->id, 'title' => 'Quick Quiz', 'type' => 'video',
    'order' => 1, 'is_free' => false, 'url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
]);

$t = Test::create([
    'testable_type' => Resource::class, 'testable_id' => $r2->id,
    'title' => 'Module 1 Quiz', 'passing_score' => 60,
]);

$q = TestQuestion::create([
    'test_id' => $t->id, 'order' => 0, 'question_type' => 'multiple_choice',
    'body' => 'What is 2 + 2?', 'points' => 5, 'evaluation_method' => 'exact_match',
    'correct_answer' => '4', 'is_required' => true, 'ai_help_enabled' => false,
]);

TestQuestionOption::create(['test_question_id' => $q->id, 'label' => '3', 'order' => 0]);
TestQuestionOption::create(['test_question_id' => $q->id, 'label' => '4', 'order' => 1]);
TestQuestionOption::create(['test_question_id' => $q->id, 'label' => '5', 'order' => 2]);

echo "Done! Course: /en/courses/{$course->slug}";
```

Then execute and clean up:

```bash
php artisan tinker < /tmp/course_insert.php
rm /tmp/course_insert.php
```
