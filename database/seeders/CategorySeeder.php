<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Web Development', 'description' => 'Frontend, backend, and full-stack web development.'],
            ['name' => 'Mobile Development', 'description' => 'iOS, Android, and cross-platform mobile apps.'],
            ['name' => 'Data Science', 'description' => 'Data analysis, machine learning, and AI fundamentals.'],
            ['name' => 'DevOps & Cloud', 'description' => 'CI/CD, containerization, cloud infrastructure.'],
            ['name' => 'Cybersecurity', 'description' => 'Application security, ethical hacking, and best practices.'],
            ['name' => 'UI/UX Design', 'description' => 'User interface design, prototyping, and design systems.'],
            ['name' => 'Database & SQL', 'description' => 'Relational databases, NoSQL, and query optimization.'],
            ['name' => 'Software Engineering', 'description' => 'Architecture, design patterns, and engineering principles.'],
            ['name' => 'Career Development', 'description' => 'Interview preparation, portfolio building, and soft skills.'],
            ['name' => 'Open Source', 'description' => 'Contributing to open source projects and communities.'],
        ];

        foreach ($categories as $category) {
            Category::firstOrCreate(
                ['slug' => Str::slug($category['name'])],
                [
                    'name' => $category['name'],
                    'description' => $category['description'],
                ]
            );
        }
    }
}
