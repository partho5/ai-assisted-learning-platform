<?php

namespace App\Providers;

use App\Contracts\AiProvider;
use App\Listeners\MergeGuestChatHistory;
use App\Models\Article;
use App\Models\Course;
use App\Models\Resource;
use App\Models\User;
use App\Observers\ArticleObserver;
use App\Observers\CourseObserver;
use App\Observers\ResourceObserver;
use App\Observers\UserObserver;
use App\Services\OpenAiProvider;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Middleware\RedirectIfAuthenticated;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(AiProvider::class, OpenAiProvider::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureMailReplyTo();

        Article::observe(ArticleObserver::class);
        Course::observe(CourseObserver::class);
        User::observe(UserObserver::class);
        Resource::observe(ResourceObserver::class);

        RedirectIfAuthenticated::redirectUsing(
            fn ($request) => route('dashboard', ['locale' => $request->route('locale', config('app.locale', 'en'))]),
        );

        Event::listen(Registered::class, MergeGuestChatHistory::class);
    }

    /**
     * Set a global reply-to address for all outgoing mail if configured.
     */
    protected function configureMailReplyTo(): void
    {
        $address = config('mail.reply_to.address');
        $name = config('mail.reply_to.name');

        if ($address) {
            Mail::alwaysReplyTo($address, $name);
        }
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(8)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null
        );
    }
}
