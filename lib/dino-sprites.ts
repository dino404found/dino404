/** Chromium's original frame positions. Each frame is isolated before scaling. */
export const DINO_FRAMES = {
  idle: { offset: 0, width: 44 },
  blink: { offset: 44, width: 44 },
  runLeft: { offset: 88, width: 44 },
  runRight: { offset: 132, width: 44 },
  crashed: { offset: 220, width: 44 },
  duckLeft: { offset: 264, width: 59 },
  duckRight: { offset: 323, width: 59 },
} as const;
export type DinoPose = keyof typeof DINO_FRAMES;
const frames = new WeakMap<HTMLCanvasElement, Partial<Record<DinoPose, HTMLCanvasElement>>>();

export function dinoFrame(atlas: HTMLCanvasElement, pose: DinoPose) {
  let cache = frames.get(atlas);
  if (!cache) { cache = {}; frames.set(atlas, cache); }
  const cached = cache[pose];
  if (cached) return cached;
  const { offset, width } = DINO_FRAMES[pose];
  const frame = document.createElement("canvas"); frame.width = width; frame.height = 47;
  // Copy exact pixels. Sampling/shadows can otherwise bleed from the next frame.
  frame.getContext("2d")!.putImageData(atlas.getContext("2d")!.getImageData(848 + offset, 2, width, 47), 0, 0);
  drawSignalBadge(frame.getContext("2d")!, 0, 0, pose);
  cache[pose] = frame;
  return frame;
}

/** Four pixels of signal: the same little badge on every dinosaur pose. */
export function drawSignalBadge(c: CanvasRenderingContext2D, x: number, y: number, pose: DinoPose, powered = false) {
  const duck = pose === "duckLeft" || pose === "duckRight";
  const xx = x + (duck ? 25 : 21), yy = y + (duck ? 29 : 23);
  c.fillStyle = "#18392d"; c.fillRect(xx, yy, 7, 7);
  c.fillStyle = powered ? "#f1ffd2" : "#b8d58b";
  for (let i = 0; i < 4; i++) c.fillRect(xx + 1 + (i % 2) * 3, yy + 1 + Math.floor(i / 2) * 3, 2, 2);
}
