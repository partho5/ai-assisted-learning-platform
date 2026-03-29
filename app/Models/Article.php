<?php

namespace App\Models;

use App\Enums\ArticleStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Article extends Model
{
    /** @use HasFactory<\Database\Factories\ArticleFactory> */
    use HasFactory;

    protected $fillable = [
        'author_id',
        'category_id',
        'title',
        'slug',
        'excerpt',
        'body',
        'featured_image',
        'featured_image_alt',
        'tags',
        'status',
        'read_time_minutes',
        'published_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'status' => ArticleStatus::class,
            'tags' => 'array',
            'published_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /** @return BelongsTo<Category, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /**
     * True when the article should be visible on the public site.
     * Includes "scheduled" articles whose publish time has arrived.
     */
    public function isPublished(): bool
    {
        return $this->status === ArticleStatus::Published
            || ($this->status === ArticleStatus::Scheduled && $this->published_at?->isPast());
    }

    /** @param Builder<Article> $query */
    public function scopePublished(Builder $query): void
    {
        $query->where(function (Builder $q) {
            $q->where('status', ArticleStatus::Published->value)
                ->orWhere(function (Builder $q2) {
                    $q2->where('status', ArticleStatus::Scheduled->value)
                        ->where('published_at', '<=', now());
                });
        });
    }

    /** Auto-calculate read time from body word count (200 wpm). */
    public static function calculateReadTime(string $body): int
    {
        $words = str_word_count(strip_tags($body));

        return max(1, (int) ceil($words / 200));
    }

    /**
     * Detect whether this article's title/body warrants HowTo schema.
     * Matches: "how to", "how do", "steps to", "step-by-step", "guide to".
     */
    public function detectsHowTo(): bool
    {
        return (bool) preg_match(
            '/^(how\s+to|how\s+do|steps?\s+to|step-by-step|guide\s+to)\b/i',
            $this->title
        );
    }

    /**
     * Detect whether the body contains 2+ H2/H3 headings ending with "?"
     * which indicates FAQ-style content.
     */
    public function detectsFaq(): bool
    {
        preg_match_all('/<h[23][^>]*>[^<]*\?[^<]*<\/h[23]>/i', $this->body ?? '', $matches);

        return count($matches[0]) >= 2;
    }
}
