# Laravel Socialite Integration Plan

## CTO Recommendations for Production-Safe Social Login

---

### Current Auth Stack

- **Fortify (session-based)** with `UserRole` enum (learner/mentor/admin)
- `UserTier` for access control (free/paid)
- `EnsureRole` middleware, `role:mentor,admin` guards
- Inertia v2 SPA with session-based auth sharing
- All models FK'd to `users.id`

---

### 1. Registration + Auto-Merge — Deterministic 3-Step Ladder

The callback logic must be evaluated **in this order**:

```
Step 1: SELECT FROM social_accounts WHERE provider = ? AND provider_user_id = ?
  → Found → Auth::login(that user) → redirect to dashboard. DONE.

Step 2: SELECT FROM users WHERE email = ?
  → Found → Create social_account row linking to that user
  → Auth::login → redirect to dashboard. DONE.

Step 3: Neither matched
  → Create user (password = null, email_verified_at = now())
  → Create social_account
  → Redirect to role-selection onboarding. DONE.
```

**Why this order is critical:** Step 1 prevents duplicate social accounts. Step 2 handles the merge case. Step 3 is the new-user path. Never rearrange these.

**Why auto-merge on email is safe:** All three providers (Google, LinkedIn, Facebook) only return **verified** emails through OAuth. A verified email from Google proving `john@gmail.com` is sufficient proof of account ownership. This is what GitHub, Notion, and Figma do.

**Edge case:** Facebook can return **no email** if the user denied the `email` scope. The callback must abort with a clear message if email is missing — never create a user without one.

---

### 2. Providers — Launch Order

Google, LinkedIn, Facebook are all **first-party drivers** in `laravel/socialite`.

| Provider | Notes |
|---|---|
| **Google** | Cleanest. Always returns email, verified. No issues. |
| **LinkedIn** | Uses OpenID Connect now (`linkedin-openid` driver in Socialite, not the old `linkedin`). The old OAuth2 driver is deprecated. Verify which driver name Socialite expects. |
| **Facebook** | Requires HTTPS callback URL even in dev. Must request `email` scope explicitly. App Review required for production (Facebook will reject without privacy policy URL). |

**Decision:** Launch with **Google first**. It has zero friction (no app review, no HTTPS requirement in dev, always returns email). Add LinkedIn and Facebook in a fast follow once the flow is proven in production. The code is provider-agnostic — adding a provider is just config + registering the callback URL.

---

### 3. Social-Only Users — Nullable Password

Make `password` nullable. One-line migration, zero risk to existing rows.

**Guard two things:**

- **Profile settings page:** If `password === null`, show "Set a Password" section instead of "Change Password". Don't show current-password field they can't fill.
- **Fortify's password reset:** Let it work for social-only users too. It becomes their path to *set* a password if they ever want email/password login. Free — Fortify sends a reset link, they set a password, done.

---

### 4. No Unlinking

Skip unlinking from settings page. Not needed at this stage. Avoids edge cases (unlink only auth method + no password = locked out).

---

### 5. Callback Routes — Fixed Under `/en/`

```
GET /en/auth/{provider}/redirect
GET /en/auth/{provider}/callback
```

Put these **outside** the `setlocale` middleware group. They don't render localized content — they process OAuth and redirect. Register these exact callback URLs in each provider's developer console.

**Whitelist the `{provider}` parameter** in the controller:

```php
private array $providers = ['google', 'linkedin', 'facebook'];

// In redirect() and callback():
abort_unless(in_array($provider, $this->providers), 404);
```

Never let arbitrary strings hit `Socialite::driver($provider)`.

---

### 6. Role Selection — Onboarding Page for New Social Users

The app routes to different dashboards per role. A new social user with no role is broken.

**Decision: Lightweight onboarding page.**

- Step 3 of the merge ladder creates the user with `role = null` temporarily (make `role` nullable, or add a `UserRole::Pending` case)
- Redirect to `/en/onboarding` — a single-purpose Inertia page: "Welcome! Are you here to learn or to teach?" with two buttons
- An `EnsureOnboarded` middleware on all authenticated routes redirects to onboarding if role is not set
- After role selection → generate username from name → redirect to role-appropriate dashboard

**Why not default to learner:** A mentor who signs up via Google and lands on the learner dashboard will think something is broken. First impressions matter in production.

---

### 7. Things Most People Forget

- **Rate limiting on auth routes.** Add `throttle:5,1` middleware on the redirect route to prevent OAuth state session flooding.
- **Avatar population.** Google/LinkedIn return avatar URLs. Populate the existing `avatar` column on user creation — but only if the user doesn't already have one (for the merge case).
- **Username generation.** The social callback must use the **exact same** username-from-name logic as Fortify registration. Extract it into a shared method/service if not already.
- **Existing tests.** Nothing breaks. `actingAs()` sets a session — unchanged. Add *new* tests for the social flow, touch zero existing tests.
- **Login page UI.** Social buttons go **above** the email/password form with an "or" divider. Standard pattern (Google, GitHub, Vercel all do this).

---

### 8. Database Changes

#### `social_accounts` table (new)

```
social_accounts
├── id
├── user_id (FK → users)
├── provider (string: 'google', 'linkedin', 'facebook')
├── provider_user_id (string: provider's ID for this user)
├── created_at / updated_at
```

Why a separate table: a user might link both Google AND LinkedIn to one account.

#### `users` table changes

- `password` → nullable

---

### 9. Config

In `.env`:
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=/en/auth/google/callback

LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_REDIRECT_URI=/en/auth/linkedin/callback

FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
FACEBOOK_REDIRECT_URI=/en/auth/facebook/callback
```

In `config/services.php`:
```php
'google' => [
    'client_id' => env('GOOGLE_CLIENT_ID'),
    'client_secret' => env('GOOGLE_CLIENT_SECRET'),
    'redirect' => env('GOOGLE_REDIRECT_URI'),
],
```

---

### 10. Implementation Order for Production Safety

| Phase | What | Risk |
|---|---|---|
| **1** | Migration: nullable password + `social_accounts` table | Zero — additive only |
| **2** | `SocialLoginController` + Google only | Low — new routes, no existing code touched |
| **3** | Onboarding page for role selection | Low — new page, guarded by new middleware |
| **4** | Login/register page UI (Google button) | Low — additive UI |
| **5** | Tests for all paths (new user, merge, existing social) | Zero |
| **6** | Add LinkedIn, Facebook (config + console setup) | Zero — same code path, different config |

Each phase is independently deployable. If anything goes wrong, roll back that phase only.

---

### Security Considerations

- **CSRF:** Socialite uses the `state` parameter in OAuth automatically.
- **Open redirect:** Provider parameter whitelisted — no arbitrary strings.
- **Token storage:** No need to store OAuth access/refresh tokens unless calling provider APIs on behalf of user (not planned).
- **Email required:** Abort if provider doesn't return an email.
