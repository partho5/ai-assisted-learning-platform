<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Partner;
use App\Models\PartnerReferral;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PartnerReferralController extends Controller
{
    public function track(Request $request): JsonResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'max:20'],
            'course_slug' => ['required', 'string', 'max:255'],
        ]);

        $partner = Partner::where('code', $request->input('code'))->active()->first();

        if (! $partner) {
            return response()->json(['valid' => false]);
        }

        $course = Course::where('slug', $request->input('course_slug'))->first();

        if (! $course || ! $course->partner_commission_rate) {
            return response()->json(['valid' => false]);
        }

        $sessionId = $request->session()->getId();

        PartnerReferral::updateOrCreate(
            [
                'partner_id' => $partner->id,
                'course_id' => $course->id,
                'visitor_session_id' => $sessionId,
            ],
            [
                'visitor_user_id' => $request->user()?->id,
                'referrer_url' => $request->input('referrer_url'),
                'clicked_at' => now(),
                'expires_at' => now()->addDays($partner->effective_days),
                'converted_at' => null,
            ],
        );

        return response()->json(['valid' => true, 'partner_code' => $partner->code]);
    }
}
