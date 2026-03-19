<?php

namespace App\Http\Controllers\Forum;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreForumReportRequest;
use App\Models\ForumReply;
use App\Models\ForumReport;
use App\Models\ForumThread;
use Illuminate\Http\JsonResponse;

class ForumReportController extends Controller
{
    public function thread(StoreForumReportRequest $request, ForumThread $forumThread): JsonResponse
    {
        ForumReport::firstOrCreate(
            [
                'user_id' => $request->user()->id,
                'reportable_type' => ForumThread::class,
                'reportable_id' => $forumThread->id,
            ],
            ['reason' => $request->input('reason')]
        );

        return response()->json(['reported' => true]);
    }

    public function reply(StoreForumReportRequest $request, ForumReply $forumReply): JsonResponse
    {
        ForumReport::firstOrCreate(
            [
                'user_id' => $request->user()->id,
                'reportable_type' => ForumReply::class,
                'reportable_id' => $forumReply->id,
            ],
            ['reason' => $request->input('reason')]
        );

        return response()->json(['reported' => true]);
    }
}
