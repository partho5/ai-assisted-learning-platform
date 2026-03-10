<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Enable pgvector — requires PostgreSQL with pgvector installed.
        // Sail ships with it since v1.18+. On production: CREATE EXTENSION IF NOT EXISTS vector;
        DB::statement('CREATE EXTENSION IF NOT EXISTS vector');

        Schema::create('knowledge_chunks', function (Blueprint $table) {
            $table->id();
            // source_type: 'course' | 'module' | 'resource' | 'document'
            $table->string('source_type', 30);
            $table->unsignedBigInteger('source_id');
            $table->unsignedSmallInteger('chunk_index')->default(0);
            $table->text('chunk_text');
            // SHA-256 hash of chunk_text — dirty-check to skip re-embedding unchanged content
            $table->string('content_hash', 64);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['source_type', 'source_id']);
            $table->index('content_hash');
        });

        // 512-dim vector column (3× cheaper than default 1536, marginal quality loss for structured content)
        DB::statement('ALTER TABLE knowledge_chunks ADD COLUMN embedding vector(512)');

        // HNSW index for fast cosine similarity search — without this it's a full table scan
        DB::statement('CREATE INDEX knowledge_chunks_embedding_hnsw ON knowledge_chunks USING hnsw (embedding vector_cosine_ops)');
    }

    public function down(): void
    {
        Schema::dropIfExists('knowledge_chunks');
    }
};
