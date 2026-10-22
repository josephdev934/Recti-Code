'use client';

import { useLayoutEffect, useRef } from 'react';
import LanguageIcon from '@/components/LanguageIcon';
import { ExplanationLevel, ReviewFocus } from '@/types';
import Dropdown from './Dropdown';

export const MAX_CODE_LENGTH = 50_000; // keep in sync with app/api/code/route.ts

const FOCUS_OPTIONS: { id: ReviewFocus; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'security', label: 'Security' },
  { id: 'performance', label: 'Performance' },
  { id: 'readability', label: 'Readability' },
];

const LANGUAGES: { id: string; label: string }[] = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
  { id: 'csharp', label: 'C#' },
  { id: 'go', label: 'Go' },
  { id: 'rust', label: 'Rust' },
  { id: 'php', label: 'PHP' },
  { id: 'ruby', label: 'Ruby' },
  { id: 'swift', label: 'Swift' },
  { id: 'kotlin', label: 'Kotlin' },
  { id: 'other', label: 'Other' },
];

const LANGUAGE_OPTIONS = LANGUAGES.map((l) => ({
  value: l.id,
  label: l.label,
  icon: <LanguageIcon language={l.id} className="w-4 h-4 shrink-0" />,
}));

const LEVEL_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'expert', label: 'Expert' },
];

interface ReviewComposerProps {
  code: string;
  onCodeChange: (code: string) => void;
  language: string;
  onLanguageChange: (language: string) => void;
  filename: string;
  onFilenameChange: (filename: string) => void;
  focus: ReviewFocus;
  onFocusChange: (focus: ReviewFocus) => void;
  level: ExplanationLevel;
  onLevelChange: (level: ExplanationLevel) => void;
  onFile: (file: File) => void;
  onSubmit: () => void;
  busy: boolean;
}

// The prompt box: grows with the code, with the review options underneath.
export default function ReviewComposer({
  code,
  onCodeChange,
  language,
  onLanguageChange,
  filename,
  onFilenameChange,
  focus,
  onFocusChange,
  level,
  onLevelChange,
  onFile,
  onSubmit,
  busy,
}: ReviewComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Auto-grow between ~3 and ~14 lines
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 76), 340)}px`;
  }, [code]);

  const tooLong = code.length > MAX_CODE_LENGTH;
  const canSend = !busy && !tooLong && code.trim().length > 0;

  return (
    <div className="glass-surface relative rounded-2xl focus-within:border-(color:--c-818cf8)/50 transition-colors">
      {/* soft highlight along the top edge, the "glass" sheen */}
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-(color:--ink)/30 to-transparent" />
      <textarea
        ref={textareaRef}
        value={code}
        onChange={(e) => onCodeChange(e.target.value)}
        onKeyDown={(e) => {
          // Enter sends (like a chat); Shift+Enter adds a new line
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (canSend) onSubmit();
          }
        }}
        placeholder="Paste code to review, then press Enter…"
        spellCheck={false}
        aria-label="Code to review"
        className="w-full resize-none bg-transparent px-4 pt-4 pb-2 font-mono text-[13px] leading-6 text-(color:--c-cbd5e1) placeholder-(color:--c-334155) focus:outline-none"
      />

      <div className="flex flex-wrap items-center gap-2 px-3 pb-3 pt-1">
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.cs,.go,.rs,.php,.rb,.swift,.kt"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          title="Attach a file"
          aria-label="Attach a file"
          className="p-2 rounded-lg text-(color:--c-64748b) hover:text-(color:--c-818cf8) hover:bg-(color:--c-1e293b)/50 transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>

        <Dropdown
          value={language}
          onChange={onLanguageChange}
          options={LANGUAGE_OPTIONS}
          ariaLabel="Language"
          className="w-36"
        />

        <input
          type="text"
          value={filename}
          onChange={(e) => onFilenameChange(e.target.value)}
          placeholder="snippet.js"
          aria-label="Filename"
          className="w-32 rounded-lg border border-(color:--ink)/10 bg-(color:--ink)/5 px-2.5 py-1.5 text-[11px] font-mono text-(color:--c-e2e8f0) placeholder-(color:--c-475569) focus:outline-none focus:border-(color:--c-818cf8)/50"
        />

        <div className="flex flex-wrap items-center gap-1" role="radiogroup" aria-label="Review focus">
          {FOCUS_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={focus === opt.id}
              onClick={() => onFocusChange(opt.id)}
              className={`px-2.5 py-1 text-[11px] font-mono rounded-full border transition-colors cursor-pointer ${
                focus === opt.id
                  ? 'bg-(color:--c-818cf8)/15 text-(color:--c-a5b4fc) border-(color:--c-818cf8)/50'
                  : 'text-(color:--c-64748b) border-(color:--ink)/10 hover:text-(color:--c-94a3b8)'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <Dropdown
          value={level}
          onChange={(v) => onLevelChange(v as ExplanationLevel)}
          options={LEVEL_OPTIONS}
          ariaLabel="Explanation level"
          prefix="Explain:"
          className="w-44"
        />

        <div className="ml-auto flex items-center gap-3">
          <span className={`text-[10px] font-mono ${tooLong ? 'text-(color:--c-f87171)' : 'text-(color:--c-475569)'}`}>
            {code.length.toLocaleString()} / {MAX_CODE_LENGTH.toLocaleString()}
          </span>
          <span className="hidden xl:inline text-[10px] font-mono text-(color:--c-64748b)">
            Enter to send · Shift+Enter for new line
          </span>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSend}
            aria-label="Run review"
            className="w-9 h-9 rounded-full bg-(color:--c-a5b4fc) hover:bg-(color:--c-818cf8) active:bg-(color:--c-6366f1) text-(color:--c-0f172a) flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy ? (
              <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-6 6m6-6l6 6" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
