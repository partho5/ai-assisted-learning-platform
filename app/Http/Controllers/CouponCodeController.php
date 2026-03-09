<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCouponCodeRequest;
use App\Models\CouponCode;
use App\Models\Course;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;

class CouponCodeController extends Controller
{
    public function store(StoreCouponCodeRequest $request, Course $course): RedirectResponse
    {
        $this->authorizeCourseOwner($course);

        $data = $request->validated();

        CouponCode::create([
            'created_by' => auth()->id(),
            'course_id' => $course->id,
            'code' => strtoupper($data['code'] ?? Str::upper(Str::random(8))),
            'discount_percent' => $data['discount_percent'],
            'usage_limit' => $data['usage_limit'] ?? null,
            'expires_at' => $data['expires_at'] ?? null,
            'is_active' => true,
        ]);

        return back()->with('success', 'Coupon code created.');
    }

    public function destroy(Course $course, CouponCode $couponCode): RedirectResponse
    {
        $this->authorizeCourseOwner($course);

        $couponCode->delete();

        return back()->with('success', 'Coupon code deleted.');
    }

    private function authorizeCourseOwner(Course $course): void
    {
        $user = auth()->user();

        if (! $user->isAdmin() && $course->user_id !== $user->id) {
            abort(403);
        }
    }
}
