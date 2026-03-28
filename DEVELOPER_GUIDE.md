# SkillEvidence Developer Guide

This guide covers all important configurations and how to modify them for development and production.

## Quick Start

```bash
# Install dependencies
composer install
npm install

# Setup environment
cp .env.example .env
php artisan key:generate

# Setup databases
createdb skillevidence_db_dev
createdb skillevidence_db_test

# Run migrations
php artisan migrate
php artisan migrate --database=testing

# Start development servers
composer run dev     # Runs both Laravel & Vite in parallel
# OR separately:
php artisan serve
npm run dev
```

---

## Authentication Configuration

### Email Verification

**File:** `config/fortify.php` (line 149)

```php
Features::emailVerification(),  // ENABLED — best practice for security
```

**Effect:**
- Users must click email verification link before accessing dashboard
- In production: Sends real emails
- In development: Set `MAIL_DRIVER=log` in `.env` to log emails to `storage/logs/laravel.log`

**Development Workflow:**

**Option 1: Auto-verify in development (fastest)**
```bash
php artisan tinker
> $user = User::where('email', 'partho8181bd@gmail.com')->first();
> $user->markEmailAsVerified();
# Now user can login!
```

**Option 2: Use verification email link from logs**
1. User registers
2. Check `storage/logs/laravel.log` for verification URL
3. Copy the URL and visit it in browser to verify

**Option 3: Use test factory with pre-verified users**
```php
// In tests or when creating test users:
$user = User::factory()->create();  // Already verified by factory
$unverified = User::factory()->unverified()->create();  // Unverified
```

**Mail Configuration:**

**File:** `.env`

```env
# Development (logs to storage/logs/laravel.log)
MAIL_DRIVER=log

# Production (sends real emails via SMTP)
MAIL_DRIVER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=...
MAIL_PASSWORD=...
```

**View logged emails:**
```bash
tail -f storage/logs/laravel.log | grep -i "mail\|verification"
```

---

### Two-Factor Authentication

**File:** `config/fortify.php` (lines 150-154)

```php
Features::twoFactorAuthentication([
    'confirm' => true,           // Require password to enable 2FA
    'confirmPassword' => true,   // Require password on each 2FA prompt
    // 'window' => 0             // Time window for TOTP codes (0 = default)
]),
```

**Effect:**
- Controls whether 2FA is enabled and how strict it is
- Comment out entire block to disable 2FA completely

---

## Internationalization (i18n)

### Supported Languages

**File:** `config/app.php`

```php
'supported_locales' => ['en', 'bn'],  // Add/remove language codes
'locale' => 'en',                      // Default locale
'fallback_locale' => 'en',             // Fallback if translation missing
```

**How it works:**
- All routes are prefixed with `/{locale}` (e.g., `/en/dashboard`, `/bn/dashboard`)
- Request locale is extracted from URL via `SetLocale` middleware
- Route requests without valid locale (e.g., `/dashboard`) redirect to `/en`

**To add a new language (e.g., Spanish):**

1. Add to `config/app.php`:
   ```php
   'supported_locales' => ['en', 'bn', 'es'],
   ```

2. Create translation file:
   ```bash
   mkdir -p resources/lang/es
   cp resources/lang/en/ui.php resources/lang/es/ui.php
   # Edit resources/lang/es/ui.php with Spanish translations
   ```

3. Update tests to test the new locale:
   ```php
   $response = $this->get(route('home', ['locale' => 'es']));
   ```

### Translation Files

**File:** `resources/lang/{locale}/ui.php`

```php
return [
    'nav.dashboard' => 'Dashboard',
    'nav.my_courses' => 'My Courses',
    // Add all UI strings here
];
```

**In React components:**
```tsx
const { ui } = usePage().props;
<Link>{ui['nav.dashboard']}</Link>
```

---

## User Roles & Permissions

### Available Roles

**File:** `app/Enums/UserRole.php`

```php
enum UserRole: string {
    case Admin = 'admin';      // Full system access
    case Mentor = 'mentor';    // Create/manage courses
    case Learner = 'learner';  // Access courses
}
```

### Creating an Admin User

Admin is a privileged role — it is **not selectable during public registration** (only `mentor` and `learner` are). Use one of the methods below.

**Option 1: Artisan command (recommended)**

