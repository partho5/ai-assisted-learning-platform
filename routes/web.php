<?php

use App\Http\Controllers\Admin\AiStatsController;
use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\ChatSessionController as AdminChatSessionController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\Forum\ForumAiMemberAdminController;
use App\Http\Controllers\Admin\Forum\ForumCategoryAdminController;
use App\Http\Controllers\Admin\Forum\ForumModerationController;
use App\Http\Controllers\Admin\SubmissionController as AdminSubmissionController;
use App\Http\Controllers\AiChatController;
use App\Http\Controllers\AiHelpController;
use App\Http\Controllers\ChatHistoryController;
use App\Http\Controllers\CouponCodeController;
use App\Http\Controllers\CourseAuthorController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\Forum\ForumBookmarkController;
use App\Http\Controllers\Forum\ForumCategoryController;
use App\Http\Controllers\Forum\ForumController;
use App\Http\Controllers\Forum\ForumPushSubscriptionController;
use App\Http\Controllers\Forum\ForumReplyController;
use App\Http\Controllers\Forum\ForumReportController;
use App\Http\Controllers\Forum\ForumSearchController;
use App\Http\Controllers\Forum\ForumThreadController;
use App\Http\Controllers\Forum\ForumThreadFollowController;
use App\Http\Controllers\Forum\ForumThreadModerationController;
use App\Http\Controllers\Forum\ForumVoteController;
use App\Http\Controllers\LearnController;
use App\Http\Controllers\LlmsTxtController;
use App\Http\Controllers\Mentor\CategoryController as MentorCategoryController;
use App\Http\Controllers\Mentor\DashboardController as MentorDashboardController;
use App\Http\Controllers\ModuleController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PersonalNotesController;
use App\Http\Controllers\PortfolioController;
use App\Http\Controllers\PublicProfileController;
use App\Http\Controllers\ResourceCompletionController;
use App\Http\Controllers\ResourceController;
use App\Http\Controllers\RobotsController;
use App\Http\Controllers\SitemapController;
use App\Http\Controllers\SubmissionController;
use App\Http\Controllers\TestAttemptController;
use App\Http\Controllers\TestController;
use App\Http\Controllers\TestQuestionController;
use App\Http\Controllers\TestQuestionOptionController;
use App\Http\Controllers\WelcomeController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Robots, Sitemap & LLMs — outside locale prefix
Route::get('/robots.txt', [RobotsController::class, 'index'])->name('robots');
Route::get('/sitemap.xml', [SitemapController::class, 'index'])->name('sitemap');
Route::get('/llms.txt', [LlmsTxtController::class, 'index'])->name('llms');

// Redirect bare root to default locale
Route::redirect('/', '/en');

