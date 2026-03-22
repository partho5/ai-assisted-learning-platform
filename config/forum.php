<?php

return [

    'reputation' => [
        'points' => [
            'thread_upvoted' => 2,
            'reply_upvoted' => 10,
            'reply_accepted' => 25,
            'thread_created' => 5,   // only awarded once thread has 1+ upvote
            'mention_ai_responded' => 3,
        ],
        'levels' => [
            ['min' => 0,    'max' => 49,   'label' => 'Newcomer',    'color' => 'gray'],
            ['min' => 50,   'max' => 199,  'label' => 'Contributor', 'color' => 'blue'],
            ['min' => 200,  'max' => 499,  'label' => 'Regular',     'color' => 'green'],
            ['min' => 500,  'max' => 1499, 'label' => 'Respected',   'color' => 'amber'],
            ['min' => 1500, 'max' => 3999, 'label' => 'Expert',      'color' => 'orange'],
            ['min' => 4000, 'max' => null, 'label' => 'Legend',      'color' => 'violet'],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    */
    'threads_per_page' => 20,
    'replies_per_page' => 30,

    /*
    |--------------------------------------------------------------------------
    | Thread Settings
    |--------------------------------------------------------------------------
    */
    'trending_days' => 7,                // window for "trending" filter
    'unanswered_ai_trigger_minutes' => 30,  // AI auto-reply if no human response after N minutes
    'max_tags_per_thread' => 5,

    /*
    |--------------------------------------------------------------------------
    | Reply Nesting
    |--------------------------------------------------------------------------
    */
    'max_reply_depth' => 10,
    'max_ai_replies_per_thread' => 5,

];
