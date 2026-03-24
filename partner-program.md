# Partner (Affiliate) Program — Implementation Plan

## Overview

Any user (learner, mentor, admin) can become a partner. They get a unique auto-generated referral code. When someone purchases a course via their referral link (`?ref=CODE`), the partner earns a commission (% of original course price). The system is **plug-and-play** — additive only, no changes to existing models/controllers/components.

---

## Decisions (Locked)

| Decision | Choice |
|---|---|
| Route | `/en/dashboard/partner` (inside auth dashboard, all roles) |
| Attribution window | Configurable `effective_days` per partner (default 30) |
| Attribution model | Last-click (overwrite) |
| Server-side persistence | Yes — localStorage + server record on payment |
| Code generation | Auto-generated per user (one global code, course context from URL) |
| Commission base | % of **original** course price, configurable **per course** |
| Coupon + partner | Coupon discount stacks (purchaser pays less), but partner commission is always on original price. Combined discount to purchaser cannot exceed 100%. |
| Subscription | First payment only |
| Self-referral | Blocked |
| Refund | Commission revoked |

---

## Database Schema

### Migration 1: `create_partners_table`

```
partners
├── id                  bigint PK
├── user_id             bigint FK → users (unique)
├── code                varchar(20) unique  -- auto-generated, e.g. "THUT245"
├── effective_days      integer default 30  -- attribution window
├── is_active           boolean default true
├── created_at          timestamp
└── updated_at          timestamp
```

- One partner record per user. Not all users are partners — opt-in.
- `code` auto-generated on creation: first 4 chars of uppercase name (stripped non-alpha) + random 3 digits. Retry on collision.

### Migration 2: `create_partner_commissions_table`

```
partner_commissions
├── id                  bigint PK
├── partner_id          bigint FK → partners
├── payment_id          bigint FK → payments (unique — one commission per payment)
├── course_id           bigint FK → courses
├── purchaser_user_id   bigint FK → users
├── commission_rate     decimal(5,2)  -- e.g. 10.00 for 10%
├── base_amount         decimal(10,2) -- original course price
├── commission_amount   decimal(10,2) -- calculated: base_amount * rate / 100
├── status              varchar(20) default 'pending'  -- pending | confirmed | revoked
├── created_at          timestamp
└── updated_at          timestamp
```

- `payment_id` unique → prevents double commission.
- `status`: `pending` on capture → `confirmed` after effective_days or admin action (phase 2) → `revoked` on refund.
- For now: stays `pending` until admin pays out (future). Revoke on refund.

### Migration 3: `add_referred_by_partner_id_to_payments`

```
payments (add column)
└── referred_by_partner_id  bigint nullable FK → partners (on delete set null)
```

- Single nullable FK on existing `payments` table. Clean, minimal.

### Migration 4: `create_partner_referrals_table` (server-side ref tracking)

```
partner_referrals
├── id                  bigint PK
├── partner_id          bigint FK → partners
├── course_id           bigint FK → courses
├── visitor_user_id     bigint nullable FK → users  -- null if guest at click time
├── visitor_session_id  varchar(100)  -- session ID for guest → user resolution
├── clicked_at          timestamp
├── expires_at          timestamp     -- clicked_at + partner.effective_days
├── converted_at        timestamp nullable  -- set when payment captured
├── created_at          timestamp
└── updated_at          timestamp
```

- Tracks every ref click server-side as backup to localStorage.
- `visitor_session_id` allows matching guest clicks to authenticated purchases.
- Unique constraint: `(partner_id, course_id, visitor_session_id)` — last-click overwrites.

---

## Models

### `Partner`
- `belongsTo(User)`
- `hasMany(PartnerCommission)`
- `hasMany(PartnerReferral)`
- Auto-generate `code` in `creating` event.
- Scope `active()` → `where('is_active', true)`.

### `PartnerCommission`
- `belongsTo(Partner)`
- `belongsTo(Payment)`
- `belongsTo(Course)`
- `belongsTo(User, 'purchaser_user_id')`
- Scopes: `pending()`, `confirmed()`, `revoked()`.

### `PartnerReferral`
- `belongsTo(Partner)`, `belongsTo(Course)`, `belongsTo(User, 'visitor_user_id')`
- Scope `active()` → `whereNull('converted_at')->where('expires_at', '>', now())`.

