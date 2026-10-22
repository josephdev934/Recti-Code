'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReasoningBranch } from '@/components/ui/branching-reasoning-chat-input';
import { AIReview, CodeIssue, CodeSubmission, ReviewFocus } from '@/types';
import { buildLenses, Lens, LensId, pickPrimary } from '@/lib/lenses';
import { FixBlock, SeverityBadge } from '@/components/IssueParts';
import BranchDeck from './BranchDeck';
import StreamingText from './StreamingText';

interface ReviewMessageProps {
  submission: CodeSubmission;
  focus: ReviewFocus;
  /** a live result: play the animations. History items render instantly. */
  fresh: boolean;
  isAuthenticated: boolean;
  onSignIn: () => void;
  onRetry: () => void;
}

type Stage = 'branching' | 'choosing' | 'answering' | 'done';

const LENS_STYLE: Record<LensId, { border: string; text: string; bg: string }> = {
  bugs: { border: 'border-(color:--c-f87171)/30', text: 'text-(color:--c-f87171)', bg: 'bg-(color:--c-ef4444)/10' },
  security: { border: 'border-(color:--c-f87171)/30', text: 'text-(color:--c-f87171)', bg: 'bg-(color:--c-ef4444)/10' },
  performance: { border: 'border-(color:--c-3b82f6)/30', text: 'text-(color:--c-60a5fa)', bg: 'bg-(color:--c-3b82f6)/10' },
  readability: { border: 'border-(color:--c-fbbf24)/30', text: 'text-(color:--c-facc15)', bg: 'bg-(color:--c-eab308)/10' },
};

function IssueCard({ issue, lens, tag }: { issue: CodeIssue; lens: Lens; tag?: string }) {
  const style = LENS_STYLE[lens.id];
  return (
    <div className={`rounded-2xl border ${style.border} bg-card overflow-hidden rise-in`}>
      <div className={`px-5 py-2.5 flex items-center justify-between ${style.bg}`}>
        <span className="flex items-center gap-2.5">
          <span className={`text-[11px] font-mono font-bold tracking-widest uppercase ${style.text}`}>
            {tag ?? lens.label}
          </span>
          <SeverityBadge severity={issue.severity ?? 'medium'} />
        </span>
        {issue.line ? <span className="text-xs font-mono text-muted-foreground">Line {issue.line}</span> : null}
      </div>
      <div className="p-5 space-y-4">
        <p className="text-[15px] text-foreground leading-relaxed">{issue.issue}</p>
        <FixBlock fix={issue.fix} />
      </div>
    </div>
  );
}

function scoreBadge(score10: number) {
  const percent = Math.min(Math.max(score10 * 10, 0), 100);
  if (score10 < 5)
    return { label: 'Vulnerable', percent, cls: 'border-(color:--c-f87171)/40 bg-(color:--c-f87171)/5 text-(color:--c-f87171)' };
  if (score10 < 7)
    return { label: 'Optimizable', percent, cls: 'border-(color:--c-fbbf24)/40 bg-(color:--c-fbbf24)/5 text-(color:--c-fbbf24)' };
  return { label: 'Healthy', percent, cls: 'border-(color:--c-34d399)/40 bg-(color:--c-34d399)/5 text-(color:--c-34d399)' };
}

function branchNote(lens: Lens, waiting: boolean): string {
  if (!lens.inFocus) return 'Not in focus';
  if (waiting) return 'Checking your code…';
  if (lens.issues.length === 0) return 'Looks clean';
  return `${lens.issues.length} ${lens.issues.length === 1 ? 'issue' : 'issues'} found`;
}

