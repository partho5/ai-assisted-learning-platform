<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTestQuestionRequest;
use App\Http\Requests\UpdateTestQuestionRequest;
use App\Models\Test;
use App\Models\TestQuestion;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TestQuestionController extends Controller
{
    public function store(StoreTestQuestionRequest $request, Test $test): RedirectResponse
    {
        $data = $request->validated();
        $data['order'] = $data['order'] ?? ($test->questions()->max('order') + 1);

        $test->questions()->create($data);

        return back()->with('success', 'Question added.');
    }

    public function update(UpdateTestQuestionRequest $request, Test $test, TestQuestion $question): RedirectResponse
    {
        $question->update($request->validated());

        return back()->with('success', 'Question updated.');
    }

    public function destroy(Test $test, TestQuestion $question): RedirectResponse
    {
        $question->delete();

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
}