### `Payment` (existing — add relation)
- `belongsTo(Partner, 'referred_by_partner_id')` — new relation, no other changes.

---

## Course-Level Commission Rate

Rather than a global config or a per-partner rate, commission is **per course**:

### Migration 5: `add_partner_commission_rate_to_courses`

```
courses (add column)
└── partner_commission_rate  decimal(5,2) nullable  -- null = partner program disabled for this course
```

- `null` → this course does not participate in the partner program.
- Set by mentor/admin on the course edit page.
- Simple: no complex rate matrix, no per-partner overrides (phase 2 if needed).

---

## Backend Flow

### 1. Partner Opt-In

- **Route**: `POST /{locale}/dashboard/partner` (store) — creates Partner record for `auth()->user()`.
- **Controller**: `PartnerController@store` — checks no existing partner, auto-generates code, creates record.
- No approval flow (phase 1). Instant activation.

### 2. Referral Click Tracking

- **Route**: `POST /{locale}/referral/track` — called by frontend when `?ref=` detected.
- **Controller**: `PartnerReferralController@track`
  - Validate code exists and partner is active.
  - Validate course exists and has `partner_commission_rate` set.
  - Upsert `partner_referrals` (last-click: overwrite existing for same session+course).
  - Return `{ valid: true, partner_code: code }` or `{ valid: false }`.
- Works for both guests and authenticated users (uses session ID).

### 3. Payment Integration (Minimal Touch to PaymentController)

In `PaymentController`:
- `createOrder()` and `createSubscription()` — accept optional `referral_code` from request body.
  - Look up active `PartnerReferral` for this user+course (or by session).
  - Alternatively, accept the code directly from frontend (localStorage).
  - Validate: partner is active, course has commission rate, not self-referral, referral not expired.
  - If valid, set `referred_by_partner_id` on the Payment record.
- `captureOrder()` and `activateSubscription()` — after successful capture, if `payment.referred_by_partner_id` is set:
  - Create `PartnerCommission` record with calculated amount.
  - Mark `PartnerReferral` as converted (`converted_at = now()`).
- `handleRefund()` — if payment has commission, update commission status to `revoked`.

**Changes to PaymentController are surgical**: ~15 lines added across 3 methods. No logic restructuring.

### 4. Partner Dashboard

- **Route**: `GET /{locale}/dashboard/partner`
- **Controller**: `PartnerController@index`
  - Partner record (code, effective_days, is_active).
  - Commissions summary: total_earned, total_pending, total_revoked.
  - Per-course breakdown: course title, commission count, total amount.
  - Recent commissions list (paginated).
- **Page**: `resources/js/pages/dashboard/partner.tsx`

---

## Frontend Flow

### 1. Ref Code Capture (localStorage — per course)

**New utility**: `resources/js/lib/referral.ts`

```typescript
// localStorage key format: `ref_{courseSlug}`
// Value: JSON { code: string, timestamp: number }

export function captureReferral(courseSlug: string, code: string): void
export function getReferral(courseSlug: string, effectiveDays?: number): string | null
export function clearReferral(courseSlug: string): void
```

- `captureReferral`: stores `{ code, timestamp: Date.now() }` under `ref_{courseSlug}`.
- `getReferral`: reads, checks TTL (default 30 days), returns code or null (clears if expired).
- `clearReferral`: removes the key.

### 2. Ref Detection on Course Pages

**In `courses/show.tsx`** (course detail page):
- On mount, read URL `?ref=` param.
- If present:
  - Call `POST /referral/track` to validate + persist server-side.
  - If valid, `captureReferral(course.slug, code)`.
  - Strip `?ref=` from URL (clean UX) via `history.replaceState`.

### 3. Send Ref Code at Checkout

**In `checkout-modal.tsx`**:
- On modal open, call `getReferral(course.slug)` from localStorage.
- Pass `referral_code` in `createOrder` / `createSubscription` request body alongside `coupon_code`.
- No UI change needed — referral is invisible to the purchaser.

### 4. Sidebar Link

**In `app-sidebar.tsx`**:
- Add "Partner" link to all roles' nav under a new "Partner" section (or append to Personal section).
- Href: `/${locale}/dashboard/partner`.
- Icon: `Handshake` from lucide-react.

