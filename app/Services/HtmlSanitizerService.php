<?php

namespace App\Services;

use DOMComment;
use DOMDocument;
use DOMElement;
use DOMNode;
use DOMText;

/**
 * Sanitizes rich-text HTML produced by the Tiptap editor (and any
 * externally supplied HTML, e.g. bulk JSON course imports) down to a
 * fixed allow-list of tags/attributes before it is persisted.
 *
 * The DOM is rebuilt from scratch rather than stripping a deny-list, so
 * any tag or attribute that isn't explicitly recognised is dropped.
 */
class HtmlSanitizerService
{
    /** @var array<int, string> */
    private const DROP_ENTIRELY = [
        'script', 'style', 'object', 'embed', 'applet', 'form', 'input',
        'button', 'textarea', 'select', 'option', 'link', 'meta', 'base',
        'svg', 'math', 'template', 'noscript', 'title', 'head',
    ];

    /** @var array<int, string> */
    private const ALLOWED_TAGS = [
        'p', 'br', 'hr', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
        'span', 'mark', 'a', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
        'h1', 'h2', 'h3', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div',
    ];

    /** @var array<string, array<int, string>> */
    private const TAG_ATTRIBUTES = [
        'a' => ['href', 'target', 'rel'],
        'img' => ['src', 'alt'],
        'span' => ['style', 'class'],
        'mark' => ['style', 'class', 'data-color'],
        'div' => ['data-type', 'data-variant', 'data-label', 'class', 'style'],
        'pre' => ['class'],
        'code' => ['class'],
        'th' => ['colspan', 'rowspan'],
        'td' => ['colspan', 'rowspan'],
    ];

    /** @var array<int, string> */
    private const IFRAME_ATTRIBUTES = ['src', 'loading', 'frameborder', 'allow', 'allowfullscreen', 'referrerpolicy', 'style'];

    /** @var array<int, string> */
    private const ALLOWED_STYLE_PROPERTIES = [
        'color', 'background', 'background-color', 'font-size', 'font-weight', 'font-style',
        'text-align', 'text-decoration', 'line-height', 'vertical-align', 'opacity',
        'width', 'height', 'max-width', 'max-height', 'min-width', 'min-height',
        'position', 'top', 'left', 'right', 'bottom', 'overflow', 'display',
    ];

    /** @var array<int, string> */
    private const STYLE_PROPERTY_PREFIXES = ['padding', 'margin', 'border'];

    /** Sanitize an HTML fragment down to the allow-listed tags/attributes above. */
    public function sanitize(?string $html): ?string
    {
        if ($html === null || trim($html) === '') {
            return $html;
        }

        $dom = new DOMDocument;
        libxml_use_internal_errors(true);
        $dom->loadHTML('<?xml encoding="UTF-8"?>'.$html, LIBXML_NOERROR | LIBXML_NOWARNING | LIBXML_NOBLANKS);
        libxml_clear_errors();

        $body = $dom->getElementsByTagName('body')->item(0);

        if (! $body instanceof DOMElement) {
            return '';
        }

        $fragment = $dom->createDocumentFragment();
        foreach (iterator_to_array($body->childNodes) as $child) {
            $this->appendCleaned($dom, $fragment, $child);
        }

        $result = '';
        foreach (iterator_to_array($fragment->childNodes) as $node) {
            $result .= $dom->saveHTML($node);
        }

        return $result;
    }

    private function appendCleaned(DOMDocument $dom, DOMNode $target, DOMNode $node): void
    {
        if ($node instanceof DOMText) {
            $target->appendChild($dom->createTextNode($node->wholeText));

            return;
        }

        if ($node instanceof DOMComment) {
            return;
        }

        if (! $node instanceof DOMElement) {
            return;
        }

        $tag = strtolower($node->localName ?? $node->nodeName);

        if (in_array($tag, self::DROP_ENTIRELY, true)) {
            return;
        }

        if ($tag === 'iframe') {
            $clean = $this->cleanIframe($dom, $node);
            if ($clean !== null) {
                $target->appendChild($clean);
            }

            return;
        }

        if (! in_array($tag, self::ALLOWED_TAGS, true)) {
            // Unknown/disallowed tag: drop the wrapper but keep its children.
            foreach (iterator_to_array($node->childNodes) as $child) {
                $this->appendCleaned($dom, $target, $child);
            }

            return;
        }

        $element = $dom->createElement($tag);

        foreach (self::TAG_ATTRIBUTES[$tag] ?? [] as $attribute) {
            if (! $node->hasAttribute($attribute)) {
                continue;
            }

            $value = $this->sanitizeAttributeValue($tag, $attribute, $node->getAttribute($attribute));

            if ($value !== null) {
                $element->setAttribute($attribute, $value);
            }
        }

        foreach (iterator_to_array($node->childNodes) as $child) {
            $this->appendCleaned($dom, $element, $child);
        }

        $target->appendChild($element);
    }

