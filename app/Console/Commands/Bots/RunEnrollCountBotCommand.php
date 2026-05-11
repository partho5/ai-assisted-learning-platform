<?php

namespace App\Console\Commands\Bots;

use App\Bots\EnrollCountBot;
use Illuminate\Console\Command;

class RunEnrollCountBotCommand extends Command
{
    protected $signature = 'bots:enroll-count';

    protected $description = 'Randomly increments enrolled_count on published courses (1-in-3 chance per course, runs every 6 hours).';

    public function handle(EnrollCountBot $bot): int
    {
        $result = $bot->run();

        $this->info("EnrollCountBot finished: {$result['incremented']} incremented, {$result['errors']} errors.");

        return $result['errors'] > 0 ? self::FAILURE : self::SUCCESS;
    }
}
