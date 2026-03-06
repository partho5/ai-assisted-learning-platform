export type CourseStatus = 'draft' | 'published';
export type EnrollmentAccess = 'observer' | 'full';

export type Enrollment = {
    id: number;
    user_id: number;
    course_id: number;
    access_level: EnrollmentAccess;
    purchased_at: string | null;
};
export type CourseDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type ResourceType = 'video' | 'article' | 'text' | 'document' | 'audio' | 'image' | 'assignment';

export type Category = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
};

export type CourseResource = {
    id: number;
    module_id: number;
    title: string;
    type: ResourceType;
    url: string | null;
    content: string | null;
    source: string | null;
    estimated_time: number | null;
    mentor_note: string | null;
    why_this_resource: string;
    is_free: boolean;
    order: number;
    test?: import('./test').Test | null;
    completion?: import('./test').ResourceCompletion | null;
};

export type CourseModule = {
    id: number;
    course_id: number;
    title: string;
    description: string | null;
    order: number;
    resources: CourseResource[];
};

export type CourseMentor = {
    id: number;
    name: string;
    username: string;
    avatar: string | null;
    headline: string | null;
    bio?: string | null;
};

export type Course = {
    id: number;
    user_id: number;
    category_id: number | null;
    title: string;
    slug: string;
    description: string;
    what_you_will_learn: string;
    prerequisites: string | null;
    difficulty: CourseDifficulty;
    estimated_duration: number | null;
    thumbnail: string | null;
    status: CourseStatus;
    is_featured: boolean;
    category: Category | null;
    mentor?: CourseMentor;
    modules: CourseModule[];
    modules_count?: number;
    resources_count?: number;
    enrollments_count?: number;
};

export type SelectOption = {
    value: string;
    label: string;
};
