<?php

/**
 * Server-rendered OG/description metadata for public pages.
 *
 * app.blade.php reads these off the `meta` Inertia prop, which is what social
 * and search crawlers see before any JavaScript runs. Keep the wording in step
 * with the page copy in resources/js/lib/*-copy.ts.
 */
return [
    /**
     * "Jovoc" is an acronym for "Journey of Vocation & Contentment". The
     * expansion is the brand's name, not a phrase, so it stays in Latin script
     * in every locale — mirrored in resources/js/lib/brand.ts.
     */
    'brand' => [
        'name' => 'Jovoc',
        'expansion' => 'Journey of Vocation & Contentment',
    ],

    'home' => [
        'title' => 'Jovoc — Journey of Vocation & Contentment | Real Skills in 2 Years',
        'description' => 'Twenty years of schooling and still no market value. At Jovoc Academy memorisation counts for nothing — what you can actually produce in real life is the only measure of skill. Latest-technology courses, free to join.',
    ],

    'about' => [
        'title' => 'About us | Jovoc — Journey of Vocation & Contentment',
        'description' => 'Why conventional education stopped working, and how Jovoc Academy does it differently — measuring ability by real-life output instead of memorisation.',
    ],
];
