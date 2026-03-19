<?php

namespace App\Services;

use App\Models\ForumThread;
use App\Models\User;
use App\Models\UserReputation;
use Illuminate\Support\Facades\DB;

class ReputationService
{
    /**
     * Award points to a user for a forum event.
     *
     * @param  string  $reason  Key from config('forum.reputation.points')
     * @param  string|null  $referenceType  Morph class string (e.g. ForumThread::class)
     */
    public function award(User $user, string $reason, ?string $referenceType = null, ?int $referenceId = null): void
    {
        if ($user->is_ai) {
            return;
        }

        $points = (int) config("forum.reputation.points.{$reason}", 0);

        if ($points === 0) {
            return;
        }

        DB::transaction(function () use ($user, $reason, $points, $referenceType, $referenceId) {
            $reputation = UserReputation::firstOrCreate(
                ['user_id' => $user->id],
                ['points' => 0]
            );

            $reputation->increment('points', $points);

            DB::table('forum_reputation_events')->insert([
                'user_id' => $user->id,
                'points_delta' => $points,
                'reason' => $reason,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'created_at' => now(),
            ]);
        });
    }

    /**
     * Revoke points from a user for a forum event (e.g. vote removed).
     *
     * @param  string  $reason  Key from config('forum.reputation.points')
     */
    public function revoke(User $user, string $reason, ?string $referenceType = null, ?int $referenceId = null): void
    {
        if ($user->is_ai) {
            return;
        }

        $points = (int) config("forum.reputation.points.{$reason}", 0);

        if ($points === 0) {
            return;
        }

        DB::transaction(function () use ($user, $reason, $points, $referenceType, $referenceId) {
            $reputation = UserReputation::firstOrCreate(
                ['user_id' => $user->id],
                ['points' => 0]
            );

            // Never go below zero
            $reputation->points = max(0, $reputation->points - $points);
            $reputation->save();

            DB::table('forum_reputation_events')->insert([
                'user_id' => $user->id,
                'points_delta' => -$points,
                'reason' => $reason.'_revoked',
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'created_at' => now(),
            ]);
        });
    }

    /**
     * Award the one-time thread_created bonus when a thread gets its first upvote.
     * Idempotent: checks forum_reputation_events for prior award.
     */
    public function awardFirstUpvoteBonus(ForumThread $thread): void
    {
        /** @var \App\Models\User|null $author */
        $author = $thread->author;

        if (! $author || $author->is_ai) {
            return;
        }

        $alreadyAwarded = DB::table('forum_reputation_events')
            ->where('user_id', $author->id)
            ->where('reason', 'thread_created')
            ->where('reference_type', ForumThread::class)
            ->where('reference_id', $thread->id)
            ->exists();

        if (! $alreadyAwarded) {
            $this->award($author, 'thread_created', ForumThread::class, $thread->id);
        }
    }

    /**
     * Resolve the reputation level for a given points total.
     *
     * @return array{min: int, max: int|null, label: string, color: string}
     */
    public function levelFor(int $points): array
    {
        /** @var array<int, array{min: int, max: int|null, label: string, color: string}> $levels */
        $levels = config('forum.reputation.levels');

        foreach (array_reverse($levels) as $level) {
            if ($points >= $level['min']) {
                return $level;
            }
        }

        return $levels[0];
    }
}
