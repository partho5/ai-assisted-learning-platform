/**
 * About page copy, per locale.
 *
 * Same principle as landing-copy.ts: the Bengali text is the source narrative
 * and the English mirrors it. The founder's note is written in first person and
 * stays in the founder's own voice — do not smooth it into marketing prose.
 */

export interface AboutBenefit {
    /** Key into the page's icon map. */
    icon: string;
    headline: string;
    body: string;
}

export interface AboutCopy {
    meta: {
        title: string;
        description: string;
    };
    /** One line under the spelled-out acronym, explaining why that name. */
    nameNote: string;
    problem: {
        badge: string;
        headline: string;
        paragraphs: string[];
        pullquote: string;
    };
    answer: {
        badge: string;
        headline: string;
        lead: string;
        benefits: AboutBenefit[];
    };
    timeline: {
        badge: string;
        headline: string;
        paragraphs: string[];
        callout: string;
        closing: string;
        cta: string;
    };
    founder: {
        badge: string;
        headline: string;
        paragraphs: string[];
        pullquote: string;
        closing: string;
        signature: string;
    };
    mentors: {
        badge: string;
        headline: string;
        lead: string;
        benefits: AboutBenefit[];
    };
}

const bn: AboutCopy = {
    meta: {
        title: 'আমাদের কথা',
        description:
            'প্রচলিত শিক্ষা ব্যবস্থা কেন কাজ করছে না, আর Jovoc Academy কীভাবে ভিন্নভাবে কাজ করে — মুখস্থ নয়, রিয়েল লাইফ আউটপুট দিয়ে যোগ্যতা মাপার গল্প।',
    },
    nameNote:
        'নামটা এমনি এমনি বেছে নেওয়া হয়নি। শুধু একটা পেশা নয় — এমন একটা পেশা, যেটা করে আপনি শান্তিতে থাকতে পারবেন।',
    problem: {
        badge: 'আমাদের অবস্থান',
        headline: 'প্রচলিত শিক্ষা ব্যবস্থা ভাঙা। এটা সবাই জানে।',
        paragraphs: [
            'এটা অলরেডি সবাই বোঝে, আমাদের প্রচলিত শিক্ষা ব্যবস্থা কতটা ত্রুটিপূর্ণ। এখানে মুখস্থ বিদ্যার গুরুত্বই সবচেয়ে বেশি। রিয়েল লাইফের সঙ্গে শিক্ষা ব্যবস্থার সম্পর্ক খুবই কম।',
            '১৮–২০ বছর পড়াশোনা করার পরও বুঝতে পারেন, আপনার কোনো মার্কেট ভ্যালু নেই। আবার নতুন করে চাকরির প্রস্তুতি নিতে হয়। তারপরও চাকরি হয় অল্প কিছু মানুষের।',
            'অনেক সময় দেখা যায়, শুধু পরীক্ষার জন্য মুখস্থ করে লিখতে পারলেই চাকরি হয়ে যায়। অথচ রিয়েল লাইফে — ধরুন উপজেলা পরিষদে একটা সেবা নিতে গেলেন — সেখানকার একজন কর্মকর্তাকে দেখে আপনার মনে হয়, এর মতো অদক্ষ একজন মানুষ চাকরিটা পেল কীভাবে!',
        ],
        pullquote: 'এখানে ওই ব্যক্তির দোষ নয়। দোষ পুরো শিক্ষা ব্যবস্থা এবং সিস্টেমের।',
    },
    answer: {
        badge: 'আমাদের উত্তর',
        headline: 'Jovoc Academy-র শিক্ষা ব্যবস্থা ঠিক যেমনটা হওয়া উচিত।',
        lead: 'এখানে মুখস্থের কোনো মূল্য নেই। কে রিয়েল লাইফে কতটা আউটপুট দিতে পারে, সেটাই তার যোগ্যতার মাপকাঠি।',
        benefits: [
            {
                icon: 'book',
                headline: 'কারিকুলাম সাজানো হয় আউটপুট ধরে, সিলেবাস ধরে নয়',
                body: 'প্রতিটি কোর্স ধাপে ধাপে বানানো। প্রতিটি লেসন আপনাকে পরের লেসনের জন্য তৈরি করে। শেষে আপনার হাতে এমন কিছু থাকে যা আপনি বানাতে পারেন — শুধু যা আপনি পড়েছেন, তা নয়।',
            },
            {
                icon: 'zap',
                headline: 'উত্তর মেলে সেকেন্ডে, দিনের পর দিন অপেক্ষা নয়',
                body: 'উত্তর লিখুন, সাবমিট করুন। কয়েক সেকেন্ডেই স্কোর আর তার কারণ — দুটোই দেখতে পাবেন। AI আপনার উত্তর যাচাই করে মেন্টরের ঠিক করা স্ট্যান্ডার্ডে। যেটা মানুষের চোখে দেখা দরকার, সেটা মেন্টর নিজেই দেখেন। আপনি সবসময় জানেন আপনি ঠিক কোথায় দাঁড়িয়ে আছেন।',
            },
            {
                icon: 'bot',
                headline: 'AI টিউটর আপনার কোর্সটা চেনে',
                body: 'আপনি কোন কোর্সে আছেন, কতদূর এগিয়েছেন, এইমাত্র কী পড়েছেন — সব জানে। রাত ৩টায় প্রশ্ন করুন। উত্তর আসবে আপনার কোর্স ম্যাটেরিয়াল থেকে, র‍্যান্ডম ইন্টারনেট থেকে নয়। আটকে গেলে হিন্ট দেয়, না বুঝলে আবার বুঝিয়ে দেয়।',
            },
            {
                icon: 'idcard',
                headline: 'যা শিখলেন, তার প্রমাণ পাবলিক থাকে',
                body: 'কোর্স শেষ হলে সেটা আপনার পাবলিক প্রোফাইলে যায় — আপনার নামের একটা রিয়েল ওয়েব অ্যাড্রেসে। মেন্টর আপনার কাজ দেখে অ্যাপ্রুভ করলে সেই অ্যাপ্রুভাল স্থায়ীভাবে থেকে যায়। এটা ঘরে বসে প্রিন্ট করা সার্টিফিকেট নয়। লিংকটা এমপ্লয়ারকে পাঠান, ক্লায়েন্টকে পাঠান — নিজে দেখে নিন।',
            },
            {
                icon: 'eye',
                headline: 'টাকা দেওয়ার আগেই যাচাই করে নিন',
                body: 'ফ্রি লেসনগুলো খোলা। অ্যাকাউন্টও লাগবে না। পড়ুন, দেখুন, তারপর ঠিক করুন কোয়ালিটি আপনার টাকার যোগ্য কি না। মন সায় দিলে এনরোল করে সবকিছু আনলক করুন — অ্যাসেসমেন্ট, প্রোগ্রেস, পোর্টফোলিও।',
            },
            {
                icon: 'refresh',
                headline: 'প্রতি ৬ মাসে কারিকুলাম নতুন হয়',
                body: 'নতুন টেকনোলজি এলেই নতুন কোর্স যুক্ত হয়। ৩ বছর আগে রেকর্ড করা ভিডিও দিয়ে আজকের মার্কেটে কাজ চলে না — আমরা সেটা জানি, তাই ধরে বসে থাকি না।',
            },
        ],
    },
    timeline: {
        badge: 'সময়ের হিসাব',
        headline: '২০ বছর নয়। মাত্র ২ বছর।',
        paragraphs: [
            'মাত্র ২ বছর সময় দিলেই এমন দক্ষতা অর্জন করা সম্ভব, যা দিয়ে অনেক প্রচলিত চাকরির চেয়েও বেশি আয় করা যায়।',
            'Jovoc Academy-তে জয়েন করতে কোনো টাকা লাগবে না। আগে শুধু এখানকার কোর্স কারিকুলামগুলো দেখুন। সবগুলোই সর্বশেষ প্রযুক্তির সঙ্গে আপডেটেড। প্রতি ছয় মাসে নতুন প্রযুক্তি এলে, প্রতি ছয় মাসেই নতুন কোর্স যুক্ত হবে।',
        ],
        callout: 'শুনতে কি লেকচারবাজি মনে হচ্ছে? যদি মনে হয়, তাহলে হয়তো আপনি এখনো বুঝতে পারেননি পৃথিবী কত দ্রুত বদলে গেছে।',
        closing: 'লেটেস্ট টেকনোলজি ব্যবহার করে কম সময়ে স্বাধীনভাবে নিজের পেশা গড়ে তোলাই Jovoc Academy-র লক্ষ্য।',
        cta: 'কোর্স কারিকুলাম দেখুন',
    },
    founder: {
        badge: 'ফাউন্ডারের কথা',
        headline: 'নমস্কার। আমি পার্থ, Jovoc-এর ফাউন্ডার।',
        paragraphs: [
            '২০১২ সালে এইচএসসি পাশ করে ২০১৩ সালে ঢাকা বিশ্ববিদ্যালয়ে ভর্তি হই। ইলেকট্রিক্যাল অ্যান্ড ইলেকট্রনিক ইঞ্জিনিয়ারিং বিভাগে পড়াশোনা করেছি। তবে কর্মজীবন শুরু করি সফটওয়্যার ইঞ্জিনিয়ার হিসেবে।',
            'চাকরি জীবন আমার একদমই ভালো লাগেনি। তাই ছোট পরিসরে নিজের সফটওয়্যার বিজনেস শুরু করি। বর্তমানে ফ্রিল্যান্স সফটওয়্যার ইঞ্জিনিয়ার হিসেবে বাংলাদেশ, আমেরিকাসহ বিভিন্ন দেশের ব্যবসায়ীদের জন্য সফটওয়্যার ডেভেলপ করি।',
            'AI-এর কারণে এখন অনেক কাজ আগের তুলনায় অনেক কম সময়ে করা যায়। যেখানে অনেক পেশায় এখনো সারাদিন অফিসে কাজ করতে হয়, সেখানে আমার কাজের বড় অংশই AI দিয়ে করিয়ে নিতে পারি।',
        ],
        pullquote: 'একবার ভাবুন — AI চলে আসার পরও কেন সারাদিন কাজ করবেন?',
        closing:
            'AI ব্যবহার করে কীভাবে কাজ কমিয়ে আয় বাড়ানো যায়, সেটি নিয়েই আমি নিয়মিত গবেষণা করি। আর সেই গবেষণার ফলাফল ধারাবাহিকভাবে সবার সঙ্গে শেয়ার করছি Jovoc Academy-র মাধ্যমে।',
        signature: '— পার্থ, ফাউন্ডার, Jovoc',
    },
    mentors: {
        badge: 'মেন্টরদের জন্য',
        headline: 'একবার শেখান। উপকার চলতে থাকে অনেক পরেও।',
        lead: 'যাঁরা ইন্ডাস্ট্রিতে কাজ করছেন, তাঁদের জানাটাই এখানে কারিকুলাম হয়ে ওঠে।',
        benefits: [
            {
                icon: 'broadcast',
                headline: 'আপনার জানা পৌঁছে যায় যেকোনো সময়ে',
                body: 'লেসনটা একবার লিখুন। একজন শিক্ষার্থী সেটা পড়েন রাতে, কাজ শেষে। আপনাকে বারবার একই কথা বলতে হয় না। আপনি শুধু লেসনটা সেরা বানানোয় মন দেন — বাকিটা প্ল্যাটফর্ম সামলায়।',
            },
            {
                icon: 'checksquare',
                headline: 'আপনার স্ট্যান্ডার্ড অটুট থাকে, যত শিক্ষার্থীই হোক',
                body: 'রুব্রিকটা আপনি লিখে দেন — ভালো উত্তরের নিয়মটা কী। AI প্রতিটি ওপেন-এন্ডেড উত্তর সেই নিয়মেই যাচাই করে। সহজ টেস্ট আপনার কাছে আসেই না। শুধু যেগুলোতে আপনার বিচার দরকার, সেগুলোই আসে।',
            },
            {
                icon: 'award',
                headline: 'আপনার এনডোর্সমেন্টের আসল দাম আছে',
                body: 'আপনি কোনো শিক্ষার্থীর অ্যাসাইনমেন্ট অ্যাপ্রুভ করলে আপনার নাম স্থায়ীভাবে তার পোর্টফোলিওতে যুক্ত হয়। আপনি এমনি এমনি অ্যাপ্রুভ করেন না — কাজটা পড়ে সিদ্ধান্ত নেন। শিক্ষার্থীরা এটা জানে, তাই তারা বেশি খাটে।',
            },
            {
                icon: 'message',
                headline: 'আপনি অফলাইনে থাকলেও শিক্ষার্থী সাহায্য পান',
                body: 'কমিউনিটি ফোরামে AI মেম্বাররা কোর্স-সংক্রান্ত প্রশ্নের উত্তর দেয় আপনি না থাকলেও। যেগুলোতে সত্যিই একজন এক্সপার্ট দরকার, সেগুলো আপনার কাছেই আসে — কিন্তু সাহায্যের একমাত্র উৎস আর আপনি নন।',
            },
        ],
    },
};

