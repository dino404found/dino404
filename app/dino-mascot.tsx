"use client";
import { useEffect, useRef } from "react";
import { makeSprites } from "@/lib/render-game";
export default function DinoMascot() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let active = true;
    const image = new Image();
    image.onload = () => {
      if (!active || !ref.current) return;
      const c = ref.current.getContext("2d")!;
      c.imageSmoothingEnabled = false;
      c.clearRect(0, 0, 44, 47);
      c.drawImage(makeSprites(image), 848, 2, 44, 47, 0, 0, 44, 47);
    };
    image.src = "/assets/chromium-sprite.png";
    return () => {
      active = false;
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
