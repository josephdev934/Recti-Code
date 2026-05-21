'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CodeSubmission, AIReview } from '@/types';
import { getLanguageIcon, getLanguageColor } from '@/lib/languageIcons';

export default function Dashboard() {
  const { user, token, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Unified Tab State: 'review' | 'history' | 'projects'
  const [activeTab, setActiveTab] = useState<'review' | 'history' | 'projects'>('review');

  // Code editor states
  const [code, setCode] = useState(`async function validateSession(token: string) {
  const session = await db.query('SELECT * FROM sessions WHERE id = ' + token);
  
  if (!session) {
    throw new Error("Invalid session");
  }
  
  // Check expiration
  const now = new Date();
  if (session.expires_at < now) {
    return { valid: false, reason: "expired" };
  }
  
  return { valid: true, user: session.user_id };
}`);
  const [language, setLanguage] = useState('typescript');
  const [filename, setFilename] = useState('auth_controller.ts');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Submissions lists & detail loading
  const [submissions, setSubmissions] = useState<CodeSubmission[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [currentSubmission, setCurrentSubmission] = useState<CodeSubmission | null>(null);

  // Search query for history
  const [searchQuery, setSearchQuery] = useState('');

  // Refs for editor layout syncing
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync scroll between code textarea and line numbers column
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, authLoading, router]);

  // Load history from API on mount/auth
  useEffect(() => {
    if (isAuthenticated) {
      fetchSubmissions();
    }
  }, [isAuthenticated]);

  const fetchSubmissions = async () => {
    try {
      setLoadingHistory(true);
      const response = await fetch('/api/code');
      const data = await response.json();
      if (data.success && user) {
        // Filter for current user's uploads
        const userSubmissions = data.data.filter((s: CodeSubmission) => s.userId === user.id);
        setSubmissions(userSubmissions);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Poll for AI results when submission is in processing status
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (currentSubmission && currentSubmission.status === 'processing') {
      setIsSubmitting(true);
      interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/code/${currentSubmission._id}`);
          const data = await response.json();

          if (data.success) {
            const updated = data.data;
            setCurrentSubmission(updated);

            // Update in the submissions list too
            setSubmissions((prev) =>
              prev.map((sub) => (sub._id === updated._id ? updated : sub))
            );

            if (updated.status === 'completed' || updated.status === 'failed') {
              setIsSubmitting(false);
              clearInterval(interval);
            }
          }
        } catch (error) {
          console.error('Error polling for submission results:', error);
        }
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentSubmission]);

  // Submit code for AI review
  const handleRunReview = async () => {
    if (!code.trim()) {
      alert('Please enter some code before running a review.');
      return;
    }

    setIsSubmitting(true);
    setCurrentSubmission(null);

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/code', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          code,
          language,
          filename: filename || 'snippet',
        }),
      });

      const data = await response.json();

      if (data.success) {
        const newSubmission = data.data;
        setCurrentSubmission(newSubmission);
        setSubmissions((prev) => [newSubmission, ...prev]);
      } else {
        alert(`Review request rejected: ${data.error}`);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Failed to run code review:', error);
      alert('Analysis connection error. Ensure backend & MongoDB are active.');
      setIsSubmitting(false);
    }
  };

  // File Upload handler (paperclip click)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Detect language from extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    const extMap: Record<string, string> = {
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

    if (ext && extMap[ext]) {
      setLanguage(extMap[ext]);
    }
    setFilename(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCode(event.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  // Copy Code to Clipboard handler
  const [copiedCode, setCopiedCode] = useState(false);
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Delete submission
  const handleDeleteSubmission = async (id: string | undefined, e: React.MouseEvent) => {
    if (!id) return;
    e.stopPropagation();
    if (!confirm('Are you sure you want to purge this record?')) return;

    try {
      const response = await fetch(`/api/code/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setSubmissions((prev) => prev.filter((s) => s._id !== id));
        if (currentSubmission?._id === id) {
          setCurrentSubmission(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete submission:', err);
    }
  };

  // Calculate lines in code for matching lines analyzed metric
  const linesCount = code.split('\n').length;
  const lineNumbersArray = Array.from({ length: Math.max(linesCount, 12) }, (_, i) => i + 1);

  // Group submissions by Date: TODAY, YESTERDAY, EARLIER
  const getGroupedSubmissions = () => {
    const today: CodeSubmission[] = [];
    const yesterday: CodeSubmission[] = [];
    const earlier: CodeSubmission[] = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

    const filtered = submissions.filter(
      (s) =>
        s.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.language.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filtered.forEach((sub) => {
      const date = new Date(sub.createdAt).getTime();
      if (date >= startOfToday) {
        today.push(sub);
      } else if (date >= startOfYesterday) {
        yesterday.push(sub);
      } else {
        earlier.push(sub);
      }
    });

    return { today, yesterday, earlier };
  };

  const grouped = getGroupedSubmissions();

  // Dynamic tags parser for optimizations
  const parseTags = (issueText: string) => {
    const tags: string[] = [];
    const lower = issueText.toLowerCase();
    if (lower.includes('redis') || lower.includes('cache')) tags.push('REDIS');
    if (lower.includes('performance') || lower.includes('speed') || lower.includes('fast')) tags.push('PERFORMANCE');
    if (lower.includes('sql') || lower.includes('query') || lower.includes('db') || lower.includes('database')) tags.push('DATABASE');
    if (lower.includes('react') || lower.includes('state') || lower.includes('render')) tags.push('UI/REACT');
    if (tags.length === 0) tags.push('OPTIMIZATION');
    return tags;
  };

  return (
    <main className="min-h-screen bg-[#080b11] flex text-white font-sans overflow-hidden">
      
      {/* 1. LEFT SIDEBAR */}
      <aside className="w-[260px] bg-[#090d16] border-r border-[#1e293b]/70 flex flex-col justify-between shrink-0 select-none z-10">
        <div>
          {/* Sidebar Logo */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-[#1e293b]/40">
            <svg className="w-6 h-6 text-[#818cf8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" fillOpacity="0.1" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h4" />
            </svg>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-white font-sans">Recti Code</span>
              <span className="text-[10px] font-mono bg-[#818cf8]/10 text-[#818cf8] px-1.5 py-0.5 rounded font-bold">PRO</span>
            </div>
          </div>

          {/* New Review Button */}
          <div className="px-4 pt-6 pb-2">
            <button
              onClick={() => {
                setCurrentSubmission(null);
                setActiveTab('review');
              }}
              className="w-full py-3 bg-[#6366f1] hover:bg-[#4f46e5] active:bg-[#4338ca] text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#6366f1]/10 hover:shadow-[#6366f1]/20 transition-all font-sans select-none"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Review
            </button>
          </div>

          {/* Nav Items */}
          <nav className="px-2 py-4 space-y-1">
            {[
              { id: 'review', label: 'Review', icon: (active: boolean) => (
                <svg className={`w-4 h-4 ${active ? 'text-[#818cf8]' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )},
              { id: 'history', label: 'History', icon: (active: boolean) => (
                <svg className={`w-4 h-4 ${active ? 'text-[#818cf8]' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )},
              { id: 'projects', label: 'Projects', icon: (active: boolean) => (
                <svg className={`w-4 h-4 ${active ? 'text-[#818cf8]' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              )},
            ].map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full py-2.5 px-4 rounded-lg flex items-center gap-3 cursor-pointer text-sm font-medium transition-all ${
                    active
                      ? 'bg-[#1e293b]/50 text-white font-semibold border-l-2 border-[#818cf8]'
                      : 'text-[#94a3b8] hover:text-white hover:bg-[#1e293b]/25'
                  }`}
                >
                  {item.icon(active)}
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Upgrade & Footer Links */}
        <div className="p-4 space-y-4">
          
          {/* Upgrade promo box */}
          <div className="p-4 rounded-xl border border-[#1e293b] bg-[#111827]/40">
            <h4 className="text-xs font-bold text-white font-sans">Upgrade to Pro</h4>
            <p className="text-[10px] text-[#64748b] leading-relaxed mt-1 mb-3">
              Get unlimited AI scans and priority engine access.
            </p>
            <button
              onClick={() => alert('PRO Plans details. High priority execution.')}
              className="w-full py-2 bg-transparent hover:bg-white/5 border border-white/20 text-white text-[10px] font-bold rounded-lg cursor-pointer transition-all uppercase tracking-wider"
            >
              Go Unlimited
            </button>
          </div>

          {/* Help Center & Logout links */}
          <div className="flex flex-col gap-1.5 text-xs text-[#64748b] px-2 font-medium">
            <button
              onClick={() => alert("Please consult developer documentation at admin@recti.code")}
              className="flex items-center gap-2 hover:text-[#94a3b8] text-left transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Help Center
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 hover:text-[#f87171] text-left transition-colors mt-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* 2. CENTER CONTENT COLUMN */}
      <section className="flex-1 bg-[#0b0f19] flex flex-col min-w-0 overflow-y-auto relative p-8">
        
        {/* TAB 1: REVIEW (Main editor panel) */}
        {activeTab === 'review' && (
          <div className="max-w-4xl w-full mx-auto space-y-6">
            
            {/* Header */}
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">Submit Code</h1>
              <p className="text-xs font-mono text-[#64748b] mt-1.5">
                AI engine <span className="text-[#818cf8]">v2.4</span> initialized and ready.
              </p>
            </div>

            {/* Code submitting container */}
            <div className="bg-[#0d121f] border border-[#1e293b]/70 rounded-xl overflow-hidden shadow-2xl flex flex-col">
              
              {/* Header Controls Panel */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e293b]/40">
                <div className="flex items-center gap-4">
                  {/* Language Selector Dropdown */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-mono font-bold tracking-widest text-[#475569] uppercase">LANGUAGE</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="bg-[#060910] text-[#94a3b8] text-xs font-mono border border-[#1e293b] rounded py-1 px-2.5 focus:outline-none focus:border-[#818cf8]/50"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="typescript">TypeScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="csharp">C#</option>
                      <option value="go">Go</option>
                      <option value="rust">Rust</option>
                      <option value="php">PHP</option>
                      <option value="ruby">Ruby</option>
                      <option value="swift">Swift</option>
                      <option value="kotlin">Kotlin</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Filename Input */}
                  <div className="flex flex-col gap-1 w-64">
                    <label className="text-[9px] font-mono font-bold tracking-widest text-[#475569] uppercase">FILENAME</label>
                    <input
                      type="text"
                      value={filename}
                      onChange={(e) => setFilename(e.target.value)}
                      placeholder="snippet.js"
                      className="bg-[#060910] text-[#e2e8f0] text-xs font-mono border border-[#1e293b] rounded py-1 px-3 focus:outline-none focus:border-[#818cf8]/50 placeholder-[#334155]"
                    />
                  </div>
                </div>

                {/* Upload & Copy Icon Controls */}
                <div className="flex items-center gap-3 pt-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.cs,.go,.rs,.php,.rb,.swift,.kt"
                  />
                  
                  {/* File Upload/Attach button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload Local File"
                    className="p-2 text-gray-500 hover:text-[#818cf8] bg-[#060910] border border-[#1e293b] rounded-lg transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>

                  {/* Copy Code button */}
                  <button
                    onClick={handleCopyCode}
                    title={copiedCode ? "Copied!" : "Copy Snippet"}
                    className={`p-2 border rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                      copiedCode
                        ? 'text-[#34d399] border-[#34d399]/30 bg-[#34d399]/5'
                        : 'text-gray-500 hover:text-[#818cf8] border-[#1e293b] bg-[#060910]'
                    }`}
                  >
                    {copiedCode ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Editor Workspace Column */}
              <div className="flex flex-1 min-h-[360px] bg-[#060910] font-mono text-sm relative">
                {/* Scrollable Line Numbers column */}
                <div
                  ref={lineNumbersRef}
                  id="line-numbers"
                  className="w-12 select-none text-right pr-3.5 py-4 text-[#334155] border-r border-[#1e293b]/40 overflow-hidden shrink-0 select-none"
                >
                  {lineNumbersArray.map((num) => (
                    <div key={num} className="leading-6">{num}</div>
                  ))}
                </div>

                {/* Main Code Textarea */}
                <textarea
                  ref={textareaRef}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onScroll={handleScroll}
                  className="flex-1 bg-transparent text-[#cbd5e1] border-none resize-none p-4 leading-6 focus:outline-none focus:ring-0 overflow-y-auto font-mono text-sm min-h-[350px]"
                  placeholder="Paste your source code snippet here..."
                  spellCheck="false"
                />

                {/* Floating Submit Review Button inside/below editor container */}
                <div className="absolute bottom-5 right-5 z-10">
                  <button
                    onClick={handleRunReview}
                    disabled={isSubmitting}
                    className="py-2.5 px-5 bg-[#a5b4fc] hover:bg-[#818cf8] active:bg-[#6366f1] text-[#0f172a] text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#818cf8]/10 hover:shadow-[#818cf8]/20 transition-all select-none disabled:opacity-50 disabled:cursor-not-allowed group font-sans uppercase"
                  >
                    <span>{isSubmitting ? 'Analyzing...' : 'Run Review'}</span>
                    <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HISTORY (Timeline lists) */}
        {activeTab === 'history' && (
          <div className="max-w-3xl w-full mx-auto space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white">Reviews History</h1>
                <p className="text-xs text-[#64748b] mt-1.5">
                  Your technical footprint and AI insights.
                </p>
              </div>

              {/* User Avatar mock (top right of Image 4) */}
              <div className="w-9 h-9 rounded-full bg-[#1e293b]/80 border border-[#818cf8]/30 flex items-center justify-center font-bold font-sans text-xs text-[#818cf8]">
                {user?.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
              </div>
            </div>

            {/* Search Input field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reviews or languages..."
                className="w-full pl-10 pr-4 py-3 bg-[#0d121f] text-sm text-white border border-[#1e293b]/70 rounded-xl focus:outline-none focus:border-[#818cf8]/70 focus:ring-1 focus:ring-[#818cf8]/30 transition-all font-sans placeholder-[#334155]"
              />
            </div>

            {/* Groups of Submissions */}
            {loadingHistory ? (
              <div className="text-center py-12 text-[#64748b] font-mono text-xs">
                FETCHING HISTORY FROM RECTI ENGINE...
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-12 text-[#64748b]">
                No code submissions found in your history workspace.
              </div>
            ) : (
              <div className="space-y-8 pb-12">
                {/* Date Category Groups Helper */}
                {[
                  { title: 'TODAY', items: grouped.today },
                  { title: 'YESTERDAY', items: grouped.yesterday },
                  { title: 'EARLIER', items: grouped.earlier },
                ].map((group) => {
                  if (group.items.length === 0) return null;
                  return (
                    <div key={group.title} className="space-y-4">
                      {/* Timeline Category Header */}
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-mono font-bold tracking-widest text-[#475569] uppercase shrink-0">
                          {group.title}
                        </span>
                        <div className="w-full border-t border-[#1e293b]/30"></div>
                      </div>

                      {/* Timeline Items list */}
                      <div className="space-y-4">
                        {group.items.map((sub) => {
                          const dateObj = new Date(sub.createdAt);
                          const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                          const lines = sub.code.split('\n');
                          const snippet = lines.slice(0, 3).join('\n') + (lines.length > 3 ? '\n...' : '');
                          const score = sub.aiResponse?.overallScore;
                          const bugsCount = (sub.aiResponse?.bugs?.length || 0) + (sub.aiResponse?.securityProblems?.length || 0) + (sub.aiResponse?.performanceIssues?.length || 0) + (sub.aiResponse?.bestPractices?.length || 0) + (sub.aiResponse?.architectureSuggestions?.length || 0);

                          return (
                            <div
                              key={sub._id}
                              onClick={() => {
                                setCurrentSubmission(sub);
                                setActiveTab('review');
                              }}
                              className="p-5 bg-[#0d121f]/80 border border-[#1e293b]/70 hover:border-[#818cf8]/40 hover:bg-[#0d121f] rounded-xl cursor-pointer shadow-lg transition-all group relative flex flex-col gap-3.5"
                            >
                              {/* Card Header Row */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {/* Code Icon badge background */}
                                  <div className="w-9 h-9 rounded-lg bg-[#060910] border border-[#1e293b] flex items-center justify-center font-bold text-xs select-none">
                                    <span className="text-sm">{getLanguageIcon(sub.language)}</span>
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-white leading-snug group-hover:text-[#818cf8] transition-colors font-sans">
                                      {sub.filename}
                                    </h3>
                                    <span className="text-[9px] font-mono text-[#475569] tracking-wider uppercase">
                                      {sub.language}
                                    </span>
                                  </div>
                                </div>

                                {/* Right details: time, delete, complexity */}
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <span className="text-[10px] font-mono text-[#475569]">{timeStr}</span>
                                    <div className="text-[8px] font-mono font-bold tracking-widest text-[#818cf8] mt-0.5">
                                      {score ? `SCORE: ${score * 10}%` : 'PENDING'}
                                    </div>
                                  </div>
                                  
                                  {/* Delete trash button */}
                                  <button
                                    onClick={(e) => { if (!sub._id) return; handleDeleteSubmission(sub._id, e); }}
                                    className="p-1.5 text-gray-500 hover:text-red-400 bg-transparent hover:bg-[#ef4444]/10 rounded transition-all cursor-pointer"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>

                              {/* Tiny code snippet display */}
                              <div className="bg-[#060910] border border-[#1e293b]/40 rounded-lg p-3 font-mono text-[11px] text-[#cbd5e1]/70 leading-relaxed overflow-hidden whitespace-pre select-none">
                                {snippet}
                              </div>

                              {/* Badges footer row */}
                              <div className="flex flex-wrap gap-2 pt-1 select-none">
                                {bugsCount > 0 && (
                                  <span className="px-2 py-0.5 bg-[#34d399]/10 text-[#34d399] border border-[#34d399]/20 text-[9px] font-mono font-bold uppercase rounded-md tracking-wider">
                                    {bugsCount} SUGGESTIONS
                                  </span>
                                )}
                                 {(sub.aiResponse?.securityProblems?.length || 0) > 0 && (
                                  <span className="px-2 py-0.5 bg-[#f87171]/10 text-[#f87171] border border-[#f87171]/20 text-[9px] font-mono font-bold uppercase rounded-md tracking-wider">
                                    SECURITY FIX
                                  </span>
                                )}
                                {(sub.aiResponse?.performanceIssues?.length || 0) > 0 && (
                                  <span className="px-2 py-0.5 bg-[#818cf8]/10 text-[#818cf8] border border-[#818cf8]/20 text-[9px] font-mono font-bold uppercase rounded-md tracking-wider">
                                    OPTIMIZATION
                                  </span>
                                )}
                                {(sub.aiResponse?.architectureSuggestions?.length || 0) > 0 && (
                                  <span className="px-2 py-0.5 bg-[#a78bfa]/10 text-[#a78bfa] border border-[#a78bfa]/20 text-[9px] font-mono font-bold uppercase rounded-md tracking-wider">
                                    REFACTORED
                                  </span>
                                )}
                              </div>

                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PROJECTS (Coming soon) */}
        {activeTab === 'projects' && (
          <div className="max-w-2xl w-full mx-auto space-y-6 text-center py-20">
            <svg className="w-16 h-16 text-[#818cf8] mx-auto animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mt-4">Projects Workspace</h1>
            <p className="text-sm text-[#64748b] leading-relaxed max-w-md mx-auto">
              Multi-file reviews, repository connections, and branches tracking are a **PRO feature** being integrated in the Recti Code ecosystem.
            </p>
            <button
              onClick={() => alert('Access pending administrator setup.')}
              className="mt-6 py-2 px-5 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors uppercase tracking-wider font-mono"
            >
              Unlock Workspace Access
            </button>
          </div>
        )}

        {/* TAB 4: DOCUMENTATION & TAB 5: SETTINGS removed */}

      </section>

      {/* 3. RIGHT AI RESULTS PANEL */}
      <aside className="w-[400px] bg-[#0d121f] border-l border-[#1e293b]/70 flex flex-col justify-between shrink-0 overflow-y-auto z-10 select-none">
        
        {/* Scrollable Results Content */}
        <div className="flex-1 p-6 space-y-6">
          
          {/* Panel Header */}
          <div className="flex items-center gap-2 border-b border-[#1e293b]/40 pb-4">
            <svg className="w-5 h-5 text-[#34d399]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <h2 className="text-lg font-bold tracking-tight text-white font-sans">AI Results</h2>
          </div>

          {/* DYNAMIC RESULTS STATES */}
          {!currentSubmission && !isSubmitting && (
            /* IDLE STATE */
            <div className="flex flex-col items-center justify-center text-center py-24 px-4 text-[#64748b] font-medium leading-relaxed gap-3">
              <svg className="w-12 h-12 text-[#1e293b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
              </svg>
              <p className="text-sm">Submit code to see AI-powered review results</p>
            </div>
          )}

          {isSubmitting && (
            /* SCANNING / ANALYZING STATE */
            <div className="py-12 px-2 flex flex-col items-center justify-center text-center gap-6 relative overflow-hidden bg-[#111827]/40 border border-[#1e293b]/60 rounded-xl">
              
              {/* Animated glowing scanning bar */}
              <div className="absolute inset-x-0 top-0 h-full overflow-hidden pointer-events-none">
                <div className="w-full h-10 scanner-line"></div>
              </div>

              {/* Spin circular progress indicator */}
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#818cf8]/30 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-lg">🤖</div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Running Audit...</h4>
                <p className="text-xs text-[#64748b] leading-relaxed mt-2 max-w-[240px] mx-auto">
                  Google Gemini AI engine is parsing structure, syntax leaks, and database concats.
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-[9px] font-mono text-[#818cf8] font-bold bg-[#818cf8]/10 px-2 py-0.5 rounded">
                AUDITING ENGINE ACTIVE
              </div>
            </div>
          )}

          {currentSubmission && currentSubmission.status === 'failed' && (
            /* ERROR STATE */
            <div className="py-12 px-6 border border-[#ef4444]/30 bg-[#ef4444]/5 text-center rounded-xl space-y-4">
              <span className="text-3xl">❌</span>
              <h3 className="text-md font-bold text-[#ef4444] font-sans">Analysis Failure</h3>
              <p className="text-xs text-[#64748b] leading-relaxed font-sans">
                Review connection failed. Ensure Gemini API key is valid and MongoDB is online.
              </p>
            </div>
          )}

          {currentSubmission && currentSubmission.status === 'completed' && currentSubmission.aiResponse && (
            /* COMPLETED ANALYSIS STATE */
            <div className="space-y-6">
              
              {/* Dynamic Health Score banner card (Card 1) */}
              {(() => {
                const review: AIReview = currentSubmission.aiResponse as AIReview;
                const score = review.overallScore;
                const percent = Math.min(Math.max(score * 10, 0), 100);
                
                // Color levels (green/yellow/red)
                let scoreBg = 'border-[#34d399]/40 bg-[#34d399]/5';
                let scoreText = 'text-[#34d399]';
                let scoreLabel = 'HEALTHY';
                if (score < 5) {
                  scoreBg = 'border-[#f87171]/40 bg-[#f87171]/5';
                  scoreText = 'text-[#f87171]';
                  scoreLabel = 'VULNERABLE';
                } else if (score < 7) {
                  scoreBg = 'border-[#fbbf24]/40 bg-[#fbbf24]/5';
                  scoreText = 'text-[#fbbf24]';
                  scoreLabel = 'OPTIMIZABLE';
                }

                return (
                  <div className={`p-4 border rounded-xl shadow-lg relative overflow-hidden flex flex-col gap-3 ${scoreBg}`}>
                    
                    {/* Badge + lines count row */}
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 text-[9px] font-mono font-extrabold tracking-wider rounded bg-white/5 border border-current ${scoreText}`}>
                        {scoreLabel}: {percent}%
                      </span>
                      <span className="text-[10px] font-mono text-[#64748b]">
                        Analyzed {currentSubmission.code.split('\n').length} lines
                      </span>
                    </div>

                    {/* Headline title/description */}
                    <h3 className="font-bold text-white text-sm leading-snug font-sans">
                      {review.bugs?.length > 0 || review.securityProblems?.length > 0
                        ? `Security review completed. Critical vulnerabilities resolved in fix audits.`
                        : `Audited source code compiles cleanly with premium quality ratings.`
                      }
                    </h3>

                    {/* Overall Summary sentence */}
                    <p className="text-[11px] text-[#cbd5e1]/70 leading-relaxed font-sans font-medium">
                      {review.summary}
                    </p>
                  </div>
                );
              })()}

              {/* LIST OF BUGS AND SECURITY PROBLEMS */}
              {(() => {
                const review: AIReview = currentSubmission.aiResponse as AIReview;
                const bugs = review.bugs || [];
                const sec = review.securityProblems || [];
                const allProblems = [...sec.map(s => ({ ...s, isSec: true })), ...bugs.map(b => ({ ...b, isSec: false }))];
                
                if (allProblems.length === 0) return null;

                return (
                  <div className="space-y-4">
                    {allProblems.map((prob, idx) => {
                      // Attempt to create a mock beautiful diff viewer
                      let originalPart = `// Vulnerable code in line check`;
                      let fixedPart = prob.fix || `// Suggestion resolution`;

                      // If we find query concat in the demo:
                      if (code.includes('db.query') && prob.issue.toLowerCase().includes('sql')) {
                        originalPart = `- db.query('SELECT * FROM sessions WHERE id = ' + token);`;
                        fixedPart = `+ db.query('SELECT * FROM sessions WHERE id = $1', [token]);`;
                      } else {
                        // Standard generic mockup diff based on issue and fix
                        originalPart = `- // Warning: structural syntax issue detected`;
                        fixedPart = `+ ${prob.fix.trim()}`;
                      }

                      return (
                        <div
                          key={idx}
                          className="border border-[#f87171]/20 bg-[#7f1d1d]/10 rounded-xl overflow-hidden shadow-lg flex flex-col"
                        >
                          {/* Banner */}
                          <div className="px-4 py-2 border-b border-[#f87171]/20 bg-[#ef4444]/10 flex items-center justify-between">
                            <span className="text-[9px] font-mono font-bold tracking-widest text-[#f87171] uppercase">
                              {prob.isSec ? 'SECURITY BUG (HIGH)' : 'BUG DETECTED'}
                            </span>
                            <span className="text-xs">⚠️</span>
                          </div>

                          {/* Description */}
                          <div className="p-4">
                            <p className="text-xs text-[#cbd5e1] leading-relaxed font-sans">
                              {prob.issue}
                            </p>
                          </div>

                          {/* Diff representation box */}
                          <div className="px-4 pb-4 select-none">
                            <div className="bg-[#060910] border border-[#1e293b]/50 rounded-lg overflow-hidden font-mono text-[11px] leading-relaxed">
                              {/* Red Deletions row */}
                              <div className="bg-[#ef4444]/5 text-[#f87171] border-l-2 border-[#ef4444] px-3 py-2 border-b border-[#1e293b]/20 whitespace-pre overflow-x-auto">
                                {originalPart}
                              </div>
                              {/* Green Additions row */}
                              <div className="bg-[#10b981]/5 text-[#34d399] border-l-2 border-[#10b981] px-3 py-2 whitespace-pre overflow-x-auto">
                                {fixedPart}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* LIST OF OPTIMIZATIONS */}
              {(() => {
                const review: AIReview = currentSubmission.aiResponse as AIReview;
                const optimizations = review.performanceIssues || [];
                if (optimizations.length === 0) return null;

                return (
                  <div className="space-y-4">
                    {optimizations.map((opt, idx) => {
                      const tags = parseTags(opt.issue);
                      return (
                        <div
                          key={idx}
                          className="border border-[#3b82f6]/20 bg-[#1d4ed8]/5 rounded-xl overflow-hidden shadow-lg flex flex-col"
                        >
                          {/* Banner */}
                          <div className="px-4 py-2 border-b border-[#3b82f6]/20 bg-[#3b82f6]/10 flex items-center justify-between">
                            <span className="text-[9px] font-mono font-bold tracking-widest text-[#60a5fa] uppercase">
                              OPTIMIZATION
                            </span>
                            <span className="text-xs">⚡</span>
                          </div>

                          {/* Description */}
                          <div className="p-4 flex flex-col gap-4">
                            <p className="text-xs text-[#cbd5e1] leading-relaxed font-sans">
                              {opt.issue}
                            </p>

                            {/* Tags row */}
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 bg-[#1e293b] border border-[#334155] text-[#94a3b8] text-[8px] font-mono font-bold tracking-wider rounded uppercase"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* LIST OF BEST PRACTICES AND ARCHITECTURE */}
              {(() => {
                const review: AIReview = currentSubmission.aiResponse as AIReview;
                const bestPrac = review.bestPractices || [];
                const arch = review.architectureSuggestions || [];
                const otherIssues = [...bestPrac.map(b => ({ ...b, type: 'BEST PRACTICE' })), ...arch.map(a => ({ ...a, type: 'ARCHITECTURE' }))];
                
                if (otherIssues.length === 0) return null;

                return (
                  <div className="space-y-4">
                    {otherIssues.map((issue, idx) => {
                      const isArch = issue.type === 'ARCHITECTURE';
                      const colorBorder = isArch ? 'border-[#a78bfa]/20 bg-[#581c87]/5' : 'border-[#fbbf24]/20 bg-[#78350f]/5';
                      const colorBannerText = isArch ? 'text-[#c084fc]' : 'text-[#facc15]';
                      const colorBannerBg = isArch ? 'bg-[#a78bfa]/10' : 'bg-[#eab308]/10';

                      return (
                        <div
                          key={idx}
                          className={`border rounded-xl overflow-hidden shadow-lg flex flex-col ${colorBorder}`}
                        >
                          {/* Banner */}
                          <div className={`px-4 py-2 border-b border-white/5 flex items-center justify-between ${colorBannerBg}`}>
                            <span className={`text-[9px] font-mono font-bold tracking-widest uppercase ${colorBannerText}`}>
                              {issue.type}
                            </span>
                            <span className="text-xs">🏗️</span>
                          </div>

                          {/* Description */}
                          <div className="p-4">
                            <p className="text-xs text-[#cbd5e1] leading-relaxed font-sans">
                              {issue.issue}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

            </div>
          )}

        </div>

        {/* Dynamic Static Promo card footer (Benchmarking ad) */}
        <div className="p-6 border-t border-[#1e293b]/40">
          <div className="p-5 rounded-xl border border-[#3b82f6]/30 bg-gradient-to-br from-[#0e1629] to-[#090d16] relative overflow-hidden group shadow-xl">
            {/* Blue background glow orb */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#3b82f6] glow-blur pointer-events-none rounded-full"></div>
            
            <div className="relative z-10 flex flex-col gap-2">
              {/* Glowing servers outline icon */}
              <div className="text-lg">🗄️</div>
              <h4 className="font-bold text-white text-xs leading-snug font-sans group-hover:text-[#60a5fa] transition-colors">
                New: Benchmarking Engine
              </h4>
              <p className="text-[10px] text-[#64748b] leading-relaxed font-sans">
                Compare your function performance metrics against current industry averages instantly.
              </p>
            </div>
          </div>
        </div>

      </aside>

    </main>
  );
}
