'use client';

import { useState } from 'react';
import { Severity } from '@/types';

const SEVERITY_STYLES: Record<Severity, string> = {
  critical: 'bg-(color:--c-ef4444)/15 text-(color:--c-f87171) border-(color:--c-ef4444)/40',
  high: 'bg-(color:--c-f97316)/15 text-(color:--c-fb923c) border-(color:--c-f97316)/40',
  medium: 'bg-(color:--c-eab308)/15 text-(color:--c-facc15) border-(color:--c-eab308)/40',
  low: 'bg-(color:--c-3b82f6)/15 text-(color:--c-60a5fa) border-(color:--c-3b82f6)/40',
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={`px-1.5 py-0.5 text-[8px] font-mono font-extrabold tracking-wider uppercase rounded border ${SEVERITY_STYLES[severity]}`}
    >
      {severity}
    </span>
  );
}

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (insecure context, permissions); nothing useful to show
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded border transition-colors cursor-pointer ${
        copied
          ? 'text-(color:--c-34d399) border-(color:--c-34d399)/30 bg-(color:--c-34d399)/5'
          : 'text-(color:--c-94a3b8) border-(color:--c-1e293b) hover:text-(color:--c-818cf8) hover:border-(color:--c-818cf8)/40'
      }`}
    >
      {copied ? 'Copied' : label}
    </button>
  );
}

// The fix text is what the AI returned, so it's shown as-is (not as a fake diff)
export function FixBlock({ fix }: { fix: string }) {
  if (!fix || !fix.trim()) return null;

  return (
    <div className="bg-(color:--c-060910) border border-(color:--c-1e293b)/50 rounded-lg overflow-hidden font-mono text-[13px] leading-relaxed">
      <div className="flex items-center justify-between px-4 py-2 border-b border-(color:--c-1e293b)/40">
        <span className="text-[10px] font-bold tracking-widest text-(color:--c-34d399) uppercase">Suggested fix</span>
        <CopyButton text={fix} />
      </div>
      <pre className="bg-(color:--c-10b981)/5 text-(color:--c-34d399) border-l-2 border-(color:--c-10b981) px-4 py-3 whitespace-pre overflow-x-auto select-text">
        {fix}
      </pre>
    </div>
  );
}
