import { AIReview, CodeIssue, ReviewFocus, Severity } from '@/types';

export type LensId = 'bugs' | 'security' | 'performance' | 'readability';

// A "lens" is one way of looking at the code. Each one becomes a branch in the review UI.
export interface Lens {
  id: LensId;
  label: string;
  issues: CodeIssue[];
  /** 0-100, higher is healthier */
  score: number;
  /** false when the user's focus excluded this lens */
  inFocus: boolean;
}

const LENS_LABELS: Record<LensId, string> = {
  bugs: 'Bugs',
  security: 'Security',
  performance: 'Performance',
  readability: 'Readability',
};

export const LENS_ORDER: LensId[] = ['bugs', 'security', 'performance', 'readability'];

const FOCUS_LENSES: Record<ReviewFocus, LensId[]> = {
  all: LENS_ORDER,
  security: ['security'],
  performance: ['performance'],
  readability: ['readability'],
};

const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 40,
  high: 25,
  medium: 12,
  low: 5,
};

export function lensScore(issues: CodeIssue[]): number {
  const penalty = issues.reduce((sum, issue) => sum + SEVERITY_WEIGHT[issue.severity ?? 'medium'], 0);
  return Math.max(0, 100 - penalty);
}

export function issuesForLens(review: AIReview | null, id: LensId): CodeIssue[] {
  if (!review) return [];
  switch (id) {
    case 'bugs':
      return review.bugs ?? [];
    case 'security':
      return review.securityProblems ?? [];
    case 'performance':
      return review.performanceIssues ?? [];
    case 'readability':
      return [...(review.bestPractices ?? []), ...(review.architectureSuggestions ?? [])];
  }
}

export function buildLenses(review: AIReview | null, focus: ReviewFocus = 'all'): Lens[] {
  return LENS_ORDER.map((id) => {
    const issues = issuesForLens(review, id);
    return {
      id,
      label: LENS_LABELS[id],
      issues,
      score: lensScore(issues),
      inFocus: FOCUS_LENSES[focus].includes(id),
    };
  });
}

/** The branch that "wins": the in-focus lens with the most to fix. Null when everything is clean. */
export function pickPrimary(lenses: Lens[]): LensId | null {
  const candidates = lenses.filter((l) => l.inFocus && l.issues.length > 0);
  if (candidates.length === 0) return null;
  return candidates.reduce((worst, l) => (l.score < worst.score ? l : worst)).id;
}