### 5. Partner Dashboard Page

`resources/js/pages/dashboard/partner.tsx`:
- **Not a partner yet**: CTA button "Become a Partner" → POST creates partner record → reload.
- **Is a partner**:
  - Referral code display with copy button.
  - Link generator: select a course → generates `{courseUrl}?ref={code}`.
  - Earnings summary cards: Total Earned | Pending | Revoked.
  - Per-course table: Course | Referrals | Conversions | Earned.
  - Recent commissions table: Date | Course | Purchaser (anonymized) | Amount | Status.

---

## Mentor/Admin: Course Commission Rate Setting

**In course edit page** (existing):
- Add a field: "Partner Commission Rate (%)" — nullable number input.
- `null` / empty = course not in partner program.
- Stored in `courses.partner_commission_rate`.

**No changes to course creation flow** — just an optional field on edit.

---

## Self-Referral Prevention

In `PaymentController` when resolving referral:
```php
if ($partner->user_id === $request->user()->id) {
    // Silently ignore — don't block purchase, just don't attribute
    $referredByPartnerId = null;
}
```

---

## Refund → Commission Revoke

In `PaymentController::handleRefund()`, add after existing logic:
```php
PartnerCommission::where('payment_id', $payment->id)
    ->where('status', '!=', 'revoked')
    ->update(['status' => 'revoked']);
```

---

## Files to Create (New)

| File | Purpose |
|---|---|
| `database/migrations/xxxx_create_partners_table.php` | Partners table |
| `database/migrations/xxxx_create_partner_commissions_table.php` | Commissions table |
| `database/migrations/xxxx_add_referred_by_partner_id_to_payments.php` | FK on payments |
| `database/migrations/xxxx_create_partner_referrals_table.php` | Server-side ref tracking |
| `database/migrations/xxxx_add_partner_commission_rate_to_courses.php` | Per-course rate |
| `app/Models/Partner.php` | Partner model |
| `app/Models/PartnerCommission.php` | Commission model |
| `app/Models/PartnerReferral.php` | Referral tracking model |
| `app/Http/Controllers/PartnerController.php` | Dashboard + opt-in |
| `app/Http/Controllers/PartnerReferralController.php` | Ref click tracking |
| `resources/js/lib/referral.ts` | localStorage utility |
| `resources/js/pages/dashboard/partner.tsx` | Partner dashboard page |
| `tests/Feature/PartnerProgramTest.php` | Feature tests |

## Files to Edit (Existing — Minimal)

| File | Change |
|---|---|
| `app/Http/Controllers/PaymentController.php` | Accept `referral_code`, set FK on Payment, create commission on capture, revoke on refund (~20 lines) |
| `app/Models/Payment.php` | Add `belongsTo(Partner)` relation + `referred_by_partner_id` to fillable (~3 lines) |
| `app/Models/Course.php` | Add `partner_commission_rate` to fillable/casts (~2 lines) |
| `resources/js/components/payment/checkout-modal.tsx` | Read localStorage ref, pass in request body (~5 lines) |
| `resources/js/pages/courses/show.tsx` | Detect `?ref=`, call track endpoint, store in localStorage (~10 lines) |
| `resources/js/components/app-sidebar.tsx` | Add Partner nav link (~3 lines) |
| `routes/web.php` | Add partner routes (~8 lines) |
| Mentor course edit page | Add commission rate input field (~5 lines) |

---

## Implementation Order

1. **Migrations + Models** — schema first
2. **Partner opt-in** — controller + route + basic dashboard page
3. **Referral tracking** — localStorage utility + `courses/show.tsx` ref detection + server tracking
4. **Payment integration** — wire ref into PaymentController (createOrder, captureOrder, refund)
5. **Commission recording** — create commission on successful capture
6. **Partner dashboard** — earnings display, link generator
7. **Course edit** — commission rate field
8. **Sidebar** — add Partner link
9. **Tests** — full coverage
10. **Pint** — format

---

## What This Does NOT Touch

- Enrollment logic (unchanged)
- Coupon system (unchanged — coupon discount is purchaser-facing, commission is partner-facing on original price)
- Existing dashboard pages
- User roles / permissions
- Frontend layouts
- PayPal integration (no new PayPal API calls)
- Any existing tests