export default function ReviewMessage({
  submission,
  focus,
  fresh,
  isAuthenticated,
  onSignIn,
  onRetry,
}: ReviewMessageProps) {
  const review = (submission.aiResponse as AIReview | null) ?? null;
  const failed = submission.status === 'failed';
  const ready = submission.status === 'completed' && !!review;

  const lenses = useMemo(() => buildLenses(review, focus), [review, focus]);
  const primaryId = useMemo(() => pickPrimary(lenses), [lenses]);

  // Live results play the deck's story: branches think, scores fill, the key area is chosen,
  // then the answer streams. Opened-from-history messages skip straight to the end.
  const [stage, setStage] = useState<Stage>(!fresh && ready ? 'done' : 'branching');
  const [fill, setFill] = useState(!fresh && ready ? 10 : 0); // 0..10, how far the score bars have filled
  const [explanationDone, setExplanationDone] = useState(!fresh);
  const [verdictDone, setVerdictDone] = useState(!fresh);

  useEffect(() => {
    if (!ready || stage !== 'branching') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fresh || reduced) {
      setFill(10);
      setStage('answering');
      return;
    }

    let step = 0;
    let wait: ReturnType<typeof setTimeout> | undefined;
    const id = setInterval(() => {
      step += 1;
      setFill(step);
      if (step >= 10) {
        clearInterval(id);
        setStage('choosing');
        wait = setTimeout(() => setStage('answering'), 700);
      }
    }, 90);
    return () => {
      clearInterval(id);
      if (wait) clearTimeout(wait);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Which lens sections are open; the winning branch starts open
  const [open, setOpen] = useState<Partial<Record<LensId, boolean>>>({});
  const isOpen = (id: LensId) => open[id] ?? id === primaryId;
  const toggle = (id: LensId) => setOpen((prev) => ({ ...prev, [id]: !isOpen(id) }));

  const waiting = !ready;
  const branches: ReasoningBranch[] = lenses.map((lens) => ({
    id: lens.id,
    title: lens.label,
    note: branchNote(lens, waiting),
    score: !lens.inFocus ? undefined : Math.round((lens.score * (waiting ? 0 : fill)) / 10),
    chosen: stage !== 'branching' && lens.id === primaryId,
  }));

  if (failed) {
    return (
      <div className="rounded-2xl border border-(color:--c-ef4444)/30 bg-(color:--c-ef4444)/5 p-5 space-y-3 rise-in">
        <h3 className="text-base font-bold text-(color:--c-f87171)">The review failed</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {submission.errorMessage ||
            'Something went wrong while analysing this code. This usually clears up if you try again in a moment.'}
        </p>
        <button
          onClick={onRetry}
          className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-lg border border-(color:--c-f87171)/40 text-(color:--c-f87171) hover:bg-(color:--c-f87171)/10 transition-colors cursor-pointer"
        >
          Try again
        </button>
      </div>
    );
  }

  const badge = review ? scoreBadge(review.overallScore) : null;
  const sections = lenses
    .filter((l) => l.inFocus && l.issues.length > 0)
    .sort((a, b) => (a.id === primaryId ? -1 : b.id === primaryId ? 1 : a.score - b.score));
  const totalIssues = sections.reduce((n, l) => n + l.issues.length, 0);
  const answering = stage === 'answering' || stage === 'done';

  return (
    <div className="space-y-6">
      <BranchDeck status={stage} branches={branches} />

      {answering && review && badge && (
        <div className="space-y-6">
          {/* What the code does, then the verdict (streamed like a model answer) */}
          {review.explanation && (
            <div className="space-y-2">
              <span className="text-[11px] font-mono font-bold tracking-widest text-(color:--c-818cf8) uppercase">
                What this code does
              </span>
              <p className="text-base text-foreground leading-relaxed">
                <StreamingText
                  text={review.explanation}
                  animate={fresh}
                  onDone={() => setExplanationDone(true)}
                />
              </p>
            </div>
          )}

          {(explanationDone || !review.explanation) && (
            <div className={`rounded-2xl border p-5 space-y-3 rise-in ${badge.cls}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-extrabold tracking-wider uppercase">
                  {badge.label}: {badge.percent}%
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  {totalIssues === 0 ? 'No issues' : `${totalIssues} ${totalIssues === 1 ? 'issue' : 'issues'}`}
                </span>
              </div>
              <p className="text-base text-foreground leading-relaxed">
                <span className="font-mono font-bold tracking-widest text-[11px] uppercase text-muted-foreground">
                  Verdict:{' '}
                </span>
                <StreamingText
                  text={review.summary}
                  animate={fresh}
                  onDone={() => {
                    setVerdictDone(true);
                    setStage('done');
                  }}
                />
              </p>
            </div>
          )}

          {/* Findings: the most important area open, the rest one click away */}
          {verdictDone && (
            <div className="space-y-4">
              {sections.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4 rise-in">
                  No issues found in the selected focus area.
                </p>
              )}

              {sections.map((lens) => {
                const expanded = isOpen(lens.id);
                return (
                  <section key={lens.id} className="space-y-3 rise-in">
                    <button
                      type="button"
                      onClick={() => toggle(lens.id)}
                      aria-expanded={expanded}
                      className="w-full flex items-center justify-between text-left cursor-pointer group"
                    >
                      <span className="flex items-center gap-2">
                        <span className={`text-base font-semibold ${LENS_STYLE[lens.id].text}`}>{lens.label}</span>
                        <span className="text-xs font-mono text-muted-foreground">
                          {lens.issues.length} {lens.issues.length === 1 ? 'issue' : 'issues'}
                          {lens.id === primaryId ? ' · most important' : ''}
                        </span>
                      </span>
                      <svg
                        className={`w-4 h-4 text-muted-foreground group-hover:text-foreground transition-transform ${
                          expanded ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {expanded && (
                      <div className="space-y-3">
                        {lens.issues.map((issue, idx) => (
                          <IssueCard
                            key={idx}
                            issue={issue}
                            lens={lens}
                            tag={
                              lens.id === 'readability'
                                ? idx < (review.bestPractices?.length ?? 0)
                                  ? 'Best practice'
                                  : 'Architecture'
                                : undefined
                            }
                          />
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}

              {!isAuthenticated && (
                <div className="p-4 rounded-2xl border border-(color:--c-818cf8)/30 bg-(color:--c-818cf8)/5 flex items-center justify-between gap-3 rise-in">
                  <span className="text-sm text-muted-foreground leading-snug">
                    This review isn&apos;t saved. Sign in to keep it.
                  </span>
                  <button
                    onClick={onSignIn}
                    className="shrink-0 py-2 px-4 bg-(color:--c-6366f1) hover:bg-(color:--c-4f46e5) text-(color:--on-accent) text-xs font-bold rounded-lg cursor-pointer transition-colors uppercase tracking-wider"
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