// All content routes live under /{locale}/ for SEO (EN/BN URL routing)
Route::prefix('{locale}')
    ->where(['locale' => 'en|bn'])
    ->middleware('setlocale')
    ->group(function () {
        Route::get('/', [WelcomeController::class, 'index'])->name('home');

        Route::get('about-us', function () {
            return Inertia::render('about-us');
        })->name('about-us');

        Route::get('privacy-policy', function () {
            return Inertia::render('privacy-policy');
        })->name('privacy-policy');

        Route::get('terms', function () {
            return Inertia::render('terms');
        })->name('terms');

        Route::get('refund-policy', function () {
            return Inertia::render('refund-policy');
        })->name('refund-policy');

        Route::get('contact', function () {
            return Inertia::render('contact');
        })->name('contact');

        Route::get('dashboard', [DashboardController::class, 'index'])
            ->middleware(['auth', 'verified'])
            ->name('dashboard');

        // Personal notes — every authenticated user
        Route::middleware(['auth', 'verified'])->group(function () {
            Route::get('notes', [PersonalNotesController::class, 'edit'])->name('notes.edit');
            Route::patch('notes', [PersonalNotesController::class, 'update'])->name('notes.update');
        });

        // Mentor dashboard
        Route::get('mentor/dashboard', [MentorDashboardController::class, 'index'])
            ->middleware(['auth', 'verified', 'role:mentor,admin'])
            ->name('mentor.dashboard');

        // Admin dashboard
        Route::get('admin/dashboard', [AdminDashboardController::class, 'index'])
            ->middleware(['auth', 'verified', 'role:admin'])
            ->name('admin.dashboard');

        // Admin-only routes
        Route::middleware(['auth', 'verified', 'role:admin'])->group(function () {
            Route::get('admin/chats/{chatSession}', [AdminChatSessionController::class, 'show'])->name('admin.chats.show');
            Route::get('admin/submissions', [AdminSubmissionController::class, 'index'])->name('admin.submissions.index');
            Route::get('admin/ai-stats', [AiStatsController::class, 'index'])->name('admin.ai-stats');
            Route::post('courses/{course}/approve', [CourseController::class, 'approve'])->name('courses.approve');
            Route::post('courses/{course}/reject', [CourseController::class, 'reject'])->name('courses.reject');
        });

        // Mentor category management (create & edit, no delete)
        Route::middleware(['auth', 'verified', 'role:mentor,admin'])->group(function () {
            Route::get('mentor/categories', [MentorCategoryController::class, 'index'])->name('mentor.categories.index');
            Route::get('mentor/categories/create', [MentorCategoryController::class, 'create'])->name('mentor.categories.create');
            Route::post('mentor/categories', [MentorCategoryController::class, 'store'])->name('mentor.categories.store');
            Route::get('mentor/categories/{category}/edit', [MentorCategoryController::class, 'edit'])->name('mentor.categories.edit');
            Route::put('mentor/categories/{category}', [MentorCategoryController::class, 'update'])->name('mentor.categories.update');
        });

        // Admin category management
        Route::middleware(['auth', 'verified', 'role:admin'])->group(function () {
            Route::get('admin/categories', [AdminCategoryController::class, 'index'])->name('admin.categories.index');
            Route::get('admin/categories/create', [AdminCategoryController::class, 'create'])->name('admin.categories.create');
            Route::post('admin/categories', [AdminCategoryController::class, 'store'])->name('admin.categories.store');
            Route::get('admin/categories/{category}/edit', [AdminCategoryController::class, 'edit'])->name('admin.categories.edit');
            Route::put('admin/categories/{category}', [AdminCategoryController::class, 'update'])->name('admin.categories.update');
            Route::delete('admin/categories/{category}', [AdminCategoryController::class, 'destroy'])->name('admin.categories.destroy');
        });

        // Course learn page — public for free resources, auth handled in controller
        Route::get('courses/{course}/learn/{resource}', [LearnController::class, 'show'])
            ->name('learn.show');

        // AI Chat — platform, course, and resource assistants (all public, auth optional)
        Route::post('chat/platform', [AiChatController::class, 'platform'])
            ->middleware('throttle:15,1')
            ->name('chat.platform');

        Route::post('courses/{course}/chat', [AiChatController::class, 'course'])
            ->middleware('throttle:15,1')
            ->name('chat.course');

        Route::post('courses/{course}/learn/{resource}/chat', [AiChatController::class, 'resource'])
            ->middleware('throttle:20,1')
            ->name('chat.resource');

        // Chat history — public (guest_user_id identifies guests)
        Route::get('chat/history', [ChatHistoryController::class, 'index'])
            ->name('chat.history.index');
        Route::delete('chat/history', [ChatHistoryController::class, 'destroy'])
            ->name('chat.history.destroy');

        // Learning experience — auth-required interactions
        Route::middleware(['auth', 'verified'])->group(function () {
            Route::post('courses/{course}/learn/{resource}/attempts', [TestAttemptController::class, 'store'])
                ->name('learn.attempts.store');
            Route::put('test-attempts/{attempt}/answers', [TestAttemptController::class, 'saveAnswers'])
                ->name('learn.attempts.answers');
            Route::post('test-attempts/{attempt}/submit', [TestAttemptController::class, 'submit'])
                ->name('learn.attempts.submit');
            Route::get('test-attempts/{attempt}/result', [TestAttemptController::class, 'result'])
                ->name('learn.attempts.result');
            Route::post('courses/{course}/learn/{resource}/complete', [ResourceCompletionController::class, 'complete'])
                ->name('learn.complete');
            Route::post('test-questions/{question}/ai-help', [AiHelpController::class, 'ask'])
                ->name('ai.help');
        });

        // Course management — mentor & admin only (must come before wildcard {course} routes)
        Route::middleware(['auth', 'verified', 'role:mentor,admin'])->group(function () {
            Route::get('courses/create', [CourseController::class, 'create'])
                ->name('courses.create');
            Route::get('courses/{course}/preview', [CourseController::class, 'preview'])
                ->name('courses.preview');
            Route::post('courses/{course}/submit-review', [CourseController::class, 'submitForReview'])
                ->name('courses.submit-review');
            Route::post('courses', [CourseController::class, 'store'])
                ->name('courses.store');
            Route::get('courses/{course}/edit', [CourseController::class, 'edit'])
                ->name('courses.edit');
            Route::put('courses/{course}', [CourseController::class, 'update'])
                ->name('courses.update');
            Route::delete('courses/{course}', [CourseController::class, 'destroy'])
                ->name('courses.destroy');

            Route::post('courses/{course}/authors', [CourseAuthorController::class, 'store'])
                ->name('courses.authors.store');
            Route::delete('courses/{course}/authors/{author}', [CourseAuthorController::class, 'destroy'])
                ->name('courses.authors.destroy');

            Route::post('courses/{course}/modules', [ModuleController::class, 'store'])
                ->name('modules.store');
            Route::post('courses/{course}/modules/reorder', [ModuleController::class, 'reorder'])
                ->name('modules.reorder');
            Route::put('courses/{course}/modules/{module}', [ModuleController::class, 'update'])
                ->name('modules.update');
            Route::delete('courses/{course}/modules/{module}', [ModuleController::class, 'destroy'])
                ->name('modules.destroy');

            Route::post('courses/{course}/modules/{module}/resources', [ResourceController::class, 'store'])
                ->name('resources.store');
            Route::post('courses/{course}/modules/{module}/resources/reorder', [ResourceController::class, 'reorder'])
                ->name('resources.reorder');
            Route::put('courses/{course}/modules/{module}/resources/{resource}', [ResourceController::class, 'update'])
                ->name('resources.update');
            Route::delete('courses/{course}/modules/{module}/resources/{resource}', [ResourceController::class, 'destroy'])
                ->name('resources.destroy');

            // Test CRUD
            Route::get('courses/{course}/modules/{module}/resources/{resource}/test', [TestController::class, 'edit'])
                ->name('tests.edit');
            Route::post('courses/{course}/modules/{module}/resources/{resource}/test', [TestController::class, 'store'])
                ->name('tests.store');
            Route::put('courses/{course}/modules/{module}/resources/{resource}/test/{test}', [TestController::class, 'update'])
                ->name('tests.update');
            Route::delete('courses/{course}/modules/{module}/resources/{resource}/test/{test}', [TestController::class, 'destroy'])
                ->name('tests.destroy');

            // Question CRUD + reorder
            Route::post('tests/{test}/questions', [TestQuestionController::class, 'store'])
                ->name('test-questions.store');
            Route::put('tests/{test}/questions/{question}', [TestQuestionController::class, 'update'])
                ->name('test-questions.update');
            Route::delete('tests/{test}/questions/{question}', [TestQuestionController::class, 'destroy'])
                ->name('test-questions.destroy');
            Route::post('tests/{test}/questions/reorder', [TestQuestionController::class, 'reorder'])
                ->name('test-questions.reorder');

            // Question option CRUD
            Route::post('tests/{test}/questions/{question}/options', [TestQuestionOptionController::class, 'store'])
                ->name('test-question-options.store');
            Route::put('tests/{test}/questions/{question}/options/{option}', [TestQuestionOptionController::class, 'update'])
                ->name('test-question-options.update');
            Route::delete('tests/{test}/questions/{question}/options/{option}', [TestQuestionOptionController::class, 'destroy'])
                ->name('test-question-options.destroy');

            // Submissions & endorsement
            Route::get('courses/{course}/submissions', [SubmissionController::class, 'index'])
                ->name('submissions.index');
            Route::get('test-attempts/{attempt}', [TestAttemptController::class, 'show'])
                ->name('test-attempts.show');
            Route::post('test-attempts/{attempt}/endorse', [TestAttemptController::class, 'endorse'])
                ->name('test-attempts.endorse');
        });

        // Public course catalog & detail (no auth required, after specific routes)
        Route::get('courses', [CourseController::class, 'index'])->name('courses.index');
        Route::get('courses/{course}', [CourseController::class, 'show'])->name('courses.show');

        // Enrollment (auth required)
        Route::post('courses/{course}/enroll', [EnrollmentController::class, 'store'])
            ->middleware(['auth', 'verified'])
            ->name('courses.enroll');

        // Payment — coupon validation is public; order/subscription require auth
        Route::post('courses/{course}/payment/coupon', [PaymentController::class, 'validateCoupon'])
            ->name('payment.coupon.validate');

        Route::middleware(['auth', 'verified'])->group(function () {
            // One-time purchase
            Route::post('courses/{course}/payment/order', [PaymentController::class, 'createOrder'])
                ->name('payment.order.create');
            Route::post('courses/{course}/payment/order/capture', [PaymentController::class, 'captureOrder'])
                ->name('payment.order.capture');

            // Subscription
            Route::post('courses/{course}/payment/subscribe', [PaymentController::class, 'createSubscription'])
                ->name('payment.subscription.create');
            Route::post('courses/{course}/payment/subscribe/activate', [PaymentController::class, 'activateSubscription'])
                ->name('payment.subscription.activate');
        });

        // Subscription return/cancel redirects (GET, auth required)
        Route::get('courses/{course}/payment/subscribe/return', [PaymentController::class, 'subscriptionReturn'])
            ->middleware(['auth', 'verified'])
            ->name('payment.subscription.return');
        Route::get('courses/{course}/payment/subscribe/cancel', [PaymentController::class, 'subscriptionCancel'])
            ->name('payment.subscription.cancel');

        // Coupon management (mentor/admin)
        Route::middleware(['auth', 'verified', 'role:mentor,admin'])->group(function () {
            Route::post('courses/{course}/coupons', [CouponCodeController::class, 'store'])
                ->name('coupons.store');
            Route::delete('courses/{course}/coupons/{couponCode}', [CouponCodeController::class, 'destroy'])
                ->name('coupons.destroy');
        });

        // Public evidence portfolio
        Route::get('u/{username}', [PublicProfileController::class, 'show'])->name('portfolio.show');

        // Portfolio showcase toggle (auth required)
        Route::post('portfolio/attempts/{attempt}/showcase', [PortfolioController::class, 'toggleShowcase'])
            ->middleware(['auth', 'verified'])
            ->name('portfolio.showcase');

        // -----------------------------------------------------------------------
        // Forum — public reading; auth required for writes
        // NOTE: Specific static paths (create, search, threads/*, replies/*)
        //       must be registered BEFORE wildcard slug routes.
        // -----------------------------------------------------------------------

        // Forum home & search (public) — static paths first
        Route::get('forum', [ForumController::class, 'index'])->name('forum.index');
        Route::get('forum/search', [ForumSearchController::class, 'index'])->name('forum.search');

        // Thread create form (auth) — must be before {forumCategory:slug} wildcard
        Route::get('forum/create', [ForumThreadController::class, 'create'])
            ->middleware(['auth', 'verified'])
            ->name('forum.threads.create');

        // Thread store (auth) — uses /forum/threads prefix to avoid wildcard clash
        Route::post('forum/threads', [ForumThreadController::class, 'store'])
            ->middleware(['auth', 'verified'])
            ->name('forum.threads.store');

        // Auth-only JSON endpoints with explicit prefixes (before wildcard routes)
        Route::middleware(['auth', 'verified'])->group(function () {
            // Votes (JSON responses) — bind by ID since these routes have no slug context
            Route::post('forum/threads/{forumThread:id}/vote', [ForumVoteController::class, 'thread'])->name('forum.votes.thread');
            Route::post('forum/replies/{forumReply:id}/vote', [ForumVoteController::class, 'reply'])->name('forum.votes.reply');

            // Bookmarks & Follows (JSON responses)
            Route::post('forum/threads/{forumThread:id}/bookmark', [ForumBookmarkController::class, 'toggle'])->name('forum.bookmarks.toggle');
            Route::post('forum/threads/{forumThread:id}/follow', [ForumThreadFollowController::class, 'toggle'])->name('forum.follows.toggle');

            // Reports (JSON responses)
            Route::post('forum/threads/{forumThread:id}/report', [ForumReportController::class, 'thread'])->name('forum.reports.thread');
            Route::post('forum/replies/{forumReply:id}/report', [ForumReportController::class, 'reply'])->name('forum.reports.reply');

            // Push notification subscription
            Route::post('forum/push-subscription', [ForumPushSubscriptionController::class, 'store'])->name('forum.push-subscription.store');
        });

        // Category page (public) — wildcard after static paths
        Route::get('forum/{forumCategory:slug}', [ForumCategoryController::class, 'show'])->name('forum.category.show');

        // Thread show (public)
        Route::get('forum/{forumCategory:slug}/{forumThread:slug}', [ForumThreadController::class, 'show'])->name('forum.threads.show');

        // Auth-required thread & reply actions (use slug wildcards, registered after show routes)
        Route::middleware(['auth', 'verified'])->group(function () {
            Route::get('forum/{forumCategory:slug}/{forumThread:slug}/edit', [ForumThreadController::class, 'edit'])->name('forum.threads.edit');
            Route::put('forum/{forumCategory:slug}/{forumThread:slug}', [ForumThreadController::class, 'update'])->name('forum.threads.update');
            Route::delete('forum/{forumCategory:slug}/{forumThread:slug}', [ForumThreadController::class, 'destroy'])->name('forum.threads.destroy');

            // Replies
            Route::post('forum/{forumCategory:slug}/{forumThread:slug}/replies', [ForumReplyController::class, 'store'])->name('forum.replies.store');
            Route::put('forum/{forumCategory:slug}/{forumThread:slug}/replies/{forumReply}', [ForumReplyController::class, 'update'])->name('forum.replies.update');
            Route::delete('forum/{forumCategory:slug}/{forumThread:slug}/replies/{forumReply}', [ForumReplyController::class, 'destroy'])->name('forum.replies.destroy');
            Route::post('forum/{forumCategory:slug}/{forumThread:slug}/replies/{forumReply}/accept', [ForumReplyController::class, 'accept'])->name('forum.replies.accept');
        });

        // Moderator actions (admin + mentor)
        Route::middleware(['auth', 'verified', 'role:mentor,admin'])->group(function () {
            Route::post(
                'forum/{forumCategory:slug}/{forumThread:slug}/pin',
                [ForumThreadModerationController::class, 'pin']
            )->name('forum.moderation.pin');

            Route::post(
                'forum/{forumCategory:slug}/{forumThread:slug}/lock',
                [ForumThreadModerationController::class, 'lock']
            )->name('forum.moderation.lock');

            Route::post(
                'forum/{forumCategory:slug}/{forumThread:slug}/move',
                [ForumThreadModerationController::class, 'move']
            )->name('forum.moderation.move');
        });

        // Admin forum management
        Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin/forum')->group(function () {
            Route::get('categories', [ForumCategoryAdminController::class, 'index'])->name('admin.forum.categories.index');
            Route::post('categories', [ForumCategoryAdminController::class, 'store'])->name('admin.forum.categories.store');
            Route::put('categories/{forumCategory}', [ForumCategoryAdminController::class, 'update'])->name('admin.forum.categories.update');
            Route::delete('categories/{forumCategory}', [ForumCategoryAdminController::class, 'destroy'])->name('admin.forum.categories.destroy');

            Route::get('ai-members', [ForumAiMemberAdminController::class, 'index'])->name('admin.forum.ai-members.index');
            Route::post('ai-members', [ForumAiMemberAdminController::class, 'store'])->name('admin.forum.ai-members.store');
            Route::put('ai-members/{aiMember}', [ForumAiMemberAdminController::class, 'update'])->name('admin.forum.ai-members.update');
            Route::delete('ai-members/{aiMember}', [ForumAiMemberAdminController::class, 'destroy'])->name('admin.forum.ai-members.destroy');

            Route::get('moderation', [ForumModerationController::class, 'index'])->name('admin.forum.moderation.index');
            Route::post('moderation/{forumReport}/resolve', [ForumModerationController::class, 'resolve'])->name('admin.forum.moderation.resolve');
            Route::delete('moderation/{forumReport}/content', [ForumModerationController::class, 'deleteContent'])->name('admin.forum.moderation.delete-content');
        });
    });

// PayPal webhook — outside locale prefix, CSRF excluded in bootstrap/app.php
Route::post('webhooks/paypal', [PaymentController::class, 'webhook'])
    ->name('webhooks.paypal');

require __DIR__.'/settings.php';
