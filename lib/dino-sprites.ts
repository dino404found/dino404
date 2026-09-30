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
  cache[pose] = frame;
  return frame;
}
