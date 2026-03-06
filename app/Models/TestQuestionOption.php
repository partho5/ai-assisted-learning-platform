<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TestQuestionOption extends Model
{
    /** @var list<string> */
    protected $fillable = [
        'test_question_id',
        'label',
        'order',
    ];

    /** @return BelongsTo<TestQuestion, $this> */
    public function question(): BelongsTo
    {
        return $this->belongsTo(TestQuestion::class, 'test_question_id');
    }
}
