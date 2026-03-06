<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Database\Eloquent\Model;

trait ResolvesModelsBySlug
{
    /**
     * Resolve a model by its slug.
     */
    protected function resolveBySlug(string $modelClass, string $slug): Model
    {
        return $modelClass::where('slug', $slug)->firstOrFail();
    }
}
