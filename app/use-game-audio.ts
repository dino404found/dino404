"use client";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { audioPreferences, DEFAULT_PREFERENCES, DinoAudio, type AudioPreferences } from "@/lib/game-audio";

const key = "dino404.experience", event = "dino404-experience-change";
const fallback = JSON.stringify(DEFAULT_PREFERENCES);
let memory: string | null = null;
function snapshot() {
  if (memory !== null) return memory;
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function subscribe(notify: () => void) {
  const storage = (e: StorageEvent) => { if (!e.key || e.key === key) { memory = null; notify(); } };
  window.addEventListener("storage", storage); window.addEventListener(event, notify);
  return () => { window.removeEventListener("storage", storage); window.removeEventListener(event, notify); };
}
function parse(raw: string) { try { return audioPreferences(JSON.parse(raw)); } catch { return DEFAULT_PREFERENCES; } }

export function useGameAudio() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => fallback);
  const preferences = useMemo(() => parse(raw), [raw]);
  const [audio] = useState(() => new DinoAudio());
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => { audio.setPreferences(preferences); }, [audio, preferences]);
  useEffect(() => {
    const stop = () => audio.silence();
    const visibility = () => { if (document.hidden) stop(); };
    window.addEventListener("blur", stop);
    document.addEventListener("visibilitychange", visibility);
    return () => { window.removeEventListener("blur", stop); document.removeEventListener("visibilitychange", visibility); audio.dispose(); };
  }, [audio]);
  const update = useCallback((patch: Partial<AudioPreferences>) => {
    const next = audioPreferences({ ...parse(snapshot()), ...patch });
    memory = JSON.stringify(next);
    try { localStorage.setItem(key, memory); } catch { /* Works for this visit without storage. */ }
    audio.setPreferences(next);
    window.dispatchEvent(new Event(event));
  }, [audio]);
  const unlock = useCallback(() => {
    // Invoke before any await so browser gesture permission is retained.
    void audio.unlock().then(ok => setUnavailable(!ok));
  }, [audio]);
  return { audio, preferences, update, unlock, unavailable };
}
