"use client";
import { useEffect, useRef } from "react";

/** Presentation only: the accessible value always exposes the actual run score. */
export default function RunScore({ score }: { score: number }) {
  const node = useRef<HTMLSpanElement>(null), shown = useRef(0), completed = useRef(false);
  useEffect(() => {
    let raf = 0;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const paint = (n: number) => { shown.current = n; if (node.current) node.current.textContent = String(n).padStart(5, "0"); };
    const finish = () => { cancelAnimationFrame(raf); completed.current = true; paint(score); };
    const preference = () => { if (media.matches || document.hidden) finish(); };
    if (completed.current || media.matches || document.hidden) { finish(); return; }
    const from = shown.current, start = performance.now();
    paint(from);
    const frame = (at: number) => {
      const progress = Math.min(1, (at - start) / 620);
      paint(Math.round(from + (score - from) * (1 - (1 - progress) ** 3)));
      if (progress < 1) raf = requestAnimationFrame(frame);
      else completed.current = true;
    };
    raf = requestAnimationFrame(frame);
    media.addEventListener("change", preference);
    document.addEventListener("visibilitychange", preference);
    return () => {
      cancelAnimationFrame(raf);
      media.removeEventListener("change", preference);
      document.removeEventListener("visibilitychange", preference);
    };
  }, [score]);
  return <><span className="sr-only">{score} points</span><span className="score-digits" aria-hidden="true" ref={node}>{String(score).padStart(5, "0")}</span></>;
}
