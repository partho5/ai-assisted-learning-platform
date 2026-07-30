/**
 * Landing page copy, per locale.
 *
 * Bengali is the primary voice of this platform, so the Bengali copy is the
 * source narrative and the English copy mirrors it — not the other way round.
 * The Bengali text deliberately keeps common English loanwords (রিয়েল লাইফ,
 * মার্কেট ভ্যালু, স্কিল, AI) because that is how the audience actually speaks.
 */

export interface LandingStep {
    step: string;
    titleBefore: string;
    rotatingWords: string[];
    titleAfter: string;
    body: string;
}

export interface LandingCard {
    title: string;
    body: string;
}

export interface LandingProblem {
    label: string;
    body: string;
}

export interface LandingCopy {
    meta: {
        titleSuffix: string;
        description: string;
        keywords: string;
        ogTitleSuffix: string;
        ogDescription: string;
        twitterDescription: string;
        schemaDescription: string;
    };
    hero: {
        badge: string;
        titleStatic: string;
        titleGradient: string;
        subtitle: string;
        cta: string;
        note: string;
    };
    trust: string[];
    problem: {
        badge: string;
        headline: string;
        lead: string;
        points: LandingProblem[];
        punchline: string;
        punchlineSub: string;
    };
    how: {
        headline: string;
        subtitle: string;
        steps: LandingStep[];
    };
    timeline: {
        badge: string;
        headline: string;
        body: string;
        callout: string;
        cta: string;
        cards: LandingCard[];
    };
    portfolio: {
        badge: string;
        headlineTop: string;
        headlineBottom: string;
        bodyBefore: string;
        bodyAfter: string;
        points: string[];
        cta: string;
        mockRole: string;
        mockEndorsed: string;
    };
    mentors: {
        badge: string;
        headlineTop: string;
        headlineBottom: string;
        body: string;
        ctaTeach: string;
        ctaPhilosophy: string;
        cards: LandingCard[];
    };
    pricing: {
        headline: string;
        subtitle: string;
        freeLabel: string;
        freePoints: string[];
        freeCta: string;
        paidLabel: string;
        paidPrice: string;
        paidNote: string;
        paidPoints: string[];
        paidCta: string;
    };
    final: {
        headlineBefore: string;
        rotatingWords: string[];
        headlineAfter: string;
        body: string;
        cta: string;
        note: string;
    };
    viewAll: string;
    viewAllLong: string;
    recentCourses: string;
    by: string;
    resourcesCount: string;
    free: string;
}

