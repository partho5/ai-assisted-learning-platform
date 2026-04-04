## BODY HTML FORMAT

The `body` field is a single HTML string. Use only the patterns below — no classes, no custom attributes beyond what is shown.

**Paragraph**
`<p>text</p>`

**Heading**
`<h2><strong>Heading Text</strong></h2>`

**Highlight** (use sparingly — 1–3 per article, on the phrase that carries the core insight)
`<mark data-color="#00ffff" style="background-color: rgb(0, 255, 255); color: inherit;">highlighted phrase</mark>`
`<mark data-color="#ffff00" style="background-color: rgb(255, 255, 0); color: inherit;">phrase that must not miss from eye</mark>`
`<mark data-color="#00ff00" style="background-color: rgb(0, 255, 0); color: inherit;">phrase that is worthy of green background</mark>`
`<mark data-color="#ff8c00" style="background-color: rgb(255, 140, 0); color: inherit;">phrase that is worthy of orange background</mark>`

Also use colors like
`<span style="color: rgb(239, 68, 68);">noticeable phrase</span>`

**Callout — no label as applicable** (use for definitions, key rules, warnings, named tips, copy-ready templates, examples etc)
`<div data-variant="purple" data-label="" data-type="callout">text</div>`

or with label:
`<div data-variant="amber" data-label="Label text" data-type="callout">text</div>`
Variant options: `purple` · `amber` · `green` · `teal`

**Section block — hero-light** (use for summaries, framing statements, "before" examples)
`<div data-variant="hero-light" data-label="Optional Label" data-type="section-block"><p>content</p></div>`

**Section block — bordered** (use for paragraphs that are the souls of this article)
`<div data-variant="bordered" data-type="section-block"><p>content</p></div>`


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
