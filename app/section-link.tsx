"use client";
import { useEffect, type AnchorHTMLAttributes } from "react";

function cleanAddress() {
  if (location.href.includes("#")) history.replaceState(history.state, "", location.pathname + location.search);
}
export function useCleanAddress() {
  useEffect(() => {
    const clean = () => {
      const target = location.hash.slice(1);
      if (["main", "leaderboard", "rewards", "rules"].includes(target)) document.getElementById(target)?.scrollIntoView({ behavior: "instant" });
      cleanAddress();
    };
    clean(); window.addEventListener("hashchange", clean);
    return () => window.removeEventListener("hashchange", clean);
  }, []);
}

export default function SectionLink({ targetId, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { targetId: string }) {
  return <a {...props} href={targetId === "top" ? "/" : `#${targetId}`} onClick={event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = document.getElementById(targetId);
    if (!target) return;
    event.preventDefault();
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "start" });
    if (event.detail === 0 || props.className === "skip-link") {
      target.setAttribute("tabindex", "-1"); target.focus({ preventScroll: true });
    }
    cleanAddress();
  }}>{children}</a>;
}
