<?php

/**
 * Pre-canned FAQ answers matched by keyword before RAG runs.
 * Zero API cost for the most common questions.
 *
 * Each entry has:
 *   triggers  — substring match against lowercased user message (any match fires)
 *   answer    — the canned response to return directly
 *
 * Keep answers brief and accurate. Update as the platform evolves.
 */
return [
    [
        'triggers' => ['how do i sign up', 'how to register', 'create account', 'create an account', 'get started'],
        'answer' => 'Getting started is free! Click **Sign Up** in the top-right corner, choose your role (learner or mentor), and you\'re in. No credit card required for the Free tier.',
    ],
    [
        'triggers' => ['how do i enroll', 'how to enroll', 'join a course', 'join course'],
        'answer' => 'Visit any course page and click **Enroll Free** for observer access (free preview), or **Get Full Access** for the complete experience. Full access is included with the Paid tier or can be purchased per course.',
    ],
    [
        'triggers' => ['free tier', 'free plan', 'what is free', 'what\'s free', 'what do i get for free'],
        'answer' => 'The Free tier gives you access to free resources in any course as an observer. You can browse the course catalog, read free lessons, and watch free videos — no payment needed.',
    ],
    [
        'triggers' => ['paid tier', 'paid plan', 'premium', 'upgrade', 'what does paid include', 'paid features'],
        'answer' => 'The Paid tier unlocks full access to all courses, AI assistance during tests (hints and feedback), and the ability to earn verified endorsements on your public portfolio.',
    ],
    [
        'triggers' => ['how much does it cost', 'pricing', 'price', 'subscription cost', 'how much is it'],
        'answer' => 'Pricing details are on our pricing page. You can also purchase individual courses without a subscription. Check the course page for per-course pricing.',
    ],
    [
        'triggers' => ['what is a portfolio', 'public portfolio', 'portfolio page', '/u/'],
        'answer' => 'Your public portfolio at `/u/your-username` showcases your endorsed skills and completed assessments. You control what appears there — toggle endorsements on or off from your attempt results.',
    ],
    [
        'triggers' => ['what is an endorsement', 'endorsed skill', 'how to get endorsed'],
        'answer' => 'Endorsements are awarded when you pass an assessment. Formative tests are auto-endorsed on submission. Assignment-type assessments require your mentor to review and endorse your work.',
    ],
    [
        'triggers' => ['what is a mentor', 'who are mentors', 'become a mentor'],
        'answer' => 'Mentors are subject-matter experts who create and curate course content. They also review assignment submissions and endorse learner skills. To become a mentor, register with the Mentor role.',
    ],
    [
        'triggers' => ['forgot password', 'reset password', 'can\'t log in', 'cannot log in', 'lost password'],
        'answer' => 'Click **Forgot password?** on the login page to receive a password reset link by email.',
    ],
    [
        'triggers' => ['refund', 'cancel subscription', 'cancel my plan'],
        'answer' => 'For refund or cancellation requests, please contact our support team directly. We\'re happy to help.',
    ],
];
