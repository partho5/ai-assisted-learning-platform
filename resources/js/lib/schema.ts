/**
 * schema.org JSON-LD builders.
 *
 * A course is described in three places — the landing page's featured strip, the
 * course intro page, and each lesson's `isPartOf` back-reference — and Google
 * treats conflicting descriptions of the same URL as a reason to drop the rich
 * result. They all build the node here so the three stay in agreement, and all
 * three point at the same `@id`.
 */

import { inLanguage } from '@/lib/locale';

export type CourseSchemaInput = {
    title: string;
    description: string;
    /** Canonical URL of the course intro page. */
    url: string;
    /** URL locale, not the record's language — see `lib/locale`. */
    locale: string;
    /** Absolute image URL. */
    image: string;
    appName: string;
    appUrl: string;
    price: string | number | null;
    currency?: string | null;
    billingType?: string | null;
    /** How long access lasts on a subscription course, in months. */
    subscriptionDurationMonths?: number | null;
    /** Total course length in minutes. */
    estimatedDuration?: number | null;
    difficulty?: string | null;
    /** Newline-separated outcomes, one per line. */
    whatYouWillLearn?: string | null;
    prerequisites?: string | null;
    instructorNames?: string[];
    createdAt?: string | null;
    updatedAt?: string | null;
};

/**
 * The stable identifier for a course entity. Lesson pages reuse it so their
 * `isPartOf` resolves to the same node the intro page describes.
 */
export function courseId(courseUrl: string): string {
    return `${courseUrl}#course`;
}

/**
 * Minutes to an ISO 8601 duration. Returns null for absent or zero durations so
 * callers can omit the property rather than emit a meaningless `PT0M`.
 */
export function isoDuration(minutes: number | null | undefined): string | null {
    if (!minutes || minutes <= 0) {
        return null;
    }

    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;

    return `PT${hours > 0 ? `${hours}H` : ''}${remainder > 0 ? `${remainder}M` : ''}`;
}

/**
 * Splits an outcome/prerequisite field into plain-text lines.
 *
 * These fields are edited in the rich-text editor on some courses and as a plain
 * newline-separated textarea on others, so the stored value may be either. Block
 * boundaries become line breaks and any remaining markup is stripped — structured
 * data must never carry HTML through to the crawler.
 */
function toLines(value: string | null | undefined): string[] {
    return (value ?? '')
        .replace(/<(br|\/p|\/li|\/div|\/h[1-6])[^>]*>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/g, "'")
        .split('\n')
        .map((line) => line.replace(/\s+/g, ' ').trim())
        .filter(Boolean);
}

/**
 * Google's Course rich result needs an offer even when nothing is charged, so a
 * free course gets an explicit zero-price offer rather than no offer at all.
 */
function buildOffer(input: CourseSchemaInput): Record<string, unknown> {
    const amount = input.price == null ? 0 : parseFloat(String(input.price));
    const isFree = !Number.isFinite(amount) || amount <= 0;
    const priceCurrency = input.currency ?? 'USD';

    const offer: Record<string, unknown> = {
        '@type': 'Offer',
        price: isFree ? '0' : amount.toFixed(2),
        priceCurrency,
        availability: 'https://schema.org/InStock',
        url: input.url,
        ...(isFree ? { category: 'Free' } : {}),
    };

    // A paid subscription is quoted per month; the configured duration is how
    // long access lasts, not the billing period.
    if (!isFree && input.billingType === 'subscription') {
        offer.priceSpecification = {
            '@type': 'UnitPriceSpecification',
            price: amount.toFixed(2),
            priceCurrency,
            billingDuration: 'P1M',
        };

        if (input.subscriptionDurationMonths) {
            offer.eligibleDuration = {
                '@type': 'QuantitativeValue',
                value: input.subscriptionDurationMonths,
                unitCode: 'MON',
            };
        }
    }

    return offer;
}

/** The `Course` node, without `@context` — callers decide whether it is a root document. */
export function courseSchemaNode(input: CourseSchemaInput): Record<string, unknown> {
    const workload = isoDuration(input.estimatedDuration);
    const teaches = toLines(input.whatYouWillLearn);
    const prerequisites = toLines(input.prerequisites);

    return {
        '@type': 'Course',
        '@id': courseId(input.url),
        name: input.title,
        description: input.description,
        url: input.url,
        inLanguage: inLanguage(input.locale),
        image: input.image,
        provider: {
            '@type': 'Organization',
            name: input.appName,
            url: input.appUrl,
        },
        hasCourseInstance: {
            '@type': 'CourseInstance',
            courseMode: 'online',
            ...(workload ? { courseWorkload: workload } : {}),
            ...(input.instructorNames && input.instructorNames.length > 0
                ? { instructor: input.instructorNames.map((name) => ({ '@type': 'Person', name })) }
                : {}),
        },
        offers: buildOffer(input),
        ...(teaches.length > 0 ? { teaches } : {}),
        ...(prerequisites.length > 0 ? { coursePrerequisites: prerequisites } : {}),
        ...(input.difficulty
            ? { educationalLevel: input.difficulty.charAt(0).toUpperCase() + input.difficulty.slice(1) }
            : {}),
        ...(workload ? { timeRequired: workload } : {}),
        ...(input.createdAt ? { datePublished: input.createdAt } : {}),
        ...(input.updatedAt ? { dateModified: input.updatedAt } : {}),
    };
}

/** The `Course` node as a standalone JSON-LD document. */
export function courseSchema(input: CourseSchemaInput): Record<string, unknown> {
    return {
        '@context': 'https://schema.org',
        ...courseSchemaNode(input),
    };
}
