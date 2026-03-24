<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Partner;
use App\Models\PartnerCommission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PartnerAdminController extends Controller
{
    public function index(Request $request): Response
    {
        $overview = [
            'total_partners' => Partner::count(),
            'active_partners' => Partner::active()->count(),
            'total_confirmed' => (float) PartnerCommission::where('status', 'confirmed')->sum('commission_amount'),
            'total_pending' => (float) PartnerCommission::where('status', 'pending')->sum('commission_amount'),
            'total_revoked' => (float) PartnerCommission::where('status', 'revoked')->sum('commission_amount'),
        ];

        $partners = Partner::query()
            ->join('users', 'partners.user_id', '=', 'users.id')
            ->leftJoin('partner_commissions', 'partner_commissions.partner_id', '=', 'partners.id')
            ->selectRaw('partners.id, partners.code, partners.is_active, partners.created_at')
            ->selectRaw('users.name as user_name, users.email as user_email')
            ->selectRaw('count(partner_commissions.id) as commission_count')
            ->selectRaw("coalesce(sum(case when partner_commissions.status in ('pending','confirmed') then partner_commissions.commission_amount else 0 end), 0) as total_earned")
            ->selectRaw("coalesce(sum(case when partner_commissions.status = 'pending' then partner_commissions.commission_amount else 0 end), 0) as pending_amount")
            ->groupBy('partners.id', 'partners.code', 'partners.is_active', 'partners.created_at', 'users.name', 'users.email')
            ->orderByDesc('partners.created_at')
            ->get()
            ->map(function ($p) {
                $referralCount = \DB::table('partner_referrals')->where('partner_id', $p->id)->count();

                return [
                    'id' => $p->id,
                    'user_name' => $p->user_name,
                    'user_email' => $p->user_email,
                    'code' => $p->code,
                    'is_active' => (bool) $p->is_active,
                    'created_at' => $p->created_at,
                    'referral_count' => $referralCount,
                    'commission_count' => (int) $p->commission_count,
                    'total_earned' => (float) $p->total_earned,
                    'pending_amount' => (float) $p->pending_amount,
                ];
            });

        $pendingCommissions = PartnerCommission::where('partner_commissions.status', 'pending')
            ->join('partners', 'partner_commissions.partner_id', '=', 'partners.id')
            ->join('users as partner_users', 'partners.user_id', '=', 'partner_users.id')
            ->join('courses', 'partner_commissions.course_id', '=', 'courses.id')
            ->join('users as purchasers', 'partner_commissions.purchaser_user_id', '=', 'purchasers.id')
            ->select(
                'partner_commissions.id',
                'partner_users.name as partner_name',
                'partners.code as partner_code',
                'courses.title as course_title',
                'purchasers.name as purchaser_name',
                'partner_commissions.commission_amount',
                'partner_commissions.created_at',
            )
            ->orderByDesc('partner_commissions.created_at')
            ->paginate(20);

        return Inertia::render('admin/partners', [
            'overview' => $overview,
            'partners' => $partners,
            'pendingCommissions' => $pendingCommissions,
        ]);
    }

    public function confirm(PartnerCommission $commission): RedirectResponse
    {
        if ($commission->status !== 'pending') {
            return back()->with('error', 'Only pending commissions can be confirmed.');
        }

        $commission->update(['status' => 'confirmed']);

        return back()->with('success', 'Commission confirmed.');
    }

    public function revoke(PartnerCommission $commission): RedirectResponse
    {
        if ($commission->status === 'revoked') {
            return back()->with('error', 'Commission is already revoked.');
        }

        $commission->update(['status' => 'revoked']);

        return back()->with('success', 'Commission revoked.');
    }
}
