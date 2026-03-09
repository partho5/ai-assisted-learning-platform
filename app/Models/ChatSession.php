<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChatSession extends Model
{
    /** @use HasFactory<\Database\Factories\ChatSessionFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'guest_user_id',
        'context_type',
        'context_key',
        'context_url',
    ];

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<ChatMessage, $this> */
    public function messages(): HasMany
    {
        return $this->hasMany(ChatMessage::class);
    }

    /**
     * Find an existing session or create one for the given identity + context key.
     *
     * @param  array{context_type: string, context_key: string, context_url: string}  $context
     */
    public static function findOrCreateFor(
        ?int $userId,
        ?string $guestUserId,
        array $context,
    ): self {
        $query = self::query()
            ->where('context_key', $context['context_key']);

        if ($userId) {
            $query->where('user_id', $userId);
        } else {
            $query->whereNull('user_id')->where('guest_user_id', $guestUserId);
        }

        $session = $query->first();

        if ($session) {
            // Keep context_url fresh only when it has actually changed
            if ($session->context_url !== $context['context_url']) {
                $session->update(['context_url' => $context['context_url']]);
            }

            return $session;
        }

        return self::create([
            'user_id' => $userId,
            'guest_user_id' => $userId ? null : $guestUserId,
            'context_type' => $context['context_type'],
            'context_key' => $context['context_key'],
            'context_url' => $context['context_url'],
        ]);
    }
}
