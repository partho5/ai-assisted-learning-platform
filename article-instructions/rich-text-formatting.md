## BODY HTML FORMAT

The `body` field is a single HTML string. Use only the patterns below — no classes, no custom attributes beyond what is shown.

**Paragraph**
`<p>text</p>`

**Heading**
`<h2><strong>Heading Text</strong></h2>`

**Highlight** (use sparingly — 1–3 per article, on the phrase that carries the core insight)
`<mark data-color="#00ffff" style="background-color: rgb(0, 255, 255); color: #000;">highlighted phrase</mark>`
`<mark data-color="#ffff00" style="background-color: rgb(255, 255, 0); color: #000;">phrase that must not miss from eye</mark>`
`<mark data-color="#00ff00" style="background-color: rgb(0, 255, 0); color: #000;">phrase that is worthy of green background</mark>`
`<mark data-color="#ff8c00" style="background-color: rgb(255, 140, 0); color: #000;">phrase that is worthy of orange background</mark>`

> **Text color rule for highlights:** bright backgrounds (#00ffff, #ffff00, #00ff00, #ff8c00, #ff0000, rgb(239,68,68)) → `color: #000`. Dark backgrounds → `color: #fff`.

Also use colors like
`<span style="color: rgb(239, 68, 68);">noticeable phrase</span>`

**Callout** — use for definitions, key rules, warnings, named tips, copy-ready templates, examples etc. All variants have dark accent backgrounds; text inside must be `color: #fff`.

| Variant | Color | Best for |
|---------|-------|----------|
| `purple` | #7F77DD — muted violet | definitions, explanations, concept callouts |
| `amber` | #EF9F27 — warm amber | warnings, cautions, "watch out" tips |
| `teal` | #1D9E75 — deep teal | success notes, recommended practices |
| `green` | #639922 — earthy green | positive outcomes, green-flag rules |

No label: `<div data-variant="purple" data-label="" data-type="callout">text</div>`
With label: `<div data-variant="amber" data-label="Label text" data-type="callout">text</div>`

> **CRITICAL:** Do NOT wrap callout content in `<p>` tags. The app's sanitizer strips `<p>` inside callout divs, leaving them empty. Put text directly inside the `<div>`. Use `<br>` for line breaks and `<span>` for inline styling.

**Section block** — full-width emphasis blocks. Choose variant by the mood of the content:

| Variant | Color | Best for |
|---------|-------|----------|
| `hero-dark` | #093464 — deep navy bg | summaries, framing statements, "before" examples, closing takeaways |
| `hero-light` | #1709ed — vivid blue bg | calls to action, key insights, pro tips, featured quotes, important announcements |
| `accent` | #eff6ff — pale blue bg, #3b82f6 border | supplementary notes, light emphasis, side context |
| `bordered` | #fff7ed — warm cream bg, #f97316 border | examples, "after" contrast, warm-tone callouts |

Dark backgrounds (`hero-dark`, `hero-light`) → text must be `#fff`. Light backgrounds (`accent`, `bordered`) → text must be `#000`.

> **CRITICAL — inline styles on `<p>` are stripped.** The app removes `style` attributes from `<p>` tags. To color text inside a section block, wrap the text in a `<span>` with the color style, not the `<p>` itself.

`<div data-variant="hero-dark" data-label="Optional Label" data-type="section-block"><p><span style="color: rgb(255, 255, 255);">content</span></p></div>`
`<div data-variant="hero-light" data-label="Optional Label" data-type="section-block"><p><span style="color: rgb(255, 255, 255);">content</span></p></div>`
`<div data-variant="accent" data-type="section-block"><p><span style="color: rgb(0, 0, 0);">content</span></p></div>`
`<div data-variant="bordered" data-type="section-block"><p><span style="color: rgb(0, 0, 0);">content</span></p></div>`

Phrases inside a section block can be highlighted — apply `<mark>` inline within the `<p>` content. The same text-color rules apply.

> **WARNING — marks inside dark blocks.** The app converts all mark `color` values to `color: inherit`. Inside `hero-dark` and `hero-light` blocks, inherited text color is always white — a bright-background mark (yellow, cyan, green) will render as white text on a bright background, making it unreadable. **Do not place marks inside dark section blocks.** Use `<strong>` for emphasis inside dark blocks instead.


**Lists** — `<p>` inside `<li>` is required
`<ul><li><p>item</p></li></ul>`
`<ol><li><p>item</p></li></ol>`

**Table** (use for easy scannability and visual feeling. use table multiple times if fits)
```
<table style="min-width: 75px;">
  <colgroup><col style="min-width: 25px;"><col style="min-width: 25px;"><col style="min-width: 25px;"></colgroup>
  <tbody>
    <tr><th colspan="1" rowspan="1"><p><strong>Header</strong></p></th>...</tr>
    <tr><td colspan="1" rowspan="1"><p>Cell</p></td>...</tr>
  </tbody>
</table>
```