```bash
php artisan app:make-admin --email=you@example.com
```

Creates a new admin user interactively, or promotes an existing user by email.

**Option 3: Promote via Tinker (quick one-liner)**

```bash
php artisan tinker --execute="App\Models\User::where('email', 'you@example.com')->update(['role' => 'admin']);"
```

Replace `you@example.com` with the target account's email. The change is immediate — no restart needed.

---

### User Tiers (Subscription Levels)

**File:** `app/Enums/UserTier.php`

```php
enum UserTier: int {
    case Free = 0;      // Basic access
    case Pro = 1;       // Premium courses
    case Enterprise = 2; // All features
}
```

### Check Permissions in Code

```php
// In Controller
if (auth()->user()->isAdmin()) { /* ... */ }
if (auth()->user()->isMentor()) { /* ... */ }
if (auth()->user()->isLearner()) { /* ... */ }
if (auth()->user()->hasTierAccess(UserTier::Pro)) { /* ... */ }

// In Route Middleware
Route::get('courses', CourseController::class)
    ->middleware('role:mentor'); // Only mentors & admins
```

---

## Database

### Connection Configuration

**File:** `config/database.php`

```php
'default' => env('DB_CONNECTION', 'pgsql'),

'connections' => [
    'pgsql' => [
        'driver' => 'pgsql',
        'host' => env('DB_HOST', '127.0.0.1'),
        'port' => env('DB_PORT', 5432),
        'database' => env('DB_DATABASE', 'skillevidence_db_dev'),
        'username' => env('DB_USERNAME', 'postgres'),
        'password' => env('DB_PASSWORD', ''),
    ],
    'testing' => [
        'driver' => 'pgsql',
        'host' => env('DB_HOST', '127.0.0.1'),
        'port' => env('DB_PORT', 5432),
        'database' => 'skillevidence_db_test',
        'username' => env('DB_USERNAME', 'postgres'),
        'password' => env('DB_PASSWORD', ''),
    ],
],
```

### Create Databases

```bash
# Development database
createdb skillevidence_db_dev

# Testing database
createdb skillevidence_db_test

# Drop (careful!)
dropdb skillevidence_db_dev
dropdb skillevidence_db_test
```

### Run Migrations

```bash
# Development
php artisan migrate

# Testing
php artisan migrate --database=testing

# Rollback last batch
php artisan migrate:rollback

# Reset entire database
php artisan migrate:refresh
```

---

## Application Settings

### App Name & URL

**File:** `.env`

```env
APP_NAME=SkillEvidence
APP_URL=http://localhost:8000
APP_LOCALE=en
```

### Mail Configuration

**File:** `.env` and `config/mail.php`

```env
MAIL_DRIVER=log                    # Dev: log to file
# MAIL_DRIVER=smtp                 # Production: use actual SMTP
# MAIL_HOST=smtp.mailtrap.io
# MAIL_PORT=2525
# MAIL_USERNAME=...
# MAIL_PASSWORD=...
```

**Usage:**
- `MAIL_DRIVER=log`: Sends to `storage/logs/laravel.log` (great for dev)
- `MAIL_DRIVER=smtp`: Sends real emails (production)

### Session & Cookies

**File:** `config/session.php`

```php
'driver' => env('SESSION_DRIVER', 'database'),  // 'file' or 'database'
'lifetime' => 120,  // Minutes until session expires
```

---

## Frontend (React + TypeScript)

### Asset Build

```bash
# Development (watch for changes)
npm run dev

# Production build
npm run build

# Code formatting
npm run format
```

### Vite Configuration

**File:** `vite.config.js`

```js
export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
        }),
        react(),
    ],
});
```

**Issue: "Unable to locate file in Vite manifest"**
→ Run `npm run build` or `npm run dev` to regenerate assets

### TypeScript Global Types

**File:** `resources/js/types/global.d.ts`

```ts
interface User {
    id: number;
    name: string;
    username: string;
    email: string;
    role: UserRole;
    tier: UserTier;
}

interface SharedPageProps {
    locale: 'en' | 'bn';
    supportedLocales: string[];
    ui: UiTranslations;
    auth: { user: User | null };
}
```

---

## Testing

### Run Tests

