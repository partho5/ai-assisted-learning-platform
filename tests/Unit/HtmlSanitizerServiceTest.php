<?php

namespace Tests\Unit;

use App\Services\HtmlSanitizerService;
use PHPUnit\Framework\TestCase;

class HtmlSanitizerServiceTest extends TestCase
{
    private HtmlSanitizerService $sanitizer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->sanitizer = new HtmlSanitizerService;
    }

    public function test_null_and_empty_input_pass_through(): void
    {
        $this->assertNull($this->sanitizer->sanitize(null));
        $this->assertSame('', $this->sanitizer->sanitize(''));
    }

    public function test_preserves_basic_formatting(): void
    {
        $result = $this->sanitizer->sanitize('<p>Hello <strong>world</strong></p>');

        $this->assertSame('<p>Hello <strong>world</strong></p>', $result);
    }

    public function test_strips_script_tags_and_their_content(): void
    {
        $result = $this->sanitizer->sanitize('<p>bad<script>alert(document.cookie)</script></p>');

        $this->assertSame('<p>bad</p>', $result);
        $this->assertStringNotContainsString('script', $result);
        $this->assertStringNotContainsString('alert', $result);
    }

    public function test_strips_event_handler_attributes(): void
    {
        $result = $this->sanitizer->sanitize('<img src="https://example.com/x.png" onerror="alert(1)" onload="alert(2)">');

        $this->assertStringNotContainsString('onerror', $result);
        $this->assertStringNotContainsString('onload', $result);
        $this->assertStringContainsString('src="https://example.com/x.png"', $result);
    }

    public function test_strips_javascript_url_from_href(): void
    {
        $result = $this->sanitizer->sanitize('<a href="javascript:alert(1)">click</a>');

        $this->assertStringNotContainsString('javascript:', $result);
        $this->assertStringNotContainsString('href', $result);
        $this->assertStringContainsString('click', $result);
    }

    public function test_strips_javascript_url_from_img_src(): void
    {
        $result = $this->sanitizer->sanitize('<img src="javascript:alert(1)">');

        $this->assertStringNotContainsString('javascript:', $result);
        $this->assertStringNotContainsString('src', $result);
    }

    public function test_allows_http_and_https_links(): void
    {
        $result = $this->sanitizer->sanitize('<a href="https://example.com" target="_blank">ok</a>');

        $this->assertStringContainsString('href="https://example.com"', $result);
        $this->assertStringContainsString('target="_blank"', $result);
    }

    public function test_strips_css_url_injection_from_style(): void
    {
        $result = $this->sanitizer->sanitize('<span style="color: red; background: url(javascript:alert(1)); font-size: 14px">x</span>');

        $this->assertStringNotContainsString('url(', $result);
        $this->assertStringContainsString('color: red', $result);
        $this->assertStringContainsString('font-size: 14px', $result);
    }

    public function test_strips_css_expression_from_style(): void
    {
        $result = $this->sanitizer->sanitize('<span style="width: expression(alert(1))">x</span>');

        $this->assertStringNotContainsString('expression', $result);
    }

    public function test_allows_youtube_nocookie_iframe(): void
    {
        $html = '<div data-type="youtube" class="yt-embed" style="position:relative;height:0;">'
            .'<iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" loading="lazy" allowfullscreen="true"></iframe></div>';

        $result = $this->sanitizer->sanitize($html);

        $this->assertStringContainsString('<iframe', $result);
        $this->assertStringContainsString('src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"', $result);
        $this->assertStringContainsString('data-type="youtube"', $result);
    }

    public function test_strips_iframe_with_non_youtube_source(): void
    {
        $result = $this->sanitizer->sanitize('<iframe src="https://evil.example/phish"></iframe>');

        $this->assertSame('', $result);
    }

    public function test_preserves_callout_and_section_block_divs(): void
    {
        $result = $this->sanitizer->sanitize('<div data-type="callout" data-variant="purple" data-label="Note">hi</div>');

        $this->assertSame('<div data-type="callout" data-variant="purple" data-label="Note">hi</div>', $result);
    }

    public function test_drops_unrecognized_data_type_value(): void
    {
        $result = $this->sanitizer->sanitize('<div data-type="not-real">hi</div>');

        $this->assertStringNotContainsString('data-type', $result);
        $this->assertStringContainsString('hi', $result);
    }

    public function test_unwraps_unknown_tags_but_keeps_their_content(): void
    {
        $result = $this->sanitizer->sanitize('<marquee>hi</marquee>');

        $this->assertSame('hi', $result);
    }

    public function test_preserves_syntax_highlighted_code_block(): void
    {
        $html = '<pre><code class="hljs language-php"><span class="hljs-keyword">echo</span></code></pre>';

        $result = $this->sanitizer->sanitize($html);

        $this->assertSame($html, $result);
    }

    public function test_removes_form_and_input_elements(): void
    {
        $result = $this->sanitizer->sanitize('<form action="https://evil.example"><input name="x"></form>after');

        $this->assertStringNotContainsString('<form', $result);
        $this->assertStringNotContainsString('<input', $result);
        $this->assertStringContainsString('after', $result);
    }

    public function test_removes_svg_based_xss_vector(): void
    {
        $result = $this->sanitizer->sanitize('<svg onload="alert(1)"><animate attributeName="x" values="1"></animate></svg>');

        $this->assertStringNotContainsString('svg', $result);
        $this->assertStringNotContainsString('onload', $result);
    }
}
