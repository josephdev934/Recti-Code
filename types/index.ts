export interface CodeSubmission {
  _id?: string;
  userId: string;
  code: string;
  language: string;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
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
  summary: string;
}

export interface CodeIssue {
  issue: string;
  fix: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
