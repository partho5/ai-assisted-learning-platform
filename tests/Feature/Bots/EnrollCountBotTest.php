<?php

namespace Tests\Feature\Bots;

use App\Bots\EnrollCountBot;
use App\Models\Course;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class EnrollCountBotTest extends TestCase
{
    use RefreshDatabase;

    public function test_increments_enrolled_count_when_dice_hits(): void
    {
        $course = Course::factory()->published()->create(['enrolled_count' => 10]);

        $bot = new class extends EnrollCountBot
        {
            protected function roll(): bool
            {
                return true;
            }
        };

        $bot->run();

        $this->assertSame(11, $course->fresh()->enrolled_count);
    }

    public function test_skips_increment_when_dice_misses(): void
    {
        $course = Course::factory()->published()->create(['enrolled_count' => 10]);

        $bot = new class extends EnrollCountBot
        {
            protected function roll(): bool
            {
                return false;
            }
        };

        $bot->run();

        $this->assertSame(10, $course->fresh()->enrolled_count);
    }

    public function test_only_targets_published_courses(): void
    {
        $published = Course::factory()->published()->create(['enrolled_count' => 5]);
        $draft = Course::factory()->create(['enrolled_count' => 5]);

        $bot = new class extends EnrollCountBot
        {
            protected function roll(): bool
            {
                return true;
            }
        };

        $bot->run();

        $this->assertSame(6, $published->fresh()->enrolled_count);
        $this->assertSame(5, $draft->fresh()->enrolled_count);
    }

    public function test_returns_incremented_and_error_counts(): void
    {
        Course::factory()->published()->count(3)->create(['enrolled_count' => 0]);

        $bot = new class extends EnrollCountBot
        {
            protected function roll(): bool
            {
                return true;
            }
        };

        $result = $bot->run();

        $this->assertSame(3, $result['incremented']);
        $this->assertSame(0, $result['errors']);
    }

    public function test_continues_processing_when_one_course_throws(): void
    {
        Log::spy();

        Course::factory()->published()->count(2)->create(['enrolled_count' => 5]);

        $callCount = 0;

        $bot = new class($callCount) extends EnrollCountBot
        {
            public function __construct(private int &$callCount) {}

            protected function roll(): bool
            {
                return true;
            }

            protected function incrementCourse(Course $course): void
            {
                $this->callCount++;
                if ($this->callCount === 1) {
                    throw new \RuntimeException('Simulated DB error');
                }
                parent::incrementCourse($course);
            }
        };

        $result = $bot->run();

        $this->assertSame(1, $result['incremented']);
        $this->assertSame(1, $result['errors']);

        // One course still incremented despite the sibling failing
        $counts = Course::query()->published()->pluck('enrolled_count')->sort()->values();
        $this->assertSame([5, 6], $counts->all());

        Log::shouldHaveReceived('error')->once();
    }

    public function test_artisan_command_succeeds_with_no_errors(): void
    {
        Course::factory()->published()->count(3)->create(['enrolled_count' => 0]);

        $this->artisan('bots:enroll-count')->assertSuccessful();
    }

    public function test_artisan_command_returns_failure_exit_code_when_errors_occur(): void
    {
        Log::spy();

        Course::factory()->published()->create(['enrolled_count' => 0]);

        $this->instance(EnrollCountBot::class, new class extends EnrollCountBot
        {
            public function run(): array
            {
                return ['incremented' => 0, 'errors' => 1];
            }
        });

        $this->artisan('bots:enroll-count')->assertFailed();
    }
}
