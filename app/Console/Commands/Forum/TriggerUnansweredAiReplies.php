<?php

namespace App\Console\Commands\Forum;

use App\Services\TriggerEvaluator;
use Illuminate\Console\Command;

class TriggerUnansweredAiReplies extends Command
{
    protected $signature = 'forum:trigger-unanswered';

    protected $description = 'Dispatch AI replies for forum threads that have received no human response within the configured threshold.';

    public function handle(TriggerEvaluator $evaluator): int
    {
        $evaluator->onUnanswered();

        $this->info('AI reply jobs dispatched for unanswered threads.');

        return Command::SUCCESS;
    }
}
