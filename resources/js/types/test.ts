export type QuestionType = 'paragraph' | 'multiple_choice' | 'checkboxes' | 'dropdown' | 'date' | 'time';
export type EvaluationMethod = 'exact_match' | 'numeric_comparison' | 'ai_graded';
export type NumericOperator = 'eq' | 'gt' | 'gte' | 'lt' | 'lte';
export type AttemptStatus = 'in_progress' | 'submitted' | 'grading' | 'graded' | 'endorsed';
export type ResourceCompletionStatus = 'incomplete' | 'in_progress' | 'submitted' | 'endorsed';
export type AiGradingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type TestQuestionOption = {
    id: number;
    test_question_id: number;
    label: string;
    order: number;
};

export type TestQuestion = {
    id: number;
    test_id: number;
    order: number;
    question_type: QuestionType;
    body: string;
    hint: string | null;
    points: number;
    evaluation_method: EvaluationMethod;
    numeric_operator: NumericOperator | null;
    correct_answer?: string | null;
    ai_rubric?: string | null;
    ai_help_enabled: boolean;
    is_required: boolean;
    options: TestQuestionOption[];
    created_at: string;
    updated_at: string;
};

export type Test = {
    id: number;
    testable_type: string;
    testable_id: number;
    title: string;
    description: string | null;
    passing_score: number | null;
    time_limit_minutes: number | null;
    max_attempts: number | null;
    ai_help_enabled: boolean;
    questions?: TestQuestion[];
    created_at: string;
    updated_at: string;
};

export type ScoreDetail = {
    total_points: number;
    earned_points: number;
    per_question?: Array<{
        question_id: number;
        earned: number;
    }>;
};

export type TestAttemptAnswer = {
    id: number;
    test_attempt_id: number;
    test_question_id: number;
    answer_value: string | null;
    is_correct: boolean | null;
    points_earned: number | null;
    ai_score: number | null;
    ai_explanation: string | null;
    ai_grading_status: AiGradingStatus | null;
    question_started_at: string | null;
    question_answered_at: string | null;
    created_at: string;
    updated_at: string;
};

export type TestAttempt = {
    id: number;
    test_id: number;
    user_id: number;
    attempt_number: number;
    status: AttemptStatus;
    score: number | null;
    score_detail: ScoreDetail | null;
    mentor_feedback: string | null;
    endorsed_by: number | null;
    endorsed_at: string | null;
    started_at: string;
    submitted_at: string | null;
    answers?: TestAttemptAnswer[];
    test?: Test;
    user?: {
        id: number;
        name: string;
        username: string;
        avatar: string | null;
    };
    created_at: string;
    updated_at: string;
};

export type ResourceCompletion = {
    id: number;
    enrollment_id: number;
    resource_id: number;
    status: ResourceCompletionStatus;
    test_attempt_id: number | null;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
};
