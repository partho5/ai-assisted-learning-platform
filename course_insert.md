# Course Programmatic Insertion Guide

Use this file when asked to insert a course programmatically.
Given a course outline, follow every step in order. Do not skip steps.
The final result must be a fully accessible, production-ready course.

---

## How To Use This File

1. User provides a course outline (title, description, modules, lessons, quizzes, etc.).
2. You read this file fully before writing any code.
3. You run all insertions via `php artisan tinker` or the MCP `tinker` tool.
4. You verify the course is accessible via its URL before declaring done.

---

## Use rich text
You will use rich-text-editor.tsx supported rich text content where fits.

## Pre-Flight: Resolve IDs

Before inserting, resolve the real database IDs you will need.

### Find the mentor's user_id
use userId 1 for mentor id.

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

### `courses.status` : draft

### `courses.difficulty`: beginner

### `courses.language`
| Value |
|---|
| `en` |
| `bn` |

### `courses.billing_type` : leave null for free


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

---

## Step 1 — Insert the Course

```php
$course = \App\Models\Course::create([
    // --- REQUIRED ---
    'user_id'            => 5,                     // mentor's user id (from pre-flight)
    'title'              => 'Course Title Here',
    'slug'               => \Illuminate\Support\Str::slug('Course Title Here'),
    'description'        => 'Full course description.',
    'what_you_will_learn'=> "Bullet 1\nBullet 2\nBullet 3",
    'difficulty'         => 'beginner',            // beginner | intermediate | advanced
    'status'             => 'published',           // use 'published' for production
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
| `status = 'draft'` in production | Always use `'published'` for live inserts |
| `testable_type` wrong | Must be the full class path: `App\Models\Resource` |
| `correct_answer` doesn't match option label | Must be character-for-character identical to an option's `label` |
| Missing options for `multiple_choice` | All types with `hasOptions() = true` need at least 2 options |
| `is_free = false` on all resources | First lesson should be `is_free = true` so guests can preview |
| Wrong `order` values | `order` is per-scope: modules share course scope; resources share module scope |
| Using `env()` directly | Not relevant here, but never reference env in code outside config |

---

## Full Example: Minimal Viable Course (Tinker-ready)

Copy-paste this entire block into tinker to create a complete test course:

```php
use Illuminate\Support\Str;
use App\Models\{Course, Module, Resource, Test, TestQuestion, TestQuestionOption, User, Category};

$mentor = User::where('role', 'mentor')->firstOrFail();

$course = Course::create([
    'user_id' => $mentor->id, 'title' => 'Sample Course', 'slug' => Str::slug('Sample Course'),
    'description' => 'A sample course.', 'what_you_will_learn' => "Point 1\nPoint 2",
    'difficulty' => 'beginner', 'status' => 'published', 'language' => 'en',
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
