"use client";

import * as React from "react";
import { Check, ChevronDown, GitFork } from "lucide-react";
import type { BranchingReasoningStatus, ReasoningBranch } from "@/components/ui/branching-reasoning-chat-input";

// The branch deck from the "Branching Reasoning Chat Input" component (21st.dev, DHxWhy, MIT),
// lifted out so it can sit inside our review messages. Changes from the original: bigger cards and
// text, and two columns when there are four approaches.

type CardPosition = { left: number; top: number; width: number; height: number; angle: number; opacity: number };

const MOVE_MS = 520;
const EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
const CARD_HEIGHT = 172;
const ROW_STEP = 188;
const FOLDED_CARD_HEIGHT = 108;

function boundedScore(score?: number) {
  return typeof score === "number" && Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : undefined;
}

export interface BranchDeckProps {
  status: Exclude<BranchingReasoningStatus, "idle">;
  branches: ReasoningBranch[];
}

export default function BranchDeck({ status, branches }: BranchDeckProps) {
  const [expanded, setExpanded] = React.useState(false);
  const [reduced, setReduced] = React.useState(true);
  const deck = React.useRef(null as HTMLDivElement | null);
  const shimmer = React.useRef(null as HTMLSpanElement | null);
  const positions = React.useRef({} as { [id: string]: CardPosition });
  const animations = React.useRef([] as Animation[]);
  const deckId = React.useId();

  const chosen = branches.find((branch) => branch.chosen);
  const open = status === "branching" || !chosen || expanded;
  const otherCount = Math.max(0, branches.length - 1);
  const count = branches.length;
  const columns = count === 4 ? 2 : Math.min(Math.max(count, 1), 3);
  const rows = Math.max(1, Math.ceil(count / columns));
  const heading =
    chosen && status !== "branching"
      ? `Most important: ${chosen.title}`
      : status === "done"
        ? "Approaches considered"
        : count > 0
          ? `Considering ${count} ${count === 1 ? "approach" : "approaches"}`
          : "Finding a few ways forward";
  const layoutKey = `${open}:${chosen?.id ?? ""}:${branches.map((branch) => branch.id).join("|")}`;

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  // FLIP: measure the final layout, invert to the previous geometry, then play.
  React.useLayoutEffect(() => {
    animations.current.forEach((animation) => animation.cancel());
    animations.current = [];
    const next: { [id: string]: CardPosition } = {};
    deck.current?.querySelectorAll("[data-branch]").forEach((element, index) => {
      const node = element as HTMLElement;
      const id = node.dataset.branch!;
      const to = {
        left: node.offsetLeft,
        top: node.offsetTop,
        width: node.offsetWidth,
        height: node.offsetHeight,
        angle: Number(node.dataset.angle),
        opacity: Number(node.style.opacity),
      };
      next[id] = to;
      const from = positions.current[id];
      if (reduced || typeof node.animate !== "function" || !to.width || !to.height) return;
      const start = from
        ? {
            transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) rotate(${from.angle}deg) scale(${from.width / to.width}, ${from.height / to.height})`,
            opacity: from.opacity,
          }
        : {
            transform: `translate(${(deck.current!.clientWidth - to.width) / 2 - to.left}px, 22px) rotate(0deg) scale(0.86)`,
            opacity: 0,
          };
      animations.current.push(
        node.animate([start, { transform: `translate(0px, 0px) rotate(${to.angle}deg) scale(1)`, opacity: to.opacity }], {
          duration: MOVE_MS,
          delay: from ? 0 : index * 35,
          easing: EASING,
          fill: "backwards",
        })
      );
    });
    positions.current = next;
    return () => animations.current.forEach((animation) => animation.cancel());
  }, [layoutKey, reduced]);

  React.useEffect(() => {
    if (status !== "branching" || reduced || !shimmer.current) return;
    const animation = shimmer.current.animate([{ backgroundPosition: "100% 0" }, { backgroundPosition: "0% 0" }], {
      duration: 1600,
      iterations: Infinity,
      easing: "linear",
    });
    return () => animation.cancel();
  }, [status, reduced]);

  return (
    <div data-assistant>
      <div className="flex min-h-6 items-center gap-2 text-sm">
        {chosen && status !== "branching" ? (
          <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />
        ) : (
          <GitFork className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        )}
        <span
          ref={shimmer}
          className={`font-medium [overflow-wrap:anywhere] ${
            status === "branching" && !reduced
              ? "bg-[linear-gradient(100deg,var(--color-muted-foreground)_25%,var(--color-foreground)_50%,var(--color-muted-foreground)_75%)] bg-[length:240%_100%] bg-clip-text text-transparent"
              : "text-muted-foreground"
          }`}
        >
          {heading}
        </span>
      </div>

      <div
        ref={deck}
        id={deckId}
        data-open={open}
        role="group"
        aria-label="Approaches"
        className="relative mx-1"
        style={{ height: count > 0 ? (open ? 28 + rows * ROW_STEP : FOLDED_CARD_HEIGHT + 16) : 24 }}
      >
        {branches.map((branch, index) => {
          const selected = branch.id === chosen?.id;
          const folded = !open && !selected;
          const column = index % columns;
          const row = Math.floor(index / columns);
          const visibleColumns = Math.min(count, columns);
          const angle = open ? (column - (visibleColumns - 1) / 2) * 4 : 0;
          const score = boundedScore(branch.score);
          const highlighted = selected && status !== "branching";
          return (
            <div
              key={branch.id}
              data-branch={branch.id}
              data-selected={selected}
              data-angle={angle}
              aria-hidden={folded || undefined}
              inert={folded || undefined}
              className={`absolute flex flex-col rounded-2xl border p-4 shadow-md shadow-primary/5 ${
                highlighted ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-card-foreground"
              }`}
              style={{
                left: open ? `${2 + column * (96 / visibleColumns)}%` : "8%",
                top: open ? 20 + Math.abs(angle) * 1.2 + row * ROW_STEP : 8,
                width: open ? `${96 / visibleColumns - 2}%` : "84%",
                height: open ? CARD_HEIGHT : FOLDED_CARD_HEIGHT,
                transform: `rotate(${angle}deg)`,
                transformOrigin: "top left",
                opacity: folded ? 0 : 1,
                zIndex: selected ? 4 : index + 1,
                pointerEvents: folded ? "none" : "auto",
              }}
            >
              <div
                className={`mb-2 flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.12em] ${
                  highlighted ? "text-primary-foreground/70" : "text-muted-foreground"
                }`}
              >
                <span>{highlighted ? "Most important" : `Approach 0${index + 1}`}</span>
                {highlighted && <Check className="size-3.5" aria-hidden="true" />}
              </div>
              <p className="text-lg font-semibold leading-tight [overflow-wrap:anywhere]">{branch.title}</p>
              {open && (
                <p
                  className={`mt-1.5 text-sm leading-snug [overflow-wrap:anywhere] ${
                    highlighted ? "text-primary-foreground/80" : "text-muted-foreground"
                  }`}
                >
                  {branch.note}
                </p>
              )}
              <div className="mt-auto flex items-center gap-2.5 pt-3">
                <div
                  role="progressbar"
                  aria-label={`${branch.title} score`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={score}
                  className={`h-1.5 flex-1 overflow-hidden rounded-full ${highlighted ? "bg-primary-foreground/20" : "bg-muted"}`}
                >
                  <div
                    className={`h-full rounded-full ${highlighted ? "bg-primary-foreground" : "bg-primary"}`}
                    style={{ width: `${score ?? 0}%`, transition: reduced ? "none" : "width 180ms linear" }}
                  />
                </div>
                <span className="w-7 text-right font-mono text-xs tabular-nums">
                  {score === undefined ? "—" : Math.round(score)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {chosen && status !== "branching" && otherCount > 0 && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={deckId}
          onClick={() => setExpanded(!expanded)}
          className="flex min-h-7 items-center gap-1.5 rounded-md px-1 text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
        >
          <ChevronDown
            className={`size-3.5 transition-transform motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
          {expanded ? "Hide" : otherCount} {expanded ? "other approaches" : `other ${otherCount === 1 ? "approach" : "approaches"}`}
        </button>
      )}
    </div>
  );
}
