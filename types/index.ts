export interface CodeSubmission {
  _id?: string;
  userId: string;
  code: string;
  language: string;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  /** Which focus the review was run with (older saved reviews don't have one) */
  focus?: ReviewFocus;
  aiResponse: AIReview | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIReview {
  bugs: CodeIssue[];
  performanceIssues: CodeIssue[];
  securityProblems: CodeIssue[];
  bestPractices: CodeIssue[];
  architectureSuggestions: CodeIssue[];
  overallScore: number;
  /** Plain-language description of what the code does (older saved reviews don't have one) */
  explanation?: string;
  /** One or two sentence overall verdict */
  summary: string;
}

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export type ReviewFocus = 'all' | 'security' | 'performance' | 'readability';

export const REVIEW_FOCUSES: ReviewFocus[] = ['all', 'security', 'performance', 'readability'];

export type ExplanationLevel = 'beginner' | 'intermediate' | 'expert';

export const EXPLANATION_LEVELS: ExplanationLevel[] = ['beginner', 'intermediate', 'expert'];

export interface CodeIssue {
  issue: string;
  fix: string;
  severity?: Severity;
  line?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
