<?php

namespace App\Jobs;

use App\Services\LinkSanitizerService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Queue\Queueable;

class SanitizeContentLinks implements ShouldQueue
{
    use Queueable;

    /** @var class-string<Model> */
    public readonly string $modelClass;

    public readonly int $modelId;

    public readonly string $field;

    /**
     * @param  class-string<Model>  $modelClass
     */
    public function __construct(string $modelClass, int $modelId, string $field = 'body')
    {
        $this->modelClass = $modelClass;
        $this->modelId = $modelId;
        $this->field = $field;
    }

    public function handle(LinkSanitizerService $sanitizer): void
    {
        /** @var Model|null $model */
        $model = $this->modelClass::find($this->modelId);

        if (! $model) {
            return;
        }

        $original = $model->getAttribute($this->field) ?? '';
        $sanitized = $sanitizer->sanitize($original);

        if ($sanitized !== $original) {
            $model->update([$this->field => $sanitized]);
        }
    }
}
