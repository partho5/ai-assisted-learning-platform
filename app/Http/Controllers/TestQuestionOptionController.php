<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTestQuestionOptionRequest;
use App\Http\Requests\UpdateTestQuestionOptionRequest;
use App\Models\Test;
use App\Models\TestQuestion;
use App\Models\TestQuestionOption;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TestQuestionOptionController extends Controller
{
    public function store(StoreTestQuestionOptionRequest $request, Test $test, TestQuestion $question): RedirectResponse
    {
        $data = $request->validated();
        $data['order'] = $data['order'] ?? ($question->options()->max('order') + 1);

        $question->options()->create($data);

        return back()->with('success', 'Option added.');
    }

    public function update(UpdateTestQuestionOptionRequest $request, Test $test, TestQuestion $question, TestQuestionOption $option): RedirectResponse
    {
        $option->update($request->validated());

        return back()->with('success', 'Option updated.');
    }

    public function destroy(Test $test, TestQuestion $question, TestQuestionOption $option): RedirectResponse
    {
        $option->delete();

        return back()->with('success', 'Option deleted.');
    }
}
