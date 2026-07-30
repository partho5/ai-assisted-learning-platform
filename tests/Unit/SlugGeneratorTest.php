<?php

namespace Tests\Unit;

use App\Services\SlugGenerator;
use Normalizer;
use PHPUnit\Framework\TestCase;

class SlugGeneratorTest extends TestCase
{
    public function test_preserves_bengali_vowel_signs_and_hasanta(): void
    {
        $slug = SlugGenerator::generate('ওয়েব ডেভেলপমেন্ট');

        $this->assertSame('ওয়েব-ডেভেলপমেন্ট', $slug);
    }

    /**
     * The specific failure mode this class exists to avoid: Str::slug() runs
     * Str::ascii() and turns this title into the misspelled 'oozeb-develpment'.
     */
    public function test_does_not_romanize_bengali(): void
    {
        $slug = SlugGenerator::generate('ওয়েব ডেভেলপমেন্ট');

        $this->assertStringNotContainsString('oozeb', $slug);
        $this->assertMatchesRegularExpression('/\p{Bengali}/u', $slug);
    }

    public function test_keeps_combining_marks_that_str_slug_would_strip(): void
    {
        $slug = SlugGenerator::generate('বাংলা প্রোগ্রামিং কোর্স');

        // 'বল-পরগরম-করস' is what a \pM-stripping regex produces.
        $this->assertSame('বাংলা-প্রোগ্রামিং-কোর্স', $slug);
        $this->assertMatchesRegularExpression('/\p{Mn}/u', $slug);
    }

    public function test_handles_mixed_bengali_and_english_titles(): void
    {
        $slug = SlugGenerator::generate('React দিয়ে ওয়েব ডেভেলপমেন্ট');

        $this->assertSame('react-দিয়ে-ওয়েব-ডেভেলপমেন্ট', $slug);
    }

    public function test_strips_danda_that_bengali_script_extensions_would_admit(): void
    {
        $this->assertSame('আমার-প্রকল্প', SlugGenerator::generate('আমার প্রকল্প।'));
        $this->assertSame('ধাপে-ধাপে', SlugGenerator::generate('ধাপে ধাপে॥'));
    }

    public function test_treats_danda_as_a_word_break(): void
    {
        $this->assertSame('প্রকল্প-শেষ', SlugGenerator::generate('প্রকল্প।শেষ'));
    }

    public function test_composed_and_decomposed_input_produce_the_same_slug(): void
    {
        $composed = Normalizer::normalize('কোর্স', Normalizer::FORM_C);
        $decomposed = Normalizer::normalize('কোর্স', Normalizer::FORM_D);

        $this->assertNotSame($composed, $decomposed, 'fixture should differ before normalization');
        $this->assertSame(
            SlugGenerator::generate($composed),
            SlugGenerator::generate($decomposed)
        );
    }

    public function test_ascii_titles_behave_like_a_conventional_slugger(): void
    {
        $this->assertSame('how-to-land-a-remote-job', SlugGenerator::generate('How to land a remote job'));
        $this->assertSame('hello-world-foo-bar', SlugGenerator::generate('Hello   World--Foo_Bar'));
        $this->assertSame('ডিজাইন-101-শুরু-করুন', SlugGenerator::generate('ডিজাইন 101: শুরু করুন!'));
    }

    public function test_trims_and_collapses_separators(): void
    {
        $this->assertSame('ট্রিম-করুন', SlugGenerator::generate('  ট্রিম  করুন  '));
        $this->assertSame('a-b', SlugGenerator::generate('---a---b---'));
    }

    public function test_falls_back_when_nothing_addressable_remains(): void
    {
        foreach (['🎉🎉🎉', '।।।', '!!! ???', ''] as $input) {
            $slug = SlugGenerator::generate($input);

            $this->assertNotSame('', $slug, "empty slug for input: {$input}");
            $this->assertMatchesRegularExpression('/^[a-z0-9]{8}$/', $slug);
        }
    }

    public function test_generated_slugs_always_satisfy_the_validation_pattern(): void
    {
        $titles = [
            'ওয়েব ডেভেলপমেন্ট',
            'React দিয়ে ওয়েব ডেভেলপমেন্ট',
            'আমার প্রকল্প।',
            'How to land a remote job',
            'ডিজাইন 101: শুরু করুন!',
            '🎉🎉🎉',
        ];

        foreach ($titles as $title) {
            $this->assertMatchesRegularExpression(
                SlugGenerator::pattern(),
                SlugGenerator::generate($title),
                "generated slug rejected by pattern for: {$title}"
            );
        }
    }

    public function test_pattern_rejects_invalid_slugs(): void
    {
        foreach (['has space', 'UPPER', 'semi;colon', 'trailing।danda', 'আমার-প্রকল্প।'] as $invalid) {
            $this->assertDoesNotMatchRegularExpression(
                SlugGenerator::pattern(),
                $invalid,
                "pattern wrongly accepted: {$invalid}"
            );
        }
    }

    public function test_pattern_accepts_valid_bengali_and_mixed_slugs(): void
    {
        foreach (['react-দিয়ে-ওয়েব', 'সঠিক-বাংলা', 'plain-ascii-99'] as $valid) {
            $this->assertMatchesRegularExpression(
                SlugGenerator::pattern(),
                $valid,
                "pattern wrongly rejected: {$valid}"
            );
        }
    }

    public function test_respects_a_custom_separator(): void
    {
        $this->assertSame('ওয়েব_ডেভেলপমেন্ট', SlugGenerator::generate('ওয়েব ডেভেলপমেন্ট', '_'));
    }
}
