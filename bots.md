# Bots

## Set enrolled count for a course

```bash
php artisan tinker --execute="use App\Models\Course; Course::where('slug', 'prompt-engineering-full-course-2')->first()->setEnrolledCount(827);"
```
