"use client";
import { useSyncExternalStore } from "react";

function subscribe(notify: () => void) {
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", notify);
  document.addEventListener("visibilitychange", notify);
  return () => {
    media.removeEventListener("change", notify);
    document.removeEventListener("visibilitychange", notify);
  };
}
const snapshot = () => !document.hidden && !matchMedia("(prefers-reduced-motion: reduce)").matches;
export function usePageMotion() { return useSyncExternalStore(subscribe, snapshot, () => false); }
