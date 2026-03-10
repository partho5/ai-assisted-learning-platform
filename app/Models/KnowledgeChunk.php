<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KnowledgeChunk extends Model
{
    protected $fillable = [
        'source_type',
        'source_id',
        'chunk_index',
        'chunk_text',
        'content_hash',
        'embedding',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'chunk_index' => 'integer',
        ];
    }
}
