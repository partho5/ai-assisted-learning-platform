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
            'প্রচলিত শিক্ষাব্যবস্থা কেন কাজ করছে না, আর Jovoc Academy কীভাবে অন্যরকমভাবে কাজ করে — মুখস্থবিদ্যা নয়, বাস্তব আউটপুট দিয়েই যোগ্যতা মাপার গল্প।',
    },
    nameNote:
        'নামটা এমনি এমনি বেছে নিইনি। শুধু একটা পেশা না — এমন একটা পেশা, যেটা করলে মনে শান্তি পাবেন।',
    problem: {
        badge: 'আমাদের অবস্থান',
        headline: 'প্রচলিত শিক্ষাব্যবস্থা ভাঙা। এটা সবাই জানে।',
        paragraphs: [
            'আমাদের শিক্ষাব্যবস্থা যে কতটা ভাঙা, সেটা নতুন করে বলার কিছু নেই — সবাই এটা জানে। এখানে সবচেয়ে বেশি গুরুত্ব পায় মুখস্থবিদ্যা। বাস্তব জীবনের সঙ্গে এই শিক্ষার সম্পর্ক খুবই কম।',
            '১৮–২০ বছর পড়াশোনা শেষ করার পরও দেখা যায়, মার্কেটে আপনার কোনো ভ্যালুই নেই। ফলে আবার নতুন করে চাকরির জন্য প্রস্তুতি নিতে হয়। তারপরও চাকরি হয় হাতে গোনা কয়েকজনের।',
            'অনেক সময় দেখবেন, পরীক্ষার জন্য মুখস্থ করে ভালো লিখতে পারলেই চাকরি হয়ে যায়। অথচ বাস্তবে — ধরুন উপজেলা পরিষদে কোনো সেবা নিতে গেলেন — সেখানকার একজন কর্মকর্তার কাজকর্ম দেখে মনে হয়, এত অদক্ষ একজন মানুষ চাকরিটা পেল কী করে!',
        ],
        pullquote: 'দোষটা কিন্তু ওই মানুষটার না। দোষ পুরো শিক্ষাব্যবস্থা আর সিস্টেমের।',
    },
    answer: {
        badge: 'আমাদের উত্তর',
        headline: 'Jovoc Academy-র শিক্ষাব্যবস্থা ঠিক যেমনটা হওয়া উচিত, তেমনই।',
        lead: 'এখানে মুখস্থবিদ্যার কোনো দাম নেই। বাস্তবে কে কতটা আউটপুট দিতে পারছেন, সেটাই যোগ্যতার আসল মাপকাঠি।',
        benefits: [
            {
                icon: 'book',
                headline: 'কারিকুলাম সাজানো হয় আউটপুট দেখে, সিলেবাস দেখে না',
                body: 'প্রতিটা কোর্স বানানো হয়েছে ধাপে ধাপে। প্রতিটা লেসন আপনাকে তৈরি করে পরের লেসনের জন্য। শেষে গিয়ে আপনার হাতে এমন কিছু থাকবে যেটা আপনি নিজে বানাতে পারেন — শুধু যা পড়লেন, শুনলেন, তা না।',
            },
            {
                icon: 'zap',
                headline: 'উত্তর মেলে সেকেন্ডেই, দিনের পর দিন বসে থাকতে হয় না',
                body: 'উত্তর লিখুন, সাবমিট করে দিন। কয়েক সেকেন্ডের মধ্যেই স্কোর আর কারণ — দুটোই সামনে চলে আসবে। AI আপনার উত্তর যাচাই করে মেন্টরের ঠিক করে দেওয়া স্ট্যান্ডার্ড অনুযায়ী। আর যেখানে সত্যিই একজন মানুষের চোখ দরকার, সেটা মেন্টর নিজেই দেখেন। ফলে আপনি সবসময় জানেন, ঠিক কোথায় দাঁড়িয়ে আছেন।',
            },
            {
                icon: 'bot',
                headline: 'AI টিউটর আপনার কোর্সটা চেনে',
                body: 'আপনি কোন কোর্সে আছেন, কতদূর এগিয়েছেন, এইমাত্র কী পড়লেন — সবই জানে সে। রাত ৩টায় প্রশ্ন করলেও উত্তর আসবে আপনার কোর্সের ম্যাটেরিয়াল থেকেই, এলোমেলো ইন্টারনেট ঘেঁটে না। কোথাও আটকে গেলে হিন্ট দেয়, না বুঝলে আবার বুঝিয়ে দেয়।',
            },
            {
                icon: 'idcard',
                headline: 'যা শিখলেন, তার প্রমাণ পাবলিক থাকে',
                body: 'কোর্স শেষ করলে সেটা চলে যায় আপনার পাবলিক প্রোফাইলে — আপনার নামের একটা রিয়েল ওয়েব অ্যাড্রেসে। মেন্টর আপনার কাজ দেখে অ্যাপ্রুভ করলে সেই অ্যাপ্রুভালটা স্থায়ীভাবেই থেকে যায়। এটা ঘরে বসে প্রিন্ট করা কোনো সার্টিফিকেট না। লিংকটা এমপ্লয়ারকে পাঠান, ক্লায়েন্টকে পাঠান — নিজেই যাচাই করে নিক।',
            },
            {
                icon: 'eye',
                headline: 'টাকা দেওয়ার আগেই যাচাই করে নিন',
                body: 'ফ্রি লেসনগুলো সবার জন্য খোলা। অ্যাকাউন্ট লাগে না পর্যন্ত। পড়ে দেখুন, তারপর নিজেই ঠিক করুন — কোয়ালিটি আপনার টাকা খরচ করার যোগ্য কি না। মন সায় দিলে এনরোল করে বাকি সব আনলক করে নিন — অ্যাসেসমেন্ট, প্রোগ্রেস, পোর্টফোলিও, সবকিছু।',
            },
            {
                icon: 'refresh',
                headline: 'প্রতি ৬ মাসে কারিকুলাম নতুন হয়',
                body: 'নতুন টেকনোলজি এলেই নতুন কোর্স যোগ হয়ে যায়। ৩ বছর আগের রেকর্ড করা ভিডিও দিয়ে আজকের মার্কেটে চলে না — এটা আমরা জানি বলেই পুরনো জিনিস আঁকড়ে ধরে বসে থাকি না।',
            },
        ],
    },
    timeline: {
        badge: 'সময়ের হিসাব',
        headline: '২০ বছর নয়। মাত্র ২ বছর।',
        paragraphs: [
            'মাত্র ২ বছর সময় দিলেই এমন একটা দক্ষতা অর্জন করা যায়, যেটা দিয়ে অনেক প্রচলিত চাকরির চেয়েও বেশি আয় করা সম্ভব।',
            'Jovoc Academy-তে জয়েন করতে কোনো টাকাই লাগবে না। আগে শুধু কোর্স কারিকুলামগুলো একবার ঘুরে দেখুন। সবকিছুই সর্বশেষ প্রযুক্তি অনুযায়ী আপডেটেড। ছয় মাস পরপর নতুন প্রযুক্তি এলে, ছয় মাস পরপরই নতুন কোর্স যোগ হবে।',
        ],
        callout: 'শুনতে কি একটু লেকচারের মতো লাগছে? যদি লাগে, তাহলে বলব — হয়তো এখনো ঠিকমতো বুঝে উঠতে পারেননি, পৃথিবীটা কত দ্রুত বদলে যাচ্ছে।',
        closing: 'লেটেস্ট টেকনোলজি কাজে লাগিয়ে কম সময়ে, স্বাধীনভাবে নিজের একটা পেশা গড়ে তোলা — এটাই Jovoc Academy-র লক্ষ্য।',
        cta: 'কোর্স কারিকুলাম দেখুন',
    },
    founder: {
        badge: 'ফাউন্ডারের কথা',
        headline: 'হ্যালো, আমি পার্থ, Jovoc-এর ফাউন্ডার।',
        paragraphs: [
            '২০১২ সালে এইচএসসি পাশ করি, তারপর ২০১৩ সালে ভর্তি হই ঢাকা বিশ্ববিদ্যালয়ে। পড়াশোনা করেছি ইলেকট্রিক্যাল অ্যান্ড ইলেকট্রনিক ইঞ্জিনিয়ারিং নিয়ে। কিন্তু কর্মজীবন শুরু করি সফটওয়্যার ইঞ্জিনিয়ার হিসেবে।',
            'চাকরি জীবনটা আমার একদমই ভালো লাগেনি। তাই ছোট পরিসরে শুরু করি নিজের একটা সফটওয়্যার বিজনেস। এখন ফ্রিল্যান্স সফটওয়্যার ইঞ্জিনিয়ার হিসেবে বাংলাদেশ, আমেরিকাসহ বিভিন্ন দেশের ব্যবসায়ীদের জন্য সফটওয়্যার বানাই।',
            'AI আসার পর থেকে অনেক কাজই এখন আগের চেয়ে অনেক কম সময়ে করা যায়। অন্য অনেক পেশায় যেখানে এখনো সারাদিন অফিসে বসে থাকতে হয়, সেখানে আমি আমার বেশিরভাগ কাজ AI দিয়েই করিয়ে নিই।',
        ],
        pullquote: 'একটু ভেবে দেখুন তো — AI চলে আসার পরও কেন সারাদিন খেটে যাবেন?',
        closing:
            'AI ব্যবহার করে কীভাবে কাজ কমিয়ে আয় বাড়ানো যায় — এটা নিয়েই আমি নিয়মিত ঘাঁটাঘাঁটি করি, গবেষণা করি। আর সেই গবেষণার ফলাফলগুলো নিয়মিত সবার সঙ্গে শেয়ার করছি Jovoc Academy-র মাধ্যমে।',
        signature: '— পার্থ, ফাউন্ডার, Jovoc',
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
