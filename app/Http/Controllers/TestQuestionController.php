<?php

namespace App\Http\Controllers;

use App\Enums\QuestionType;
use App\Http\Requests\StoreTestQuestionRequest;
use App\Http\Requests\UpdateTestQuestionRequest;
use App\Models\Test;
use App\Models\TestQuestion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TestQuestionController extends Controller
{
    public function store(StoreTestQuestionRequest $request, Test $test): JsonResponse|RedirectResponse
    {
        $data = $request->validated();
        $data['order'] = $data['order'] ?? ($test->questions()->max('order') + 1);

        $questionType = QuestionType::from($data['question_type']);
        $data['evaluation_method'] = $questionType->defaultEvaluationMethod()->value;

        // Strip fields that don't apply to this question type
        if ($questionType->isAiGraded()) {
            $data['correct_answer'] = null;
            $data['numeric_operator'] = null;
        } elseif (! $questionType->isNumericComparison()) {
            $data['numeric_operator'] = null;
        }

        $options = $data['options'] ?? [];
        unset($data['options']);

        $question = $test->questions()->create($data);

        if ($questionType->hasOptions() && ! empty($options)) {
            $this->syncOptions($question, $questionType, $options);
        }

        if ($request->wantsJson()) {
            return response()->json($question->load('options'));
        }

        return back()->with('success', 'Question added.');
    }

    public function update(UpdateTestQuestionRequest $request, Test $test, TestQuestion $question): JsonResponse|RedirectResponse
    {
        $data = $request->validated();

        $questionType = QuestionType::from($data['question_type']);
        $data['evaluation_method'] = $questionType->defaultEvaluationMethod()->value;

        if ($questionType->isAiGraded()) {
            $data['correct_answer'] = null;
            $data['numeric_operator'] = null;
        } elseif (! $questionType->isNumericComparison()) {
            $data['numeric_operator'] = null;
        }

        $options = $data['options'] ?? [];
        unset($data['options']);

        $question->update($data);

        if ($questionType->hasOptions()) {
            $this->syncOptions($question, $questionType, $options);
        } else {
            // Non-option type — remove any leftover options
            $question->options()->delete();
        }

        if ($request->wantsJson()) {
            return response()->json($question->fresh()->load('options'));
        }

        return back()->with('success', 'Question updated.');
    }

    public function destroy(Request $request, Test $test, TestQuestion $question): JsonResponse|RedirectResponse
    {
        $question->delete();

        if ($request->wantsJson()) {
            return response()->json(['deleted' => true]);
        }

        return back()->with('success', 'Question deleted.');
    }

    public function reorder(Request $request, Test $test): RedirectResponse
    {
        $request->validate([
            'order' => ['required', 'array'],
            'order.*' => ['integer'],
        ]);

        foreach ($request->input('order') as $position => $questionId) {
            $test->questions()->where('id', $questionId)->update(['order' => $position]);
        }

        return back()->with('success', 'Questions reordered.');
    }

    /**
     * Sync options for an option-based question and set correct_answer from is_correct flags.
     *
     * @param  array<int, array{id?: int, label: string, is_correct?: bool}>  $options
     */
    private function syncOptions(TestQuestion $question, QuestionType $questionType, array $options): void
    {
        $incomingIds = collect($options)->pluck('id')->filter()->all();

        // Delete options not in the incoming set
        $question->options()->whereNotIn('id', $incomingIds)->delete();

        $correctIds = [];

        foreach ($options as $index => $optionData) {
            $order = $index + 1;

            if (! empty($optionData['id'])) {
                // Update existing
                $option = $question->options()->find($optionData['id']);
                if ($option) {
                    $option->update(['label' => $optionData['label'], 'order' => $order]);
                    if (! empty($optionData['is_correct'])) {
                        $correctIds[] = $option->id;
                    }
                }
            } else {
                // Create new
                $option = $question->options()->create([
                    'label' => $optionData['label'],
                    'order' => $order,
                ]);
                if (! empty($optionData['is_correct'])) {
                    $correctIds[] = $option->id;
                }
            }
        }

        // Set correct_answer based on question type
        if ($questionType === QuestionType::Checkboxes) {
            sort($correctIds);
            $question->update(['correct_answer' => json_encode($correctIds)]);
        } elseif (count($correctIds) > 0) {
            $question->update(['correct_answer' => (string) $correctIds[0]]);
        } else {
            $question->update(['correct_answer' => null]);
        }
    }
}
