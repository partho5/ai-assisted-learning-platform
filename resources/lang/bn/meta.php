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
        'title' => 'Jovoc — Journey of Vocation & Contentment | ২ বছরে রিয়েল স্কিল',
        'description' => 'প্রচলিত শিক্ষায় ১৮–২০ বছর পরও মার্কেট ভ্যালু শূন্য। Jovoc Academy-তে মুখস্থের কোনো মূল্য নেই — রিয়েল লাইফে কে কত আউটপুট দিতে পারে, সেটাই যোগ্যতার মাপকাঠি। লেটেস্ট টেকনোলজির কোর্স, জয়েন করতে টাকা লাগে না।',
    ],

    'about' => [
        'title' => 'আমাদের কথা | Jovoc — Journey of Vocation & Contentment',
        'description' => 'প্রচলিত শিক্ষা ব্যবস্থা কেন কাজ করছে না, আর Jovoc Academy কীভাবে ভিন্নভাবে কাজ করে — মুখস্থ নয়, রিয়েল লাইফ আউটপুট দিয়ে যোগ্যতা মাপার গল্প।',
    ],
];
