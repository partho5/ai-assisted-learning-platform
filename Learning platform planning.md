# [**SkillEvidence.com**](http://SkillEvidence.com)

Implement features one at a time — never implement multiple features simultaneously.

Each module/part must:  
\- Work standalone (can be developed and tested independently)  
\- Integrate consistently with existing parts via clear interfaces/contracts

After completing each part, update \`\_\_dev-progress.md\` with:  
\- \[x\] Part name — minimum yet valuable status note  
\- \[ \] Next part — brief intent

Keep \_\_dev-progress.md minimal. No verbose descriptions. It's a progress tracker, not documentation.

Ask for confirmation before starting a new part if the previous part's scope expanded.

# ---

## **CORE USER ROLES**

1. **Admin** \- Platform owner, quality controller  
2. **Mentor** (Course curator) \- Assembles best resources, guides learners  
3. **Learner** (Paid subscriber/ Free observer) \- Follows curated paths, builds evidence

---

## **ESSENTIAL FEATURES ONLY**

Navbar in master layout. One for admin , another for user panel.  
I18n multi language support and changing option in user view and public view. Search with two languages En bn in url for SEO. Option to add others future.

### **1\. Authentication & Payments (CRITICAL)**

* Email/password registration \+ login  
* Role selection: Mentor or Learner  
* Paid tier and course completion percent check before course access, because some percent ,set by the admin, of every course is free to access.  
* Payment will be handled later  
* System doesn't check payment status, but system check tier, which is set upon payment or other other means controlled by the super admin/owners.  
* Basic profile: Name, photo, short bio

### **2\. Course Curation System (Mentor)**

**Course Creation:**

* Title, description, category/domain, what this course contains, what learner will achieve after completing, Prerequisites (text field)  
* Difficulty level (Beginner/Intermediate/Advanced)  
* Expected completion time  
* Course thumbnail  
* Draft/Published toggle

**Course Structure:**

Course  
  └─ Modules (Sections)  
      └─ Resources (Lessons)

**Resource Types:**

* **External Video** \- any of YouTube/Vimeo URL (auto-embed)  
* **External Article/Tutorial** \- Any URL with title  
* **Text Content** \- Rich text editor (for mentor's notes/summaries)  
* **Document** \- Upload PDF/DOCX or link to Google Docs  
* **Audio** \- Upload MP3 or link to podcast  
* **Image/Infographic** \- Upload or external URL  
* **Assignment/Exercise** \- this module will be like Google forms. All input types except grid ones. Like Google forms every question can have optional image set by the question creator.  While setting questions right answer can be set , direct option match or greater  equal less than equal match for suitable input type, and also an option use LLM that case no logic based assessment but AI prompt will access the result and return JSON and parsing that will get the scoring and the explanation about the scoring and the accuracy or whatever comment ai gives.  
* Tiere 2 or higher will be able to get ai  help while solving or practicing, I help button will be right beside the question . Admin will set or restrict which questions can have ai help or not.

**Key Feature \- Resource Metadata:** Each resource has:

* Title  
* Type (video, article, document, etc.)  
* Source (YouTube, Medium, official docs, etc.)  
* Estimated time (e.g., "15 min video", "30 min read")  
* Mentor's note optional (why this resource, what to focus on)

**Why This Resource?** (Mandatory field)

* Mentor must explain why this specific resource is chosen  
* "This is the clearest explanation of X concept"  
* "Industry standard tutorial used by Google developers"  
* This builds trust

### **3\. Course Discovery & Enrollment (Learner)**

**Browse Courses:**

* Grid/list view of published courses  
* Filter by category, difficulty  
* Search by keyword ,powerful searching system  
* Course card shows: Thumbnail, title, mentor name, duration, resource count…

**Course Detail Page:**

* Full description  
* Mentor profile (name, bio, photo, expertise)  
* Complete curriculum visible (modules \+ all resources listed)  
* "Why this resource?" notes visible for each item  
* Total estimated time  
* Enroll button (only for logged in user greater than tier 1,the free tier)

**Enrollment:**

* One-click enroll (if logged in)  
* Redirects to payment if not subscribed  
* Learner can enroll in unlimited courses (subscription benefit)

\*\*Actually I want your recommendation how should manage enrollment for e-Learning platform higher non paid users also can be observer but cannot interact . Where paid users can ask question get help from mentor and AI both and can access full courses. Definitely can see the conversation even for inaccessible ( say last 60%) classes of the course, so they feel the necessity to purchase.\*\*

### **4\. Learning Experience (Learner)**

**Course Dashboard:**

* Left sidebar: Module/resource navigation tree  
* Main area: Current resource display  
* Progress indicator (X of Y resources completed)

**Resource Display Logic:**

* **External video**: Embedded iframe (YouTube/Vimeo)  
* **External link**: Opens in new tab OR iframe if embeddable  
* **Text content**: Display formatted text  
* **Document**: Embedded viewer (Google Docs viewer API) or download link  
* **Audio**: HTML5 audio player or external link  
* **Image**: Display inline but responsive for all display size.  
* **Assignment**: Show prompt \+ text submission area

For every resource they are will be self test.

**Completion Mechanism:**

* Each resource will have a completion criteria, but like traditional platform ,learner doesn't have the right to Mark as complete. He gives test , then mentor marks that resource is complete seeing score.  
* Wait learner can mark as complete only after mentor marks as endorsed seeing the progress or score. So in this platform we call it endorsement.  
* Completed resources get checkmark ✓  
* Progress bar updates automatically

### **5\. Learning Footprint Tracking (THE DIFFERENTIATOR)**

**What Gets Tracked:**

**A. Resource Completion Log**

* Resource ID, title, type  
* Completed timestamp  
* Time between enrollment and completion (session duration estimate)

**B. Assignment Submissions**

* All submissions saved with timestamp  
* Multiple submissions \= multiple versions tracked  
* Shows revision history  
* Start time end time total time taken, for each question Takken time saved in database.

 Micro level tracking will be here, but you suggest me is it worth it if we want to extract learning DNA.

**C. Study Sessions**

* Login/logout timestamps  
* Total time on platform per day  
* Active days count  
* Learning streak (consecutive days)

**D. Course Progress Timeline**

* Visual timeline showing when each resource was completed  
* Gaps visible (shows if someone rushed or took time)

**E. Pattern Recognition (Simple)**

* Total hours invested  
* Completion rate (enrolled vs finished)  
* Average time per resource type  
* Most active learning time (morning/afternoon/evening)

**Footprint Dashboard (Learner Private View):**

* Calendar heatmap (GitHub-style) \- active days  
* Progress bars for each enrolled course  
* Total learning hours  
* Completion statistics  
* Current streak

### **6\. Public Evidence Portfolio (CRITICAL FOR MONETIZATION)**

**Public Profile URL:** `skillevidence.com/u/username`

**Visible to Anyone (No login required):**

* Learner name, photo, headline  
* "Learning Since \[date\]" badge  
* Total courses completed  
* Total learning hours invested  
* Current learning streak

**Completed Courses Section:** Each course shows:

* Course title \+ mentor name  
* Completion date  
* Time invested in this course  
* Assignment submissions (viewable)  
* Certificate of completion (auto-generated PDF)

**Learning Journey Timeline:**

* \*Chronological view of all completed resources\* what was mistaken, the way of thinking the way of problem solving, how time needed everything can we generated in future inside dashboard, such kind of information must be recorded.  
* "Started Course X on \[date\]"  
* "Completed Module Y on \[date\]"  
* Shows dedication over time

**Assignment Showcase:**

* Learner can feature best 3-5 assignments  
* Full submission visible  
* Shows problem-solving ability

**Stats Widget:**

* Total hours: XXX  
* Courses completed: XX  
* Active days: XXX  
* Current streak: XX days

**Share Features:**

* Copy link button  
* Download portfolio as PDF  
* QR code for resume

**Privacy Toggle:**

* Public (searchable, anyone can view)  
* Unlisted (only with direct link)  
* Private (only learner can see)

### **7\. Certificates (Auto-Generated)**

**Upon Course Completion:**

* PDF certificate auto-generated  
* Contains:  
  * Learner name  
  * Course title  
  * Completion date  
  * Mentor name \+ signature  
  * Total hours invested (from footprint data)  
  * Unique verification ID  
  * QR code linking to public portfolio  
  * SkillEvidence logo \+ branding

**Why This Matters:**

* Proof of completion  
* Hours invested makes it credible (not just a participation trophy)  
* QR code allows employers to verify \+ see actual work

### **8\. Mentor Dashboard (Simplified)**

**Overview Stats:**

* Total courses created  
* Total enrollments across all courses  
* Active learners this week  
* Course completion rates

**Course Management:**

* List of all courses (draft/published)  
* Quick edit access  
* View enrollments per course  
* Duplicate course feature (for creating similar courses faster)

**Learner Insights (Per Course):**

* Who's enrolled  
* Who's completed  
* Average completion time  
* Which resources have lowest completion (needs improvement)

### **9\. Admin Panel** 

**Dashboard:**

* Total revenue (MRR \- Monthly Recurring Revenue)  
* Active subscriptions  
* Churn rate  
* Total courses published  
* Total learners/mentors

**User Management:**

* View all users (filter by role)  
* Manually activate/deactivate accounts  
* Grant/revoke mentor privileges  
* Refund handling

**Course Quality Control:**

* Review all courses before publication  
* Approve/reject new courses  
* Feature courses on homepage  
* Category management

**Analytics:**

* Most popular courses  
* Learner engagement metrics

**Content Moderation:**

* Flag inappropriate content  
* Remove spam assignments  
* Monitor reported issues

\#user: simple inbox messaging inside the platform users. notifications like typical social media but simple. Read marked and clear message and notification count.

Plug-and-play Modularity enough for Future add: example adding admission test for enrolling a course.

Or Interesting feature: like in x ,user can mention grok, in this platform @jovoc AI can be mentioned while problem solving or for any questions related to the platform, faq, customer support etc. but role of jovoc is like creating a soft sense like he is wise person handling everything.

---

**Tech Stack & Architecture:** Laravel \+ React \+ Inertia.js (SSR-first for SEO), TypeScript, Tailwind CSS. Do NOT over-engineer architecture — but keep it maintainable, scalable, and respect SRP.

**SEO & URLs:** Everything must be SEO-friendly. Use meaningful slugs (e.g. `/mentor/category/course-title`) instead of numeric IDs. Do not force slugs if a unique identifier is genuinely essential — use a hybrid (e.g. `course-title-a3f2`). All public pages must have proper SEO structure: meta tags, Open Graph, structured data/schema (Article, Course, BreadcrumbList, etc.) as contextually appropriate. Auto-generate and update sitemap whenever a new publicly accessible page/route is created.

**Security:** Enforce security best practices throughout. Both client-side and server-side validation are mandatory — never rely on one alone. Apply OWASP-aligned practices: CSRF protection, input sanitization, auth guards, rate limiting, etc.

**Media & File Handling:** All image/file upload, download, transformation, and URL mapping goes through a dedicated media module — fully abstracted from the rest of the app. This module must support swappable providers (Cloudinary, ImageKit, S3, etc.) and multiple accounts per provider in future. Start with a single Cloudinary API key. No media logic bleeds outside this module.

**Design System:**

* No emojis anywhere in UI.  
* Light and dark themes — both must feel premium, not just inverted.  
* Colorful but restrained — sophisticated, not garish. Define a brand color config; all design tokens derive from it. No hardcoded colors outside the config.  
* All interactive components (buttons, cards, links, inputs) must have subtle hover/click animations. Hover/active state goes darker, never lighter. Readability must never be compromised.  
* Mobile padding is intentionally tighter than desktop (e.g. 2px–4px contextually) so content breathes without feeling cramped on small screens.

**Consultation Rule:** When any part feels ambiguous, architecturally risky, or has a clear opportunity for better business/psychological impact — stop and consult before proceeding. Propose your thinking; don't silently make a call.

---

**Discussion Feature — Consult Before Implementing:**

Before building the discussion/forum feature, align on this:

Course-specific discussion (threaded under a lesson/course) and a standalone public forum serve fundamentally different purposes. The question isn't which feature to build — it's which *credibility model* you're building toward.

Reddit's power isn't features. It's that content is permanent, public, indexed, and reputation is earned through contribution — not just enrollment. A discussion system that's SEO-optimized, publicly readable without login, organized by topic/course rather than subreddit-style communities, and where quality rises through engagement signals — that could be genuinely differentiated in the edtech space.

**Recommendation:** Treat discussion as a first-class public content type (not a course add-on). Each thread/post gets its own URL, schema markup (DiscussionForumPosting), and sitemap entry. Keep it simple structurally — topic \+ replies \+ votes — but treat SEO and public visibility as non-negotiable from day one.

**Consult before starting this module.** The architecture decision here has long-term SEO and community compounding effects.

---

