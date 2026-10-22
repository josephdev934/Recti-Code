'use client';

import { useEffect, useRef, useState } from 'react';

interface StreamingTextProps {
  text: string;
  /** false renders the whole text immediately (history, reduced motion) */
  animate?: boolean;
  /** how long the full reveal should take, in ms */
  duration?: number;
  onDone?: () => void;
  className?: string;
}

// Reveals text progressively, like a model streaming its answer
export default function StreamingText({
  text,
  animate = true,
  duration = 1800,
  onDone,
  className,
}: StreamingTextProps) {
  const [shown, setShown] = useState(animate ? 0 : text.length);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!animate || reduced || text.length === 0) {
      setShown(text.length);
      onDoneRef.current?.();
      return;
    }

    setShown(0);
    const tick = 24;
    const step = Math.max(1, Math.ceil(text.length / (duration / tick)));
    const id = setInterval(() => {
      setShown((n) => {
        const next = Math.min(text.length, n + step);
        if (next >= text.length) {
          clearInterval(id);
          // Defer so the parent doesn't update during our state update
          setTimeout(() => onDoneRef.current?.(), 0);
        }
        return next;
      });
    }, tick);
    return () => clearInterval(id);
  }, [text, animate, duration]);

  const done = shown >= text.length;

  return (
    <span className={className}>
      {text.slice(0, shown)}
      {!done && <span className="inline-block w-1.5 h-3.5 ml-0.5 align-middle bg-(color:--c-818cf8) cursor-blink" />}
    </span>
  );
}
