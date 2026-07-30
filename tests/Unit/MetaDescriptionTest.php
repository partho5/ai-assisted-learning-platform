<?php

namespace Tests\Unit;

use App\Concerns\BuildsMetaDescription;
use Normalizer;
use Tests\TestCase;

class MetaDescriptionTest extends TestCase
{
    private object $subject;

    protected function setUp(): void
    {
        parent::setUp();

        $this->subject = new class
        {
            use BuildsMetaDescription;

            public function build(?string $value, ?string $locale = null): string
            {
                return $this->metaDescription($value, $locale);
            }
        };
    }

    /**
     * The bug this replaces: mb_substr counts code points, so cutting Bengali
     * at an arbitrary offset splits a consonant from its vowel sign.
     */
    public function test_bengali_truncation_does_not_split_grapheme_clusters(): void
    {
        $long = str_repeat('ওয়েব ডেভেলপমেন্ট শিখুন ', 20);

        $description = $this->subject->build($long, 'bn');
        $withoutEllipsis = rtrim($description, '…');

        $this->assertDoesNotMatchRegularExpression(
            '/\p{Mn}$/u',
            $withoutEllipsis,
            'description ends on an orphaned combining mark'
        );
        $this->assertTrue(
            Normalizer::isNormalized($withoutEllipsis, Normalizer::FORM_C),
            'truncation produced a broken cluster'
        );
    }

    public function test_bengali_gets_a_smaller_budget_than_english(): void
    {
        $bengali = str_repeat('ওয়েব ডেভেলপমেন্ট শিখুন ', 20);
        $english = str_repeat('learn web development today ', 20);

        $this->assertLessThan(
            grapheme_strlen($this->subject->build($english, 'en')),
            grapheme_strlen($this->subject->build($bengali, 'bn')),
            'Bengali glyphs are wider, so the character budget must be smaller'
        );
    }

    public function test_respects_the_english_limit(): void
    {
        $description = $this->subject->build(str_repeat('word ', 100), 'en');

        $this->assertLessThanOrEqual(161, grapheme_strlen($description));
    }

    public function test_respects_the_bengali_limit(): void
    {
        $description = $this->subject->build(str_repeat('শব্দ ', 100), 'bn');

        $this->assertLessThanOrEqual(121, grapheme_strlen($description));
    }

    public function test_short_text_passes_through_untouched(): void
    {
        $this->assertSame('ছোট বর্ণনা।', $this->subject->build('ছোট বর্ণনা।', 'bn'));
        $this->assertSame('Short description.', $this->subject->build('Short description.', 'en'));
    }

    public function test_strips_html_and_collapses_whitespace(): void
    {
        $this->assertSame(
            'Hello world Second',
            $this->subject->build("<p>Hello   <b>world</b></p>\n\nSecond", 'en')
        );
    }

    public function test_returns_empty_string_for_no_content(): void
    {
        $this->assertSame('', $this->subject->build(null, 'bn'));
        $this->assertSame('', $this->subject->build('   ', 'bn'));
        $this->assertSame('', $this->subject->build('<p></p>', 'bn'));
    }

    public function test_truncated_output_is_marked_with_an_ellipsis(): void
    {
        $description = $this->subject->build(str_repeat('word ', 100), 'en');

        $this->assertStringEndsWith('…', $description);
    }

    public function test_falls_back_to_the_current_locale(): void
    {
        app()->setLocale('bn');
        $bengaliBudget = grapheme_strlen($this->subject->build(str_repeat('শব্দ ', 100)));

        app()->setLocale('en');
        $englishBudget = grapheme_strlen($this->subject->build(str_repeat('word ', 100)));

        $this->assertLessThan($englishBudget, $bengaliBudget);
    }

    public function test_unknown_locale_falls_back_to_the_english_budget(): void
    {
        $description = $this->subject->build(str_repeat('word ', 100), 'fr');

        $this->assertLessThanOrEqual(161, grapheme_strlen($description));
        $this->assertGreaterThan(121, grapheme_strlen($description));
    }
}