```bash
# All tests (compact output)
php artisan test --compact

# Specific file
php artisan test --compact tests/Feature/ExampleTest.php

# Filter by test name
php artisan test --compact --filter=test_name_here

# Stop on first failure
php artisan test --compact --stop-on-failure
```

### Configuration

**File:** `phpunit.xml`

```xml
<php>
    <env name="DB_CONNECTION" value="testing"/>
    <env name="APP_LOCALE" value="en"/>
    <!-- ... -->
</php>
```

### Important Testing Notes

- All tests use `skillevidence_db_test` database
- Tests refresh database before each run (via `RefreshDatabase` trait)
- **Locale parameter required:** `route('dashboard', ['locale' => 'en'])`
- Use factories: `User::factory()->create()` or `User::factory()->mentor()->create()`

---

## Code Style & Formatting

### Laravel Pint (PHP Formatter)

```bash
# Check style issues
vendor/bin/pint --test --format agent

# Fix style issues automatically
vendor/bin/pint --format agent

# Fix only changed files
vendor/bin/pint --dirty --format agent
```

### ESLint (TypeScript/React Formatter)

```bash
# Check issues
npm run lint

# Fix issues
npm run format
```

---

## Middleware

### Custom Middleware

**File:** `bootstrap/app.php`

```php
$middleware->alias([
    'role' => EnsureRole::class,      // Check user role
    'setlocale' => SetLocale::class,  // Set app locale from URL
]);
```

### Usage in Routes

```php
Route::get('courses', CourseController::class)
    ->middleware('auth')                 // Requires authentication
    ->middleware('verified')             // Requires email verification
    ->middleware('role:mentor');         // Requires mentor+ role
```

---

## Google Analytics

### Setup

**File:** `.env`

```env
GA_MEASUREMENT_ID=G-XXXXXXXXXX   # Your Google Analytics Measurement ID
# Leave blank to disable GA entirely (no script is injected)
```

**Config:** `config/services.php` → `services.google.analytics_id`

GA is only injected when `GA_MEASUREMENT_ID` is set. Leave it empty locally to avoid polluting your analytics data.

### How it works

- **Blade** (`resources/views/app.blade.php`) — injects the `gtag.js` script with `send_page_view: false` (prevents double-counting the first load)
- **React** (`resources/js/app.tsx`) — listens to Inertia's `navigate` event and fires a `page_view` for every SPA navigation

Because the app uses `/en/` and `/bn/` locale prefixes, those are tracked as separate pages (intentional — they are genuinely separate content).

### Custom Events

All custom events live in [`resources/js/lib/analytics.ts`](resources/js/lib/analytics.ts). Import and call wherever needed:

```ts
import { trackCourseView, trackEnroll, trackPurchase, trackLandingCta } from '@/lib/analytics';

// In a useEffect or event handler:
trackCourseView(course.id, course.title);
trackEnroll(course.id, course.title);
trackPurchase(course.id, course.title, 29.99, 'USD');
trackLandingCta('hero_get_started');
```

**Available helpers:**

| Helper | Fires GA event |
|--------|---------------|
| `trackCourseView(id, title)` | `course_view` |
| `trackEnroll(id, title)` | `enroll` |
| `trackPurchase(id, title, amount, currency)` | `purchase` |
| `trackTestSubmit(testId, courseId)` | `test_submit` |
| `trackResourceComplete(resourceId, courseId)` | `resource_complete` |
| `trackSignUp(method?)` | `sign_up` |
| `trackLogin(method?)` | `login` |
| `trackLandingCta(ctaName)` | `landing_cta_click` |
| `trackEvent(name, params?)` | any custom event |

**To add a new event**, add a function to `analytics.ts`:

```ts
export function trackForumPost(threadId: number): void {
    trackEvent('forum_post', { thread_id: threadId });
}
```

### Kill switch

Clear `GA_MEASUREMENT_ID` in `.env` → no script is loaded, no events fire. No code change or rebuild needed.

---

## Deployment Checklist

Before deploying to production:

- [ ] Set `GA_MEASUREMENT_ID=G-XXXXXXXXXX` in `.env`
- [ ] Enable email verification: `Features::emailVerification()`
- [ ] Set `APP_DEBUG=false` in `.env`
- [ ] Run `php artisan config:cache`
- [ ] Run `npm run build` for minified assets
- [ ] Run `php artisan migrate --force`
- [ ] Setup proper mail driver (SMTP)
- [ ] Configure database connection
- [ ] Setup log rotation (`storage/logs/`)
- [ ] Enable HTTPS (SSL certificate)
- [ ] Set strong `APP_KEY`

