/**
 * Google Analytics event tracking utility.
 *
 * Usage:
 *   import { trackEvent, trackCourseView, trackEnroll } from '@/lib/analytics';
 *
 * Add/remove event helpers below as needed — each is a one-liner wrapper.
 */

function trackEvent(name: string, params?: Record<string, unknown>): void {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', name, params);
    }
}

/** Fires a manual page_view (called by the Inertia navigate listener). */
export function trackPageView(url: string, title: string): void {
    trackEvent('page_view', { page_location: url, page_title: title });
}

// ---------------------------------------------------------------------------
// Custom events — add or remove as needed
// ---------------------------------------------------------------------------

export function trackCourseView(courseId: number, courseTitle: string): void {
    trackEvent('course_view', { course_id: courseId, course_title: courseTitle });
}

export function trackEnroll(courseId: number, courseTitle: string): void {
    trackEvent('enroll', { course_id: courseId, course_title: courseTitle });
}

export function trackPurchase(courseId: number, courseTitle: string, amount: number, currency: string = 'USD'): void {
    trackEvent('purchase', { course_id: courseId, course_title: courseTitle, value: amount, currency });
}

export function trackTestSubmit(testId: number, courseSlug: string): void {
    trackEvent('test_submit', { test_id: testId, course_slug: courseSlug });
}

export function trackResourceComplete(resourceId: number, courseSlug: string): void {
    trackEvent('resource_complete', { resource_id: resourceId, course_slug: courseSlug });
}

export function trackSignUp(method: string = 'email'): void {
    trackEvent('sign_up', { method });
}

export function trackLogin(method: string = 'email'): void {
    trackEvent('login', { method });
}

export function trackLandingCta(ctaName: string): void {
    trackEvent('landing_cta_click', { cta_name: ctaName });
}

export { trackEvent };
