<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Partner;
use App\Models\PartnerCommission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PartnerController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $partner = $user->partner;

        $summary = ['total_earned' => 0, 'total_pending' => 0, 'total_revoked' => 0];
        $courseBreakdowns = [];
        $recentCommissions = null;

        if ($partner) {
            $summary = [
                'total_earned' => (float) PartnerCommission::where('partner_id', $partner->id)
                    ->whereIn('status', ['pending', 'confirmed'])
                    ->sum('commission_amount'),
                'total_pending' => (float) PartnerCommission::where('partner_id', $partner->id)
                    ->where('status', 'pending')
                    ->sum('commission_amount'),
                'total_revoked' => (float) PartnerCommission::where('partner_id', $partner->id)
                    ->where('status', 'revoked')
                    ->sum('commission_amount'),
            ];

            $courseBreakdowns = PartnerCommission::where('partner_commissions.partner_id', $partner->id)
                ->whereIn('partner_commissions.status', ['pending', 'confirmed'])
                ->join('courses', 'partner_commissions.course_id', '=', 'courses.id')
                ->selectRaw('courses.id as course_id, courses.title as course_title, courses.slug as course_slug')
                ->selectRaw('count(*) as conversion_count')
                ->selectRaw('sum(partner_commissions.commission_amount) as total_earned')
                ->groupBy('courses.id', 'courses.title', 'courses.slug')
                ->get()
                ->map(fn ($row) => [
                    'course_id' => $row->course_id,
                    'course_title' => $row->course_title,
                    'course_slug' => $row->course_slug,
                    'referral_count' => $partner->referrals()->where('course_id', $row->course_id)->count(),
                    'conversion_count' => (int) $row->conversion_count,
                    'total_earned' => (float) $row->total_earned,
                ]);

            $recentCommissions = PartnerCommission::where('partner_commissions.partner_id', $partner->id)
                ->join('courses', 'partner_commissions.course_id', '=', 'courses.id')
                ->join('users', 'partner_commissions.purchaser_user_id', '=', 'users.id')
                ->leftJoin('partner_referrals', function ($join) {
                    $join->on('partner_referrals.partner_id', '=', 'partner_commissions.partner_id')
                        ->on('partner_referrals.course_id', '=', 'partner_commissions.course_id')
                        ->on('partner_referrals.visitor_user_id', '=', 'partner_commissions.purchaser_user_id');
                })
                ->select(
                    'partner_commissions.id',
                    'partner_commissions.course_id',
                    'courses.title as course_title',
                    'users.name as purchaser_name',
                    'partner_commissions.commission_amount',
                    'partner_commissions.status',
                    'partner_commissions.created_at',
                    'partner_referrals.referrer_url',
                )
                ->orderByDesc('partner_commissions.created_at')
                ->paginate(15);
        }

        $partnerCourses = Course::query()
            ->published()
            ->whereNotNull('partner_commission_rate')
            ->where('partner_commission_rate', '>', 0)
            ->select('id', 'title', 'slug', 'partner_commission_rate')
            ->orderBy('title')
            ->get();

        return Inertia::render('dashboard/partner', [
            'partner' => $partner,
            'summary' => $summary,
            'courseBreakdowns' => $courseBreakdowns,
            'recentCommissions' => $recentCommissions,
            'partnerCourses' => $partnerCourses,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->partner) {
            return back()->with('error', 'You are already a partner.');
        }

        Partner::create([
            'user_id' => $user->id,
        ]);

        return back()->with('success', 'Welcome to the partner program! Your referral code is ready.');
    }
}
