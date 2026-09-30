"use client";
import { useEffect, useRef } from "react";
import { makeSprites } from "@/lib/render-game";
import { dinoFrame, type DinoPose } from "@/lib/dino-sprites";
export default function DinoMascot() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let active = true, timer: ReturnType<typeof setTimeout> | undefined;
    let atlas: HTMLCanvasElement | undefined;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const image = new Image();
    const paint = (pose: DinoPose) => {
      if (!active || !ref.current || !atlas) return;
      const c = ref.current.getContext("2d")!;
      c.imageSmoothingEnabled = false;
      c.clearRect(0, 0, 44, 47);
      c.drawImage(dinoFrame(atlas, pose), 0, 0);
    };
    const schedule = () => {
      clearTimeout(timer); paint("idle");
      if (!active || !atlas || motion.matches || document.hidden) return;
      timer = setTimeout(() => {
        paint("blink");
        timer = setTimeout(schedule, 140);
      }, 4800);
    };
    image.onload = () => { if (active) { atlas = makeSprites(image); schedule(); } };
    document.addEventListener("visibilitychange", schedule);
    motion.addEventListener("change", schedule);
    image.src = "/assets/chromium-sprite.png";
    return () => {
      active = false;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", schedule);
      motion.removeEventListener("change", schedule);
    };
  }, []);
  return (
    <canvas
      ref={ref}
      width={44}
      height={47}
      className="mascot-canvas"
      role="img"
      aria-label="Green pixel dinosaur"
    />
  );
}
