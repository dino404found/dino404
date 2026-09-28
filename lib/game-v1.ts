/** Deterministic 60 Hz simulation shared by browser and validator. */
export const GAME = Object.freeze({
  version: "1.0.0",
  hz: 60,
  width: 640,
  height: 240,
  ground: 184,
  dinoX: 60,
  dinoW: 44,
  dinoH: 47,
  gravity: 0.61,
  jump: -11.8,
  initialSpeed: 5,
  maxSpeed: 9,
  maxTicks: 108000,
});
export type Obstacle = {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: "candle" | "low" | "high";
  group: number;
};
export type GameState = {
  tick: number;
  distance: number;
  score: number;
  scoreTick: number;
  y: number;
  vy: number;
  dead: boolean;
  obstacles: Obstacle[];
  rng: number;
  next: number;
  count: number;
  speed: number;
};
export function createGame(seed: number): GameState {
  return {
    tick: 0,
    distance: 0,
    score: 0,
    scoreTick: 0,
    y: 0,
    vy: 0,
    dead: false,
    obstacles: [],
    rng: seed >>> 0 || 1,
    next: 150,
    count: 0,
    speed: GAME.initialSpeed,
  };
}
function random(s: GameState) {
  s.rng ^= s.rng << 13;
  s.rng ^= s.rng >>> 17;
  s.rng ^= s.rng << 5;
  return (s.rng >>> 0) / 4294967296;
}
export function step(s: GameState, jump = false): void {
  if (s.dead || s.tick >= GAME.maxTicks) return;
  if (jump && s.y === 0) s.vy = GAME.jump;
  s.y += s.vy;
  s.vy += GAME.gravity;
  if (s.y > 0) {
    s.y = 0;
    s.vy = 0;
  }
  s.tick++;
  s.speed = Math.min(GAME.maxSpeed, GAME.initialSpeed + s.tick / 9000);
  s.distance += s.speed;
  const score = Math.floor(s.distance / 12);
  if (score !== s.score) {
    s.score = score;
    s.scoreTick = s.tick;
  }
  if (s.tick >= s.next) {
    const r = random(s),
      drone = s.tick > 2400 && r > 0.72;
    const kind = drone ? (r > 0.86 ? "high" : "low") : "candle";
    const group = !drone && s.tick > 900 && random(s) > 0.65 ? 2 : 1;
    const h = drone ? 24 : 32 + Math.floor(random(s) * 12);
    s.obstacles.push({
      id: ++s.count,
      x: GAME.width + 40,
      y:
        kind === "high"
          ? GAME.ground - 109
          : kind === "low"
            ? GAME.ground - 38
            : GAME.ground - h,
      w: drone ? 42 : group === 2 ? 44 : 22,
      h,
      kind,
      group,
    });
    s.next = s.tick + 100 + Math.floor(random(s) * 65);
  }
  for (const o of s.obstacles) o.x -= s.speed;
  s.obstacles = s.obstacles.filter((o) => o.x + o.w > -30);
  const d = {
    x: GAME.dinoX + 9,
    y: GAME.ground - GAME.dinoH + s.y + 5,
    w: 29,
    h: 38,
  };
  for (const o of s.obstacles) {
    if (
      d.x < o.x + o.w - 2 &&
      d.x + d.w > o.x + 2 &&
      d.y < o.y + o.h - 2 &&
      d.y + d.h > o.y + 2
    )
      s.dead = true;
  }
}
export function replay(seed: number, ticks: number, inputs: number[]) {
  if (!Number.isSafeInteger(ticks) || ticks < 1 || ticks > GAME.maxTicks)
    throw new Error("Invalid run duration.");
  if (!Array.isArray(inputs) || inputs.length > 6000)
    throw new Error("Invalid input log.");
  let last = -1;
  for (const t of inputs) {
    if (!Number.isSafeInteger(t) || t <= last || t < 0 || t >= ticks)
      throw new Error("Invalid input sequence.");
    last = t;
  }
  const s = createGame(seed);
  let i = 0;
  while (s.tick < ticks && !s.dead) {
    const jump = inputs[i] === s.tick;
    if (jump) i++;
    step(s, jump);
  }
  if (s.tick !== ticks) throw new Error("Run continued after a collision.");
  return s;
}