    private function cleanIframe(DOMDocument $dom, DOMElement $node): ?DOMElement
    {
        $src = trim($node->getAttribute('src'));

        if (! preg_match('#^https://(www\.)?youtube-nocookie\.com/embed/[a-zA-Z0-9_-]{11}$#', $src)) {
            return null;
        }

        $element = $dom->createElement('iframe');

        foreach (self::IFRAME_ATTRIBUTES as $attribute) {
            if ($attribute === 'src' || ! $node->hasAttribute($attribute)) {
                continue;
            }

            $value = $this->sanitizeAttributeValue('iframe', $attribute, $node->getAttribute($attribute));

            if ($value !== null) {
                $element->setAttribute($attribute, $value);
            }
        }

        $element->setAttribute('src', $src);

        return $element;
    }

    private function sanitizeAttributeValue(string $tag, string $attribute, string $value): ?string
    {
        $value = substr(trim($value), 0, 1000);

        if ($value === '') {
            return null;
        }

        return match ($attribute) {
            'href' => $tag === 'a' ? $this->sanitizeUrl($value, true) : null,
            'src' => $this->sanitizeUrl($value, false),
            'style' => $this->sanitizeStyle($value),
            'target' => in_array($value, ['_blank', '_self'], true) ? $value : null,
            'rel' => preg_match('/^[a-z\s]+$/i', $value) === 1 ? $value : null,
            'colspan', 'rowspan' => preg_match('/^\d{1,3}$/', $value) === 1 ? $value : null,
            'allowfullscreen', 'frameborder', 'loading', 'referrerpolicy', 'allow', 'data-color' => $this->sanitizePlainToken($value),
            'class' => preg_match('/^[a-zA-Z0-9_\-\s]{0,200}$/', $value) === 1 ? $value : null,
            'data-type' => in_array($value, ['youtube', 'callout', 'section-block'], true) ? $value : null,
            'data-variant' => preg_match('/^[a-zA-Z0-9\-]{0,30}$/', $value) === 1 ? $value : null,
            'data-label', 'alt' => mb_substr($value, 0, 200),
            default => null,
        };
    }

    private function sanitizePlainToken(string $value): ?string
    {
        return preg_match('#^[a-zA-Z0-9;:_.\-\s/]{0,200}$#', $value) === 1 ? $value : null;
    }

    private function sanitizeUrl(string $value, bool $allowMailto): ?string
    {
        $normalized = preg_replace('/[\x00-\x1F\x7F]+/', '', $value) ?? '';

        if (preg_match('#^https?://#i', $normalized) === 1) {
            return $value;
        }

        if (str_starts_with($normalized, '/') || str_starts_with($normalized, '#')) {
            return $value;
        }

        if ($allowMailto && preg_match('/^mailto:/i', $normalized) === 1) {
            return $value;
        }

        return null;
    }

    private function sanitizeStyle(string $value): ?string
    {
        $kept = [];

        foreach (explode(';', $value) as $declaration) {
            if (! str_contains($declaration, ':')) {
                continue;
            }

            [$property, $propertyValue] = array_map('trim', explode(':', $declaration, 2));
            $property = strtolower($property);

            if (! $this->isAllowedStyleProperty($property)) {
                continue;
            }

            if (preg_match('/^[a-zA-Z0-9#%.,\-\s()]{1,100}$/', $propertyValue) !== 1) {
                continue;
            }

            if (preg_match('/expression|url\(|import|behavior|binding/i', $propertyValue) === 1) {
                continue;
            }

            $kept[] = "{$property}: {$propertyValue}";
        }

        return $kept === [] ? null : implode('; ', $kept);
    }

    private function isAllowedStyleProperty(string $property): bool
    {
        if (in_array($property, self::ALLOWED_STYLE_PROPERTIES, true)) {
            return true;
        }

        foreach (self::STYLE_PROPERTY_PREFIXES as $prefix) {
            if (str_starts_with($property, $prefix)) {
                return true;
            }
        }

        return false;
    }
}
