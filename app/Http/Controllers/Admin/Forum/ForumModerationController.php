<?php

namespace App\Http\Controllers\Admin\Forum;

use App\Http\Controllers\Controller;
use App\Models\ForumCategory;
use App\Models\ForumReply;
use App\Models\ForumReport;
use App\Models\ForumThread;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ForumModerationController extends Controller
{
    public function index(): Response
    {
        $reports = ForumReport::query()
            ->whereNull('resolved_at')
            ->with(['reporter:id,name,username', 'reportable'])
            ->latest()
            ->paginate(25);

        return Inertia::render('admin/forum/moderation', [
            'reports' => $reports,
        ]);
    }

    /** Dismiss a report without taking action — mark it resolved. */
    public function resolve(Request $request, ForumReport $forumReport): JsonResponse
    {
        $forumReport->update(['resolved_at' => now()]);

        return response()->json(['resolved' => true]);
    }

    /** Delete the reported content and resolve all open reports against it. */
    public function deleteContent(Request $request, ForumReport $forumReport): JsonResponse
    {
        $reportable = $forumReport->reportable;

        if ($reportable instanceof ForumThread) {
            $categoryId = $reportable->category_id;
            $reportable->delete();
            ForumCategory::where('id', $categoryId)->decrement('thread_count');

            // Resolve all reports on this thread
            ForumReport::where('reportable_type', ForumThread::class)
                ->where('reportable_id', $reportable->id)
                ->whereNull('resolved_at')
                ->update(['resolved_at' => now()]);
        } elseif ($reportable instanceof ForumReply) {
            $thread = ForumThread::find($reportable->thread_id);
            $reportable->delete();

            if ($thread) {
                $thread->decrement('replies_count');
                if ($reportable->is_accepted_answer) {
                    $thread->update(['is_resolved' => false]);
                }
            }

            // Resolve all reports on this reply
            ForumReport::where('reportable_type', ForumReply::class)
                ->where('reportable_id', $reportable->id)
                ->whereNull('resolved_at')
                ->update(['resolved_at' => now()]);
        }

        return response()->json(['deleted' => true]);
    }
}
