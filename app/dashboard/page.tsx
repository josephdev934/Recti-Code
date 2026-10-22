'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CodeSubmission, ExplanationLevel, ReviewFocus } from '@/types';
import LanguageIcon from '@/components/LanguageIcon';
import ThemeToggle from '@/components/ThemeToggle';
import HistorySidebar from '@/components/chat/HistorySidebar';
import ReviewComposer, { MAX_CODE_LENGTH } from '@/components/chat/ReviewComposer';
import ReviewMessage from '@/components/chat/ReviewMessage';

const EXT_TO_LANGUAGE: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  java: 'java',
  cpp: 'cpp',
  h: 'cpp',
  cs: 'csharp',
  go: 'go',
  rs: 'rust',
  php: 'php',
  rb: 'ruby',
  swift: 'swift',
  kt: 'kotlin',
};

const SAMPLES = [
  {
    label: 'SQL injection',
    language: 'javascript',
    filename: 'login.js',
    code: `async function login(name, pass) {
  const q = "SELECT * FROM users WHERE name = '" + name + "' AND pass = '" + pass + "'";
  const rows = await db.query(q);
  return rows[0];
}`,
  },
  {
    label: 'React effect bug',
    language: 'typescript',
    filename: 'UserList.tsx',
    code: `function UserList({ team }: { team: string }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch('/api/users?team=' + team)
      .then((r) => r.json())
      .then(setUsers);
  }, []);

  return users.map((u) => <li>{u.name}</li>);
}`,
  },
  {
    label: 'Python pitfalls',
    language: 'python',
    filename: 'cart.py',
    code: `def add_item(item, cart=[]):
    try:
        cart.append(item)
        return cart
    except:
        pass`,
  },
];

const FOCUS_LABEL: Record<ReviewFocus, string> = {
  all: 'All checks',
  security: 'Security',
  performance: 'Performance',
  readability: 'Readability',
};

