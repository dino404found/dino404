"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GAME, createGame, step } from "@/lib/game";
import { makeSprites, renderGame } from "@/lib/render-game";
import type { RunTicket, RunPayload } from "@/lib/protocol";

export default function GameCanvas({
  ticket,
  onFinish,
  onScore,
}: {
  ticket: RunTicket;
  onFinish: (payload: RunPayload, score: number) => void;
  onScore: (score: number) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null),
    jump = useRef(false),
    finishRef = useRef(onFinish),
    scoreRef = useRef(onScore);
  const [countdown, setCountdown] = useState(3),
    [running, setRunning] = useState(false);
  useEffect(() => {
    finishRef.current = onFinish;
    scoreRef.current = onScore;
  }, [onFinish, onScore]);
  useEffect(() => {
    const el = canvas.current!;
    let raf = 0,
      disposed = false,
      finished = false,
      ready = false,
      lastHud = -1,
      lastCountdown = -1;
    const s = createGame(ticket.seed),
      inputs: number[] = [];
    const base = performance.now(),
      serverBase = ticket.serverNow;
    const now = () => serverBase + performance.now() - base;
    const image = new Image();
    let sprite: HTMLCanvasElement;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finish = (reason: RunPayload["reason"]) => {
      if (finished || disposed) return;
      finished = true;
      cancelAnimationFrame(raf);
      setRunning(false);
      setCountdown(0);
      finishRef.current(
        { ticks: Math.max(1, s.tick), inputs, reason },
        s.score,
      );
    };
    image.onload = () => {
      if (disposed) return;
      sprite = makeSprites(image);
      ready = true;
      renderGame(el, s, sprite, reduced);
    };
    image.onerror = () => finish("interrupted");
    image.src = "/assets/chromium-sprite.png";
    const maxTicks = Math.min(
      GAME.maxTicks,
      Math.floor(((ticket.closesAt - ticket.startAt) * GAME.hz) / 1000),
    );
    const frame = () => {
      if (disposed || finished) return;
      const t = now();
      const count = Math.min(
        3,
        Math.max(0, Math.ceil((ticket.startAt - t) / 1000)),
      );
      if (count !== lastCountdown) {
        lastCountdown = count;
        setCountdown(count);
        setRunning(count === 0);
      }
      if (t >= ticket.startAt) {
        if (!ready) {
          finish("interrupted");
          return;
        }
        const target = Math.min(
          maxTicks,
          Math.max(0, Math.floor(((t - ticket.startAt) * GAME.hz) / 1000)),
        );
        if (target - s.tick > 90) {
          finish("interrupted");
          return;
        }
        while (s.tick < target && !s.dead) {
          const wantsJump = jump.current && s.y === 0;
          jump.current = false;
          if (wantsJump) inputs.push(s.tick);
          step(s, wantsJump);
        }
        if (Math.floor(s.tick / 6) !== lastHud) {
          lastHud = Math.floor(s.tick / 6);
          scoreRef.current(s.score);
        }
        if (s.dead) {
          renderGame(el, s, sprite, reduced);
          finish("collision");
          return;
        }
        if (s.tick >= maxTicks) {
          finish(maxTicks === GAME.maxTicks ? "time-limit" : "day-end");
          return;
        }
      }
      if (ready) renderGame(el, s, sprite, reduced);
      raf = requestAnimationFrame(frame);
    };
    const key = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        if (!e.repeat && now() >= ticket.startAt) jump.current = true;
      }
    };
    const blur = () => {
      if (now() >= ticket.startAt) finish("interrupted");
    };
    const visibility = () => {
      if (document.hidden) blur();
    };
    window.addEventListener("keydown", key);
    window.addEventListener("blur", blur);
    window.addEventListener("orientationchange", blur);
    document.addEventListener("visibilitychange", visibility);
    raf = requestAnimationFrame(frame);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", key);
      window.removeEventListener("blur", blur);
      window.removeEventListener("orientationchange", blur);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [ticket]);
  return (
    <div className="play-surface">
      <canvas
        ref={canvas}
        className="game-canvas"
        tabIndex={0}
        aria-label="Runner arena. Press Space, Arrow Up, or tap to jump."
        onPointerDown={(e) => {
          e.preventDefault();
          if (running) jump.current = true;
        }}
      />
      {countdown > 0 && (
        <div className="countdown-overlay" aria-live="polite">
          <span>FIND YOUR RHYTHM</span>
          <strong key={countdown}>{countdown}</strong>
          <small>Get ready to jump.</small>
        </div>
      )}
      <div className="touch-controls">
        <span>
          {running
            ? "Clear the candles. Keep your momentum."
            : "One button. Your best run."}
        </span>
        <Button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            if (running) jump.current = true;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && running) jump.current = true;
          }}
          className="jump-button"
          disabled={!running}
          aria-label="Jump"
        >
          <ArrowUp size={20} /> Jump
        </Button>
      </div>
    </div>
  );
}