const bn: LandingCopy = {
    meta: {
        titleSuffix: '— ২০ বছর নয়, ২ বছরে রিয়েল স্কিল',
        description:
            'প্রচলিত শিক্ষায় ১৮–২০ বছর পরও মার্কেট ভ্যালু শূন্য। Jovoc Academy-তে মুখস্থের কোনো মূল্য নেই — রিয়েল লাইফে কে কত আউটপুট দিতে পারে, সেটাই যোগ্যতার মাপকাঠি। লেটেস্ট টেকনোলজির কোর্স, জয়েন করতে টাকা লাগে না।',
        keywords:
            'জভোক একাডেমি, অনলাইন কোর্স বাংলা, স্কিল ডেভেলপমেন্ট, ফ্রিল্যান্সিং শেখা, AI কোর্স, প্রোগ্রামিং শেখা, স্কিল পোর্টফোলিও',
        ogTitleSuffix: '— ২০ বছর নয়, ২ বছরে রিয়েল স্কিল',
        ogDescription:
            'মুখস্থের কোনো মূল্য নেই। রিয়েল লাইফে কে কত আউটপুট দিতে পারে, সেটাই একমাত্র মাপকাঠি। লেটেস্ট টেকনোলজির কোর্স — প্রতি ৬ মাসে আপডেটেড।',
        twitterDescription: 'মুখস্থ নয়, রিয়েল আউটপুট। মেন্টর-ভেরিফায়েড কাজের পাবলিক পোর্টফোলিও বানান।',
        schemaDescription:
            'মেন্টর-পরিচালিত অনলাইন কোর্স ও ভেরিফায়েড স্কিল পোর্টফোলিও। মুখস্থ নয় — রিয়েল লাইফ আউটপুটই এখানে যোগ্যতার মাপকাঠি।',
    },
    hero: {
        badge: 'মুখস্থ করে পাস করা যায়, দক্ষ হওয়া যায় না',
        titleStatic: '২০ বছরের সার্টিফিকেট নয়।',
        titleGradient: '২ বছরের রিয়েল স্কিল।',
        subtitle: 'এখানে মুখস্থের কোনো মূল্য নেই। কে রিয়েল লাইফে কত আউটপুট দিতে পারে — যোগ্যতার একমাত্র মাপকাঠি সেটাই।',
        cta: 'কোর্স কারিকুলাম দেখুন',
        note: 'জয়েন করতে কোনো টাকা লাগবে না',
    },
    trust: ['লেটেস্ট টেকনোলজি', 'প্রতি ৬ মাসে নতুন কোর্স', 'পাবলিক স্কিল পোর্টফোলিও', 'AI-নেটিভ শেখা'],
    problem: {
        badge: 'কেন Jovoc',
        headline: 'দোষটা আপনার নয়। পুরো সিস্টেমের।',
        lead: 'এটা অলরেডি সবাই বোঝে — আমাদের প্রচলিত শিক্ষা ব্যবস্থা কতটা ত্রুটিপূর্ণ। এখানে মুখস্থ বিদ্যার গুরুত্বই সবচেয়ে বেশি। রিয়েল লাইফের সঙ্গে সম্পর্ক খুবই কম।',
        points: [
            {
                label: '১৮–২০ বছর',
                body: 'এত বছর পড়াশোনার পরও বুঝতে পারেন, আপনার কোনো মার্কেট ভ্যালু নেই। তারপর আবার শুরু হয় চাকরির প্রস্তুতি।',
            },
            {
                label: 'মুখস্থ = পাস',
                body: 'শুধু পরীক্ষার জন্য মুখস্থ করে লিখতে পারলেই চাকরি হয়ে যায়। কে আসলে কাজ করতে পারে, তা কেউ যাচাই করে না।',
            },
            {
                label: 'চাকরি হয় অল্প কিছু মানুষের',
                body: 'বাকিদের জন্য কী? এই প্রশ্নটার কোনো উত্তর প্রচলিত সিস্টেমের কাছে নেই।',
            },
            {
                label: 'সেবা নিতে গিয়ে টের পান',
                body: 'উপজেলা পরিষদে একটা সেবা নিতে গিয়ে একজন কর্মকর্তাকে দেখে মনে হয় — এর মতো অদক্ষ একজন মানুষ চাকরিটা পেল কীভাবে!',
            },
        ],
        punchline: 'Jovoc Academy-র শিক্ষা ব্যবস্থা ঠিক যেমনটা হওয়া উচিত।',
        punchlineSub: 'এখানে মুখস্থের কোনো মূল্য নেই। কে রিয়েল লাইফে কতটা আউটপুট দিতে পারে, সেটাই তার যোগ্যতার মাপকাঠি।',
    },
    how: {
        headline: 'কীভাবে কাজ করে',
        subtitle: 'তিনটা ধাপ — শেখা থেকে আয় পর্যন্ত।',
        steps: [
            {
                step: '০১',
                titleBefore: 'একটা ',
                rotatingWords: ['স্কিল', 'টেকনোলজি', 'টুল', 'সিস্টেম'],
                titleAfter: ' বেছে নিন',
                body: 'সিলেবাস নয়, মার্কেট দেখে বানানো। প্রতিটি কোর্স লেটেস্ট টেকনোলজির — যেটার চাহিদা আজই আছে। প্রতি ৬ মাসে নতুন টেকনোলজি এলে নতুন কোর্স যুক্ত হয়।',
            },
            {
                step: '০২',
                titleBefore: 'রিয়েল ',
                rotatingWords: ['কাজ', 'প্রজেক্ট', 'আউটপুট', 'ডেলিভারি'],
                titleAfter: ' করে দেখান',
                body: 'পরীক্ষার খাতা নয়। এখানে অ্যাসাইনমেন্ট মানে আসল কাজ — একজন ক্লায়েন্ট বা রিক্রুটার যা খুলে পড়তে পারেন, যাচাই করতে পারেন।',
            },
            {
                step: '০৩',
                titleBefore: 'কাজ যাচাই করেন একজন ',
                rotatingWords: ['মেন্টর', 'এক্সপার্ট', 'প্রফেশনাল'],
                titleAfter: '',
                body: 'ইন্ডাস্ট্রিতে কাজ করা একজন মানুষ আপনার কাজ পড়ে পাবলিক এনডোর্সমেন্ট লেখেন — যা স্থায়ীভাবে আপনার প্রোফাইলে থাকে। সার্টিফিকেট নয়, প্রমাণ।',
            },
        ],
    },
    timeline: {
        badge: 'সময়ের হিসাব',
        headline: '২০ বছর নয়। মাত্র ২ বছর।',
        body: 'মাত্র ২ বছর সময় দিলেই এমন দক্ষতা অর্জন করা সম্ভব, যা দিয়ে অনেক প্রচলিত চাকরির চেয়েও বেশি আয় করা যায়।',
        callout: 'শুনতে কি লেকচারবাজি মনে হচ্ছে? যদি মনে হয়, তাহলে হয়তো আপনি এখনো বুঝতে পারেননি পৃথিবী কত দ্রুত বদলে গেছে।',
        cta: 'আগে কারিকুলাম দেখুন',
        cards: [
            {
                title: 'AI চলে এসেছে',
                body: 'আগে যে কাজে সারাদিন লাগত, এখন তা ঘণ্টায় হয়ে যায়। তাহলে সারাদিন কাজ করবেন কেন? AI দিয়ে কাজ কমিয়ে আয় বাড়ানোই এখন আসল স্কিল।',
            },
            {
                title: 'শুধু চাকরি নয় — ক্লায়েন্টও',
                body: 'সব শিক্ষার্থী চাকরি চান না। কেউ চান ক্লায়েন্ট, কেউ নিজের প্রোডাক্ট। এখানকার স্কিল দিয়ে দুটোই সম্ভব।',
            },
            {
                title: 'স্বাধীনভাবে নিজের পেশা',
                body: 'লেটেস্ট টেকনোলজি ব্যবহার করে কম সময়ে স্বাধীনভাবে নিজের পেশা গড়ে তোলাই Jovoc Academy-র লক্ষ্য।',
            },
        ],
    },
    portfolio: {
        badge: 'আপনার পাবলিক পোর্টফোলিও',
        headlineTop: 'সার্টিফিকেট বলে আপনি ক্লাসে বসে ছিলেন।',
        headlineBottom: 'পোর্টফোলিও দেখায় আপনি আসলে কী করতে পারেন।',
        bodyBefore: 'মেন্টর যে কাজটা এনডোর্স করেন, আপনি যে টেস্ট পাস করেন — সবকিছু পাবলিকলি ভেরিফায়েড থাকে ',
        bodyAfter: '-এ। একটাই লিংক। কোনো PDF নেই। "বিশ্বাস করুন" বলার দরকার নেই।',
        points: [
            'রিক্রুটার আপনার আসল কাজ দেখেন — কোনো কমপ্লিশন ব্যাজ নয়',
            'মেন্টর পাবলিক এনডোর্সমেন্ট লেখেন, যা আপনার আউটপুটের জামিন',
            'সেরা ৫টি কাজ পিন করে রাখুন প্রোফাইলের উপরে',
            'একটাই URL — জব অ্যাপ্লিকেশন, LinkedIn, ক্লায়েন্ট, সবখানে',
        ],
        cta: 'পোর্টফোলিও বানান',
        mockRole: 'ফুল-স্ট্যাক ডেভেলপার',
        mockEndorsed: 'এনডোর্সড',
    },
    mentors: {
        badge: 'মেন্টরদের জন্য',
        headlineTop: 'যা জানেন, তা শেখান।',
        headlineBottom: 'শেখানো থেকেই আয় করুন।',
        body: 'মডিউল, রিচ-টেক্সট লেসন, ভিডিও আর রিয়েল অ্যাসাইনমেন্ট দিয়ে গোছানো কোর্স বানান। শিক্ষার্থীর সাবমিশন রিভিউ করুন, এনডোর্সমেন্ট লিখুন, নিজের দাম নিজেই ঠিক করুন।',
        ctaTeach: 'শেখানো শুরু করুন',
        ctaPhilosophy: 'আমাদের দর্শন',
        cards: [
            {
                title: 'পূর্ণ কোর্স বিল্ডার',
                body: 'মডিউল, লেসন, ভিডিও, আর্টিকেল, অ্যাসাইনমেন্ট — সব এক এডিটরেই।',
            },
            {
                title: 'AI-সহায়ক টেস্ট',
                body: 'কুইজ প্রশ্ন আর রুব্রিক অটো-জেনারেট করুন, তারপর নিজের স্ট্যান্ডার্ডে ঠিক করে নিন।',
            },
            {
                title: 'সাবমিশন রিভিউ',
                body: 'শিক্ষার্থীর কাজ দেখুন, লিখিত ফিডব্যাক দিন, ভালো কাজ এনডোর্স করুন।',
            },
            {
                title: 'নমনীয় প্রাইসিং',
                body: 'একবারের দাম বা সাবস্ক্রিপশন — যেটা চান। কমিউনিটির জন্য কুপন কোড দিন।',
            },
        ],
    },
    pricing: {
        headline: 'সহজ প্রাইসিং',
        subtitle: 'সাবস্ক্রিপশন বাধ্যতামূলক নয়। যেটা লাগবে, শুধু তার জন্যই দিন।',
        freeLabel: 'ফ্রি, সবসময়',
        freePoints: [
            'পুরো কোর্স ক্যাটালগ দেখুন',
            'সব ফ্রি রিসোর্স পড়ুন',
            'AI লার্নিং অ্যাসিস্ট্যান্ট',
            'পাবলিক পোর্টফোলিও পেজ',
            'প্ল্যাটফর্ম AI-এর সঙ্গে চ্যাট',
        ],
        freeCta: 'ফ্রিতে শুরু করুন',
        paidLabel: 'কোর্স প্রতি',
        paidPrice: 'মেন্টরের দাম',
        paidNote: 'একবারের দাম বা সাবস্ক্রিপশন — মেন্টর ঠিক করেন।',
        paidPoints: [
            'ফ্রি-র সবকিছু',
            'পুরো কোর্স অ্যাক্সেস',
            'অ্যাসাইনমেন্ট সাবমিট',
            'মেন্টর রিভিউ ও এনডোর্সমেন্ট',
            'পোর্টফোলিওতে অ্যাচিভমেন্ট',
            'কুপন কোড চলবে',
        ],
        paidCta: 'কোর্স দেখুন',
    },
    final: {
        headlineBefore: 'আপনার পরের ',
        rotatingWords: ['ক্যারিয়ার', 'বিজনেস', 'ক্লায়েন্ট', 'আয়'],
        headlineAfter: ' শুরু হোক এখান থেকেই।',
        body: 'PDF অ্যাটাচ করা বন্ধ করুন। মেন্টর-এনডোর্সড কাজের একটা পোর্টফোলিও বানান — একটা লিংকই আপনার হয়ে কথা বলবে।',
        cta: 'ফ্রিতে সাইন আপ করুন',
        note: 'ক্রেডিট কার্ড লাগবে না।',
    },
    viewAll: 'সব দেখুন',
    viewAllLong: 'সব কোর্স দেখুন',
    recentCourses: 'সাম্প্রতিক কোর্স',
    by: 'মেন্টর:',
    resourcesCount: 'টি রিসোর্স',
    free: 'ফ্রি',
};