function UserMessage({ submission, level }: { submission: CodeSubmission; level?: ExplanationLevel }) {
  const [expanded, setExpanded] = useState(false);
  const lines = submission.code.split('\n');
  const long = lines.length > 10;
  const shown = expanded || !long ? submission.code : lines.slice(0, 10).join('\n');

  return (
    <div className="flex justify-end rise-in">
      <div className="w-full max-w-[92%] sm:max-w-[80%] rounded-2xl rounded-tr-md border border-(color:--c-1e293b) bg-(color:--c-111827)/70 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-(color:--c-1e293b)/70">
          <LanguageIcon language={submission.language} className="w-5 h-5" />
          <span className="text-sm font-mono text-(color:--c-e2e8f0)">{submission.filename}</span>
          <span className="text-xs font-mono text-(color:--c-64748b)">{lines.length} lines</span>
          <span className="ml-auto flex gap-1.5">
            <span className="px-2.5 py-0.5 rounded-full border border-(color:--c-818cf8)/40 text-xs font-mono text-(color:--c-a5b4fc)">
              {FOCUS_LABEL[submission.focus ?? 'all']}
            </span>
            {level && (
              <span className="px-2.5 py-0.5 rounded-full border border-(color:--c-1e293b) text-xs font-mono text-(color:--c-64748b)">
                {level}
              </span>
            )}
          </span>
        </div>
        <pre className="px-4 py-3 text-[15px] leading-7 font-mono text-(color:--c-cbd5e1) overflow-x-auto whitespace-pre">
          {shown}
          {long && !expanded && '\n…'}
        </pre>
        {long && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-4 py-2.5 border-t border-(color:--c-1e293b)/70 text-xs font-mono text-(color:--c-64748b) hover:text-(color:--c-a5b4fc) transition-colors cursor-pointer"
          >
            {expanded ? 'Show less' : `Show all ${lines.length} lines`}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, token, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Composer state
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [filename, setFilename] = useState('');
  const [focus, setFocus] = useState<ReviewFocus>('all');
  const [level, setLevel] = useState<ExplanationLevel>('intermediate');

  // Conversation state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState<CodeSubmission | null>(null);
  const [currentLevel, setCurrentLevel] = useState<ExplanationLevel | undefined>(undefined);
  const [fresh, setFresh] = useState(true); // true = a live result (animate), false = opened from history
  const [runId, setRunId] = useState(0);

  // History
  const [submissions, setSubmissions] = useState<CodeSubmission[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);

  // Guests can review code without an account; only saving needs a sign-in
  const authHeaders = (): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {});

  // Load saved history for signed-in users; clear it (and any saved result) on sign-out
  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) {
      fetchSubmissions();
    } else {
      setSubmissions([]);
      setCurrentSubmission((prev) => (prev?._id ? null : prev));
      setLoadingHistory(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading]);

  const fetchSubmissions = async () => {
    try {
      setLoadingHistory(true);
      const response = await fetch('/api/code', { headers: authHeaders() });
      const data = await response.json();
      if (data.success) setSubmissions(data.data);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Poll for the AI result when a saved submission is still processing
  useEffect(() => {
    if (!currentSubmission || currentSubmission.status !== 'processing' || !currentSubmission._id) return;

    const id = currentSubmission._id;
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/code/${id}`, { headers: authHeaders() });
        const data = await response.json();
        if (!data.success) return;

        const updated: CodeSubmission = data.data;
        setCurrentSubmission(updated);
        setSubmissions((prev) => prev.map((sub) => (sub._id === updated._id ? updated : sub)));

        if (updated.status === 'completed' || updated.status === 'failed') {
          setIsSubmitting(false);
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Error polling for submission results:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSubmission?._id, currentSubmission?.status]);

  // Keep the newest message in view
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [runId, currentSubmission?.status]);

  interface ReviewInput {
    code: string;
    language: string;
    filename: string;
    focus: ReviewFocus;
    level: ExplanationLevel;
  }

  const runReview = async (input: ReviewInput, fromComposer: boolean) => {
    if (isSubmitting || authLoading) return;
    if (!input.code.trim()) return;
    if (input.code.length > MAX_CODE_LENGTH) {
      alert(`Code is too long (max ${MAX_CODE_LENGTH.toLocaleString()} characters).`);
      return;
    }

    const name = input.filename.trim() || 'snippet';
    const now = new Date();

    // The code moves out of the box and up into the conversation, like sending a chat message
    if (fromComposer) {
      setCode('');
      setFilename('');
    }

    // Show the conversation straight away; the result fills in when it arrives
    setIsSubmitting(true);
    setFresh(true);
    setRunId((n) => n + 1);
    setCurrentLevel(input.level);
    setCurrentSubmission({
      userId: user?.id ?? 'guest',
      code: input.code,
      language: input.language,
      filename: name,
      focus: input.focus,
      status: 'processing',
      aiResponse: null,
      createdAt: now,
      updatedAt: now,
    });

    // Show what went wrong inside the conversation (with a Retry button) instead of a pop-up.
    // The code stays in the thread, so Retry never needs it typed again.
    const fail = (message: string) => {
      setCurrentSubmission((prev) => (prev ? { ...prev, status: 'failed', errorMessage: message } : prev));
      setIsSubmitting(false);
    };

    try {
      const response = await fetch('/api/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          code: input.code,
          language: input.language,
          filename: name,
          focus: input.focus,
          level: input.level,
        }),
      });
      // A crashed route sends back an HTML error page, not JSON
      const data = await response.json().catch(() => null);

      if (!data) {
        // Details for developers go to the browser console; the user gets a plain message
        console.error(`Review request got a non-JSON response (HTTP ${response.status})`);
        fail('Something went wrong on our side. Please try again in a moment.');
        return;
      }

      if (data.success) {
        const newSubmission: CodeSubmission = data.data;
        setCurrentSubmission(newSubmission);
        if (data.saved) setSubmissions((prev) => [newSubmission, ...prev]);
        // Guest reviews come back finished, so there is nothing to poll for
        if (newSubmission.status !== 'processing') setIsSubmitting(false);
      } else {
        fail(
          data.retryAfter
            ? `${data.error}. Please try again in ${data.retryAfter} seconds.`
            : data.error || 'The review request was rejected. Please try again.'
        );
      }
    } catch (error) {
      console.error('Failed to run code review:', error);
      fail("We couldn't reach the server. Check your internet connection and try again.");
    }
  };

  const handleRunReview = () => runReview({ code, language, filename, focus, level }, true);

  // Re-run the review that is on screen (the composer is empty by now)
  const handleRetry = () => {
    if (!currentSubmission) return;
    runReview(
      {
        code: currentSubmission.code,
        language: currentSubmission.language,
        filename: currentSubmission.filename,
        focus: currentSubmission.focus ?? 'all',
        level: currentLevel ?? level,
      },
      false
    );
  };

  const handleFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext && EXT_TO_LANGUAGE[ext]) setLanguage(EXT_TO_LANGUAGE[ext]);
    setFilename(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') setCode(event.target.result);
    };
    reader.readAsText(file);
  };

  const handleNew = () => {
    setCurrentSubmission(null);
    setCurrentLevel(undefined);
    setIsSubmitting(false);
    setCode('');
    setFilename('');
    setFocus('all');
  };

  const handleSelectHistory = (sub: CodeSubmission) => {
    setFresh(false);
    setCurrentLevel(undefined);
    setCurrentSubmission(sub);
    setIsSubmitting(sub.status === 'processing');
    // The code is already in the conversation, so the box stays empty for the next message
    setCode('');
    setFilename('');
    setLanguage(sub.language);
    setFocus(sub.focus ?? 'all');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    try {
      const response = await fetch(`/api/code/${id}`, { method: 'DELETE', headers: authHeaders() });
      const data = await response.json();
      if (data.success) {
        setSubmissions((prev) => prev.filter((s) => s._id !== id));
        if (currentSubmission?._id === id) handleNew();
      }
    } catch (err) {
      console.error('Failed to delete submission:', err);
    }
  };

  const loadSample = (sample: (typeof SAMPLES)[number]) => {
    setCode(sample.code);
    setLanguage(sample.language);
    setFilename(sample.filename);
  };

  const hasConversation = !!currentSubmission;
  // First name for the greeting, taken from the signed-in account
  const firstName = isAuthenticated ? user?.name?.trim().split(/\s+/)[0] : undefined;

  return (
    <main className="h-dvh flex bg-(color:--c-080b11) text-(color:--ink) font-sans overflow-hidden">
      <HistorySidebar
        submissions={submissions}
        loading={loadingHistory}
        activeId={currentSubmission?._id}
        isAuthenticated={isAuthenticated}
        userName={user?.name}
        userEmail={user?.email}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNew={handleNew}
        onSelect={handleSelectHistory}
        onDelete={handleDelete}
        onLogout={logout}
        onSignIn={() => router.push('/auth')}
      />

      <div className="relative flex-1 min-w-0 flex flex-col">
        {/* Soft colour glows behind the conversation, so the glass composer has something to blur */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -top-24 right-[10%] w-[420px] h-[420px] rounded-full bg-(color:--c-6366f1) opacity-20 blur-[120px]" />
          <div className="absolute bottom-[-80px] left-[15%] w-[380px] h-[380px] rounded-full bg-(color:--c-06b6d4) opacity-[0.12] blur-[120px]" />
        </div>

        {/* Mobile top bar */}
        <header className="relative lg:hidden flex items-center gap-3 px-4 py-3 border-b border-(color:--c-1e293b)/70 bg-(color:--c-090d16)">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="p-1.5 -ml-1.5 text-(color:--c-94a3b8) hover:text-(color:--ink) cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-lg font-bold tracking-tight">Recti Code</span>
          <ThemeToggle className="ml-auto" />
        </header>

        {/* Conversation */}
        <div className="relative flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-8 space-y-8">
            {!hasConversation ? (
              <div className="pt-[8vh] text-center space-y-6 rise-in">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-(color:--c-818cf8)/10 border border-(color:--c-818cf8)/30 flex items-center justify-center">
                  <svg className="w-7 h-7 text-(color:--c-818cf8)" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h4" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                    {firstName ? `Hi ${firstName}, what should we review?` : 'What should we review?'}
                  </h1>
                  <p className="text-base text-(color:--c-64748b)">
                    Paste code below. You&apos;ll get an explanation, a verdict, and fixes you can copy.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {SAMPLES.map((sample) => (
                    <button
                      key={sample.label}
                      onClick={() => loadSample(sample)}
                      className="flex items-center gap-2.5 px-4 py-2.5 rounded-full border border-(color:--c-1e293b) hover:border-(color:--c-818cf8)/50 hover:bg-(color:--c-818cf8)/5 text-sm text-(color:--c-94a3b8) hover:text-(color:--ink) transition-colors cursor-pointer"
                    >
                      <LanguageIcon language={sample.language} className="w-5 h-5" />
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <UserMessage submission={currentSubmission} level={currentLevel} />

                <div className="flex gap-3 rise-in">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-(color:--c-818cf8)/10 border border-(color:--c-818cf8)/30 flex items-center justify-center">
                    <svg className="w-4 h-4 text-(color:--c-818cf8)" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h4" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <ReviewMessage
                      key={fresh ? `run-${runId}` : `h-${currentSubmission._id}`}
                      submission={currentSubmission}
                      focus={currentSubmission.focus ?? 'all'}
                      fresh={fresh}
                      isAuthenticated={isAuthenticated}
                      onSignIn={() => router.push('/auth')}
                      onRetry={handleRetry}
                    />
                  </div>
                </div>
              </>
            )}
            <div ref={endRef} />
          </div>
        </div>

        {/* Composer */}
        <div className="relative shrink-0 px-4 sm:px-6 pb-4 pt-2">
          <div className="mx-auto w-full max-w-3xl">
            <ReviewComposer
              code={code}
              onCodeChange={setCode}
              language={language}
              onLanguageChange={setLanguage}
              filename={filename}
              onFilenameChange={setFilename}
              focus={focus}
              onFocusChange={setFocus}
              level={level}
              onLevelChange={setLevel}
              onFile={handleFile}
              onSubmit={handleRunReview}
              busy={isSubmitting || authLoading}
            />
            <p className="mt-2 text-center text-xs font-mono text-(color:--c-475569)">
              AI reviews can be wrong. Check fixes before using them.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
