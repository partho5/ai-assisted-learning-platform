<?php

namespace Database\Seeders;

use App\Enums\CourseDifficulty;
use App\Enums\CourseStatus;
use App\Enums\ResourceType;
use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Course;
use App\Models\Module;
use App\Models\Resource;
use App\Models\User;
use Illuminate\Database\Seeder;

class CourseSeeder extends Seeder
{
    public function run(): void
    {
        $mentor = User::firstOrCreate(
            ['email' => 'mentor@example.com'],
            [
                'name' => 'Alex Morgan',
                'username' => 'alexmorgan',
                'password' => bcrypt('password'),
                'role' => UserRole::Mentor,
                'email_verified_at' => now(),
            ]
        );

        $courses = [
            [
                'category' => 'web-development',
                'title' => 'Full-Stack Web Development with Laravel & React',
                'slug' => 'full-stack-laravel-react',
                'description' => 'A comprehensive course covering modern full-stack development. You will build production-ready applications from scratch using Laravel for the backend API and React with TypeScript on the frontend. By the end, you will have deployed a real-world SPA.',
                'what_you_will_learn' => 'Build REST APIs with Laravel. Create dynamic SPAs with React and TypeScript. Authenticate users with Sanctum. Deploy to production using a cloud provider.',
                'prerequisites' => 'Basic knowledge of HTML, CSS, and PHP.',
                'difficulty' => CourseDifficulty::Intermediate,
                'estimated_duration' => 480,
                'is_featured' => true,
                'status' => CourseStatus::Published,
                'modules' => [
                    [
                        'title' => 'Getting Started',
                        'description' => 'Set up your environment and understand the project structure.',
                        'resources' => [
                            [
                                'title' => 'What is Full-Stack Development?',
                                'type' => ResourceType::Text,
                                'is_free' => true,
                                'estimated_time' => 10,
                                'why_this_resource' => 'Establishes the mental model for the whole course.',
                                'content' => <<<'HTML'
<h2>What is Full-Stack Development?</h2>
<p>Full-stack development refers to the practice of working on <strong>both the frontend</strong> (what users see) and <strong>the backend</strong> (the server, database, and application logic) of a web application.</p>

<h3>The Two Layers</h3>
<ul>
  <li><strong>Frontend</strong> — HTML, CSS, JavaScript, and frameworks like React. Responsible for user interface and experience.</li>
  <li><strong>Backend</strong> — PHP, Python, Node.js, etc. Responsible for business logic, data storage, and authentication.</li>
</ul>

<h3>Why Learn Both?</h3>
<p>Understanding the full stack makes you a <em>more versatile engineer</em>. You can:</p>
<ol>
  <li>Prototype faster without waiting on another team</li>
  <li>Debug across the entire application</li>
  <li>Make better architectural decisions</li>
</ol>

<h3>Our Stack in This Course</h3>
<p>We use <strong>Laravel</strong> as our backend framework (PHP) and <strong>React with TypeScript</strong> on the frontend, connected via <strong>Inertia.js</strong> — which eliminates the need for a separate API during development while retaining SPA behavior.</p>

<blockquote>
  <p>"The best full-stack developers understand that frontend and backend are two sides of the same coin." — Senior Engineers everywhere</p>
</blockquote>
HTML,
                            ],
                            [
                                'title' => 'Setting Up Your Development Environment',
                                'type' => ResourceType::Video,
                                'url' => 'https://www.youtube.com/watch?v=MFh0Fd7BsjE',
                                'source' => 'YouTube',
                                'is_free' => true,
                                'estimated_time' => 20,
                                'why_this_resource' => 'Every developer needs a reproducible local environment.',
                                'mentor_note' => 'If you are on Windows, use WSL2 — it makes the experience much smoother.',
                            ],
                            [
                                'title' => 'Laravel Official Documentation Overview',
                                'type' => ResourceType::Article,
                                'url' => 'https://laravel.com/docs',
                                'source' => 'Official Docs',
                                'is_free' => true,
                                'estimated_time' => 15,
                                'why_this_resource' => 'The official docs are the best reference you will ever have. Learn to navigate them early.',
                            ],
                        ],
                    ],
                    [
                        'title' => 'Laravel Backend Fundamentals',
                        'description' => 'Models, migrations, routing, and building your first API.',
                        'resources' => [
                            [
                                'title' => 'Understanding MVC Architecture',
                                'type' => ResourceType::Text,
                                'is_free' => false,
                                'estimated_time' => 12,
                                'why_this_resource' => 'MVC is the backbone of Laravel — this reading locks in the concept before we code.',
                                'content' => <<<'HTML'
<h2>Understanding MVC Architecture</h2>
<p><strong>Model-View-Controller (MVC)</strong> is a software design pattern that separates an application into three interconnected components. Laravel is built around this pattern.</p>

<h3>The Three Components</h3>
<h4>Model</h4>
<p>The Model represents your <strong>data and business logic</strong>. In Laravel, models are Eloquent classes that interact with the database. A <code>User</code> model, for example, maps to the <code>users</code> table.</p>

<h4>View</h4>
<p>The View is everything the user <strong>sees and interacts with</strong>. In a traditional Laravel app this is a Blade template; in our stack, it's a React component rendered by Inertia.</p>

<h4>Controller</h4>
<p>The Controller acts as the <strong>glue</strong> between Model and View. It receives HTTP requests, asks the Model for data, and returns a response (often an Inertia page with props).</p>

<h3>Request Lifecycle in Laravel + Inertia</h3>
<ol>
  <li>Browser sends a request to <code>/posts</code></li>
  <li>Laravel router dispatches to <code>PostController@index</code></li>
  <li>Controller queries <code>Post::query()->paginate()</code> (Model)</li>
  <li>Controller returns <code>Inertia::render('Posts/Index', ['posts' => $posts])</code></li>
  <li>React renders the <code>Posts/Index</code> component with the provided props</li>
</ol>

<h3>Why MVC Matters</h3>
<p>Separation of concerns means each layer can be <em>tested, modified, and scaled</em> independently. A design change in the View shouldn't require touching the Model.</p>
HTML,
                            ],
                            [
                                'title' => 'Building Your First Laravel API',
                                'type' => ResourceType::Video,
                                'url' => 'https://www.youtube.com/watch?v=YGqCZjdgJJk',
                                'source' => 'YouTube',
                                'is_free' => false,
                                'estimated_time' => 35,
                                'why_this_resource' => 'Hands-on video walkthrough of controllers, routes, and JSON responses.',
                            ],
                            [
                                'title' => 'Build a REST API Endpoint',
                                'type' => ResourceType::Assignment,
                                'is_free' => false,
                                'estimated_time' => 60,
                                'why_this_resource' => 'Application solidifies understanding better than watching alone.',
                                'content' => <<<'HTML'
<h2>Assignment: Build a REST API Endpoint</h2>
<p>In this assignment you will create a fully working CRUD API for a <code>Task</code> resource in Laravel.</p>

<h3>Requirements</h3>
<ul>
  <li>Create a <code>Task</code> model with a migration (<code>title</code>, <code>description</code>, <code>completed</code>, timestamps)</li>
  <li>Create a <code>TaskController</code> with <code>index</code>, <code>store</code>, <code>show</code>, <code>update</code>, and <code>destroy</code> methods</li>
  <li>Register API routes in <code>routes/api.php</code></li>
  <li>Return proper JSON responses with correct HTTP status codes</li>
  <li>Validate incoming requests using a Form Request class</li>
</ul>

<h3>Submission</h3>
<p>Submit a GitHub link to your repository. Include a <code>README.md</code> with instructions for running the project locally and sample <code>curl</code> commands for each endpoint.</p>

<h3>Grading Criteria</h3>
<ol>
  <li>All five endpoints are functional</li>
  <li>Validation is in place and returns <code>422</code> on invalid input</li>
  <li>Code follows PSR-12 and Laravel conventions</li>
</ol>
HTML,
                            ],
                        ],
                    ],
                    [
                        'title' => 'React Frontend Integration',
                        'description' => 'Connect your Laravel backend to a React + TypeScript frontend with Inertia.',
                        'resources' => [
                            [
                                'title' => 'React & TypeScript Crash Course',
                                'type' => ResourceType::Video,
                                'url' => 'https://www.youtube.com/watch?v=TPACABQTHvM',
                                'source' => 'YouTube',
                                'is_free' => false,
                                'estimated_time' => 45,
                                'why_this_resource' => 'Gets you up to speed on React with TypeScript before we connect it to Laravel.',
                            ],
                            [
                                'title' => 'State Management Patterns in React',
                                'type' => ResourceType::Text,
                                'is_free' => false,
                                'estimated_time' => 15,
                                'why_this_resource' => 'Choosing the right state solution prevents technical debt down the line.',
                                'content' => <<<'HTML'
<h2>State Management Patterns in React</h2>
<p>One of the most debated topics in React development is where to put your state. Here are the four main options, from simplest to most complex.</p>

<h3>1. Local Component State (<code>useState</code>)</h3>
<p>Best for state that <strong>only affects a single component</strong> — form inputs, toggle visibility, loading indicators.</p>
<pre><code>const [isOpen, setIsOpen] = useState(false);</code></pre>

<h3>2. Lifted State</h3>
<p>When two sibling components need to share state, <strong>lift it to their nearest common ancestor</strong>. Pass it down via props. Simple, but gets unwieldy with deeply nested trees.</p>

<h3>3. React Context</h3>
<p>Good for <strong>global, rarely-changing data</strong> — theme, locale, current user. Avoid using Context for high-frequency updates as it re-renders all consumers.</p>

<h3>4. External Store (Zustand, Redux)</h3>
<p>For <strong>complex client-side state</strong> that needs fine-grained subscriptions. In our Inertia-based stack, the server is the source of truth, so you will rarely need this — Inertia props handle most of it.</p>

<h3>The Inertia Approach</h3>
<p>Because Inertia renders server-driven props on each page visit, most of your state lives on the server. Use <code>useForm</code> from Inertia for form state and <code>router.visit()</code> for navigation-triggered data fetches. This dramatically reduces the amount of client-side state you need to manage.</p>
HTML,
                            ],
                            [
                                'title' => 'Build a Dynamic Task Manager UI',
                                'type' => ResourceType::Assignment,
                                'is_free' => false,
                                'estimated_time' => 90,
                                'why_this_resource' => 'Synthesises everything from this module into a real feature.',
                                'content' => <<<'HTML'
<h2>Assignment: Build a Dynamic Task Manager UI</h2>
<p>Connect a React frontend to the Task API you built in the previous module using Inertia.js.</p>

<h3>Requirements</h3>
<ul>
  <li>List all tasks on a <code>/tasks</code> page with pagination</li>
  <li>Add a form to create a new task without a full page reload</li>
  <li>Allow inline editing of a task's <code>completed</code> status (checkbox)</li>
  <li>Allow deleting a task with a confirmation dialog</li>
  <li>Show validation errors inline below each field</li>
</ul>

<h3>Bonus</h3>
<p>Add optimistic UI updates so the task list responds instantly before the server confirms.</p>
HTML,
                            ],
                        ],
                    ],
                ],
            ],

            [
                'category' => 'data-science',
                'title' => 'Python for Data Science: From Zero to Analysis',
                'slug' => 'python-data-science-zero-to-analysis',
                'description' => 'Learn to analyse real-world datasets using Python, Pandas, NumPy, and Matplotlib. No prior data science experience needed — just basic Python familiarity. By the end you will complete a full exploratory data analysis project.',
                'what_you_will_learn' => 'Manipulate data with Pandas DataFrames. Visualise distributions, trends, and correlations. Clean messy real-world data. Present findings in a Jupyter notebook.',
                'prerequisites' => 'Basic Python syntax (variables, loops, functions).',
                'difficulty' => CourseDifficulty::Beginner,
                'estimated_duration' => 300,
                'is_featured' => true,
                'status' => CourseStatus::Published,
                'modules' => [
                    [
                        'title' => 'Python Data Science Toolkit',
                        'description' => 'Get comfortable with NumPy, Pandas, and Jupyter.',
                        'resources' => [
                            [
                                'title' => 'Why Python Dominates Data Science',
                                'type' => ResourceType::Text,
                                'is_free' => true,
                                'estimated_time' => 8,
                                'why_this_resource' => 'Understanding the ecosystem helps you make better tool choices.',
                                'content' => <<<'HTML'
<h2>Why Python Dominates Data Science</h2>
<p>Python has become the <strong>lingua franca of data science</strong>. Here's why it won over alternatives like R, MATLAB, and Julia.</p>

<h3>The Ecosystem</h3>
<p>Python's data science ecosystem is unmatched:</p>
<ul>
  <li><strong>NumPy</strong> — fast n-dimensional arrays, the foundation of everything</li>
  <li><strong>Pandas</strong> — labelled tabular data (DataFrames), inspired by R</li>
  <li><strong>Matplotlib / Seaborn</strong> — static visualisations</li>
  <li><strong>Scikit-learn</strong> — machine learning in three lines of code</li>
  <li><strong>Jupyter</strong> — interactive, reproducible notebooks loved by researchers</li>
</ul>

<h3>Readability</h3>
<p>Python's clean syntax means you can express complex ideas concisely. Compare filtering a DataFrame:</p>
<pre><code>df[df['salary'] > 100_000]</code></pre>
<p>to the equivalent SQL or R code — Python wins on clarity.</p>

<h3>Community &amp; Jobs</h3>
<p>The Python data science community is enormous. Stack Overflow surveys consistently show it as the top language for data professionals, and job boards reflect this with the highest number of data roles requiring Python.</p>
HTML,
                            ],
                            [
                                'title' => 'NumPy & Pandas in 30 Minutes',
                                'type' => ResourceType::Video,
                                'url' => 'https://www.youtube.com/watch?v=vmEHCJofslg',
                                'source' => 'YouTube',
                                'is_free' => true,
                                'estimated_time' => 32,
                                'why_this_resource' => 'The fastest way to get productive with both libraries simultaneously.',
                                'mentor_note' => 'Code along in a Jupyter notebook as you watch — do not just watch passively.',
                            ],
                            [
                                'title' => 'Pandas Cheat Sheet',
                                'type' => ResourceType::Article,
                                'url' => 'https://pandas.pydata.org/Pandas_Cheat_Sheet.pdf',
                                'source' => 'Official Docs',
                                'is_free' => true,
                                'estimated_time' => 10,
                                'why_this_resource' => 'Keep this open whenever you are working with DataFrames.',
                            ],
                        ],
                    ],
                    [
                        'title' => 'Data Visualisation',
                        'description' => 'Tell stories with your data using charts and plots.',
                        'resources' => [
                            [
                                'title' => 'Matplotlib & Seaborn Deep Dive',
                                'type' => ResourceType::Video,
                                'url' => 'https://www.youtube.com/watch?v=a9UrKTVEeZA',
                                'source' => 'YouTube',
                                'is_free' => false,
                                'estimated_time' => 40,
                                'why_this_resource' => 'Side-by-side comparison of both libraries shows when to use each.',
                            ],
                            [
                                'title' => 'Choosing the Right Chart for Your Data',
                                'type' => ResourceType::Text,
                                'is_free' => false,
                                'estimated_time' => 12,
                                'why_this_resource' => 'The wrong chart type can mislead your audience — or hide the insight entirely.',
                                'content' => <<<'HTML'
<h2>Choosing the Right Chart for Your Data</h2>
<p>The most common mistake in data visualisation is choosing a chart because it <em>looks impressive</em> rather than because it <em>communicates the right thing</em>. Here is a decision guide.</p>

<h3>Comparison</h3>
<p>Use a <strong>bar chart</strong> to compare values across discrete categories. Use a <strong>grouped bar chart</strong> for sub-categories. Avoid pie charts when you have more than 3–4 slices — humans are bad at estimating angles.</p>

<h3>Distribution</h3>
<p>Use a <strong>histogram</strong> to show the shape of a numeric distribution. Use a <strong>box plot</strong> to compare distributions across groups and highlight outliers. Seaborn's <code>violinplot</code> adds density on top of the box plot.</p>

<h3>Trend Over Time</h3>
<p>A <strong>line chart</strong> is almost always correct for time-series data. Use shading (<code>fill_between</code>) to show confidence intervals.</p>

<h3>Correlation</h3>
<p>Use a <strong>scatter plot</strong> for two numeric variables. Add a regression line with <code>sns.regplot</code>. For many variables at once, use a <strong>heatmap</strong> of the correlation matrix.</p>

<h3>The Golden Rule</h3>
<p>Ask yourself: <em>"What question does this chart answer?"</em> If you cannot state the question clearly, simplify the chart until you can.</p>
HTML,
                            ],
                            [
                                'title' => 'Visualise a Real Dataset',
                                'type' => ResourceType::Assignment,
                                'is_free' => false,
                                'estimated_time' => 75,
                                'why_this_resource' => 'Applying skills to messy real data is where real learning happens.',
                                'content' => <<<'HTML'
<h2>Assignment: Visualise a Real Dataset</h2>
<p>Download the Adult Census Income dataset from Kaggle and produce a short visual report in a Jupyter notebook.</p>

<h3>Your notebook must include</h3>
<ol>
  <li>A <strong>distribution</strong> of ages (histogram with a KDE overlay)</li>
  <li>A <strong>bar chart</strong> comparing average income by education level</li>
  <li>A <strong>scatter plot</strong> of hours-per-week vs. age, coloured by income bracket</li>
  <li>A <strong>correlation heatmap</strong> of all numeric columns</li>
  <li>One paragraph of written interpretation below each chart</li>
</ol>

<h3>Submission</h3>
<p>Export your notebook as HTML and submit the file. Notebooks that do not run top-to-bottom without errors will not be accepted.</p>
HTML,
                            ],
                        ],
                    ],
                ],
            ],

            [
                'category' => 'devops-cloud',
                'title' => 'DevOps Foundations: Docker & GitHub Actions',
                'slug' => 'devops-docker-github-actions',
                'description' => 'Master the two tools that sit at the heart of modern DevOps: Docker for containerising your applications and GitHub Actions for automating your entire CI/CD pipeline. You will finish with a working pipeline that tests, builds, and deploys your app on every push.',
                'what_you_will_learn' => 'Write Dockerfiles and docker-compose configurations. Build multi-stage Docker images for production. Create GitHub Actions workflows for CI and CD. Deploy a containerised application to a cloud host.',
                'prerequisites' => 'Comfortable with the command line and Git basics.',
                'difficulty' => CourseDifficulty::Intermediate,
                'estimated_duration' => 360,
                'is_featured' => false,
                'status' => CourseStatus::Published,
                'modules' => [
                    [
                        'title' => 'Containerisation with Docker',
                        'description' => 'Understand containers, images, and how to Dockerise any application.',
                        'resources' => [
                            [
                                'title' => 'Why Containers Changed Software Development',
                                'type' => ResourceType::Text,
                                'is_free' => true,
                                'estimated_time' => 10,
                                'why_this_resource' => 'Without understanding the problem containers solve, the tooling feels arbitrary.',
                                'content' => <<<'HTML'
<h2>Why Containers Changed Software Development</h2>
<p>Before containers, the classic developer complaint was <em>"it works on my machine"</em>. Containers solve this at the operating system level.</p>

<h3>The Problem: Environment Hell</h3>
<p>Traditional applications depend on specific versions of runtimes, libraries, and system packages. Deploying meant ensuring every server had exactly the right combination — a brittle, error-prone process. A PHP 8.1 app deployed to a server running PHP 7.4 would simply fail.</p>

<h3>Virtual Machines vs. Containers</h3>
<p>VMs solved environment parity by running a full guest OS on a hypervisor. This worked, but came with:</p>
<ul>
  <li>Minutes-long boot times</li>
  <li>Gigabytes of disk per VM</li>
  <li>High memory overhead</li>
</ul>
<p>Containers share the host kernel. They are isolated at the process level using Linux namespaces and cgroups. A container starts in <strong>milliseconds</strong> and uses <strong>megabytes</strong> of overhead.</p>

<h3>What Docker Added</h3>
<p>Docker didn't invent containers — Linux had them since 2008. What Docker added was a <strong>developer-friendly interface</strong>: a simple Dockerfile DSL, a public registry (Docker Hub), and <code>docker compose</code> for multi-service apps. That combination made containers accessible to every developer, not just systems engineers.</p>

<h3>The Result</h3>
<p>Today, every major cloud provider runs containers natively. Understanding Docker is no longer optional for professional developers — it is a foundational skill in the same category as version control.</p>
HTML,
                            ],
                            [
                                'title' => 'Docker in 100 Seconds (then deeper)',
                                'type' => ResourceType::Video,
                                'url' => 'https://www.youtube.com/watch?v=Gjnup-PuquQ',
                                'source' => 'YouTube',
                                'is_free' => true,
                                'estimated_time' => 25,
                                'why_this_resource' => 'Short intro plus a longer follow-up gives the perfect ramp.',
                                'mentor_note' => 'After this video, install Docker Desktop and run `docker run hello-world` to verify your setup.',
                            ],
                            [
                                'title' => 'Dockerfile Best Practices',
                                'type' => ResourceType::Article,
                                'url' => 'https://docs.docker.com/develop/develop-images/dockerfile_best-practices/',
                                'source' => 'Official Docs',
                                'is_free' => true,
                                'estimated_time' => 20,
                                'why_this_resource' => 'Official best practices prevent the common mistakes that lead to bloated, insecure images.',
                            ],
                        ],
                    ],
                    [
                        'title' => 'CI/CD with GitHub Actions',
                        'description' => 'Automate testing, building, and deployment using GitHub Actions workflows.',
                        'resources' => [
                            [
                                'title' => 'GitHub Actions Full Tutorial',
                                'type' => ResourceType::Video,
                                'url' => 'https://www.youtube.com/watch?v=R8_veQiYBjI',
                                'source' => 'YouTube',
                                'is_free' => false,
                                'estimated_time' => 40,
                                'why_this_resource' => 'Comprehensive walkthrough of triggers, jobs, steps, and secrets.',
                            ],
                            [
                                'title' => 'Anatomy of a CI/CD Pipeline',
                                'type' => ResourceType::Text,
                                'is_free' => false,
                                'estimated_time' => 12,
                                'why_this_resource' => 'Understanding the stages conceptually makes the YAML configuration less mysterious.',
                                'content' => <<<'HTML'
<h2>Anatomy of a CI/CD Pipeline</h2>
<p>A CI/CD pipeline automates the journey from code commit to production deployment. Here is what each stage does and why it exists.</p>

<h3>Continuous Integration (CI)</h3>
<p>CI triggers on every push or pull request. Its job is to prove the code is <strong>not broken</strong>.</p>

<h4>Typical CI stages:</h4>
<ol>
  <li><strong>Checkout</strong> — clone the repository at the commit SHA</li>
  <li><strong>Install dependencies</strong> — <code>composer install</code>, <code>npm ci</code></li>
  <li><strong>Lint</strong> — static analysis, code style (Pint, ESLint)</li>
  <li><strong>Test</strong> — unit and feature tests against a test database</li>
  <li><strong>Build</strong> — compile assets, build Docker image</li>
</ol>

<h3>Continuous Delivery / Deployment (CD)</h3>
<p>CD triggers only on pushes to protected branches (e.g., <code>main</code>). Its job is to <strong>get working code to users</strong>.</p>

<h4>Typical CD stages:</h4>
<ol>
  <li><strong>Push image</strong> — push the built Docker image to a registry (GHCR, ECR)</li>
  <li><strong>Deploy</strong> — update the running service (SSH, Kubernetes rolling update, ECS task definition)</li>
  <li><strong>Smoke test</strong> — hit a health-check endpoint to confirm the new version is up</li>
  <li><strong>Notify</strong> — post a Slack message with the deploy status</li>
</ol>

<h3>GitHub Actions YAML Structure</h3>
<p>Every pipeline is a <code>.yml</code> file in <code>.github/workflows/</code>. The key concepts are:</p>
<ul>
  <li><strong>Trigger</strong> (<code>on:</code>) — which events fire the workflow</li>
  <li><strong>Job</strong> — a runner machine that executes sequentially or in parallel</li>
  <li><strong>Step</strong> — a single shell command or reusable Action</li>
  <li><strong>Secret</strong> — encrypted env var for tokens and passwords</li>
</ul>
HTML,
                            ],
                            [
                                'title' => 'Build a Complete CI/CD Pipeline',
                                'type' => ResourceType::Assignment,
                                'is_free' => false,
                                'estimated_time' => 120,
                                'why_this_resource' => 'This is the capstone of the course — putting Docker and Actions together.',
                                'content' => <<<'HTML'
<h2>Assignment: Build a Complete CI/CD Pipeline</h2>
<p>Create a GitHub Actions workflow for a sample web application (can be from a previous module or a fresh repository).</p>

<h3>CI Workflow Requirements</h3>
<ul>
  <li>Trigger on all pull requests to <code>main</code></li>
  <li>Run your test suite inside a Docker container (use <code>services:</code> for a database)</li>
  <li>Lint the codebase with your chosen linter</li>
  <li>Build a production Docker image</li>
  <li>Fail fast — if tests fail, do not proceed to build</li>
</ul>

<h3>CD Workflow Requirements</h3>
<ul>
  <li>Trigger on push to <code>main</code> only after CI passes</li>
  <li>Push the built image to GitHub Container Registry (GHCR)</li>
  <li>Deploy to a free hosting provider (Railway, Fly.io, or Render)</li>
  <li>Use repository secrets for all credentials — no hardcoded tokens</li>
</ul>

<h3>Submission</h3>
<p>Share your public GitHub repository link. Include a screenshot of a successful pipeline run in your README.</p>
HTML,
                            ],
                        ],
                    ],
                ],
            ],
        ];

        foreach ($courses as $courseData) {
            $category = Category::where('slug', $courseData['category'])->first();
            $modulesData = $courseData['modules'];

            $course = Course::updateOrCreate(
                ['slug' => $courseData['slug']],
                [
                    'user_id' => $mentor->id,
                    'category_id' => $category?->id,
                    'title' => $courseData['title'],
                    'description' => $courseData['description'],
                    'what_you_will_learn' => $courseData['what_you_will_learn'],
                    'prerequisites' => $courseData['prerequisites'],
                    'difficulty' => $courseData['difficulty'],
                    'estimated_duration' => $courseData['estimated_duration'],
                    'is_featured' => $courseData['is_featured'],
                    'status' => $courseData['status'],
                ]
            );

            foreach ($modulesData as $moduleOrder => $moduleData) {
                $resourcesData = $moduleData['resources'];

                $module = Module::firstOrCreate(
                    ['course_id' => $course->id, 'title' => $moduleData['title']],
                    [
                        'description' => $moduleData['description'] ?? null,
                        'order' => $moduleOrder + 1,
                    ]
                );

                foreach ($resourcesData as $resourceOrder => $resourceData) {
                    Resource::firstOrCreate(
                        ['module_id' => $module->id, 'title' => $resourceData['title']],
                        [
                            'type' => $resourceData['type'],
                            'url' => $resourceData['url'] ?? null,
                            'content' => $resourceData['content'] ?? null,
                            'source' => $resourceData['source'] ?? null,
                            'estimated_time' => $resourceData['estimated_time'],
                            'mentor_note' => $resourceData['mentor_note'] ?? null,
                            'why_this_resource' => $resourceData['why_this_resource'] ?? null,
                            'is_free' => $resourceData['is_free'],
                            'order' => $resourceOrder + 1,
                        ]
                    );
                }
            }
        }
    }
}
