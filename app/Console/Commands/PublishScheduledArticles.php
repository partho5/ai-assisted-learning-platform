<?php

namespace App\Console\Commands;

use App\Enums\ArticleStatus;
use App\Models\Article;
use Illuminate\Console\Command;

class PublishScheduledArticles extends Command
{
    protected $signature = 'articles:publish-scheduled';

    protected $description = 'Promote scheduled articles whose publish time has arrived to published status';

    public function handle(): int
    {
        $count = Article::query()
            ->where('status', ArticleStatus::Scheduled->value)
            ->where('published_at', '<=', now())
            ->update(['status' => ArticleStatus::Published->value]);

        if ($count > 0) {
            $this->info("Published {$count} scheduled article(s).");
        }

        return self::SUCCESS;
    }
}