const en: AboutCopy = {
    meta: {
        title: 'About us',
        description:
            'Why conventional education stopped working, and how Jovoc Academy does it differently — measuring ability by real-life output instead of memorisation.',
    },
    nameNote:
        'The name was not picked at random. Not just a vocation — a vocation you can live with in peace.',
    problem: {
        badge: 'Where we stand',
        headline: 'Conventional education is broken. Everyone knows it.',
        paragraphs: [
            'Everyone already understands how flawed our conventional education system is. Memorisation is what it rewards most. Its connection to real life is almost nothing.',
            'After 18–20 years of study you still discover you have no market value. So the job preparation starts all over again. And even then, only a few people get hired.',
            'Often, being able to write down what you memorised for the exam is enough to land the job. Then in real life — say you go to a government office for one small service — you look at the officer behind the desk and wonder how someone that unskilled ever got the job.',
        ],
        pullquote: "The fault is not that person's. The fault is the whole education system and the machinery around it.",
    },
    answer: {
        badge: 'Our answer',
        headline: 'Jovoc Academy is education the way it should have been.',
        lead: 'Memorisation counts for nothing here. How much you can actually produce in real life is the only measure of your ability.',
        benefits: [
            {
                icon: 'book',
                headline: 'The curriculum is built around output, not a syllabus',
                body: 'Every course is built in order. Each lesson prepares you for the next. At the end you hold something you can build — not just something you have read.',
            },
            {
                icon: 'zap',
                headline: 'You get your answer in seconds, not days',
                body: "Write your answer. Submit it. In seconds you see your score and the reason for it. The AI grades your answer against your mentor's standard. Work that needs human judgment goes to your mentor. You always know exactly where you stand.",
            },
            {
                icon: 'bot',
                headline: 'The AI tutor knows your course',
                body: 'It knows which course you are in, how far you have gone, and what you just read. Ask it a question at 3am. It answers from your course material, not from random internet sources. It gives hints when you are stuck and explains again when you do not follow.',
            },
            {
                icon: 'idcard',
                headline: 'What you learn leaves public proof',
                body: 'Finish a course and it goes into your public profile — at a real web address with your name on it. When a mentor reviews your work and approves it, that approval stays there permanently. This is not a certificate anyone can print at home. Send the link to an employer, to a client, and let them see for themselves.',
            },
            {
                icon: 'eye',
                headline: 'Judge the quality before you pay anything',
                body: 'Free lessons are open. No account needed. Read them, watch them, then decide whether the quality is worth your money. When you are convinced, enroll and unlock everything — assessments, progress, your portfolio.',
            },
            {
                icon: 'refresh',
                headline: 'The curriculum is renewed every six months',
                body: 'When new technology lands, new courses follow. A video recorded three years ago does not carry you through today\'s market — we know that, so we do not sit on it.',
            },
        ],
    },
    timeline: {
        badge: 'The maths of time',
        headline: 'Not 20 years. Just 2.',
        paragraphs: [
            'Give it two years and you can build the kind of skill that earns more than plenty of conventional jobs.',
            'Joining Jovoc Academy costs nothing. Just look at the course curricula first. All of them are updated to the latest technology. Every six months new technology arrives — and every six months new courses follow it.',
        ],
        callout: "Sounds like a lecture? If it does, maybe you haven't noticed how fast the world has changed.",
        closing: 'Building an independent career in less time using the latest technology — that is what Jovoc Academy exists for.',
        cta: 'See the course curricula',
    },
    founder: {
        badge: "Founder's note",
        headline: "Hello. I'm Partho, the founder of Jovoc.",
        paragraphs: [
            'I finished HSC in 2012 and joined the University of Dhaka in 2013, studying Electrical and Electronic Engineering. I started my working life as a software engineer instead.',
            'I did not enjoy employment at all. So I started my own small software business. Today I work as a freelance software engineer, building software for business owners in Bangladesh, the United States, and elsewhere.',
            'Because of AI, a lot of work now takes a fraction of the time it used to. Many professions still expect a full day at the office. Most of my work, I can hand to AI.',
        ],
        pullquote: 'Think about it — AI is already here, so why are you still working all day?',
        closing:
            'How to use AI to cut the work and raise the income is what I research, continuously. And I am sharing the results of that research, step by step, through Jovoc Academy.',
        signature: '— Partho, Founder, Jovoc',
    },
    mentors: {
        badge: 'For mentors',
        headline: 'Teach once. Keep helping learners long after.',
        lead: 'What you have learned working in the industry is what becomes the curriculum here.',
        benefits: [
            {
                icon: 'broadcast',
                headline: 'Your knowledge reaches learners at any time',
                body: 'You write your lesson once. A learner reads it at night after work. You do not need to repeat yourself. You focus on making the lesson excellent. The platform handles everything else.',
            },
            {
                icon: 'checksquare',
                headline: 'Your grading standard stays consistent at any scale',
                body: 'You write the rubric — the rules for a good answer. The AI grades every open-ended answer against your rules. Simple tests never reach you. Only the assignments that need your judgment come to you.',
            },
            {
                icon: 'award',
                headline: 'Your endorsement has real value',
                body: "When you approve a learner's assignment, your name is attached to their portfolio permanently. You do not approve automatically — you read the work and decide. Learners know this, so they work harder.",
            },
            {
                icon: 'message',
                headline: 'Learners get help even when you are offline',
                body: 'AI members in the community forum answer course questions when you are not available. The questions that need a real expert still come to you — but you are no longer the only source of help.',
            },
        ],
    },
};

const COPY: Record<string, AboutCopy> = { bn, en };

export function aboutCopy(locale: string): AboutCopy {
    return COPY[locale] ?? bn;
}