const en: LandingCopy = {
    meta: {
        titleSuffix: '— Not 20 Years. Real Skills in 2.',
        description:
            'Twenty years of schooling and still no market value. At Jovoc Academy memorisation counts for nothing — what you can actually produce in real life is the only measure of skill. Latest-technology courses, free to join.',
        keywords:
            'jovoc academy, online courses, skill development, freelancing, AI courses, learn programming, skill portfolio, verified learning',
        ogTitleSuffix: '— Not 20 Years. Real Skills in 2.',
        ogDescription:
            'Memorisation counts for nothing here. What you can produce in real life is the only measure. Latest-technology courses, refreshed every six months.',
        twitterDescription: 'Not memorisation — real output. Build a public portfolio of mentor-verified work.',
        schemaDescription:
            'Mentor-led online courses with verified skill portfolios. Not memorisation — real-life output is the only measure of skill here.',
    },
    hero: {
        badge: 'You can memorise your way to a pass. Not to a skill.',
        titleStatic: 'Not a 20-year certificate.',
        titleGradient: 'Real skills in 2 years.',
        subtitle: 'Memorisation counts for nothing here. What you can actually produce in real life is the only measure of skill.',
        cta: 'See the curriculum',
        note: 'Joining costs nothing',
    },
    trust: ['Latest technology', 'New courses every 6 months', 'Public skill portfolio', 'AI-native learning'],
    problem: {
        badge: 'Why Jovoc',
        headline: "It isn't your fault. It's the system's.",
        lead: 'Everyone already knows how broken conventional education is. Memorisation is what it rewards most. Its connection to real life is almost nothing.',
        points: [
            {
                label: '18–20 years',
                body: 'After all those years of study you realise you have no market value. Then the job preparation starts all over again.',
            },
            {
                label: 'Memorise = pass',
                body: 'Write down what you memorised for the exam and the job is yours. Nobody ever checks who can actually do the work.',
            },
            {
                label: 'Only a few get hired',
                body: 'And everyone else? The conventional system has no answer to that question.',
            },
            {
                label: 'You feel it at the counter',
                body: 'You go to a government office for one small service, watch the officer behind the desk, and wonder how someone that unskilled ever got the job.',
            },
        ],
        punchline: 'Jovoc Academy is education the way it should have been.',
        punchlineSub: 'Memorisation counts for nothing here. How much you can actually produce in real life is the only measure of your ability.',
    },
    how: {
        headline: 'How it works',
        subtitle: 'Three steps, from learning to earning.',
        steps: [
            {
                step: '01',
                titleBefore: 'Pick a ',
                rotatingWords: ['skill', 'technology', 'tool', 'system'],
                titleAfter: ' to learn',
                body: 'Built around the market, not a syllabus. Every course uses current technology — the kind in demand today. When new technology lands, new courses follow within six months.',
            },
            {
                step: '02',
                titleBefore: 'Ship real ',
                rotatingWords: ['work', 'projects', 'output', 'deliverables'],
                titleAfter: '',
                body: 'Not exam scripts. Assignments here mean actual work — something a client or a recruiter can open, read, and judge for themselves.',
            },
            {
                step: '03',
                titleBefore: 'Get judged by a real ',
                rotatingWords: ['mentor', 'expert', 'professional'],
                titleAfter: '',
                body: 'Someone working in the industry reads your work and writes a public endorsement that stays on your profile permanently. Not a certificate. Proof.',
            },
        ],
    },
    timeline: {
        badge: 'The maths of time',
        headline: 'Not 20 years. Just 2.',
        body: 'Give it two years and you can build the kind of skill that earns more than plenty of conventional jobs.',
        callout: "Sounds like a lecture? If it does, maybe you haven't noticed how fast the world has changed.",
        cta: 'Look at the curriculum first',
        cards: [
            {
                title: 'AI is already here',
                body: 'Work that used to fill a whole day now takes an hour. So why still work all day? Using AI to cut the work and raise the income is the real skill now.',
            },
            {
                title: 'Not just jobs — clients too',
                body: 'Not every learner wants a job. Some want clients. Some want their own product. The skills here serve both.',
            },
            {
                title: 'An independent career',
                body: 'Building an independent career in less time using the latest technology — that is what Jovoc Academy exists for.',
            },
        ],
    },
    portfolio: {
        badge: 'Your public portfolio',
        headlineTop: 'A certificate says you sat through it.',
        headlineBottom: 'This shows what you can actually do.',
        bodyBefore: 'Every assignment a mentor endorses, every test you pass — it is all publicly verified at ',
        bodyAfter: '. One link. No PDFs. No "trust me."',
        points: [
            'Recruiters see your actual work — not a completion badge',
            'Mentors write public endorsements that vouch for your output',
            'Pin your strongest pieces — up to 5 featured submissions',
            'Share one URL in job applications, LinkedIn, anywhere',
        ],
        cta: 'Build your portfolio',
        mockRole: 'Full-Stack Developer',
        mockEndorsed: 'Endorsed',
    },
    mentors: {
        badge: 'For mentors',
        headlineTop: 'Share what you know.',
        headlineBottom: 'Earn from what you teach.',
        body: 'Build structured courses with modules, rich-text lessons, videos, and real assignments. Review student submissions, write endorsements, and set your own price.',
        ctaTeach: 'Start teaching',
        ctaPhilosophy: 'Our philosophy',
        cards: [
            {
                title: 'Rich course builder',
                body: 'Modules, lessons, videos, articles, and assignments — all in one editor.',
            },
            {
                title: 'AI-assisted tests',
                body: 'Auto-generate quiz questions and rubrics, then fine-tune to your standards.',
            },
            {
                title: 'Submission review',
                body: 'Review student work, leave written feedback, and endorse strong submissions.',
            },
            {
                title: 'Flexible pricing',
                body: 'Set one-time or subscription pricing. Offer coupon codes to your community.',
            },
        ],
    },
    pricing: {
        headline: 'Simple pricing',
        subtitle: 'No subscription required. Pay only for what you want.',
        freeLabel: 'Free forever',
        freePoints: [
            'Browse full course catalog',
            'Access all free resources',
            'AI learning assistant',
            'Public portfolio page',
            'Chat with the platform AI',
        ],
        freeCta: 'Get started free',
        paidLabel: 'Per course',
        paidPrice: "Mentor's price",
        paidNote: 'One-time or subscription, set by the mentor.',
        paidPoints: [
            'Everything in Free',
            'Full course access',
            'Submit assignments',
            'Mentor review & endorsement',
            'Achievements on your portfolio',
            'Coupon codes accepted',
        ],
        paidCta: 'Browse courses',
    },
    final: {
        headlineBefore: 'Your next ',
        rotatingWords: ['career', 'business', 'client', 'income'],
        headlineAfter: ' should start here.',
        body: 'Stop attaching PDFs. Build a portfolio of mentor-endorsed work and send one link that does the talking for you.',
        cta: 'Sign up free',
        note: 'No credit card required.',
    },
    viewAll: 'View all',
    viewAllLong: 'View all courses',
    recentCourses: 'Recent courses',
    by: 'by',
    resourcesCount: ' resources',
    free: 'Free',
};

const COPY: Record<string, LandingCopy> = { bn, en };

export function landingCopy(locale: string): LandingCopy {
    return COPY[locale] ?? bn;
}
