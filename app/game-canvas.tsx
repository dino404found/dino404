"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GAME, SIGNAL, createGame, step, hazardHint, zoneAt, ZONES } from "@/lib/game";
import { makeSprites, renderGame } from "@/lib/render-game";
import { sceneColors } from "@/lib/scenery";
import type { RunTicket, RunPayload } from "@/lib/protocol";

export default function GameCanvas({ ticket, onFinish, onScore, onCancel }: {
  ticket: RunTicket;
  onFinish: (payload: RunPayload, score: number) => void;
  onScore: (score: number) => void;
  onCancel: (message: string) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null), surface = useRef<HTMLDivElement>(null), jump = useRef(false),
    duckKeys = useRef(new Set<string>()), duckPointers = useRef(new Set<number>()),
    finishRef = useRef(onFinish), scoreRef = useRef(onScore), cancelRef = useRef(onCancel);
  const [countdown, setCountdown] = useState(3), [running, setRunning] = useState(false),
    [held, setHeld] = useState(false), [hint, setHint] = useState("Jump the candles. Duck the drones."),
    [zone, setZone] = useState<string>(ZONES[0]), [light, setLight] = useState("DAY RUN"),
    [signals, setSignals] = useState(0), [signalFound, setSignalFound] = useState(false);
  const canDuck = ticket.version !== "1.0.0";
  const canSignal = ticket.version === GAME.version;
  useEffect(() => { finishRef.current = onFinish; scoreRef.current = onScore; cancelRef.current = onCancel; }, [onFinish, onScore, onCancel]);
  useEffect(() => {
    const el = canvas.current!;
    const keys = duckKeys.current, pointers = duckPointers.current;
    let raf = 0, disposed = false, finished = false, ready = false, lastHud = -1, lastCountdown = -1;
    const s = createGame(ticket.seed, ticket.version), inputs: number[] = [], ducks: number[] = [];
    const base = performance.now(), serverBase = ticket.serverNow;
    const now = () => serverBase + performance.now() - base;
    const image = new Image();
    let sprite: HTMLCanvasElement;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const clearControls = () => { jump.current = false; duckKeys.current.clear(); duckPointers.current.clear(); setHeld(false); };
    const finish = (reason: RunPayload["reason"]) => {
      if (finished || disposed) return;
      finished = true; cancelAnimationFrame(raf); clearControls(); setRunning(false); setCountdown(0);
      if (s.tick === 0) { cancelRef.current("Run cancelled before the start. You're ready to try again."); return; }
      finishRef.current({ ticks: s.tick, inputs, ducks, reason }, s.score);
    };
    clearControls();
    image.onload = () => { if (disposed) return; sprite = makeSprites(image); ready = true; renderGame(el, s, sprite, reduced); };
    image.onerror = () => finish("interrupted");
    image.src = "/assets/chromium-sprite.png";
    const maxTicks = Math.min(GAME.maxTicks, Math.floor(((ticket.closesAt - ticket.startAt) * GAME.hz) / 1000));
    const frame = () => {
      if (disposed || finished) return;
      const t = now(), count = Math.min(3, Math.max(0, Math.ceil((ticket.startAt - t) / 1000)));
      if (count !== lastCountdown) { lastCountdown = count; setCountdown(count); setRunning(count === 0); }
      if (t >= ticket.startAt) {
        if (!ready) { finish("interrupted"); return; }
        const target = Math.min(maxTicks, Math.max(0, Math.floor(((t - ticket.startAt) * GAME.hz) / 1000)));
        if (target - s.tick > 90) { finish("interrupted"); return; }
        while (s.tick < target && !s.dead) {
          const duck = canDuck && (duckKeys.current.size > 0 || duckPointers.current.size > 0);
          const wantsJump = jump.current && s.y === 0 && !duck;
          jump.current = false;
          const changed = duck !== s.duckHeld;
          if (inputs.length + ducks.length + Number(changed) + Number(wantsJump) > 6000) { finish("interrupted"); return; }
          if (wantsJump) inputs.push(s.tick);
          if (changed) ducks.push(s.tick);
          step(s, wantsJump, duck);
        }
        // Update foreground and background together with the canvas, without a second CSS fade.
        const colors = sceneColors(s.distance, s.score);
        for (const key of ["sky", "ground", "ridge"] as const) surface.current?.style.setProperty(`--scene-${key}`, colors[key]);
        surface.current?.style.setProperty("--scene-ink", colors.uiInk);
        surface.current?.style.setProperty("--scene-sky-ink", colors.ink);
        if (Math.floor(s.tick / 6) !== lastHud) {
          lastHud = Math.floor(s.tick / 6); scoreRef.current(s.score);
          setHint(hazardHint(s)); setZone(ZONES[zoneAt(s.distance)]);
          setLight(colors.darkness < 0.02 ? "DAY RUN" : colors.darkness > 0.98 ? "NIGHT RUN" : Math.floor(s.score / 1000) % 2 ? "DUSK" : "DAWN");
          setSignals(s.signals); setSignalFound(s.tick - s.lastSignalTick < SIGNAL.duration);
          setHeld(s.duckHeld);
        }
        if (s.dead) { renderGame(el, s, sprite, reduced); finish("collision"); return; }
        if (s.tick >= maxTicks) { finish(maxTicks === GAME.maxTicks ? "time-limit" : "day-end"); return; }
      }
      if (ready) renderGame(el, s, sprite, reduced);
      raf = requestAnimationFrame(frame);
    };
    const keyDown = (e: KeyboardEvent) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (target?.closest("button, a, input, textarea, select, [contenteditable=true]") &&
          !target.closest(".play-surface")) return;
      if ((e.code === "ArrowDown" || e.code === "KeyS") && canDuck) {
        e.preventDefault(); if (now() >= ticket.startAt) duckKeys.current.add(e.code);
      } else if (e.code === "Space" || e.code === "ArrowUp") {
        if (e.code === "Space" && (e.target as HTMLElement).closest?.("[data-duck-control]")) return;
        e.preventDefault(); if (!e.repeat && now() >= ticket.startAt) jump.current = true;
      }
    };
    const keyUp = (e: KeyboardEvent) => { duckKeys.current.delete(e.code); };
    const blur = () => finish("interrupted");
    const visibility = () => { if (document.hidden) blur(); };
    window.addEventListener("keydown", keyDown); window.addEventListener("keyup", keyUp);
    window.addEventListener("blur", blur); window.addEventListener("orientationchange", blur);
    document.addEventListener("visibilitychange", visibility);
    if (document.hidden) finish("interrupted");
    else raf = requestAnimationFrame(frame);
    return () => {
      disposed = true; cancelAnimationFrame(raf); jump.current = false; keys.clear(); pointers.clear();
      window.removeEventListener("keydown", keyDown); window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", blur); window.removeEventListener("orientationchange", blur);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [ticket, canDuck]);
  const releasePointer = (id: number) => { duckPointers.current.delete(id); setHeld(duckPointers.current.size > 0 || duckKeys.current.size > 0); };
  return (
    <div className="play-surface" ref={surface}>
      <div className="world-status"><span><i /> {zone}</span><span>{light}</span></div>
      {canSignal && <div className={`signal-status${signalFound ? " is-found" : ""}`}>
        <span className="signal-progress" aria-label={`${Math.min(4, signals)} of 4 relays restored`}>
          <span className="signal-grid" aria-hidden="true">{[0, 1, 2, 3].map(i => <i key={i} className={signals > i ? "is-lit" : ""} />)}</span>
          {signals >= 4 ? "WORLD ONLINE" : signals ? "RECONNECTING" : "FIND THE SIGNAL"}
        </span>
        <span role="status" aria-live="polite" aria-atomic="true">{signalFound ? "SIGNAL FOUND +20" : signals ? `${signals} GATES · +${signals * SIGNAL.bonus}` : "GATES +20"}</span>
      </div>}
      <canvas ref={canvas} className="game-canvas" tabIndex={0}
        aria-label="Runner arena. Space or Arrow Up to jump. Hold Arrow Down or S to duck; down in the air lands faster. Jump through optional signal gates for 20 bonus points."
        onPointerDown={(e) => { if (e.button !== 0) return; e.preventDefault(); if (running) jump.current = true; }} />
      {countdown > 0 && <div className="countdown-overlay" aria-live="polite">
        <span>FIND YOUR RHYTHM</span><strong key={countdown}>{countdown}</strong>
        <small>{canDuck ? "↑ Jump · Hold ↓ to duck" : "Get ready to jump."}</small>
      </div>}
      <div className="touch-controls">
        <span className="control-hint">{running ? hint : "Ready when you are."}</span>
        <div className="control-buttons">
          {canDuck && <Button type="button" data-duck-control className={`duck-button${held ? " is-held" : ""}`} disabled={!running}
            aria-label="Hold to duck" aria-pressed={held}
            onPointerDown={(e) => { if (e.button !== 0) return; e.preventDefault(); if (!running) return; e.currentTarget.setPointerCapture(e.pointerId); duckPointers.current.add(e.pointerId); setHeld(true); }}
            onPointerUp={(e) => releasePointer(e.pointerId)} onPointerCancel={(e) => releasePointer(e.pointerId)} onLostPointerCapture={(e) => releasePointer(e.pointerId)}
            onContextMenu={(e) => e.preventDefault()}
            onKeyDown={(e) => { if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); if (running) { duckKeys.current.add(e.code); setHeld(true); } } }}
            onKeyUp={(e) => { duckKeys.current.delete(e.code); setHeld(duckKeys.current.size > 0 || duckPointers.current.size > 0); }}
            onBlur={() => { duckKeys.current.delete("Space"); duckKeys.current.delete("Enter"); }}>
            <ArrowDown size={19} /> <span>Duck<small>HOLD</small></span>
          </Button>}
          <Button type="button" className="jump-button" disabled={!running} aria-label="Jump"
            onPointerDown={(e) => { if (e.button !== 0) return; e.preventDefault(); if (running) jump.current = true; }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.repeat && running) jump.current = true; }}>
            <ArrowUp size={20} /> Jump
          </Button>
        </div>
      </div>
    </div>
  );
}
