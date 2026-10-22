'use client';

import { useState } from 'react';
import LanguageIcon from '@/components/LanguageIcon';
import ThemeToggle from '@/components/ThemeToggle';
import { CodeSubmission } from '@/types';

interface HistorySidebarProps {
  submissions: CodeSubmission[];
  loading: boolean;
  activeId?: string;
  isAuthenticated: boolean;
  userName?: string;
  userEmail?: string;
  /** mobile drawer state; always visible from lg up */
  open: boolean;
  onClose: () => void;
  onNew: () => void;
  onSelect: (submission: CodeSubmission) => void;
  onDelete: (id: string) => void;
  onLogout: () => void;
  onSignIn: () => void;
}

function groupByDay(submissions: CodeSubmission[]) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

  const groups = { Today: [] as CodeSubmission[], Yesterday: [] as CodeSubmission[], Earlier: [] as CodeSubmission[] };
  for (const sub of submissions) {
    const t = new Date(sub.createdAt).getTime();
    if (t >= startOfToday) groups.Today.push(sub);
    else if (t >= startOfYesterday) groups.Yesterday.push(sub);
    else groups.Earlier.push(sub);
  }
  return groups;
}

export default function HistorySidebar({
  submissions,
  loading,
  activeId,
  isAuthenticated,
  userName,
  userEmail,
  open,
  onClose,
  onNew,
  onSelect,
  onDelete,
  onLogout,
  onSignIn,
}: HistorySidebarProps) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const filtered = q
    ? submissions.filter(
        (s) =>
          s.filename.toLowerCase().includes(q) ||
          s.language.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q)
      )
    : submissions;
  const groups = groupByDay(filtered);

  return (
    <>
      {/* Backdrop for the mobile drawer */}
      {open && (
        <button
          aria-label="Close menu"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/60 lg:hidden cursor-default"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] bg-(color:--c-090d16) border-r border-(color:--c-1e293b)/70 flex flex-col transition-transform duration-200 lg:static lg:w-[270px] lg:max-w-none lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-5 py-5">
          <svg className="w-6 h-6 text-(color:--c-818cf8)" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" fillOpacity="0.1" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h4" />
          </svg>
          <span className="text-xl font-bold tracking-tight text-(color:--ink)">Recti Code</span>
          <ThemeToggle className="ml-auto" />
        </div>

        <div className="px-3 pb-3">
          <button
            onClick={() => {
              onNew();
              onClose();
            }}
            className="w-full py-3 rounded-xl border border-(color:--c-1e293b) hover:border-(color:--c-818cf8)/50 hover:bg-(color:--c-818cf8)/5 text-base font-medium text-(color:--ink) flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New review
          </button>
        </div>

        {isAuthenticated && (
          <div className="px-3 pb-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reviews…"
              aria-label="Search reviews"
              className="w-full rounded-lg bg-(color:--c-0d121f) border border-(color:--c-1e293b)/70 px-3 py-2.5 text-sm text-(color:--ink) placeholder-(color:--c-334155) focus:outline-none focus:border-(color:--c-818cf8)/50"
            />
          </div>
        )}

        {/* History */}
        <nav className="flex-1 overflow-y-auto px-2 pb-2" aria-label="Review history">
          {!isAuthenticated ? (
            <p className="px-3 py-6 text-sm text-(color:--c-64748b) leading-relaxed">
              Sign in to save your reviews and find them here later.
            </p>
          ) : loading ? (
            <p className="px-3 py-6 text-sm font-mono text-(color:--c-64748b)">Loading history…</p>
          ) : filtered.length === 0 ? (
            <p className="px-3 py-6 text-sm text-(color:--c-64748b)">
              {submissions.length === 0 ? 'No reviews yet.' : 'No matches.'}
            </p>
          ) : (
            (Object.keys(groups) as (keyof typeof groups)[]).map((title) =>
              groups[title].length === 0 ? null : (
                <div key={title} className="mb-3">
                  <div className="px-3 py-1.5 text-xs font-mono font-bold tracking-widest text-(color:--c-475569) uppercase">
                    {title}
                  </div>
                  {groups[title].map((sub) => (
                    <div
                      key={sub._id}
                      className={`group flex items-center gap-2.5 rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${
                        sub._id === activeId ? 'bg-(color:--c-1e293b)/60' : 'hover:bg-(color:--c-1e293b)/30'
                      }`}
                      onClick={() => {
                        onSelect(sub);
                        onClose();
                      }}
                    >
                      <LanguageIcon language={sub.language} className="w-5 h-5 shrink-0" />
                      <span className="flex-1 truncate text-sm text-(color:--c-cbd5e1)">{sub.filename}</span>
                      {sub.status === 'processing' && (
                        <span className="w-2 h-2 rounded-full bg-(color:--c-818cf8) animate-pulse" aria-label="In progress" />
                      )}
                      <button
                        aria-label={`Delete ${sub.filename}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (sub._id) onDelete(sub._id);
                        }}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-(color:--c-64748b) hover:text-(color:--c-f87171) transition-opacity cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )
            )
          )}
        </nav>

        {/* Account */}
        <div className="border-t border-(color:--c-1e293b)/60 p-3">
          {isAuthenticated ? (
            /* Who is signed in, filled from their account (updates the moment they log in) */
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl border border-(color:--c-818cf8)/25 bg-(color:--c-818cf8)/5 px-3 py-3">
                <div className="shrink-0 w-10 h-10 rounded-full bg-(color:--c-818cf8)/15 border border-(color:--c-818cf8)/40 flex items-center justify-center text-sm font-bold text-(color:--c-818cf8)">
                  {(userName || 'U').trim().substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-(color:--c-64748b)">Signed in as</p>
                  <p className="truncate text-base font-semibold text-(color:--ink)" title={userEmail || userName}>
                    {userName}
                  </p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="w-full py-2.5 rounded-xl border border-(color:--c-1e293b) text-sm font-medium text-(color:--c-94a3b8) hover:text-(color:--c-f87171) hover:border-(color:--c-f87171)/40 hover:bg-(color:--c-f87171)/5 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Log out
              </button>
            </div>
          ) : (
            <button
              onClick={onSignIn}
              className="w-full py-3 rounded-xl bg-(color:--c-6366f1) hover:bg-(color:--c-4f46e5) text-(color:--on-accent) text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Sign in / Sign up
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