---

## Troubleshooting

### "No application encryption key has been specified"
```bash
php artisan key:generate
```

### "Vite manifest not found"
```bash
npm run build
# or for development
npm run dev
```

### "Migration table not found"
```bash
php artisan migrate:install
php artisan migrate
```

### "SQLSTATE[08006] could not connect to server"
```bash
# Ensure PostgreSQL is running
# Verify credentials in .env match your setup
psql -U postgres -h localhost -d skillevidence_db_dev
```

### Tests failing with "No routes have been registered"
```bash
# Ensure routes/web.php exists and routes are defined
php artisan route:list
```

---

## AI Chatbot Module

The platform has an AI assistant that appears as a floating button on every page. Its behaviour is context-aware — the system prompt changes depending on which page the user is on.

### How context is wired

| Page | Chat type | Backend class | Route |
|---|---|---|---|
| All other pages | `platform` | `PlatformChatContext` | `POST /{locale}/chat/platform` |
| Course show page | `course` | `CourseChatContext` | `POST /{locale}/courses/{course}/chat` |
| Learn page | `resource` | `ResourceChatContext` | `POST /{locale}/courses/{course}/learn/{resource}/chat` |

On the learn page the active resource changes as the user scrolls. The frontend tracks `activeResourceId` and recomputes the `chatContext` (`endpoint` + `key`) in a `useMemo`, so the correct resource context is always sent without any page navigation.

### User context injection

Every system prompt receives one injected line built server-side by `ChatContextMeta::toContextLine()`:

```
User: authenticated. Tier: paid. Course access: full.
```

`AiChatController::buildContextMeta()` resolves all three values from `$request->user()` and the enrollment record — the client never sends this; it is always trusted from the server.

### How to inject new context in future

**Step 1 — Add a field to `ChatContextMeta`** ([app/AiChat/ChatContextMeta.php](app/AiChat/ChatContextMeta.php)):

```php
readonly class ChatContextMeta
{
    public function __construct(
        public string $authStatus,
        public string $userTier,
        public string $courseAccess = 'none',
        public string $myNewField = 'default',  // ← add here
    ) {}
}
```

**Step 2 — Populate it in `buildContextMeta()`** ([app/Http/Controllers/AiChatController.php](app/Http/Controllers/AiChatController.php)):

```php
return new ChatContextMeta(
    authStatus: $authStatus,
    userTier: $userTier,
    courseAccess: $courseAccess,
    myNewField: $resolvedValue,  // ← populate here
);
```

**Step 3a — Expose it in the shared context line** (if it should appear in all prompts):

```php
// In ChatContextMeta::toContextLine():
$line .= " My field: {$this->myNewField}.";
```

**Step 3b — Or use it only in a specific context class** (if it only makes sense for one prompt type):

```php
// In ResourceChatContext::buildSystemPrompt():
$lines[] = "Learner's current score: {$meta->myNewField}";
```

### Adding a new chat scope (e.g. a portfolio page assistant)

1. Create `app/AiChat/PortfolioChatContext.php` — static `buildSystemPrompt(User $profile, ChatContextMeta $meta): string`
2. Add `portfolio()` action to `AiChatController`, call `buildContextMeta()` and the new context class
3. Register route: `Route::post('u/{username}/chat', [AiChatController::class, 'portfolio'])->name('chat.portfolio')`
4. Run `php artisan wayfinder:generate --no-interaction`
5. In the frontend page, import the Wayfinder action, build a `ChatContext` with `type: 'portfolio'` (add it to the union in `use-chat.ts`), and pass it to `<FloatingChatButton>`

---

## Documentation Files

- **`CLAUDE.md`** — AI assistant guidelines (do not edit)
- **`__dev-progress.md`** — Feature development progress
- **`DEVELOPER_GUIDE.md`** — This file (for developers)
- **`README.md`** — Project overview (if created)

---

## Support & Issues

For technical issues:
1. Check this guide
2. Run tests: `php artisan test --compact`
3. Check logs: `tail -f storage/logs/laravel.log`
4. Read error messages carefully (they're usually helpful!)

